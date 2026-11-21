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
