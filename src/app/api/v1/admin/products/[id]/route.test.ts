import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { DELETE as deleteProduct, GET as getProduct, PUT as updateProduct } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-product-id-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function tokenFor(role: 'staff' | 'manager'): string {
  const user = getDb().users.find((u) => u.role === role && u.isActive);
  assert.ok(user);
  return signSessionToken(user);
}

function reqFor(method: string, id: string, body?: unknown, token?: string) {
  const req = new NextRequest(`http://localhost:3000/api/v1/admin/products/${id}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return [req, { params: { id } }] as const;
}

function activeProduct() {
  const product = getDb().products.find((p) => !p.isArchived);
  assert.ok(product);
  return product;
}

describe('admin products [id] route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('GET requires auth, finds by id or slug, and 404s unknown ids', async () => {
    const product = activeProduct();
    const [noAuthReq, noAuthCtx] = reqFor('GET', product.id);
    assert.equal((await getProduct(noAuthReq, noAuthCtx)).status, 401);

    const staff = tokenFor('staff');
    const [byIdReq, byIdCtx] = reqFor('GET', product.id, undefined, staff);
    assert.equal((await getProduct(byIdReq, byIdCtx)).status, 200);
    const [bySlugReq, bySlugCtx] = reqFor('GET', product.slug, undefined, staff);
    const bySlug = await getProduct(bySlugReq, bySlugCtx);
    assert.equal(bySlug.status, 200);
    const json = await bySlug.json();
    assert.equal(json.data.id, product.id, 'slug lookup resolves the same product');

    const [missingReq, missingCtx] = reqFor('GET', 'prod-does-not-exist', undefined, staff);
    assert.equal((await getProduct(missingReq, missingCtx)).status, 404);
  });

  it('PUT and DELETE are manager-only', async () => {
    const product = activeProduct();
    const staff = tokenFor('staff');
    const [putReq, putCtx] = reqFor('PUT', product.id, { name: 'اسم جديد' }, staff);
    assert.equal((await updateProduct(putReq, putCtx)).status, 403);
    const [delReq, delCtx] = reqFor('DELETE', product.id, undefined, staff);
    assert.equal((await deleteProduct(delReq, delCtx)).status, 403);
  });

  it('PUT updates fields partially and preserves untouched fields', async () => {
    const product = activeProduct();
    const [req, ctx] = reqFor(
      'PUT',
      product.id,
      { name: 'الاسم المعدّل', price: product.price + 5 },
      tokenFor('manager')
    );
    const res = await updateProduct(req, ctx);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.name, 'الاسم المعدّل');
    assert.equal(json.data.price, product.price + 5);
    assert.equal(json.data.slug, product.slug, 'untouched fields preserved');
    assert.equal(json.data.categoryId, product.categoryId);
    assert.equal('isArchived' in json.data, false, 'isArchived must be stripped');
  });

  it('PUT rejects unknown ids, bad prices, bad categories and slug conflicts', async () => {
    const manager = tokenFor('manager');
    const [missingReq, missingCtx] = reqFor('PUT', 'prod-does-not-exist', { name: 'اسم صالح' }, manager);
    assert.equal((await updateProduct(missingReq, missingCtx)).status, 404);

    const product = activeProduct();
    const other = getDb().products.find((p) => !p.isArchived && p.id !== product.id);
    assert.ok(other);

    const [badSaleReq, badSaleCtx] = reqFor(
      'PUT',
      product.id,
      { price: 20, salePrice: 20 },
      manager
    );
    assert.equal((await updateProduct(badSaleReq, badSaleCtx)).status, 400);

    const [badCatReq, badCatCtx] = reqFor(
      'PUT',
      product.id,
      { categoryId: 'cat-does-not-exist' },
      manager
    );
    assert.equal((await updateProduct(badCatReq, badCatCtx)).status, 400);

    const [conflictReq, conflictCtx] = reqFor('PUT', product.id, { slug: other.slug }, manager);
    assert.equal((await updateProduct(conflictReq, conflictCtx)).status, 409);
  });

  it('DELETE archives a product referenced by orders', async () => {
    const referencedId = getDb().orders[0]?.items[0]?.productId;
    assert.ok(referencedId, 'seed orders must reference a product');
    const product = getDb().products.find((p) => p.id === referencedId && !p.isArchived);
    assert.ok(product, 'referenced product must exist unarchived');

    const [req, ctx] = reqFor('DELETE', product.id, undefined, tokenFor('manager'));
    const res = await deleteProduct(req, ctx);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.mode, 'archived');
    assert.ok(json.data.referencedOrdersCount >= 1);
    const after = getDb().products.find((p) => p.id === product.id);
    assert.ok(after, 'archived product remains in the database');
    assert.equal(after.isArchived, true);
    assert.equal(after.isAvailable, false, 'archived product is made unavailable');
  });

  it('DELETE hard-deletes a product with no order references', async () => {
    const manager = tokenFor('manager');
    const freshId = 'prod-unreferenced-test';
    const base = activeProduct();
    getDb().products.push({
      ...base,
      id: freshId,
      slug: 'unreferenced-test-slug',
      name: 'منتج غير مرتبط',
    });
    const [req, ctx] = reqFor('DELETE', freshId, undefined, manager);
    const res = await deleteProduct(req, ctx);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.mode, 'deleted');
    assert.equal(
      getDb().products.some((p) => p.id === freshId),
      false,
      'deleted product must not persist'
    );
  });
});
