from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.delivery.models import DeliveryZone

User = get_user_model()


class AdminDeliveryZoneApiTests(APITestCase):
    """Test suite for the administrative delivery zones query endpoint."""

    @classmethod
    def setUpTestData(cls):
        # Create users with different roles
        cls.manager_user = User.objects.create_user(
            username="manager1",
            email="manager1@candyloz.com",
            full_name="المدير المسؤول",
            password="ManagerPassword123!",
            role="manager",
        )
        cls.staff_user = User.objects.create_user(
            username="staff1",
            email="staff1@candyloz.com",
            full_name="موظف التشغيل",
            password="StaffPassword123!",
            role="staff",
        )
        cls.unauthorized_user = User.objects.create_user(
            username="customer1",
            email="customer1@example.com",
            full_name="زبون عادي",
            password="CustomerPassword123!",
            role="customer",
        )

        # Create active and inactive delivery zones
        cls.active_zone = DeliveryZone.objects.create(
            name="مدينة غزة - الرمال",
            delivery_fee=Decimal('10.00'),
            min_order_amount=Decimal('30.00'),
            estimated_time_min=20,
            estimated_time_max=45,
            is_active=True,
        )
        cls.inactive_zone = DeliveryZone.objects.create(
            name="منطقة معطلة - بيت لاهيا",
            delivery_fee=Decimal('15.00'),
            min_order_amount=Decimal('35.00'),
            estimated_time_min=30,
            estimated_time_max=60,
            is_active=False,
        )
        cls.url = reverse('delivery:admin-delivery-zone-list')

    def test_unauthenticated_request_rejected_401(self):
        """Unauthenticated requests must be rejected with HTTP 401 Unauthorized."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        body = response.json()
        self.assertFalse(body["success"])
        self.assertEqual(body["error"]["code"], "UNAUTHORIZED")

    def test_unauthorized_role_rejected_403(self):
        """Users without staff or manager roles must be rejected with HTTP 403 Forbidden."""
        self.client.force_authenticate(user=self.unauthorized_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        body = response.json()
        self.assertFalse(body["success"])
        self.assertEqual(body["error"]["code"], "FORBIDDEN")

    def test_staff_user_access_granted_200(self):
        """Staff members must be able to view the full delivery zones registry."""
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertIsInstance(body["data"], list)

    def test_manager_user_access_granted_200(self):
        """Managers must be able to view the full delivery zones registry."""
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertIsInstance(body["data"], list)

    def test_includes_both_active_and_inactive_zones(self):
        """Admin endpoint must return both active and inactive delivery zones."""
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.get(self.url)
        body = response.json()
        zone_ids = [z["id"] for z in body["data"]]

        self.assertIn(self.active_zone.id, zone_ids)
        self.assertIn(self.inactive_zone.id, zone_ids)

        # Confirm inactive status is accurately reported
        inactive_entry = next(z for z in body["data"] if z["id"] == self.inactive_zone.id)
        self.assertFalse(inactive_entry["isActive"])

        active_entry = next(z for z in body["data"] if z["id"] == self.active_zone.id)
        self.assertTrue(active_entry["isActive"])
