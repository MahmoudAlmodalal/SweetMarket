"""
URL configuration for Candy Loz Orders endpoints.
"""

from django.urls import path
from apps.orders.views import (
    GuestCheckoutView,
    OrderTrackingView,
    AdminOrderListView,
    AdminOrderDetailView,
    AdminOrderStatusUpdateView,
)

app_name = 'orders'

urlpatterns = [
    # Storefront endpoints
    path('orders', GuestCheckoutView.as_view(), name='guest-checkout'),
    path('orders/', GuestCheckoutView.as_view(), name='guest-checkout-slash'),
    path('orders/track', OrderTrackingView.as_view(), name='order-track'),
    path('orders/track/', OrderTrackingView.as_view(), name='order-track-slash'),

    # Admin endpoints
    path('admin/orders', AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/orders/', AdminOrderListView.as_view(), name='admin-order-list-slash'),
    path('admin/orders/<str:id>', AdminOrderDetailView.as_view(), name='admin-order-detail'),
    path('admin/orders/<str:id>/', AdminOrderDetailView.as_view(), name='admin-order-detail-slash'),
    path('admin/orders/<str:id>/status', AdminOrderStatusUpdateView.as_view(), name='admin-order-status-update'),
    path('admin/orders/<str:id>/status/', AdminOrderStatusUpdateView.as_view(), name='admin-order-status-update-slash'),
]
