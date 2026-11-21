---
name: django-views
description: Implements thin Django and Django REST Framework views that coordinate HTTP requests, permissions, selectors and services.
---

# Django Views

Views coordinate HTTP behavior.

## Responsibilities
- Receive requests.
- Apply authentication and permissions.
- Validate input through serializers.
- Call selectors for reads.
- Call services for writes.
- Return appropriate HTTP responses.

## Rules
- Keep views thin.
- Do not implement business workflows inside views.
- Do not write complex ORM queries directly in views.
- Do not duplicate serializer validation.
- Do not bypass permissions.
- Use APIView, GenericAPIView or ViewSets according to project conventions.
- Use appropriate HTTP status codes.
- Handle expected exceptions consistently.

## Expected flow
Request → Authentication → Permissions → Serializer → Policy if required → Selector or Service → Response.
