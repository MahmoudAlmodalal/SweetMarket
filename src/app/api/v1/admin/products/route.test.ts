import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { GET as listProducts, POST as createProduct } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-products-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function tokenFor(role: 'staff' | 'manager'): string {
  const user = getDb().users.find((u) => u.role === role && u.isActive);
  assert.ok(user);
  return signSessionToken(user);
}

function req(method: string, body?: unknown, token?: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/admin/products', {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function validBody(): Record<string, unknown> {
  const category = getDb().categories[0];
  assert.ok(category);
  return { name: 'منتج تجريبي', price: 25, categoryId: category.id, unit: 'kg' };
}

describe('admin products collection route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('GET requires auth and strips isArchived from the list', async () => {
    assert.equal((await listProducts(req('GET'))).status, 401);
    const res = await listProducts(req('GET', undefined, tokenFor('staff')));
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data) && json.data.length > 0);
    assert.ok(
      json.data.every((p: Record<string, unknown>) => !('isArchived' in p)),
      'isArchived must not leak to the admin list payload'
    );
  });

  it('POST is manager-only and returns the created product without isArchived', async () => {
    const staffRes = await createProduct(req('POST', validBody(), tokenFor('staff')));
    assert.equal(staffRes.status, 403);

    const managerRes = await createProduct(req('POST', validBody(), tokenFor('manager')));
    assert.equal(managerRes.status, 201);
    const json = await managerRes.json();
    assert.ok(json.data.id.startsWith('prod-'));
    assert.equal(json.data.isAvailable, true, 'new products default to available');
    assert.equal('isArchived' in json.data, false, 'isArchived must be stripped');
    assert.ok(
      getDb().products.some((p) => p.id === json.data.id && p.isArchived === false),
      'product persisted unarchived'
    );
  });

  it('POST validates name, price, sale price, unit and category', async () => {
    const manager = tokenFor('manager');
    const cases: Array<Record<string, unknown>> = [
      { ...validBody(), name: 'س' },
      { ...validBody(), price: 0 },
      { ...validBody(), price: -10 },
      { ...validBody(), price: 25, salePrice: 25 },
      { ...validBody(), price: 25, salePrice: 30 },
      { ...validBody(), unit: 'gram' },
      { ...validBody(), categoryId: 'cat-does-not-exist' },
    ];
    for (const body of cases) {
      const res = await createProduct(req('POST', body, manager));
      assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(body)}`);
    }
    assert.equal(
      getDb().products.some((p) => p.name === 'منتج تجريبي'),
      false,
      'invalid payloads must not persist'
    );
  });

  it('POST rejects a duplicate slug', async () => {
    const existing = getDb().products.find((p) => !p.isArchived);
    assert.ok(existing);
    const res = await createProduct(
      req('POST', { ...validBody(), slug: existing.slug }, tokenFor('manager'))
    );
    assert.equal(res.status, 409);
  });
});
