"""
Administrative user model and manager for Candy Loz.
"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from apps.common.models import TimeStampedModel, generate_prefixed_id


def generate_admin_user_id() -> str:
    """Generate a prefixed ID for AdminUser ('usr_...')."""
    return generate_prefixed_id('usr')


class AdminUserManager(BaseUserManager):
    """
    Custom user manager for AdminUser handling role initialization and prefixed IDs.
    """

    def create_user(self, username, email, full_name, password=None, role=None, **extra_fields):
        if not username:
            raise ValueError("The username field is required.")
        if not email:
            raise ValueError("The email field is required.")
        if not full_name:
            raise ValueError("The full_name field is required.")

        email = self.normalize_email(email)
        username = username.strip()

        role = role or self.model.ROLE_STAFF
        extra_fields.setdefault('is_active', True)
        if role == self.model.ROLE_MANAGER:
            extra_fields.setdefault('is_staff', True)
        else:
            extra_fields.setdefault('is_staff', False)

        user = self.model(
            username=username,
            email=email,
            full_name=full_name.strip(),
            role=role,
            **extra_fields
        )
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('role', self.model.ROLE_MANAGER)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get('is_superuser') is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        if extra_fields.get('role') != self.model.ROLE_MANAGER:
            raise ValueError("Superuser must have role='manager'.")

        return self.create_user(
            username=username,
            email=email,
            full_name=full_name,
            password=password,
            **extra_fields
        )


class AdminUser(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """
    Administrative user entity for store managers and operational staff.
    """
    ROLE_MANAGER = 'manager'
    ROLE_STAFF = 'staff'
    ROLE_CHOICES = (
        (ROLE_MANAGER, 'مدير'),
        (ROLE_STAFF, 'موظف تشغيل'),
    )

    id = models.CharField(
        primary_key=True,
        max_length=32,
        default=generate_admin_user_id,
        editable=False,
        verbose_name="معرف المستخدم"
    )
    username = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name="اسم المستخدم"
    )
    full_name = models.CharField(
        max_length=100,
        verbose_name="الاسم الكامل"
    )
    email = models.EmailField(
        max_length=150,
        unique=True,
        db_index=True,
        verbose_name="البريد الإلكتروني"
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=ROLE_STAFF,
        db_index=True,
        verbose_name="الدور"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="حالة التفعيل"
    )
    is_staff = models.BooleanField(
        default=False,
        verbose_name="صلاحية الوصول للوحة الإدارة"
    )

    objects = AdminUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'full_name']

    class Meta:
        db_table = 'admin_users'
        verbose_name = 'مستخدم إداري'
        verbose_name_plural = 'المستخدمون الإداريون'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_manager(self) -> bool:
        return self.role == self.ROLE_MANAGER

    @property
    def is_operational_staff(self) -> bool:
        return self.role == self.ROLE_STAFF

    def clean(self):
        super().clean()
        if self.role == self.ROLE_MANAGER or self.is_superuser:
            self.is_staff = True

    def save(self, *args, **kwargs):
        if self.role == self.ROLE_MANAGER or self.is_superuser:
            self.is_staff = True
        super().save(*args, **kwargs)
