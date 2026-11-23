
#!/usr/bin/env bash
set -euo pipefail

# Default: install in the current project's Antigravity skills directory.
# Optional argument: custom skills directory.
SKILLS_DIR="${1:-$PWD/.agents/skills}"

mkdir -p "$SKILLS_DIR"

write_skill() {
    local name="$1"
    mkdir -p "$SKILLS_DIR/$name"
    cat > "$SKILLS_DIR/$name/SKILL.md"
    echo "Created: $name"
}

write_skill django-architecture-orchestrator <<'SKILL'
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
SKILL

write_skill django-models <<'SKILL'
---
name: django-models
description: Designs Django models, fields, relationships, constraints, migrations and model-level behavior.
---

# Django Models

## Responsibilities
- Define database entities and relationships.
- Define field types, constraints, indexes and defaults.
- Implement model-level behavior that naturally belongs to an entity.
- Define model properties and focused validation.

## Rules
- Inspect existing models before changing the schema.
- Use explicit related_name values where useful.
- Use ForeignKey, OneToOneField and ManyToManyField correctly.
- Add database constraints for important invariants.
- Use indexes based on real query patterns.
- Avoid putting application workflows in model save methods.
- Avoid signals for critical business workflows.
- Do not expose sensitive fields unnecessarily.
- Use migrations for every schema change.

## Checklist
- Are relationships correct?
- Are null and blank settings intentional?
- Are constraints enforced by the database where possible?
- Are migrations safe?
- Are model methods focused and testable?
SKILL

write_skill django-policies <<'SKILL'
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
SKILL

write_skill django-permissions <<'SKILL'
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
SKILL

write_skill django-selectors <<'SKILL'
---
name: django-selectors
description: Implements read-only Django ORM queries, filtering, aggregation and reusable query logic.
---

# Django Selectors

Selectors encapsulate read operations.

## Responsibilities
- Retrieve objects.
- Filter and search data.
- Handle aggregations and annotations.
- Optimize related-object loading.
- Provide reusable read logic.

## Rules
- Selectors must not perform writes.
- Use select_related for suitable foreign-key relationships.
- Use prefetch_related for many-to-many and reverse relationships.
- Use only() and defer() when beneficial and safe.
- Avoid N+1 queries.
- Keep query functions focused.
- Apply tenant and ownership filtering.
- Do not create a selector for every trivial ORM query.

## Naming examples
- get_student_by_id
- list_school_students
- get_teacher_schedule
- get_dashboard_statistics

## Testing
Test filtering, ordering, aggregation, access boundaries and query behavior.
SKILL

write_skill django-services <<'SKILL'
---
name: django-services
description: Implements Django business workflows, create/update/delete operations, transactions and integrations.
---

# Django Services

Services contain application business operations and write workflows.

## Responsibilities
- Create, update and delete records.
- Coordinate multiple models.
- Apply business rules.
- Execute multi-step operations.
- Integrate with external services.
- Manage transactions.

## Rules
- Use descriptive function names.
- Keep each operation focused.
- Validate business invariants independently of API validation.
- Use transaction.atomic for operations requiring atomicity.
- Avoid returning HTTP responses from services.
- Avoid depending on request objects.
- Do not hide core workflows inside signals.
- Handle external failures and retries deliberately.
- Avoid generic service classes without a clear purpose.

## Naming examples
- create_student
- enroll_student
- approve_submission
- assign_teacher
- update_school_settings

## Testing
Test success, invalid states, rollback, duplicate operations and external failures.
SKILL

write_skill django-views <<'SKILL'
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
SKILL

write_skill django-serializers <<'SKILL'
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
SKILL

write_skill django-urls <<'SKILL'
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
SKILL

cat > "$SKILLS_DIR/README.md" <<'README'
# Django Architecture Skills

Installed skills:
1. django-architecture-orchestrator
2. django-models
3. django-policies
4. django-permissions
5. django-selectors
6. django-services
7. django-views
8. django-serializers
9. django-urls

Architecture:
Models -> Policies -> Permissions -> Selectors -> Services -> Views -> Serializers -> URLs

Use django-architecture-orchestrator for complete feature implementation.
README

echo
echo "=========================================="
echo " Django skills installed successfully!"
echo " Location: $SKILLS_DIR"
echo "=========================================="
echo
find "$SKILLS_DIR" -name SKILL.md -print | sort
