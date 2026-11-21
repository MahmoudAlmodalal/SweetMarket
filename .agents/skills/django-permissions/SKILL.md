---
name: django-permissions
description: Implements Django REST Framework authentication and request-level, view-level and object-level permissions.
---

# Django REST Framework Permissions

## Responsibilities
- Control access to API endpoints.
- Enforce authenticated and anonymous access rules.
- Implement request-level and object-level access checks.
- Integrate business policies when required.

## Rules
- Use DRF BasePermission for custom permission classes.
- Implement has_permission for request-level checks.
- Implement has_object_permission for object-level checks.
- Do not assume object-level permissions automatically filter list querysets.
- Ensure selectors filter objects by ownership and tenant boundaries.
- Avoid duplicating policy logic.
- Never rely on frontend restrictions.
- Test both allowed and denied requests.

## Security checklist
- Can an anonymous user access this endpoint?
- Can one user access another user's objects?
- Can users cross tenant boundaries?
- Are unsafe HTTP methods protected?
- Are list and detail endpoints both secured?
