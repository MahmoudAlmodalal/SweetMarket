# مواصفات التنفيذ: البيانات التجريبية والأمر الإداري للواجهة الخلفية (Backend Phase 6 Seed Data & Management Command Spec)

## Problem Statement

When onboarding new developers, spinning up automated test environments, previewing storefront features, or verifying administrative workflows, team members need realistic, coherent, and domain-accurate data populated across the entire system. Without a unified, automated seeding engine:
- Developers and QA testers start with an empty database, unable to log into the administrative portal, inspect catalog categories, simulate checkout flows, or test order state machine transitions.
- Manual data entry through administrative screens or raw database fixtures is slow, error-prone, and frequently violates complex domain constraints (such as check constraints on prices, delivery time windows, Palestinian phone number normalization, or the 7-stage order status transition policies).
- Different environments diverge in data structure, making bug reproduction difficult and leading to frontend-backend contract mismatches.
- Testers cannot immediately observe orders in all 7 lifecycle states (`new`, `accepted`, `in_preparation`, `out_for_delivery`, `delivered`, `undelivered`, `cancelled`), delaying verification of kitchen queues, delivery dispatches, and managerial audit tracking.
- The order numbering sequence table (`OrderSequence`) risks desynchronization with seeded orders if not initialized in lockstep, resulting in sequence collision errors on the very first live checkout after seeding.

## Solution

Deliver the dedicated database seeding management command `seed_candy_loz` (executable via `python manage.py seed_candy_loz`), adhering to Django management command best practices and the project's strict architecture and domain rules:
- **Idempotent & Clean Execution**: Supports safe re-running on an existing database without crashing or duplicating unique entities, with an optional `--clean` flag to flush and rebuild domain datasets from a pristine baseline.
- **Administrative Personnel Scaffolding**: Seeds pre-configured admin accounts with cryptographically hashed passwords and appropriate role assignments:
  - Store Manager (المدير): `username = 'admin'`, role `manager`, credential `Admin@123456`, with full operational and managerial authorization.
  - Operations Staff (الموظف): `username = 'staff1'`, role `staff`, credential `Staff@123456`, with kitchen and order progression authorization.
- **Comprehensive Product Catalog**: Seeds 5 realistic categories and 15 distinct sweets products matching the Candy Loz menu:
  - Categories covering Oriental Sweets (البقلاوة والحلويات الشرقية), Cakes & Tarts (كيك وتورتات المناسبات), Kunafa & Nabulsi Sweets (كنافة وحلويات نابلسية), Chocolate & Gift Boxes (شوكولاتة وبوكسات هدايا), and Petit Fours & Maamoul (بيتيفور ومعمول فاخر).
  - 15 products with rich Arabic and English names, detailed ingredient descriptions, primary and gallery image references, diverse units (`kg`, `half_kg`, `piece`, `box`), base prices, promotional sale prices, featured badges, kitchen availability flags, and multiple weight variation options (`ProductWeightOption`).
- **Gaza Delivery Territory Coverage**: Seeds 6 realistic delivery zones spanning the Gaza Strip (Central Gaza, Rimal & Tel Al-Hawa, Sheikh Ajleen, North Gaza, Khan Younis, Deir Al-Balah) with calibrated delivery fees, minimum order thresholds, and realistic delivery time windows.
- **7-Stage Lifecycle Order Samples**: Seeds realistic test orders spanning every status in the 7-stage state machine:
  - Orders in `new`, `accepted`, `in_preparation`, `out_for_delivery`, `delivered`, `undelivered`, and `cancelled` states.
  - Frozen historical snapshots in `OrderItem` preserving product names, slugs, weights, and unit prices.
  - Normalized Palestinian customer mobile numbers (`059xxxxxxx`, `056xxxxxxx`) and realistic street addresses.
  - Comprehensive `OrderStatusHistory` timeline records with timestamps, transitional notes, managerial reasons for cancellations and delivery failures, and actor attribution.
  - Synchronized `OrderSequence` table ensuring that subsequently created guest orders increment seamlessly without numbering collisions (`CL-YYYY-NNNN`).

## User Stories

