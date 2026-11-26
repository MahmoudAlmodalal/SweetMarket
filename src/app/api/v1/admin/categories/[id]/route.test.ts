import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { DELETE as deleteCategory, PUT as updateCategory } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-category-id-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function tokenFor(role: 'staff' | 'manager'): string {
  const user = getDb().users.find((u) => u.role === role && u.isActive);
  assert.ok(user);
  return signSessionToken(user);
}

function reqFor(method: string, id: string, body?: unknown, token?: string) {
  const req = new NextRequest(`http://localhost:3000/api/v1/admin/categories/${id}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return [req, { params: { id } }] as const;
}

describe('admin categories [id] route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('PUT and DELETE are manager-only', async () => {
    const category = getDb().categories[0];
    assert.ok(category);
    const [putReq, putCtx] = reqFor('PUT', category.id, { name: 'اسم جديد' }, tokenFor('staff'));
    assert.equal((await updateCategory(putReq, putCtx)).status, 403);
    const [delReq, delCtx] = reqFor('DELETE', category.id, undefined, tokenFor('staff'));
    assert.equal((await deleteCategory(delReq, delCtx)).status, 403);
  });

  it('PUT updates fields partially and preserves untouched fields', async () => {
    const category = getDb().categories[0];
    assert.ok(category);
    const [req, ctx] = reqFor('PUT', category.id, { name: 'الاسم المعدّل' }, tokenFor('manager'));
    const res = await updateCategory(req, ctx);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.name, 'الاسم المعدّل');
    assert.equal(json.data.slug, category.slug, 'untouched fields preserved');
    assert.equal(json.data.displayOrder, category.displayOrder);
  });

  it('PUT rejects unknown ids, short names and slug conflicts', async () => {
    const manager = tokenFor('manager');
    const [missingReq, missingCtx] = reqFor(
      'PUT',
      'cat-does-not-exist',
      { name: 'اسم صالح' },
      manager
    );
    assert.equal((await updateCategory(missingReq, missingCtx)).status, 404);

    const category = getDb().categories[0];
    const other = getDb().categories[1];
    assert.ok(category && other);

    const [shortReq, shortCtx] = reqFor('PUT', category.id, { name: 'س' }, manager);
    assert.equal((await updateCategory(shortReq, shortCtx)).status, 400);

    const [conflictReq, conflictCtx] = reqFor(
      'PUT',
      category.id,
      { slug: other.slug },
      manager
    );
    assert.equal((await updateCategory(conflictReq, conflictCtx)).status, 409);
  });

  it('DELETE rejects unknown ids and categories with active products', async () => {
    const manager = tokenFor('manager');
    const [missingReq, missingCtx] = reqFor('DELETE', 'cat-does-not-exist', undefined, manager);
    assert.equal((await deleteCategory(missingReq, missingCtx)).status, 404);

    const linked = getDb().categories.find((c) =>
      getDb().products.some((p) => !p.isArchived && p.categoryId === c.id)
    );
    assert.ok(linked, 'seed data must have a category with active products');
    const [linkedReq, linkedCtx] = reqFor('DELETE', linked.id, undefined, manager);
    const res = await deleteCategory(linkedReq, linkedCtx);
    assert.equal(res.status, 409);
    assert.ok(
      getDb().categories.some((c) => c.id === linked.id),
      'blocked category must remain'
    );
  });

  it('DELETE removes an empty category', async () => {
    const manager = tokenFor('manager');
    const emptyId = 'cat-empty-test';
    getDb().categories.push({
      id: emptyId,
      name: 'تصنيف فارغ',
      slug: 'empty-test',
      description: '',
      imageUrl: '',
      displayOrder: 99,
      isActive: true,
    });
    const [req, ctx] = reqFor('DELETE', emptyId, undefined, manager);
    const res = await deleteCategory(req, ctx);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.deleted, true);
    assert.equal(
      getDb().categories.some((c) => c.id === emptyId),
      false,
      'deleted category must not persist'
    );
  });
});
