"""
Integration and API contract tests for Admin User Mutations, Last-Manager Guard,
and Password Reset (T-50):
- GET   /api/v1/admin/users/<id>
- PATCH /api/v1/admin/users/<id>
- POST  /api/v1/admin/users/<id>/reset-password
"""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

AdminUser = get_user_model()


class AdminUserMutationsApiTests(APITestCase):
    """Test suite for GET/PATCH user details and last-manager deactivation guard."""

    def setUp(self):
        self.login_url = "/api/v1/admin/auth/login"

        self.manager1 = AdminUser.objects.create_user(
            username="manager_tariq",
            email="tariq@candyloz.ps",
            full_name="طارق علي",
            password="ManagerPassword123!",
            role=AdminUser.ROLE_MANAGER,
            is_active=True
        )
        self.manager1_token = str(RefreshToken.for_user(self.manager1).access_token)

        self.manager2 = AdminUser.objects.create_user(
            username="manager_nadia",
            email="nadia@candyloz.ps",
            full_name="نادية خليل",
            password="ManagerPassword123!",
            role=AdminUser.ROLE_MANAGER,
            is_active=True
        )
        self.manager2_token = str(RefreshToken.for_user(self.manager2).access_token)

        self.staff = AdminUser.objects.create_user(
            username="staff_nour",
            email="nour@candyloz.ps",
            full_name="نور الهدى",
            password="StaffPassword123!",
            role=AdminUser.ROLE_STAFF,
            is_active=True
        )
        self.staff_token = str(RefreshToken.for_user(self.staff).access_token)

    def test_get_user_detail_success(self):
        """Manager can inspect full user profile including timestamps."""
        url = f"/api/v1/admin/users/{self.staff.id}"
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f"Bearer {self.manager1_token}"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertTrue(res_data.get("success"))
        user_info = res_data.get("data", {}).get("user", {})
        self.assertEqual(user_info.get("id"), self.staff.id)
        self.assertEqual(user_info.get("username"), "staff_nour")
        self.assertEqual(user_info.get("fullName"), "نور الهدى")
        self.assertEqual(user_info.get("email"), "nour@candyloz.ps")
        self.assertEqual(user_info.get("role"), "staff")
        self.assertIn("createdAt", user_info)
        self.assertIn("updatedAt", user_info)

    def test_get_user_detail_not_found(self):
        """Requesting non-existent user returns 404 NOT_FOUND."""
        url = "/api/v1/admin/users/usr_does_not_exist"
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f"Bearer {self.manager1_token}"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))
        self.assertEqual(res_data["error"]["code"], "NOT_FOUND")

    def test_patch_user_profile_fields(self):
        """Manager can partially update fullName and email."""
        url = f"/api/v1/admin/users/{self.staff.id}"
        payload = {
            "fullName": "نور الهدى مصطفى",
            "email": "nour.new@candyloz.ps"
        }
        response = self.client.patch(
            url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.manager1_token}"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertTrue(res_data.get("success"))
        user_info = res_data.get("data", {}).get("user", {})
        self.assertEqual(user_info.get("fullName"), "نور الهدى مصطفى")
        self.assertEqual(user_info.get("email"), "nour.new@candyloz.ps")

    def test_patch_user_duplicate_email_rejected(self):
        """Updating email to one already registered by another user returns 400 DUPLICATE_EMAIL."""
        url = f"/api/v1/admin/users/{self.staff.id}"
        payload = {
            "email": "tariq@candyloz.ps"
        }
        response = self.client.patch(
            url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.manager1_token}"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))
        self.assertEqual(res_data["error"]["code"], "DUPLICATE_EMAIL")

    def test_patch_deactivate_staff_blocks_subsequent_login(self):
        """Deactivating staff via PATCH immediately prevents them from logging in."""
        url = f"/api/v1/admin/users/{self.staff.id}"
        payload = {"isActive": False}
        response = self.client.patch(
            url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.manager1_token}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.json()["data"]["user"]["isActive"])

        # Immediate login attempt must fail with 401 ACCOUNT_INACTIVE
        login_res = self.client.post(
            self.login_url,
            {"username": "staff_nour", "password": "StaffPassword123!"},
            format="json"
        )
        self.assertEqual(login_res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(login_res.json()["error"]["code"], "ACCOUNT_INACTIVE")

    def test_last_active_manager_deactivation_guard(self):
        """Attempting to deactivate or demote the sole active manager must fail with 400 CANNOT_DEACTIVATE_LAST_MANAGER."""
        # 1. With 2 active managers, deactivating manager2 succeeds
        url_mgr2 = f"/api/v1/admin/users/{self.manager2.id}"
        res1 = self.client.patch(
            url_mgr2,
            {"isActive": False},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.manager1_token}"
        )
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        # 2. Now only manager1 is active. Attempting to deactivate manager1 must be rejected
        url_mgr1 = f"/api/v1/admin/users/{self.manager1.id}"
        res2 = self.client.patch(
            url_mgr1,
            {"isActive": False},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.manager1_token}"
        )
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        res2_data = res2.json()
        self.assertFalse(res2_data.get("success"))
        self.assertEqual(res2_data["error"]["code"], "CANNOT_DEACTIVATE_LAST_MANAGER")

        # 3. Attempting to demote manager1 to staff must also be rejected
        res3 = self.client.patch(
            url_mgr1,
            {"role": "staff"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.manager1_token}"
        )
        self.assertEqual(res3.status_code, status.HTTP_400_BAD_REQUEST)
        res3_data = res3.json()
        self.assertFalse(res3_data.get("success"))
        self.assertEqual(res3_data["error"]["code"], "CANNOT_DEACTIVATE_LAST_MANAGER")

    def test_staff_cannot_mutate_users_forbidden(self):
        """Staff members are strictly prohibited from mutating user details (403 Forbidden)."""
        url = f"/api/v1/admin/users/{self.staff.id}"
        response = self.client.patch(
            url,
            {"fullName": "تعديل غير مصرح"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.staff_token}"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))
        self.assertEqual(res_data["error"]["code"], "FORBIDDEN")


class AdminUserResetPasswordApiTests(APITestCase):
    """Test suite for POST /api/v1/admin/users/<id>/reset-password."""

    def setUp(self):
        self.login_url = "/api/v1/admin/auth/login"

        self.manager = AdminUser.objects.create_user(
            username="manager_main",
            email="manager@candyloz.ps",
            full_name="المدير الرئيسي",
            password="ManagerPassword123!",
            role=AdminUser.ROLE_MANAGER
        )
        self.manager_token = str(RefreshToken.for_user(self.manager).access_token)

        self.staff = AdminUser.objects.create_user(
            username="staff_locked",
            email="locked@candyloz.ps",
            full_name="موظف نسي كلمة المرور",
            password="OldPassword123!",
            role=AdminUser.ROLE_STAFF
        )
        self.staff_token = str(RefreshToken.for_user(self.staff).access_token)

    def test_reset_password_generates_new_temporary_password(self):
        """Resetting password sets new CL-Temp-XXXX and allows login with it."""
        url = f"/api/v1/admin/users/{self.staff.id}/reset-password"
        response = self.client.post(
            url,
            {},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.manager_token}"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertTrue(res_data.get("success"))
        data = res_data.get("data", {})
        temp_password = data.get("temporaryPassword")
        self.assertTrue(temp_password.startswith("CL-Temp-"))

        # Old password must no longer work
        old_login_res = self.client.post(
            self.login_url,
            {"username": "staff_locked", "password": "OldPassword123!"},
            format="json"
        )
        self.assertEqual(old_login_res.status_code, status.HTTP_401_UNAUTHORIZED)

        # New temporary password works immediately
        new_login_res = self.client.post(
            self.login_url,
            {"username": "staff_locked", "password": temp_password},
            format="json"
        )
        self.assertEqual(new_login_res.status_code, status.HTTP_200_OK)
        self.assertTrue(new_login_res.json().get("success"))

    def test_reset_password_not_found(self):
        """Resetting password for non-existent user returns 404 NOT_FOUND."""
        url = "/api/v1/admin/users/usr_nonexistent/reset-password"
        response = self.client.post(
            url,
            {},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.manager_token}"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))
        self.assertEqual(res_data["error"]["code"], "NOT_FOUND")

    def test_staff_cannot_reset_password_forbidden_403(self):
        """Staff user cannot trigger password resets (403 Forbidden)."""
        url = f"/api/v1/admin/users/{self.staff.id}/reset-password"
        response = self.client.post(
            url,
            {},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.staff_token}"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        res_data = response.json()
        self.assertFalse(res_data.get("success"))
        self.assertEqual(res_data["error"]["code"], "FORBIDDEN")
