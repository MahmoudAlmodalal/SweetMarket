#!/usr/bin/env node
/**
 * Production environment & backend connection preflight checker.
 * Validates secrets and production safety flags without ever printing secret values.
 * Usage: npm run check:prod
 */

const errors = [];
const warnings = [];
const passed = [];

function check(condition, okMsg, errMsg, isWarning = false) {
  if (condition) {
    passed.push(okMsg);
  } else if (isWarning) {
    warnings.push(errMsg);
  } else {
    errors.push(errMsg);
  }
}

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim();
const backendUrl = (process.env.BACKEND_API_URL || '').trim();
const jwtSecret = (process.env.JWT_SECRET || '').trim();
const internalSecret = (process.env.BACKEND_INTERNAL_SECRET || '').trim();
const initialAdminPass = (process.env.INITIAL_ADMIN_PASSWORD || '').trim();
const allowDemo = (process.env.ALLOW_DEMO_LOGIN || '').trim().toLowerCase();
const allowDevTools = (process.env.ALLOW_DEV_TOOLS || '').trim().toLowerCase();
const strictProxy = (process.env.BACKEND_STRICT_PROXY || '').trim().toLowerCase();

// Django vars (checked when connecting to /backend Django service)
const djangoSecret = (process.env.DJANGO_SECRET_KEY || '').trim();
const djangoDebug = (process.env.DJANGO_DEBUG || '').trim().toLowerCase();
const databaseUrl = (process.env.DATABASE_URL || '').trim();

console.log('\nCandy Loz — Production Secrets & Backend Readiness Check\n');

check(
  /^https:\/\/.+/.test(appUrl),
  'NEXT_PUBLIC_APP_URL is configured with HTTPS',
  'NEXT_PUBLIC_APP_URL should be set to your production https:// domain',
  true
);

check(
  allowDemo !== 'true',
  'ALLOW_DEMO_LOGIN is disabled for production',
  'ALLOW_DEMO_LOGIN must not be "true" in production'
);

check(
  allowDevTools !== 'true',
  'ALLOW_DEV_TOOLS is disabled for production',
  'ALLOW_DEV_TOOLS must not be "true" in production'
);

if (backendUrl) {
  check(
    /^https?:\/\/.+/.test(backendUrl),
    'BACKEND_API_URL is configured with a valid HTTP(S) origin',
    'BACKEND_API_URL must start with http:// or https://'
  );
  check(
    strictProxy === 'true',
    'BACKEND_STRICT_PROXY=true prevents silent local fallback',
    'Set BACKEND_STRICT_PROXY=true in production so upstream outages fail cleanly (502) instead of falling back to local temp storage',
    true
  );
  check(
    internalSecret.length >= 24,
    'BACKEND_INTERNAL_SECRET is configured (>= 24 chars)',
    'Set BACKEND_INTERNAL_SECRET (>= 24 random chars) to authenticate server-to-server proxy traffic',
    true
  );
  check(
    djangoSecret.length >= 32 && !djangoSecret.includes('django-insecure'),
    'DJANGO_SECRET_KEY is configured and non-default',
    'DJANGO_SECRET_KEY should be >= 32 random chars on the Django backend',
    true
  );
  check(
    djangoDebug === '' || djangoDebug === 'false' || djangoDebug === '0',
    'DJANGO_DEBUG is False',
    'DJANGO_DEBUG must be False in production'
  );
  check(
    Boolean(databaseUrl),
    'DATABASE_URL is configured for persistent SQL storage',
    'Set DATABASE_URL (PostgreSQL) on the Django backend before production launch',
    true
  );
} else {
  check(
    jwtSecret.length >= 32,
    'JWT_SECRET is configured (>= 32 chars)',
    'JWT_SECRET must be set (>= 32 random chars) in production so admin sessions survive restarts'
  );
  check(
    initialAdminPass.length >= 12 && initialAdminPass !== 'CandyLoz2026!',
    'INITIAL_ADMIN_PASSWORD is set to a strong custom secret',
    'Set INITIAL_ADMIN_PASSWORD (>= 12 chars, not the preview default) before production deployment'
  );
  warnings.push(
    'BACKEND_API_URL is unset — running in standalone Next.js local-persistent mode. Set BACKEND_API_URL to connect to the /backend Django API.'
  );
}

// Optional live ping if BACKEND_API_URL is configured
if (backendUrl && /^https?:\/\/.+/.test(backendUrl)) {
  try {
    const res = await fetch(`${backendUrl.replace(/\/+$/, '')}/api/v1/health/`, {
      headers: {
        Accept: 'application/json',
        ...(internalSecret ? { 'X-Backend-Internal-Secret': internalSecret } : {}),
      },
      signal: AbortSignal.timeout(4000),
    });
    check(
      res.ok,
      `Live Django backend health probe succeeded (HTTP ${res.status})`,
      `Live Django backend health probe returned HTTP ${res.status}`
    );
  } catch {
    warnings.push('Could not reach BACKEND_API_URL/api/v1/health/ from this machine (normal if private VPC).');
  }
}

for (const msg of passed) console.log(`  PASS  ${msg}`);
for (const msg of warnings) console.log(`  WARN  ${msg}`);
for (const msg of errors) console.error(`  FAIL  ${msg}`);

console.log(`\nSummary: ${passed.length} passed, ${warnings.length} warnings, ${errors.length} errors\n`);

if (errors.length > 0) {
  process.exit(1);
}
