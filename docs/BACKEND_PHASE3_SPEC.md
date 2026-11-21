# مواصفات التنفيذ: كتالوج المنتجات والتصنيفات والأوزان (Backend Phase 3 Catalog & Products Spec)

## Problem Statement

Customers browsing the Candy Loz storefront require an intuitive, fast, and structured way to discover sweets across categories, filter items by craving or popularity, inspect detailed product descriptions with custom weight variations (e.g., half kg, full kg, piece, box), and see accurate live pricing in Palestinian Shekels (ILS).

Simultaneously, store owners (Managers) and kitchen staff face significant operational challenges:
- Kitchen staff need to instantly mark products as "unavailable" when ingredients run out during peak hours without having full catalog editing rights or risking accidental deletion.
- Store managers need complete autonomy to create, update, and manage categories and sweets without developer intervention.
- Hard-deleting products that were previously ordered breaks historical customer records, disrupts financial summaries, and corrupts audit trails.
- Storefront queries that fetch products and their weight options without eager-loading cause N+1 database bottlenecks, slowing page loads for customers on mobile connections.

## Solution

Deliver the complete, production-grade Catalog backend module (`apps.catalog`) adhering to the strict architectural pipeline (`Models → Policies → Permissions → Selectors → Services → Views → Serializers → URLs`):
- Category and Product domain models with secure prefixed identifiers (`cat_*`, `prod_*`, `pwo_*`), slug uniqueness, Arabic/English naming, pricing constraints, and weight options.
- High-performance, read-only Selectors for storefront catalog browsing, search, and category filtering, fully optimized with eager-loading (`select_related` and `prefetch_related`) to prevent N+1 queries.
- Rapid operational endpoints allowing both Staff and Managers to toggle kitchen product availability with a single click (`FR-022`).
- Strict catalog management policies enforcing Manager-only permissions for product creation, modification, and deletion.
- Automatic soft-archiving (`BR-009`): Products associated with historical orders are protected from physical deletion; attempting to delete them automatically transitions them to archived status (`is_archived = True`, `is_available = False`), safeguarding historical integrity.
- Full compatibility with the shared common infrastructure: automatic camelCase serialization, uniform response wrapping `{ success: true, data, meta }`, standard pagination, and centralized error envelopes.

## User Stories

1. As a Customer, I want to view all active sweet categories, so that I can easily navigate to my preferred category of sweets.
2. As a Customer, I want categories ordered by a predefined display order, so that the store's signature collections appear first.
3. As a Customer, I want to browse products within a specific category, so that I can find sweets matching my current craving.
4. As a Customer, I want to search sweets by keyword across names and descriptions, so that I can quickly find specific treats like "بقلاوة" or "معمول".
5. As a Customer, I want to filter products by featured status, so that I can discover the store's best-selling items immediately on the homepage.
6. As a Customer, I want to view detailed product information including high-resolution images, gallery images, and descriptions, so that I can inspect the sweet before ordering.
7. As a Customer, I want to see different weight options (e.g., half kg, full kg, box) and their corresponding prices, so that I can select the exact quantity suitable for my occasion.
8. As a Customer, I want promotional sale prices clearly displayed alongside original prices, so that I can benefit from active discounts.
9. As a Customer, I want unavailable items clearly marked or hidden from order selection, so that I never order sweets that the kitchen cannot fulfill.
10. As a Customer, I want paginated product listings with limit and page parameters, so that browsing large collections loads smoothly without lagging on mobile devices.
11. As a Staff member, I want to toggle any product's immediate availability (available / unavailable) in one click, so that I can pause orders for items that run out of stock during service.
12. As a Staff member, I want to be restricted from modifying product prices, descriptions, or categories, so that business pricing rules remain protected.
13. As a Manager, I want to add new sweet categories with unique slugs, Arabic names, descriptions, images, and sort orders, so that I can expand our catalog as our offerings grow.
14. As a Manager, I want to edit existing categories, so that category branding and sort order can be refined over time.
15. As a Manager, I want to delete empty categories, so that deprecated menu sections are removed cleanly.
16. As a Manager, I want category deletion blocked if products are still assigned to it, so that products are never orphaned without a category.
17. As a Manager, I want to create new products with unique slugs, prices, measurement units, images, and multiple weight options, so that new sweets are published seamlessly to the storefront.
18. As a Manager, I want validation enforcing that sale prices must be strictly lower than regular prices and greater than zero, so that erroneous pricing data cannot enter the system.
19. As a Manager, I want to update existing product details, images, and weight tiers, so that recipes, packaging, and prices remain current.
20. As a Manager, I want to delete a product that has never been ordered, so that test entries or erroneous drafts are permanently removed.
21. As a Manager, I want products with past order history to be safely archived instead of deleted, so that historical receipts and financial logs remain intact.
22. As a Manager, I want archived products excluded from storefront listings and customer searches, so that customers cannot view or order discontinued items.
23. As a Manager, I want an administrative catalog view listing all products including archived and unavailable items with status filters, so that I have complete oversight over the inventory.
24. As an API Consumer, I want all catalog responses formatted in camelCase and enveloped in `{ success: true, data, meta }`, so that frontend state hooks consume data consistently.
25. As an API Consumer, I want invalid product submissions to return structured validation errors with dot-notated field paths, so that admin form inputs highlight exact validation failures.

