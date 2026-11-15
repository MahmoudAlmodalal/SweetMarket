"""
Pure Python domain authorization policies for administrative accounts.
"""

from typing import Optional
from apps.accounts.models import AdminUser


def can_access_admin(actor: Optional[AdminUser]) -> bool:
    """
    Check if an actor has access to administrative tools (staff or manager).
    """
    if not actor or not actor.is_authenticated or not actor.is_active:
        return False
    return actor.role in (AdminUser.ROLE_MANAGER, AdminUser.ROLE_STAFF)


def can_manage_admin_users(actor: Optional[AdminUser]) -> bool:
    """
    Check if an actor has administrative user management privileges (manager only).
    """
    if not actor or not actor.is_authenticated or not actor.is_active:
        return False
    return actor.role == AdminUser.ROLE_MANAGER


def can_modify_user_status_or_role(
    actor: AdminUser,
    target: AdminUser,
    new_role: Optional[str] = None,
    new_is_active: Optional[bool] = None,
    active_manager_count: Optional[int] = None,
) -> bool:
    """
    Validate whether an actor can alter target's role or active status.
    Guarantees that the last remaining active manager cannot be demoted or deactivated.
    """
    if not can_manage_admin_users(actor):
        return False

    is_demoting = (
        target.role == AdminUser.ROLE_MANAGER
        and new_role is not None
        and new_role != AdminUser.ROLE_MANAGER
    )
    is_deactivating = (
        target.role == AdminUser.ROLE_MANAGER
        and target.is_active
        and new_is_active is False
    )

    if is_demoting or is_deactivating:
        if active_manager_count is not None and active_manager_count <= 1:
            return False

    return True
