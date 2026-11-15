"""
Centralized exception handler for Candy Loz REST API.
Converts all DRF, HTTP, and domain exceptions into unified error envelopes:
{
    "success": False,
    "error": {
        "code": "...",
        "message": "...",
        "details": [...]
    }
}
"""

import logging
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler
from apps.common.exceptions import BusinessLogicError

logger = logging.getLogger(__name__)


def _to_camel_case_key(key_str: str) -> str:
    """Converts dot-notated snake_case keys to camelCase."""
    parts = key_str.split('.')
    camelized_parts = []
    for part in parts:
        words = part.split('_')
        camelized = words[0] + ''.join(w.capitalize() for w in words[1:]) if words else part
        camelized_parts.append(camelized)
    return '.'.join(camelized_parts)


def _format_validation_details(detail, parent_key=""):
    """Recursively formats DRF validation error details into a structured list."""
    details = []
    if isinstance(detail, dict):
        for key, value in detail.items():
            nested_key = f"{parent_key}.{key}" if parent_key else str(key)
            details.extend(_format_validation_details(value, nested_key))
    elif isinstance(detail, list):
        for item in detail:
            if isinstance(item, (dict, list)):
                details.extend(_format_validation_details(item, parent_key))
            else:
                details.append({
                    "field": _to_camel_case_key(parent_key or "non_field_errors"),
                    "message": str(item),
                })
    else:
        details.append({
            "field": _to_camel_case_key(parent_key or "non_field_errors"),
            "message": str(detail),
        })
    return details


def custom_exception_handler(exc, context):
    """
    Universal exception handler producing standardized error envelopes.
    """
    # 1. Handle Domain BusinessLogicError
    if isinstance(exc, BusinessLogicError):
        return Response(
            {
                "success": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                }
            },
            status=exc.status_code
        )

    # 2. Call standard DRF exception handler
    response = drf_exception_handler(exc, context)

    # 3. Handle unhandled exceptions (500 Internal Server Error)
    if response is None:
        logger.exception("Unhandled server exception encountered: %s", exc)
        return Response(
            {
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً",
                    "details": [],
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # 4. Standardize DRF handled error responses
    status_code = response.status_code
    code = "ERROR"
    message = "حدث خطأ أثناء معالجة الطلب"
    details = []

    if isinstance(exc, exceptions.ValidationError):
        code = "VALIDATION_ERROR"
        message = "بيانات الطلب غير صالحة، يرجى مراجعة الحقول"
        details = _format_validation_details(response.data)
    elif status_code == status.HTTP_401_UNAUTHORIZED:
        code = "UNAUTHORIZED"
        message = str(response.data.get("detail", "غير مصرح، يرجى تسجيل الدخول"))
    elif status_code == status.HTTP_403_FORBIDDEN:
        code = "FORBIDDEN"
        message = str(response.data.get("detail", "ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء"))
    elif status_code == status.HTTP_404_NOT_FOUND:
        code = "NOT_FOUND"
        message = str(response.data.get("detail", "المورد المطلوب غير موجود"))
    elif status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
        code = "METHOD_NOT_ALLOWED"
        message = str(response.data.get("detail", "طريقة الطلب غير مسموح بها"))
    elif status_code == status.HTTP_429_TOO_MANY_REQUESTS:
        code = "TOO_MANY_REQUESTS"
        message = str(response.data.get("detail", "تم تجاوز الحد المسموح به من الطلبات"))
    else:
        # Other DRF exceptions
        if isinstance(response.data, dict) and "detail" in response.data:
            detail_val = response.data["detail"]
            code = getattr(detail_val, "code", getattr(exc, "default_code", "ERROR")).upper()
            message = str(detail_val)
        else:
            code = getattr(exc, "default_code", "ERROR").upper()
            details = _format_validation_details(response.data)

    response.data = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details,
        }
    }

    return response
