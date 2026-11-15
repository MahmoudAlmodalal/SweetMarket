"""
Business authorization policies for Candy Loz catalog.
"""
from apps.common.exceptions import BusinessLogicError


def can_manage_catalog(user) -> bool:
    """
    Enforce that catalog entity authoring and destructive actions
    are restricted to authenticated users with the 'manager' role or superuser.
    """
    if not user or not user.is_authenticated:
        return False
    role = getattr(user, 'role', None)
    return role == 'manager' or getattr(user, 'is_superuser', False)


def can_toggle_availability(user) -> bool:
    """
    Permit both 'staff' and 'manager' roles to modify product kitchen availability (FR-022).
    """
    if not user or not user.is_authenticated:
        return False
    role = getattr(user, 'role', None)
    return (
        role in ('staff', 'manager')
        or getattr(user, 'is_staff', False)
        or getattr(user, 'is_superuser', False)
    )


def can_delete_category(user, category) -> bool:
    """
    Enforce manager role and block category deletion if products remain linked to it.
    """
    if not can_manage_catalog(user):
        return False

    if category.products.exists():
        raise BusinessLogicError(
            message="لا يمكن حذف التصنيف لوجود منتجات مرتبطة به",
            code="CATEGORY_HAS_PRODUCTS",
            status_code=400,
        )
    return True
