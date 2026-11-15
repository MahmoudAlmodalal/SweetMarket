from decimal import Decimal
from django.db import IntegrityError, transaction
from django.test import TestCase
from apps.delivery.models import DeliveryZone


class DeliveryZoneModelTests(TestCase):
    """Test suite for DeliveryZone model and database constraints."""

    def test_create_valid_delivery_zone(self):
        """A delivery zone with valid data should be persisted successfully."""
        zone = DeliveryZone.objects.create(
            name="مدينة غزة - الرمال",
            delivery_fee=Decimal('10.00'),
            min_order_amount=Decimal('30.00'),
            estimated_time_min=20,
            estimated_time_max=45,
            is_active=True,
        )
        self.assertIsNotNone(zone.id)
        self.assertTrue(zone.id.startswith('zone_'))
        self.assertEqual(len(zone.id), 32)
        self.assertEqual(str(zone), "مدينة غزة - الرمال")
        self.assertIsNotNone(zone.created_at)
        self.assertIsNotNone(zone.updated_at)

    def test_default_values(self):
        """Default values for fee, min order, and active flag should match spec."""
        zone = DeliveryZone.objects.create(
            name="شمال غزة - جباليا",
            estimated_time_min=30,
            estimated_time_max=60,
        )
        self.assertEqual(zone.delivery_fee, Decimal('0.00'))
        self.assertEqual(zone.min_order_amount, Decimal('0.00'))
        self.assertTrue(zone.is_active)

    def test_constraint_negative_delivery_fee(self):
        """Delivery fee cannot be negative."""
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                DeliveryZone.objects.create(
                    name="المنطقة الوسطى",
                    delivery_fee=Decimal('-5.00'),
                    estimated_time_min=15,
                    estimated_time_max=30,
                )

    def test_constraint_negative_min_order_amount(self):
        """Minimum order amount cannot be negative."""
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                DeliveryZone.objects.create(
                    name="المنطقة الوسطى",
                    min_order_amount=Decimal('-1.00'),
                    estimated_time_min=15,
                    estimated_time_max=30,
                )

    def test_constraint_estimated_time_min_less_than_five(self):
        """Minimum estimated time must be at least 5 minutes."""
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                DeliveryZone.objects.create(
                    name="حي تل الهوا",
                    estimated_time_min=4,
                    estimated_time_max=20,
                )

    def test_constraint_estimated_time_max_less_than_min(self):
        """Maximum estimated time must be greater than or equal to minimum time."""
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                DeliveryZone.objects.create(
                    name="حي تل الهوا",
                    estimated_time_min=30,
                    estimated_time_max=25,
                )

    def test_constraint_estimated_time_max_exceeds_240(self):
        """Maximum estimated time cannot exceed 240 minutes."""
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                DeliveryZone.objects.create(
                    name="رفح",
                    estimated_time_min=60,
                    estimated_time_max=245,
                )

    def test_constraint_empty_name(self):
        """Name cannot be an empty string."""
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                DeliveryZone.objects.create(
                    name="",
                    estimated_time_min=15,
                    estimated_time_max=30,
                )
