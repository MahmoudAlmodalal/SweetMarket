# مواصفات التنفيذ: إدارة الحسابات والمصادقة الإدارية (Backend Phase 2 Accounts & Admin Auth Spec)

## Problem Statement

Store owners, general managers, and operational staff require secure, role-differentiated access to the Candy Loz administration dashboard to manage daily orders, toggle inventory availability, and administer staff permissions. Without a dedicated, strictly governed administrative accounts and authentication system:
- Staff members could inadvertently access sensitive administrative functions (such as catalog price modifications, delivery zone adjustments, or user management).
- Store operations lack credential onboarding and recovery mechanisms, risking operational stalls if staff credentials are forgotten.
- System integrity is vulnerable to administrative lockouts if the last remaining active manager is accidentally deactivated or demoted.
- Unauthenticated API consumers or compromised tokens could compromise store management without token blacklisting or granular HTTP 401/403 authorization boundaries.
- Frontend administrative sessions face integration mismatches when user profiles, session tokens, and role permissions do not match the expected `AdminUser` and `AdminSession` contracts.

## Solution

Deliver the dedicated administrative accounts and authentication application (`apps.accounts`) for the Candy Loz backend adhering to the strict architecture flow:
`Models → Policies → Permissions → Selectors → Services → Views → Serializers → URLs`:
- Custom `AdminUser` model inheriting from `AbstractBaseUser` and `PermissionsMixin`, identified by `usr_` prefixed 32-character secure IDs, with explicit roles (`manager`, `staff`), full name, email, and active status tracking.
- Secure JWT authentication engine configured with 60-minute access tokens and 7-day refresh tokens, featuring refresh token rotation and server-side blacklisting upon logout.
- Pure Python business policies (`policies.py`) separating domain authorization from transport protocols, including strict validation preventing the deactivation or demotion of the last active manager.
- Declarative DRF permissions (`IsManager`, `IsStaffOrManager`, `IsAdminAuthenticated`) guaranteeing that staff users are restricted to operational duties while managers retain administrative control.
- Read-only selectors (`selectors.py`) providing optimized queries for user listings, single user lookups, and active manager counts without N+1 overhead.
- Atomic, race-condition-protected domain services (`services.py`) using `transaction.atomic()` and `select_for_update()` to manage user creation, credential resets with readable temporary passwords (`CL-Temp-XXXX`), and role/status mutations.
- RESTful endpoints adhering to camelCase serialization and the unified response envelope `{ success: true, data, meta }` for authentication (`/api/v1/admin/auth/login`, `/me`, `/logout`) and user management (`/api/v1/admin/users/`, `/<id>`, `/<id>/reset-password`).

## User Stories

