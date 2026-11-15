"""
Test suite for Fast Availability Toggle PATCH /api/v1/admin/products/{id}/availability (T-50 / FR-022).
"""

from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.catalog.models import Category, Product

AdminUser = get_user_model()


class ProductAvailabilityToggleAPITests(APITestCase):
    """
    Test suite for operational availability toggle endpoint (FR-022).
    Both staff and managers must be permitted to toggle kitchen availability.
    """

    def setUp(self):
        self.manager = AdminUser.objects.create_user(
            username='toggle_manager',
            email='manager@candyloz.ps',
            full_name='مدير التشغيل',
            password='Password@123',
            role='manager',
        )
        self.staff = AdminUser.objects.create_user(
            username='kitchen_staff',
            email='kitchen@candyloz.ps',
            full_name='موظف المطبخ',
            password='Password@123',
            role='staff',
        )

        self.category = Category.objects.create(
            name="حلويات شرقية",
            slug="oriental",
            image_url="/images/oriental.jpg",
            display_order=1,
            is_active=True,
        )

        self.product = Product.objects.create(
            name="كنافة بالجبنة النابلسية",
            slug="knafeh-cheese",
            description="كنافة طازجة بالسمن البلدي والجبنة",
            category=self.category,
            price=Decimal('50.00'),
            unit="kg",
            image_url="/images/knafeh.jpg",
            is_available=True,
        )

    def test_availability_toggle_unauthenticated_rejected(self):
        """PATCH /api/v1/admin/products/{id}/availability returns 401 when unauthenticated."""
        response = self.client.patch(
            f'/api/v1/admin/products/{self.product.id}/availability',
            data={"isAvailable": False},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_availability_toggle_staff_allowed_to_disable(self):
        """Kitchen staff can mark product unavailable when ingredients run out (FR-022)."""
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(
            f'/api/v1/admin/products/{self.product.id}/availability',
            data={"isAvailable": False},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertTrue(res_data.get('success'))

        data = res_data.get('data')
        self.assertFalse(data['isAvailable'])

        # Verify DB persisted
        self.product.refresh_from_db()
        self.assertFalse(self.product.is_available)

    def test_availability_toggle_staff_allowed_to_enable(self):
        """Kitchen staff can mark product available when fresh batch is ready."""
        self.product.is_available = False
        self.product.save()

        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(
            f'/api/v1/admin/products/{self.product.id}/availability',
            data={"isAvailable": True},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json().get('data')['isAvailable'])

        self.product.refresh_from_db()
        self.assertTrue(self.product.is_available)

    def test_availability_toggle_manager_allowed(self):
        """Manager can also toggle product availability."""
        self.client.force_authenticate(user=self.manager)
        response = self.client.patch(
            f'/api/v1/admin/products/{self.product.id}/availability',
            data={"isAvailable": False},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.json().get('data')['isAvailable'])

    def test_availability_toggle_does_not_modify_protected_fields(self):
        """Attempting to inject price or name changes in availability payload must be ignored."""
        self.client.force_authenticate(user=self.staff)
        payload = {
            "isAvailable": False,
            "price": 10.0,
            "name": "محاولة اختراق السعر",
        }
        response = self.client.patch(
            f'/api/v1/admin/products/{self.product.id}/availability',
            data=payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.product.refresh_from_db()
        self.assertFalse(self.product.is_available)
        self.assertEqual(self.product.price, Decimal('50.00'))
        self.assertEqual(self.product.name, "كنافة بالجبنة النابلسية")

    def test_availability_toggle_nonexistent_product_returns_404(self):
        """Toggling nonexistent product returns 404 Not Found."""
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(
            '/api/v1/admin/products/prod_nonexistent_12345/availability',
            data={"isAvailable": False},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
