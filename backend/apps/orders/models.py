"""
Domain models for Candy Loz Orders:
- OrderSequence: atomic counter for CL-YYYY-NNNN sequence
- Order: central order entity with 7-stage state machine
- OrderItem: historical snapshot of ordered product at checkout
- OrderStatusHistory: immutable audit log for state transitions
"""

import secrets
from decimal import Decimal
from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel, generate_prefixed_id


def generate_order_id() -> str:
    """Generate a prefixed ID for Order ('ord_...')."""
    return generate_prefixed_id('ord')


def generate_order_item_id() -> str:
    """Generate a prefixed ID for OrderItem ('oi_...')."""
    return generate_prefixed_id('oi')


def generate_order_history_id() -> str:
    """Generate a prefixed ID for OrderStatusHistory ('osh_...')."""
    return generate_prefixed_id('osh')


def generate_tracking_token() -> str:
    """Generate a 64-char URL-safe tracking token."""
    return secrets.token_urlsafe(48)


# ---------------------------------------------------------------------------
# Order Status Choices (7-stage state machine, BR-004)
# ---------------------------------------------------------------------------
STATUS_NEW = 'new'
STATUS_ACCEPTED = 'accepted'
STATUS_IN_PREPARATION = 'in_preparation'
STATUS_OUT_FOR_DELIVERY = 'out_for_delivery'
STATUS_DELIVERED = 'delivered'
STATUS_UNDELIVERED = 'undelivered'
STATUS_CANCELLED = 'cancelled'

ORDER_STATUS_CHOICES = [
    (STATUS_NEW, 'جديد'),
    (STATUS_ACCEPTED, 'مقبول'),
    (STATUS_IN_PREPARATION, 'قيد التجهيز'),
    (STATUS_OUT_FOR_DELIVERY, 'خرج للتوصيل'),
    (STATUS_DELIVERED, 'تم التوصيل'),
    (STATUS_UNDELIVERED, 'لم يتم التوصيل'),
    (STATUS_CANCELLED, 'ملغي'),
]

PAYMENT_CASH_ON_DELIVERY = 'cash_on_delivery'
PAYMENT_CHOICES = [
    (PAYMENT_CASH_ON_DELIVERY, 'الدفع نقداً عند الاستلام'),
]


class OrderSequence(models.Model):
    """
    Atomic sequence counter for generating non-colliding order numbers
    in the format CL-YYYY-NNNN per calendar year.
    """
    year = models.PositiveIntegerField(
        unique=True,
        verbose_name="السنة"
    )
    last_number = models.PositiveIntegerField(
        default=0,
        verbose_name="آخر رقم تسلسلي"
    )

    class Meta:
        db_table = 'order_sequences'
        verbose_name = "تسلسل الطلبات"
        verbose_name_plural = "تسلسلات الطلبات"

    def __str__(self) -> str:
        return f"CL-{self.year}-{self.last_number:04d}"


class Order(TimeStampedModel):
    """
    Central order entity capturing customer info, delivery details,
    financial totals, and 7-stage lifecycle state.
    """
    id = models.CharField(
        primary_key=True,
        max_length=32,
        default=generate_order_id,
        editable=False,
        verbose_name="معرف الطلب"
    )
    order_number = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name="رقم الطلب"
    )
    status = models.CharField(
        max_length=20,
        choices=ORDER_STATUS_CHOICES,
        default=STATUS_NEW,
        db_index=True,
        verbose_name="حالة الطلب"
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_CHOICES,
        default=PAYMENT_CASH_ON_DELIVERY,
        verbose_name="طريقة الدفع"
    )
    # Customer contact info
    customer_name = models.CharField(
        max_length=100,
        verbose_name="اسم الزبون"
    )
    customer_phone = models.CharField(
        max_length=15,
        db_index=True,
        verbose_name="رقم الهاتف المطبع"
    )
    # Delivery address
    zone = models.ForeignKey(
        'delivery.DeliveryZone',
        on_delete=models.RESTRICT,
        related_name='orders',
        verbose_name="منطقة التوصيل"
    )
    street_address = models.CharField(
        max_length=300,
        verbose_name="العنوان التفصيلي"
    )
    building_or_apt = models.CharField(
        max_length=200,
        blank=True,
        default='',
        verbose_name="رقم المبنى أو الشقة"
    )
    notes = models.TextField(
        blank=True,
        default='',
        verbose_name="ملاحظات التوصيل"
    )
    # Financial
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="المجموع الفرعي"
    )
    delivery_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="رسوم التوصيل"
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="الإجمالي"
    )
    # Idempotency & tracking
    idempotency_key = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_index=True,
        verbose_name="مفتاح التكرار الآمن"
    )
    tracking_token = models.CharField(
        max_length=100,
        unique=True,
        default=generate_tracking_token,
        verbose_name="رمز التتبع الآمن"
    )
    # Cancellation reason (for cancelled/undelivered)
    cancel_reason = models.TextField(
        blank=True,
        default='',
        verbose_name="سبب الإلغاء أو عدم التوصيل"
    )

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']
        verbose_name = "طلب"
        verbose_name_plural = "الطلبات"
        indexes = [
            models.Index(fields=['status', 'created_at'], name='idx_order_status_created'),
            models.Index(fields=['zone', 'status'], name='idx_order_zone_status'),
            models.Index(fields=['customer_phone'], name='idx_order_phone'),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(subtotal__gte=Decimal('0.00')),
                name='order_subtotal_gte_zero',
            ),
            models.CheckConstraint(
                condition=models.Q(delivery_fee__gte=Decimal('0.00')),
                name='order_delivery_fee_gte_zero',
            ),
            models.CheckConstraint(
                condition=models.Q(total__gte=Decimal('0.00')),
                name='order_total_gte_zero',
            ),
            models.CheckConstraint(
                condition=models.Q(payment_method=PAYMENT_CASH_ON_DELIVERY),
                name='order_payment_method_cod_only',
            ),
        ]

    def __str__(self) -> str:
        return f"{self.order_number} ({self.status})"


