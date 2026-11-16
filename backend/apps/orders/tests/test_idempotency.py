"""
Unit tests for Orders Idempotency Replay & Network Retry Protection (T-56 / BR-004).
"""

from decimal import Decimal
from django.test import TestCase

from apps.catalog.models import Category, Product
from apps.delivery.models import DeliveryZone
from apps.orders.models import Order, OrderSequence
from apps.orders.services import create_guest_order


class OrderIdempotencyTestCase(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name="حلويات منع التكرار",
            slug="idempotency-sweets",
        )
        self.product = Product.objects.create(
            name="بقلاوة تركية مشكلة",
            slug="baklava-turkish-mix",
            category=self.category,
            price=Decimal('60.00'),
            unit="kg",
            is_available=True,
        )
        self.zone = DeliveryZone.objects.create(
            name="الشيخ عجلين",
            delivery_fee=Decimal('15.00'),
            min_order_amount=Decimal('50.00'),
            estimated_time_min=30,
            estimated_time_max=60,
            is_active=True,
        )

    def test_idempotent_order_creation_returns_existing_order(self):
        """Submitting the same request with identical idempotency key returns the original order."""
        items = [{'product_id': self.product.id, 'quantity': 1}]
        idempotency_key = "idemp_test_key_123456789"

        # First checkout submission
        order1, created1 = create_guest_order(
            customer_name="يوسف خليل",
            customer_phone="0599112233",
            zone_id=self.zone.id,
            street_address="شارع الرشيد",
            items_data=items,
            idempotency_key=idempotency_key,
        )
        self.assertTrue(created1)
        self.assertEqual(Order.objects.count(), 1)
        first_order_number = order1.order_number

        # Duplicate submission with same key (e.g. double click or network retry)
        order2, created2 = create_guest_order(
            customer_name="يوسف خليل",
            customer_phone="0599112233",
            zone_id=self.zone.id,
            street_address="شارع الرشيد",
            items_data=items,
            idempotency_key=idempotency_key,
        )
        self.assertFalse(created2)
        self.assertEqual(order1.id, order2.id)
        self.assertEqual(order2.order_number, first_order_number)

        # Database record count remains strictly 1
        self.assertEqual(Order.objects.count(), 1)

    def test_different_idempotency_key_creates_distinct_order(self):
        """Submitting with a different idempotency key creates a second distinct order."""
        items = [{'product_id': self.product.id, 'quantity': 1}]

        order1, created1 = create_guest_order(
            customer_name="يوسف خليل",
            customer_phone="0599112233",
            zone_id=self.zone.id,
            street_address="شارع الرشيد",
            items_data=items,
            idempotency_key="key_alpha_1",
        )
        self.assertTrue(created1)

        order2, created2 = create_guest_order(
            customer_name="يوسف خليل",
            customer_phone="0599112233",
            zone_id=self.zone.id,
            street_address="شارع الرشيد",
            items_data=items,
            idempotency_key="key_beta_2",
        )
        self.assertTrue(created2)

        self.assertNotEqual(order1.id, order2.id)
        self.assertNotEqual(order1.order_number, order2.order_number)
        self.assertEqual(Order.objects.count(), 2)
