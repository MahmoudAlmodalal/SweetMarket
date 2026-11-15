"""
Declarative Django REST Framework permissions for administrative endpoints.
"""

from rest_framework.permissions import BasePermission
from apps.accounts.policies import can_access_admin, can_manage_admin_users


class IsAdminAuthenticated(BasePermission):
    """
    Allows access only to authenticated and active administrative users.
    """
    message = "يجب تسجيل الدخول بحساب إداري نشط للمتابعة"

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
        )


class IsStaffOrManager(BasePermission):
    """
    Allows access to both operational staff and store managers.
    """
    message = "ليس لديك الصلاحية الكافية للوصول إلى هذا المورد الإداري"

    def has_permission(self, request, view):
        return can_access_admin(request.user)


class IsManager(BasePermission):
    """
    Allows access strictly to store managers.
    """
    message = "هذا الإجراء مخصص لمدير المتجر فقط"

    def has_permission(self, request, view):
        return can_manage_admin_users(request.user)
