"""
Thin Django REST Framework views coordinating admin authentication.
"""

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.models import AdminUser
from apps.accounts.permissions import IsManager, IsStaffOrManager
from apps.accounts.selectors import get_admin_user_by_id, list_admin_users
from apps.accounts.serializers import (
    AdminLoginInputSerializer,
    AdminLogoutInputSerializer,
    AdminUserCreateInputSerializer,
    AdminUserDetailSerializer,
    AdminUserSummarySerializer,
    AdminUserUpdateInputSerializer,
)
from apps.accounts.services import (
    authenticate_admin_user,
    create_admin_user,
    logout_admin_user,
    reset_admin_user_password,
    update_admin_user,
)
from apps.common.exceptions import BusinessLogicError
from apps.common.pagination import StandardPagination


class AdminLoginView(APIView):
    """
    POST /api/v1/admin/auth/login
    Public endpoint to authenticate administrative staff/managers.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = AdminLoginInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user, tokens = authenticate_admin_user(username=username, password=password)
        user_data = AdminUserSummarySerializer(user).data

        return Response(
            {
                'token': tokens['token'],
                'refresh': tokens['refresh'],
                'user': user_data,
            },
            status=status.HTTP_200_OK
        )


class AdminMeView(APIView):
    """
    GET /api/v1/admin/auth/me
    Protected endpoint to verify administrative session and fetch current user profile.
    """
    permission_classes = [IsStaffOrManager]

    def get(self, request, *args, **kwargs):
        user_data = AdminUserSummarySerializer(request.user).data
        return Response(
            {
                'user': user_data,
            },
            status=status.HTTP_200_OK
        )


class AdminLogoutView(APIView):
    """
    POST /api/v1/admin/auth/logout
    Protected endpoint to blacklist refresh tokens and terminate session.
    """
    permission_classes = [IsStaffOrManager]

    def post(self, request, *args, **kwargs):
        serializer = AdminLogoutInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refresh_token = serializer.validated_data['refresh']
        logout_admin_user(refresh_token=refresh_token)

        return Response(
            {
                'message': 'تم تسجيل الخروج بنجاح وإبطال الرمز',
            },
            status=status.HTTP_200_OK
        )


class AdminUserListCreateView(APIView):
    """
    GET  /api/v1/admin/users
    POST /api/v1/admin/users
    Protected administrative user directory and onboarding (Manager only).
    """
    permission_classes = [IsManager]

    def get(self, request, *args, **kwargs):
        role = request.query_params.get('role')
        is_active_param = request.query_params.get('isActive')
        status_param = request.query_params.get('status')
        search = request.query_params.get('search')

        is_active = None
        if is_active_param is not None:
            is_active = is_active_param.lower() in ('true', '1', 'yes')
        elif status_param is not None:
            if status_param.lower() == 'active':
                is_active = True
            elif status_param.lower() == 'inactive':
                is_active = False

        qs = list_admin_users(role=role, is_active=is_active, search=search)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = AdminUserSummarySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, *args, **kwargs):
        serializer = AdminUserCreateInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user, temporary_password = create_admin_user(
            actor=request.user,
            username=serializer.validated_data['username'],
            full_name=serializer.validated_data['full_name'],
            email=serializer.validated_data['email'],
            role=serializer.validated_data.get('role', AdminUser.ROLE_STAFF),
            is_active=serializer.validated_data.get('is_active', True)
        )

        user_data = AdminUserSummarySerializer(user).data
        return Response(
            {
                'user': user_data,
                'temporaryPassword': temporary_password,
            },
            status=status.HTTP_201_CREATED
        )


class AdminUserDetailView(APIView):
    """
    GET   /api/v1/admin/users/<id>
    PATCH /api/v1/admin/users/<id>
    Retrieve or partially update administrative user details (Manager only).
    """
    permission_classes = [IsManager]

    def get(self, request, id, *args, **kwargs):
        user = get_admin_user_by_id(id)
        if user is None:
            raise BusinessLogicError(
                message="المستخدم المطلوب غير موجود",
                code="NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND
            )

        user_data = AdminUserDetailSerializer(user).data
        return Response({'user': user_data}, status=status.HTTP_200_OK)

    def patch(self, request, id, *args, **kwargs):
        serializer = AdminUserUpdateInputSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        user = update_admin_user(
            actor=request.user,
            user_id=id,
            full_name=serializer.validated_data.get('full_name'),
            email=serializer.validated_data.get('email'),
            role=serializer.validated_data.get('role'),
            is_active=serializer.validated_data.get('is_active')
        )

        user_data = AdminUserDetailSerializer(user).data
        return Response({'user': user_data}, status=status.HTTP_200_OK)


class AdminUserResetPasswordView(APIView):
    """
    POST /api/v1/admin/users/<id>/reset-password
    Reset user password and return new temporary password (Manager only).
    """
    permission_classes = [IsManager]

    def post(self, request, id, *args, **kwargs):
        user, temporary_password = reset_admin_user_password(
            actor=request.user,
            user_id=id
        )

        user_data = AdminUserSummarySerializer(user).data
        return Response(
            {
                'user': user_data,
                'temporaryPassword': temporary_password,
            },
            status=status.HTTP_200_OK
        )
