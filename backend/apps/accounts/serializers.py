"""
DRF Serializers for administrative accounts authentication and user representation.
"""

from rest_framework import serializers
from apps.accounts.models import AdminUser


class AdminUserSummarySerializer(serializers.ModelSerializer):
    """
    Public administrative user profile serializer adhering to camelCase representation.
    """
    id = serializers.CharField(read_only=True)
    username = serializers.CharField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    role = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = AdminUser
        fields = [
            'id',
            'username',
            'full_name',
            'email',
            'role',
            'is_active',
            'created_at',
        ]


class AdminLoginInputSerializer(serializers.Serializer):
    """
    Input serializer for administrative login.
    """
    username = serializers.CharField(
        required=True,
        allow_blank=False,
        error_messages={
            'required': 'اسم المستخدم مطلوب',
            'blank': 'اسم المستخدم مطلوب',
        }
    )
    password = serializers.CharField(
        required=True,
        allow_blank=False,
        write_only=True,
        error_messages={
            'required': 'كلمة المرور مطلوبة',
            'blank': 'كلمة المرور مطلوبة',
        }
    )


class AdminLogoutInputSerializer(serializers.Serializer):
    """
    Input serializer for administrative logout token revocation.
    """
    refresh = serializers.CharField(
        required=True,
        allow_blank=False,
        error_messages={
            'required': 'رمز التحديث مطلوب',
            'blank': 'رمز التحديث مطلوب',
        }
    )


class AdminUserCreateInputSerializer(serializers.Serializer):
    """
    Input serializer for onboarding a new administrative user.
    """
    username = serializers.CharField(
        max_length=50,
        required=True,
        allow_blank=False,
        error_messages={
            'required': 'اسم المستخدم مطلوب',
            'blank': 'اسم المستخدم مطلوب',
        }
    )
    full_name = serializers.CharField(
        max_length=100,
        required=True,
        allow_blank=False,
        error_messages={
            'required': 'الاسم الكامل مطلوب',
            'blank': 'الاسم الكامل مطلوب',
        }
    )
    email = serializers.EmailField(
        max_length=150,
        required=True,
        allow_blank=False,
        error_messages={
            'required': 'البريد الإلكتروني مطلوب',
            'blank': 'البريد الإلكتروني مطلوب',
            'invalid': 'البريد الإلكتروني غير صالح',
        }
    )
    role = serializers.ChoiceField(
        choices=AdminUser.ROLE_CHOICES,
        default=AdminUser.ROLE_STAFF,
        required=False
    )
    is_active = serializers.BooleanField(
        default=True,
        required=False
    )

    def validate_username(self, value):
        val = value.strip()
        if len(val) < 3:
            raise serializers.ValidationError("اسم المستخدم يجب ألا يقل عن 3 أحرف")
        if AdminUser.objects.filter(username=val).exists():
            raise serializers.ValidationError("اسم المستخدم مستخدم بالفعل")
        return val

    def validate_email(self, value):
        val = value.strip().lower()
        if AdminUser.objects.filter(email=val).exists():
            raise serializers.ValidationError("البريد الإلكتروني مسجل مسبقاً")
        return val


class AdminUserDetailSerializer(serializers.ModelSerializer):
    """
    Detailed administrative user profile serializer.
    """
    id = serializers.CharField(read_only=True)
    username = serializers.CharField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    role = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = AdminUser
        fields = [
            'id',
            'username',
            'full_name',
            'email',
            'role',
            'is_active',
            'created_at',
            'updated_at',
        ]


class AdminUserUpdateInputSerializer(serializers.Serializer):
    """
    Input serializer for partial updates to administrative users.
    """
    full_name = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=False,
        error_messages={
            'blank': 'الاسم الكامل لا يمكن أن يكون فارغاً',
        }
    )
    email = serializers.EmailField(
        max_length=150,
        required=False,
        allow_blank=False,
        error_messages={
            'blank': 'البريد الإلكتروني لا يمكن أن يكون فارغاً',
            'invalid': 'البريد الإلكتروني غير صالح',
        }
    )
    role = serializers.ChoiceField(
        choices=AdminUser.ROLE_CHOICES,
        required=False
    )
    is_active = serializers.BooleanField(
        required=False
    )

    def validate_email(self, value):
        return value.strip().lower()
