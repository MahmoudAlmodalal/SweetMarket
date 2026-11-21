---
name: django-urls
description: Organizes Django URL patterns, DRF routers, endpoint naming, namespaces and API versioning.
---

# Django URLs

## Responsibilities
- Map endpoints to views.
- Define URL parameters.
- Organize API namespaces and versions.
- Register routers and ViewSets.

## Rules
- Keep URL configuration declarative.
- Avoid business logic in URL callbacks.
- Use consistent endpoint naming.
- Use namespaces for organized applications.
- Use DRF routers where appropriate.
- Avoid conflicting URL patterns.
- Keep API versioning consistent with project conventions.
- Use path converters correctly.
- Ensure protected endpoints enforce authentication and permissions in their views.

## Examples
- /api/v1/students/
- /api/v1/students/<id>/
- /api/v1/schools/<id>/teachers/

Test URL resolution, route names and endpoint behavior.
