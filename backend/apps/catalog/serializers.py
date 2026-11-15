"""
DRF Serializers for Candy Loz catalog: Category and Product representations and validation.
"""

from decimal import Decimal
from rest_framework import serializers
from apps.catalog.models import Category, Product, ProductWeightOption


class CategoryStorefrontSerializer(serializers.ModelSerializer):
    """Storefront category view serialization."""
    class Meta:
        model = Category
        fields = [
            'id',
            'slug',
            'name',
            'description',
            'image_url',
            'display_order',
            'is_active',
        ]


class CategoryAdminSerializer(serializers.ModelSerializer):
    """Admin full category representation."""
    class Meta:
        model = Category
        fields = [
            'id',
            'slug',
            'name',
            'description',
            'image_url',
            'display_order',
            'is_active',
            'created_at',
            'updated_at',
        ]


class CategoryCreateUpdateSerializer(serializers.Serializer):
    """Input validation for category creation and mutation."""
    name = serializers.CharField(
        min_length=2,
        max_length=100,
        error_messages={
            'min_length': 'اسم التصنيف يجب أن يتكون من حرفين على الأقل',
            'max_length': 'اسم التصنيف يجب ألا يتجاوز 100 حرف',
            'blank': 'اسم التصنيف مطلوب',
        }
    )
    slug = serializers.RegexField(
        regex=r'^[a-z0-9]+(?:-[a-z0-9]+)*$',
        min_length=2,
        max_length=100,
        error_messages={
            'invalid': 'يجب أن يحتوي المعرف اللطيف على حروف إنجليزية صغيرة وأرقام وشرطات فقط',
            'blank': 'المعرف اللطيف مطلوب',
        }
    )
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        default=''
    )
    image_url = serializers.CharField(
        max_length=500,
        error_messages={'blank': 'رابط الصورة مطلوب'}
    )
    display_order = serializers.IntegerField(
        min_value=0,
        required=False,
        default=0
    )
    is_active = serializers.BooleanField(
        required=False,
        default=True
    )


class ProductWeightOptionSerializer(serializers.ModelSerializer):
    """Representation of product weight option with numeric price."""
    price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        coerce_to_string=False
    )
    multiplier = serializers.DecimalField(
        max_digits=4,
        decimal_places=2,
        coerce_to_string=False
    )

    class Meta:
        model = ProductWeightOption
        fields = [
            'id',
            'label',
            'multiplier',
            'price',
            'display_order',
        ]


class ProductWeightOptionInputSerializer(serializers.Serializer):
    """Input validation for product weight options."""
    label = serializers.CharField(
        min_length=1,
        max_length=50,
        error_messages={'blank': 'تسمية خيار الوزن مطلوبة'}
    )
    multiplier = serializers.DecimalField(
        max_digits=4,
        decimal_places=2,
        min_value=Decimal('0.01'),
        coerce_to_string=False,
        error_messages={'min_value': 'مضاعف الوزن يجب أن يكون أكبر من صفر'}
    )
    price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01'),
        coerce_to_string=False,
        error_messages={'min_value': 'سعر خيار الوزن يجب أن يكون أكبر من صفر'}
    )
    display_order = serializers.IntegerField(
        min_value=0,
        required=False,
        default=0
    )


class ProductStorefrontSerializer(serializers.ModelSerializer):
    """Storefront product serialization with preloaded relations."""
    category_id = serializers.CharField(source='category.id')
    category_name = serializers.CharField(source='category.name')
    price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        coerce_to_string=False
    )
    sale_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        allow_null=True,
        coerce_to_string=False
    )
    available_weights = ProductWeightOptionSerializer(
        source='weight_options',
        many=True,
        read_only=True
    )

    class Meta:
        model = Product
        fields = [
            'id',
            'slug',
            'name',
            'name_en',
            'description',
            'category_id',
            'category_name',
            'price',
            'sale_price',
            'unit',
            'image_url',
            'gallery_images',
            'is_available',
            'is_featured',
            'available_weights',
        ]


class ProductAdminSerializer(serializers.ModelSerializer):
    """Admin comprehensive product representation."""
    category_id = serializers.CharField(source='category.id')
    category_name = serializers.CharField(source='category.name')
    price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        coerce_to_string=False
    )
    sale_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        allow_null=True,
        coerce_to_string=False
    )
    available_weights = ProductWeightOptionSerializer(
        source='weight_options',
        many=True,
        read_only=True
    )

    class Meta:
        model = Product
        fields = [
            'id',
            'slug',
            'name',
            'name_en',
            'description',
            'category_id',
            'category_name',
            'price',
            'sale_price',
            'unit',
            'image_url',
            'gallery_images',
            'is_available',
            'is_featured',
            'is_archived',
            'available_weights',
            'created_at',
            'updated_at',
        ]


class ProductCreateUpdateSerializer(serializers.Serializer):
    """Input validation for product creation and full mutation."""
    name = serializers.CharField(
        min_length=3,
        max_length=150,
        error_messages={
            'min_length': 'اسم المنتج يجب ألا يقل عن 3 أحرف',
            'max_length': 'اسم المنتج يجب ألا يتجاوز 150 حرفاً',
            'blank': 'اسم المنتج مطلوب',
        }
    )
    slug = serializers.RegexField(
        regex=r'^[a-z0-9]+(?:-[a-z0-9]+)*$',
        min_length=2,
        max_length=150,
        error_messages={
            'invalid': 'يجب أن يحتوي المعرف اللطيف على حروف إنجليزية صغيرة وأرقام وشرطات فقط',
            'blank': 'المعرف اللطيف مطلوب',
        }
    )
    name_en = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        max_length=150
    )
    description = serializers.CharField(
        min_length=10,
        error_messages={
            'min_length': 'وصف المنتج يجب ألا يقل عن 10 أحرف',
            'blank': 'وصف المنتج مطلوب',
        }
    )
    category_id = serializers.CharField(
        max_length=32,
        error_messages={'blank': 'معرف التصنيف مطلوب'}
    )
    price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01'),
        coerce_to_string=False,
        error_messages={'min_value': 'سعر المنتج يجب أن يكون أكبر من صفر'}
    )
    sale_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
        coerce_to_string=False
    )
    unit = serializers.ChoiceField(
        choices=Product.UNIT_CHOICES,
        default=Product.UNIT_KG
    )
    image_url = serializers.CharField(
        max_length=500,
        error_messages={'blank': 'رابط الصورة الرئيسية مطلوب'}
    )
    gallery_images = serializers.ListField(
        child=serializers.CharField(max_length=500),
        required=False,
        default=list
    )
    is_available = serializers.BooleanField(
        required=False,
        default=True
    )
    is_featured = serializers.BooleanField(
        required=False,
        default=False
    )
    available_weights = ProductWeightOptionInputSerializer(
        many=True,
        required=False,
        default=list
    )

    def validate(self, attrs):
        price = attrs.get('price')
        sale_price = attrs.get('sale_price')

        if sale_price is not None:
            if sale_price <= Decimal('0.00'):
                raise serializers.ValidationError({
                    'sale_price': 'سعر الخصم الترويجي يجب أن يكون أكبر من صفر'
                })
            if price is not None and sale_price >= price:
                raise serializers.ValidationError({
                    'sale_price': 'سعر الخصم الترويجي يجب أن يكون أقل تماماً من السعر الأساسي'
                })

        return attrs


class ProductAvailabilitySerializer(serializers.Serializer):
    """Input validation for quick kitchen availability toggle."""
    is_available = serializers.BooleanField(
        required=True,
        error_messages={'required': 'حقل التوفر مطلوب'}
    )
