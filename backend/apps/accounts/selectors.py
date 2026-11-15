"""
Read-only query selectors for administrative accounts.
"""

from typing import Optional
from django.db import models
from django.db.models import QuerySet
from apps.accounts.models import AdminUser


def get_admin_user_by_id(user_id: str) -> Optional[AdminUser]:
    """Retrieve an administrative user by their prefixed ID."""
    try:
        return AdminUser.objects.get(id=user_id)
    except AdminUser.DoesNotExist:
        return None


def get_admin_user_by_username(username: str) -> Optional[AdminUser]:
    """Retrieve an administrative user by username."""
    try:
        return AdminUser.objects.get(username=username)
    except AdminUser.DoesNotExist:
        return None


def get_admin_user_by_email(email: str) -> Optional[AdminUser]:
    """Retrieve an administrative user by email."""
    try:
        return AdminUser.objects.get(email=email.strip().lower())
    except AdminUser.DoesNotExist:
        return None


def count_active_managers() -> int:
    """Count the total number of active managers in the system."""
    return AdminUser.objects.filter(
        role=AdminUser.ROLE_MANAGER,
        is_active=True
    ).count()


def get_active_managers_locked() -> QuerySet[AdminUser]:
    """Retrieve and lock active managers for concurrency-sensitive operations."""
    return AdminUser.objects.select_for_update().filter(
        role=AdminUser.ROLE_MANAGER,
        is_active=True
    )


def list_admin_users(
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
) -> QuerySet[AdminUser]:
    """
    List administrative users with optional filters and search without N+1 overhead.
    """
    qs = AdminUser.objects.all().order_by('-created_at')

    if role:
        qs = qs.filter(role=role)

    if is_active is not None:
        qs = qs.filter(is_active=is_active)

    if search:
        search = search.strip()
        qs = qs.filter(
            models.Q(username__icontains=search)
            | models.Q(full_name__icontains=search)
            | models.Q(email__icontains=search)
        )

    return qs
