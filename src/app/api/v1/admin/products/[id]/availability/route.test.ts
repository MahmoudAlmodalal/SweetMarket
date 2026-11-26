import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { PATCH as toggleAvailability } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-availability-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function staffToken(): string {
  const staff = getDb().users.find((u) => u.role === 'staff' && u.isActive);
  assert.ok(staff);
  return signSessionToken(staff);
}

function availReq(id: string, body: unknown, token?: string) {
  const req = new NextRequest(`http://localhost:3000/api/v1/admin/products/${id}/availability`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return [req, { params: { id } }] as const;
}

describe('PATCH /api/v1/admin/products/[id]/availability', () => {
  beforeEach(() => {
    resetDb();
  });

  it('requires authentication', async () => {
    const product = getDb().products[0];
    const [req, ctx] = availReq(product.id, { isAvailable: false });
    assert.equal((await toggleAvailability(req, ctx)).status, 401);
  });

  it('sets an explicit boolean value and persists it', async () => {
    const product = getDb().products.find((p) => p.isAvailable && !p.isArchived);
    assert.ok(product);
    const [req, ctx] = availReq(product.id, { isAvailable: false }, staffToken());
    const res = await toggleAvailability(req, ctx);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.isAvailable, false);
    assert.equal(getDb().products.find((p) => p.id === product.id)?.isAvailable, false);
    assert.equal(json.data.isArchived, undefined, 'internal flag must not leak');
  });

  it('toggles when the body carries no boolean', async () => {
    const product = getDb().products.find((p) => p.isAvailable && !p.isArchived);
    assert.ok(product);
    const prior = product.isAvailable; // the route mutates the shared object
    const [req, ctx] = availReq(product.id, {}, staffToken());
    const res = await toggleAvailability(req, ctx);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).data.isAvailable, !prior);
    assert.equal(product.isAvailable, !prior);
  });

  it('404s unknown and archived products', async () => {
    const [ghostReq, ghostCtx] = availReq('prod-ghost', { isAvailable: true }, staffToken());
    assert.equal((await toggleAvailability(ghostReq, ghostCtx)).status, 404);

    const db = getDb();
    const product = db.products.find((p) => !p.isArchived);
    assert.ok(product);
    product.isArchived = true;
    const [archReq, archCtx] = availReq(product.id, { isAvailable: true }, staffToken());
    assert.equal((await toggleAvailability(archReq, archCtx)).status, 404);
  });
});
