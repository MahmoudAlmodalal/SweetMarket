# مواصفات التنفيذ: خطة التحقق والاختبارات الآلية الشاملة للواجهة الخلفية (Backend Phase 7 Verification Plan & Comprehensive Automated Test Suite Spec)

## Problem Statement

The Candy Loz backend encompasses multiple interconnected modules (`apps.common`, `apps.accounts`, `apps.catalog`, `apps.delivery`, and `apps.orders`) handling sensitive financial calculations, customer data privacy, guest order placement, and kitchen workflow orchestration. Without a centralized, rigorous verification plan and automated test suite:
- **Concurrency & Race Conditions**: High-volume, simultaneous guest checkouts risk generating duplicate or colliding order sequence numbers (`CL-YYYY-NNNN`), corrupting sequence state and causing kitchen chaos.
- **Idempotency Failures**: Unstable mobile connections causing customers to tap "Confirm Order" multiple times risk creating duplicate orders, charging double delivery fees, and dispatching redundant couriers.
- **State Machine Violations**: Unchecked operational transitions could allow staff to cancel orders after kitchen preparation has started (`in_preparation`), reopen closed deliveries, or bypass mandatory cancellation reasons, violating core business rules (`BR-004`).
- **Data Drift & Financial Distortion**: Updating catalog prices or archiving discontinued sweets risks retroactively altering historical order totals and receipts if snapshot freezing (`BR-009`) is not strictly verified.
- **Security & Privacy Leaks**: Without automated rate-limiting checks, public tracking endpoints risk automated phone enumeration attacks that leak customer names, delivery addresses, and purchase histories.
- **Contract & Performance Regressions**: Unmonitored schema mutations, missing camelCase transformations, unhandled business exceptions, or N+1 query regressions risk breaking the Next.js storefront and degrading backend database responsiveness.

## Solution

Deliver the comprehensive automated test suite and verification framework for the Candy Loz Django REST Framework backend, executable via a single command:
```bash
cd backend && python3 manage.py test --verbosity=2
```

The verification suite validates the entire backend architecture (`Models → Policies → Permissions → Selectors → Services → Views → Serializers → URLs`) across five specialized test packages:

1. **Common Infrastructure Verification (`backend/apps/common/tests/`)**:
   - Content negotiation: bidirectional automated camelCase parsing and serialization.
   - Response formatting: transparent 2xx wrapping into `{ success: true, data, meta }`.
   - Global exception handling: structured mapping of validation, permission, not-found, and business exceptions into `{ success: false, error: { code, message, details } }`.
   - Palestinian mobile phone normalization and validation (`059xxxxxxx` / `056xxxxxxx`).
   - Standardized `page`/`limit` pagination with boundary caps and total counts metadata.
   - Prefixed 32-character URL-safe alphanumeric entity ID generator (`generate_prefixed_id`).

2. **Accounts & Admin Authentication Verification (`backend/apps/accounts/tests/`)**:
   - Custom `AdminUser` model constraints, password hashing, and role definitions (`manager`, `staff`).
   - JWT authentication lifecycle: token generation, `/me` profile inspection, and token rotation.
   - Server-side logout and token blacklisting preventing reuse of revoked refresh tokens.
   - Role-Based Access Control (RBAC): strict separation between Manager and Staff authorities across all admin endpoints.
   - Manager self-protection policy preventing the deactivation or demotion of the last active manager.
   - Administrative user directory queries, pagination, filtering, and onboarding with temporary passwords (`CL-Temp-XXXX`).

3. **Catalog & Inventory Verification (`backend/apps/catalog/tests/`)**:
   - Category display ordering, storefront visibility, and administrative management.
   - Product queries, category filtering, search, pagination, and multi-tier weight options.
   - Rapid stock availability toggling (`PATCH /api/v1/admin/products/<id>/availability`) by staff and managers (`FR-022`).
   - Soft deletion and archival guard: preserving historical order integrity by converting deletions of ordered products into archived states (`BR-009`).
   - Query optimization and N+1 query prevention using eager loading assertions (`select_related` and `prefetch_related`).

4. **Delivery Zones Verification (`backend/apps/delivery/tests/`)**:
   - Storefront retrieval of active delivery zones.
   - Minimum order amount (`min_order_amount`) enforcement and delivery fee calculations.
   - Administrative zone configuration restricted exclusively to Store Managers.
   - Foreign key integrity preventing physical deletion of delivery zones referenced by historical orders (`ON DELETE RESTRICT`).

