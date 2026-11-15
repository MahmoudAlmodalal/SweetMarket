from django.db.models import QuerySet
from apps.delivery.models import DeliveryZone


def list_active_delivery_zones() -> QuerySet[DeliveryZone]:
    """
    Retrieve all currently active delivery zones ordered alphabetically by name.
    Used for storefront public customer queries and cart calculations.
    """
    return DeliveryZone.objects.filter(is_active=True).order_by('name')


def list_all_delivery_zones() -> QuerySet[DeliveryZone]:
    """
    Retrieve all delivery zones (both active and inactive) ordered by name.
    Used for staff and manager operational management console.
    """
    return DeliveryZone.objects.all().order_by('name')


def get_delivery_zone_by_id(zone_id: str) -> DeliveryZone:
    """
    Retrieve a single delivery zone by its unique prefixed identifier.
    Raises DeliveryZone.DoesNotExist if not found.
    """
    return DeliveryZone.objects.get(id=zone_id)
