"""
Business authorization and state machine transition policies for Candy Loz Orders (BR-004).
"""

from typing import Optional
from rest_framework import status
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

# 7-stage state machine transition and authorization matrix (BR-004)
VALID_TRANSITIONS = {
    STATUS_NEW: {
        STATUS_ACCEPTED: ["staff", "manager"],
        STATUS_CANCELLED: ["manager"],
    },
    STATUS_ACCEPTED: {
        STATUS_IN_PREPARATION: ["staff", "manager"],
        STATUS_CANCELLED: ["manager"],
    },
    STATUS_IN_PREPARATION: {
        STATUS_OUT_FOR_DELIVERY: ["staff", "manager"],
    },
    STATUS_OUT_FOR_DELIVERY: {
        STATUS_DELIVERED: ["staff", "manager"],
        STATUS_UNDELIVERED: ["manager"],
    },
    STATUS_UNDELIVERED: {
        STATUS_OUT_FOR_DELIVERY: ["manager"],
        STATUS_CANCELLED: ["manager"],
    },
    STATUS_DELIVERED: {},  # Terminal closed state
    STATUS_CANCELLED: {},  # Terminal closed state
}


def can_transition_order_status(
    actor,
    current_status: str,
    target_status: str,
    reason: Optional[str] = None,
) -> bool:
    """
    Evaluate if an actor can transition an order from current_status to target_status.
    Raises BusinessLogicError if invalid transition or missing required reason.
    Raises PermissionDenied / BusinessLogicError with HTTP 403 if role unauthorized.
    """
    if current_status in (STATUS_DELIVERED, STATUS_CANCELLED):
        raise BusinessLogicError(
            message=f"الطلب في حالة نهائية ({current_status}) ولا يمكن تعديل حالته",
            code="ORDER_TERMINAL_STATE",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    allowed_targets = VALID_TRANSITIONS.get(current_status, {})
    if target_status not in allowed_targets:
        raise BusinessLogicError(
            message=f"الانتقال من حالة '{current_status}' إلى حالة '{target_status}' غير مسموح",
            code="INVALID_STATE_TRANSITION",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Validate Actor authorization
    if not actor or not actor.is_authenticated:
        raise BusinessLogicError(
            message="يجب تسجيل الدخول لإجراء هذا التعديل",
            code="AUTHENTICATION_REQUIRED",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    actor_role = getattr(actor, 'role', None)
    is_superuser = getattr(actor, 'is_superuser', False)

    allowed_roles = allowed_targets[target_status]
    if not is_superuser and actor_role not in allowed_roles:
        raise BusinessLogicError(
            message=f"صلاحية هذا الإجراء محصورة بالمدير فقط",
            code="PERMISSION_DENIED",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    # Validate mandatory reason for cancelled or undelivered (FR-018, FR-035)
    if target_status in (STATUS_CANCELLED, STATUS_UNDELIVERED):
        clean_reason = (reason or '').strip()
        if len(clean_reason) < 5:
            raise BusinessLogicError(
                message="يجب إدخال سبب نصي لا يقل عن 5 أحرف لحالات الإلغاء أو تعذر التسليم",
                code="REASON_REQUIRED",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

    return True


def can_view_admin_orders(user) -> bool:
    """Permit authenticated staff, managers, and superusers to view orders list."""
    if not user or not user.is_authenticated:
        return False
    if getattr(user, 'is_superuser', False):
        return True
    return getattr(user, 'role', None) in ('staff', 'manager') or getattr(user, 'is_staff', False)
