---
name: django-policies
description: Defines business authorization policies for Django resources, ownership, roles, tenant boundaries and state-based access.
---

# Django Policies

Policies represent business decisions about whether an actor may perform an operation.

## Responsibilities
- Check ownership and resource access.
- Enforce tenant and organization boundaries.
- Check resource state and business-specific restrictions.
- Centralize reusable authorization decisions.

## Rules
- Keep policy decisions separate from database writes.
- Use explicit functions such as can_view_project or can_update_student.
- Do not scatter business authorization conditions across views.
- Distinguish authentication from authorization.
- Do not trust user IDs supplied in request payloads for ownership.
- Handle anonymous users explicitly.
- Avoid policies with hidden side effects.
- Keep policies easy to test.

## Important distinction
Policies answer: "Is this actor allowed to perform this business operation?"

DRF Permissions answer: "Should this request be allowed through the API layer?"

Connect both where necessary.