1. As a Backend Developer, I want to execute `python manage.py seed_candy_loz` from the terminal, so that my local database is instantly populated with a complete, realistic dataset.
2. As a Backend Developer, I want the seed command to wrap database writes in an atomic transaction, so that partial failures leave the database clean rather than half-seeded.
3. As a Backend Developer, I want the seed command to support a `--clean` flag, so that I can wipe existing domain data and re-seed from a known clean state during development iterations.
4. As a Backend Developer, I want running the seed command without `--clean` on an already-seeded database to execute idempotently without primary key or unique constraint crashes, so that CI pipelines can safely invoke it repeatedly.
5. As a QA Engineer, I want the command to seed a default Manager account (`admin` / `Admin@123456`), so that I can immediately authenticate and test managerial capabilities (such as order cancellation, user management, and catalog pricing).
6. As a QA Engineer, I want the command to seed a default Staff account (`staff1` / `Staff@123456`), so that I can authenticate and test operational restrictions (such as kitchen queue progression and availability toggles).
7. As a QA Engineer, I want passwords to be hashed using Django's standard password hashing mechanism, so that seeded users can authenticate through the standard JWT login endpoint (`/api/v1/admin/auth/login`).
8. As a Frontend Engineer, I want the seed command to create 5 standard categories with valid Arabic names, slugs, and SVG/PNG image paths, so that the storefront home page and category chips render visually without broken images.
9. As a Frontend Engineer, I want 15 sweets products distributed across the 5 categories, so that catalog grids, category filters, and search queries return diverse and realistic results.
10. As a Frontend Engineer, I want products to include valid weight options (e.g., 0.5 kg, 1 kg, family tray), so that product detail pages and the weight selector drawer behave realistically.
11. As a Frontend Engineer, I want some seeded products marked with promotional sale prices (`sale_price < price`), so that discount badges, strikethrough prices, and savings calculations can be visually confirmed.
12. As a Frontend Engineer, I want at least one product marked as out of stock (`is_available = False`), so that out-of-stock UI states and checkout rejection rules can be verified.
13. As a Frontend Engineer, I want multiple products marked as featured (`is_featured = True`), so that the "Most Popular" (الأكثر طلباً) carousel on the home page displays full rows of products.
14. As a Store Manager, I want the seed command to create 6 delivery zones covering Gaza, so that delivery fee calculation and minimum spend requirements reflect authentic operating territories.
15. As a Store Manager, I want delivery zones to have calibrated minimum order amounts (e.g., 30 ₪, 40 ₪, 50 ₪) and delivery fees (e.g., 10 ₪, 12 ₪, 15 ₪, 20 ₪), so that cart threshold validation works accurately.
16. As a QA Engineer, I want the database populated with orders in all 7 lifecycle states (`new`, `accepted`, `in_preparation`, `out_for_delivery`, `delivered`, `undelivered`, `cancelled`), so that all tabs and status filters in the administrative orders list display sample data.
17. As an Operations Staff member, I want seeded `new` and `accepted` orders to test kitchen queue prioritization and status progression to `in_preparation`.
18. As an Operations Staff member, I want seeded `in_preparation` orders to test courier dispatch to `out_for_delivery`.
19. As a Store Manager, I want seeded `undelivered` orders with documented reasons (e.g., customer unreachable), so that I can test re-attempting delivery or permanent cancellation workflows.
20. As an Auditor, I want seeded `cancelled` orders to include mandatory cancellation reasons (>= 5 characters) and managerial actor attribution, so that audit compliance is verified.
21. As an Auditor, I want all seeded orders to have full historical item snapshots in `OrderItem`, so that order receipts remain decoupled from future catalog price modifications.
22. As a Customer, I want seeded orders to use normalized Palestinian mobile numbers (`059xxxxxxx`, `056xxxxxxx`), so that I can test public order tracking using valid phone numbers and order numbers.
23. As a Customer, I want seeded orders to have complete `OrderStatusHistory` timelines, so that the public tracking timeline displays authentic chronological stages.
24. As a System Administrator, I want the `OrderSequence` table initialized to match the highest seeded order number, so that subsequent guest orders placed via the API do not crash with duplicate order number errors.
25. As a DevOps Engineer, I want the management command to print clear progress messages to stdout detailing the number of entities created, so that build logs provide transparent feedback.

## Implementation Decisions

- **Command Architecture and Placement**:
  - The management command will be implemented within the shared common infrastructure module (`apps.common`) under the management commands directory, enabling it to orchestrate domain models across `accounts`, `catalog`, `delivery`, and `orders`.
  - The command inherits from `BaseCommand` and accepts `--clean` (boolean flag to reset domain tables prior to seeding) and `--verbosity` (standard Django argument to control output noise).

- **Execution Atomicity and Reset Safety**:
  - The entire seeding process runs inside `transaction.atomic()`. If any step fails, all changes are rolled back completely.
  - When `--clean` is passed, entities are removed in reverse dependency order (`OrderStatusHistory` ➔ `OrderItem` ➔ `Order` ➔ `OrderSequence` ➔ `ProductWeightOption` ➔ `Product` ➔ `Category` ➔ `DeliveryZone` ➔ `AdminUser`), respecting foreign key constraints (`CASCADE` and `RESTRICT`).
  - Without `--clean`, the command operates idempotently: checking existing records by natural keys (`username` for users, `slug` for categories/products, `name` for delivery zones, `order_number` for orders) and updating or skipping them rather than raising duplicate key errors.

