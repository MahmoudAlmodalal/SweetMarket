"""
URL configuration for Candy Loz project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/admin/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.catalog.urls')),
    path('api/v1/', include('apps.delivery.urls')),
    path('api/v1/', include('apps.orders.urls')),
]
