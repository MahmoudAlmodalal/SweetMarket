"""
URL patterns for administrative accounts and authentication.
"""

from django.urls import path
from apps.accounts.views import (
    AdminLoginView,
    AdminLogoutView,
    AdminMeView,
    AdminUserDetailView,
    AdminUserListCreateView,
    AdminUserResetPasswordView,
)

urlpatterns = [
    path('auth/login', AdminLoginView.as_view(), name='admin-auth-login'),
    path('auth/login/', AdminLoginView.as_view(), name='admin-auth-login-slash'),
    path('auth/me', AdminMeView.as_view(), name='admin-auth-me'),
    path('auth/me/', AdminMeView.as_view(), name='admin-auth-me-slash'),
    path('auth/logout', AdminLogoutView.as_view(), name='admin-auth-logout'),
    path('auth/logout/', AdminLogoutView.as_view(), name='admin-auth-logout-slash'),
    path('users', AdminUserListCreateView.as_view(), name='admin-users-list-create'),
    path('users/', AdminUserListCreateView.as_view(), name='admin-users-list-create-slash'),
    path('users/<str:id>', AdminUserDetailView.as_view(), name='admin-users-detail'),
    path('users/<str:id>/', AdminUserDetailView.as_view(), name='admin-users-detail-slash'),
    path('users/<str:id>/reset-password', AdminUserResetPasswordView.as_view(), name='admin-users-reset-password'),
    path('users/<str:id>/reset-password/', AdminUserResetPasswordView.as_view(), name='admin-users-reset-password-slash'),
]