class OrderItem(models.Model):
    """
    Historical data snapshot of a product at the time of order placement (BR-009).
    Freezes product names, prices, weight configs, and packaging fees immutably.
    """
    id = models.CharField(
        primary_key=True,
        max_length=32,
        default=generate_order_item_id,
        editable=False,
        verbose_name="معرف عنصر الطلب"
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name="الطلب"
    )
    product = models.ForeignKey(
        'catalog.Product',
        on_delete=models.RESTRICT,
        related_name='order_items',
        verbose_name="المنتج"
    )
    # Historical snapshot fields (frozen at checkout)
    product_name = models.CharField(
        max_length=200,
        verbose_name="اسم المنتج (لقطة تاريخية)"
    )
    product_slug = models.CharField(
        max_length=200,
        verbose_name="رابط المنتج (لقطة تاريخية)"
    )
    product_image_url = models.CharField(
        max_length=500,
        blank=True,
        default='',
        verbose_name="صورة المنتج (لقطة تاريخية)"
    )
    unit = models.CharField(
        max_length=20,
        verbose_name="وحدة القياس (لقطة تاريخية)"
    )
    # Weight option snapshot
    weight_multiplier = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="مضاعف الوزن (لقطة تاريخية)"
    )
    weight_label = models.CharField(
        max_length=50,
        blank=True,
        default='',
        verbose_name="تسمية خيار الوزن (لقطة تاريخية)"
    )
    # Packaging snapshot
    packaging_label = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name="تسمية التغليف (لقطة تاريخية)"
    )
    packaging_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="رسوم التغليف (لقطة تاريخية)"
    )
    # Pricing snapshot
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="سعر الوحدة (لقطة تاريخية)"
    )
    quantity = models.PositiveIntegerField(
        default=1,
        verbose_name="الكمية"
    )
    line_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="إجمالي السطر"
    )

    class Meta:
        db_table = 'order_items'
        ordering = ['id']
        verbose_name = "عنصر الطلب"
        verbose_name_plural = "عناصر الطلبات"

    def __str__(self) -> str:
        return f"{self.order.order_number} - {self.product_name} x{self.quantity}"


class OrderStatusHistory(models.Model):
    """
    Immutable audit log recording every order state transition
    with timestamp, actors, notes and reasons (BR-004).
    """
    id = models.CharField(
        primary_key=True,
        max_length=32,
        default=generate_order_history_id,
        editable=False,
        verbose_name="معرف سجل الحالة"
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='timeline',
        verbose_name="الطلب"
    )
    performed_by_user = models.ForeignKey(
        'accounts.AdminUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='order_transitions',
        verbose_name="المستخدم المنفذ"
    )
    from_status = models.CharField(
        max_length=20,
        choices=ORDER_STATUS_CHOICES,
        null=True,
        blank=True,
        verbose_name="الحالة السابقة"
    )
    to_status = models.CharField(
        max_length=20,
        choices=ORDER_STATUS_CHOICES,
        verbose_name="الحالة الجديدة"
    )
    note = models.TextField(
        blank=True,
        default='',
        verbose_name="ملاحظة الانتقال"
    )
    reason = models.TextField(
        blank=True,
        default='',
        verbose_name="سبب الإلغاء أو عدم التوصيل"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name="وقت الانتقال"
    )

    class Meta:
        db_table = 'order_status_history'
        ordering = ['created_at']
        verbose_name = "سجل حالة الطلب"
        verbose_name_plural = "سجلات حالات الطلبات"

    def __str__(self) -> str:
        return f"{self.order.order_number}: {self.from_status} → {self.to_status}"
