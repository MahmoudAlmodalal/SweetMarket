from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.delivery.models import DeliveryZone


class StorefrontDeliveryZoneApiTests(APITestCase):
    """Test suite for the public storefront delivery zones endpoint."""

    @classmethod
    def setUpTestData(cls):
        # Create active delivery zones
        cls.zone_gaza = DeliveryZone.objects.create(
            name="مدينة غزة - الرمال",
            delivery_fee=Decimal('10.00'),
            min_order_amount=Decimal('30.00'),
            estimated_time_min=20,
            estimated_time_max=45,
            is_active=True,
        )
        cls.zone_khanyounis = DeliveryZone.objects.create(
            name="محافظة خانيونس",
            delivery_fee=Decimal('15.00'),
            min_order_amount=Decimal('40.00'),
            estimated_time_min=30,
            estimated_time_max=60,
            is_active=True,
        )
        # Create inactive delivery zone
        cls.zone_inactive = DeliveryZone.objects.create(
            name="المنطقة المغلقة مؤقتاً",
            delivery_fee=Decimal('20.00'),
            min_order_amount=Decimal('50.00'),
            estimated_time_min=40,
            estimated_time_max=90,
            is_active=False,
        )
        cls.url = reverse('delivery:storefront-delivery-zone-list')

    def test_public_access_without_authentication(self):
        """Storefront endpoint must be publicly accessible without authentication."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_response_envelope_and_camel_case(self):
        """Response must be enveloped in { success: true, data: [...] } with camelCase keys."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()

        self.assertIn("success", body)
        self.assertTrue(body["success"])
        self.assertIn("data", body)
        self.assertIsInstance(body["data"], list)

        # Check camelCase fields on the first item
        item = body["data"][0]
        expected_keys = {
            "id",
            "name",
            "deliveryFee",
            "minOrderAmount",
            "estimatedTimeMin",
            "estimatedTimeMax",
            "isActive",
            "createdAt",
            "updatedAt",
        }
        self.assertTrue(expected_keys.issubset(set(item.keys())))

        # Verify numeric types
        self.assertIsInstance(item["deliveryFee"], (int, float))
        self.assertIsInstance(item["minOrderAmount"], (int, float))

    def test_only_active_zones_returned(self):
        """Inactive delivery zones must be excluded from the storefront response."""
        response = self.client.get(self.url)
        body = response.json()
        zone_ids = [z["id"] for z in body["data"]]

        self.assertIn(self.zone_gaza.id, zone_ids)
        self.assertIn(self.zone_khanyounis.id, zone_ids)
        self.assertNotIn(self.zone_inactive.id, zone_ids)

        # Ensure all returned zones have isActive == True
        for z in body["data"]:
            self.assertTrue(z["isActive"])

    def test_ordered_by_name(self):
        """Active delivery zones must be returned ordered alphabetically by name."""
        response = self.client.get(self.url)
        body = response.json()
        names = [z["name"] for z in body["data"]]
        self.assertEqual(names, sorted(names))

    def test_empty_active_zones(self):
        """When no active zones exist, returns empty data list with 200 OK."""
        DeliveryZone.objects.all().delete()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["data"], [])
