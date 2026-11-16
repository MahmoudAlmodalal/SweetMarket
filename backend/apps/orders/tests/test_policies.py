"""
Unit tests for Orders State Machine & Status Transition Policies (T-53 / BR-004).
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.common.exceptions import BusinessLogicError
from apps.orders.models import (
    STATUS_NEW,
    STATUS_ACCEPTED,
    STATUS_IN_PREPARATION,
    STATUS_OUT_FOR_DELIVERY,
    STATUS_DELIVERED,
    STATUS_UNDELIVERED,
    STATUS_CANCELLED,
)
from apps.orders.policies import (
    can_transition_order_status,
    VALID_TRANSITIONS,
)

User = get_user_model()


class OrderStatusPoliciesTestCase(TestCase):
    def setUp(self):
        self.manager = User.objects.create_user(
            username='manager_user',
            email='manager@candyloz.ps',
            full_name='مدير المتجر',
            role='manager',
            password='Password@123',
        )
        self.staff = User.objects.create_user(
            username='staff_user',
            email='staff@candyloz.ps',
            full_name='موظف التشغيل',
            role='staff',
            password='Password@123',
        )

    def test_forward_progression_allowed_for_staff_and_manager(self):
        """Staff and Manager can advance orders through operational states."""
        # new -> accepted
        self.assertTrue(can_transition_order_status(self.staff, STATUS_NEW, STATUS_ACCEPTED))
        self.assertTrue(can_transition_order_status(self.manager, STATUS_NEW, STATUS_ACCEPTED))

        # accepted -> in_preparation
        self.assertTrue(can_transition_order_status(self.staff, STATUS_ACCEPTED, STATUS_IN_PREPARATION))
        self.assertTrue(can_transition_order_status(self.manager, STATUS_ACCEPTED, STATUS_IN_PREPARATION))

        # in_preparation -> out_for_delivery
        self.assertTrue(can_transition_order_status(self.staff, STATUS_IN_PREPARATION, STATUS_OUT_FOR_DELIVERY))
        self.assertTrue(can_transition_order_status(self.manager, STATUS_IN_PREPARATION, STATUS_OUT_FOR_DELIVERY))

        # out_for_delivery -> delivered
        self.assertTrue(can_transition_order_status(self.staff, STATUS_OUT_FOR_DELIVERY, STATUS_DELIVERED))
        self.assertTrue(can_transition_order_status(self.manager, STATUS_OUT_FOR_DELIVERY, STATUS_DELIVERED))

    def test_manager_only_cancellation_from_new_and_accepted(self):
        """Only managers can cancel new or accepted orders with valid reason."""
        # Staff is forbidden
        with self.assertRaises(BusinessLogicError) as ctx:
            can_transition_order_status(
                self.staff, STATUS_NEW, STATUS_CANCELLED, reason="زبون طلب الإلغاء"
            )
        self.assertEqual(ctx.exception.code, "PERMISSION_DENIED")
        self.assertEqual(ctx.exception.status_code, 403)

        # Manager is permitted with reason >= 5 chars
        self.assertTrue(
            can_transition_order_status(
                self.manager, STATUS_NEW, STATUS_CANCELLED, reason="طلب الزبون الإلغاء هاتفياً"
            )
        )
        self.assertTrue(
            can_transition_order_status(
                self.manager, STATUS_ACCEPTED, STATUS_CANCELLED, reason="نفاذ المواد الخام بالمطبخ"
            )
        )

    def test_cancellation_requires_mandatory_reason_minimum_length(self):
        """Cancellation requires explanation of at least 5 characters (FR-018)."""
        with self.assertRaises(BusinessLogicError) as ctx_none:
            can_transition_order_status(self.manager, STATUS_NEW, STATUS_CANCELLED, reason=None)
        self.assertEqual(ctx_none.exception.code, "REASON_REQUIRED")

        with self.assertRaises(BusinessLogicError) as ctx_short:
            can_transition_order_status(self.manager, STATUS_NEW, STATUS_CANCELLED, reason="إلغ")
        self.assertEqual(ctx_short.exception.code, "REASON_REQUIRED")

    def test_in_preparation_orders_cannot_be_cancelled(self):
        """Orders in preparation in kitchen cannot be cancelled (kitchen protection)."""
        with self.assertRaises(BusinessLogicError) as ctx:
            can_transition_order_status(
                self.manager, STATUS_IN_PREPARATION, STATUS_CANCELLED, reason="تأخر الزبون"
            )
        self.assertEqual(ctx.exception.code, "INVALID_STATE_TRANSITION")

    def test_out_for_delivery_to_undelivered_restricted_to_manager(self):
        """Only managers can mark orders undelivered with valid reason."""
        with self.assertRaises(BusinessLogicError) as ctx_staff:
            can_transition_order_status(
                self.staff, STATUS_OUT_FOR_DELIVERY, STATUS_UNDELIVERED, reason="الزبون لا يجيب"
            )
        self.assertEqual(ctx_staff.exception.code, "PERMISSION_DENIED")

        self.assertTrue(
            can_transition_order_status(
                self.manager, STATUS_OUT_FOR_DELIVERY, STATUS_UNDELIVERED, reason="هاتف الزبون مغلق تماماً"
            )
        )

    def test_undelivered_transitions(self):
        """Undelivered orders can only be re-dispatched or cancelled by manager."""
        self.assertTrue(
            can_transition_order_status(self.manager, STATUS_UNDELIVERED, STATUS_OUT_FOR_DELIVERY)
        )
        self.assertTrue(
            can_transition_order_status(
                self.manager, STATUS_UNDELIVERED, STATUS_CANCELLED, reason="رفض الزبون الاستلام نهائياً"
            )
        )

        with self.assertRaises(BusinessLogicError) as ctx_staff:
            can_transition_order_status(self.staff, STATUS_UNDELIVERED, STATUS_OUT_FOR_DELIVERY)
        self.assertEqual(ctx_staff.exception.code, "PERMISSION_DENIED")

    def test_terminal_states_immutable(self):
        """Delivered and Cancelled orders cannot transition to any state."""
        for target in (STATUS_NEW, STATUS_ACCEPTED, STATUS_OUT_FOR_DELIVERY, STATUS_CANCELLED):
            with self.assertRaises(BusinessLogicError) as ctx_del:
                can_transition_order_status(self.manager, STATUS_DELIVERED, target)
            self.assertEqual(ctx_del.exception.code, "ORDER_TERMINAL_STATE")

            with self.assertRaises(BusinessLogicError) as ctx_can:
                can_transition_order_status(self.manager, STATUS_CANCELLED, target)
            self.assertEqual(ctx_can.exception.code, "ORDER_TERMINAL_STATE")

    def test_invalid_arbitrary_jumps_rejected(self):
        """Illegal state jumps are rejected with 400 Bad Request."""
        with self.assertRaises(BusinessLogicError) as ctx1:
            can_transition_order_status(self.staff, STATUS_NEW, STATUS_DELIVERED)
        self.assertEqual(ctx1.exception.code, "INVALID_STATE_TRANSITION")

        with self.assertRaises(BusinessLogicError) as ctx2:
            can_transition_order_status(self.staff, STATUS_ACCEPTED, STATUS_DELIVERED)
        self.assertEqual(ctx2.exception.code, "INVALID_STATE_TRANSITION")
