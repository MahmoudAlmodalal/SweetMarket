from decimal import Decimal
from typing import Optional
from django.db import transaction
from apps.delivery.models import DeliveryZone


@transaction.atomic
def create_delivery_zone(
    *,
    name: str,
    delivery_fee: Decimal = Decimal('0.00'),
    min_order_amount: Decimal = Decimal('0.00'),
    estimated_time_min: int,
    estimated_time_max: int,
    is_active: bool = True,
) -> DeliveryZone:
    """
    Atomic domain service to create and persist a new DeliveryZone entity.
    """
    zone = DeliveryZone(
        name=name,
        delivery_fee=delivery_fee,
        min_order_amount=min_order_amount,
        estimated_time_min=estimated_time_min,
        estimated_time_max=estimated_time_max,
        is_active=is_active,
    )
    zone.save()
    return zone


@transaction.atomic
def update_delivery_zone(
    zone: DeliveryZone,
    *,
    name: Optional[str] = None,
    delivery_fee: Optional[Decimal] = None,
    min_order_amount: Optional[Decimal] = None,
    estimated_time_min: Optional[int] = None,
    estimated_time_max: Optional[int] = None,
    is_active: Optional[bool] = None,
) -> DeliveryZone:
    """
    Atomic domain service to modify an existing DeliveryZone entity.
    """
    if name is not None:
        zone.name = name
    if delivery_fee is not None:
        zone.delivery_fee = delivery_fee
    if min_order_amount is not None:
        zone.min_order_amount = min_order_amount
    if estimated_time_min is not None:
        zone.estimated_time_min = estimated_time_min
    if estimated_time_max is not None:
        zone.estimated_time_max = estimated_time_max
    if is_active is not None:
        zone.is_active = is_active

    zone.save()
    return zone
