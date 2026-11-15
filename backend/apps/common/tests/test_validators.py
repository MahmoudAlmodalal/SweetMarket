"""
Unit and integration tests for Palestinian mobile phone normalizer and validator in apps.common.
"""

from django.test import SimpleTestCase, TestCase
from rest_framework import serializers
from apps.common.validators import (
    INVALID_PHONE_MESSAGE,
    normalize_palestinian_phone,
    validate_palestinian_phone,
)


class DummyPhoneSerializer(serializers.Serializer):
    phone = serializers.CharField(validators=[validate_palestinian_phone])


class PalestinianPhoneNormalizerTests(TestCase):
    """Test suite for normalize_palestinian_phone."""

    def test_local_jawwal_phone(self):
        """059 format must be preserved as 10-digit canonical string."""
        self.assertEqual(normalize_palestinian_phone("0599123456"), "0599123456")

    def test_local_ooredoo_phone(self):
        """056 format must be preserved as 10-digit canonical string."""
        self.assertEqual(normalize_palestinian_phone("0568123456"), "0568123456")

    def test_international_prefix_plus_970(self):
        """+970 prefix must be stripped and converted to 059xxxxxxx."""
        self.assertEqual(normalize_palestinian_phone("+970599123456"), "0599123456")

    def test_international_prefix_plus_972(self):
        """+972 prefix must be stripped and converted to 056xxxxxxx."""
        self.assertEqual(normalize_palestinian_phone("+972568123456"), "0568123456")

    def test_international_prefix_00970(self):
        """00970 prefix must be stripped and normalized."""
        self.assertEqual(normalize_palestinian_phone("00970599123456"), "0599123456")

    def test_international_prefix_00972(self):
        """00972 prefix must be stripped and normalized."""
        self.assertEqual(normalize_palestinian_phone("00972568123456"), "0568123456")

    def test_international_prefix_bare_970(self):
        """970 without plus or zeros must be stripped."""
        self.assertEqual(normalize_palestinian_phone("970599123456"), "0599123456")

    def test_international_prefix_bare_972(self):
        """972 without plus or zeros must be stripped."""
        self.assertEqual(normalize_palestinian_phone("972568123456"), "0568123456")

    def test_international_with_leading_zero_included(self):
        """+9700599123456 with accidental 0 after country code must normalize cleanly."""
        self.assertEqual(normalize_palestinian_phone("+9700599123456"), "0599123456")

    def test_short_9_digits_without_leading_zero(self):
        """599xxxxxx without leading zero must have 0 prepended to produce 10 digits."""
        self.assertEqual(normalize_palestinian_phone("599123456"), "0599123456")
        self.assertEqual(normalize_palestinian_phone("568123456"), "0568123456")

    def test_whitespace_and_punctuation_handling(self):
        """Spaces, dashes, parentheses, and dots must be stripped completely."""
        self.assertEqual(
            normalize_palestinian_phone("+970 (59) 912-3456"),
            "0599123456"
        )
        self.assertEqual(
            normalize_palestinian_phone("056.812.3456"),
            "0568123456"
        )

    def test_eastern_arabic_numerals_normalization(self):
        """Arabic-Indic numerals (٠-٩) must be translated to Latin digits."""
        self.assertEqual(
            normalize_palestinian_phone("٠٥٩٩١٢٣٤٥٦"),
            "0599123456"
        )
        self.assertEqual(
            normalize_palestinian_phone("+٩٧٠ ٥٦٨ ١٢٣ ٤٥٦"),
            "0568123456"
        )

    def test_invalid_landline_numbers_rejected(self):
        """Landline area codes (02 Jerusalem/Ramallah, 08 Gaza) must be rejected."""
        with self.assertRaises(ValueError):
            normalize_palestinian_phone("022987654")
        with self.assertRaises(ValueError):
            normalize_palestinian_phone("082823456")

    def test_invalid_other_country_code_rejected(self):
        """Jordanian, Egyptian, or other country numbers must be rejected."""
        with self.assertRaises(ValueError):
            normalize_palestinian_phone("+962791234567")
        with self.assertRaises(ValueError):
            normalize_palestinian_phone("+201012345678")

    def test_invalid_israeli_mobile_rejected(self):
        """Israeli cellular prefixes (050, 052, 054) must be rejected."""
        with self.assertRaises(ValueError):
            normalize_palestinian_phone("0541234567")
        with self.assertRaises(ValueError):
            normalize_palestinian_phone("0521234567")

    def test_invalid_lengths_rejected(self):
        """Numbers shorter or longer than valid patterns must be rejected."""
        with self.assertRaises(ValueError):
            normalize_palestinian_phone("059912345")  # 9 digits
        with self.assertRaises(ValueError):
            normalize_palestinian_phone("05991234567")  # 11 digits

    def test_empty_and_non_digit_strings_rejected(self):
        """Empty strings, non-string types, and alphabetic input must raise ValueError."""
        with self.assertRaises(ValueError):
            normalize_palestinian_phone("")
        with self.assertRaises(ValueError):
            normalize_palestinian_phone("abcdefghij")
        with self.assertRaises(ValueError):
            normalize_palestinian_phone(None)


class PalestinianPhoneValidatorSerializerTests(SimpleTestCase):
    """Test suite verifying validator integration in DRF Serializers."""

    def test_serializer_accepts_valid_phone(self):
        """Serializer must validate valid phone number successfully."""
        serializer = DummyPhoneSerializer(data={'phone': '+970-59-912-3456'})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_rejects_invalid_phone_with_expected_message(self):
        """Serializer must fail validation with standard Arabic error message."""
        serializer = DummyPhoneSerializer(data={'phone': '0541234567'})
        self.assertFalse(serializer.is_valid())
        self.assertIn('phone', serializer.errors)
        self.assertIn(INVALID_PHONE_MESSAGE, str(serializer.errors['phone']))
