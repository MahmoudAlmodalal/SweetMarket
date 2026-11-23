# Candy Loz — Developer Guide

Quick reference for engineers working on the **Candy Loz (`كاندي لوز`)** Next.js storefront, Admin Portal, and `/api/v1/*` backend.

## 1. Quick Start

```bash
npm install
npm run dev
```

- **Storefront:** `http://localhost:3000/`
- **Admin Portal:** `http://localhost:3000/admin/login`
- **Developer Workbench:** `http://localhost:3000/dev` *(dev-only; disabled in production unless `ALLOW_DEV_TOOLS=true`)*
- **OpenAPI 3.1 Spec:** `http://localhost:3000/api/v1/dev/openapi`
- **Health Check:** `http://localhost:3000/api/v1/health`

## 2. Verification & Developer Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run check` | Runs `typecheck`, `lint`, and all pure-logic unit tests |
| `npm run typecheck` | Standalone TypeScript check (`tsc --noEmit`) |
| `npm run lint` | Next.js ESLint check |
| `npm run test:unit` | Runs business-rules & API-adapter unit tests (`tsx --test`) |
| `npm run dev:smoke` | Runs live API smoke tests against `http://127.0.0.1:3000` (or `API_BASE_URL`) |
| `npm run dev:reset-db` | Removes the local persisted JSON DB file so the next request re-seeds cleanly |

## 3. Dual Backend Mode

All client code calls same-origin `/api/v1/*` routes:

1. **Local Persistent Mode (default):** When `BACKEND_API_URL` is unset, Next.js Route Handlers execute authoritative server business rules (`src/server/business-rules.ts`) backed by an atomic JSON store at `CANDY_LOZ_DB_PATH` (defaults to `os.tmpdir()/candy-loz-backend-db.json`).
2. **Django DRF Upstream Proxy Mode:** Set `BACKEND_API_URL=http://127.0.0.1:8000` in `.env.local` to transparently proxy `/api/v1/*` calls to the Django backend in `/backend`. Response adapters (`src/lib/api-adapters.ts`) normalize both `camelCase` and Django `snake_case` payloads.

## 4. Environment Variables

See `.env.example` for all supported variables:

- `BACKEND_API_URL` — Optional upstream Django backend URL.
- `JWT_SECRET` — HMAC-SHA256 signing secret for admin sessions (auto-generates ephemeral random bytes in dev if unset).
- `INITIAL_ADMIN_PASSWORD` — Password used when seeding initial local admin accounts.
- `ALLOW_DEMO_LOGIN` — Set to `false` in production to disable `POST /api/v1/admin/auth/demo-login`.
- `ALLOW_DEV_TOOLS` — Enables `/dev`, `GET /api/v1/dev/openapi`, and `POST /api/v1/dev/reset` outside `development`.
- `CANDY_LOZ_DB_PATH` — Optional custom path for the local persistent JSON store.

## 5. Security Boundaries

- Admin mutations require a verified session (`HttpOnly` cookie or `Authorization: Bearer`) and enforce CSRF `Origin` / `X-Requested-With` checks.
- Destructive and privileged actions (order cancellation, marking undelivered, product create/edit/delete, category/zone/user management, and `POST /api/v1/dev/reset`) enforce `managerOnly: true` on the server.
- Order creation calculates all line totals, royal packaging fees (`+12 ₪`), delivery fees, and minimum order thresholds exclusively on the server.
