# مواصفات التنفيذ: إدارة دورة حياة الطلبات وسجل التدقيق والتتبع (Backend Phase 5 Orders, Audit History & Tracking Spec)

## Problem Statement

When customers (الزبائن) order fresh sweets on Candy Loz, they need a frictionless, account-free guest checkout experience (الشراء كزائر) that guarantees their order is accurately received, protected against accidental double-submissions, verified against store inventory, and easily trackable using their order number and local Palestinian mobile number.

At the same time, kitchen staff (الموظفون) and store managers (المدير) face operational challenges in processing orders efficiently and accurately:
- Concurrent order submissions could cause colliding order numbers or race conditions if order sequence numbering is not atomic and collision-proof.
- Customers clicking the "Confirm Order" button multiple times on unstable mobile connections could trigger duplicate orders and unintended duplicate deliveries.
- Without historical data snapshots, subsequent price updates or product modifications in the catalog could corrupt past order receipts, skew financial accounting, and disrupt operational audit logs.
- Fulfilling orders containing products that just ran out of stock or orders falling below a neighborhood's minimum order requirement creates operational friction, wasted delivery runs, and customer dissatisfaction.
- Unregulated status changes could allow unauthorized staff to cancel orders arbitrarily after expensive kitchen preparation has begun, or allow closed orders to be reopened.
- Exposing customer tracking details without rate limiting or authentication safeguards could invite automated enumeration attacks that expose sensitive customer names, addresses, and purchase histories.

## Solution

Deliver the complete, production-grade Orders domain module (`apps.orders`) adhering to the strict layered architecture:
`Models → Policies → Permissions → Selectors → Services → Views → Serializers → URLs`:
- Persistent domain models:
  - `OrderSequence`: Dedicated atomic sequence counter ensuring sequential, non-colliding order numbers (`CL-YYYY-NNNN`) under high concurrency.
  - `Order`: Central order entity capturing customer contact details, normalized Palestinian mobile phone, delivery address, financial totals (`subtotal`, `delivery_fee`, `total`), payment method (Cash on Delivery), idempotency key, secure tracking token, and 7-stage state machine status.
  - `OrderItem`: Complete historical data snapshot freezing product names, slugs, images, weight configurations, quantities, unit prices, and packaging fees at the exact moment of order placement.
  - `OrderStatusHistory`: Immutable audit log documenting every transition between states, capturing timestamp, transition note, cancellation reason, and the executing administrative actor.
- Idempotent guest checkout engine:
  - Intercepts optional `Idempotency-Key` headers to prevent duplicate orders from accidental double-clicks or network retries, safely returning the existing order record without duplicate processing.
- Strict 7-stage state machine and policy engine (`BR-004`):
  - Enforces valid transition paths (`new` ➔ `accepted` ➔ `in_preparation` ➔ `out_for_delivery` ➔ `delivered`).
  - Restricts cancellation and undelivered transitions exclusively to Store Managers, mandating an audit explanation of at least 5 characters.
  - Locks orders once entering `in_preparation` to protect kitchen preparation costs, and enforces `delivered` and `cancelled` as permanently immutable terminal states.
- Eager-loaded, read-optimized selectors:
  - `get_order_for_tracking`: Safely matches order number and normalized Palestinian mobile number.
  - `list_admin_orders`: Eagerly loads delivery zones and provides efficient multi-criteria filtering (status, zone, customer search) and standard pagination.
  - `get_admin_order_detail`: Eagerly fetches full item snapshots and chronological audit history with user attribution.
- Security and throttling defenses:
  - Custom IP-based rate limiter on the public tracking endpoint enforcing a maximum of 5 failed lookup attempts per 15-minute window (`HTTP 429 Too Many Requests`).
  - Row-level database locks (`select_for_update`) during status updates and order number generation to eliminate concurrency race conditions.

## User Stories

