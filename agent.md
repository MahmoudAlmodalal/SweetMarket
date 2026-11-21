# AI Agent Developer Guide & Architectural Handbook (agent.md)
## متجر حلويات كاندي لوز (Candy Loz E-Commerce Store)

> **Welcome AI Agents & Engineers!**  
> This file is the definitive repository handbook and source of truth for all AI agents, engineers, and contributors working on the **Candy Loz (متجر حلويات كاندي لوز)** codebase. It details the business domain, technical architecture, frontend and backend patterns, repository layout, essential commands, database models, and non-negotiable coding standards.

---

## Table of Contents
1. [Project Overview & Business Domain](#1-project-overview--business-domain)
2. [Tech Stack & System Architecture](#2-tech-stack--system-architecture)
3. [Repository Structure & Directory Map](#3-repository-structure--directory-map)
4. [Development Workflow & Essential Commands](#4-development-workflow--essential-commands)
5. [Database & Core Domain Entities](#5-database--core-domain-entities)
6. [Frontend Architecture & UI Guidelines](#6-frontend-architecture--ui-guidelines)
7. [Backend Architecture & API Standards](#7-backend-architecture--api-standards)
8. [Order State Machine & Business Rules](#8-order-state-machine--business-rules)
9. [Coding Standards & Agent Rules](#9-coding-standards--agent-rules)
10. [Troubleshooting & Verification Checklist](#10-troubleshooting--verification-checklist)

---

## 1. Project Overview & Business Domain

### 1.1 Context & Brand Identity
**Candy Loz (كاندي لوز)** is a boutique confectionery e-commerce platform operating in Palestine (Gaza / `Asia/Gaza` timezone). It blends the playful refinement and sensory indulgence of an artisanal Parisian pâtisserie with the warmth of traditional Middle Eastern confectionery (**Boutique Confectionery Elegance**).

The store catalog features:
- **الشرقيات الفاخرة (Artisanal Oriental Sweets):** Baklava varieties, kunafa, mabrouma, and mixed royal trays.
- **الكيك والتورتات (Signature Cakes & Tarts):** Pistachio berry, velvet truffle, lotus crunch, and celebratory cakes.
- **المعمول والكعك (Ma'amoul & Traditional Pastries):** Date and walnut ma'amoul, anise tea cookies.
- **المثلجات والمشروبات (Gelato & Beverages):** Natural fruit sorbets, iced Turkish coffees, and cold refreshments.
- **تشكيلات المناسبات (Event & Gift Boxes):** Curated luxury gift assortments with royal packaging.

### 1.2 User Roles & Operational Boundaries
The system strictly supports three user roles with well-defined boundaries:

| Role | Arabic Term | Description & Capabilities | Access Level |
|---|---|---|---|
| **Guest Customer** | الزبون / الزائر | Browses catalog, selects weights & packaging, places orders via **Guest Checkout** (COD only, no registration needed), tracks orders via Order # + Palestinian Phone. | Public Storefront |
| **Kitchen Staff** | موظف التجهيز | Views operational order queue, advances orders through kitchen preparation steps (`accepted` ➔ `in_preparation` ➔ `out_for_delivery` ➔ `delivered`), toggles instant product kitchen availability (`is_available`). | Admin Portal (`role: staff`) |
| **Store Manager** | المدير | Full administrative control: manages catalog (products, categories, weight options), delivery zones & fees, staff user accounts (RBAC), and handles order exceptions (`cancelled`, `undelivered` with mandatory reason). | Admin Portal (`role: manager`) |

### 1.3 Strict Out-of-Scope Boundaries (MVP Scope)
To avoid architectural regressions, agents must respect these MVP boundaries (`PRD_v0.2.md`):
- ❌ **No Customer Accounts:** No customer sign-up/login. Checkout is 100% guest-based (`D-UX-05`).
- ❌ **No Electronic Payment Gateways:** Payment is exclusively Cash on Delivery (`payment_method: cash_on_delivery`).
- ❌ **No Real-time Driver GPS Tracking:** No WebSockets or live map tracing for delivery drivers.
- ❌ **No Coupons or Loyalty Programs:** Out of scope for current release.
- ❌ **No Custom Cake Configurator:** Custom multi-tier design forms are deferred.

---

## 2. Tech Stack & System Architecture

### 2.1 High-Level Architecture Diagram
```
                     +-------------------------------------------------------+
                     |                 Client Browser                        |
                     |   (Storefront: Public | Admin: Bearer JWT Protected)  |
                     +-------------------------------------------------------+
                                                 |
                                     HTTP / REST API (JSON)
                                 (camelCase <-> snake_case)
                                                 |
                     +-------------------------------------------------------+
                     |             Next.js 14.2 (App Router)                 |
                     |  - Storefront Pages (RTL, Tokens, Components)         |
                     |  - Admin Dashboard Portal                             |
                     |  - Decoupled Repository Pattern (Storage / API)       |
                     +-------------------------------------------------------+
                                                 |
                                   Optional Live API Proxy
                                                 |
                     +-------------------------------------------------------+
                     |           Django 5.0 + Django REST Framework          |
                     |  - Strict 8-Layer CQS Architecture                    |
                     |  - Models -> Policies -> Permissions -> Selectors     |
                     |    -> Services -> Views -> Serializers -> URLs        |
                     +-------------------------------------------------------+
                                                 |
                     +-------------------------------------------------------+
                     |                       Database                        |
                     |   PostgreSQL 15+ (Supabase) / SQLite Fallback         |
                     |   Atomic Transactions & Concurrency Row Locking       |
                     +-------------------------------------------------------+
```

### 2.2 Frontend Stack
- **Framework:** Next.js `14.2.15` (App Router, React 18.3.1, Strict Mode, TypeScript 5)
- **Styling:** Tailwind CSS `3.4.1`, PostCSS `8`, Autoprefixer `10`
- **Design Tokens:** `src/app/tokens.css` (Strict CSS Variables for colors, spacing, radii, typography)
- **Fonts:** Next/Font Google (`El_Messiri` for display/headings, `IBM_Plex_Sans_Arabic` for body/prices)
- **Icons & Helpers:** Lucide React `0.453.0`, `clsx` `2.1.1`, `tailwind-merge` `2.5.4` (`cn` utility)
- **Validation:** Zod `4.6.7` (schemas in `src/lib/validations.ts`)
- **Testing:** Playwright `1.64.1` (test suites in `tests/`)

### 2.3 Backend Stack
- **Framework:** Python 3.10.12, Django `5.0+`, Django REST Framework `3.15+`
- **Authentication:** `djangorestframework-simplejwt 5.3+` (JWT with token blacklist)
- **Serialization Contract:** `djangorestframework-camel-case 1.4+` (transparent bidirectional `camelCase` ↔ `snake_case`)
- **Database:** PostgreSQL (via `psycopg2-binary 2.9+` and `dj-database-url 2.1+`), SQLite local fallback
- **Caching & Throttling:** `LocMemCache` default, Redis `5.0+` optional, IP rate-limiting for order tracking
- **Timezone & Locale:** `TIME_ZONE = 'Asia/Gaza'`, `USE_TZ = True`, `LANGUAGE_CODE = 'ar'`

---

## 3. Repository Structure & Directory Map

The repository is structured as a full-stack monorepo containing both the Next.js frontend and the Django backend:

```
/home/mahmoud/Desktop/متجر حلويات/
├── package.json                   # Frontend dependencies, scripts, and build targets
├── next.config.mjs                # Next.js config (Unsplash image remote patterns)
├── tailwind.config.js             # Tailwind design tokens & font family mappings
├── tsconfig.json                  # TypeScript compiler options (Path alias: @/* -> ./src/*)
├── backend/                       # Django 5 Backend Application
│   ├── manage.py                  # Django administrative script
│   ├── requirements.txt           # Python backend dependencies
│   ├── db.sqlite3                 # SQLite local development database (fallback)
│   ├── config/                    # Django project configuration
│   │   ├── settings.py            # Main settings (CORS, JWT, Apps, Database, Renderers)
│   │   ├── urls.py                # Root URL routing (/api/v1/ prefix)
│   │   ├── asgi.py & wsgi.py      # Server entry points
│   └── apps/                      # Django Modular Apps (Strict 8-Layer Pipeline)
│       ├── common/                # Shared utilities, base models, renderers, validators
│       │   ├── models.py          # TimeStampedModel, Prefixed ID generator
│       │   ├── renderers.py       # UnifiedCamelCaseJSONRenderer
│       │   ├── parsers.py         # CamelCaseJSONParser
│       │   ├── pagination.py      # StandardPagination (page & limit parameters)
│       │   ├── validators.py      # Palestinian phone normalization (059/056)
│       │   ├── exceptions.py      # Domain custom exceptions
│       │   └── exception_handler.py # Unified error envelope handler
│       ├── accounts/              # Admin authentication & RBAC user management
│       │   ├── models.py          # Custom AdminUser (manager vs staff)
│       │   ├── policies.py        # Business authorization rules
│       │   ├── permissions.py     # DRF permissions (IsManager, IsStaffOrManager)
│       │   ├── selectors.py       # Read-only user queries
│       │   ├── services.py        # User creation, updates, password resets
│       │   ├── serializers.py     # Serializers with camelCase representation
│       │   ├── views.py           # Thin API views
│       │   └── urls.py            # /api/v1/admin/auth/* and /api/v1/admin/users/*
│       ├── catalog/               # Categories, products, weights, and availability
│       │   ├── models.py          # Category, Product, ProductWeightOption
│       │   ├── policies.py        # Availability toggle & soft-delete policies
│       │   ├── permissions.py     # Catalog permissions
│       │   ├── selectors.py       # Optimized queries (select_related, prefetch_related)
│       │   ├── services.py        # Product CRUD, availability toggles, soft-archive
│       │   ├── serializers.py     # Public & Admin catalog serializers
│       │   ├── views.py           # Thin catalog views
│       │   └── urls.py            # /api/v1/categories and /api/v1/products
│       ├── delivery/              # Delivery zones, fees, and delivery timeframes
│       │   ├── models.py          # DeliveryZone model
│       │   ├── policies.py & permissions.py # Zone management access rules
│       │   ├── selectors.py & services.py   # Zone queries & mutations
│       │   ├── serializers.py & views.py    # Public & Admin delivery zone endpoints
│       │   └── urls.py            # /api/v1/delivery-zones
│       └── orders/                # (Phase 5) Order processing, tracking & audit trail
│           ├── models.py          # Order, OrderItem, OrderStatusHistory, OrderSequence
│           ├── policies.py        # 7-stage state machine & transition rules
│           ├── selectors.py       # Order listing, detail, and rate-limited tracking
│           ├── services.py        # Atomic checkout, status transitions, frozen snapshots
│           └── urls.py            # /api/v1/orders and /api/v1/admin/orders
├── src/                           # Next.js 14 Frontend Application
│   ├── app/                       # App Router Pages & Layouts
│   │   ├── tokens.css             # Canonical design tokens (Colors, Radii, Shadows)
│   │   ├── globals.css            # Global CSS resets & utility classes
│   │   ├── layout.tsx             # Root Layout (dir="rtl", lang="ar", fonts, SkipLink)
│   │   ├── not-found.tsx          # 404 Error recovery page (SCR-09)
│   │   ├── error.tsx              # Error boundary component (SCR-10)
│   │   ├── (storefront)/          # Public Customer Storefront Route Group
│   │   │   ├── page.tsx           # Home page: Hero, Categories, Best Sellers (SCR-01)
│   │   │   ├── category/[slug]/   # Category product listing & filter (SCR-02)
│   │   │   ├── product/[slug]/    # Product detail, weight options, add-to-cart (SCR-03)
│   │   │   ├── cart/              # Shopping cart view & quantity adjustments (SCR-04)
│   │   │   ├── checkout/          # Guest checkout & delivery zone picker (SCR-05)
│   │   │   │   └── success/[orderNumber]/ # Confirmation & tracking link (SCR-06)
│   │   │   ├── track/             # Order tracking by number + phone (SCR-07)
│   │   │   ├── contact/           # Store hours, location, WhatsApp concierge (SCR-08)
│   │   │   ├── favorites/         # Local wishlist items
│   │   │   └── account/           # Customer guest history / profile draft
│   │   └── admin/                 # Admin Dashboard Route Group
│   │       ├── login/             # Staff & Manager login page (SCR-11)
│   │       ├── forbidden/         # 403 Forbidden access control screen (SCR-20)
│   │       └── (dashboard)/       # Protected Admin Dashboard Layout
│   │           ├── orders/        # Orders list with status filtering (SCR-13)
│   │           │   └── [id]/      # Order details, status stepper & timeline (SCR-14)
│   │           ├── products/      # Product list & instant availability toggle (SCR-15)
│   │           │   ├── new/       # Create new product (SCR-16)
│   │           │   └── [id]/edit/ # Edit existing product (SCR-16)
│   │           ├── categories/    # Category management & display reordering (SCR-17)
│   │           ├── zones/         # Delivery zones, fees, and minimums (SCR-18)
│   │           ├── users/         # Admin user RBAC management (SCR-19)
│   │           └── account/password/ # Admin password update (SCR-12)
│   ├── components/                # Reusable UI & Layout Components
│   │   ├── ui/                    # Design System Primitive Components
│   │   │   ├── button.tsx, badge.tsx, card.tsx, dialog.tsx, drawer.tsx, input.tsx,
│   │   │   ├── select.tsx, skeleton.tsx, spinner.tsx, state-box.tsx, store-logo.tsx,
│   │   │   ├── tabs.tsx, textarea.tsx, toast.tsx, error-summary.tsx, skip-link.tsx
│   │   ├── layout/                # Shell & navigation components
│   │   │   ├── storefront-header.tsx, storefront-footer.tsx, mobile-dock.tsx,
│   │   │   └── admin-navbar.tsx, admin-sidebar.tsx, page-container.tsx
│   │   ├── storefront/            # Storefront domain components (product, cart, checkout)
│   │   └── admin/                 # Admin domain components (orders, products, users)
│   ├── context/                   # React Context Providers
│   │   ├── cart-context.tsx       # Cart state, packaging, zone, and localStorage sync
│   │   └── admin-auth-context.tsx # Admin auth state, JWT tokens, RBAC permissions
│   ├── lib/                       # Business Logic & Infrastructure
│   │   ├── repositories.ts        # Decoupled Repository Pattern (Storage vs API)
│   │   ├── storage.ts             # Type-safe SSR-guarded localStorage engine
│   │   ├── validations.ts         # Zod validation schemas
│   │   ├── pricing.ts             # Canonical price calculations (weights + packaging)
│   │   ├── store-hours.ts         # Operating hours checker (Asia/Gaza timezone)
│   │   ├── store-identity.ts      # Store constants & Schema.org JSON-LD
│   │   └── utils.ts               # cn() class merger and string utilities
│   ├── types/                     # TypeScript Domain Models & API Types
│   │   └── index.ts               # Unified type definitions
│   └── data/mock/                 # Mock Data Fixtures
│       ├── categories.ts, products.ts, zones.ts, orders.ts, users.ts
├── tests/                         # Automated Playwright Test Suites
│   ├── storefront-assertions.mjs  # Storefront customer journey test suite
│   ├── admin-portal-suite.mjs     # Admin portal RBAC & order workflow test suite
│   ├── e2e-rbac-recovery.mjs      # Role permissions & access control test suite
│   └── capture-gallery.mjs        # Visual regression & screenshot capture
├── docs/                          # Detailed Technical Phase Specs & ADRs
│   ├── adr/                       # Architectural Decision Records (ADR 0001 - 0005)
│   ├── BACKEND_PHASE1_SPEC.md to BACKEND_PHASE7_SPEC.md # Django Implementation Phase Specs
│   ├── FRONTEND_PLAN.md & FRONTEND_TASKS.md             # Frontend Roadmaps & Execution Tasks
│   ├── COMPONENT_ARCHITECTURE.md  # Frontend component architecture & composition
│   ├── FRONTEND_DATA_CONTRACTS.md # Frontend type & data contracts
│   ├── ROUTES_MAP.md              # Route definitions & access matrix
│   └── user-flow.md               # Complete end-to-end user flows
├── PRD_v0.2.md                    # Core Product Requirements Document (PRD v0.2)
├── API.md                         # REST API Contract Specification (v1.0.0)
├── ERD.md                         # Entity-Relationship Diagram & Database Schemas
├── backend_plan.md                # Django Backend Architecture & Plan
├── DESIGN.md                      # Design tokens, palette, and typography guide
├── GLOSSARY.md                    # Candy Loz Domain Terminology Dictionary
├── UI_UX_REQUIREMENTS.md          # UI/UX Specifications & Decision Log
├── UX_BLUEPRINT.md                # Screen blueprints and user journeys
└── SCREEN_INVENTORY.md            # Screen inventory & status tracking
```

---

## 4. Development Workflow & Essential Commands

### 4.1 Frontend Commands (Next.js)
Execute commands from the repository root:

```bash
# Install frontend dependencies
npm install

# Run Next.js development server (runs on http://localhost:3000)
npm run dev

# Build for production (verifies TypeScript & page generation)
npm run build

# Run Next.js ESLint
npm run lint

# Run Playwright Storefront assertion test suite
npm run test:storefront

# Run Playwright Admin Portal test suite
npm run test:admin

# Run E2E RBAC recovery tests
npm run test:e2e:rbac

# Run automated screenshot capture
npm run capture:gallery
```

### 4.2 Backend Commands (Django REST Framework)
Execute commands from the `backend/` directory:

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt
# Alternatively with uv:
uv pip install -r requirements.txt

# Run database migrations
python3 manage.py migrate

# Create new migrations when models change
python3 manage.py makemigrations

# Run the complete automated test suite (179+ tests)
python3 manage.py test --verbosity=2

# Run tests for a specific app
python3 manage.py test apps.catalog.tests
python3 manage.py test apps.accounts.tests
python3 manage.py test apps.delivery.tests
python3 manage.py test apps.common.tests

# Start Django development server (runs on http://127.0.0.1:8000)
python3 manage.py runserver

# Open Django interactive shell
python3 manage.py shell

# Seed test database (Phase 6 - Planned):
# python3 manage.py seed_candy_loz
```

### 4.3 Environment Variables Configuration
The project uses `.env` files for configuration. Refer to `.env.example`:

| Variable | Description | Example / Default |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Base frontend application URL | `http://localhost:3000` |
| `NEXT_PUBLIC_API_BASE_URL` | REST API base URL | `http://127.0.0.1:8000/api/v1` (or empty for mock) |
| `NEXT_PUBLIC_ENABLE_MOCK_STORAGE` | Enable offline mock localStorage storage | `true` (dev) / `false` (prod) |
| `DJANGO_SECRET_KEY` | Django cryptographic secret key | `your-secret-key-here` |
| `DJANGO_DEBUG` | Django debug mode flag | `True` (dev) / `False` (prod) |
| `DJANGO_ALLOWED_HOSTS` | Allowed hosts whitelist | `localhost,127.0.0.1` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` (falls back to SQLite) |
| `REDIS_URL` | Redis cache & rate-limit connection | `redis://127.0.0.1:6379/1` (optional) |
| `CORS_ALLOWED_ORIGINS` | Permitted frontend CORS origins | `http://localhost:3000` |

---

## 5. Database & Core Domain Entities

### 5.1 Prefixed Identifier Standard
All database tables utilize URL-safe, 32-character random string identifiers prefixed with a semantic entity type (`apps.common.models.generate_prefixed_id`):

| Prefix | Entity | Example |
|---|---|---|
| `usr_` | `AdminUser` | `usr_a1b2c3d4e5f6...` |
| `cat_` | `Category` | `cat_oriental_9f8d...` |
| `prod_` | `Product` | `prod_baklava_mix_2b3c...` |
| `pwo_` | `ProductWeightOption` | `pwo_half_kg_7e8f...` |
| `zone_` | `DeliveryZone` | `zone_gaza_central_3a...` |
| `ord_` | `Order` | `ord_9f8d1c2b3a4e...` |

### 5.2 Core Entities & Schemas

#### 1. `Category` (`apps.catalog.models.Category`)
Represents a product classification in the showcase vitrine.
- `id`: `varchar(32)` Primary Key (`cat_*`)
- `slug`: `varchar(100)` Unique, URL-safe slug
- `name`: `varchar(100)` Arabic display name
- `description`: `text` Brief description
- `image_url`: `varchar(500)` Category banner/tile image
- `display_order`: `integer` Vitrine presentation order (ascending)
- `is_active`: `boolean` Controls visibility on public storefront
- `created_at` & `updated_at`: Timestamps

#### 2. `Product` (`apps.catalog.models.Product`)
Represents an artisanal confectionery item.
- `id`: `varchar(32)` Primary Key (`prod_*`)
- `slug`: `varchar(150)` Unique URL-safe slug
- `name`: `varchar(150)` Arabic title (e.g., "بقلاوة مشكلة ملكية")
- `name_en`: `varchar(150)` Optional English title
- `description`: `text` Detailed ingredients and taste profile
- `category`: `ForeignKey(Category, on_delete=models.RESTRICT)`
- `price`: `decimal(10, 2)` Base unit price in ILS (₪)
- `sale_price`: `decimal(10, 2)` Optional promotional price
- `unit`: `varchar(20)` Unit type: `kg`, `half_kg`, `piece`, `box`
- `image_url`: `varchar(500)` Primary product card photography
- `gallery_images`: `JSONField` Array of secondary photo URLs
- `is_available`: `boolean` Instant kitchen availability (in-stock toggle)
- `is_featured`: `boolean` Highlights item in "الأكثر طلباً" vitrine
- `is_archived`: `boolean` Soft-delete flag preserving historical integrity
- `created_at` & `updated_at`: Timestamps

#### 3. `ProductWeightOption` (`apps.catalog.models.ProductWeightOption`)
Weight and portion multipliers configured for a specific product.
- `id`: `varchar(32)` Primary Key (`pwo_*`)
- `product`: `ForeignKey(Product, on_delete=models.CASCADE, related_name='weight_options')`
- `label`: `varchar(50)` Arabic label (e.g., "نصف كيلو", "1 كيلو")
- `multiplier`: `decimal(5, 2)` Portion ratio (e.g., `0.50`, `1.00`, `2.00`)
- `price`: `decimal(10, 2)` Computed or overridden price for this portion
- `display_order`: `integer` Display order in selector dropdown/chips

#### 4. `DeliveryZone` (`apps.delivery.models.DeliveryZone`)
Geographic delivery sector in the Gaza Strip.
- `id`: `varchar(32)` Primary Key (`zone_*`)
- `name`: `varchar(100)` Zone name (e.g., "غزة الوسطى والرمال")
- `delivery_fee`: `decimal(10, 2)` Fixed delivery charge in ILS
- `min_order_amount`: `decimal(10, 2)` Minimum basket total required
- `estimated_time_min`: `integer` Minimum delivery estimate (minutes)
- `estimated_time_max`: `integer` Maximum delivery estimate (minutes)
- `is_active`: `boolean` Controls zone availability at checkout

#### 5. `AdminUser` (`apps.accounts.models.AdminUser`)
Operational and administrative dashboard accounts.
- `id`: `varchar(32)` Primary Key (`usr_*`)
- `username`: `varchar(50)` Unique username
- `full_name`: `varchar(100)` Staff member's Arabic name
- `email`: `EmailField` Unique staff contact email
- `role`: `varchar(20)` Strict RBAC role: `manager` or `staff`
- `is_active`: `boolean` Active account flag
- Inherits from `AbstractBaseUser`, `PermissionsMixin`, and `TimeStampedModel`.

#### 6. `Order` (`apps.orders.models.Order` - Phase 5)
Core transaction record placed by a guest customer.
- `id`: `varchar(32)` Primary Key (`ord_*`)
- `order_number`: `varchar(20)` Unique human-readable code: `CL-YYYY-NNNN`
- `status`: `varchar(20)` Order status (see Section 8 for 7 states)
- `payment_method`: `varchar(30)` Exclusively `cash_on_delivery`
- `zone`: `ForeignKey(DeliveryZone, on_delete=models.RESTRICT)`
- `customer_name`: `varchar(100)` Customer name
- `customer_phone`: `varchar(15)` Normalized Palestinian phone (`059` or `056`)
- `street_address`: `varchar(255)` Street name and neighborhood
- `building_or_apt`: `varchar(100)` Building name, apartment or landmark
- `customer_notes`: `text` Special delivery or packaging instructions
- `subtotal`: `decimal(10, 2)` Items subtotal
- `delivery_fee`: `decimal(10, 2)` Delivery fee applied at checkout
- `total`: `decimal(10, 2)` Final payable amount
- `idempotency_key`: `varchar(64)` Unique client deduplication token
- `tracking_token`: `varchar(32)` Random security token for tracking lookup
- `cancel_reason`: `text` Mandatory reason if cancelled or undelivered

#### 7. `OrderItem` (`apps.orders.models.OrderItem` - Phase 5)
Frozen historical snapshot of items purchased (`BR-009`):
- `id`: `AutoField` / Primary Key
- `order`: `ForeignKey(Order, on_delete=models.CASCADE, related_name='items')`
- `product`: `ForeignKey(Product, on_delete=models.RESTRICT)`
- **Historical Snapshot Fields:** `product_name`, `product_slug`, `product_image_url`, `unit_price`, `unit`, `weight_multiplier`, `weight_label`, `packaging_label`, `packaging_fee`, `quantity`, `line_total`.

#### 8. `OrderStatusHistory` (`apps.orders.models.OrderStatusHistory` - Phase 5)
Immutable audit trail tracking state progression:
- `id`: `AutoField` / Primary Key
- `order`: `ForeignKey(Order, on_delete=models.CASCADE, related_name='timeline')`
- `from_status`: `varchar(20)` Previous state
- `to_status`: `varchar(20)` New state
- `note`: `text` Audit note or cancellation explanation
- `performed_by_user`: `ForeignKey(AdminUser, on_delete=models.SET_NULL, null=True)`
- `created_at`: Timestamp of transition

---

## 6. Frontend Architecture & UI Guidelines

### 6.1 Decoupled Repository Pattern (`src/lib/repositories.ts`)
To allow frictionless development both with and without a running backend, all UI pages interact **strictly through repository functions** exported directly by `src/lib/repositories.ts`:
- **Categories & Delivery Zones:**
  - `getCategories()`: Returns list of active categories.
  - `getCategoryBySlug(slug)`: Returns single category matching slug.
  - `getDeliveryZones()`: Returns active delivery zones.
  - `getDeliveryZoneById(id)`: Returns single zone by ID.
- **Products & Catalog:**
  - `getProducts(categorySlug?)`: Returns products, optionally filtered by category.
  - `getProductBySlug(slug)`: Returns single product with weight options.
  - `toggleProductAvailability(id)`: Instantly toggles kitchen availability (`isAvailable`).
- **Orders & Tracking:**
  - `createOrder(data)`: Creates guest order (validating phone, stock, and zone minimum).
  - `getOrderByNumberAndPhone(orderNumber, phone)`: Secure tracking query with phone normalization.
  - `getOrders()`: Returns all orders for admin review.
  - `getOrderById(id)`: Returns full order detail with items and timeline.
  - `updateOrderStatus(id, targetStatus, reason?, note?)`: Advances status via transition matrix.
  - `cancelOrder(id, reason)`: Exceptional manager-only cancellation.
- **Admin Authentication:**
  - `authenticateAdmin(username, password)`: Validates credentials and creates session.
  - `getAdminSession()`: Returns active session from storage.
  - `logoutAdmin()`: Terminates active session.

> **Rule for Agents:** Never call `fetch()` or `localStorage` directly inside React page components. Always call or extend the standalone async functions in `src/lib/repositories.ts`.

### 6.2 React Contexts & State Management
1. **`CartContext` (`src/context/cart-context.tsx`):**
   - Manages cart items, selected weights, packaging tiers (`standard` free vs `royal` +15₪), and selected delivery zone.
   - Automatically calculates subtotal, packaging fees, delivery fees, and total.
   - Synchronizes with `localStorage` under key `candy_cart_items_v1`.
   - Handles SSR hydration gracefully via `isHydrated` state guard.
2. **`AdminAuthContext` (`src/context/admin-auth-context.tsx`):**
   - Manages current admin session (`AdminUser` object with role `manager` or `staff`).
   - Stores JWT token in `sessionStorage` (`candy_admin_session_v1`).
   - Exposes RBAC helpers: `isManager`, `isStaff`, `hasPermission(action)`.

### 6.3 Design System, Color Palette & Tokens (`src/app/tokens.css`)
The UI adheres strictly to **Boutique Confectionery Elegance**:
- **Canvas / Root Background:** Warm Marshmallow Cream (`--color-bg: #FFFAF8`)
- **Surface:** Pure Pâtisserie White (`--color-surface: #FFFFFF`)
- **Primary Brand Color:** Deep Royal Berry (`--color-primary: #A31D56`, hover: `--color-primary-hover: #851645`, subtle: `--color-primary-subtle: #FDF2F4`)
- **Accent Highlight:** Warm Amber Star (`--color-accent: #E8A33D` — strictly paired with dark text)
- **Text Ink:** Roasted Dark Cacao (`--color-text: #2B1A10`)
- **Text Muted:** Warm Truffle Taupe (`--color-text-muted: #6B5D55`)
- **Border Decorative:** Wafer Line (`--color-border: #E6DED8`)
- **Border Form Control:** Form Control Border (`--color-border-input: #8A7B72`)
- **Vitrine Pastel Tints (Cyclic Card Backgrounds):**
  - Tint 1: Strawberry Milk (`--tint-1: #F9DCD9`)
  - Tint 2: Pistachio Mint (`--tint-2: #DFF0DC`)
  - Tint 3: Marshmallow Rose (`--tint-3: #FBD3DD`)
  - Tint 4: Vanilla Wafer (`--tint-4: #FBECC8`)
  - Tint 5: Peach Sorbet (`--tint-5: #F6E0D2`)
  - Tint 6: Cotton Candy Blue (`--tint-6: #E2EEFB`)
- **Order Status Palette:**
  - New: `--status-new: #2F5D8A`
  - Accepted: `--status-accepted: #A31D56`
  - Preparing: `--status-preparing: #E8A33D` (with `--status-preparing-text: #2B1A10`)
  - Out for Delivery: `--status-out: #6B4E9B`
  - Delivered: `--status-delivered: #2E7D4F`
  - Failed / Undelivered: `--status-failed: #9A5B00`
  - Cancelled: `--status-cancelled: #B3261E`
- **Border Radii:** Card: `22px` (`--radius-card`), Section: `32px` (`--radius-section`), Input/Button: `14px` (`--radius-input`), Pill: `99px` (`--radius-pill`).

### 6.4 Typography & RTL Rules
- **Headings & Display:** `font-heading` (`El Messiri`, semi-bold 600, line-height 1.25–1.35).
- **Body, Inputs & Prices:** `font-body` / `font-sans` (`IBM Plex Sans Arabic`, 400 regular, 700 bold, 800 extrabold for prices).
- **Directionality:** Native Right-to-Left (`dir="rtl"` on `<html>`). Never use physical left/right CSS properties when start/end logical properties or RTL utilities apply.
- **Price Format:** Always format as `X ₪` using Arabic/Western digits with the shekel symbol (`formatPrice(amount)`).

---

## 7. Backend Architecture & API Standards

### 7.1 Strict 8-Layer CQS Architecture
The Django backend strictly enforces the Command-Query Separation (CQS) pipeline:

```
[HTTP Request]
      │
      ▼
1. URLs (apps.<app>.urls)            --> Routes declarative endpoints
      │
      ▼
2. Views (apps.<app>.views)          --> Thin coordination layer
      ├── 3. Permissions (DRF)       --> Checks user role (IsManager, IsStaffOrManager)
      ├── 4. Policies (Pure Python)  --> Decides business authorization & rules
      │
      ├── Read Operations ─────────────► 5. Selectors (apps.<app>.selectors)
      │                                   - Strictly read-only queries
      │                                   - select_related() & prefetch_related()
      │                                   - Zero database mutations
      │
      └── Write Operations ────────────► 6. Services (apps.<app>.services)
                                          - Atomic DB mutations (transaction.atomic())
                                          - Concurrency locking (select_for_update())
                                          - State transitions & frozen snapshots
      │
      ▼
7. Serializers (apps.<app>.serializers) --> Validates input / formats output
      │
      ▼
8. Renderers (apps.common.renderers)    --> Unified camelCase JSON response envelope
```

### 7.2 Unified API Envelope Standards (`API.md`)
Every endpoint must adhere to the standardized response contract:

#### Success Response (`200 OK` / `201 Created`):
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 45,
    "totalPages": 3
  }
}
```

#### Error Response (`400`, `401`, `403`, `404`, `422`, `429`):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "بيانات الطلب غير صالحة، يرجى مراجعة الحقول",
    "details": [
      {
        "field": "customerPhone",
        "message": "يجب أن يبدأ رقم الهاتف بـ 059 أو 056 ويتكون من 10 أرقام"
      }
    ]
  }
}
```

### 7.3 Palestinian Phone Normalization Standard
All phone numbers entered by users must be validated and normalized using `apps.common.validators.normalize_palestinian_phone`:
- Accepts formats: `0599123456`, `+970599123456`, `00970569123456`, `056-912-3456`, and Arabic-Indic numerals `٠٥٩٩١٢٣٤٥٦`.
- Normalizes strictly into: 10 clean digits starting with `059` (Jawwal) or `056` (Ooredoo).

### 7.4 Summary of Core REST Endpoints

| Endpoint | Method | Access | Purpose |
|---|---|---|---|
| `/api/v1/categories` | `GET` | Public | List active categories |
| `/api/v1/products` | `GET` | Public | List & search active products |
| `/api/v1/products/{slugOrId}` | `GET` | Public | Product details & weight options |
| `/api/v1/delivery-zones` | `GET` | Public | List active delivery zones & fees |
| `/api/v1/orders` | `POST` | Public | Create guest order (COD, idempotency) |
| `/api/v1/orders/track` | `POST` | Public (Throttled) | Secure order tracking by number + phone |
| `/api/v1/admin/auth/login` | `POST` | Public | Admin login & JWT issue |
| `/api/v1/admin/auth/me` | `GET` | Staff / Manager | Verify JWT & fetch current user profile |
| `/api/v1/admin/auth/logout` | `POST` | Staff / Manager | Invalidate JWT token |
| `/api/v1/admin/orders` | `GET` | Staff / Manager | List orders with status & zone filters |
| `/api/v1/admin/orders/{id}` | `GET` | Staff / Manager | Order detail & audit timeline |
| `/api/v1/admin/orders/{id}/status` | `PATCH` | Staff / Manager | Update status (subject to policy matrix) |
| `/api/v1/admin/products/{id}/availability` | `PATCH` | Staff / Manager | Instant toggle of kitchen stock |
| `/api/v1/admin/products` | `GET, POST` | Manager | List all products / Create product |
| `/api/v1/admin/products/{id}` | `PUT, DELETE` | Manager | Update product / Soft-archive product |
| `/api/v1/admin/categories` | `GET, POST, PUT, DELETE` | Manager | Full category management |
| `/api/v1/admin/delivery-zones` | `GET, POST, PUT` | Manager | Full zone & delivery fee management |
| `/api/v1/admin/users` | `GET, POST, PATCH` | Manager | Admin staff RBAC management |

---

## 8. Order State Machine & Business Rules

### 8.1 7-Stage State Diagram (`BR-004`)
The order lifecycle strictly transitions through 7 verified states:

```
           [Guest Checkout]
                  │
                  ▼
                ┌───┐
                │new│ (جديد)
                └───┘
               /     \
   (accepted) /       \ (cancelled - Manager only + reason)
             ▼         ▼
       ┌────────┐   ┌─────────┐
       │accepted│   │cancelled│◄── [Terminal State]
       └────────┘   └─────────┘
             │           ▲
             ▼           │ (Manager only + reason)
   ┌───────────────┐     │
   │in_preparation │─────┘
   └───────────────┘
             │
             ▼
   ┌────────────────┐
   │out_for_delivery│
   └────────────────┘
        /        \
       /          \ (undelivered - Manager only + reason)
      ▼            ▼
┌─────────┐  ┌───────────┐
│delivered│  │undelivered│
└─────────┘  └───────────┘
     ▲             │
     │             ▼
[Terminal]   (out_for_delivery retry OR cancelled)
```

### 8.2 Strict Transition Matrix & Access Rights

| From Status | To Status | Allowed Roles | Mandatory Condition |
|---|---|---|---|
| `new` | `accepted` | Staff, Manager | Normal kitchen acknowledgement |
| `new` | `cancelled` | Manager only | Requires `reason` (min 5 characters) |
| `accepted` | `in_preparation` | Staff, Manager | Kitchen begins preparation |
| `accepted` | `cancelled` | Manager only | Requires `reason` (min 5 characters) |
| `in_preparation` | `out_for_delivery` | Staff, Manager | Order handed over to delivery driver |
| `in_preparation` | `cancelled` | Manager only | Exceptional cancellation (requires reason) |
| `out_for_delivery` | `delivered` | Staff, Manager | Successful delivery & cash collection |
| `out_for_delivery` | `undelivered` | Manager only | Failed delivery attempt (requires reason) |
| `undelivered` | `out_for_delivery` | Manager only | Second delivery attempt dispatch |
| `undelivered` | `cancelled` | Manager only | Final order cancellation (requires reason) |
| `delivered` | *(none)* | — | **Terminal State:** Permanently immutable |
| `cancelled` | *(none)* | — | **Terminal State:** Permanently immutable |

### 8.3 Concurrency & Historical Snapshots
- **Atomic Locking:** State transitions must lock the target order row via `select_for_update()` inside a `transaction.atomic()` block to prevent concurrent staff update conflicts (`EC-10`).
- **Frozen Historical Snapshots (`BR-009`):** When an order is placed, product prices, weights, units, and packaging options are permanently captured in `OrderItem`. Subsequent price updates or product modifications in the admin panel never alter past order totals.
- **Idempotent Ordering (`BR-004`):** Checkout supports the `Idempotency-Key` header. Duplicate submissions (e.g. double-click) safely return the existing order without creating a duplicate charge.
- **Soft Archiving (`BR-009`):** Products that have appeared in any past order cannot be physically deleted from the database. Attempting to delete sets `is_archived = True` and `is_available = False`.

---

## 9. Coding Standards & Agent Rules

### 9.1 Rules for Modifying Frontend Code
1. **Preserve Strict RTL Layout:** Always maintain `dir="rtl"` consistency. Use start/end alignments (`text-start`, `ms-*`, `me-*`, `ps-*`, `pe-*`).
2. **Never Hardcode Raw Hex Colors:** All styling must reference tokens defined in `src/app/tokens.css` or Tailwind config mappings.
3. **Use the Repository Abstraction:** Always route data access through `src/lib/repositories.ts`. Never perform ad-hoc `fetch()` calls or raw `localStorage` reads in UI components.
4. **Validate with Zod:** Any user input form (checkout, admin forms) must be validated with Zod schemas in `src/lib/validations.ts`.
5. **Always Verify Builds & Lints:** After any frontend change, run:
   ```bash
   npm run lint && npm run build
   ```

### 9.2 Rules for Modifying Backend Code
1. **Never Put Business Logic in Views or Serializers:** Views coordinate HTTP requests; serializers validate shapes. All domain logic belongs in `services.py` or `policies.py`.
2. **Never Mutate Data in Selectors:** Selectors in `selectors.py` must remain strictly read-only. Always use `.select_related()` and `.prefetch_related()` to eliminate N+1 queries.
3. **Wrap All Mutations in `transaction.atomic()`:** Any service that creates, updates, or transitions database records must execute inside an atomic transaction.
4. **Enforce Policy Checks in Services:** Always verify `policies.py` before executing state transitions or record deletions.
5. **Preserve camelCase ↔ snake_case Transparency:** Ensure `djangorestframework-camel-case` parses incoming payloads and renders responses to maintain the contract in `API.md`.
6. **Always Verify Test Suite:** After any backend modification, run:
   ```bash
   cd backend && python3 manage.py test
   ```
   All 179+ tests must pass before concluding the task.

---

## 10. Troubleshooting & Verification Checklist

When verifying your work or debugging issues, use this step-by-step checklist:

- [ ] **Frontend TypeScript & Build:** `npm run build` exits with code 0 and generates all static/dynamic routes.
- [ ] **Frontend Linting:** `npm run lint` passes with 0 errors.
- [ ] **Backend Test Suite:** `cd backend && python3 manage.py test` passes with 0 failures or errors.
- [ ] **Database Migrations:** `cd backend && python3 manage.py makemigrations --check` detects no unapplied model changes.
- [ ] **Palestinian Phone Formatting:** Verification confirms numbers like `0599123456` and `0561234567` pass validation, and invalid prefixes or lengths are rejected.
- [ ] **State Machine Invariants:** Verification ensures Staff cannot cancel orders, reasons are mandatory for `cancelled` and `undelivered`, and terminal states cannot be reopened.
- [ ] **RTL Visual Integrity:** Check that fonts (`El Messiri` & `IBM Plex Sans Arabic`), badges, icons, and menus align naturally in Right-to-Left orientation.

---
*Document Version: 1.0.0 (Unified Handbook)*  
*Maintained by: AI Architecture Team for Candy Loz*
