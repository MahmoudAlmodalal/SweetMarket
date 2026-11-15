"""
Domain models for Candy Loz catalog: Categories, Products, and Weight Options.
"""

from decimal import Decimal
from django.db import models
from apps.common.models import TimeStampedModel, generate_prefixed_id


def generate_category_id() -> str:
    """Generate a prefixed ID for Category ('cat_...')."""
    return generate_prefixed_id('cat')


def generate_product_id() -> str:
    """Generate a prefixed ID for Product ('prod_...')."""
    return generate_prefixed_id('prod')


def generate_pwo_id() -> str:
    """Generate a prefixed ID for ProductWeightOption ('pwo_...')."""
    return generate_prefixed_id('pwo')


class Category(TimeStampedModel):
    """
    Product category model (e.g. Oriental Sweets, Cakes, Maamoul).
    """
    id = models.CharField(
        primary_key=True,
        max_length=32,
        default=generate_category_id,
        editable=False,
        verbose_name="معرف التصنيف"
    )
    slug = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="المعرف اللطيف (Slug)"
    )
    name = models.CharField(
        max_length=100,
        verbose_name="اسم التصنيف بالعربية"
    )
    description = models.TextField(
        blank=True,
        default='',
        verbose_name="الوصف"
    )
    image_url = models.CharField(
        max_length=500,
        verbose_name="رابط الصورة"
    )
    display_order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="ترتيب العرض"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="حالة التفعيل"
    )

    class Meta:
        db_table = 'categories'
        ordering = ['display_order', 'id']
        verbose_name = "تصنيف"
        verbose_name_plural = "التصنيفات"
        constraints = [
            models.CheckConstraint(
                condition=~models.Q(name=''),
                name='category_name_non_empty',
            ),
            models.CheckConstraint(
                condition=~models.Q(slug=''),
                name='category_slug_non_empty',
            ),
        ]

    def __str__(self):
        return self.name


class Product(TimeStampedModel):
    """
    Sweets product model with pricing, availability, and category link.
    """
    UNIT_KG = 'kg'
    UNIT_HALF_KG = 'half_kg'
    UNIT_PIECE = 'piece'
    UNIT_BOX = 'box'

    UNIT_CHOICES = (
        (UNIT_KG, 'كيلوجرام'),
        (UNIT_HALF_KG, 'نصف كيلو'),
        (UNIT_PIECE, 'قطعة'),
        (UNIT_BOX, 'علبة / بوكس'),
    )

    id = models.CharField(
        primary_key=True,
        max_length=32,
        default=generate_product_id,
        editable=False,
        verbose_name="معرف المنتج"
    )
    slug = models.CharField(
        max_length=150,
        unique=True,
        db_index=True,
        verbose_name="المعرف اللطيف (Slug)"
    )
    name = models.CharField(
        max_length=150,
        verbose_name="اسم الصنف بالعربية"
    )
    name_en = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        default=None,
        verbose_name="الاسم بالإنجليزية"
    )
    description = models.TextField(
        verbose_name="وصف المنتج ومكوناته"
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.RESTRICT,
        related_name='products',
        verbose_name="التصنيف"
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="السعر الأساسي بالشيكل"
    )
    sale_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="سعر الخصم الترويجي"
    )
    unit = models.CharField(
        max_length=20,
        choices=UNIT_CHOICES,
        default=UNIT_KG,
        verbose_name="وحدة القياس"
    )
    image_url = models.CharField(
        max_length=500,
        verbose_name="رابط الصورة الرئيسية"
    )
    gallery_images = models.JSONField(
        default=list,
        blank=True,
        verbose_name="معرض الصور الإضافية"
    )
    is_available = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="حالة التوفر الفوري بالمطبخ"
    )
    is_featured = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="مميز في الأكثر طلباً"
    )
    is_archived = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="مؤرشف (أرشفة ناعمة)"
    )

    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
        verbose_name = "منتج"
        verbose_name_plural = "المنتجات"
        indexes = [
            models.Index(fields=['category', 'is_available'], name='idx_prod_cat_available'),
            models.Index(fields=['slug'], name='idx_prod_slug'),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(price__gt=Decimal('0.00')),
                name='product_price_gt_zero',
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(sale_price__isnull=True)
                    | (
                        models.Q(sale_price__gt=Decimal('0.00'))
                        & models.Q(sale_price__lt=models.F('price'))
                    )
                ),
                name='product_sale_price_valid',
            ),
            models.CheckConstraint(
                condition=~models.Q(name=''),
                name='product_name_non_empty',
            ),
            models.CheckConstraint(
                condition=~models.Q(slug=''),
                name='product_slug_non_empty',
            ),
        ]

    def __str__(self):
        return self.name

    @property
    def has_orders(self) -> bool:
        """Check if product is referenced in historical order items."""
        if hasattr(self, 'order_items'):
            return self.order_items.exists()
        return False


class ProductWeightOption(models.Model):
    """
    Weight variation option for sweets (e.g. half kg, 1 kg, box) with custom pricing.
    """
    id = models.CharField(
        primary_key=True,
        max_length=32,
        default=generate_pwo_id,
        editable=False,
        verbose_name="معرف خيار الوزن"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='weight_options',
        verbose_name="المنتج"
    )
    label = models.CharField(
        max_length=50,
        verbose_name="تسمية الخيار (مثال: نصف كيلو)"
    )
    multiplier = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        verbose_name="مضاعف الوزن بالنسبة للوحدة"
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="السعر المحدد لهذا الخيار"
    )
    display_order = models.PositiveIntegerField(
        default=0,
        verbose_name="ترتيب العرض"
    )

    class Meta:
        db_table = 'product_weight_options'
        ordering = ['display_order', 'id']
        verbose_name = "خيار وزن المنتج"
        verbose_name_plural = "خيارات أوزان المنتجات"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(multiplier__gt=Decimal('0.00')),
                name='pwo_multiplier_gt_zero',
            ),
            models.CheckConstraint(
                condition=models.Q(price__gt=Decimal('0.00')),
                name='pwo_price_gt_zero',
            ),
            models.CheckConstraint(
                condition=~models.Q(label=''),
                name='pwo_label_non_empty',
            ),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.label} ({self.price} ₪)"