5. **Orders Lifecycle, Concurrency & Security Verification (`backend/apps/orders/tests/`)**:
   - **`test_concurrency.py`**: Multi-threaded simulated concurrent checkouts asserting atomic sequence incrementation and zero order number collisions under high concurrency.
   - **`test_idempotency.py`**: Repeated submissions with identical `Idempotency-Key` headers returning the original order without duplicate database records or sequence increments (`BR-004`).
   - **`test_policies.py`**: Exhaustive verification of the 7-stage state machine (`new`, `accepted`, `in_preparation`, `out_for_delivery`, `delivered`, `undelivered`, `cancelled`), manager-only cancellation with mandatory reason (>= 5 chars), locked `in_preparation` orders, and immutable terminal states.
   - **`test_services.py`**: Atomic guest order creation, historical item snapshot freezing, unavailable item rejection, zone minimum spending enforcement, and audit timeline tracking with human actor attribution.
   - **`test_throttling.py`**: Public tracking rate-limiter enforcing HTTP 429 Too Many Requests lockout on the 6th failed lookup attempt per IP within 15 minutes.
   - **`test_api.py`**: Full contract conformance testing across all storefront and admin order endpoints.

## User Stories

1. As a Backend Developer, I want to execute the complete verification suite using `python3 manage.py test --verbosity=2`, so that I can immediately detect regressions across any domain module before deploying changes.
2. As a Quality Assurance Engineer, I want all tests isolated within disposable test database transactions, so that tests execute rapidly and deterministically without cross-test state contamination.
3. As a Frontend Engineer, I want automated assertions validating that all 2xx API responses are enclosed in `{ success: true, data, meta }`, so that frontend state consumers never receive malformed envelope shapes.
4. As a Frontend Engineer, I want automated assertions validating that all API response keys are serialized in camelCase, so that JavaScript frontend code never encounters raw snake_case backend keys.
5. As a Frontend Engineer, I want automated assertions validating that all API error responses follow `{ success: false, error: { code, message, details } }`, so that client form handlers render field-specific error messages uniformly.
6. As a Customer, I want tests verifying Palestinian phone normalization, so that entering my mobile number with country codes (+970, +972) or formatting dashes is consistently converted to a standard 10-digit number.
7. As a Customer, I want tests verifying invalid Palestinian phone rejection, so that mistyped numbers are flagged immediately with HTTP 400 before an order is placed.
8. As a Customer, I want tests verifying that submitting duplicate requests with the same `Idempotency-Key` returns my original order, so that network retries or double-clicks never charge me twice or duplicate my sweets order.
9. As a Customer, I want tests verifying that orders containing currently unavailable sweets (`is_available = False`) are rejected with HTTP 422, so that I cannot order products the kitchen cannot fulfill.
10. As a Customer, I want tests verifying that orders below the delivery zone's minimum basket requirement are rejected with HTTP 422, so that order requirements are transparently enforced.
11. As a Customer, I want tests verifying that public order tracking requires matching both order number and phone number, so that unauthorized individuals cannot snoop on my home address or order contents.
12. As a Security Engineer, I want tests verifying that the tracking endpoint returns HTTP 429 after 5 failed lookup attempts from the same IP within 15 minutes, so that brute-force order scanning attacks are neutralized.
13. As a Store Manager, I want tests verifying that order numbers follow the exact format `CL-YYYY-NNNN`, so that orders are clearly identified and indexed by year.
14. As a Store Manager, I want tests simulating concurrent checkout requests across multiple threads, so that high traffic bursts never produce duplicate or colliding order numbers.
15. As a Store Manager, I want tests verifying that product unit prices, weight multipliers, and packaging labels are permanently frozen in `OrderItem` records, so that future menu price changes never distort historical sales receipts.
16. As a Store Manager, I want tests verifying that only Managers can cancel orders or mark them as `undelivered`, so that operational staff cannot terminate orders without managerial approval.
17. As a Store Manager, I want tests verifying that cancelling an order or marking it as `undelivered` requires an explanation of at least 5 characters, so that all order terminations have an audited reason on record.
18. As a Kitchen Staff member, I want tests verifying that orders in `in_preparation` cannot be cancelled through regular workflows, so that kitchen food preparation costs are protected.
19. As a Store Manager, I want tests verifying that `delivered` and `cancelled` states are permanently terminal, so that closed orders can never be modified or reopened.
20. As an Auditor, I want tests verifying that every order state transition generates an immutable `OrderStatusHistory` entry capturing actor, timestamp, transition note, and reason, so that complete operational accountability is verified.
21. As a Store Manager, I want tests verifying that the system prevents the deactivation or demotion of the last active manager, so that administrative lockout is impossible.
22. As an Admin User, I want tests verifying that logging out blacklists the refresh token immediately, so that revoked JWT tokens cannot be used to generate fresh access tokens.
23. As a Staff member, I want tests verifying that my operational account can toggle product availability (`PATCH .../availability`), so that kitchen inventory changes are updated in real time.
24. As a Store Manager, I want tests verifying that attempting to delete a product with existing orders performs a soft archival (`is_archived = True`, `is_available = False`), so that historical order items are never broken.
25. As a Store Manager, I want tests verifying that delivery zones referenced by orders cannot be deleted (`ON DELETE RESTRICT`), so that historical customer addresses and fee records remain intact.
26. As a Backend Developer, I want tests asserting that storefront category and product listings execute without N+1 database queries, so that catalog endpoints maintain sub-50ms response times under load.
27. As a Frontend Engineer, I want tests verifying that standard pagination parameters (`page` and `limit`) accurately enforce page limits (default 20, max 100) and return total items and pages, so that storefront pagination behaves predictably.