1. As a Customer, I want to submit my sweets order as a guest without creating an account or logging in, so that I can complete my purchase quickly with minimal friction.
2. As a Customer, I want to enter my Palestinian mobile number (starting with 059 or 056) during checkout, so that the store can contact me to confirm delivery.
3. As a Customer, I want the system to reject invalid mobile phone numbers, so that typos do not prevent the delivery team from reaching me.
4. As a Customer, I want to provide detailed delivery instructions (street address, building/apartment, landmark notes), so that the courier finds my location without delays.
5. As a Customer, I want my order creation rejected if any selected product is currently unavailable or out of stock in the kitchen, so that I do not wait for items that cannot be fulfilled.
6. As a Customer, I want my order creation rejected if my cart subtotal does not reach the minimum order spending required for my selected delivery zone, so that I am clearly informed of order policies.
7. As a Customer, I want the delivery fee of my selected zone added transparently to my subtotal to form the exact cash total, so that there are no hidden fees upon delivery.
8. As a Customer, I want to receive a unique reference order number in the format `CL-YYYY-NNNN` upon successful order creation, so that I can easily quote it when following up with the store.
9. As a Customer, I want network retries or accidental double-clicking of the confirm button to return my original order without creating duplicate orders or duplicate delivery charges.
10. As a Customer, I want to track the current fulfillment progress of my order by providing my order number and phone number, so that I know whether my order is accepted, in preparation, or out for delivery.
11. As a Customer, I want tracking lookups to verify both my order number and phone number, so that strangers cannot view my personal address or order details.
12. As a Customer, I want to view a chronological timeline of my order's progress on the tracking screen, so that I understand how quickly the kitchen and delivery are progressing.
13. As a Staff member, I want to view a centralized list of store orders in the administrative portal, so that I can monitor incoming customer orders in real time.
14. As a Staff member, I want to filter administrative orders by status (e.g., `new`, `accepted`, `in_preparation`), so that I can focus on active kitchen tasks.
15. As a Staff member, I want to filter orders by delivery zone, so that orders can be batched by geographic area for delivery couriers.
16. As a Staff member, I want to search orders by customer name, phone number, or order number, so that I can quickly assist customers who call the store.
17. As a Staff member, I want to inspect complete order details including item snapshots, selected weights, packaging options, customer notes, and address details, so that I can pack the order accurately.
18. As a Staff member, I want to advance an order from `new` to `accepted`, and then to `in_preparation`, so that the kitchen queue reflects live operations.
19. As a Staff member, I want to advance an order from `in_preparation` to `out_for_delivery` once it leaves the kitchen, so that dispatch is tracked accurately.
20. As a Staff member, I want to mark an order as `delivered` upon successful handover and cash collection, so that the transaction is formally closed.
21. As a Staff member, I want attempts to cancel orders or mark orders as `undelivered` blocked for my role, so that critical order terminations remain strictly within managerial authority.
22. As a Store Manager, I want the exclusive authority to cancel an order in `new` or `accepted` state with a mandatory explanation of at least 5 characters, so that order cancellations are justified and documented.
23. As a Store Manager, I want the exclusive authority to mark an order as `undelivered` when a customer is unreachable, recording a mandatory reason, so that delivery failures are audited.
24. As a Store Manager, I want the ability to retry delivery by transitioning an `undelivered` order back to `out_for_delivery`, so that rescheduled deliveries can be fulfilled.
25. As a Store Manager, I want the ability to permanently cancel an `undelivered` order if a customer refuses receipt, so that the order is closed out with an audit trail.
26. As an Auditor, I want every status change to permanently record the timestamp, previous state, new state, notes, and the specific staff or manager user who executed the action, so that complete operational accountability is maintained.
27. As an Auditor, I want all product names, images, weight options, and item unit prices frozen permanently in order item snapshots at checkout, so that subsequent menu price revisions do not alter historical order receipts.
28. As a System Administrator, I want order numbers generated via an atomic sequence table with row-level locks, so that concurrent orders never generate conflicting or out-of-order numbers.
29. As a Security Engineer, I want public tracking endpoints to lock out IP addresses exceeding 5 failed lookup attempts within 15 minutes, so that brute-force order scanning is prevented.
30. As a Frontend Engineer, I want all order responses formatted in camelCase and wrapped in standard `{ success: true, data, meta }` envelopes, so that UI components consume structured, predictable payloads.

## Implementation Decisions

- **Domain Glossary Compliance**:
  All domain entities and actors strictly adhere to `GLOSSARY.md` definitions: Customer (الزبون), Guest (الزائر), Staff (الموظف), Manager (المدير), Order (الطلب), Orders List (قائمة الطلبات), Normalized Palestinian Phone (رقم الهاتف الفلسطيني المطبع), and Prefixed ID (المعرّف ذو البادئة).

