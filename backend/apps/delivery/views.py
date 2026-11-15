from rest_framework import exceptions, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.delivery.models import DeliveryZone
from apps.delivery.permissions import IsManager, IsStaffOrManager
from apps.delivery.selectors import (
    get_delivery_zone_by_id,
    list_active_delivery_zones,
    list_all_delivery_zones,
)
from apps.delivery.serializers import (
    DeliveryZoneCreateUpdateSerializer,
    DeliveryZoneSerializer,
)
from apps.delivery.services import create_delivery_zone, update_delivery_zone


class StorefrontDeliveryZoneListView(APIView):
    """
    Public storefront endpoint exposing all active delivery zones.
    GET /api/v1/delivery-zones
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        zones = list_active_delivery_zones()
        serializer = DeliveryZoneSerializer(zones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminDeliveryZoneListView(APIView):
    """
    Administrative delivery zones collection endpoint.
    GET /api/v1/admin/delivery-zones (Staff or Manager)
    POST /api/v1/admin/delivery-zones (Manager only)
    """
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsStaffOrManager()]
        return [IsManager()]

    def get(self, request):
        zones = list_all_delivery_zones()
        serializer = DeliveryZoneSerializer(zones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DeliveryZoneCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        zone = create_delivery_zone(**serializer.validated_data)
        output_serializer = DeliveryZoneSerializer(zone)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class AdminDeliveryZoneDetailView(APIView):
    """
    Administrative single delivery zone mutation endpoint.
    PUT /api/v1/admin/delivery-zones/<id> (Manager only)
    PATCH /api/v1/admin/delivery-zones/<id> (Manager only)
    """
    permission_classes = [IsManager]

    def get_object(self, zone_id: str) -> DeliveryZone:
        try:
            return get_delivery_zone_by_id(zone_id)
        except DeliveryZone.DoesNotExist:
            raise exceptions.NotFound(f"منطقة التوصيل بالمعرف '{zone_id}' غير موجودة.")

    def put(self, request, id: str):
        zone = self.get_object(id)
        serializer = DeliveryZoneCreateUpdateSerializer(
            instance=zone,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        updated_zone = update_delivery_zone(zone, **serializer.validated_data)
        output_serializer = DeliveryZoneSerializer(updated_zone)
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, id: str):
        return self.put(request, id)
