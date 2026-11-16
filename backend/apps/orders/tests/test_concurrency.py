"""
Multi-threaded concurrency tests for atomic order sequence numbering and locking (T-55).
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from django.db import connection

from apps.catalog.models import Category, Product
from apps.delivery.models import DeliveryZone
from apps.orders.models import (
    Order,
    OrderSequence,
    STATUS_NEW,
    STATUS_ACCEPTED,
)
from apps.orders.services import (
    generate_next_order_number,
    create_guest_order,
    update_order_status,
)

User = get_user_model()


class OrderConcurrencyTestCase(TransactionTestCase):
    """
    TransactionTestCase allows real multi-threaded database transactions
    to test atomic locking and sequence generation under concurrent load.
    """

    def setUp(self):
        self.manager = User.objects.create_user(
            username='mgr_concurrency',
            email='mgr_conc@candyloz.ps',
            full_name='مدير التزامن',
            role='manager',
            password='Password@123',
        )
        self.category = Category.objects.create(
            name="حلويات التزامن",
            slug="concurrency-sweets",
        )
        self.product = Product.objects.create(
            name="معمول فاخر",
            slug="maamoul-luxury",
            category=self.category,
            price=50.00,
            unit="kg",
            is_available=True,
        )
        self.zone = DeliveryZone.objects.create(
            name="غزة المركز",
            delivery_fee=10.00,
            min_order_amount=30.00,
            estimated_time_min=15,
            estimated_time_max=30,
            is_active=True,
        )

    def test_concurrent_order_number_generation_has_zero_collisions(self):
        """10 concurrent threads generating order numbers produce strictly unique numbers."""
        thread_count = 10
        order_numbers = []

        def task():
            # Close connection if needed for thread safety in sqlite/postgres
            connection.close()
            return generate_next_order_number()

        with ThreadPoolExecutor(max_workers=thread_count) as executor:
            futures = [executor.submit(task) for _ in range(thread_count)]
            for future in as_completed(futures):
                order_numbers.append(future.result())

        # Check total count and uniqueness
        self.assertEqual(len(order_numbers), thread_count)
        self.assertEqual(len(set(order_numbers)), thread_count)

        # Check formatting CL-YYYY-NNNN
        for num in order_numbers:
            self.assertTrue(num.startswith("CL-"))
            parts = num.split("-")
            self.assertEqual(len(parts), 3)
            self.assertEqual(len(parts[2]), 4)

    def test_concurrent_status_update_locking(self):
        """Concurrent calls to update_order_status safely resolve without corruption."""
        order, _ = create_guest_order(
            customer_name="زبون متزامن",
            customer_phone="0599000111",
            zone_id=self.zone.id,
            street_address="شارع النصر",
            items_data=[{'product_id': self.product.id, 'quantity': 1}],
        )

        def update_task():
            connection.close()
            try:
                update_order_status(
                    order_id=order.id,
                    target_status=STATUS_ACCEPTED,
                    actor=self.manager,
                    note="قبول الطلب من ثريد متزامن",
                )
                return True
            except Exception:
                return False

        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(update_task) for _ in range(3)]
            results = [f.result() for f in as_completed(futures)]

        # Exactly one transition should succeed or order should end in accepted state
        order.refresh_from_db()
        self.assertEqual(order.status, STATUS_ACCEPTED)
        self.assertTrue(any(results))
