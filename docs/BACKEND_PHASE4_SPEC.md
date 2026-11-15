# مواصفات التنفيذ: مناطق ورسوم التوصيل للواجهة الخلفية (Backend Phase 4 Delivery Zones Spec)

## Problem Statement

When customers (الزبائن) order sweets on Candy Loz, they need immediate clarity on which geographical areas the store delivers to, the delivery fee applied to their cart, the minimum order spending required for their neighborhood, and estimated delivery windows. Without a dedicated delivery zones module:
- Customers cannot verify if their neighborhood is within delivery coverage during checkout, leading to orders placed for unserviceable addresses.
- Store staff (الموظفون) and delivery couriers face operational chaos when orders are placed below economic delivery thresholds or without appropriate delivery fee accounting.
- Store managers (المدير) lack a centralized administrative mechanism to define delivery zones, adjust delivery fees, set minimum basket amounts, configure delivery time estimates, or temporarily deactivate zones during adverse operational conditions.
- Unauthorized personnel might alter delivery pricing or minimum thresholds, resulting in financial loss or inconsistent customer billing.
- Inappropriate deletion of delivery zones referenced by historical orders risks cascading data corruption and broken audit trails across past orders.

## Solution

Deliver the dedicated Delivery Zones domain module (`apps.delivery`) adhering to the strict layered Django REST Framework architecture:
`Models → Policies → Permissions → Selectors → Services → Views → Serializers → URLs`:
- Persistent `DeliveryZone` model with prefixed URL-safe identifier (`zone_*`), geographical neighborhood description, delivery fee, minimum order amount, estimated delivery window (minimum and maximum minutes), and active status toggle.
- Business policy (`can_manage_delivery_zones`) and role-based permissions (`IsManager`, `IsStaffOrManager`) enforcing that only Managers can create or modify delivery zones, while Staff can view all zones (including inactive ones) for operational awareness.
- Optimized read-only selectors: `list_active_delivery_zones` filtering strictly active zones for customer storefront views and cart calculations, and `list_all_delivery_zones` providing complete zone registries for the admin management console.
- Business service workflows handling atomic creation and modification of delivery zones with input validation and domain constraints.
- Public storefront endpoint (`GET /api/v1/delivery-zones`) exposing active zones formatted in camelCase within the unified response envelope `{ success: true, data: [...] }`.
- Protected admin endpoints (`GET /api/v1/admin/delivery-zones`, `POST /api/v1/admin/delivery-zones`, `PUT /api/v1/admin/delivery-zones/{id}`) enabling staff inspection and manager-only creation and updates.
- Foreign key protection enforcing restricted deletion (`ON DELETE RESTRICT`) from orders to ensure historical integrity, guiding operational removals toward soft deactivation (`isActive = false`).

## User Stories