- **Architectural Seams and Layering**:
  1. **Models Layer**:
     - `OrderSequence`: Tracks `(year, last_number)` with row-level locks to generate zero-padded order numbers (`CL-YYYY-NNNN`).
     - `Order`: Uses prefixed identifier `ord_*` (32-character URL-safe string). Contains foreign key to `DeliveryZone` with `ON DELETE RESTRICT`. Enforces database check constraints on financial amounts (`subtotal >= 0`, `delivery_fee >= 0`, `total = subtotal + delivery_fee`) and payment method (`cash_on_delivery`).
     - `OrderItem`: Contains foreign key to `Order` (`ON DELETE CASCADE`) and reference to `Product` (`ON DELETE RESTRICT`). Stores complete historical snapshot fields (`product_name`, `product_slug`, `product_image_url`, `unit_price`, `unit`, `weight_multiplier`, `weight_label`, `packaging_label`, `packaging_fee`, `quantity`, `line_total`).
     - `OrderStatusHistory`: Contains foreign key to `Order` (`ON DELETE CASCADE`) and foreign key to `AdminUser` (`ON DELETE SET NULL`) to retain audit attribution even if a user account is deactivated.
  2. **Policies & Permissions Layer**:
     - Pure Python policy function `can_transition_order_status(actor, current_status, target_status, reason)` encapsulating the 7-state state machine and authorization rules.
     - Operational forward progression (`accepted`, `in_preparation`, `out_for_delivery`, `delivered`) allowed for both Staff and Manager roles.
     - Destructive or exception transitions (`cancelled`, `undelivered`) strictly restricted to Manager role.
     - Mandatory non-empty reason string with at least 5 characters required when transitioning to `cancelled` or `undelivered`.
     - Immutable terminal states: No transitions permitted out of `delivered` or `cancelled`.
     - DRF permissions: Storefront checkout and tracking use `AllowAny` (with throttling on tracking); admin order endpoints require `IsStaffOrManager`.
  3. **Selectors Layer (Read Operations)**:
     - `get_order_for_tracking(order_number, phone)`: Performs case-insensitive order number match combined with normalized Palestinian phone match.
     - `list_admin_orders(status, zone_id, search, page, limit)`: Evaluates filters and performs eager-loading (`select_related('zone')`) with reverse chronological ordering (`created_at DESC`), returning paginated querysets.
     - `get_admin_order_detail(order_id)`: Fetches single order with eager-loaded relations (`select_related('zone')`, `prefetch_related('items', 'timeline__performed_by_user')`).
  4. **Services Layer (Write Operations)**:
     - `generate_next_order_number()`: Atomic transaction using `select_for_update()` on `OrderSequence` row for the current calendar year.
     - `create_guest_order(customer_data, items_data, idempotency_key)`:
       - Checks for existing order matching `idempotency_key`. If matched, returns existing order immediately without re-processing.
       - Validates delivery zone is active.
       - Validates all products are active, not archived, and `is_available = True`.
       - Computes subtotal and verifies `subtotal >= zone.min_order_amount`.
       - Applies `zone.delivery_fee` and computes total.
       - Generates sequential order number and secure random tracking token.
       - Freezes product snapshots into `OrderItem` records.
       - Records initial `OrderStatusHistory` record (`from_status = None`, `to_status = 'new'`).
     - `update_order_status(order_id, target_status, actor, reason, note)`:
       - Runs within `transaction.atomic()` acquiring row-level lock via `select_for_update()` on `Order`.
       - Evaluates `can_transition_order_status` policy.
       - Updates order status and cancel reason.
       - Records new `OrderStatusHistory` record with actor attribution.
  5. **Throttling & Security**:
     - Custom throttle `OrderTrackFailedAttemptThrottle` tracking cache keys by client IP address. Increments failure counters on 404 responses from tracking lookups and blocks further attempts for 15 minutes once 5 failures are reached.
  6. **Serializers & Views Layer**:
     - CamelCase automated representation for orders, items, customer details, and timeline history.
     - Storefront guest checkout view (`POST /api/v1/orders`).
     - Storefront tracking view (`POST /api/v1/orders/track`).
     - Admin order list view (`GET /api/v1/admin/orders`).
     - Admin order detail view (`GET /api/v1/admin/orders/{id}`).
     - Admin order status update view (`PATCH /api/v1/admin/orders/{id}/status`).

- **State Machine Transition Matrix (Prototype Decision Reference)**:
```python
# Order state transitions and permission rules (BR-004)
VALID_TRANSITIONS = {
    "new": {
        "accepted": ["staff", "manager"],
        "cancelled": ["manager"],  # Reason required (>= 5 chars)
    },
    "accepted": {
        "in_preparation": ["staff", "manager"],
        "cancelled": ["manager"],  # Reason required (>= 5 chars)
    },
    "in_preparation": {
        "out_for_delivery": ["staff", "manager"],
    },
    "out_for_delivery": {
        "delivered": ["staff", "manager"],
        "undelivered": ["manager"],  # Reason required (>= 5 chars)
    },
    "undelivered": {
        "out_for_delivery": ["manager"],
        "cancelled": ["manager"],  # Reason required (>= 5 chars)
    },
    "delivered": {},  # Terminal closed state
    "cancelled": {},  # Terminal closed state
}
```

