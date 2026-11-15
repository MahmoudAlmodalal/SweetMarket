"""
Test suite for Admin Products catalog management and BR-009 soft-archiving deletion (T-51).
"""

from decimal import Decimal
from unittest.mock import patch, PropertyMock
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.catalog.models import Category, Product, ProductWeightOption

AdminUser = get_user_model()


class AdminProductsAndDeletionAPITests(APITestCase):
    """
    Test suite for administrative product queries, oversight, and BR-009 soft-archive deletion policy.
    """

    def setUp(self):
        self.manager = AdminUser.objects.create_user(
            username='admin_manager_del',
            email='manager.del@candyloz.ps',
            full_name='مدير العمليات والحذف',
            password='Password@123',
            role='manager',
        )
        self.staff = AdminUser.objects.create_user(
            username='admin_staff_del',
            email='staff.del@candyloz.ps',
            full_name='موظف العمليات',
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

        self.p_active = Product.objects.create(
            name="بقلاوة مشكلة نشطة",
            slug="active-baklava",
            description="بقلاوة فاخرة متوفرة للزبائن",
            category=self.category,
            price=Decimal('70.00'),
            unit="kg",
            image_url="/images/active.jpg",
            is_available=True,
            is_archived=False,
        )

        self.p_unavailable = Product.objects.create(
            name="كنافة غير متوفرة بالمطبخ",
            slug="unavailable-knafeh",
            description="كنافة نفدت مكوناتها مؤقتاً بالمطبخ",
            category=self.category,
            price=Decimal('60.00'),
            unit="kg",
            image_url="/images/knafeh.jpg",
            is_available=False,
            is_archived=False,
        )

        self.p_archived = Product.objects.create(
            name="صنف مؤرشف تاريخياً",
            slug="archived-sweet",
            description="صنف قديم تم إيقافه وأرشفته",
            category=self.category,
            price=Decimal('50.00'),
            unit="kg",
            image_url="/images/archived.jpg",
            is_available=False,
            is_archived=True,
        )

    # ----------------------------------------------------
    # Admin Product List & Filter Oversight
    # ----------------------------------------------------

    def test_admin_list_products_unauthenticated_rejected(self):
        """GET /api/v1/admin/products returns 401 for anonymous requests."""
        response = self.client.get('/api/v1/admin/products')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_list_products_staff_and_manager_allowed(self):
        """GET /api/v1/admin/products permits both Staff and Manager."""
        for user in (self.staff, self.manager):
            self.client.force_authenticate(user=user)
            response = self.client.get('/api/v1/admin/products')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            res_data = response.json()
            self.assertTrue(res_data.get('success'))
            # Admin list includes all products including unavailable and archived by default
            data = res_data.get('data')
            self.assertEqual(len(data), 3)

    def test_admin_list_products_filtered_by_archived(self):
        """GET /api/v1/admin/products?isArchived=true returns only archived products."""
        self.client.force_authenticate(user=self.manager)
        response = self.client.get('/api/v1/admin/products?isArchived=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json().get('data')
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['slug'], "archived-sweet")
        self.assertTrue(data[0]['isArchived'])

    def test_admin_list_products_filtered_by_availability(self):
        """GET /api/v1/admin/products?isAvailable=false returns unavailable products."""
        self.client.force_authenticate(user=self.staff)
        response = self.client.get('/api/v1/admin/products?isAvailable=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json().get('data')
        self.assertEqual(len(data), 2)
        slugs = [p['slug'] for p in data]
        self.assertIn("unavailable-knafeh", slugs)
        self.assertIn("archived-sweet", slugs)

    # ----------------------------------------------------
    # Product Deletion and BR-009 Soft-Archiving
    # ----------------------------------------------------

    def test_product_deletion_staff_forbidden(self):
        """DELETE /api/v1/admin/products/{id} returns 403 for Staff users."""
        self.client.force_authenticate(user=self.staff)
        response = self.client.delete(f'/api/v1/admin/products/{self.p_active.id}')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Product.objects.filter(id=self.p_active.id).exists())

    def test_product_deletion_without_order_history_physically_deleted(self):
        """
        DELETE /api/v1/admin/products/{id} physically removes the product from the DB
        when it has zero historical orders.
        """
        self.client.force_authenticate(user=self.manager)
        target_id = self.p_active.id

        response = self.client.delete(f'/api/v1/admin/products/{target_id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertTrue(res_data.get('success'))
        self.assertTrue(res_data.get('data', {}).get('isDeleted'))

        # Record is completely erased from database
        self.assertFalse(Product.objects.filter(id=target_id).exists())

    def test_product_deletion_with_historical_orders_soft_archived_br_009(self):
        """
        DELETE /api/v1/admin/products/{id} must automatically soft-archive the product
        (is_archived=True, is_available=False) if it is referenced in past order history (BR-009).
        """
        self.client.force_authenticate(user=self.manager)
        target_id = self.p_active.id

        # Simulate presence of past orders
        with patch.object(Product, 'has_orders', new_callable=PropertyMock) as mock_has_orders:
            mock_has_orders.return_value = True

            response = self.client.delete(f'/api/v1/admin/products/{target_id}')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            res_data = response.json()
            self.assertTrue(res_data.get('success'))

            data = res_data.get('data')
            self.assertTrue(data.get('isArchived'))

        # Verify database state: product NOT deleted, but archived & unavailable
        self.p_active.refresh_from_db()
        self.assertTrue(self.p_active.is_archived)
        self.assertFalse(self.p_active.is_available)

        # Verify storefront visibility: must be completely hidden from storefront listing
        storefront_res = self.client.get('/api/v1/products')
        storefront_slugs = [p['slug'] for p in storefront_res.json().get('data')]
        self.assertNotIn(self.p_active.slug, storefront_slugs)

        # Verify storefront detail: returns 404
        detail_res = self.client.get(f'/api/v1/products/{self.p_active.slug}')
        self.assertEqual(detail_res.status_code, status.HTTP_404_NOT_FOUND)

        # Verify admin visibility: remains visible in admin oversight
        admin_res = self.client.get(f'/api/v1/admin/products/{self.p_active.id}')
        self.assertEqual(admin_res.status_code, status.HTTP_200_OK)
        self.assertTrue(admin_res.json().get('data')['isArchived'])
