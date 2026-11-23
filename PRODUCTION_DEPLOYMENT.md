# Candy Loz — Production Deployment & Backend Secrets Guide

This guide covers configuring all secrets securely via your hosting platform's secret manager (never committed to Git) and connecting the Next.js storefront/admin portal to the Django DRF backend in `/backend`.

## 1. Secret Management Checklist

Generate high-entropy secrets before deploying (example with OpenSSL):

```bash
openssl rand -hex 32
```

### Next.js Frontend & BFF Secrets (Root Service)

| Variable | Required in Prod | Description |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_APP_URL` | Yes | Public HTTPS domain (used for `sitemap.xml`, `robots.txt`, OpenGraph) |
| `BACKEND_API_URL` | When using `/backend` | Origin URL of the deployed Django DRF backend (e.g. `https://api.candyloz.com`) |
| `BACKEND_STRICT_PROXY` | Recommended (`true`) | Returns `502` if upstream Django is unreachable instead of falling back to local storage |
| `BACKEND_INTERNAL_SECRET` | Recommended | Shared secret sent in `X-Backend-Internal-Secret` between Next.js and Django |
| `JWT_SECRET` | Yes (Local mode) | 32+ char signing secret for Next.js local session tokens |
| `INITIAL_ADMIN_PASSWORD` | Yes (Local mode) | Strong password (12+ chars) for initial local admin seeding |
| `ALLOW_DEMO_LOGIN` | `false` | Must be `false` in production |
| `ALLOW_DEV_TOOLS` | `false` | Keeps `/dev`, `/api/v1/dev/openapi`, and `/api/v1/dev/reset` disabled in production |

### Django Backend Secrets (`/backend` Service)

| Variable | Required in Prod | Description |
| :--- | :---: | :--- |
| `DJANGO_SECRET_KEY` | Yes | 50+ char random secret (Django refuses to start with `DJANGO_DEBUG=False` if missing) |
| `DJANGO_DEBUG` | `False` | Disables debug tracebacks, enforces secure cookies, and disables DRF browsable HTML UI |
| `DJANGO_ALLOWED_HOSTS` | Yes | Comma-separated backend hostnames (e.g. `api.candyloz.com`) |
| `DJANGO_CORS_ALLOWED_ORIGINS` | Yes | Comma-separated frontend origins (e.g. `https://candyloz.com`) |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Yes | Comma-separated trusted HTTPS origins |
| `DATABASE_URL` | Yes | Production PostgreSQL connection string (`postgres://...`) |
| `REDIS_URL` | Recommended | Redis URL for distributed caching and rate-limiting |
| `BACKEND_INTERNAL_SECRET` | Recommended | Must match the Next.js `BACKEND_INTERNAL_SECRET` value |

## 2. How Frontend <-> Backend Connection Works

1. The browser always talks same-origin to Next.js `/api/v1/*` routes using `HttpOnly; Secure; SameSite=None; Partitioned` cookies.
2. When `BACKEND_API_URL` is configured, Next.js proxies every `/api/v1/*` call to `/backend` Django DRF:
   - On `POST /api/v1/admin/auth/login`, Next.js captures Django's SimpleJWT `token` and `refresh` tokens and stores them in `HttpOnly` cookies.
   - On all protected `/api/v1/admin/*` requests, Next.js automatically bridges the `candy_admin_token` cookie into `Authorization: Bearer <token>` for Django SimpleJWT.
   - On `POST /api/v1/admin/auth/logout`, Next.js forwards the `candy_admin_refresh` cookie to Django's token blacklist endpoint and clears both cookies.
3. Health checks are available on both tiers:
   - Next.js: `GET /api/v1/health` (also pings Django upstream when `BACKEND_API_URL` is set)
   - Django: `GET /api/v1/health/` (verifies live database connectivity)

## 3. Production Build & Pre-Deploy Verification

### Backend (`/backend`)

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_candy_loz
python manage.py collectstatic --noinput
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

### Frontend (Root)

```bash
npm ci
npm run check          # TypeScript + ESLint + 20 unit tests
npm run check:prod     # Validates production secrets & flags
npm run build          # Optimized production bundle
npm run start          # Serves production build
```

### Post-Deploy Smoke Test

```bash
API_BASE_URL=https://your-domain.com npm run dev:smoke
```