## Implementation Decisions

- **Domain Glossary Compliance**:
  All test names, test assertions, and fixtures strictly adhere to `GLOSSARY.md` concepts: Customer (الزبون), Guest (الزائر), Staff (الموظف), Manager (المدير), Order (الطلب), Orders List (قائمة الطلبات), Normalized Palestinian Phone (رقم الهاتف الفلسطيني المطبع), and Prefixed ID (المعرّف ذو البادئة).

- **Architectural Seams and Layering**:
  1. **Primary Seam (Highest Possible Seam)**:
     - Django REST Framework `APITestCase` exercising full HTTP request-response lifecycles through DRF `APIClient`.
     - Validates middleware, authentication guards, content negotiation (camelCase parsing and rendering), unified response envelopes, schema serialization, domain services, and database persistence in one cohesive boundary.
  2. **Secondary Seam (Concurrency & Thread Safety Seam)**:
     - Python `concurrent.futures.ThreadPoolExecutor` coupled with Django's `TransactionTestCase`.
     - Simulates concurrent database transactions with real thread workers to verify row-level locks (`select_for_update`) on `OrderSequence` and `Order` status transitions.
  3. **Third Seam (Algorithmic & Policy Pure Logic Seam)**:
     - Direct unit execution of policy functions (`can_transition_order_status`, `can_modify_user_role`) and utility validators (`normalize_palestinian_phone`) to exhaustively test boundary inputs, negative cases, and regex permutations.

- **Prototype Decision Reference (7-Stage Transition Matrix)**:
```python
# Prototype contract verified by test_policies.py (BR-004)
VALID_TRANSITIONS = {
    "new": {"accepted": ["staff", "manager"], "cancelled": ["manager"]},
    "accepted": {"in_preparation": ["staff", "manager"], "cancelled": ["manager"]},
    "in_preparation": {"out_for_delivery": ["staff", "manager"]},
    "out_for_delivery": {"delivered": ["staff", "manager"], "undelivered": ["manager"]},
    "undelivered": {"out_for_delivery": ["manager"], "cancelled": ["manager"]},
    "delivered": {},
    "cancelled": {},
}
```

- **Query Count Enforcement**:
  Storefront catalog tests utilize `assertNumQueries` and `CaptureQueriesContext` to assert deterministic query counts regardless of category or product record volume, validating that `select_related('category')` and `prefetch_related('weight_options')` prevent N+1 query regression.

- **Cache & Throttling Isolation**:
  Rate-limiting tests override cache configuration with an isolated cache namespace and clear keys between runs to ensure reliable execution of throttling lockouts without leaking rate-limit counters between test cases.

## Testing Decisions

- **Testing Philosophy**:
  Good tests evaluate observable system behavior through external boundaries (HTTP status codes, response payloads, database state transitions, and concurrency guarantees) rather than coupling to internal private methods. Tests verify contracts, authorization matrices, data integrity, and failure recovery.
- **Seams Tested**:
  - Highest Seam: `rest_framework.test.APITestCase` across all API endpoints in `common`, `accounts`, `catalog`, `delivery`, and `orders`.
  - Concurrency Seam: `django.test.TransactionTestCase` using multi-threaded execution to test atomic order sequence numbering and locking.
  - Policy & Validator Seam: Pure Python function unit tests for state machine transitions and phone normalizer edge cases.
- **Prior Art**:
  Builds upon the existing 179 passing tests across `backend/apps/common/tests/`, `backend/apps/accounts/tests/`, `backend/apps/catalog/tests/`, and `backend/apps/delivery/tests/`.

## Out of Scope

- Browser-based End-to-End UI rendering and visual viewport screenshot regression (handled separately by Playwright storefront and admin test suites).
- External third-party payment gateway integration tests (credit cards, electronic wallets; excluded from MVP as payment is Cash on Delivery only).
- Live SMS gateway or WhatsApp dispatch notification integrations (manual phone dispatch in MVP).
- Production live database migration rollback or PostgreSQL cluster failover testing.
- Load testing exceeding 100 concurrent workers (deferred to post-MVP dedicated stress testing).

## Further Notes

- Full test suite runs clean in under 60 seconds using SQLite in-memory test database.
- Fully compatible with Django 5.0+ and Django REST Framework 3.15+.
- Enforces Gaza timezone (`Asia/Gaza`) with `USE_TZ = True`.
- Ready for immediate integration with CI/CD pipelines and pre-commit test runners.
