"""
T-55: 7-Stage Lifecycle Sample Orders, Item Snapshots & Audit Timeline Seeder
Seeds sample orders across all 7 states for Candy Loz.
"""

from decimal import Decimal
from typing import Any, Dict, List, Optional
from django.utils import timezone
from apps.accounts.models import AdminUser
from apps.catalog.models import Product
from apps.delivery.models import DeliveryZone
from apps.orders.models import (
    Order,
    OrderItem,
    OrderStatusHistory,
    OrderSequence,
    STATUS_NEW,
    STATUS_ACCEPTED,
    STATUS_IN_PREPARATION,
    STATUS_OUT_FOR_DELIVERY,
    STATUS_DELIVERED,
    STATUS_UNDELIVERED,
    STATUS_CANCELLED,
    PAYMENT_CASH_ON_DELIVERY,
)


def seed_orders() -> Dict[str, int]:
    """
    Seed 7 realistic sample orders spanning all state machine stages.
    Returns counts dict:
      {
        'orders_created': int,
        'orders_skipped': int,
        'items_created': int,
        'history_created': int,
      }
    """
    admin_user = AdminUser.objects.filter(role=AdminUser.ROLE_MANAGER).first()
    staff_user = AdminUser.objects.filter(role=AdminUser.ROLE_STAFF).first() or admin_user

    # Fetch zones by substring or first available
    def get_zone(query: str) -> Optional[DeliveryZone]:
        return DeliveryZone.objects.filter(name__icontains=query).first() or DeliveryZone.objects.first()

    zone_gaza = get_zone("غزة")
    zone_middle = get_zone("الوسطى") or zone_gaza
    zone_khan = get_zone("يونس") or zone_gaza
    zone_north = get_zone("شمال") or zone_gaza
    zone_rafah = get_zone("رفح") or zone_gaza
    zone_tel_hawa = get_zone("الهوا") or zone_gaza

    # Fetch sample products
    products = list(Product.objects.filter(is_available=True)[:6])
    if not products:
        products = list(Product.objects.all()[:6])

    p1 = products[0] if len(products) > 0 else None
    p2 = products[1] if len(products) > 1 else p1
    p3 = products[2] if len(products) > 2 else p1

    orders_data: List[Dict[str, Any]] = [
        {
            "order_number": "CL-2026-1001",
            "status": STATUS_NEW,
            "customer_name": "أحمد محمود السقا",
            "customer_phone": "0599123456",
            "zone": zone_gaza,
            "street_address": "شارع عمر المختار - بجوار بنك فلسطين",
            "building_or_apt": "عمارة السقا - الطابق الثالث - شقة 6",
            "notes": "يرجى التوصيل ساخناً قبل صلاة العصر إن أمكن",
            "cancel_reason": "",
            "items": [
                {
                    "product": p1,
                    "quantity": 1,
                    "weight_multiplier": Decimal("1.00"),
                    "weight_label": "كيلو كامل (1000 جم)",
                },
                {
                    "product": p2,
                    "quantity": 2,
                    "weight_multiplier": Decimal("0.50"),
                    "weight_label": "صحن صغير (نصف كيلو)",
                },
            ],
            "timeline": [
                (None, STATUS_NEW, "تم استلام الطلب وبانتظار المراجعة", None, ""),
            ],
        },
        {
            "order_number": "CL-2026-1002",
            "status": STATUS_ACCEPTED,
            "customer_name": "فاطمة إبراهيم خليل",
            "customer_phone": "0599876543",
            "zone": zone_middle,
            "street_address": "دير البلح - شارع النخيل",
            "building_or_apt": "منزل عائلة خليل",
            "notes": "الاتصال عند بوابة الشارع",
            "cancel_reason": "",
            "items": [
                {
                    "product": p2,
                    "quantity": 1,
                    "weight_multiplier": Decimal("1.00"),
                    "weight_label": "كيلو كامل",
                },
            ],
            "timeline": [
                (None, STATUS_NEW, "تم استلام الطلب بنجاح", None, ""),
                (STATUS_NEW, STATUS_ACCEPTED, "تم قبول الطلب وجدولة التجهيز بالمطبخ", staff_user, ""),
            ],
        },
        {
            "order_number": "CL-2026-1003",
            "status": STATUS_IN_PREPARATION,
            "customer_name": "سعيد عبد الرحمن عواد",
            "customer_phone": "0569112233",
            "zone": zone_gaza,
            "street_address": "حي الرمال - شارع الشهداء",
            "building_or_apt": "برج الجوهرة - الطابق 5",
            "notes": "تغليف مخصص للإهداء مع بطاقة تهنئة",
            "cancel_reason": "",
            "items": [
                {
                    "product": p1,
                    "quantity": 2,
                    "weight_multiplier": Decimal("1.00"),
                    "weight_label": "صينية مشكلة 1 كجم",
                },
                {
                    "product": p3,
                    "quantity": 1,
                    "weight_multiplier": Decimal("1.00"),
                    "weight_label": "قالب كيك وسط",
                },
            ],
            "timeline": [
                (None, STATUS_NEW, "تم إنشاء الطلب كزائر", None, ""),
                (STATUS_NEW, STATUS_ACCEPTED, "تمت مراجعة الطلب والموافقة عليه", staff_user, ""),
                (STATUS_ACCEPTED, STATUS_IN_PREPARATION, "بدء تجهيز الطلب في المطبخ الشرقي", staff_user, ""),
            ],
        },
        {
            "order_number": "CL-2026-1004",
            "status": STATUS_OUT_FOR_DELIVERY,
            "customer_name": "مريم يوسف حسونة",
            "customer_phone": "0599334455",
            "zone": zone_khan,
            "street_address": "شارع جلال - بالقرب من القلعة",
            "building_or_apt": "عمارة حسونة - الطابق الأرضي",
            "notes": "الدفع بمبلغ 200 شيكل نقداً بحاجة لفكّة",
            "cancel_reason": "",
            "items": [
                {
                    "product": p2,
                    "quantity": 1,
                    "weight_multiplier": Decimal("1.00"),
                    "weight_label": "1 كجم فاخر",
                },
            ],
            "timeline": [
                (None, STATUS_NEW, "تم إنشاء الطلب", None, ""),
                (STATUS_NEW, STATUS_ACCEPTED, "تم قبول الطلب", staff_user, ""),
                (STATUS_ACCEPTED, STATUS_IN_PREPARATION, "تم إعداد الحلويات وتغليفها حرارياً", staff_user, ""),
                (STATUS_IN_PREPARATION, STATUS_OUT_FOR_DELIVERY, "استلم مندوب التوصيل الطلب وتوجه للعنوان", staff_user, ""),
            ],
        },
        {
            "order_number": "CL-2026-1005",
            "status": STATUS_DELIVERED,
            "customer_name": "خالد كمال الغصين",
            "customer_phone": "0568778899",
            "zone": zone_tel_hawa,
            "street_address": "تل الهوا - خلف الهلال الأحمر",
            "building_or_apt": "فيلا الغصين",
            "notes": "تم التسليم بنجاح",
            "cancel_reason": "",
            "items": [
                {
                    "product": p1,
                    "quantity": 1,
                    "weight_multiplier": Decimal("2.00"),
                    "weight_label": "صينية عائلية 2 كجم",
                },
            ],
            "timeline": [
                (None, STATUS_NEW, "تم إنشاء الطلب", None, ""),
                (STATUS_NEW, STATUS_ACCEPTED, "تم قبول الطلب", staff_user, ""),
                (STATUS_ACCEPTED, STATUS_IN_PREPARATION, "اكتمال تجهيز الصينية", staff_user, ""),
                (STATUS_IN_PREPARATION, STATUS_OUT_FOR_DELIVERY, "خرج للتوصيل مع السائق", staff_user, ""),
                (STATUS_OUT_FOR_DELIVERY, STATUS_DELIVERED, "تم تسليم الطلب للزبون واستلام المبلغ نقداً", staff_user, ""),
            ],
        },
        {
            "order_number": "CL-2026-1006",
            "status": STATUS_UNDELIVERED,
            "customer_name": "ياسر حسن طه",
            "customer_phone": "0599556677",
            "zone": zone_north,
            "street_address": "جباليا البلد - شارع الفالوجا",
            "building_or_apt": "بجوار مسجد العودة",
            "notes": "محاولة توصيل متعذرة",
            "cancel_reason": "الزبون لا يجيب على الهاتف بعد 4 محاولات اتصال متكررة من المندوب",
            "items": [
                {
                    "product": p3,
                    "quantity": 1,
                    "weight_multiplier": Decimal("1.00"),
                    "weight_label": "قالب شوكولاتة وسط",
                },
            ],
            "timeline": [
                (None, STATUS_NEW, "تم إنشاء الطلب", None, ""),
                (STATUS_NEW, STATUS_ACCEPTED, "تم قبول الطلب", staff_user, ""),
                (STATUS_ACCEPTED, STATUS_IN_PREPARATION, "تجهيز الطلب", staff_user, ""),
                (STATUS_IN_PREPARATION, STATUS_OUT_FOR_DELIVERY, "خرج للتوصيل", staff_user, ""),
                (
                    STATUS_OUT_FOR_DELIVERY,
                    STATUS_UNDELIVERED,
                    "تعذر التسليم لعدم استجابة الزبون هاتفياً",
                    admin_user,
                    "الزبون لا يجيب على الهاتف بعد 4 محاولات اتصال متكررة من المندوب",
                ),
            ],
        },
        {
            "order_number": "CL-2026-1007",
            "status": STATUS_CANCELLED,
            "customer_name": "هدى سليم النجار",
            "customer_phone": "0599667788",
            "zone": zone_rafah,
            "street_address": "حي الجنينة - شارع البحر",
            "building_or_apt": "عمارة النجار - شقة 2",
            "notes": "إلغاء الطلب هاتفياً",
            "cancel_reason": "اتصلت الزبونة وطلبت إلغاء الطلب لظرف عائلي طارئ قبل بدء التجهيز",
            "items": [
                {
                    "product": p1,
                    "quantity": 1,
                    "weight_multiplier": Decimal("1.00"),
                    "weight_label": "صينية معمول فاخر",
                },
            ],
            "timeline": [
                (None, STATUS_NEW, "تم استلام الطلب", None, ""),
                (
                    STATUS_NEW,
                    STATUS_CANCELLED,
                    "إلغاء إداري بطلب من الزبون هاتفياً",
                    admin_user,
                    "اتصلت الزبونة وطلبت إلغاء الطلب لظرف عائلي طارئ قبل بدء التجهيز",
                ),
            ],
        },
    ]

    orders_created = 0
    orders_skipped = 0
    items_created = 0
    history_created = 0

    for od in orders_data:
        order_num = od["order_number"]
        existing = Order.objects.filter(order_number=order_num).first()
        if existing:
            orders_skipped += 1
            continue

        zone = od["zone"]
        delivery_fee = zone.delivery_fee if zone else Decimal("10.00")

        # Compute items and subtotal
        subtotal = Decimal("0.00")
        item_objects_to_create = []

        for item_spec in od["items"]:
            prod = item_spec["product"]
            if prod:
                unit_price = prod.sale_price if prod.sale_price else prod.price
                prod_name = prod.name
                prod_slug = prod.slug
                prod_img = prod.image_url
                prod_unit = prod.unit
            else:
                unit_price = Decimal("50.00")
                prod_name = "صنف حلويات مشكل"
                prod_slug = "assorted-sweets"
                prod_img = "/products/sample.png"
                prod_unit = "kg"

            qty = item_spec["quantity"]
            weight_mult = item_spec["weight_multiplier"]
            line_total = (unit_price * weight_mult * qty).quantize(Decimal("0.01"))
            subtotal += line_total

            item_objects_to_create.append(
                {
                    "product": prod,
                    "product_name": prod_name,
                    "product_slug": prod_slug,
                    "product_image_url": prod_img,
                    "unit": prod_unit,
                    "weight_multiplier": weight_mult,
                    "weight_label": item_spec["weight_label"],
                    "unit_price": unit_price,
                    "quantity": qty,
                    "line_total": line_total,
                }
            )

        total = subtotal + delivery_fee

        order = Order.objects.create(
            order_number=order_num,
            status=od["status"],
            payment_method=PAYMENT_CASH_ON_DELIVERY,
            customer_name=od["customer_name"],
            customer_phone=od["customer_phone"],
            zone=zone,
            street_address=od["street_address"],
            building_or_apt=od["building_or_apt"],
            notes=od["notes"],
            cancel_reason=od["cancel_reason"],
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            total=total,
        )
        orders_created += 1

        for itm in item_objects_to_create:
            if itm["product"]:
                OrderItem.objects.create(
                    order=order,
                    product=itm["product"],
                    product_name=itm["product_name"],
                    product_slug=itm["product_slug"],
                    product_image_url=itm["product_image_url"],
                    unit=itm["unit"],
                    weight_multiplier=itm["weight_multiplier"],
                    weight_label=itm["weight_label"],
                    unit_price=itm["unit_price"],
                    quantity=itm["quantity"],
                    line_total=itm["line_total"],
                )
                items_created += 1

        for tl in od["timeline"]:
            from_st, to_st, note, actor, reason = tl
            OrderStatusHistory.objects.create(
                order=order,
                from_status=from_st,
                to_status=to_st,
                note=note,
                performed_by_user=actor,
                reason=reason,
            )
            history_created += 1

    # Synchronize OrderSequence for 2026
    current_year = timezone.now().year
    # Highest seeded number is 1007
    max_seeded = 1007
    seq_obj, _ = OrderSequence.objects.get_or_create(year=current_year, defaults={"last_number": max_seeded})
    if seq_obj.last_number < max_seeded:
        seq_obj.last_number = max_seeded
        seq_obj.save(update_fields=["last_number"])

    return {
        "orders_created": orders_created,
        "orders_skipped": orders_skipped,
        "items_created": items_created,
        "history_created": history_created,
    }