- **Order Entity Schema Shape (Prototype Decision Reference)**:
```python
# Order payload representation shape
{
    "id": "ord_9f8d1c",
    "orderNumber": "CL-2026-1042",
    "status": "new",
    "paymentMethod": "cash_on_delivery",
    "customer": {
        "fullName": "محمود أحمد",
        "phone": "0599123456",
        "zoneId": "zone_gaza_central",
        "zoneName": "مدينة غزة - الرمال والنصر والمركز",
        "streetAddress": "شارع النصر - بجوار مدرسة فلسطين",
        "buildingOrApt": "عمارة الأمل - الطابق الثاني",
        "notes": "الرجاء الاتصال قبل الوصول بـ 10 دقائق",
    },
    "subtotal": 90.00,
    "deliveryFee": 10.00,
    "total": 100.00,
    "createdAt": "2026-11-15T12:30:00Z",
    "updatedAt": "2026-11-15T12:30:00Z",
}
```

## Testing Decisions

- **Testing Philosophy**: Tests must evaluate external behavior through high-level public boundaries rather than coupling to internal implementation details. Good tests verify status codes, contract payloads, race conditions, role permissions, and business invariants under edge conditions.
- **Highest Seam**: Django REST Framework `APITestCase` testing complete HTTP request-response flows:
  - `POST /api/v1/orders`:
    - Successful guest checkout returning 201 Created with order number and camelCase structure.
    - Idempotency key handling: repeating request with identical `Idempotency-Key` returns 201 Created and the same existing order without creating duplicate records.
    - Rejection (400) for malformed Palestinian phone numbers, missing address, or empty items array.
    - Rejection (422) when an item references an unavailable product (`is_available = False`).
    - Rejection (422) when order subtotal is below the delivery zone's `min_order_amount`.
    - Verification that historical snapshot fields in `OrderItem` are correctly populated and remain decoupled from subsequent product changes.
  - `POST /api/v1/orders/track`:
    - Successful lookup (200) matching valid `orderNumber` and normalized phone number, returning status and timeline.
    - Failed lookup (404) on invalid order number or phone mismatch.
    - Security lockout (429 Too Many Requests) triggered upon the 6th failed attempt from the same IP address within a 15-minute window.
  - `GET /api/v1/admin/orders`:
    - Rejection of unauthenticated requests (401).
    - Access granted to Staff and Manager (200).
    - Filtering by status, delivery zone, and search query (order number, customer name, customer phone).
    - Standard pagination verification with `page`, `limit`, and metadata envelope.
  - `GET /api/v1/admin/orders/{id}`:
    - Detail retrieval with full item snapshots and chronological audit timeline.
    - 404 response on nonexistent order ID.
  - `PATCH /api/v1/admin/orders/{id}/status`:
    - Operational forward progression by Staff (`accepted`, `in_preparation`, `out_for_delivery`, `delivered`).
    - Rejection of Staff attempts to cancel or mark undelivered (403 Forbidden).
    - Manager authorized cancellation and undelivered transitions with valid reason (200 OK).
    - Rejection of cancellation or undelivered status without a reason of at least 5 characters (400 Bad Request).
    - Rejection of illegal state transitions (e.g., jumping from `new` directly to `delivered` or attempting to transition from `in_preparation` to `cancelled`) (400 Bad Request).
    - Rejection of any transition attempts on terminal closed orders (`delivered` or `cancelled`) (400 Bad Request).
- **Secondary Seam**: Service-level concurrency tests:
  - Multi-threaded execution testing `generate_next_order_number()` to verify zero sequence collisions under concurrent load.
  - Concurrent `update_order_status()` calls verifying row-level locks prevent conflicting status transitions.
- **Prior Art**: Authentication tests in `backend/apps/accounts/tests/`, catalog tests in `backend/apps/catalog/tests/`, and delivery zone tests in `backend/apps/delivery/tests/`.

## Out of Scope

- Customer account registration, password authentication, or login sessions (checkout remains strictly guest-based).
- Online digital payment gateways, credit cards, or digital wallets (all orders use Cash on Delivery `cash_on_delivery`).
- Real-time courier/driver GPS tracking, live map views, or WebSockets.
- Coupon codes, promotional vouchers, discount codes, or loyalty points programs.
- Custom cake multi-tier visual customizer (F-9 in PRD, explicitly excluded from MVP).
- Physical hard deletion of orders, order items, or status history via API endpoints.

## Further Notes

- Fully compatible with Django 5.0+ and Django REST Framework 3.15+.
- Reuses common utilities from `apps.common`: `TimeStampedModel`, `generate_prefixed_id('ord')`, phone normalizer `normalize_palestinian_phone`, camelCase parser/renderer, standard pagination, and unified error handling.
- Implements foreign key protection `ON DELETE RESTRICT` from `Order` to `DeliveryZone` and from `OrderItem` to `Product`, preventing accidental cascade deletion of catalog or delivery data.
