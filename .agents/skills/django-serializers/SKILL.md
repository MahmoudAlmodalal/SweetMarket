---
name: django-serializers
description: Designs Django REST Framework serializers for validation, deserialization and API response representation.
---

# Django REST Framework Serializers

## Responsibilities
- Validate incoming API data.
- Convert primitive data into Python objects.
- Represent model instances in API responses.
- Handle nested and related data when appropriate.

## Rules
- Use explicit fields.
- Prefer fields allowlists over exposing every model field.
- Use validate_<field> for field-specific validation.
- Use validate for cross-field validation.
- Use validated_data in services or controlled write operations.
- Keep complex business workflows outside serializers.
- Avoid complex database queries inside serializer methods.
- Do not trust client-provided ownership or privilege fields.
- Use read_only_fields deliberately.
- Avoid unnecessary deeply nested serializers.

## Important
Serializer validation is not a replacement for business authorization.

Test valid input, invalid input, missing fields, edge cases and output representation.
