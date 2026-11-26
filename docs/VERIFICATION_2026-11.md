# Verification status — November 26, 2026

Scope: local branch `development-improvements`, head `5196b89` (43 commits ahead of the
remote head `7c2bcf1`). Nothing is pushed or deployed; all results below are local.

## Test results at exact head 68837f5

| Suite | Result | Mode |
| --- | --- | --- |
| Unit (`npm run test:unit`) | 271/271 | node test runner |
| `npm run check` | exit 0 | typecheck + lint |
| Frontend QA audit (`tests/run-audit.mjs`) | screens 21/21, RBAC 10/10, forms 4/4, a11y clean | production server, `ALLOW_DEMO_LOGIN=true` |
| Storefront board | 16/16 | production build (verified at `72da3fd`) |
| Admin board | 22/22 | production build (verified at `72da3fd`) |
| Storefront search | 9/9 | production build (verified at `72da3fd`) |
| Order journey browser suite | 2/2 | production build (verified at `cf5fc79`, head-only changes since are test harness) |

Results file: `tests/audit-results.json`. The audit ran in slices
(`AUDIT_SECTIONS` / `AUDIT_SCREENS` env gates) merged by screen id; each slice ran
against a fresh database. A single uninterrupted full pass has not been run.

## App fixes this cycle

- `f7d62ed` — server phone normalization folds Eastern Arabic digits (tracking form).
- `e2fec4b` — concierge phone validation aligned to the unified normalizer.
- `e56c78a` — server accepts the trunk zero after `+970`/`00970`.
- `594ec5b` — `X-Frame-Options: SAMEORIGIN` on every route.
- `1d7851d`, `d2c5521`, `72da3fd` — canonical Arabic normalization applied to admin
  table search and public/category search (teh marbuta, alef forms, diacritics,
  English name parity).
- Auth hardening: session revocation on password change/reset, logout revocation
  persistence, login rate limiting, token expiry boundary.

## Audit harness notes (tests/run-audit.mjs)

- Protected screens assert an authenticated session of the intended role via
  `/api/v1/admin/auth/me` before auditing; setup failure fails the screen loudly.
- On a **production** server the demo-login route returns 403 unless
  `ALLOW_DEMO_LOGIN=true`; staff/manager audit sections require it.
- SCR-20 is audited as an authenticated staff user and expects the staff forbidden
  card ("صلاحية غير كافية") with zero console errors.
- Slicing: `AUDIT_SECTIONS=1` or `AUDIT_SCREENS=SCR-13,SCR-14 ...`; results merge
  into `tests/audit-results.json` by screen id.
- Test servers must use a fresh `CANDY_LOZ_DB_PATH`; the default db in the OS temp
  dir persists across restarts and contaminates KPI/order assertions.
- Admin/storefront suites start their own **dev** server (wiping `.next`) when no
  server answers; always pass `BASE_URL=http://localhost:3000` with a confirmed
  server, and `ALLOW_DEV_TOOLS=true` on production servers (SCN-07 dev reset).
  Confirm the server is actually up before running: a dead server surfaces as
  scenario timeouts, not a connection error.

## Resolved this cycle

- Favorites badge now counts only catalog-sellable products, matching the
  favorites page; saved IDs are never pruned.
- Login page hides demo quick-login buttons when the API gate is disabled
  (GET probe on the demo-login route).
- Badge aria labels use correct Arabic plural agreement (عنصر واحد / عنصران /
  N عناصر / N عنصراً).
- Content-Security-Policy headers ship on every route (see deferred note below
  for the script-src tradeoff).

## Deferred design decisions (documented, not defects)

- Strict script CSP (nonce-based `script-src`): evaluated and not adopted. Next 14
  does not apply per-request nonces to prerendered pages (verified: strict policy
  produced 68 violations, 0 nonced inline scripts), so it would require forcing
  dynamic rendering app-wide. Non-script CSP directives ship instead.

## Backup / restore

Remote head remains `7c2bcf1`. Verified restore paths (sha256 round-trips + scratch
restores): full patch `7c2bcf1..68837f5` applies tree-identical; incremental bundle
chain `7c2bcf1 → … → 68837f5` restores the exact head hash.
