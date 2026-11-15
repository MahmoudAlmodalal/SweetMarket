"""
Palestinian mobile phone normalization and validation utilities.
"""

import re
from rest_framework import serializers

ARABIC_DIGITS_TRANS = str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789')
INVALID_PHONE_MESSAGE = "يجب أن يبدأ رقم الهاتف بـ 059 أو 056 ويتكون من 10 أرقام"


def normalize_palestinian_phone(phone: str) -> str:
    """
    Normalizes a Palestinian mobile number to canonical 10-digit format (059xxxxxxx or 056xxxxxxx).
    Strips international country prefixes (+970, +972, 00970, 00972, 970, 972), spaces, dashes,
    dots, and parentheses. Handles Eastern Arabic-Indic numerals.

    Raises:
        ValueError: If the number cannot be normalized to a valid 10-digit Palestinian mobile.
    """
    if not phone or not isinstance(phone, str):
        raise ValueError(INVALID_PHONE_MESSAGE)

    # Convert Eastern Arabic numerals (٠-٩) to Latin (0-9)
    clean = phone.translate(ARABIC_DIGITS_TRANS)

    # Strip all non-digit characters
    digits = re.sub(r'\D', '', clean)

    # Strip international country code prefixes (ordered by length descending)
    for prefix in ('00970', '00972', '970', '972'):
        if digits.startswith(prefix):
            digits = digits[len(prefix):]
            break

    # If it starts with 59 or 56 with 9 digits, prepend the local leading zero
    if len(digits) == 9 and (digits.startswith('59') or digits.startswith('56')):
        digits = f"0{digits}"

    # Verify canonical format: exactly 10 digits starting with 059 or 056
    if not (len(digits) == 10 and (digits.startswith('059') or digits.startswith('056'))):
        raise ValueError(INVALID_PHONE_MESSAGE)

    return digits


def validate_palestinian_phone(value: str) -> str:
    """
    DRF / Django serializer and model field validator.
    Validates and normalizes Palestinian mobile numbers.

    Raises:
        serializers.ValidationError: If value is not a valid Palestinian mobile number.
    """
    try:
        return normalize_palestinian_phone(value)
    except ValueError as exc:
        raise serializers.ValidationError(str(exc))
