"""
Django REST Framework serializers for Candy Loz Orders.
"""

from decimal import Decimal
from rest_framework import serializers

from apps.orders.models import Order, OrderItem, OrderStatusHistory


class OrderItemSerializer(serializers.ModelSerializer):
    """Historical snapshot representation of an ordered sweet item."""
    product_id = serializers.CharField(source='product.id', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product_id',
            'product_name',
            'product_slug',
            'product_image_url',
            'unit',
            'weight_multiplier',
            'weight_label',
            'packaging_label',
            'packaging_fee',
            'unit_price',
            'quantity',
            'line_total',
        ]


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    """Chronological state transition audit log representation."""
    performed_by = serializers.SerializerMethodField()

    class Meta:
        model = OrderStatusHistory
        fields = [
            'id',
            'from_status',
            'to_status',
            'note',
            'reason',
            'created_at',
            'performed_by',
        ]

    def get_performed_by(self, obj):
        if not obj.performed_by_user:
            return None
        return {
            'id': obj.performed_by_user.id,
            'username': obj.performed_by_user.username,
            'full_name': obj.performed_by_user.full_name,
            'role': obj.performed_by_user.role,
        }


class OrderDetailSerializer(serializers.ModelSerializer):
    """Complete order detail representation."""
    customer = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True, read_only=True)
    timeline = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'status',
            'payment_method',
            'customer',
            'subtotal',
            'delivery_fee',
            'total',
            'tracking_token',
            'cancel_reason',
            'created_at',
            'updated_at',
            'items',
            'timeline',
        ]

    def get_customer(self, obj):
        return {
            'name': obj.customer_name,
            'phone': obj.customer_phone,
            'zone_id': obj.zone.id,
            'zone_name': obj.zone.name,
            'street_address': obj.street_address,
            'building_or_apt': obj.building_or_apt,
            'notes': obj.notes,
        }


class OrderListSerializer(serializers.ModelSerializer):
    """Compact administrative orders listing representation."""
    customer = serializers.SerializerMethodField()
    items_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'status',
            'payment_method',
            'customer',
            'subtotal',
            'delivery_fee',
            'total',
            'items_count',
            'created_at',
        ]

    def get_customer(self, obj):
        return {
            'name': obj.customer_name,
            'phone': obj.customer_phone,
            'zone_id': obj.zone.id,
            'zone_name': obj.zone.name,
        }


# ---------------------------------------------------------------------------
# Input validation serializers
# ---------------------------------------------------------------------------

class CustomerInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, required=True)
    phone = serializers.CharField(max_length=20, required=True)
    zone_id = serializers.CharField(max_length=32, required=True)
    street_address = serializers.CharField(max_length=300, required=True)
    building_or_apt = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')
    notes = serializers.CharField(required=False, allow_blank=True, default='')


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.CharField(max_length=32, required=True)
    quantity = serializers.IntegerField(min_value=1, default=1)
    weight_option_id = serializers.CharField(max_length=32, required=False, allow_null=True)
    packaging_label = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    packaging_fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=Decimal('0.00'))


class GuestCheckoutSerializer(serializers.Serializer):
    customer = CustomerInputSerializer(required=True)
    items = serializers.ListField(
        child=OrderItemInputSerializer(),
        allow_empty=False,
        required=True,
    )


class OrderTrackingInputSerializer(serializers.Serializer):
    order_number = serializers.CharField(max_length=30, required=True)
    phone = serializers.CharField(max_length=20, required=True)


class OrderStatusUpdateInputSerializer(serializers.Serializer):
    status = serializers.CharField(max_length=30, required=True)
    reason = serializers.CharField(required=False, allow_blank=True, default='')
    note = serializers.CharField(required=False, allow_blank=True, default='')
