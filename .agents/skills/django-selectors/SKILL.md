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
