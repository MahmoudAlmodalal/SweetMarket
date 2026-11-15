"""
Business workflows and atomic write operations for Candy Loz catalog.
"""

from decimal import Decimal
from typing import Optional, List, Dict, Any, Tuple
from django.db import transaction
from rest_framework.exceptions import PermissionDenied
from apps.common.exceptions import BusinessLogicError
from apps.catalog.models import Category, Product, ProductWeightOption
from apps.catalog.policies import (
    can_manage_catalog,
    can_toggle_availability,
    can_delete_category,
)


def create_category(
    *,
    name: str,
    slug: str,
    image_url: str,
    description: str = '',
    display_order: int = 0,
    is_active: bool = True,
    actor=None,
) -> Category:
    """
    Atomic creation of a new category record.
    """
    if actor is not None and not can_manage_catalog(actor):
        raise PermissionDenied("ليس لديك الصلاحية لإنشاء تصنيف جديد")

    slug_clean = slug.strip().lower()
    if Category.objects.filter(slug=slug_clean).exists():
        raise BusinessLogicError(
            message="المعرف اللطيف (slug) مستخدم بالفعل",
            code="DUPLICATE_SLUG",
            status_code=409,
        )

    with transaction.atomic():
        category = Category.objects.create(
            name=name.strip(),
            slug=slug_clean,
            image_url=image_url.strip(),
            description=description.strip() if description else '',
            display_order=display_order,
            is_active=is_active,
        )
        return category


def update_category(
    category: Category,
    *,
    actor=None,
    **data
) -> Category:
    """
    Atomic update of an existing category.
    """
    if actor is not None and not can_manage_catalog(actor):
        raise PermissionDenied("ليس لديك الصلاحية لتعديل هذا التصنيف")

    new_slug = data.get('slug')
    if new_slug:
        new_slug = new_slug.strip().lower()
        if Category.objects.filter(slug=new_slug).exclude(id=category.id).exists():
            raise BusinessLogicError(
                message="المعرف اللطيف (slug) مستخدم بالفعل",
                code="DUPLICATE_SLUG",
                status_code=409,
            )
        data['slug'] = new_slug

    with transaction.atomic():
        for field, value in data.items():
            if hasattr(category, field) and field not in ('id', 'created_at'):
                if isinstance(value, str):
                    value = value.strip()
                setattr(category, field, value)
        category.save()
        return category


def delete_category(
    category: Category,
    *,
    actor=None,
) -> bool:
    """
    Delete category ensuring business policy can_delete_category is satisfied.
    """
    if actor is not None and not can_manage_catalog(actor):
        raise PermissionDenied("ليس لديك الصلاحية لحذف هذا التصنيف")

    can_delete_category(actor, category)

    with transaction.atomic():
        category.delete()
        return True


def create_product(
    *,
    name: str,
    slug: str,
    description: str,
    category_id: str,
    price: Decimal,
    unit: str,
    image_url: str,
    name_en: Optional[str] = None,
    sale_price: Optional[Decimal] = None,
    gallery_images: Optional[List[str]] = None,
    is_available: bool = True,
    is_featured: bool = False,
    available_weights: Optional[List[Dict[str, Any]]] = None,
    actor=None,
) -> Product:
    """
    Atomic creation of product record and associated weight options.
    """
    if actor is not None and not can_manage_catalog(actor):
        raise PermissionDenied("ليس لديك الصلاحية لإضافة منتج جديد")

    slug_clean = slug.strip().lower()
    if Product.objects.filter(slug=slug_clean).exists():
        raise BusinessLogicError(
            message="المعرف اللطيف (slug) مستخدم بالفعل لمنتج آخر",
            code="DUPLICATE_SLUG",
            status_code=409,
        )

    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        raise BusinessLogicError(
            message="التصنيف المحدد غير موجود",
            code="CATEGORY_NOT_FOUND",
            status_code=400,
        )

    # Validate price invariants
    if price <= Decimal('0.00'):
        raise BusinessLogicError(
            message="يجب أن يكون سعر المنتج أكبر من صفر",
            code="INVALID_PRICE",
            status_code=400,
        )

    if sale_price is not None:
        if sale_price <= Decimal('0.00'):
            raise BusinessLogicError(
                message="يجب أن يكون سعر الخصم الترويجي أكبر من صفر",
                code="INVALID_SALE_PRICE",
                status_code=400,
            )
        if sale_price >= price:
            raise BusinessLogicError(
                message="يجب أن يكون سعر الخصم الترويجي أقل تماماً من السعر الأساسي",
                code="SALE_PRICE_EXCEEDS_BASE",
                status_code=400,
            )

    with transaction.atomic():
        product = Product.objects.create(
            name=name.strip(),
            name_en=name_en.strip() if name_en else None,
            slug=slug_clean,
            description=description.strip(),
            category=category,
            price=price,
            sale_price=sale_price,
            unit=unit,
            image_url=image_url.strip(),
            gallery_images=gallery_images or [],
            is_available=is_available,
            is_featured=is_featured,
        )

        if available_weights:
            for idx, opt_data in enumerate(available_weights):
                opt_price = Decimal(str(opt_data['price']))
                opt_mult = Decimal(str(opt_data['multiplier']))
                if opt_price <= Decimal('0.00') or opt_mult <= Decimal('0.00'):
                    raise BusinessLogicError(
                        message="قيم السعر والمضاعف لخيار الوزن يجب أن تكون أكبر من صفر",
                        code="INVALID_WEIGHT_OPTION",
                        status_code=400,
                    )
                ProductWeightOption.objects.create(
                    product=product,
                    label=str(opt_data['label']).strip(),
                    multiplier=opt_mult,
                    price=opt_price,
                    display_order=opt_data.get('display_order', idx),
                )

        return product


