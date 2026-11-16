"""
Business workflows and atomic operations for Candy Loz Orders.
"""

from decimal import Decimal
from typing import Dict, Any, List, Optional, Tuple
from django.db import transaction
from django.utils import timezone
from rest_framework import status

from apps.common.exceptions import BusinessLogicError
from apps.common.validators import normalize_palestinian_phone
from apps.catalog.models import Product, ProductWeightOption
from apps.delivery.models import DeliveryZone
from apps.orders.models import (
    Order,
    OrderItem,
    OrderStatusHistory,
    OrderSequence,
    STATUS_NEW,
    STATUS_CANCELLED,
    STATUS_UNDELIVERED,
    PAYMENT_CASH_ON_DELIVERY,
)
from apps.orders.policies import can_transition_order_status


import time
from django.db import OperationalError


def generate_next_order_number(max_retries: int = 10) -> str:
    """
    Generate the next atomic order number in format CL-YYYY-NNNN.
    Uses select_for_update() on OrderSequence row to prevent race conditions.
    Includes busy-lock retry handling for SQLite / high concurrency.
    """
    current_year = timezone.now().year
    for attempt in range(max_retries):
        try:
            with transaction.atomic():
                seq, _ = OrderSequence.objects.select_for_update().get_or_create(
                    year=current_year,
                    defaults={'last_number': 0}
                )
                seq.last_number += 1
                seq.save(update_fields=['last_number'])
                return f"CL-{current_year}-{seq.last_number:04d}"
        except OperationalError as exc:
            if "locked" in str(exc).lower() and attempt < max_retries - 1:
                time.sleep(0.05 * (attempt + 1))
                continue
            raise


