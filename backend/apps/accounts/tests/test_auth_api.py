"""
Integration and API contract tests for Admin Auth endpoints:
- POST /api/v1/admin/auth/login
- GET  /api/v1/admin/auth/me
"""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

AdminUser = get_user_model()


class AdminAuthApiTests(APITestCase):
    """Test suite for Admin JWT authentication and session inspection."""

    def setUp(self):
        self.login_url = "/api/v1/admin/auth/login"
        self.me_url = "/api/v1/admin/auth/me"
        self.logout_url = "/api/v1/admin/auth/logout"

        self.manager_password = "ManagerPassword123!"
        self.manager = AdminUser.objects.create_user(
            username="manager_tariq",
            email="manager@candyloz.ps",
            full_name="طارق علي",
            password=self.manager_password,
            role=AdminUser.ROLE_MANAGER
        )

        self.staff_password = "StaffPassword123!"
        self.staff = AdminUser.objects.create_user(
            username="staff_nour",
            email="nour@candyloz.ps",
            full_name="نور الهدى",
            password=self.staff_password,
            role=AdminUser.ROLE_STAFF
        )

        self.inactive_staff = AdminUser.objects.create_user(
            username="inactive_emp",
            email="inactive@candyloz.ps",
            full_name="موظف سابق",
            password="Password123!",
            role=AdminUser.ROLE_STAFF,
            is_active=False
        )

    def test_manager_login_success(self):
        """Manager login should return 200 OK with tokens and camelCase user profile."""
        payload = {
            "username": "manager_tariq",
            "password": self.manager_password,
        }
        response = self.client.post(self.login_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertTrue(res_data.get("success"))
        data = res_data.get("data", {})
        self.assertIn("token", data)
        self.assertIn("refresh", data)
        user_info = data.get("user", {})
        self.assertEqual(user_info.get("id"), self.manager.id)
        self.assertEqual(user_info.get("username"), "manager_tariq")
        self.assertEqual(user_info.get("fullName"), "طارق علي")
        self.assertEqual(user_info.get("email"), "manager@candyloz.ps")
        self.assertEqual(user_info.get("role"), "manager")
        self.assertTrue(user_info.get("isActive"))
        self.assertIn("createdAt", user_info)

    def test_staff_login_success(self):
        """Staff login should return 200 OK with staff role profile."""
        payload = {
            "username": "staff_nour",
            "password": self.staff_password,
        }
        response = self.client.post(self.login_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertTrue(res_data.get("success"))
        data = res_data.get("data", {})
        self.assertIn("token", data)
        user_info = data.get("user", {})
        self.assertEqual(user_info.get("username"), "staff_nour")
        self.assertEqual(user_info.get("role"), "staff")

    def test_login_invalid_password_returns_401(self):
        """Invalid password should return 401 without distinguishing username/password error."""
        payload = {
            "username": "manager_tariq",
            "password": "WrongPassword!",
        }
        response = self.client.post(self.login_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))
        self.assertEqual(res_data["error"]["code"], "INVALID_CREDENTIALS")

    def test_login_nonexistent_username_returns_401(self):
        """Nonexistent username should return 401 with generic message to prevent enumeration."""
        payload = {
            "username": "does_not_exist",
            "password": "SomePassword123!",
        }
        response = self.client.post(self.login_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))
        self.assertEqual(res_data["error"]["code"], "INVALID_CREDENTIALS")

    def test_login_deactivated_account_returns_401(self):
        """Deactivated account should be blocked from logging in with 401 error."""
        payload = {
            "username": "inactive_emp",
            "password": "Password123!",
        }
        response = self.client.post(self.login_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))
        self.assertEqual(res_data["error"]["code"], "ACCOUNT_INACTIVE")

    def test_login_missing_fields_validation_error(self):
        """Missing username or password should return 400 validation error."""
        response = self.client.post(self.login_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))
        self.assertEqual(res_data["error"]["code"], "VALIDATION_ERROR")

    def test_me_endpoint_with_valid_manager_token(self):
        """GET /me with valid manager Bearer token returns current user profile."""
        token = str(RefreshToken.for_user(self.manager).access_token)
        response = self.client.get(
            self.me_url,
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertTrue(res_data.get("success"))
        user_info = res_data.get("data", {}).get("user", {})
        self.assertEqual(user_info.get("id"), self.manager.id)
        self.assertEqual(user_info.get("username"), "manager_tariq")
        self.assertEqual(user_info.get("role"), "manager")

    def test_me_endpoint_with_valid_staff_token(self):
        """GET /me with valid staff Bearer token returns current user profile."""
        token = str(RefreshToken.for_user(self.staff).access_token)
        response = self.client.get(
            self.me_url,
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertTrue(res_data.get("success"))
        user_info = res_data.get("data", {}).get("user", {})
        self.assertEqual(user_info.get("id"), self.staff.id)
        self.assertEqual(user_info.get("username"), "staff_nour")
        self.assertEqual(user_info.get("role"), "staff")

    def test_me_endpoint_unauthenticated_returns_401(self):
        """GET /me without authorization header should return 401 Unauthorized."""
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))

    def test_me_endpoint_invalid_token_returns_401(self):
        """GET /me with malformed token should return 401 Unauthorized."""
        response = self.client.get(
            self.me_url,
            HTTP_AUTHORIZATION="Bearer invalid-token-string"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))

    def test_logout_success_blacklists_refresh_token(self):
        """POST /logout should blacklist the submitted refresh token and return 200."""
        refresh = RefreshToken.for_user(self.staff)
        access_token = str(refresh.access_token)
        refresh_str = str(refresh)

        payload = {"refresh": refresh_str}
        response = self.client.post(
            self.logout_url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {access_token}"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertTrue(res_data.get("success"))
        self.assertIn("message", res_data.get("data", {}))

        # Reusing the same blacklisted token must fail with 400 INVALID_TOKEN
        second_response = self.client.post(
            self.logout_url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {access_token}"
        )
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)
        second_data = second_response.json()
        self.assertFalse(second_data.get("success"))
        self.assertEqual(second_data["error"]["code"], "INVALID_TOKEN")

    def test_logout_unauthenticated_returns_401(self):
        """POST /logout without auth token should return 401."""
        refresh = RefreshToken.for_user(self.staff)
        response = self.client.post(
            self.logout_url,
            {"refresh": str(refresh)},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))

    def test_logout_missing_refresh_payload_returns_400(self):
        """POST /logout without refresh field in body should return 400 validation error."""
        token = str(RefreshToken.for_user(self.staff).access_token)
        response = self.client.post(
            self.logout_url,
            {},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))
        self.assertEqual(res_data["error"]["code"], "VALIDATION_ERROR")

    def test_logout_invalid_refresh_token_returns_400(self):
        """POST /logout with malformed refresh token string should return 400 INVALID_TOKEN."""
        token = str(RefreshToken.for_user(self.staff).access_token)
        response = self.client.post(
            self.logout_url,
            {"refresh": "not-a-valid-jwt-token"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))
        self.assertEqual(res_data["error"]["code"], "INVALID_TOKEN")
