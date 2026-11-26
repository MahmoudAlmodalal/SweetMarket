import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { GET as listCategories, POST as createCategory } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-categories-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function tokenFor(role: 'staff' | 'manager'): string {
  const user = getDb().users.find((u) => u.role === role && u.isActive);
  assert.ok(user);
  return signSessionToken(user);
}

function req(method: string, body?: unknown, token?: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/admin/categories', {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('admin categories collection route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('GET requires auth and returns the seeded categories for staff', async () => {
    assert.equal((await listCategories(req('GET'))).status, 401);
    const res = await listCategories(req('GET', undefined, tokenFor('staff')));
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data) && json.data.length >= 5);
  });

  it('POST is manager-only', async () => {
    const staffRes = await createCategory(
      req('POST', { name: 'تصنيف تجريبي' }, tokenFor('staff'))
    );
    assert.equal(staffRes.status, 403);

    const managerRes = await createCategory(
      req('POST', { name: 'تصنيف تجريبي' }, tokenFor('manager'))
    );
    assert.equal(managerRes.status, 201);
    const json = await managerRes.json();
    assert.ok(json.data.id.startsWith('cat-'));
    assert.equal(json.data.isActive, true, 'new categories default to active');
    assert.ok(
      getDb().categories.some((c) => c.id === json.data.id),
      'category persisted'
    );
  });

  it('POST validates the name and rejects duplicate slugs', async () => {
    const manager = tokenFor('manager');
    const shortName = await createCategory(req('POST', { name: 'س' }, manager));
    assert.equal(shortName.status, 400);

    const conflict = await createCategory(
      req('POST', { name: 'بقلاوة مكررة', slug: 'baklava-eastern' }, manager)
    );
    assert.equal(conflict.status, 409, 'existing slug must conflict');

    assert.equal(
      getDb().categories.some((c) => c.name === 'بقلاوة مكررة'),
      false,
      'invalid payloads must not persist'
    );
  });

  it('POST assigns the next displayOrder when none is given', async () => {
    const manager = tokenFor('manager');
    const maxOrder = getDb().categories.reduce(
      (acc, c) => Math.max(acc, c.displayOrder),
      0
    );
    const res = await createCategory(
      req('POST', { name: 'تصنيف مرتب' }, manager)
    );
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.data.displayOrder, maxOrder + 1);
  });
});
