"""
Domain services and state-mutating workflows for administrative accounts.
"""

import secrets
from typing import Dict, Optional, Tuple
from django.db import transaction
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from apps.accounts.models import AdminUser
from apps.accounts.policies import can_manage_admin_users, can_modify_user_status_or_role
from apps.accounts.selectors import get_active_managers_locked, get_admin_user_by_username
from apps.common.exceptions import BusinessLogicError


def authenticate_admin_user(
    username: str,
    password: str
) -> Tuple[AdminUser, Dict[str, str]]:
    """
    Authenticate an administrative user with username and password.
    Returns the user and JWT tokens (access token and refresh token).

    Raises BusinessLogicError with 401 if credentials are invalid or account is deactivated.
    """
    if not username or not password:
        raise BusinessLogicError(
            message="اسم المستخدم وكلمة المرور مطلوبان",
            code="INVALID_CREDENTIALS",
            status_code=status.HTTP_401_UNAUTHORIZED
        )

    user = get_admin_user_by_username(username.strip())

    # Protect against timing attacks / user enumeration
    if user is None or not user.check_password(password):
        raise BusinessLogicError(
            message="اسم المستخدم أو كلمة المرور غير صحيحة",
            code="INVALID_CREDENTIALS",
            status_code=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:
        raise BusinessLogicError(
            message="تم تجميد هذا الحساب، يرجى التواصل مع إدارة المتجر",
            code="ACCOUNT_INACTIVE",
            status_code=status.HTTP_401_UNAUTHORIZED
        )

    refresh = RefreshToken.for_user(user)
    tokens = {
        'token': str(refresh.access_token),
        'refresh': str(refresh),
    }

    return user, tokens


def generate_temporary_password() -> str:
    """
    Generate human-readable temporary password adhering to 'CL-Temp-XXXX' pattern.
    XXXX is a 4-character cryptographic random uppercase alphanumeric code
    excluding ambiguous characters ('O', '0', 'I', '1').
    """
    unambiguous_chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    suffix = "".join(secrets.choice(unambiguous_chars) for _ in range(4))
    return f"CL-Temp-{suffix}"


def logout_admin_user(refresh_token: str) -> None:
    """
    Revoke an administrative refresh token by adding it to the server-side blacklist.
    """
    if not refresh_token:
        raise BusinessLogicError(
            message="رمز التحديث مطلوب لإتمام تسجيل الخروج",
            code="TOKEN_REQUIRED",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError:
        raise BusinessLogicError(
            message="رمز التحديث غير صالح أو منتهي الصلاحية أو تم إبطاله مسبقاً",
            code="INVALID_TOKEN",
            status_code=status.HTTP_400_BAD_REQUEST
        )


@transaction.atomic
def create_admin_user(
    actor: AdminUser,
    username: str,
    full_name: str,
    email: str,
    role: str = AdminUser.ROLE_STAFF,
    is_active: bool = True
) -> Tuple[AdminUser, str]:
    """
    Create a new administrative user with an auto-generated temporary password.
    Requires manager privileges.
    """
    if not can_manage_admin_users(actor):
        raise BusinessLogicError(
            message="ليس لديك الصلاحية لإنشاء مستخدمين إداريين",
            code="FORBIDDEN",
            status_code=status.HTTP_403_FORBIDDEN
        )

    clean_username = username.strip()
    clean_email = email.strip().lower()

    if AdminUser.objects.filter(username=clean_username).exists():
        raise BusinessLogicError(
            message="اسم المستخدم مستخدم بالفعل",
            code="DUPLICATE_USERNAME",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    if AdminUser.objects.filter(email=clean_email).exists():
        raise BusinessLogicError(
            message="البريد الإلكتروني مسجل مسبقاً",
            code="DUPLICATE_EMAIL",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    temp_password = generate_temporary_password()

    user = AdminUser.objects.create_user(
        username=clean_username,
        email=clean_email,
        full_name=full_name.strip(),
        password=temp_password,
        role=role,
        is_active=is_active
    )

    return user, temp_password


@transaction.atomic
def update_admin_user(
    actor: AdminUser,
    user_id: str,
    full_name: Optional[str] = None,
    email: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> AdminUser:
    """
    Update an administrative user profile, role, or active status.
    Protected by row locks and last active manager safeguard.
    """
    if not can_manage_admin_users(actor):
        raise BusinessLogicError(
            message="ليس لديك الصلاحية لتعديل بيانات المستخدمين",
            code="FORBIDDEN",
            status_code=status.HTTP_403_FORBIDDEN
        )

    target = AdminUser.objects.select_for_update().filter(id=user_id).first()
    if target is None:
        raise BusinessLogicError(
            message="المستخدم المطلوب غير موجود",
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND
        )

    is_role_changing = role is not None and role != target.role
    is_active_changing = is_active is not None and is_active != target.is_active

    if target.role == AdminUser.ROLE_MANAGER and (is_role_changing or is_active_changing):
        # Lock and count active managers to prevent concurrent last-manager deactivation
        active_managers = list(get_active_managers_locked())
        active_count = len(active_managers)

        if not can_modify_user_status_or_role(
            actor=actor,
            target=target,
            new_role=role,
            new_is_active=is_active,
            active_manager_count=active_count
        ):
            raise BusinessLogicError(
                message="لا يمكن تجميد أو تخفيض صلاحيات آخر مدير نشط في النظام",
                code="CANNOT_DEACTIVATE_LAST_MANAGER",
                status_code=status.HTTP_400_BAD_REQUEST
            )

    if email is not None:
        clean_email = email.strip().lower()
        if clean_email != target.email:
            if AdminUser.objects.filter(email=clean_email).exclude(id=target.id).exists():
                raise BusinessLogicError(
                    message="البريد الإلكتروني مسجل مسبقاً لمستخدم آخر",
                    code="DUPLICATE_EMAIL",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            target.email = clean_email

    if full_name is not None:
        target.full_name = full_name.strip()

    if role is not None:
        target.role = role

    if is_active is not None:
        target.is_active = is_active

    target.save()
    return target


@transaction.atomic
def reset_admin_user_password(
    actor: AdminUser,
    user_id: str
) -> Tuple[AdminUser, str]:
    """
    Reset password for an administrative user and generate a new temporary password.
    Requires manager privileges.
    """
    if not can_manage_admin_users(actor):
        raise BusinessLogicError(
            message="ليس لديك الصلاحية لإعادة تعيين كلمة المرور",
            code="FORBIDDEN",
            status_code=status.HTTP_403_FORBIDDEN
        )

    target = AdminUser.objects.filter(id=user_id).first()
    if target is None:
        raise BusinessLogicError(
            message="المستخدم المطلوب غير موجود",
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND
        )

    temp_password = generate_temporary_password()
    target.set_password(temp_password)
    target.save()

    return target, temp_password
