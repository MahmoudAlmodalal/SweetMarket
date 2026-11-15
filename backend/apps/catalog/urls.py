"""
URL configuration for catalog app.
Registers storefront and administrative endpoints matching API.md contract.
Supports both trailing slash and non-trailing slash URLs.
"""

from django.urls import re_path
from apps.catalog.views import (
    CategoryStorefrontListView,
    AdminCategoryListCreateView,
    AdminCategoryDetailView,
    ProductStorefrontListView,
    ProductStorefrontDetailView,
    AdminProductListCreateView,
    AdminProductDetailView,
    AdminProductAvailabilityView,
)

app_name = 'catalog'

urlpatterns = [
    # Storefront Endpoints
    re_path(r'^categories/?$', CategoryStorefrontListView.as_view(), name='storefront-category-list'),
    re_path(r'^products/?$', ProductStorefrontListView.as_view(), name='storefront-product-list'),
    re_path(r'^products/(?P<slug_or_id>[a-zA-Z0-9_\-]+)/?$', ProductStorefrontDetailView.as_view(), name='storefront-product-detail'),

    # Admin Category Endpoints
    re_path(r'^admin/categories/?$', AdminCategoryListCreateView.as_view(), name='admin-category-list-create'),
    re_path(r'^admin/categories/(?P<pk>[a-zA-Z0-9_\-]+)/?$', AdminCategoryDetailView.as_view(), name='admin-category-detail'),

    # Admin Product Endpoints
    re_path(r'^admin/products/?$', AdminProductListCreateView.as_view(), name='admin-product-list-create'),
    re_path(r'^admin/products/(?P<pk>[a-zA-Z0-9_\-]+)/availability/?$', AdminProductAvailabilityView.as_view(), name='admin-product-availability'),
    re_path(r'^admin/products/(?P<pk>[a-zA-Z0-9_\-]+)/?$', AdminProductDetailView.as_view(), name='admin-product-detail'),
]
