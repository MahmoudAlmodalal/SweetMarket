import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { GET as getOrder } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-order-id-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function tokenFor(role: 'staff' | 'manager'): string {
  const user = getDb().users.find((u) => u.role === role && u.isActive);
  assert.ok(user);
  return signSessionToken(user);
}

function reqFor(id: string, token?: string) {
  const req = new NextRequest(`http://localhost:3000/api/v1/admin/orders/${id}`, {
    method: 'GET',
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  return [req, { params: { id } }] as const;
}

describe('admin orders [id] route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('requires auth', async () => {
    const [req, ctx] = reqFor('ord-1001');
    assert.equal((await getOrder(req, ctx)).status, 401);
  });

  it('finds an order by id or by order number', async () => {
    const staff = tokenFor('staff');
    const [byIdReq, byIdCtx] = reqFor('ord-1001', staff);
    const byId = await getOrder(byIdReq, byIdCtx);
    assert.equal(byId.status, 200);
    assert.equal((await byId.json()).data.orderNumber, 'CL-2026-1001');

    const [byNumReq, byNumCtx] = reqFor('CL-2026-1001', staff);
    const byNum = await getOrder(byNumReq, byNumCtx);
    assert.equal(byNum.status, 200);
    assert.equal((await byNum.json()).data.id, 'ord-1001', 'order number resolves the same order');
  });

  it('404s unknown ids', async () => {
    const [req, ctx] = reqFor('ord-does-not-exist', tokenFor('manager'));
    assert.equal((await getOrder(req, ctx)).status, 404);
  });
});
