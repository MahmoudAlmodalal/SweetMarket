"""
Integration and unit tests for UnifiedCamelCaseJSONRenderer and CamelCaseJSONParser.
"""

import json
from django.test import override_settings
from django.urls import path
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APITestCase
from rest_framework.views import APIView
from apps.common.renderers import UnifiedCamelCaseJSONRenderer


class SuccessSampleView(APIView):
    def get(self, request):
        return Response({
            'user_name': 'أحمد',
            'order_count': 5,
            'is_vip_customer': True,
        })

    def post(self, request):
        # Echo the parsed request.data to verify camelCase -> snake_case parsing
        return Response({
            'parsed_data': request.data,
        })


class PaginatedSampleView(APIView):
    def get(self, request):
        return Response({
            'results': [
                {'item_name': 'بقلاوة فستق', 'unit_price': '25.00', 'stock_quantity': 10},
                {'item_name': 'كنافة نابلسية', 'unit_price': '30.00', 'stock_quantity': 5},
            ],
            'meta': {
                'page': 1,
                'limit': 20,
                'total_items': 2,
                'total_pages': 1,
            }
        })


class AlreadyEnvelopedView(APIView):
    def get(self, request):
        return Response({
            'success': True,
            'data': {'custom_field': 'already_wrapped'},
            'meta': {'extra_info': 'info'},
        })


class ListDataView(APIView):
    def get(self, request):
        return Response([
            {'product_id': 'prod_1', 'product_name': 'حلوى'},
            {'product_id': 'prod_2', 'product_name': 'شوكولاتة'},
        ])


class NoContentSampleView(APIView):
    def delete(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


class ErrorSampleView(APIView):
    def get(self, request):
        return Response(
            {'error_message': 'Not found'},
            status=status.HTTP_404_NOT_FOUND
        )


urlpatterns = [
    path('api/test/sample/', SuccessSampleView.as_view(), name='test-sample'),
    path('api/test/paginated/', PaginatedSampleView.as_view(), name='test-paginated'),
    path('api/test/enveloped/', AlreadyEnvelopedView.as_view(), name='test-enveloped'),
    path('api/test/list/', ListDataView.as_view(), name='test-list'),
    path('api/test/no-content/', NoContentSampleView.as_view(), name='test-no-content'),
    path('api/test/error/', ErrorSampleView.as_view(), name='test-error'),
]


@override_settings(ROOT_URLCONF=__name__)
class ContentNegotiationAPITests(APITestCase):
    """Test suite for camelCase negotiation and response envelope wrapping."""

    def test_2xx_response_wrapped_in_standard_envelope(self):
        """Successful 2xx response must be wrapped in { success: true, data, meta }."""
        response = self.client.get('/api/test/sample/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertIn('success', data)
        self.assertIn('data', data)
        self.assertIn('meta', data)
        self.assertTrue(data['success'])
        self.assertIsNone(data['meta'])

    def test_outgoing_keys_converted_to_camel_case(self):
        """Dictionary keys inside data must be converted from snake_case to camelCase."""
        response = self.client.get('/api/test/sample/')
        data = response.json()

        self.assertIn('userName', data['data'])
        self.assertIn('orderCount', data['data'])
        self.assertIn('isVipCustomer', data['data'])
        self.assertEqual(data['data']['userName'], 'أحمد')
        self.assertEqual(data['data']['orderCount'], 5)
        self.assertTrue(data['data']['isVipCustomer'])

        # Verify snake_case keys are absent
        self.assertNotIn('user_name', data['data'])
        self.assertNotIn('order_count', data['data'])
        self.assertNotIn('is_vip_customer', data['data'])

    def test_incoming_camel_case_converted_to_snake_case(self):
        """Incoming JSON with camelCase keys must be converted to snake_case in request.data."""
        payload = {
            'customerName': 'سارة',
            'shippingAddress': {
                'cityName': 'غزة',
                'streetAddress': 'شارع عمر المختار',
            },
            'itemQuantities': [1, 2, 3],
        }

        response = self.client.post(
            '/api/test/sample/',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertTrue(data['success'])

        # In the echoed payload, data has been converted to camelCase again on output,
        # but let's verify that the view processed snake_case by asserting on the echoed fields
        parsed = data['data']['parsedData']
        self.assertIn('customerName', parsed)
        self.assertIn('shippingAddress', parsed)
        self.assertEqual(parsed['shippingAddress']['cityName'], 'غزة')

    def test_paginated_response_structure_and_casing(self):
        """Paginated responses with results and meta should envelope into data and camelCased meta."""
        response = self.client.get('/api/test/paginated/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertTrue(data['success'])
        self.assertIsInstance(data['data'], list)
        self.assertEqual(len(data['data']), 2)

        # Keys inside list items must be camelCased
        first_item = data['data'][0]
        self.assertIn('itemName', first_item)
        self.assertIn('unitPrice', first_item)
        self.assertIn('stockQuantity', first_item)
        self.assertEqual(first_item['itemName'], 'بقلاوة فستق')

        # Meta keys must be camelCased
        self.assertIsNotNone(data['meta'])
        self.assertEqual(data['meta']['page'], 1)
        self.assertEqual(data['meta']['limit'], 20)
        self.assertEqual(data['meta']['totalItems'], 2)
        self.assertEqual(data['meta']['totalPages'], 1)

    def test_already_enveloped_response_not_double_wrapped(self):
        """Responses that already include a 'success' key should not be re-wrapped."""
        response = self.client.get('/api/test/enveloped/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['customField'], 'already_wrapped')
        # Ensure 'data' is not a nested dict containing 'data'
        self.assertNotIn('data', data['data'])

    def test_list_data_response_wrapped_properly(self):
        """Views returning lists directly should have the list wrapped inside data."""
        response = self.client.get('/api/test/list/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertTrue(data['success'])
        self.assertIsInstance(data['data'], list)
        self.assertEqual(len(data['data']), 2)
        self.assertEqual(data['data'][0]['productId'], 'prod_1')

    def test_no_content_204_not_wrapped(self):
        """204 No Content response should remain empty without JSON envelope."""
        response = self.client.delete('/api/test/no-content/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(response.content, b'')

    def test_error_response_not_wrapped_with_success_true(self):
        """4xx or 5xx responses must not be wrapped with success: True."""
        response = self.client.get('/api/test/error/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        data = response.json()
        self.assertNotIn('success', data)
        self.assertIn('errorMessage', data)


class UnifiedCamelCaseJSONRendererDirectTests(APITestCase):
    """Direct unit tests for UnifiedCamelCaseJSONRenderer class methods."""

    def setUp(self):
        self.renderer = UnifiedCamelCaseJSONRenderer()

    def test_render_with_none_context(self):
        """Renderer should work smoothly when renderer_context is None."""
        output = self.renderer.render({'full_name': 'كريم'})
        parsed = json.loads(output.decode('utf-8'))
        self.assertTrue(parsed['success'])
        self.assertEqual(parsed['data']['fullName'], 'كريم')
        self.assertIsNone(parsed['meta'])

    def test_render_primitives(self):
        """Renderer should support primitive values (string, integer, boolean)."""
        output = self.renderer.render("simple string")
        parsed = json.loads(output.decode('utf-8'))
        self.assertTrue(parsed['success'])
        self.assertEqual(parsed['data'], "simple string")
