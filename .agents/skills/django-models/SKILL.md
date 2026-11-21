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
