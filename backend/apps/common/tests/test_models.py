"""
Unit tests for ID generation utilities and TimeStampedModel in apps.common.
"""

import re
import string
import time
from django.db import models
from django.test import TestCase
from apps.common.models import TimeStampedModel, generate_prefixed_id


class ConcreteTimeStampedModel(TimeStampedModel):
    """Concrete model used solely for testing TimeStampedModel inheritance."""
    name = models.CharField(max_length=100)

    class Meta:
        app_label = 'common'


class PrefixedIdGeneratorTests(TestCase):
    """Test suite for generate_prefixed_id."""

    def test_prefix_attachment_without_underscore(self):
        """Prefix without trailing underscore should automatically append underscore."""
        uid = generate_prefixed_id("ord")
        self.assertTrue(uid.startswith("ord_"))

    def test_prefix_attachment_with_underscore(self):
        """Prefix already containing trailing underscore should not duplicate underscore."""
        uid = generate_prefixed_id("usr_")
        self.assertTrue(uid.startswith("usr_"))
        self.assertFalse(uid.startswith("usr__"))

    def test_default_length_is_exactly_32_characters(self):
        """All standard entity prefixes should produce exactly 32-character strings."""
        prefixes = ["ord", "usr", "prod", "cat", "zone", "ord_", "usr_"]
        for prefix in prefixes:
            uid = generate_prefixed_id(prefix)
            self.assertEqual(
                len(uid),
                32,
                f"Generated ID '{uid}' with prefix '{prefix}' must have length 32"
            )

    def test_custom_length_parameter(self):
        """Custom length parameter should be honored."""
        uid = generate_prefixed_id("test", length=40)
        self.assertEqual(len(uid), 40)
        self.assertTrue(uid.startswith("test_"))

    def test_url_safe_alphanumeric_charset(self):
        """Suffix must only contain URL-safe alphanumeric characters (a-z, A-Z, 0-9)."""
        valid_chars = set(string.ascii_letters + string.digits)
        for _ in range(100):
            uid = generate_prefixed_id("prod")
            suffix = uid[len("prod_"):]
            self.assertTrue(
                all(c in valid_chars for c in suffix),
                f"Suffix '{suffix}' contains non-alphanumeric characters"
            )
            # Ensure it matches regex [a-zA-Z0-9]+
            self.assertIsNotNone(re.fullmatch(r"[a-zA-Z0-9]+", suffix))

    def test_collision_resistance(self):
        """Generating 10,000 IDs should produce zero collisions."""
        count = 10000
        generated = {generate_prefixed_id("ord") for _ in range(count)}
        self.assertEqual(len(generated), count, "Collision detected in generated IDs")

    def test_empty_prefix_raises_value_error(self):
        """Passing an empty prefix must raise ValueError."""
        with self.assertRaises(ValueError):
            generate_prefixed_id("")

    def test_oversized_prefix_raises_value_error(self):
        """Prefix equal to or longer than target length must raise ValueError."""
        long_prefix = "a" * 32
        with self.assertRaises(ValueError):
            generate_prefixed_id(long_prefix, length=32)


class TimeStampedModelTests(TestCase):
    """Test suite for TimeStampedModel abstract base class."""

    def test_is_abstract_model(self):
        """TimeStampedModel itself should be declared as an abstract model."""
        self.assertTrue(TimeStampedModel._meta.abstract)

    def test_fields_configuration(self):
        """Ensure created_at and updated_at have proper flags."""
        created_field = TimeStampedModel._meta.get_field('created_at')
        updated_field = TimeStampedModel._meta.get_field('updated_at')

        self.assertTrue(created_field.auto_now_add)
        self.assertTrue(created_field.db_index)
        self.assertTrue(updated_field.auto_now)

    def test_timestamps_lifecycle(self):
        """Creating an instance sets both timestamps; updating updates only updated_at."""
        instance = ConcreteTimeStampedModel.objects.create(name="Initial Name")
        initial_created_at = instance.created_at
        initial_updated_at = instance.updated_at

        self.assertIsNotNone(initial_created_at)
        self.assertIsNotNone(initial_updated_at)

        # Brief pause to verify updated_at timestamp progression
        time.sleep(0.01)

        instance.name = "Updated Name"
        instance.save()
        instance.refresh_from_db()

        self.assertEqual(instance.created_at, initial_created_at)
        self.assertGreater(instance.updated_at, initial_updated_at)
