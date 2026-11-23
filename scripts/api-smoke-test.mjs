#!/usr/bin/env node
/**
 * Zero-dependency API smoke test for Candy Loz (/api/v1/*).
 * Usage: npm run dev:smoke
 * Override target host: API_BASE_URL=http://localhost:3000 npm run dev:smoke
 */

const baseUrl = (process.env.API_BASE_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '');

let passed = 0;
let failed = 0;

async function check(name, fn) {
  const start = Date.now();
  try {
    const detail = await fn();
    passed++;
    console.log(`  PASS  ${name} (${Date.now() - start}ms)${detail ? ` — ${detail}` : ''}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL  ${name} (${Date.now() - start}ms) — ${err.message}`);
  }
}

async function fetchJson(pathname, init = {}) {
  const res = await fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, json, text };
}

console.log(`\nCandy Loz API Smoke Test -> ${baseUrl}\n`);

await check('GET /api/v1/health returns 200 ok', async () => {
  const { res, json } = await fetchJson('/api/v1/health');
  if (res.status !== 200 || json?.data?.status !== 'ok') {
    throw new Error(`Expected 200 ok, got ${res.status}`);
  }
  return `mode=${json.data.mode}, products=${json.data.catalog?.activeProducts}`;
});

await check('GET /api/v1/categories returns active categories', async () => {
  const { res, json } = await fetchJson('/api/v1/categories');
  if (res.status !== 200 || !Array.isArray(json?.data) || json.data.length === 0) {
    throw new Error(`Expected non-empty category list, got ${res.status}`);
  }
  return `${json.data.length} categories`;
});

await check('GET /api/v1/products returns available products', async () => {
  const { res, json } = await fetchJson('/api/v1/products');
  if (res.status !== 200 || !Array.isArray(json?.data) || json.data.length === 0) {
    throw new Error(`Expected non-empty product list, got ${res.status}`);
  }
  return `${json.data.length} products`;
});

await check('GET /api/v1/delivery-zones returns active zones', async () => {
  const { res, json } = await fetchJson('/api/v1/delivery-zones');
  if (res.status !== 200 || !Array.isArray(json?.data) || json.data.length === 0) {
    throw new Error(`Expected non-empty delivery zones, got ${res.status}`);
  }
  return `${json.data.length} zones`;
});

await check('GET /api/v1/admin/orders rejects unauthenticated caller with 401', async () => {
  const { res } = await fetchJson('/api/v1/admin/orders');
  if (res.status !== 401) {
    throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  }
  return 'auth guard active';
});

await check('POST /api/v1/orders/track validates unknown order cleanly', async () => {
  const { res } = await fetchJson('/api/v1/orders/track', {
    method: 'POST',
    body: JSON.stringify({ orderNumber: 'CL-0000-0000', phone: '0599000000' }),
  });
  if (res.status !== 404 && res.status !== 400) {
    throw new Error(`Expected 404/400 for invalid tracking lookup, got ${res.status}`);
  }
  return `status=${res.status}`;
});

await check('GET /api/v1/dev/openapi returns OpenAPI 3.1 schema', async () => {
  const { res, json } = await fetchJson('/api/v1/dev/openapi');
  if (res.status !== 200 || !json?.openapi?.startsWith('3.')) {
    throw new Error(`Expected OpenAPI 3.x JSON, got ${res.status}`);
  }
  return `${Object.keys(json.paths || {}).length} documented paths`;
});

console.log(`\nSummary: ${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  process.exit(1);
}
