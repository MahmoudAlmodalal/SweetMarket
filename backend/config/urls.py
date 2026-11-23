"""
URL configuration for Candy Loz project.
"""
from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import path, include
from django.utils import timezone


def health_check(_request):
    """Lightweight database-backed readiness probe for Next.js proxy & load balancers."""
    db_ok = True
    try:
        connection.ensure_connection()
    except Exception:
        db_ok = False

    status_code = 200 if db_ok else 503
    return JsonResponse(
        {
            'success': db_ok,
            'data': {
                'status': 'ok' if db_ok else 'degraded',
                'service': 'candy-loz-django-api',
                'database': 'connected' if db_ok else 'unavailable',
                'timestamp': timezone.now().isoformat(),
            },
        },
        status=status_code,
    )


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/health', health_check, name='api-health'),
    path('api/v1/health/', health_check, name='api-health-slash'),
    path('api/v1/admin/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.catalog.urls')),
    path('api/v1/', include('apps.delivery.urls')),
    path('api/v1/', include('apps.orders.urls')),
]
