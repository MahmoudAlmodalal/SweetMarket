from decimal import Decimal
from django.db import models
from apps.common.models import TimeStampedModel, generate_prefixed_id


def generate_zone_id() -> str:
    """Generate 32-character URL-safe ID prefixed with 'zone_'."""
    return generate_prefixed_id('zone')


class DeliveryZone(TimeStampedModel):
    """
    Geographical delivery territory model for Candy Loz.
    Defines coverage area, delivery fee, minimum order threshold,
    and estimated delivery time range.
    """
    id = models.CharField(
        max_length=32,
        primary_key=True,
        default=generate_zone_id,
        editable=False,
        verbose_name="معرف المنطقة"
    )
    name = models.CharField(
        max_length=150,
        verbose_name="اسم المنطقة"
    )
    delivery_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="رسوم التوصيل"
    )
    min_order_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="الحد الأدنى للطلب"
    )
    estimated_time_min = models.PositiveIntegerField(
        verbose_name="أدنى وقت متوقع للتوصيل (بالدقائق)"
    )
    estimated_time_max = models.PositiveIntegerField(
        verbose_name="أقصى وقت متوقع للتوصيل (بالدقائق)"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="مفعل"
    )

    class Meta:
        db_table = 'delivery_zones'
        ordering = ['name']
        verbose_name = "منطقة توصيل"
        verbose_name_plural = "مناطق التوصيل"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(delivery_fee__gte=Decimal('0.00')),
                name='delivery_zone_delivery_fee_gte_zero',
            ),
            models.CheckConstraint(
                condition=models.Q(min_order_amount__gte=Decimal('0.00')),
                name='delivery_zone_min_order_amount_gte_zero',
            ),
            models.CheckConstraint(
                condition=models.Q(estimated_time_min__gte=5),
                name='delivery_zone_estimated_time_min_gte_five',
            ),
            models.CheckConstraint(
                condition=models.Q(estimated_time_max__gte=models.F('estimated_time_min'))
                & models.Q(estimated_time_max__lte=240),
                name='delivery_zone_estimated_time_max_valid_range',
            ),
            models.CheckConstraint(
                condition=~models.Q(name=''),
                name='delivery_zone_name_non_empty',
            ),
        ]

    def __str__(self) -> str:
        return self.name
