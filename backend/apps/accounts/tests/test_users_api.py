"""
Integration and API contract tests for Admin User Directory and Onboarding (T-49):
- GET  /api/v1/admin/users
- POST /api/v1/admin/users
"""

import re
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from apps.accounts.services import generate_temporary_password

AdminUser = get_user_model()


class TemporaryPasswordGeneratorTests(APITestCase):
    """Unit tests for the CL-Temp-XXXX temporary password utility."""

    def test_temporary_password_pattern_and_character_restrictions(self):
        """Temporary passwords must match CL-Temp-XXXX and exclude ambiguous chars (0, O, 1, I)."""
        pattern = re.compile(r"^CL-Temp-[2-9A-HJ-NP-Z]{4}$")
        passwords = set()

        for _ in range(100):
            pw = generate_temporary_password()
            self.assertEqual(len(pw), 12)
            self.assertTrue(pattern.match(pw), f"Password '{pw}' did not match pattern.")
            self.assertNotIn("0", pw)
            self.assertNotIn("O", pw)
            self.assertNotIn("1", pw)
            self.assertNotIn("I", pw)
            passwords.add(pw)

        # High entropy check: out of 100 random codes, duplicates should be rare/unlikely
        self.assertGreater(len(passwords), 90)


class AdminUserDirectoryApiTests(APITestCase):
    """Test suite for GET /api/v1/admin/users."""

    def setUp(self):
        self.users_url = "/api/v1/admin/users"

        self.manager = AdminUser.objects.create_user(
            username="manager_main",
            email="manager_main@candyloz.ps",
            full_name="مدير رئيسي",
            password="Password123!",
            role=AdminUser.ROLE_MANAGER
        )
        self.manager_token = str(RefreshToken.for_user(self.manager).access_token)

        self.staff1 = AdminUser.objects.create_user(
            username="staff_amal",
            email="amal@candyloz.ps",
            full_name="أمل خليل",
            password="Password123!",
            role=AdminUser.ROLE_STAFF,
            is_active=True
        )
        self.staff1_token = str(RefreshToken.for_user(self.staff1).access_token)

        self.staff_inactive = AdminUser.objects.create_user(
            username="staff_legacy",
            email="legacy@candyloz.ps",
            full_name="موظف قديم",
            password="Password123!",
            role=AdminUser.ROLE_STAFF,
            is_active=False
        )

    def test_manager_can_list_all_admin_users_with_pagination(self):
        """Manager should retrieve paginated users list with meta envelope."""
        response = self.client.get(
            self.users_url,
            HTTP_AUTHORIZATION=f"Bearer {self.manager_token}"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertTrue(res_data.get("success"))
        data = res_data.get("data", [])
        self.assertEqual(len(data), 3)

        meta = res_data.get("meta", {})
        self.assertEqual(meta.get("page"), 1)
        self.assertEqual(meta.get("totalItems"), 3)

    def test_filter_by_role(self):
        """Filtering by role should isolate managers or staff."""
        response = self.client.get(
            f"{self.users_url}?role=manager",
            HTTP_AUTHORIZATION=f"Bearer {self.manager_token}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json().get("data", [])
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["username"], "manager_main")

    def test_filter_by_is_active(self):
        """Filtering by isActive or status should isolate active/inactive users."""
        response = self.client.get(
            f"{self.users_url}?isActive=false",
            HTTP_AUTHORIZATION=f"Bearer {self.manager_token}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json().get("data", [])
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["username"], "staff_legacy")

    def test_search_by_username_or_name(self):
        """Search query should match username, full name, or email."""
        response = self.client.get(
            f"{self.users_url}?search=أمل",
            HTTP_AUTHORIZATION=f"Bearer {self.manager_token}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json().get("data", [])
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["username"], "staff_amal")

    def test_staff_cannot_list_users_forbidden_403(self):
        """Staff user must be rejected with 403 Forbidden."""
        response = self.client.get(
            self.users_url,
            HTTP_AUTHORIZATION=f"Bearer {self.staff1_token}"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))
        self.assertEqual(res_data["error"]["code"], "FORBIDDEN")

    def test_unauthenticated_cannot_list_users_401(self):
        """Unauthenticated request must be rejected with 401 Unauthorized."""
        response = self.client.get(self.users_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AdminUserOnboardingApiTests(APITestCase):
    """Test suite for POST /api/v1/admin/users."""

    def setUp(self):
        self.users_url = "/api/v1/admin/users"
        self.login_url = "/api/v1/admin/auth/login"

        self.manager = AdminUser.objects.create_user(
            username="head_manager",
            email="head@candyloz.ps",
            full_name="رئيس الإدارة",
            password="Password123!",
            role=AdminUser.ROLE_MANAGER
        )
        self.manager_token = str(RefreshToken.for_user(self.manager).access_token)

        self.staff = AdminUser.objects.create_user(
            username="regular_staff",
            email="staff@candyloz.ps",
            full_name="موظف عادي",
            password="Password123!",
            role=AdminUser.ROLE_STAFF
        )
        self.staff_token = str(RefreshToken.for_user(self.staff).access_token)

    def test_manager_can_create_user_and_login_with_temp_password(self):
        """Creating a user generates CL-Temp-XXXX and allows immediate login with it."""
        payload = {
            "username": "new_chef",
            "fullName": "الشيف حسام",
            "email": "hossam@candyloz.ps",
            "role": "staff",
            "isActive": True
        }
        response = self.client.post(
            self.users_url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.manager_token}"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        res_data = response.json()
        self.assertTrue(res_data.get("success"))
        data = res_data.get("data", {})

        user_info = data.get("user", {})
        self.assertTrue(user_info.get("id").startswith("usr_"))
        self.assertEqual(user_info.get("username"), "new_chef")
        self.assertEqual(user_info.get("fullName"), "الشيف حسام")
        self.assertEqual(user_info.get("email"), "hossam@candyloz.ps")
        self.assertEqual(user_info.get("role"), "staff")

        temp_password = data.get("temporaryPassword")
        self.assertTrue(temp_password.startswith("CL-Temp-"))

        # Verify immediate login with temporary password
        login_res = self.client.post(
            self.login_url,
            {"username": "new_chef", "password": temp_password},
            format="json"
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertTrue(login_res.json().get("success"))

    def test_create_user_duplicate_username_returns_400(self):
        """Duplicate username should return 400 Bad Request."""
        payload = {
            "username": "head_manager",
            "fullName": "نسخة مكررة",
            "email": "unique@candyloz.ps",
            "role": "staff"
        }
        response = self.client.post(
            self.users_url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.manager_token}"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))
        self.assertEqual(res_data["error"]["code"], "VALIDATION_ERROR")

    def test_create_user_duplicate_email_returns_400(self):
        """Duplicate email should return 400 Bad Request."""
        payload = {
            "username": "unique_username",
            "fullName": "نسخة مكررة",
            "email": "head@candyloz.ps",
            "role": "staff"
        }
        response = self.client.post(
            self.users_url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.manager_token}"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))
        self.assertEqual(res_data["error"]["code"], "VALIDATION_ERROR")

    def test_staff_cannot_create_user_forbidden_403(self):
        """Staff user must be rejected with 403 Forbidden."""
        payload = {
            "username": "unauthorized_create",
            "fullName": "غير مصرح",
            "email": "unauth@candyloz.ps",
            "role": "staff"
        }
        response = self.client.post(
            self.users_url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.staff_token}"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))
        self.assertEqual(res_data["error"]["code"], "FORBIDDEN")

    def test_unauthenticated_cannot_create_user_401(self):
        """Unauthenticated client must be rejected with 401 Unauthorized."""
        response = self.client.post(self.users_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