1. As a Store Manager, I want to authenticate via `/api/v1/admin/auth/login` using my username and password, so that I can securely access the administrative dashboard.
2. As a Staff member, I want to authenticate via `/api/v1/admin/auth/login` using my operational credentials, so that I can access the kitchen queue and update order statuses.
3. As an Admin User, I want failed login attempts to return a generic 401 Unauthorized error without revealing whether the username or password was incorrect, so that brute-force credential enumeration is prevented.
4. As an Admin User, I want my account to be rejected with a 401 Unauthorized error if my `isActive` flag is false, so that deactivated employees are immediately blocked from logging in.
5. As a Frontend Application, I want the login response to return the JWT token and the authenticated user's profile (`id`, `username`, `fullName`, `email`, `role`, `isActive`, `createdAt`), so that the administrative session state is initialized in a single roundtrip.
6. As an Authenticated Admin User, I want to query `/api/v1/admin/auth/me` with my Bearer token, so that the client application can verify active session validity and restore user state upon page reload.
7. As an Authenticated Admin User, I want to log out via `/api/v1/admin/auth/logout` by submitting my refresh token, so that the refresh token is blacklisted on the server and cannot be reused.
8. As a Store Manager, I want to retrieve a paginated list of all administrative users via `GET /api/v1/admin/users`, so that I can review active staff and managerial personnel.
9. As a Store Manager, I want to filter the administrative users list by role (`manager` or `staff`) and status (`active` or `inactive`), so that I can locate specific team members quickly.
10. As a Store Manager, I want to search administrative users by username, full name, or email, so that I can find account records efficiently.
11. As a Store Manager, I want to create a new administrative user via `POST /api/v1/admin/users` specifying their username, full name, email, and role, so that new employees can be onboarded.
12. As a Store Manager, I want the system to generate a secure, human-readable temporary password (`CL-Temp-XXXX`) when creating a user, so that the employee can perform their initial login without plaintext passwords being transmitted insecurely.
13. As a Store Manager, I want to retrieve individual user details via `GET /api/v1/admin/users/<id>`, so that I can inspect their role, profile, and creation history.
14. As a Store Manager, I want to update an employee's full name, email, or role via `PATCH /api/v1/admin/users/<id>`, so that employee changes are accurately reflected in the system.
15. As a Store Manager, I want to activate or deactivate an administrative user via `PATCH /api/v1/admin/users/<id>`, so that departed staff lose access immediately while preserving audit trail attribution.
16. As a Store Manager, I want the system to reject any attempt to deactivate or demote the last remaining active manager with a 400 Bad Request error (`CANNOT_DEACTIVATE_LAST_MANAGER`), so that the store is never locked out of administrative governance.
17. As a Store Manager, I want to reset any administrative user's password via `POST /api/v1/admin/users/<id>/reset-password`, so that locked-out or credential-compromised employees receive a fresh temporary password.
18. As a Staff member, I want any request I make to user management endpoints (`/api/v1/admin/users*`) to be rejected with a 403 Forbidden error, so that privilege escalation is strictly prohibited.
19. As an Unauthenticated Client, I want any request to protected endpoints under `/api/v1/admin/` to be rejected with a 401 Unauthorized error, so that private store data is shielded from public access.
20. As a Backend Developer, I want admin user primary keys to automatically generate a 32-character URL-safe string prefixed with `usr_`, so that user records adhere to domain identification standards.
21. As a Backend Developer, I want user state mutations to execute within atomic transactions with row-level locks (`select_for_update()`), so that concurrent administrative requests cannot produce a race condition leaving zero active managers.
22. As an Order Timeline Auditor, I want administrative user records to never be deleted physically from the database (`ON DELETE RESTRICT` / soft deactivation), so that `order_status_history` records permanently retain accurate historical actor attribution.

## Implementation Decisions

- **Domain Glossary & ADR Compliance**: Strict alignment with `GLOSSARY.md` (defining `AdminUser`, `Manager`, `Staff`, and `Prefixed ID`) and existing ADRs (ADR 0001, ADR 0003, and ADR 0004).
- **Architecture Standard**: Strict layer isolation conforming to `django-architecture-orchestrator`:
  - `Models`: Custom user model `AdminUser` extending `AbstractBaseUser` and `PermissionsMixin`.
  - `Policies`: Pure Python functions (`can_manage_admin_users`, `can_modify_user_status_or_role`) validating business authorization rules independent of DRF views.
  - `Permissions`: DRF permission classes (`IsManager`, `IsStaffOrManager`, `IsAdminAuthenticated`) mapping HTTP request context to role policies.
  - `Selectors`: Pure read queries (`get_admin_user_by_id`, `list_admin_users`, `count_active_managers`) returning querysets without side effects.
  - `Services`: State mutating workflows (`create_admin_user`, `update_admin_user`, `reset_admin_user_password`, `logout_admin_user`) wrapped in `transaction.atomic()`.
  - `Views`: Thin API views coordinating request extraction, permission evaluation, service/selector delegation, and serializer response rendering.
  - `Serializers`: Schema validation, camelCase translation, and field-level validation for inputs and outputs.
  - `URLs`: Declarative endpoint registration under `/api/v1/admin/auth/` and `/api/v1/admin/users/`.
- **Custom User Model Configuration**:
  - `AUTH_USER_MODEL = 'accounts.AdminUser'` configured in `settings.py`.
  - Primary key `id` backed by `generate_prefixed_id('usr')` (32 characters URL-safe alphanumeric).
  - Explicit roles: `ROLE_MANAGER = 'manager'`, `ROLE_STAFF = 'staff'`.
  - Required fields for authentication: `USERNAME_FIELD = 'username'`, `REQUIRED_FIELDS = ['email', 'full_name']`.
