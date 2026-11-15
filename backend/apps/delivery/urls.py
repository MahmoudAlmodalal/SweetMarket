from django.urls import path
from apps.delivery.views import (
    AdminDeliveryZoneDetailView,
    AdminDeliveryZoneListView,
    StorefrontDeliveryZoneListView,
)

app_name = 'delivery'

urlpatterns = [
    # Storefront public delivery zones
    path('delivery-zones', StorefrontDeliveryZoneListView.as_view(), name='storefront-delivery-zone-list'),
    path('delivery-zones/', StorefrontDeliveryZoneListView.as_view(), name='storefront-delivery-zone-list-slash'),

    # Admin delivery zones registry and mutations
    path('admin/delivery-zones', AdminDeliveryZoneListView.as_view(), name='admin-delivery-zone-list'),
    path('admin/delivery-zones/', AdminDeliveryZoneListView.as_view(), name='admin-delivery-zone-list-slash'),
    path('admin/delivery-zones/<str:id>', AdminDeliveryZoneDetailView.as_view(), name='admin-delivery-zone-detail'),
    path('admin/delivery-zones/<str:id>/', AdminDeliveryZoneDetailView.as_view(), name='admin-delivery-zone-detail-slash'),
]
