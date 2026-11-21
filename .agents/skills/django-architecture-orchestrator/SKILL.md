---
name: django-architecture-orchestrator
description: Coordinates complete Django backend features across models, policies, permissions, selectors, services, views, serializers and URLs. Use for end-to-end feature implementation.
---

# Django Architecture Orchestrator

Follow this architecture when implementing Django backend features.

## Required workflow
1. Inspect the existing project structure, conventions, dependencies and tests.
2. Understand the feature requirements, actors, data ownership and expected behavior.
3. Design or update Models and migrations.
4. Define authorization rules in Policies.
5. Define access-control checks in Permissions.
6. Implement read operations in Selectors.
7. Implement write operations and business workflows in Services.
8. Implement HTTP coordination in Views.
9. Implement input validation and output representation in Serializers.
10. Register endpoints in URLs.
11. Add tests for all affected layers.

## Layer responsibilities
- Models: data structure, relationships, constraints and model-level behavior.
- Policies: business authorization decisions.
- Permissions: DRF request-level access control.
- Selectors: read-only queries.
- Services: business operations and writes.
- Views: HTTP request/response coordination.
- Serializers: validation and representation.
- URLs: endpoint registration.

## Strict rules
- Never put business workflows in views.
- Never put complex database queries in serializers.
- Never perform writes in selectors.
- Never use permissions as a replacement for object-level business policies.
- Never hide authorization decisions in frontend code.
- Avoid unnecessary generic repositories and base classes.
- Use atomic transactions for operations involving multiple related writes.
- Follow the project's existing conventions unless there is a clear reason to change them.
- Test success, failure, authorization and edge cases.
