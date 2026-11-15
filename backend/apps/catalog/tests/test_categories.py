"""
Test suite for Category models, policies, selectors, services, and APIs (T-47).
"""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.catalog.models import Category, Product
from apps.common.models import generate_prefixed_id

AdminUser = get_user_model()


class CategoryAPITests(APITestCase):
    """
    Integration and unit tests for category catalog APIs and delete protection.
    """

    def setUp(self):
        self.manager = AdminUser.objects.create_user(
            username='cat_manager',
            email='manager@candyloz.ps',
            full_name='مدير الكتالوج',
            password='Password@123',
            role='manager',
        )
        self.staff = AdminUser.objects.create_user(
            username='cat_staff',
            email='staff@candyloz.ps',
            full_name='موظف الكتالوج',
            password='Password@123',
            role='staff',
        )

        self.cat1 = Category.objects.create(
            name="حلويات شرقية",
            slug="oriental-sweets",
            description="بقلاوة ومعمول فاخر",
            image_url="/images/categories/oriental.jpg",
            display_order=1,
            is_active=True,
        )
        self.cat2 = Category.objects.create(
            name="كيك وتورتات",
            slug="cakes-and-tarts",
            description="كيك مناسبات وأعياد ميلاد",
            image_url="/images/categories/cakes.jpg",
            display_order=2,
            is_active=True,
        )
        self.inactive_cat = Category.objects.create(
            name="تصنيف موسمي ملغي",
            slug="seasonal-deprecated",
            description="تصنيف غير نشط",
            image_url="/images/categories/seasonal.jpg",
            display_order=99,
            is_active=False,
        )

    # ----------------------------------------------------
    # Model Tests
    # ----------------------------------------------------

    def test_category_id_prefix_and_length(self):
        """Category ID must be prefixed with cat_ and exactly 32 chars."""
        cat = Category.objects.create(
            name="معمول",
            slug="maamoul",
            image_url="/images/cat.jpg"
        )
        self.assertTrue(cat.id.startswith("cat_"))
        self.assertEqual(len(cat.id), 32)

    # ----------------------------------------------------
    # Storefront Public Endpoints
    # ----------------------------------------------------

    def test_storefront_get_categories_public_success(self):
        """GET /api/v1/categories should return active categories only, ordered by displayOrder."""
        response = self.client.get('/api/v1/categories')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertTrue(res_data.get('success'))

        data = res_data.get('data')
        self.assertEqual(len(data), 2)
        # Verify ordering: displayOrder 1 before 2
        self.assertEqual(data[0]['slug'], "oriental-sweets")
        self.assertEqual(data[1]['slug'], "cakes-and-tarts")

        # Verify camelCase keys in payload
        first = data[0]
        self.assertIn('imageUrl', first)
        self.assertIn('displayOrder', first)
        self.assertIn('isActive', first)

    # ----------------------------------------------------
    # Admin Categories Management (CRUD)
    # ----------------------------------------------------

    def test_admin_get_categories_unauthenticated_rejected(self):
        """GET /api/v1/admin/categories rejects unauthenticated requests with 401."""
        response = self.client.get('/api/v1/admin/categories')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        res_data = response.json()
        self.assertFalse(res_data.get('success'))

    def test_admin_get_categories_staff_forbidden(self):
        """GET /api/v1/admin/categories rejects staff with 403 (Manager only)."""
        self.client.force_authenticate(user=self.staff)
        response = self.client.get('/api/v1/admin/categories')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_get_categories_manager_success(self):
        """GET /api/v1/admin/categories allows Manager and returns all categories including inactive."""
        self.client.force_authenticate(user=self.manager)
        response = self.client.get('/api/v1/admin/categories')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertTrue(res_data.get('success'))
        data = res_data.get('data')
        self.assertEqual(len(data), 3)

    def test_admin_create_category_success(self):
        """POST /api/v1/admin/categories creates new category successfully with 201."""
        self.client.force_authenticate(user=self.manager)
        payload = {
            "name": "شوكولاتة فاخرة",
            "slug": "luxury-chocolate",
            "description": "تشكيلة الشوكولاتة البلجيكية والسويسرية",
            "imageUrl": "/images/categories/choco.jpg",
            "displayOrder": 3,
            "isActive": True
        }
        response = self.client.post('/api/v1/admin/categories', data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        res_data = response.json()
        self.assertTrue(res_data.get('success'))

        data = res_data.get('data')
        self.assertEqual(data['name'], "شوكولاتة فاخرة")
        self.assertEqual(data['slug'], "luxury-chocolate")
        self.assertTrue(data['id'].startswith("cat_"))

    def test_admin_create_category_duplicate_slug_returns_409(self):
        """POST /api/v1/admin/categories returns 409 Conflict if slug already exists."""
        self.client.force_authenticate(user=self.manager)
        payload = {
            "name": "حلويات مكررة",
            "slug": "oriental-sweets",  # already exists in setUp
            "imageUrl": "/images/test.jpg"
        }
        response = self.client.post('/api/v1/admin/categories', data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        res_data = response.json()
        self.assertFalse(res_data.get('success'))
        self.assertEqual(res_data.get('error', {}).get('code'), 'DUPLICATE_SLUG')

    def test_admin_create_category_invalid_slug_returns_400(self):
        """POST /api/v1/admin/categories returns 400 for invalid slug with uppercase/special chars."""
        self.client.force_authenticate(user=self.manager)
        payload = {
            "name": "تصنيف خاطئ",
            "slug": "Invalid_Slug!",
            "imageUrl": "/images/test.jpg"
        }
        response = self.client.post('/api/v1/admin/categories', data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_update_category_success(self):
        """PUT /api/v1/admin/categories/{id} updates existing category."""
        self.client.force_authenticate(user=self.manager)
        payload = {
            "name": "حلويات شرقية معدلة",
            "slug": "oriental-sweets-updated",
            "description": "وصف محدث للحلويات الشرقية",
            "imageUrl": "/images/categories/oriental-new.jpg",
            "displayOrder": 5,
            "isActive": True
        }
        response = self.client.put(f'/api/v1/admin/categories/{self.cat1.id}', data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        data = res_data.get('data')
        self.assertEqual(data['name'], "حلويات شرقية معدلة")
        self.assertEqual(data['slug'], "oriental-sweets-updated")

    # ----------------------------------------------------
    # Category Deletion Protection
    # ----------------------------------------------------

    def test_admin_delete_empty_category_success(self):
        """DELETE /api/v1/admin/categories/{id} succeeds for empty category."""
        self.client.force_authenticate(user=self.manager)
        response = self.client.delete(f'/api/v1/admin/categories/{self.inactive_cat.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Category.objects.filter(id=self.inactive_cat.id).exists())

    def test_admin_delete_category_with_products_blocked(self):
        """DELETE /api/v1/admin/categories/{id} is blocked with 400 if products are assigned."""
        self.client.force_authenticate(user=self.manager)
        # Assign a product to cat1
        Product.objects.create(
            name="بقلاوة بالفستق",
            slug="pistachio-baklava",
            description="طبقات رقائق هشة بالفستق الحلبي",
            category=self.cat1,
            price=85.00,
            unit="kg",
            image_url="/images/baklava.jpg",
        )

        response = self.client.delete(f'/api/v1/admin/categories/{self.cat1.id}')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        res_data = response.json()
        self.assertFalse(res_data.get('success'))
        self.assertEqual(res_data.get('error', {}).get('code'), 'CATEGORY_HAS_PRODUCTS')
        self.assertTrue(Category.objects.filter(id=self.cat1.id).exists())
