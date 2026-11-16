"""
Optimized read-only queries for Candy Loz Orders.
"""

from typing import Optional
from django.db.models import QuerySet, Q
from apps.common.validators import normalize_palestinian_phone
from apps.orders.models import Order


def get_order_for_tracking(order_number: str, phone: str) -> Optional[Order]:
    """
    Secure customer tracking selector. Matches case-insensitive order number
    and normalized Palestinian phone number.
    Eagerly loads delivery zone, items, and timeline for zero N+1 queries.
    """
    if not order_number or not phone:
        return None

    try:
        normalized_phone = normalize_palestinian_phone(phone)
    except Exception:
        return None

    clean_order_number = order_number.strip()

    return (
        Order.objects.filter(
            order_number__iexact=clean_order_number,
            customer_phone=normalized_phone,
        )
        .select_related('zone')
        .prefetch_related('items', 'timeline__performed_by_user')
        .first()
    )


def list_admin_orders(
    *,
    status: Optional[str] = None,
    zone_id: Optional[str] = None,
    search: Optional[str] = None,
) -> QuerySet[Order]:
    """
    Administrative orders listing selector with filtering and eager loading.
    """
    qs = Order.objects.select_related('zone').all().order_by('-created_at')

    if status:
        qs = qs.filter(status=status)

    if zone_id:
        qs = qs.filter(zone_id=zone_id)

    if search:
        search_term = search.strip()
        qs = qs.filter(
            Q(order_number__icontains=search_term)
            | Q(customer_name__icontains=search_term)
            | Q(customer_phone__icontains=search_term)
        )

    return qs


def get_admin_order_detail(order_id: str) -> Optional[Order]:
    """
    Administrative order detail selector with complete eager loading.
    """
    return (
        Order.objects.filter(id=order_id)
        .select_related('zone')
        .prefetch_related('items', 'timeline__performed_by_user')
        .first()
    )
