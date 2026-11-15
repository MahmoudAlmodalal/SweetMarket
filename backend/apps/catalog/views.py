"""
Views coordinating HTTP request/response for Candy Loz catalog.
Thin controllers delegating permissions, validation, selectors, and services.
"""

from typing import Optional
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from apps.common.pagination import StandardPagination
from apps.catalog.permissions import IsManager, IsStaffOrManager
from apps.catalog.selectors import (
    list_storefront_categories,
    list_admin_categories,
    get_category_by_id,
    list_storefront_products,
    get_product_detail,
    list_admin_products,
    get_product_by_id,
)
from apps.catalog.services import (
    create_category,
    update_category,
    delete_category,
    create_product,
    update_product,
    toggle_product_availability,
    delete_or_archive_product,
)
from apps.catalog.serializers import (
    CategoryStorefrontSerializer,
    CategoryAdminSerializer,
    CategoryCreateUpdateSerializer,
    ProductStorefrontSerializer,
    ProductAdminSerializer,
    ProductCreateUpdateSerializer,
    ProductAvailabilitySerializer,
)


def _parse_bool(val: Optional[str]) -> Optional[bool]:
    if val is None:
        return None
    val_str = str(val).strip().lower()
    if val_str in ('true', '1', 'yes'):
        return True
    if val_str in ('false', '0', 'no'):
        return False
    return None


# ==========================================
# Storefront Category Views
# ==========================================

class CategoryStorefrontListView(APIView):
    """
    Public storefront endpoint listing active categories ordered by displayOrder.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        categories = list_storefront_categories()
        serializer = CategoryStorefrontSerializer(categories, many=True)
        return Response(serializer.data)


# ==========================================
# Admin Category Views
# ==========================================

class AdminCategoryListCreateView(APIView):
    """
    Manager endpoint to list all categories and create new categories.
    """
    permission_classes = [IsManager]

    def get(self, request):
        categories = list_admin_categories()
        serializer = CategoryAdminSerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CategoryCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = create_category(
            **serializer.validated_data,
            actor=request.user
        )
        return Response(
            CategoryAdminSerializer(category).data,
            status=status.HTTP_201_CREATED
        )


class AdminCategoryDetailView(APIView):
    """
    Manager endpoint to view, update, and delete individual categories.
    """
    permission_classes = [IsManager]

    def get(self, request, pk: str):
        category = get_category_by_id(pk)
        return Response(CategoryAdminSerializer(category).data)

    def put(self, request, pk: str):
        category = get_category_by_id(pk)
        serializer = CategoryCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = update_category(
            category,
            actor=request.user,
            **serializer.validated_data
        )
        return Response(CategoryAdminSerializer(updated).data)

    def delete(self, request, pk: str):
        category = get_category_by_id(pk)
        delete_category(category, actor=request.user)
        return Response(
            {"message": "تم حذف التصنيف بنجاح"},
            status=status.HTTP_200_OK
        )


# ==========================================
# Storefront Product Views
# ==========================================

class ProductStorefrontListView(APIView):
    """
    Public storefront endpoint listing active non-archived products.
    Accepts category, search, featured, page, and limit query params.
    Guarantees zero N+1 queries.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        category = request.query_params.get('category')
        search = request.query_params.get('search')
        featured = _parse_bool(request.query_params.get('featured'))

        qs = list_storefront_products(
            category=category,
            search=search,
            featured=featured
        )

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = ProductStorefrontSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class ProductStorefrontDetailView(APIView):
    """
    Public storefront endpoint returning single non-archived product details by slug or ID.
    """
    permission_classes = [AllowAny]

    def get(self, request, slug_or_id: str):
        product = get_product_detail(slug_or_id)
        serializer = ProductStorefrontSerializer(product)
        return Response(serializer.data)


# ==========================================
# Admin Product Views
# ==========================================

class AdminProductListCreateView(APIView):
    """
    Admin product collection view:
    GET: Staff/Manager oversight with status and search filters.
    POST: Manager-only atomic product creation.
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsManager()]
        return [IsStaffOrManager()]

    def get(self, request):
        category_id = (
            request.query_params.get('categoryId')
            or request.query_params.get('category_id')
        )
        is_available = _parse_bool(
            request.query_params.get('isAvailable')
            or request.query_params.get('is_available')
        )
        is_archived = _parse_bool(
            request.query_params.get('isArchived')
            or request.query_params.get('is_archived')
        )
        search = request.query_params.get('search')

        qs = list_admin_products(
            category_id=category_id,
            is_available=is_available,
            is_archived=is_archived,
            search=search,
        )

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = ProductAdminSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = ProductCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = create_product(
            **serializer.validated_data,
            actor=request.user
        )
        return Response(
            ProductAdminSerializer(product).data,
            status=status.HTTP_201_CREATED
        )


class AdminProductDetailView(APIView):
    """
    Admin single product operations:
    GET: Staff/Manager detail view.
    PUT: Manager update with weight option synchronization.
    DELETE: Manager soft-archiving or physical deletion (BR-009).
    """
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsStaffOrManager()]
        return [IsManager()]

    def get(self, request, pk: str):
        product = get_product_by_id(pk)
        return Response(ProductAdminSerializer(product).data)

    def put(self, request, pk: str):
        product = get_product_by_id(pk)
        serializer = ProductCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = update_product(
            product,
            actor=request.user,
            **serializer.validated_data
        )
        return Response(ProductAdminSerializer(updated).data)

    def delete(self, request, pk: str):
        product = get_product_by_id(pk)
        res_prod, was_archived = delete_or_archive_product(
            product,
            actor=request.user
        )
        if was_archived:
            return Response({
                "id": res_prod.id,
                "isArchived": True,
                "message": "تمت أرشفة المنتج بنجاح لوجود طلبات سابقة"
            })
        return Response({
            "id": res_prod.id,
            "isDeleted": True,
            "message": "تم حذف المنتج نهائياً"
        })


class AdminProductAvailabilityView(APIView):
    """
    Operational rapid availability toggle (FR-022).
    Permitted for both Staff and Manager.
    """
    permission_classes = [IsStaffOrManager]

    def patch(self, request, pk: str):
        product = get_product_by_id(pk)
        serializer = ProductAvailabilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = toggle_product_availability(
            product,
            is_available=serializer.validated_data['is_available'],
            actor=request.user
        )
        return Response(ProductAdminSerializer(updated).data)
