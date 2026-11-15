"""
Integration tests for StandardPagination in apps.common.
"""

from django.test import override_settings
from django.urls import path
from rest_framework import generics, serializers, status
from rest_framework.test import APITestCase
from apps.common.pagination import StandardPagination


class DummyProduct:
    def __init__(self, product_id, item_name, unit_price):
        self.product_id = product_id
        self.item_name = item_name
        self.unit_price = unit_price


class DummyProductSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    item_name = serializers.CharField()
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2)


class DummyProductListView(generics.ListAPIView):
    serializer_class = DummyProductSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        count = int(self.request.query_params.get('total_count', 45))
        return [
            DummyProduct(f"prod_{i}", f"حلوى {i}", 10.0 + i)
            for i in range(count)
        ]


urlpatterns = [
    path('api/test/products/', DummyProductListView.as_view(), name='product-list'),
]


@override_settings(ROOT_URLCONF=__name__)
class StandardPaginationAPITests(APITestCase):
    """Test suite for StandardPagination query params, limits, and meta contracts."""

    def test_default_pagination_20_items_page_1(self):
        """Default request without page/limit should return first 20 items with default meta."""
        response = self.client.get('/api/test/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 20)
        self.assertEqual(data['meta']['page'], 1)
        self.assertEqual(data['meta']['limit'], 20)
        self.assertEqual(data['meta']['totalItems'], 45)
        self.assertEqual(data['meta']['totalPages'], 3)

        # Keys inside data must be camelCased
        first = data['data'][0]
        self.assertIn('productId', first)
        self.assertIn('itemName', first)
        self.assertIn('unitPrice', first)

    def test_custom_page_and_limit(self):
        """Query parameters ?page=2&limit=10 should return slice [10:20]."""
        response = self.client.get('/api/test/products/?page=2&limit=10')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 10)
        self.assertEqual(data['meta']['page'], 2)
        self.assertEqual(data['meta']['limit'], 10)
        self.assertEqual(data['meta']['totalItems'], 45)
        self.assertEqual(data['meta']['totalPages'], 5)

        # Verify items correspond to offset 10..19
        self.assertEqual(data['data'][0]['productId'], 'prod_10')

    def test_max_page_size_ceiling_at_100(self):
        """Requesting limit=250 should be capped at max_page_size=100."""
        response = self.client.get('/api/test/products/?total_count=150&limit=250')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 100)
        self.assertEqual(data['meta']['limit'], 100)
        self.assertEqual(data['meta']['totalItems'], 150)
        self.assertEqual(data['meta']['totalPages'], 2)

    def test_page_beyond_range_returns_404(self):
        """Requesting a page number exceeding totalPages must return HTTP 404."""
        response = self.client.get('/api/test/products/?page=999')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        data = response.json()
        self.assertFalse(data['success'])
        self.assertEqual(data['error']['code'], 'NOT_FOUND')

    def test_empty_results_pagination(self):
        """Query returning zero items should produce empty data array and valid 1-page meta."""
        response = self.client.get('/api/test/products/?total_count=0')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data'], [])
        self.assertEqual(data['meta']['page'], 1)
        self.assertEqual(data['meta']['limit'], 20)
        self.assertEqual(data['meta']['totalItems'], 0)
        self.assertEqual(data['meta']['totalPages'], 1)

    def test_invalid_limit_falls_back_to_default(self):
        """Non-integer limit parameter should fall back to default limit 20."""
        response = self.client.get('/api/test/products/?limit=invalid')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 20)
        self.assertEqual(data['meta']['limit'], 20)
