from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.delivery.models import DeliveryZone

User = get_user_model()


class AdminDeliveryZoneMutationsTests(APITestCase):
    """Test suite for administrative delivery zone creation and update mutations."""

    @classmethod
    def setUpTestData(cls):
        cls.manager_user = User.objects.create_user(
            username="manager_admin",
            email="manager_admin@candyloz.com",
            full_name="مدير المتجر",
            password="ManagerAdminPass123!",
            role="manager",
        )
        cls.staff_user = User.objects.create_user(
            username="staff_op",
            email="staff_op@candyloz.com",
            full_name="موظف العمليات",
            password="StaffOpPass123!",
            role="staff",
        )
        cls.list_url = reverse('delivery:admin-delivery-zone-list')

    def setUp(self):
        self.zone = DeliveryZone.objects.create(
            name="المنطقة الوسطى",
            delivery_fee=Decimal('12.00'),
            min_order_amount=Decimal('35.00'),
            estimated_time_min=25,
            estimated_time_max=50,
            is_active=True,
        )
        self.detail_url = reverse('delivery:admin-delivery-zone-detail', kwargs={'id': self.zone.id})

    # ---------------------------------------------------------
    # POST /api/v1/admin/delivery-zones Tests
    # ---------------------------------------------------------

    def test_create_zone_unauthenticated_rejected_401(self):
        """Unauthenticated zone creation must be rejected with HTTP 401."""
        payload = {
            "name": "شمال غزة - بيت حانون",
            "deliveryFee": 15.00,
            "minOrderAmount": 40.00,
            "estimatedTimeMin": 30,
            "estimatedTimeMax": 60,
            "isActive": True,
        }
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        body = response.json()
        self.assertFalse(body["success"])
        self.assertEqual(body["error"]["code"], "UNAUTHORIZED")

    def test_create_zone_staff_rejected_403(self):
        """Staff users must be blocked from creating delivery zones with HTTP 403."""
        self.client.force_authenticate(user=self.staff_user)
        payload = {
            "name": "شمال غزة - بيت حانون",
            "deliveryFee": 15.00,
            "minOrderAmount": 40.00,
            "estimatedTimeMin": 30,
            "estimatedTimeMax": 60,
            "isActive": True,
        }
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        body = response.json()
        self.assertFalse(body["success"])
        self.assertEqual(body["error"]["code"], "FORBIDDEN")

    def test_create_zone_manager_success_201(self):
        """Managers must be authorized to create delivery zones returning 201 Created."""
        self.client.force_authenticate(user=self.manager_user)
        payload = {
            "name": "شمال غزة - بيت حانون",
            "deliveryFee": 15.00,
            "minOrderAmount": 40.00,
            "estimatedTimeMin": 30,
            "estimatedTimeMax": 60,
            "isActive": True,
        }
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        body = response.json()

        self.assertTrue(body["success"])
        zone_data = body["data"]
        self.assertTrue(zone_data["id"].startswith("zone_"))
        self.assertEqual(zone_data["name"], "شمال غزة - بيت حانون")
        self.assertEqual(zone_data["deliveryFee"], 15.00)
        self.assertEqual(zone_data["minOrderAmount"], 40.00)
        self.assertEqual(zone_data["estimatedTimeMin"], 30)
        self.assertEqual(zone_data["estimatedTimeMax"], 60)
        self.assertTrue(zone_data["isActive"])

        # Check DB persistence
        created_zone = DeliveryZone.objects.get(id=zone_data["id"])
        self.assertEqual(created_zone.name, "شمال غزة - بيت حانون")

    def test_create_zone_validation_negative_fee(self):
        """Negative delivery fees must be rejected with HTTP 400 VALIDATION_ERROR."""
        self.client.force_authenticate(user=self.manager_user)
        payload = {
            "name": "منطقة خاطئة",
            "deliveryFee": -10.00,
            "minOrderAmount": 30.00,
            "estimatedTimeMin": 20,
            "estimatedTimeMax": 40,
        }
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        body = response.json()
        self.assertFalse(body["success"])
        self.assertEqual(body["error"]["code"], "VALIDATION_ERROR")
        fields = [d["field"] for d in body["error"]["details"]]
        self.assertIn("deliveryFee", fields)

    def test_create_zone_validation_negative_min_order(self):
        """Negative minimum order amounts must be rejected with HTTP 400."""
        self.client.force_authenticate(user=self.manager_user)
        payload = {
            "name": "منطقة خاطئة",
            "deliveryFee": 10.00,
            "minOrderAmount": -5.00,
            "estimatedTimeMin": 20,
            "estimatedTimeMax": 40,
        }
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        body = response.json()
        self.assertFalse(body["success"])
        fields = [d["field"] for d in body["error"]["details"]]
        self.assertIn("minOrderAmount", fields)

    def test_create_zone_validation_estimated_time_min_under_5(self):
        """Minimum estimated delivery time below 5 minutes must be rejected with HTTP 400."""
        self.client.force_authenticate(user=self.manager_user)
        payload = {
            "name": "منطقة غير واقعية",
            "deliveryFee": 10.00,
            "minOrderAmount": 20.00,
            "estimatedTimeMin": 4,
            "estimatedTimeMax": 40,
        }
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        body = response.json()
        self.assertFalse(body["success"])
        fields = [d["field"] for d in body["error"]["details"]]
        self.assertIn("estimatedTimeMin", fields)

    def test_create_zone_validation_estimated_time_max_exceeds_240(self):
        """Maximum estimated delivery time above 240 minutes must be rejected with HTTP 400."""
        self.client.force_authenticate(user=self.manager_user)
        payload = {
            "name": "منطقة غير واقعية",
            "deliveryFee": 10.00,
            "minOrderAmount": 20.00,
            "estimatedTimeMin": 20,
            "estimatedTimeMax": 250,
        }
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        body = response.json()
        self.assertFalse(body["success"])
        fields = [d["field"] for d in body["error"]["details"]]
        self.assertIn("estimatedTimeMax", fields)

    def test_create_zone_validation_max_less_than_min(self):
        """Maximum estimated time less than minimum time must be rejected with HTTP 400."""
        self.client.force_authenticate(user=self.manager_user)
        payload = {
            "name": "منطقة معكوسة الأوقات",
            "deliveryFee": 10.00,
            "minOrderAmount": 20.00,
            "estimatedTimeMin": 45,
            "estimatedTimeMax": 30,
        }
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        body = response.json()
        self.assertFalse(body["success"])
        fields = [d["field"] for d in body["error"]["details"]]
        self.assertIn("estimatedTimeMax", fields)

    def test_create_zone_validation_name_too_short(self):
        """Zone names with fewer than 3 characters must be rejected with HTTP 400."""
        self.client.force_authenticate(user=self.manager_user)
        payload = {
            "name": "غز",
            "deliveryFee": 10.00,
            "minOrderAmount": 20.00,
            "estimatedTimeMin": 20,
            "estimatedTimeMax": 40,
        }
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        body = response.json()
        self.assertFalse(body["success"])
        fields = [d["field"] for d in body["error"]["details"]]
        self.assertIn("name", fields)

    # ---------------------------------------------------------
    # PUT /api/v1/admin/delivery-zones/<id> Tests
    # ---------------------------------------------------------

    def test_update_zone_unauthenticated_rejected_401(self):
        """Unauthenticated zone updates must be rejected with HTTP 401."""
        response = self.client.put(self.detail_url, {"deliveryFee": 20.00}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        body = response.json()
        self.assertFalse(body["success"])
        self.assertEqual(body["error"]["code"], "UNAUTHORIZED")

    def test_update_zone_staff_rejected_403(self):
        """Staff members must be blocked from updating delivery zones with HTTP 403."""
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.put(self.detail_url, {"deliveryFee": 20.00}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        body = response.json()
        self.assertFalse(body["success"])
        self.assertEqual(body["error"]["code"], "FORBIDDEN")

    def test_update_zone_not_found_404(self):
        """Updating a nonexistent zone ID must return HTTP 404 NOT_FOUND."""
        self.client.force_authenticate(user=self.manager_user)
        bad_url = reverse('delivery:admin-delivery-zone-detail', kwargs={'id': 'zone_nonexistent_9999999999999'})
        response = self.client.put(bad_url, {"deliveryFee": 20.00}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        body = response.json()
        self.assertFalse(body["success"])
        self.assertEqual(body["error"]["code"], "NOT_FOUND")

    def test_update_zone_manager_success_200(self):
        """Manager can successfully update zone fees, minimums, estimates, and active status."""
        self.client.force_authenticate(user=self.manager_user)
        payload = {
            "name": "المنطقة الوسطى المحدثة",
            "deliveryFee": 18.00,
            "minOrderAmount": 45.00,
            "estimatedTimeMin": 30,
            "estimatedTimeMax": 55,
            "isActive": False,
        }
        response = self.client.put(self.detail_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()

        self.assertTrue(body["success"])
        data = body["data"]
        self.assertEqual(data["name"], "المنطقة الوسطى المحدثة")
        self.assertEqual(data["deliveryFee"], 18.00)
        self.assertEqual(data["minOrderAmount"], 45.00)
        self.assertEqual(data["estimatedTimeMin"], 30)
        self.assertEqual(data["estimatedTimeMax"], 55)
        self.assertFalse(data["isActive"])

        # Check DB persistence
        self.zone.refresh_from_db()
        self.assertEqual(self.zone.name, "المنطقة الوسطى المحدثة")
        self.assertEqual(self.zone.delivery_fee, Decimal('18.00'))
        self.assertEqual(self.zone.min_order_amount, Decimal('45.00'))
        self.assertFalse(self.zone.is_active)

    def test_update_zone_validation_negative_fee(self):
        """Updating a delivery fee to a negative value must be rejected with HTTP 400."""
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.put(self.detail_url, {"deliveryFee": -5.00}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        body = response.json()
        self.assertFalse(body["success"])
        fields = [d["field"] for d in body["error"]["details"]]
        self.assertIn("deliveryFee", fields)

    def test_update_zone_validation_invalid_time_range(self):
        """Updating estimated minimum time higher than maximum time must be rejected with HTTP 400."""
        self.client.force_authenticate(user=self.manager_user)
        # zone currently has estimated_time_max = 50
        response = self.client.put(self.detail_url, {"estimatedTimeMin": 60}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        body = response.json()
        self.assertFalse(body["success"])
        fields = [d["field"] for d in body["error"]["details"]]
        self.assertIn("estimatedTimeMax", fields)
