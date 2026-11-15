"""
Read-only selectors for Candy Loz catalog.
Encapsulates all queries with eager-loading (select_related & prefetch_related)
to prevent N+1 bottlenecks.
"""

from typing import Optional
from django.db.models import QuerySet, Q
from django.http import Http404
from apps.catalog.models import Category, Product


def list_storefront_categories() -> QuerySet[Category]:
    """
    Retrieve active categories ordered by display_order for storefront customers.
    """
    return Category.objects.filter(is_active=True).order_by('display_order', 'id')


def list_admin_categories() -> QuerySet[Category]:
    """
    Retrieve all categories for administrative oversight.
    """
    return Category.objects.all().order_by('display_order', 'id')


def get_category_by_id(category_id: str) -> Category:
    """
    Retrieve a single category by primary key.
    """
    try:
        return Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        raise Http404("التصنيف المطلوب غير موجود")


def list_storefront_products(
    *,
    category: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
) -> QuerySet[Product]:
    """
    Retrieve non-archived products with category and weight options eager-loaded.
    Guarantees constant query count (no N+1).
    """
    qs = (
        Product.objects
        .filter(is_archived=False)
        .select_related('category')
        .prefetch_related('weight_options')
        .order_by('-created_at')
    )

    if category:
        category = str(category).strip()
        qs = qs.filter(Q(category__id=category) | Q(category__slug=category))

    if search:
        search = str(search).strip()
        qs = qs.filter(
            Q(name__icontains=search)
            | Q(description__icontains=search)
            | Q(name_en__icontains=search)
        )

    if featured is not None:
        qs = qs.filter(is_featured=featured)

    return qs


def get_product_detail(slug_or_id: str) -> Product:
    """
    Retrieve single non-archived product by ID or slug with relations preloaded.
    """
    slug_or_id = str(slug_or_id).strip()
    try:
        return (
            Product.objects
            .filter(is_archived=False)
            .select_related('category')
            .prefetch_related('weight_options')
            .get(Q(id=slug_or_id) | Q(slug=slug_or_id))
        )
    except Product.DoesNotExist:
        raise Http404("عذراً، هذا الصنف غير متوفر حالياً في قائمة المتجر")


def list_admin_products(
    *,
    category_id: Optional[str] = None,
    is_available: Optional[bool] = None,
    is_archived: Optional[bool] = None,
    search: Optional[str] = None,
) -> QuerySet[Product]:
    """
    Retrieve products for administrative catalog view with comprehensive filters.
    """
    qs = (
        Product.objects
        .select_related('category')
        .prefetch_related('weight_options')
        .order_by('-created_at')
    )

    if category_id:
        qs = qs.filter(category_id=category_id.strip())

    if is_available is not None:
        qs = qs.filter(is_available=is_available)

    if is_archived is not None:
        qs = qs.filter(is_archived=is_archived)

    if search:
        search = search.strip()
        qs = qs.filter(
            Q(name__icontains=search)
            | Q(description__icontains=search)
            | Q(slug__icontains=search)
            | Q(name_en__icontains=search)
        )

    return qs


def get_product_by_id(product_id: str) -> Product:
    """
    Retrieve single product by ID for admin operations.
    """
    try:
        return (
            Product.objects
            .select_related('category')
            .prefetch_related('weight_options')
            .get(id=product_id.strip())
        )
    except Product.DoesNotExist:
        raise Http404("المنتج المطلوب غير موجود")
