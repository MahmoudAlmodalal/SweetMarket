from rest_framework import exceptions, permissions
from apps.delivery.policies import can_manage_delivery_zones, can_view_admin_delivery_zones


class IsStaffOrManager(permissions.BasePermission):
    """
    DRF permission class restricting access to authenticated Staff or Managers.
    Raises NotAuthenticated (401) for unauthenticated requests and
    PermissionDenied (403) for unauthorized roles.
    """
    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            raise exceptions.NotAuthenticated("غير مصرح، يرجى تسجيل الدخول للوصول إلى هذا المورد.")
        if not can_view_admin_delivery_zones(request.user):
            raise exceptions.PermissionDenied("ليس لديك الصلاحية الكافية لعرض مناطق التوصيل الإدارية.")
        return True


class IsManager(permissions.BasePermission):
    """
    DRF permission class restricting access strictly to Managers.
    Raises NotAuthenticated (401) for unauthenticated requests and
    PermissionDenied (403) for non-manager roles (such as staff).
    """
    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            raise exceptions.NotAuthenticated("غير مصرح، يرجى تسجيل الدخول للوصول إلى هذا المورد.")
        if not can_manage_delivery_zones(request.user):
            raise exceptions.PermissionDenied("يتطلب هذا الإجراء صلاحية مدير المتجر.")
        return True