@transaction.atomic
def create_guest_order(
    *,
    customer_name: str,
    customer_phone: str,
    zone_id: str,
    street_address: str,
    building_or_apt: str = '',
    notes: str = '',
    items_data: List[Dict[str, Any]],
    idempotency_key: Optional[str] = None,
) -> Tuple[Order, bool]:
    """
    Atomic guest checkout service.
    Returns (order, created: bool).
    If idempotency_key is already present, returns existing order without re-creating.
    """
    if idempotency_key:
        existing_order = Order.objects.filter(idempotency_key=idempotency_key).first()
        if existing_order:
            return existing_order, False

    if not items_data:
        raise BusinessLogicError(
            message="لا يمكن إنشاء طلب بدون عناصر",
            code="EMPTY_ORDER_ITEMS",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Validate Palestinian phone
    normalized_phone = normalize_palestinian_phone(customer_phone)

    # Validate Delivery Zone
    try:
        zone = DeliveryZone.objects.get(id=zone_id, is_active=True)
    except DeliveryZone.DoesNotExist:
        raise BusinessLogicError(
            message="منطقة التوصيل المحددة غير صالحة أو غير مفعلة",
            code="INVALID_DELIVERY_ZONE",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    order_number = generate_next_order_number()

    # Pre-validate and freeze products and weight options
    product_ids = [item['product_id'] for item in items_data]
    products = {p.id: p for p in Product.objects.filter(id__in=product_ids)}

    line_items_to_create = []
    subtotal = Decimal('0.00')

    for item in items_data:
        prod_id = item.get('product_id')
        qty = int(item.get('quantity', 1))
        if qty <= 0:
            raise BusinessLogicError(
                message="كمية المنتج يجب أن تكون 1 على الأقل",
                code="INVALID_QUANTITY",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        product = products.get(prod_id)
        if not product or product.is_archived:
            raise BusinessLogicError(
                message=f"المنتج المطلوب غير موجود أو تم حذفه",
                code="PRODUCT_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        if not product.is_available:
            raise BusinessLogicError(
                message=f"المنتج '{product.name}' غير متاح حالياً بالمطبخ",
                code="PRODUCT_NOT_AVAILABLE",
                status_code=422,
            )

        weight_option_id = item.get('weight_option_id')
        weight_multiplier = None
        weight_label = ''
        unit_price = product.price

        if weight_option_id:
            try:
                w_opt = ProductWeightOption.objects.get(id=weight_option_id, product=product)
                weight_multiplier = w_opt.multiplier
                weight_label = w_opt.label
                unit_price = w_opt.price
            except ProductWeightOption.DoesNotExist:
                raise BusinessLogicError(
                    message="خيار الوزن المحدد غير صالح للمنتج",
                    code="INVALID_WEIGHT_OPTION",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

        packaging_label = item.get('packaging_label', '') or ''
        packaging_fee = Decimal(str(item.get('packaging_fee', '0.00') or '0.00'))

        line_total = (unit_price * qty) + (packaging_fee * qty)
        subtotal += line_total

        line_items_to_create.append({
            'product': product,
            'product_name': product.name,
            'product_slug': product.slug,
            'product_image_url': product.image_url or '',
            'unit': product.unit,
            'weight_multiplier': weight_multiplier,
            'weight_label': weight_label,
            'packaging_label': packaging_label,
            'packaging_fee': packaging_fee,
            'unit_price': unit_price,
            'quantity': qty,
            'line_total': line_total,
        })

    # Validate Minimum Order Amount
    if subtotal < zone.min_order_amount:
        raise BusinessLogicError(
            message=f"الحد الأدنى للطلب في منطقة '{zone.name}' هو {zone.min_order_amount} ₪",
            code="MIN_ORDER_AMOUNT_NOT_MET",
            status_code=422,
        )

    delivery_fee = zone.delivery_fee
    total = subtotal + delivery_fee

    order = Order.objects.create(
        order_number=order_number,
        status=STATUS_NEW,
        payment_method=PAYMENT_CASH_ON_DELIVERY,
        customer_name=customer_name.strip(),
        customer_phone=normalized_phone,
        zone=zone,
        street_address=street_address.strip(),
        building_or_apt=building_or_apt.strip(),
        notes=notes.strip(),
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=total,
        idempotency_key=idempotency_key,
    )

    for item_dict in line_items_to_create:
        OrderItem.objects.create(
            order=order,
            **item_dict,
        )

    OrderStatusHistory.objects.create(
        order=order,
        from_status=None,
        to_status=STATUS_NEW,
        note="إنشاء الطلب كزائر (Guest Checkout)",
    )

    return order, True


def update_order_status(
    *,
    order_id: str,
    target_status: str,
    actor,
    reason: Optional[str] = None,
    note: str = '',
    max_retries: int = 10,
) -> Order:
    """
    Update order status enforcing state machine policies and concurrency locks.
    Includes busy-lock retry handling for SQLite / high concurrency.
    """
    for attempt in range(max_retries):
        try:
            with transaction.atomic():
                try:
                    order = Order.objects.select_for_update().get(id=order_id)
                except Order.DoesNotExist:
                    raise BusinessLogicError(
                        message="الطلب غير موجود",
                        code="ORDER_NOT_FOUND",
                        status_code=status.HTTP_404_NOT_FOUND,
                    )

                can_transition_order_status(
                    actor=actor,
                    current_status=order.status,
                    target_status=target_status,
                    reason=reason,
                )

                old_status = order.status
                order.status = target_status
                if target_status in (STATUS_CANCELLED, STATUS_UNDELIVERED):
                    order.cancel_reason = (reason or '').strip()

                order.save()

                OrderStatusHistory.objects.create(
                    order=order,
                    performed_by_user=actor,
                    from_status=old_status,
                    to_status=target_status,
                    reason=(reason or '').strip(),
                    note=note.strip(),
                )

                return order
        except OperationalError as exc:
            if "locked" in str(exc).lower() and attempt < max_retries - 1:
                time.sleep(0.05 * (attempt + 1))
                continue
            raise
