"""
Comprehensive model tests for AdminUser and AdminUserManager in apps.accounts.
"""

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase

AdminUser = get_user_model()


class AdminUserModelTests(TestCase):
    """Test suite for AdminUser model attributes, ID generation, and properties."""

    def test_default_id_generation_prefixed_usr(self):
        """AdminUser should automatically generate a 32-character ID prefixed with 'usr_'."""
        user = AdminUser.objects.create_user(
            username="khalid",
            email="khalid@candyloz.ps",
            full_name="خالد أحمد",
            password="SecurePassword123!"
        )
        self.assertIsNotNone(user.id)
        self.assertTrue(user.id.startswith("usr_"))
        self.assertEqual(len(user.id), 32)

    def test_unique_prefixed_ids_across_instances(self):
        """Multiple users must receive distinct unique prefixed IDs."""
        u1 = AdminUser.objects.create_user(
            username="user1",
            email="u1@candyloz.ps",
            full_name="مستخدم 1",
            password="Password123!"
        )
        u2 = AdminUser.objects.create_user(
            username="user2",
            email="u2@candyloz.ps",
            full_name="مستخدم 2",
            password="Password123!"
        )
        self.assertNotEqual(u1.id, u2.id)

    def test_default_role_and_active_status(self):
        """Newly created admin user should default to staff role and active status."""
        user = AdminUser.objects.create_user(
            username="sami",
            email="sami@candyloz.ps",
            full_name="سامي يوسف",
            password="Password123!"
        )
        self.assertEqual(user.role, AdminUser.ROLE_STAFF)
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.is_operational_staff)
        self.assertFalse(user.is_manager)

    def test_manager_role_and_helper_properties(self):
        """Manager role user should reflect manager properties and is_staff flag."""
        manager = AdminUser.objects.create_user(
            username="nadia",
            email="nadia@candyloz.ps",
            full_name="نادية خليل",
            password="Password123!",
            role=AdminUser.ROLE_MANAGER
        )
        self.assertEqual(manager.role, AdminUser.ROLE_MANAGER)
        self.assertTrue(manager.is_manager)
        self.assertFalse(manager.is_operational_staff)
        self.assertTrue(manager.is_staff)

    def test_str_representation(self):
        """String representation should format as 'username (role_display)'."""
        user = AdminUser.objects.create_user(
            username="tariq",
            email="tariq@candyloz.ps",
            full_name="طارق علي",
            password="Password123!",
            role=AdminUser.ROLE_MANAGER
        )
        self.assertEqual(str(user), "tariq (مدير)")

    def test_timestamps_managed_by_timestamped_model(self):
        """AdminUser should record created_at and updated_at."""
        user = AdminUser.objects.create_user(
            username="layla",
            email="layla@candyloz.ps",
            full_name="ليلى محمود",
            password="Password123!"
        )
        self.assertIsNotNone(user.created_at)
        self.assertIsNotNone(user.updated_at)
        old_updated_at = user.updated_at

        user.full_name = "ليلى أحمد محمود"
        user.save()
        user.refresh_from_db()
        self.assertGreaterEqual(user.updated_at, old_updated_at)

    def test_db_table_is_admin_users(self):
        """Database table must be explicitly set to 'admin_users'."""
        self.assertEqual(AdminUser._meta.db_table, "admin_users")

    def test_unique_username_constraint(self):
        """Duplicate usernames must raise IntegrityError."""
        AdminUser.objects.create_user(
            username="duplicate_user",
            email="first@candyloz.ps",
            full_name="مستخدم أول",
            password="Password123!"
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                AdminUser.objects.create_user(
                    username="duplicate_user",
                    email="second@candyloz.ps",
                    full_name="مستخدم ثاني",
                    password="Password123!"
                )

    def test_unique_email_constraint(self):
        """Duplicate emails must raise IntegrityError."""
        AdminUser.objects.create_user(
            username="user_one",
            email="duplicate@candyloz.ps",
            full_name="مستخدم أول",
            password="Password123!"
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                AdminUser.objects.create_user(
                    username="user_two",
                    email="duplicate@candyloz.ps",
                    full_name="مستخدم ثاني",
                    password="Password123!"
                )


class AdminUserManagerTests(TestCase):
    """Test suite for AdminUserManager creation workflows and validation."""

    def test_create_user_success_with_password(self):
        """create_user should hash password and normalize email."""
        user = AdminUser.objects.create_user(
            username="staff1",
            email="STAFF1@CANDYLOZ.PS",
            full_name="موظف أول",
            password="PlainTextPassword123"
        )
        self.assertEqual(user.email, "STAFF1@candyloz.ps")
        self.assertNotEqual(user.password, "PlainTextPassword123")
        self.assertTrue(user.check_password("PlainTextPassword123"))

    def test_create_user_without_password(self):
        """create_user without password should set unusable password."""
        user = AdminUser.objects.create_user(
            username="nopass",
            email="nopass@candyloz.ps",
            full_name="بدون كلمة سر"
        )
        self.assertFalse(user.has_usable_password())

    def test_create_user_missing_username_raises_value_error(self):
        """create_user without username should raise ValueError."""
        with self.assertRaisesMessage(ValueError, "The username field is required."):
            AdminUser.objects.create_user(
                username="",
                email="test@candyloz.ps",
                full_name="اسم تجريبي"
            )

    def test_create_user_missing_email_raises_value_error(self):
        """create_user without email should raise ValueError."""
        with self.assertRaisesMessage(ValueError, "The email field is required."):
            AdminUser.objects.create_user(
                username="valid_user",
                email="",
                full_name="اسم تجريبي"
            )

    def test_create_user_missing_full_name_raises_value_error(self):
        """create_user without full_name should raise ValueError."""
        with self.assertRaisesMessage(ValueError, "The full_name field is required."):
            AdminUser.objects.create_user(
                username="valid_user",
                email="test@candyloz.ps",
                full_name=""
            )

    def test_create_superuser_success(self):
        """create_superuser must create a manager with is_superuser and is_staff set to True."""
        admin = AdminUser.objects.create_superuser(
            username="superadmin",
            email="superadmin@candyloz.ps",
            full_name="المدير العام",
            password="SuperSecurePassword123!"
        )
        self.assertEqual(admin.role, AdminUser.ROLE_MANAGER)
        self.assertTrue(admin.is_manager)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_active)

    def test_create_superuser_validation_failures(self):
        """create_superuser should raise ValueError if superuser flags are overridden to False."""
        with self.assertRaisesMessage(ValueError, "Superuser must have is_superuser=True."):
            AdminUser.objects.create_superuser(
                username="bad_super",
                email="bad_super@candyloz.ps",
                full_name="مشرف غير صالح",
                password="Password123!",
                is_superuser=False
            )

        with self.assertRaisesMessage(ValueError, "Superuser must have is_staff=True."):
            AdminUser.objects.create_superuser(
                username="bad_staff",
                email="bad_staff@candyloz.ps",
                full_name="مشرف غير صالح",
                password="Password123!",
                is_staff=False
            )

        with self.assertRaisesMessage(ValueError, "Superuser must have role='manager'."):
            AdminUser.objects.create_superuser(
                username="bad_role",
                email="bad_role@candyloz.ps",
                full_name="مشرف غير صالح",
                password="Password123!",
                role=AdminUser.ROLE_STAFF
            )