1. As a Customer, I want to view a list of all active delivery zones, so that I can verify whether the store delivers sweets to my neighborhood.
2. As a Customer, I want to see the specific delivery fee associated with my selected neighborhood, so that I understand the total delivery cost before confirming my order.
3. As a Customer, I want to see the minimum order amount required for my selected delivery zone, so that I can ensure my cart subtotal satisfies the minimum purchase requirement.
4. As a Customer, I want to see the estimated delivery time range (minimum and maximum minutes) for my zone, so that I have realistic expectations for when my order will arrive.
5. As a Customer, I want inactive or temporarily suspended delivery zones excluded from the public delivery zones list, so that I do not accidentally select an unserviceable area.
6. As a Customer, I want public delivery zones returned with consistent camelCase attributes (`deliveryFee`, `minOrderAmount`, `estimatedTimeMin`, `estimatedTimeMax`, `isActive`), so that my frontend client renders delivery details seamlessly.
7. As a Staff member, I want to retrieve all delivery zones including inactive ones in the management portal, so that I have complete visibility over current and past delivery territories.
8. As a Staff member, I want to inspect delivery zone fees and minimum spending thresholds, so that I can verify order calculations during kitchen preparation and dispatch.
9. As a Staff member, I want my role restricted to read-only access on delivery zone administration, so that operational staff cannot accidentally alter delivery pricing or minimum limits.
10. As a Manager, I want to create a new delivery zone with a unique name, delivery fee, minimum order amount, and delivery time window, so that the store can expand its delivery coverage to new neighborhoods.
11. As a Manager, I want to update an existing delivery zone's name, fee, minimum order amount, and time estimates, so that the store can adapt to changes in logistics costs and driver availability.
12. As a Manager, I want to toggle a delivery zone's active status (`isActive`), so that I can temporarily suspend orders to specific areas during extreme weather, road closures, or high delivery volume without deleting the zone.
13. As a Manager, I want input validation to reject negative delivery fees, so that delivery charges are never erroneously recorded as credits or negative amounts.
14. As a Manager, I want input validation to reject negative minimum order amounts, so that minimum order thresholds remain valid non-negative figures.
15. As a Manager, I want input validation to enforce a minimum estimated delivery time of at least 5 minutes, so that unrealistic delivery windows are prevented.
16. As a Manager, I want input validation to enforce that the maximum estimated delivery time is greater than or equal to the minimum estimated time and does not exceed 240 minutes, so that valid delivery ranges are maintained.
17. As a Manager, I want delivery zone names validated with a minimum length of 3 characters, so that ambiguous or blank zone names are rejected.
18. As a Backend Developer, I want every delivery zone record identified by a secure 32-character prefixed primary key (`zone_*`), so that entities are distinguishable and non-enumerable across logs and foreign keys.
19. As a Backend Developer, I want delivery zones referenced by historical orders protected by `ON DELETE RESTRICT`, so that past customer orders and financial records cannot be corrupted by accidental deletion of a delivery zone.
20. As a Frontend Engineer, I want validation errors on delivery zone creation and updates returned in the standard error envelope `{ success: false, error: { code, message, details } }`, so that administrative forms display field-specific validation feedback.
21. As an API Consumer, I want unauthenticated or non-admin requests to admin delivery zone endpoints rejected with appropriate HTTP 401 or 403 status codes, so that unauthorized users cannot view or manipulate delivery zone settings.

## Implementation Decisions

