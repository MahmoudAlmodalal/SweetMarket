# مواصفات التنفيذ: البنية التحتية المشتركة للواجهة الخلفية (Backend Phase 1 Common Foundation Spec)

## Problem Statement

Frontend client developers, store staff, and API consumers face severe integration friction when backend endpoints have inconsistent serialization contracts, mismatched casing conventions, unstructured error formats, and variable phone number inputs. Without a standardized foundational infrastructure, backend apps (accounts, catalog, delivery, and orders) implement divergent conventions:
- Frontend clients face broken JSON payload keys due to manual snake_case and camelCase discrepancies.
- API consumers and UI forms receive non-standard error structures, complicating form error handling.
- Customer phone inputs with international dialing prefixes (`+970`, `+972`, `00970`) or formatting artifacts cause database lookup failures and dispatch communication breakdowns.
- Entity IDs with ambiguous auto-incrementing integers leak internal database scale and complicate distributed log auditing.
- Missing pagination metadata forces frontend components to guess page counts and total dataset sizes.

## Solution

Deliver the shared common infrastructure module (`apps.common`) for the Candy Loz backend:
- Universal response renderer and parser pipeline that automatically handles camelCase serialization and transparently wraps 2xx payloads into the `{ success: true, data, meta }` envelope.
- Global exception handler intercepting DRF validation errors, HTTP errors, and domain business exceptions to produce structured error envelopes `{ success: false, error: { code, message, details } }`.
- Unified Palestinian mobile phone normalizer and validator that strips international dial codes and formatting characters, storing canonical 10-digit local numbers (`059xxxxxxx` / `056xxxxxxx`).
- Entity identifier generator (`generate_prefixed_id`) yielding secure, 32-character URL-safe alphanumeric strings prefixed by entity type (e.g., `ord_`, `usr_`, `prod_`).
- Base timestamped model (`TimeStampedModel`) providing immutable `created_at` and `updated_at` timestamps across all models.
- Standardized pagination class enforcing `page` and `limit` query parameters with configurable ceilings (default 20, max 100) and metadata generation.
- Production-ready JWT authentication defaults (60m access, 7d refresh with rotation and blacklist) and switchable cache backend defaulting to `LocMemCache` with Redis toggle.

## User Stories

1. As an API Consumer, I want all successful responses enveloped in `{ success: true, data, meta }`, so that my client state management hooks have a predictable structure across every endpoint.
2. As a Frontend Engineer, I want all outgoing API payload keys translated automatically from snake_case to camelCase, so that frontend components use standard JavaScript naming conventions without custom transformation layers.
3. As a Frontend Engineer, I want all incoming request bodies formatted in camelCase automatically converted to snake_case for Django views, so that frontend client requests require zero manual key mapping.
4. As an API Consumer, I want all API errors returned in a standard `{ success: false, error: { code, message, details } }` format, so that client error handlers parse error codes and field-level validation messages uniformly.
5. As a Frontend Engineer, I want field-level validation errors to return an array of specific field errors in `error.details`, so that user-facing forms highlight the exact invalid inputs simultaneously.
6. As a Customer, I want to enter my Palestinian mobile number with or without international country codes (+970, +972, 00970, 00972) or spaces, so that checkout accepts my input smoothly.
7. As a Staff member, I want customer phone numbers stored as canonical 10-digit local strings (`059xxxxxxx` or `056xxxxxxx`), so that local delivery riders can dial or message the customer directly.
8. As a Backend Developer, I want every entity to generate a human-readable prefixed primary key (e.g., `ord_...`, `prod_...`, `usr_...`), so that log analysis, debugging, and audit trails identify record types unambiguously.
9. As a Backend Developer, I want the entity ID generator to use secure URL-safe 32-character strings, so that identifiers cannot be guessed or scraped through sequential iteration.
10. As a Backend Developer, I want all domain models to inherit an abstract `TimeStampedModel`, so that creation and update timestamps are tracked reliably across all tables.
11. As a Frontend Engineer, I want paginated endpoints to accept `page` and `limit` query parameters, so that pagination controls and infinite scroll views request accurate item slices.
12. As a Frontend Engineer, I want paginated responses to include `meta: { page, limit, totalItems, totalPages }`, so that pagination controls render the correct current page, page size, total record count, and total page count.
13. As a Backend Developer, I want pagination to enforce a default page limit of 20 and a maximum cap of 100, so that queries cannot exhaust server memory through oversized limit requests.
14. As a Staff member or Manager, I want JWT authentication tokens configured with a 60-minute access token and a 7-day refresh token, so that administrative sessions remain secure while supporting uninterrupted active shifts.
15. As a Manager, I want refresh token rotation and blacklisting enabled, so that compromised or logged-out tokens cannot be reused to access the admin portal.
16. As a Backend Developer, I want domain business logic exceptions (`BusinessLogicError`) automatically intercepted and converted into HTTP 400 Bad Request responses with distinct error codes, so that domain services enforce business rules cleanly without touching HTTP primitives.
17. As a Backend Developer, I want throttling and rate-limiting infrastructure supported by a fast cache backend with seamless local development defaults (`LocMemCache`) and production-ready Redis toggles, so that brute-force attacks on sensitive endpoints are blocked in all environments.
18. As a Frontend Engineer, I want CORS headers preconfigured to allow `http://localhost:3000`, so that the Next.js local development environment connects seamlessly to the backend API without browser CORS rejections.

