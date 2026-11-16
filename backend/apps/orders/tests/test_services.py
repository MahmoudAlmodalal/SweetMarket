"""
Unit tests for Orders Atomic Services & Historical Snapshots (T-54).
"""

from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.common.exceptions import BusinessLogicError
from apps.catalog.models import Category, Product, ProductWeightOption
from apps.delivery.models import DeliveryZone
from apps.orders.models import (
    Order,
    OrderItem,
    OrderStatusHistory,
    STATUS_NEW,
    STATUS_ACCEPTED,
    STATUS_IN_PREPARATION,
    STATUS_CANCELLED,
)
from apps.orders.services import (
    create_guest_order,
    update_order_status,
    generate_next_order_number,
)

User = get_user_model()


class OrderServicesTestCase(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name="حلويات شرقية",
            slug="oriental-sweets",
            display_order=1,
            is_active=True,
        )
        self.product1 = Product.objects.create(
            name="كنافة نابلسية خشنة",
            slug="knafeh-nabulsia",
            category=self.category,
            price=Decimal('50.00'),
            unit="kg",
            is_available=True,
            is_archived=False,
        )
        self.weight_opt = ProductWeightOption.objects.create(
            product=self.product1,
            label="1 كيلو",
            multiplier=Decimal('1.00'),
            price=Decimal('50.00'),
            display_order=1,
        )
        self.zone = DeliveryZone.objects.create(
            name="الرمال",
            delivery_fee=Decimal('10.00'),
            min_order_amount=Decimal('40.00'),
            estimated_time_min=20,
            estimated_time_max=45,
            is_active=True,
        )
        self.manager = User.objects.create_user(
            username='mgr_service',
            email='mgr@candyloz.ps',
            full_name='مدير العمليات',
            role='manager',
            password='Password@123',
        )

    def test_create_guest_order_success_and_historical_snapshot(self):
        """Order created with frozen snapshots that remain unchanged after catalog price edits."""
        items_payload = [{
            'product_id': self.product1.id,
            'quantity': 2,
            'weight_option_id': self.weight_opt.id,
            'packaging_label': 'علبة فاخرة كاندي لوز',
            'packaging_fee': '5.00',
        }]

        order, created = create_guest_order(
            customer_name="أحمد محمود",
            customer_phone="0599123456",
            zone_id=self.zone.id,
            street_address="شارع عمر المختار",
            building_or_apt="عمارة الشروق ط3",
            notes="الاتصال عند الوصول",
            items_data=items_payload,
        )

        self.assertTrue(created)
        self.assertTrue(order.order_number.startswith(f"CL-{timezone.now().year}-"))
        # Line total = (50.00 * 2) + (5.00 * 2) = 110.00
        self.assertEqual(order.subtotal, Decimal('110.00'))
        self.assertEqual(order.delivery_fee, Decimal('10.00'))
        self.assertEqual(order.total, Decimal('120.00'))
        self.assertEqual(order.status, STATUS_NEW)
        self.assertEqual(order.items.count(), 1)

        item = order.items.first()
        self.assertEqual(item.product_name, "كنافة نابلسية خشنة")
        self.assertEqual(item.unit_price, Decimal('50.00'))
        self.assertEqual(item.packaging_fee, Decimal('5.00'))
        self.assertEqual(item.line_total, Decimal('110.00'))

        # Verify initial timeline history entry
        self.assertEqual(order.timeline.count(), 1)
        initial_history = order.timeline.first()
        self.assertIsNone(initial_history.from_status)
        self.assertEqual(initial_history.to_status, STATUS_NEW)

        # BR-009: Catalog price edit does NOT alter existing order snapshot
        self.product1.price = Decimal('80.00')
        self.product1.name = "كنافة معدلة بالاسم"
        self.product1.save()

        item.refresh_from_db()
        order.refresh_from_db()
        self.assertEqual(item.product_name, "كنافة نابلسية خشنة")
        self.assertEqual(item.unit_price, Decimal('50.00'))
        self.assertEqual(order.subtotal, Decimal('110.00'))

    def test_rejection_of_unavailable_product(self):
        """Order is rejected with HTTP 422 if an item is out of stock in the kitchen."""
        self.product1.is_available = False
        self.product1.save()

        items_payload = [{
            'product_id': self.product1.id,
            'quantity': 1,
        }]

        with self.assertRaises(BusinessLogicError) as ctx:
            create_guest_order(
                customer_name="خالد سعيد",
                customer_phone="0568123456",
                zone_id=self.zone.id,
                street_address="شارع النصر",
                items_data=items_payload,
            )
        self.assertEqual(ctx.exception.code, "PRODUCT_NOT_AVAILABLE")
        self.assertEqual(ctx.exception.status_code, 422)

    def test_rejection_when_below_zone_minimum_amount(self):
        """Order is rejected with HTTP 422 if subtotal does not reach zone.min_order_amount."""
        # Zone minimum is 40.00. Set product price to 20.00 and order quantity 1.
        cheap_product = Product.objects.create(
            name="قطعة غريبة",
            slug="ghraiba-piece",
            category=self.category,
            price=Decimal('20.00'),
            unit="piece",
            is_available=True,
        )

        items_payload = [{
            'product_id': cheap_product.id,
            'quantity': 1,
        }]

        with self.assertRaises(BusinessLogicError) as ctx:
            create_guest_order(
                customer_name="خالد سعيد",
                customer_phone="0568123456",
                zone_id=self.zone.id,
                street_address="شارع النصر",
                items_data=items_payload,
            )
        self.assertEqual(ctx.exception.code, "MIN_ORDER_AMOUNT_NOT_MET")
        self.assertEqual(ctx.exception.status_code, 422)

    def test_update_order_status_service(self):
        """Order status update transitions state, records audit log and reason."""
        items_payload = [{
            'product_id': self.product1.id,
            'quantity': 1,
        }]
        order, _ = create_guest_order(
            customer_name="أحمد محمود",
            customer_phone="0599123456",
            zone_id=self.zone.id,
            street_address="شارع الوحدة",
            items_data=items_payload,
        )

        # Transition new -> accepted
        updated_order = update_order_status(
            order_id=order.id,
            target_status=STATUS_ACCEPTED,
            actor=self.manager,
            note="تم استلام الطلب وبدء التحضير",
        )
        self.assertEqual(updated_order.status, STATUS_ACCEPTED)
        self.assertEqual(updated_order.timeline.count(), 2)

        # Transition accepted -> in_preparation
        updated_order = update_order_status(
            order_id=order.id,
            target_status=STATUS_IN_PREPARATION,
            actor=self.manager,
        )
        self.assertEqual(updated_order.status, STATUS_IN_PREPARATION)
        self.assertEqual(updated_order.timeline.count(), 3)
