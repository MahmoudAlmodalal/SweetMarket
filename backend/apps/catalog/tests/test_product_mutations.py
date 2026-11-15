"""
Test suite for Product creation and update APIs with atomic weight option sync (T-48).
"""

from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.catalog.models import Category, Product, ProductWeightOption

AdminUser = get_user_model()


class ProductMutationsAPITests(APITestCase):
    """
    Test suite for admin manager product creation, mutation, and weight options sync.
    """

    def setUp(self):
        self.manager = AdminUser.objects.create_user(
            username='prod_manager',
            email='manager@candyloz.ps',
            full_name='مدير المنتجات',
            password='Password@123',
            role='manager',
        )
        self.staff = AdminUser.objects.create_user(
            username='prod_staff',
            email='staff@candyloz.ps',
            full_name='موظف المنتجات',
            password='Password@123',
            role='staff',
        )
        self.category = Category.objects.create(
            name="حلويات شرقية",
            slug="oriental-sweets",
            image_url="/images/oriental.jpg",
            display_order=1,
            is_active=True,
        )

    def test_prefixed_ids_generation(self):
        """Product and WeightOption must have prod_* and pwo_* prefixes with length 32."""
        product = Product.objects.create(
            name="معمول بالجوز",
            slug="walnut-maamoul",
            description="معمول هش محشو بالجوز البلدي",
            category=self.category,
            price=Decimal('60.00'),
            unit="kg",
            image_url="/images/maamoul.jpg",
        )
        self.assertTrue(product.id.startswith("prod_"))
        self.assertEqual(len(product.id), 32)

        opt = ProductWeightOption.objects.create(
            product=product,
            label="نصف كيلو",
            multiplier=Decimal('0.5'),
            price=Decimal('35.00'),
        )
        self.assertTrue(opt.id.startswith("pwo_"))
        self.assertEqual(len(opt.id), 32)

    def test_create_product_unauthenticated_rejected(self):
        """POST /api/v1/admin/products returns 401 for anonymous users."""
        payload = {
            "name": "كنافة نابلسية خشنة",
            "slug": "knafeh-nabulsia",
            "description": "كنافة بالسمن البلدي والجبنة النابلسية الفاخرة",
            "categoryId": self.category.id,
            "price": 50.0,
            "unit": "kg",
            "imageUrl": "/images/knafeh.jpg",
        }
        response = self.client.post('/api/v1/admin/products', data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_product_staff_forbidden(self):
        """POST /api/v1/admin/products returns 403 for staff users."""
        self.client.force_authenticate(user=self.staff)
        payload = {
            "name": "كنافة نابلسية خشنة",
            "slug": "knafeh-nabulsia",
            "description": "كنافة بالسمن البلدي والجبنة النابلسية الفاخرة",
            "categoryId": self.category.id,
            "price": 50.0,
            "unit": "kg",
            "imageUrl": "/images/knafeh.jpg",
        }
        response = self.client.post('/api/v1/admin/products', data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_product_manager_success_with_weight_options(self):
        """POST /api/v1/admin/products creates product and weight options atomically."""
        self.client.force_authenticate(user=self.manager)
        payload = {
            "name": "مشكل بقلاوة ملكي فاخر",
            "nameEn": "Mixed Luxury Baklava",
            "slug": "mixed-baklava-luxury",
            "description": "طبقات رقائق هشة محشوة بالفستق الحلبي الفاخر وسمن بلدي أصلي",
            "categoryId": self.category.id,
            "price": 85.0,
            "salePrice": 75.0,
            "unit": "kg",
            "imageUrl": "/images/products/baklava.jpg",
            "galleryImages": ["/images/products/baklava-1.jpg", "/images/products/baklava-2.jpg"],
            "isAvailable": True,
            "isFeatured": True,
            "availableWeights": [
                {"label": "نصف كيلو", "multiplier": 0.5, "price": 45.0, "displayOrder": 1},
                {"label": "كيلو كامل", "multiplier": 1.0, "price": 85.0, "displayOrder": 2},
                {"label": "كيلو ونصف", "multiplier": 1.5, "price": 125.0, "displayOrder": 3},
            ]
        }
        response = self.client.post('/api/v1/admin/products', data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        res_data = response.json()
        self.assertTrue(res_data.get('success'))

        data = res_data.get('data')
        self.assertTrue(data['id'].startswith("prod_"))
        self.assertEqual(data['name'], "مشكل بقلاوة ملكي فاخر")
        self.assertEqual(data['price'], 85.0)
        self.assertEqual(data['salePrice'], 75.0)
        self.assertEqual(len(data['availableWeights']), 3)

        # Verify DB records
        created_prod = Product.objects.get(slug="mixed-baklava-luxury")
        self.assertEqual(created_prod.weight_options.count(), 3)
        self.assertEqual(created_prod.gallery_images, ["/images/products/baklava-1.jpg", "/images/products/baklava-2.jpg"])

    def test_create_product_invalid_sale_price_exceeding_base_price(self):
        """Validation fails if salePrice >= price."""
        self.client.force_authenticate(user=self.manager)
        payload = {
            "name": "غريبة بالسمن",
            "slug": "ghraybeh",
            "description": "غريبة دايبة بالسمن البلدي الفاخر",
            "categoryId": self.category.id,
            "price": 40.0,
            "salePrice": 45.0,  # Greater than base price
            "unit": "kg",
            "imageUrl": "/images/ghraybeh.jpg",
        }
        response = self.client.post('/api/v1/admin/products', data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        res_data = response.json()
        self.assertFalse(res_data.get('success'))

    def test_create_product_duplicate_slug_returns_409(self):
        """Duplicate slug returns 409 Conflict."""
        Product.objects.create(
            name="بقلاوة أولى",
            slug="baklava-unique",
            description="وصف منتج طويل بما فيه الكفاية",
            category=self.category,
            price=Decimal('50.00'),
            unit="kg",
            image_url="/images/baklava.jpg",
        )
        self.client.force_authenticate(user=self.manager)
        payload = {
            "name": "بقلاوة ثانية مكررة",
            "slug": "baklava-unique",
            "description": "وصف منتج طويل بما فيه الكفاية",
            "categoryId": self.category.id,
            "price": 60.0,
            "unit": "kg",
            "imageUrl": "/images/baklava2.jpg",
        }
        response = self.client.post('/api/v1/admin/products', data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        res_data = response.json()
        self.assertEqual(res_data.get('error', {}).get('code'), 'DUPLICATE_SLUG')

    def test_update_product_atomic_weight_options_sync(self):
        """PUT /api/v1/admin/products/{id} replaces weight options atomically."""
        self.client.force_authenticate(user=self.manager)
        product = Product.objects.create(
            name="كنافة عربية",
            slug="arabic-knafeh",
            description="كنافة عربية غزة بالجوز والقرفة",
            category=self.category,
            price=Decimal('70.00'),
            unit="kg",
            image_url="/images/arabic.jpg",
        )
        ProductWeightOption.objects.create(
            product=product,
            label="القديم",
            multiplier=Decimal('0.5'),
            price=Decimal('35.00'),
        )

        update_payload = {
            "name": "كنافة عربية ملكية",
            "slug": "arabic-knafeh-royal",
            "description": "كنافة عربية غزة بالسمن البلدي والجوز الفاخر",
            "categoryId": self.category.id,
            "price": 75.0,
            "unit": "kg",
            "imageUrl": "/images/arabic-new.jpg",
            "availableWeights": [
                {"label": "صحن صغير", "multiplier": 0.5, "price": 40.0, "displayOrder": 1},
                {"label": "سدر عائلي", "multiplier": 2.0, "price": 140.0, "displayOrder": 2},
            ]
        }
        response = self.client.put(f'/api/v1/admin/products/{product.id}', data=update_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertTrue(res_data.get('success'))

        data = res_data.get('data')
        self.assertEqual(data['name'], "كنافة عربية ملكية")
        self.assertEqual(len(data['availableWeights']), 2)

        # Verify previous options were deleted and replaced
        product.refresh_from_db()
        self.assertEqual(product.weight_options.count(), 2)
        labels = list(product.weight_options.values_list('label', flat=True))
        self.assertIn("صحن صغير", labels)
        self.assertIn("سدر عائلي", labels)
        self.assertNotIn("القديم", labels)