def update_product(
    product: Product,
    *,
    actor=None,
    available_weights: Optional[List[Dict[str, Any]]] = None,
    **data
) -> Product:
    """
    Atomic update of product fields and synchronization of weight options.
    """
    if actor is not None and not can_manage_catalog(actor):
        raise PermissionDenied("ليس لديك الصلاحية لتعديل هذا المنتج")

    new_slug = data.get('slug')
    if new_slug:
        new_slug = new_slug.strip().lower()
        if Product.objects.filter(slug=new_slug).exclude(id=product.id).exists():
            raise BusinessLogicError(
                message="المعرف اللطيف (slug) مستخدم بالفعل لمنتج آخر",
                code="DUPLICATE_SLUG",
                status_code=409,
            )
        data['slug'] = new_slug

    category_id = data.pop('category_id', None)
    if category_id:
        try:
            product.category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            raise BusinessLogicError(
                message="التصنيف المحدد غير موجود",
                code="CATEGORY_NOT_FOUND",
                status_code=400,
            )

    # Price validations
    target_price = data.get('price', product.price)
    if 'price' in data:
        target_price = Decimal(str(data['price']))
        if target_price <= Decimal('0.00'):
            raise BusinessLogicError(
                message="يجب أن يكون سعر المنتج أكبر من صفر",
                code="INVALID_PRICE",
                status_code=400,
            )
        data['price'] = target_price

    if 'sale_price' in data:
        target_sale = data['sale_price']
        if target_sale is not None:
            target_sale = Decimal(str(target_sale))
            if target_sale <= Decimal('0.00'):
                raise BusinessLogicError(
                    message="يجب أن يكون سعر الخصم الترويجي أكبر من صفر",
                    code="INVALID_SALE_PRICE",
                    status_code=400,
                )
            if target_sale >= target_price:
                raise BusinessLogicError(
                    message="يجب أن يكون سعر الخصم الترويجي أقل تماماً من السعر الأساسي",
                    code="SALE_PRICE_EXCEEDS_BASE",
                    status_code=400,
                )
            data['sale_price'] = target_sale
    elif target_price != product.price and product.sale_price is not None:
        if product.sale_price >= target_price:
            raise BusinessLogicError(
                message="سعر الخصم الترويجي الحالي يتجاوز السعر الأساسي الجديد",
                code="SALE_PRICE_EXCEEDS_BASE",
                status_code=400,
            )

    with transaction.atomic():
        for field, value in data.items():
            if hasattr(product, field) and field not in ('id', 'created_at', 'category'):
                if isinstance(value, str):
                    value = value.strip()
                setattr(product, field, value)
        product.save()

        if available_weights is not None:
            product.weight_options.all().delete()
            for idx, opt_data in enumerate(available_weights):
                opt_price = Decimal(str(opt_data['price']))
                opt_mult = Decimal(str(opt_data['multiplier']))
                if opt_price <= Decimal('0.00') or opt_mult <= Decimal('0.00'):
                    raise BusinessLogicError(
                        message="قيم السعر والمضاعف لخيار الوزن يجب أن تكون أكبر من صفر",
                        code="INVALID_WEIGHT_OPTION",
                        status_code=400,
                    )
                ProductWeightOption.objects.create(
                    product=product,
                    label=str(opt_data['label']).strip(),
                    multiplier=opt_mult,
                    price=opt_price,
                    display_order=opt_data.get('display_order', idx),
                )

        return product


def toggle_product_availability(
    product: Product,
    *,
    is_available: bool,
    actor=None,
) -> Product:
    """
    Dedicated fast operational service updating only kitchen availability (FR-022).
    Permits both Staff and Manager.
    """
    if actor is not None and not can_toggle_availability(actor):
        raise PermissionDenied("ليس لديك الصلاحية لتغيير حالة توفر المنتج")

    product.is_available = is_available
    product.save(update_fields=['is_available', 'updated_at'])
    return product


def delete_or_archive_product(
    product: Product,
    *,
    actor=None,
) -> Tuple[Product, bool]:
    """
    Delete or archive a product according to BR-009:
    If product has past order history, soft-archive (is_archived=True, is_available=False).
    If product has never been ordered, physically delete.
    Returns (product, is_archived_boolean).
    """
    if actor is not None and not can_manage_catalog(actor):
        raise PermissionDenied("ليس لديك الصلاحية لحذف المنتجات")

    has_orders = getattr(product, 'has_orders', False)

    with transaction.atomic():
        if has_orders:
            product.is_archived = True
            product.is_available = False
            product.save(update_fields=['is_archived', 'is_available', 'updated_at'])
            return product, True
        else:
            product_id = product.id
            product.delete()
            product.id = product_id
            return product, False
