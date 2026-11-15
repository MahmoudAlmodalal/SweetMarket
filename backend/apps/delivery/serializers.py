from decimal import Decimal
from rest_framework import serializers
from apps.delivery.models import DeliveryZone


class DeliveryZoneSerializer(serializers.ModelSerializer):
    """
    Representation serializer for DeliveryZone entities.
    Field keys are transformed to camelCase by UnifiedCamelCaseJSONRenderer.
    """
    delivery_fee = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        coerce_to_string=False
    )
    min_order_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        coerce_to_string=False
    )

    class Meta:
        model = DeliveryZone
        fields = [
            'id',
            'name',
            'delivery_fee',
            'min_order_amount',
            'estimated_time_min',
            'estimated_time_max',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class DeliveryZoneCreateUpdateSerializer(serializers.Serializer):
    """
    Validation serializer for delivery zone creation and mutation workflows.
    Enforces business validation rules prior to calling service layer.
    """
    name = serializers.CharField(
        min_length=3,
        max_length=150,
        error_messages={
            'min_length': 'اسم المنطقة يجب أن يتكون من 3 أحرف على الأقل.',
            'blank': 'اسم المنطقة مطلوب ولا يمكن أن يكون فارغاً.',
        }
    )
    delivery_fee = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.00'),
        required=False,
        default=Decimal('0.00'),
        coerce_to_string=False,
        error_messages={
            'min_value': 'رسوم التوصيل يجب أن تكون قيمة غير سالبة (0 أو أكثر).',
        }
    )
    min_order_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.00'),
        required=False,
        default=Decimal('0.00'),
        coerce_to_string=False,
        error_messages={
            'min_value': 'الحد الأدنى لقيمة الطلب يجب أن يكون 0 أو أكثر.',
        }
    )
    estimated_time_min = serializers.IntegerField(
        min_value=5,
        error_messages={
            'min_value': 'أدنى وقت متوقع للتوصيل يجب ألا يقل عن 5 دقائق.',
        }
    )
    estimated_time_max = serializers.IntegerField(
        max_value=240,
        error_messages={
            'max_value': 'أقصى وقت متوقع للتوصيل يجب ألا يتجاوز 240 دقيقة (4 ساعات).',
        }
    )
    is_active = serializers.BooleanField(
        required=False,
        default=True
    )

    def validate(self, attrs):
        time_min = attrs.get('estimated_time_min')
        time_max = attrs.get('estimated_time_max')

        if self.instance:
            if time_min is None:
                time_min = getattr(self.instance, 'estimated_time_min', None)
            if time_max is None:
                time_max = getattr(self.instance, 'estimated_time_max', None)

        if time_min is not None and time_max is not None:
            if time_max < time_min:
                raise serializers.ValidationError({
                    'estimated_time_max': 'أقصى وقت متوقع للتوصيل يجب أن يكون أكبر من أو يساوي أدنى وقت متوقع.'
                })

        return attrs
