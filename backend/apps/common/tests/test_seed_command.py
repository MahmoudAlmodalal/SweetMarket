"""
T-56: Test Suite for `seed_candy_loz` Management Command.
Tests entity creation invariants, password verification, all 7 order states,
clean reset flag, and idempotent re-execution.
"""

from io import StringIO
from decimal import Decimal
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import AdminUser
from apps.catalog.models import Category, Product, ProductWeightOption
from apps.delivery.models import DeliveryZone
from apps.orders.models import (
    Order,
    OrderItem,
    OrderStatusHistory,
    OrderSequence,
    STATUS_NEW,
    STATUS_ACCEPTED,
    STATUS_IN_PREPARATION,
    STATUS_OUT_FOR_DELIVERY,
    STATUS_DELIVERED,
    STATUS_UNDELIVERED,
    STATUS_CANCELLED,
)


class SeedCandyLozCommandTestCase(TestCase):
    """Test suite validating the seed_candy_loz command end-to-end."""

    def test_seed_candy_loz_creates_expected_data(self):
        """Verify complete entity creation, relationships, passwords and order states."""
        out = StringIO()
        call_command('seed_candy_loz', clean=True, verbosity=1, stdout=out)
        output = out.getvalue()
        self.assertIn("Completed Successfully", output)

        # 1. Admin Users
        self.assertEqual(AdminUser.objects.count(), 2)
        admin = AdminUser.objects.get(username="admin")
        self.assertEqual(admin.role, AdminUser.ROLE_MANAGER)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_active)
        self.assertTrue(admin.check_password("Admin@123456"))

        staff = AdminUser.objects.get(username="staff1")
        self.assertEqual(staff.role, AdminUser.ROLE_STAFF)
        self.assertFalse(staff.is_staff)
        self.assertTrue(staff.is_active)
        self.assertTrue(staff.check_password("Staff@123456"))

        # 2. Delivery Zones
        self.assertEqual(DeliveryZone.objects.count(), 6)
        self.assertTrue(DeliveryZone.objects.filter(name__icontains="غزة").exists())
        for zone in DeliveryZone.objects.all():
            self.assertGreaterEqual(zone.delivery_fee, Decimal("0.00"))
            self.assertGreaterEqual(zone.min_order_amount, Decimal("0.00"))
            self.assertGreaterEqual(zone.estimated_time_min, 5)
            self.assertGreaterEqual(zone.estimated_time_max, zone.estimated_time_min)

        # 3. Categories
        self.assertEqual(Category.objects.count(), 5)
        for cat in Category.objects.all():
            self.assertTrue(cat.slug)
            self.assertTrue(cat.name)
            self.assertGreater(cat.display_order, 0)

        # 4. Products & Weight Options
        self.assertEqual(Product.objects.count(), 15)
        self.assertGreaterEqual(ProductWeightOption.objects.count(), 30)
        for prod in Product.objects.all():
            self.assertGreater(prod.price, Decimal("0.00"))
            if prod.sale_price:
                self.assertLess(prod.sale_price, prod.price)
            self.assertTrue(prod.weight_options.exists())

        # 5. Orders - All 7 states represented
        self.assertEqual(Order.objects.count(), 7)
        statuses = set(Order.objects.values_list('status', flat=True))
        expected_statuses = {
            STATUS_NEW,
            STATUS_ACCEPTED,
            STATUS_IN_PREPARATION,
            STATUS_OUT_FOR_DELIVERY,
            STATUS_DELIVERED,
            STATUS_UNDELIVERED,
            STATUS_CANCELLED,
        }
        self.assertEqual(statuses, expected_statuses)

        # 6. Customer Phones & Snapshot Integrity
        for order in Order.objects.all():
            self.assertTrue(
                order.customer_phone.startswith("059") or order.customer_phone.startswith("056"),
                f"Phone {order.customer_phone} is not a valid normalized Palestinian mobile",
            )
            self.assertEqual(len(order.customer_phone), 10)
            self.assertTrue(order.items.exists())
            for item in order.items.all():
                self.assertTrue(item.product_name)
                self.assertGreater(item.unit_price, Decimal("0.00"))
                self.assertGreater(item.line_total, Decimal("0.00"))
            self.assertTrue(order.timeline.exists())

        # 7. Cancellation / Undelivered reasons
        undelivered = Order.objects.get(status=STATUS_UNDELIVERED)
        self.assertGreaterEqual(len(undelivered.cancel_reason), 5)
        cancelled = Order.objects.get(status=STATUS_CANCELLED)
        self.assertGreaterEqual(len(cancelled.cancel_reason), 5)

        # 8. OrderSequence synchronized
        current_year = timezone.now().year
        seq = OrderSequence.objects.get(year=current_year)
        self.assertGreaterEqual(seq.last_number, 1007)

    def test_seed_candy_loz_idempotent(self):
        """Verify calling the seed command multiple times without --clean does not duplicate or fail."""
        out1 = StringIO()
        call_command('seed_candy_loz', clean=True, stdout=out1)

        out2 = StringIO()
        call_command('seed_candy_loz', clean=False, stdout=out2)
        output2 = out2.getvalue()

        self.assertIn("0 created, 2 skipped", output2)
        self.assertIn("0 created, 6 skipped", output2)
        self.assertIn("0 created, 5 skipped", output2)
        self.assertIn("0 created, 15 skipped", output2)
        self.assertIn("0 created, 7 skipped", output2)

        self.assertEqual(AdminUser.objects.count(), 2)
        self.assertEqual(DeliveryZone.objects.count(), 6)
        self.assertEqual(Category.objects.count(), 5)
        self.assertEqual(Product.objects.count(), 15)
        self.assertEqual(Order.objects.count(), 7)

    def test_seed_candy_loz_clean_flag(self):
        """Verify --clean flushes existing records and rebuilds canonical set."""
        call_command('seed_candy_loz', clean=True)
        self.assertEqual(Order.objects.count(), 7)

        # Run with clean again
        out = StringIO()
        call_command('seed_candy_loz', clean=True, verbosity=2, stdout=out)
        output = out.getvalue()

        self.assertIn("[clean] Domain tables cleared.", output)
        self.assertEqual(Order.objects.count(), 7)
        self.assertEqual(Product.objects.count(), 15)
        self.assertEqual(AdminUser.objects.count(), 2)