## Implementation Decisions

- **Domain Glossary & ADR Compliance**: Strict adherence to `GLOSSARY.md` definitions and [ADR 0004: Backend Common Infrastructure Conventions](file:///home/mahmoud/Desktop/متجر%20حلويات/docs/adr/0004-backend-common-infrastructure-conventions.md).
- **Modules to be Built**:
  - Base Models & Identification: An abstract base model providing indexed timestamp tracking, and an ID generator utility yielding 32-character URL-safe alphanumeric strings with entity-specific prefixes (`ord_`, `usr_`, `prod_`, `cat_`, `zone_`).
  - Serialization & Negotiation: A unified response renderer extending DRF CamelCaseJSONRenderer to wrap 2xx HTTP payloads into `{ success: true, data, meta }` envelopes, paired with a camelCase JSON parser for incoming requests.
  - Error Handling: Centralized custom exception handler intercepting DRF validation errors, standard HTTP errors, and domain business logic exceptions, mapping all occurrences into `{ success: false, error: { code, message, details } }`.
  - Pagination Architecture: Standard pagination class consuming `page` and `limit` query parameters (default 20, max 100) and producing structured metadata containing `page`, `limit`, `totalItems`, and `totalPages`.
  - Validation Utilities: Palestinian mobile phone validation and normalization utility stripping international dialing prefixes (`+970`, `+972`, `00970`, `00972`) and non-digit characters, enforcing 10-digit local mobile patterns (`059xxxxxxx` / `056xxxxxxx`).
  - Core Configuration: Gaza timezone (`Asia/Gaza`) with database `USE_TZ = True`; SimpleJWT configured for 60m access and 7d refresh with rotation and blacklisting; CORS allowed for local frontend; Cache configured for `LocMemCache` with Redis environment variable toggle.

## Testing Decisions

- **Testing Philosophy**: Good tests evaluate external behavior through high-level boundaries rather than private implementation details.
- **Highest Seam**: Django REST Framework `APITestCase` exercising the complete HTTP request-response cycle through test endpoints (verifying incoming camelCase parsing, outgoing camelCase rendering, 2xx response envelope wrapping, pagination metadata generation, and structured exception translation across 400, 401, 403, 404, and 500 scenarios).
- **Secondary Seam**: Unit tests validating algorithmic boundaries: `generate_prefixed_id` ensuring correct prefix attachment, length (32 chars), character set, and low collision probability; phone normalizer validating various input formats (international prefixes, local formats, spaces, dashes) and rejecting invalid prefixes or lengths.
- **Prior Art**: Next.js frontend contract fixtures and `API.md` contract specifications.

## Out of Scope

- Domain entity models (Accounts, Catalog, Delivery, Orders) which belong to Phases 2 through 5.
- Front-facing customer authentication or guest registration (checkout remains guest-only).
- Payment gateways and electronic transaction processors (cash on delivery only).
- Real-time GPS driver tracking and WebSockets.
- Coupon, discount code, and loyalty engines.

## Further Notes

- This spec serves as the foundational contract for all subsequent backend phases.
- Compatible with Django 5 and Django REST Framework 3.15+.
