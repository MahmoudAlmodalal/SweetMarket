"""
Optional shared-secret middleware to verify requests proxied from Next.js.
Active only when BACKEND_INTERNAL_SECRET is configured in the environment.
"""

import hmac
from django.conf import settings
from django.http import JsonResponse


class InternalProxySecretMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        expected_secret = getattr(settings, 'BACKEND_INTERNAL_SECRET', '')
        if expected_secret and request.path.startswith('/api/v1/'):
            provided = request.headers.get('X-Backend-Internal-Secret', '')
            if not provided or not hmac.compare_digest(provided, expected_secret):
                return JsonResponse(
                    {
                        'success': False,
                        'error': {
                            'code': 'FORBIDDEN_PROXY_SECRET',
                            'message': 'غير مصرح بالوصول المباشر بدون رمز الاتصال الداخلي',
                        },
                    },
                    status=403,
                )

        return self.get_response(request)