## Implementation Decisions

- **Domain Glossary & ADR Compliance**:
  - Adheres strictly to terms defined in `GLOSSARY.md` (Product, Staff, Customer, Prefixed ID).
  - Aligns with [ADR 0001: Core MVP Business Rules](file:///home/mahmoud/Desktop/متجر%20حلويات/docs/adr/0001-core-mvp-business-rules.md) and [ADR 0004: Backend Common Infrastructure Conventions](file:///home/mahmoud/Desktop/متجر%20حلويات/docs/adr/0004-backend-common-infrastructure-conventions.md).
- **Architectural Layering**:
  - **Models**:
    - `Category`: Prefixed primary key (`cat_*`), unique URL-safe slug, Arabic name, optional description, image URL, integer display order, active status flag, and immutable timestamp tracking.
    - `Product`: Prefixed primary key (`prod_*`), unique URL-safe slug, Arabic name, optional English name, detailed description, foreign key to Category with `RESTRICT` deletion policy, positive base decimal price, optional sale price with check constraint (`sale_price < price`), unit choice enum (`kg`, `half_kg`, `piece`, `box`), main image URL, JSON array for gallery images, boolean flags for availability, featured status, and archive status.
    - `ProductWeightOption`: Prefixed primary key (`pwo_*`), cascading foreign key to Product, descriptive label (e.g., "نصف كيلو"), decimal unit multiplier, decimal price, and integer display order.
    - Indexing: Composite index on `(category_id, is_available)` filtering out archived records for lightning-fast storefront filtering.
  - **Policies (Pure Python)**:
    - `can_manage_catalog(user)`: Enforces that catalog entity authoring and destructive actions are restricted to users with the `manager` role.
    - `can_toggle_availability(user)`: Permits both `staff` and `manager` roles to modify product kitchen availability (`FR-022`).
    - `can_delete_product(user, product)`: Verifies role permissions and checks whether the product is referenced in historical order items (`order_items`). If historical references exist, mandates soft-archiving instead of physical deletion (`BR-009`).
    - `can_delete_category(user, category)`: Enforces manager role and blocks deletion if any active or archived products remain linked to the category.
  - **Permissions (DRF)**:
    - Public access (`AllowAny`) for public storefront retrieval endpoints.
    - Authenticated role checks (`IsStaffOrManager`, `IsManager`) for administrative endpoints.
  - **Selectors (Read-only CQS)**:
    - `list_storefront_categories()`: Retrieves active categories ordered by `display_order`.
    - `list_storefront_products(category, search, featured)`: Fetches non-archived products applying category, search, and featured filters. Uses `.select_related('category')` and `.prefetch_related('weight_options')` to completely eliminate N+1 queries.
    - `get_product_detail(slug_or_id)`: Fetches product by ID or slug with preloaded relationships; excludes archived items for storefront access.
    - `list_admin_products(category_id, is_available, is_archived, search)`: Comprehensive admin queries with filter parameters and preloaded relations.
    - `list_admin_categories()`: Lists all categories for administrative management.
  - **Services (Atomic CQS)**:
    - `create_category`, `update_category`, `delete_category`: Atomic category lifecycle operations.
    - `create_product`: Atomic creation of product record and associated weight options inside `transaction.atomic()`.
    - `update_product`: Atomic update of product fields and synchronization of weight options.
    - `toggle_product_availability`: Dedicated service updating only the `is_available` flag and logging actor context.
    - `delete_or_archive_product`: Service evaluating `BR-009` policy. Performs soft-archiving (`is_archived = True`, `is_available = False`) when historical orders exist; executes physical deletion when no historical references exist.
  - **API Contract & Endpoints**:
    - `GET /api/v1/categories`: Public list of active categories.
    - `GET /api/v1/products`: Public paginated product catalog with `category`, `search`, `featured`, `page`, and `limit` query parameters.
    - `GET /api/v1/products/{slugOrId}`: Public single product detail endpoint.
    - `GET /api/v1/admin/categories`: Admin category list.
    - `POST /api/v1/admin/categories`: Admin category creation (Manager only).
    - `PUT /api/v1/admin/categories/{id}`: Admin category update (Manager only).
    - `DELETE /api/v1/admin/categories/{id}`: Admin category deletion (Manager only, restricted).
    - `GET /api/v1/admin/products`: Admin product list with pagination and availability/archived filters.
    - `POST /api/v1/admin/products`: Admin product creation with weight options (Manager only).
    - `PUT /api/v1/admin/products/{id}`: Admin product update with weight options (Manager only).
    - `PATCH /api/v1/admin/products/{id}/availability`: Fast toggle for availability (Staff & Manager).
    - `DELETE /api/v1/admin/products/{id}`: Product deletion/archiving (Manager only).

## Testing Decisions

- **Testing Philosophy**: Test external behavior through highest available seams, asserting HTTP contracts, query budgets, and database states without coupling tests to internal method implementations.
- **Highest Seam (Primary)**:
  - DRF `APITestCase` executing full HTTP request-response cycles against `/api/v1/categories*`, `/api/v1/products*`, `/api/v1/admin/categories*`, and `/api/v1/admin/products*`.
  - Verifies:
    - Storefront public access vs. admin authentication barriers (401 Unauthorized for anonymous, 403 Forbidden for staff attempting manager-only mutations).
    - Staff role capability to successfully PATCH `/api/v1/admin/products/{id}/availability`.
    - Automated camelCase key conversion in request bodies and outgoing responses.
    - Standard envelope structure `{ success: true, data, meta }` and pagination metadata.
    - Validation error format for malformed inputs (invalid slug characters, negative prices, sale price exceeding base price).
    - Deletion behavior for products with historical order references verifying the soft-archive policy (`BR-009` / `EC-09`).
    - N+1 query regression guard: Using `self.assertNumQueries()` on product listing endpoints to ensure query count remains constant regardless of the number of products or weight options returned.
- **Secondary Seam**:
  - Unit tests for domain models asserting field constraints, unique constraints, prefixed ID generation on save, and custom check constraints.
- **Prior Art**:
  - `backend/apps/common/tests/test_renderers.py` and `test_pagination.py`.
  - Frontend contract fixtures in `src/types/index.ts` and `API.md`.

## Out of Scope

- Customer user accounts, shopping cart persistence, and customer authentication (checkout remains guest-only).
- Order placement, stock reservation, and payment processing (handled in Phase 5: Orders).
- Delivery zone management and distance calculation (handled in Phase 4: Delivery).
- Image file uploads or cloud object storage integration (MVP uses validated static/external URLs).
- Dynamic discount code or coupon management.
- Live kitchen WebSockets (status is polled via standard HTTP).

## Further Notes

- Implemented within `backend/apps/catalog/`.
- Designed to integrate seamlessly with the Phase 1 common foundation (`UnifiedCamelCaseJSONRenderer`, `CamelCaseJSONParser`, `StandardPagination`, `custom_exception_handler`, `TimeStampedModel`, `generate_prefixed_id`).
- Fully backward-compatible with Next.js frontend catalog components and types.