- **Last Active Manager Concurrency Guard**:
  - Validated inside `can_modify_user_status_or_role` policy.
  - In `update_admin_user` service, when updating `is_active` or `role` of a manager, execute an explicit row lock `select_for_update()` over all active managers to prevent two concurrent requests from simultaneously demoting the last two managers.
- **Temporary Password Protocol**:
  - Service utility generating `CL-Temp-XXXX` where `XXXX` is a cryptographic random uppercase alphanumeric code (excluding ambiguous characters `O`, `0`, `I`, `1`).
  - Passwords hashed immediately using Django's PBKDF2/argon2 password hasher; plaintext temporary password returned only once in the API response.
- **API Contracts**:
  - `POST /api/v1/admin/auth/login`: Public endpoint accepting `{ username, password }`, returning `{ token, user }` enveloped in `{ success: true, data }`.
  - `GET /api/v1/admin/auth/me`: Protected (`IsStaffOrManager`), returning `{ user: { id, username, fullName, email, role, isActive, createdAt } }`.
  - `POST /api/v1/admin/auth/logout`: Protected (`IsStaffOrManager`), accepting `{ refresh }`, blacklisting token, returning `{ success: true, data: { message } }`.
  - `GET /api/v1/admin/users`: Protected (`IsManager`), accepting query params `role`, `isActive`, `search`, `page`, `limit`, returning paginated users with metadata.
  - `POST /api/v1/admin/users`: Protected (`IsManager`), accepting `{ username, fullName, email, role, isActive }`, returning `{ user, temporaryPassword }`.
  - `GET /api/v1/admin/users/<id>`: Protected (`IsManager`), returning user details.
  - `PATCH /api/v1/admin/users/<id>`: Protected (`IsManager`), accepting partial updates `{ fullName, email, role, isActive }`, returning updated user.
  - `POST /api/v1/admin/users/<id>/reset-password`: Protected (`IsManager`), returning `{ user, temporaryPassword }`.

## Testing Decisions

- **Testing Philosophy**: Good tests evaluate external behavior through high-level boundaries (HTTP API contracts, status codes, payload structures, and security enforcement) rather than private implementation details.
- **Highest Seam**: Django REST Framework `APITestCase` exercising full HTTP request-response cycles against `/api/v1/admin/auth/*` and `/api/v1/admin/users/*`:
  - Authentication flow: Valid credentials yield 200 with JWT and user data; invalid credentials or inactive accounts yield 401.
  - Session verification: Valid Bearer token retrieves user profile; missing or expired token yields 401.
  - Token revocation: Logout blacklists refresh token; subsequent refresh attempts fail with 401.
  - RBAC enforcement: Manager accesses all user endpoints (200/201); Staff user receives 403 Forbidden on `/api/v1/admin/users*`.
  - User creation & temporary password: POST creates user, returns `CL-Temp-XXXX`, and user can immediately log in with that temporary password.
  - Last active manager safeguard: Attempting to deactivate or demote the sole active manager fails with 400 Bad Request and specific error code.
  - Concurrency protection: Simulated concurrent deactivation requests cannot leave the system without active managers.
- **Secondary Seam**: Unit tests validating policy logic (`can_modify_user_status_or_role`) and temporary password generator entropy/format.
- **Prior Art**: Next.js mock user stores in `src/components/admin/users/users-store.ts`, authentication module in `src/lib/auth/authentication.ts`, and contract specifications in `API.md` and `ERD.md`.

## Out of Scope

- Public customer registration and storefront authentication (checkout is strictly guest-only in MVP).
- Social login and external OAuth integrations (Google, Apple, etc.).
- Granular custom permissions or dynamic permission matrices (only `manager` and `staff` roles in MVP).
- Two-factor authentication (SMS OTP or TOTP authenticator apps).
- Self-service automated email password reset flows (resetting credentials is an in-person or direct administrative function handled by the Manager).

## Further Notes

- The `AdminUser` model will be referenced in Phase 5 by `OrderStatusHistory.performed_by_user` with `on_delete=models.SET_NULL`.
- Initial superuser/manager provisioning will be supported through the standard `manage.py createsuperuser` and the Phase 6 `seed_candy_loz` management command.