- **Admin Credential Encryption**:
  - Administrative accounts are created using `AdminUser.objects.create_user()` to ensure passwords (`Admin@123456` and `Staff@123456`) are hashed with PBKDF2/SHA256, allowing immediate JWT authentication.

- **Order Sequence Calibration**:
  - The seed command explicitly sets the `OrderSequence` counter for the current calendar year to the highest sequential integer used among the seeded sample orders (e.g., `last_number = 1007` for 7 seeded orders), preventing primary key collisions when live checkout resumes.

- **Historical Order Snapshot Integrity**:
  - Seeded order items strictly populate frozen snapshot fields (`product_name`, `product_slug`, `product_image_url`, `unit_price`, `unit`, `weight_multiplier`, `weight_label`, `quantity`, `line_total`), ensuring compliance with ADR 0001 and ADR 0004.

- **Sample Orders Prototype Data Structure (Prototype Decision Reference)**:
```python
# Specification for 7-state sample orders matrix
SAMPLE_ORDERS_SPEC = [
    {
        "order_number": "CL-2026-1001",
        "status": "new",
        "customer_name": "أحمد محمود السقا",
        "customer_phone": "0599123456",
        "zone_name": "مدينة غزة والرمال والنصر",
        "street_address": "شارع عمر المختار - بجوار بنك فلسطين",
        "building_or_apt": "عمارة السقا - الطابق الثالث - شقة 6",
        "notes": "يرجى التوصيل ساخناً قبل صلاة العصر إن أمكن",
        "timeline": [
            ("new", "تم استلام الطلب وبانتظار المراجعة", None),
        ],
    },
    {
        "order_number": "CL-2026-1002",
        "status": "accepted",
        "customer_name": "فاطمة إبراهيم خليل",
        "customer_phone": "0599876543",
        "zone_name": "المحافظة الوسطى (دير البلح والنصيرات)",
        "street_address": "دير البلح - شارع النخيل",
        "building_or_apt": "منزل عائلة خليل",
        "notes": "الاتصال عند بوابة الشارع",
        "timeline": [
            ("new", "تم استلام الطلب", None),
            ("accepted", "تم قبول الطلب وجدولة التجهيز", "staff1"),
        ],
    },
    {
        "order_number": "CL-2026-1003",
        "status": "in_preparation",
        "customer_name": "سعيد عبد الرحمن عواد",
        "customer_phone": "0569112233",
        "zone_name": "مدينة غزة والرمال والنصر",
        "street_address": "حي الرمال - شارع الشهداء",
        "building_or_apt": "برج الجوهرة - الطابق 5",
        "notes": "تغليف مخصص للإهداء مع بطاقة",
        "timeline": [
            ("new", "تم استلام الطلب", None),
            ("accepted", "تم قبول الطلب", "staff1"),
            ("in_preparation", "بدء تحضير الكنافة والبقلاوة الطازجة بالمطبخ", "staff1"),
        ],
    },
    {
        "order_number": "CL-2026-1004",
        "status": "out_for_delivery",
        "customer_name": "مريم يوسف حسونة",
        "customer_phone": "0599334455",
        "zone_name": "خان يونس ووسط البلد",
        "street_address": "شارع جلال - بالقرب من القلعة",
        "building_or_apt": "عمارة حسونة - الطابق الأرضي",
        "notes": "الدفع بمبلغ 200 شيكل نقداً بحاجة لفكّة",
        "timeline": [
            ("new", "تم استلام الطلب", None),
            ("accepted", "تم قبول الطلب", "staff1"),
            ("in_preparation", "تم الانتهاء من التجهيز والتغليف", "staff1"),
            ("out_for_delivery", "خرج مع مندوب التوصيل", "staff1"),
        ],
    },
    {
        "order_number": "CL-2026-1005",
        "status": "delivered",
        "customer_name": "خالد كمال الغصين",
        "customer_phone": "0568778899",
        "zone_name": "الشيخ عجلين وتل الهوا",
        "street_address": "تل الهوا - خلف الهلال الأحمر",
        "building_or_apt": "فيلا الغصين",
        "notes": "تم التسليم بنجاح وتحصيل المبلغ",
        "timeline": [
            ("new", "تم استلام الطلب", None),
            ("accepted", "تم قبول الطلب", "staff1"),
            ("in_preparation", "تجهيز الطلب", "staff1"),
            ("out_for_delivery", "خرج للتوصيل", "staff1"),
            ("delivered", "تم تسليم الطلب وتحصيل المبلغ كاملاً", "staff1"),
        ],
    },
    {
        "order_number": "CL-2026-1006",
        "status": "undelivered",
        "customer_name": "ياسر حسن طه",
        "customer_phone": "0599556677",
        "zone_name": "شمال غزة (جباليا وبيت لاهيا)",
        "street_address": "جباليا البلد - شارع الفالوجا",
        "building_or_apt": "بجوار مسجد العودة",
        "notes": "محاولة توصيل متعذرة",
        "cancel_reason": "الزبون لا يجيب على الهاتف بعد 4 محاولات اتصال من المندوب",
        "timeline": [
            ("new", "تم استلام الطلب", None),
            ("accepted", "تم قبول الطلب", "staff1"),
            ("in_preparation", "تجهيز الطلب", "staff1"),
            ("out_for_delivery", "خرج للتوصيل", "staff1"),
            ("undelivered", "تعذر التسليم: الزبون لا يجيب على الهاتف بعد 4 محاولات اتصال من المندوب", "admin"),
        ],
    },
    {
        "order_number": "CL-2026-1007",
        "status": "cancelled",
        "customer_name": "هدى سليم النجار",
        "customer_phone": "0599667788",
        "zone_name": "مدينة رفح",
        "street_address": "حي الجنينة - شارع البحر",
        "building_or_apt": "عمارة النجار - شقة 2",
        "notes": "إلغاء الطلب بناء على رغبة الزبونة",
        "cancel_reason": "اتصلت الزبونة وطلبت الإلغاء لظرف طارئ قبل بدء التحضير",
        "timeline": [
            ("new", "تم استلام الطلب", None),
            ("cancelled", "إلغاء من قبل الإدارة: اتصلت الزبونة وطلبت الإلغاء لظرف طارئ قبل بدء التحضير", "admin"),
        ],
    },
]
```

