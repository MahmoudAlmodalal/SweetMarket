"""
Base models and entity identification utilities for Candy Loz.
"""

import secrets
import string
from django.db import models


def generate_prefixed_id(prefix: str, length: int = 32) -> str:
    """
    Generate a cryptographically secure, URL-safe alphanumeric ID prefixed by entity type.

    The total length of the resulting string is `length` (defaults to 32 characters).
    If `prefix` does not end with an underscore, one is automatically appended.

    Example:
        generate_prefixed_id('ord') -> 'ord_ab12cd34ef56gh78ij90kl12mn34'
        generate_prefixed_id('usr_') -> 'usr_ab12cd34ef56gh78ij90kl12mn34'
    """
    if not prefix:
        raise ValueError("Prefix cannot be empty")

    clean_prefix = prefix if prefix.endswith('_') else f"{prefix}_"

    if len(clean_prefix) >= length:
        raise ValueError(
            f"Prefix '{clean_prefix}' of length {len(clean_prefix)} is too long "
            f"to generate a string of total length {length}."
        )

    random_len = length - len(clean_prefix)
    # URL-safe alphanumeric charset (A-Z, a-z, 0-9)
    alphabet = string.ascii_letters + string.digits
    random_suffix = ''.join(secrets.choice(alphabet) for _ in range(random_len))

    return f"{clean_prefix}{random_suffix}"


class TimeStampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    ``created_at`` and ``updated_at`` fields with index on created_at.
    """
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name="تاريخ الإنشاء"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="تاريخ التحديث"
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']
