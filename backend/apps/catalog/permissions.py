"""
DRF permissions for Candy Loz catalog.
"""
from rest_framework.permissions import BasePermission
from apps.catalog.policies import can_manage_catalog, can_toggle_availability


class IsManager(BasePermission):
    """
    Allows access only to authenticated users with the manager role.
    """
    message = "هذا الإجراء مخصص للمدير فقط"

    def has_permission(self, request, view):
        return bool(request.user and can_manage_catalog(request.user))


class IsStaffOrManager(BasePermission):
    """
    Allows access to authenticated staff or managers.
    """
    message = "هذا الإجراء يتطلب صلاحية موظف أو مدير"

    def has_permission(self, request, view):
        return bool(request.user and can_toggle_availability(request.user))