## Testing Decisions

- **Testing Philosophy**: Tests must exercise the management command through its primary public boundary — invoking `call_command('seed_candy_loz')` — and assert external database side-effects and invariants rather than mocking internal creation helper methods.
- **Primary Seam**: Django `TestCase` executing the management command via `call_command`:
  - `test_seed_candy_loz_creates_expected_data`:
    - Executes `call_command('seed_candy_loz')` on a blank database.
    - Asserts 2 admin users exist (`admin` as manager, `staff1` as staff).
    - Verifies `admin.check_password('Admin@123456')` and `staff1.check_password('Staff@123456')` evaluate to `True`.
    - Asserts 5 categories exist with matching slugs and positive `display_order`.
    - Asserts 15 products exist with related `ProductWeightOption` records, non-empty descriptions, and valid pricing.
    - Asserts 6 delivery zones exist with active status, valid fees, and positive minimum order thresholds.
    - Asserts 7 sample orders exist, exactly one in each of the 7 states (`new`, `accepted`, `in_preparation`, `out_for_delivery`, `delivered`, `undelivered`, `cancelled`).
    - Verifies order numbers follow `CL-2026-1001` through `CL-2026-1007`.
    - Verifies the `OrderSequence` table has `last_number >= 1007` for the current year.
    - Verifies all phone numbers match the normalized 10-digit format (`059xxxxxxx` / `056xxxxxxx`).
    - Verifies `OrderItem` records have populated snapshot fields (`product_name`, `unit_price`, `quantity`, `line_total`).
    - Verifies `OrderStatusHistory` entries exist for every order with proper actor foreign keys and cancellation reasons.
  - `test_seed_candy_loz_idempotent`:
    - Executes `call_command('seed_candy_loz')` twice consecutively without `--clean`.
    - Verifies command terminates with exit code 0 without raising `IntegrityError` or creating duplicate users/categories/products.
  - `test_seed_candy_loz_clean_flag`:
    - Seeds custom or existing records, then runs `call_command('seed_candy_loz', clean=True)`.
    - Verifies obsolete data is cleared and the canonical dataset is cleanly rebuilt without orphan foreign key violations.
- **Prior Art**: Authentication tests in `backend/apps/accounts/tests/`, catalog tests in `backend/apps/catalog/tests/`, and delivery zone tests in `backend/apps/delivery/tests/`.

## Out of Scope

- Downloading external image assets over the internet (image URLs refer to static public paths).
- Provisioning production database credentials or hardcoding production secrets.
- Exposing the database seeding command over public REST API endpoints (restricted strictly to CLI invocation).
- Generating mock electronic payment receipts or credit card data (all seeded orders strictly use Cash on Delivery `cash_on_delivery`).
- Generating dummy GPS coordinates or real-time driver tracking locations.

## Further Notes

- Compatible with SQLite for local development and PostgreSQL for staging and production.
- Strictly adheres to the project domain glossary (`GLOSSARY.md`) and architectural guidelines (ADR 0001, ADR 0003, and ADR 0004).
- Provides immediate out-of-the-box readiness for frontend integration testing, E2E testing, and manual visual verification.
