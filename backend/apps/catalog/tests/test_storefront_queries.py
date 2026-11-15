"""
Test suite for Storefront read queries, filters, search, and N+1 prevention (T-49).
"""

from decimal import Decimal
from rest_framework import status
from rest_framework.test import APITestCase
from apps.catalog.models import Category, Product, ProductWeightOption


class StorefrontCatalogQueriesTests(APITestCase):
    """
    Test suite for public customer browsing, category filtering, keyword search,
    product detail fetching, and query optimization (N+1 immunity).
    """

    def setUp(self):
        self.cat_oriental = Category.objects.create(
            name="حلويات شرقية",
            slug="oriental",
            image_url="/images/oriental.jpg",
            display_order=1,
            is_active=True,
        )
        self.cat_cakes = Category.objects.create(
            name="كيك وتورتات",
            slug="cakes",
            image_url="/images/cakes.jpg",
            display_order=2,
            is_active=True,
        )

        # Products in oriental category
        self.p1 = Product.objects.create(
            name="مشكل بقلاوة تركي",
            name_en="Turkish Mixed Baklava",
            slug="turkish-baklava",
            description="بقلاوة تركية فاخرة محشوة بالفستق",
            category=self.cat_oriental,
            price=Decimal('80.00'),
            unit="kg",
            image_url="/images/baklava.jpg",
            is_available=True,
            is_featured=True,
            is_archived=False,
        )
        ProductWeightOption.objects.create(product=self.p1, label="نصف كيلو", multiplier=Decimal('0.5'), price=Decimal('42.00'))
        ProductWeightOption.objects.create(product=self.p1, label="كيلو", multiplier=Decimal('1.0'), price=Decimal('80.00'))

        self.p2 = Product.objects.create(
            name="معمول بالعجوة",
            name_en="Date Maamoul",
            slug="date-maamoul",
            description="معمول بالسمن البلدي وعجوة المدينة",
            category=self.cat_oriental,
            price=Decimal('45.00'),
            unit="kg",
            image_url="/images/maamoul.jpg",
            is_available=True,
            is_featured=False,
            is_archived=False,
        )
        ProductWeightOption.objects.create(product=self.p2, label="علبة 1 كجم", multiplier=Decimal('1.0'), price=Decimal('45.00'))

        # Product in cakes category
        self.p3 = Product.objects.create(
            name="كيك شوكولاتة كيت كات",
            name_en="KitKat Chocolate Cake",
            slug="kitkat-cake",
            description="تورتة شوكولاتة بلجيكية غنية",
            category=self.cat_cakes,
            price=Decimal('110.00'),
            unit="piece",
            image_url="/images/cake.jpg",
            is_available=True,
            is_featured=True,
            is_archived=False,
        )

        # Archived product (must NEVER appear in storefront)
        self.archived_p = Product.objects.create(
            name="صنف قديم متوقف",
            slug="discontinued-sweet",
            description="هذا الصنف تمت أرشفته تاريخياً",
            category=self.cat_oriental,
            price=Decimal('30.00'),
            unit="kg",
            image_url="/images/old.jpg",
            is_available=False,
            is_featured=False,
            is_archived=True,
        )

    # ----------------------------------------------------
    # Storefront Listing and Filtering
    # ----------------------------------------------------

    def test_list_products_excludes_archived_items(self):
        """GET /api/v1/products returns only non-archived products."""
        response = self.client.get('/api/v1/products')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertTrue(res_data.get('success'))

        data = res_data.get('data')
        self.assertEqual(len(data), 3)
        slugs = [item['slug'] for item in data]
        self.assertNotIn("discontinued-sweet", slugs)

        # Check pagination meta
        meta = res_data.get('meta')
        self.assertEqual(meta['page'], 1)
        self.assertEqual(meta['totalItems'], 3)

    def test_filter_by_category_id_and_slug(self):
        """GET /api/v1/products?category=... filters by either category ID or slug."""
        # By category slug
        res_slug = self.client.get('/api/v1/products?category=cakes')
        self.assertEqual(res_slug.status_code, status.HTTP_200_OK)
        data_slug = res_slug.json().get('data')
        self.assertEqual(len(data_slug), 1)
        self.assertEqual(data_slug[0]['slug'], "kitkat-cake")

        # By category ID
        res_id = self.client.get(f'/api/v1/products?category={self.cat_oriental.id}')
        self.assertEqual(res_id.status_code, status.HTTP_200_OK)
        data_id = res_id.json().get('data')
        self.assertEqual(len(data_id), 2)

    def test_filter_by_featured_flag(self):
        """GET /api/v1/products?featured=true returns only featured items."""
        response = self.client.get('/api/v1/products?featured=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json().get('data')
        self.assertEqual(len(data), 2)
        slugs = [p['slug'] for p in data]
        self.assertIn("turkish-baklava", slugs)
        self.assertIn("kitkat-cake", slugs)
        self.assertNotIn("date-maamoul", slugs)

    def test_search_by_arabic_and_english_keyword(self):
        """GET /api/v1/products?search=... performs search across names and description."""
        # Arabic keyword
        res_ar = self.client.get('/api/v1/products?search=بقلاوة')
        data_ar = res_ar.json().get('data')
        self.assertEqual(len(data_ar), 1)
        self.assertEqual(data_ar[0]['slug'], "turkish-baklava")

        # English keyword
        res_en = self.client.get('/api/v1/products?search=KitKat')
        data_en = res_en.json().get('data')
        self.assertEqual(len(data_en), 1)
        self.assertEqual(data_en[0]['slug'], "kitkat-cake")

    # ----------------------------------------------------
    # Storefront Detail Lookup
    # ----------------------------------------------------

    def test_get_product_detail_by_slug_and_id(self):
        """GET /api/v1/products/{slugOrId} works with both slug and primary key."""
        # By slug
        res_slug = self.client.get(f'/api/v1/products/{self.p1.slug}')
        self.assertEqual(res_slug.status_code, status.HTTP_200_OK)
        data_slug = res_slug.json().get('data')
        self.assertEqual(data_slug['id'], self.p1.id)
        self.assertEqual(len(data_slug['availableWeights']), 2)

        # By id
        res_id = self.client.get(f'/api/v1/products/{self.p1.id}')
        self.assertEqual(res_id.status_code, status.HTTP_200_OK)
        self.assertEqual(res_id.json().get('data')['slug'], self.p1.slug)

    def test_get_archived_product_detail_returns_404(self):
        """Archived products must return 404 Not Found on the storefront."""
        response = self.client.get(f'/api/v1/products/{self.archived_p.slug}')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        res_data = response.json()
        self.assertFalse(res_data.get('success'))

    # ----------------------------------------------------
    # N+1 Query Optimization Guarantee
    # ----------------------------------------------------

    def test_zero_n_plus_one_queries_regression_guard(self):
        """
        Query count for catalog listing must remain strictly constant regardless
        of the number of products and weight options returned.
        """
        # Baseline: 3 products with weight options already exist in setUp
        with self.assertNumQueries(3):
            # 1: count query for pagination
            # 2: select products with select_related('category')
            # 3: prefetch_related('weight_options')
            res = self.client.get('/api/v1/products?limit=50')
            self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Scale database up: add 15 more products each with 3 weight options
        for i in range(15):
            prod = Product.objects.create(
                name=f"صنف إضافي {i}",
                slug=f"extra-product-{i}",
                description=f"وصف تفصيلي كامل للصنف الإضافي رقم {i}",
                category=self.cat_oriental,
                price=Decimal('50.00'),
                unit="kg",
                image_url="/images/extra.jpg",
                is_available=True,
                is_archived=False,
            )
            for w in range(3):
                ProductWeightOption.objects.create(
                    product=prod,
                    label=f"وزن {w}",
                    multiplier=Decimal(str(0.5 * (w + 1))),
                    price=Decimal(str(25.0 * (w + 1))),
                    display_order=w
                )

        # Total products is now 18 (with ~50 weight options).
        # Query count MUST STILL BE EXACTLY 3!
        with self.assertNumQueries(3):
            res_scaled = self.client.get('/api/v1/products?limit=50')
            self.assertEqual(res_scaled.status_code, status.HTTP_200_OK)
            self.assertEqual(len(res_scaled.json().get('data')), 18)