- **Domain Glossary & Architecture Compliance**:
  Strict adherence to `GLOSSARY.md` definitions (Customer/الزبون, Guest/الزائر, Staff/الموظف, Manager/المدير, Order/الطلب) and [ADR 0001: Core MVP Business Rules](file:///home/mahmoud/Desktop/متجر%20حلويات/docs/adr/0001-core-mvp-business-rules.md) and [ADR 0004: Backend Common Infrastructure Conventions](file:///home/mahmoud/Desktop/متجر%20حلويات/docs/adr/0004-backend-common-infrastructure-conventions.md).

- **Architectural Seams and Layering**:
  1. **Models Layer**:
     - Entity `DeliveryZone` inheriting `TimeStampedModel` from `apps.common.models`.
     - Primary key generated via `generate_prefixed_id('zone')` yielding 32-character URL-safe string.
     - Database-level constraints:
       - `name`: `VARCHAR(150)`, non-empty.
       - `delivery_fee`: `DECIMAL(10, 2)`, check constraint `>= 0.00`, default `0.00`.
       - `min_order_amount`: `DECIMAL(10, 2)`, check constraint `>= 0.00`, default `0.00`.
       - `estimated_time_min`: `INTEGER`, check constraint `>= 5`.
       - `estimated_time_max`: `INTEGER`, check constraint `>= estimated_time_min` and `<= 240`.
       - `is_active`: `BOOLEAN`, default `True`, indexed for fast active zone filtering.
  2. **Policies & Permissions Layer**:
     - Pure Python policy function `can_manage_delivery_zones(user)` returning `True` only when `user.is_authenticated` and `user.role == 'manager'`.
     - DRF Permission class `IsManager` delegating to the management policy for write operations (`POST`, `PUT`).
     - DRF Permission class `IsStaffOrManager` allowing authenticated Staff and Managers read access to admin zone listings.
     - Storefront listing requires `AllowAny` permission.
  3. **Selectors Layer (Read Operations)**:
     - `list_active_delivery_zones()`: read-only queryset filtering `is_active=True`, ordered by `name`.
     - `list_all_delivery_zones()`: read-only queryset returning all delivery zones ordered by `name` or `created_at`.
     - `get_delivery_zone_by_id(zone_id)`: returns a single zone or raises entity not found.
  4. **Services Layer (Write Operations)**:
     - `create_delivery_zone(...)`: creates and persists a new `DeliveryZone` entity with validated parameters inside an atomic transaction.
     - `update_delivery_zone(zone, ...)`: updates entity fields and saves inside an atomic transaction.
     - Physical deletion is deliberately excluded; operational deactivation is handled through `update_delivery_zone` with `is_active=False`.
  5. **Serializers & Views Layer**:
     - `DeliveryZoneSerializer`: serializer handling representation of delivery zones with camelCase conversion for `deliveryFee`, `minOrderAmount`, `estimatedTimeMin`, `estimatedTimeMax`, `isActive`.
     - `DeliveryZoneCreateUpdateSerializer`: validation serializer enforcing constraints: `name` (min length 3), `delivery_fee >= 0`, `min_order_amount >= 0`, `estimated_time_min >= 5`, `estimated_time_max >= estimated_time_min` and `<= 240`, `is_active` boolean.
     - Storefront view `StorefrontDeliveryZoneListView`: thin APIView using `list_active_delivery_zones`.
     - Admin views:
       - `AdminDeliveryZoneListView`: handles `GET` (Staff/Manager) and `POST` (Manager only).
       - `AdminDeliveryZoneDetailView`: handles `PUT` (Manager only).
  6. **URLs Configuration**:
     - Public routing: `/api/v1/delivery-zones`
     - Admin routing: `/api/v1/admin/delivery-zones` and `/api/v1/admin/delivery-zones/<id>`

- **Entity Schema Shape (Prototype Decision Reference)**:
```python
# DeliveryZone schema specification
{
    "id": "zone_gaza_central",
    "name": "مدينة غزة - الرمال والنصر والمركز",
    "delivery_fee": 10.00,
    "min_order_amount": 30.00,
    "estimated_time_min": 30,
    "estimated_time_max": 60,
    "is_active": True,
    "created_at": "2026-11-15T12:00:00Z",
    "updated_at": "2026-11-15T12:00:00Z",
}
```

## Testing Decisions

- **Testing Philosophy**: Good tests evaluate external behavior through high-level boundaries rather than private implementation details. Tests verify HTTP status codes, payload structures, role access restrictions, and validation feedback.
- **Highest Seam**: Django REST Framework `APITestCase` exercising the complete HTTP request-response cycle through the API endpoints:
  - `GET /api/v1/delivery-zones`: verifies public access, active zone inclusion, inactive zone exclusion, camelCase field formatting, and response envelope wrapping.
  - `GET /api/v1/admin/delivery-zones`: verifies unauthenticated access rejection (401), staff access granted (200), manager access granted (200), and inclusion of inactive zones.
  - `POST /api/v1/admin/delivery-zones`: verifies unauthenticated rejection (401), staff rejection (403), manager authorized creation (201), and validation rejection (400) for negative fees, negative minimums, `estimatedTimeMin < 5`, or `estimatedTimeMax < estimatedTimeMin`.
  - `PUT /api/v1/admin/delivery-zones/{id}`: verifies manager update authorization (200), staff rejection (403), 404 on nonexistent ID, and update of fee, thresholds, and active status.
- **Secondary Seam**: Database model constraint testing ensuring DB check constraints prevent invalid records (`delivery_fee < 0`, `min_order_amount < 0`, `estimated_time_min < 5`, `estimated_time_max < estimated_time_min`).
- **Prior Art**: Common infrastructure tests in `backend/apps/common/tests/` and frontend contract definitions in `src/types/index.ts`.

## Out of Scope

- Customer authentication or accounts (all storefront checkout operations remain guest checkout).
- Real-time courier/driver GPS tracking, live map views, or WebSockets.
- Dynamic distance-based GPS polygon calculation (flat fee per predefined zone in MVP).
- Time-based surge pricing or delivery discount coupons.
- In-store customer pickup option (disabled for MVP per ADR 0001).
- Physical hard deletion of delivery zones through the API (preserves foreign key integrity for historical orders).

## Further Notes

- Fully compatible with Django 5 and Django REST Framework 3.15+.
- Reuses `TimeStampedModel`, `generate_prefixed_id`, unified camelCase content negotiation, and error handling from `apps.common`.
- The `Order` entity implemented in Phase 5 will link to `DeliveryZone` via foreign key with `ON DELETE RESTRICT`.
