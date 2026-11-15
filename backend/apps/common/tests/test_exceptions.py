"""
Integration tests for centralized exception handling in apps.common.
"""

from django.http import Http404
from django.test import override_settings
from django.urls import path
from rest_framework import exceptions, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.test import APITestCase
from rest_framework.views import APIView
from apps.common.exceptions import BusinessLogicError


class DummySerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=50)
    customer_phone = serializers.CharField(max_length=15)


class ValidationErrorView(APIView):
    def post(self, request):
        serializer = DummySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'status': 'valid'})


class NestedValidationErrorView(APIView):
    def post(self, request):
        raise exceptions.ValidationError({
            'customer': {
                'phone_number': ['يجب أن يبدأ بـ 059 أو 056'],
            },
            'non_field_errors': ['الطلب غير مكتمل'],
        })


class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'secret': 'data'})


class PermissionDeniedView(APIView):
    def get(self, request):
        raise exceptions.PermissionDenied("ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء")


class NotFoundView(APIView):
    def get(self, request):
        raise exceptions.NotFound("عذراً، هذا الصنف غير متوفر حالياً")


class Http404View(APIView):
    def get(self, request):
        raise Http404("الصفحة غير موجودة")


class BusinessLogicErrorView(APIView):
    def post(self, request):
        action = request.data.get('action')
        if action == 'cancel_prepared':
            raise BusinessLogicError(
                message="لا يمكن إلغاء الطلب بعد بدء مرحلة التجهيز بالمطبخ",
                code="INVALID_STATE_TRANSITION",
            )
        elif action == 'out_of_stock':
            raise BusinessLogicError(
                message="أحد الأصناف المطلوبة غير متوفر في المخزون",
                code="INSUFFICIENT_STOCK",
                details=[{'productId': 'prod_baklava', 'available': 0}],
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        return Response({'status': 'ok'})


class UnexpectedCrashView(APIView):
    def get(self, request):
        raise RuntimeError("Database connection suddenly dropped!")


urlpatterns = [
    path('api/test/val-error/', ValidationErrorView.as_view(), name='val-error'),
    path('api/test/nested-val-error/', NestedValidationErrorView.as_view(), name='nested-val-error'),
    path('api/test/protected/', ProtectedView.as_view(), name='protected'),
    path('api/test/permission-denied/', PermissionDeniedView.as_view(), name='permission-denied'),
    path('api/test/not-found/', NotFoundView.as_view(), name='not-found'),
    path('api/test/http-404/', Http404View.as_view(), name='http-404'),
    path('api/test/business-error/', BusinessLogicErrorView.as_view(), name='business-error'),
    path('api/test/unexpected-crash/', UnexpectedCrashView.as_view(), name='unexpected-crash'),
]


@override_settings(ROOT_URLCONF=__name__)
class CentralizedExceptionHandlerAPITests(APITestCase):
    """Test suite verifying unified error envelope for all exception scenarios."""

    def test_validation_error_envelope_and_details(self):
        """Field validation error must return 400 with VALIDATION_ERROR and structured details."""
        response = self.client.post(
            '/api/test/val-error/',
            data={},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('error', data)
        self.assertEqual(data['error']['code'], 'VALIDATION_ERROR')
        self.assertIn('message', data['error'])

        details = data['error']['details']
        self.assertIsInstance(details, list)
        field_names = [d['field'] for d in details]
        self.assertIn('customerName', field_names)
        self.assertIn('customerPhone', field_names)

    def test_nested_validation_error_formatting(self):
        """Nested validation errors must produce dot-notated camelCase field paths."""
        response = self.client.post('/api/test/nested-val-error/', data={}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        data = response.json()
        self.assertFalse(data['success'])
        details = data['error']['details']

        detail_map = {d['field']: d['message'] for d in details}
        self.assertIn('customer.phoneNumber', detail_map)
        self.assertIn('nonFieldErrors', detail_map)
        self.assertEqual(detail_map['customer.phoneNumber'], 'يجب أن يبدأ بـ 059 أو 056')

    def test_401_unauthenticated_envelope(self):
        """Unauthenticated access to protected view must return 401 with UNAUTHORIZED code."""
        response = self.client.get('/api/test/protected/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        data = response.json()
        self.assertFalse(data['success'])
        self.assertEqual(data['error']['code'], 'UNAUTHORIZED')
        self.assertIn('message', data['error'])
        self.assertEqual(data['error']['details'], [])

    def test_403_permission_denied_envelope(self):
        """Permission denied must return 403 with FORBIDDEN code and message."""
        response = self.client.get('/api/test/permission-denied/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        data = response.json()
        self.assertFalse(data['success'])
        self.assertEqual(data['error']['code'], 'FORBIDDEN')
        self.assertEqual(data['error']['message'], 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء')
        self.assertEqual(data['error']['details'], [])

    def test_404_not_found_envelope(self):
        """404 NotFound must return NOT_FOUND code and Arabic error message."""
        response = self.client.get('/api/test/not-found/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        data = response.json()
        self.assertFalse(data['success'])
        self.assertEqual(data['error']['code'], 'NOT_FOUND')
        self.assertEqual(data['error']['message'], 'عذراً، هذا الصنف غير متوفر حالياً')
        self.assertEqual(data['error']['details'], [])

    def test_http_404_django_envelope(self):
        """Standard Django Http404 must be caught and enveloped into 404 response."""
        response = self.client.get('/api/test/http-404/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        data = response.json()
        self.assertFalse(data['success'])
        self.assertEqual(data['error']['code'], 'NOT_FOUND')

    def test_405_method_not_allowed_envelope(self):
        """Requesting unhandled HTTP method must produce 405 with METHOD_NOT_ALLOWED code."""
        response = self.client.post('/api/test/not-found/', data={})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        data = response.json()
        self.assertFalse(data['success'])
        self.assertEqual(data['error']['code'], 'METHOD_NOT_ALLOWED')

    def test_business_logic_error_default_400(self):
        """BusinessLogicError should yield HTTP 400 with domain code and custom message."""
        response = self.client.post(
            '/api/test/business-error/',
            data={'action': 'cancel_prepared'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        data = response.json()
        self.assertFalse(data['success'])
        self.assertEqual(data['error']['code'], 'INVALID_STATE_TRANSITION')
        self.assertEqual(
            data['error']['message'],
            'لا يمكن إلغاء الطلب بعد بدء مرحلة التجهيز بالمطبخ'
        )
        self.assertEqual(data['error']['details'], [])

    def test_business_logic_error_custom_status_and_details(self):
        """BusinessLogicError should honor custom status code (e.g. 422) and details."""
        response = self.client.post(
            '/api/test/business-error/',
            data={'action': 'out_of_stock'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)

        data = response.json()
        self.assertFalse(data['success'])
        self.assertEqual(data['error']['code'], 'INSUFFICIENT_STOCK')
        self.assertEqual(data['error']['details'], [{'productId': 'prod_baklava', 'available': 0}])

    def test_unexpected_500_exception_envelope(self):
        """Unhandled exceptions must be caught and enveloped into structured HTTP 500."""
        response = self.client.get('/api/test/unexpected-crash/')
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

        data = response.json()
        self.assertFalse(data['success'])
        self.assertEqual(data['error']['code'], 'INTERNAL_SERVER_ERROR')
        self.assertIn('message', data['error'])
        self.assertEqual(data['error']['details'], [])
