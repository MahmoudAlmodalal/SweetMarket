def can_manage_delivery_zones(user) -> bool:
    """
    Pure Python authorization policy:
    Determines if user is authorized to create or modify delivery zone entities.
    Only authenticated users with role 'manager' (or superusers) are authorized.
    """
    if not user or not user.is_authenticated:
        return False
    if getattr(user, 'is_superuser', False):
        return True
    return getattr(user, 'role', None) == 'manager'


def can_view_admin_delivery_zones(user) -> bool:
    """
    Pure Python authorization policy:
    Determines if user is authorized to view administrative delivery zones registry.
    Authenticated users with role 'staff' or 'manager' (or superusers/staff) are authorized.
    """
    if not user or not user.is_authenticated:
        return False
    if getattr(user, 'is_superuser', False):
        return True
    role = getattr(user, 'role', None)
    if role in ('staff', 'manager'):
        return True
    if getattr(user, 'is_staff', False):
        return True
    return False
