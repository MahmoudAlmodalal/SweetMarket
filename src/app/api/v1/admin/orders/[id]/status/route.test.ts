import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { PATCH as updateStatus } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-status-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function staffToken(): string {
  const staff = getDb().users.find((u) => u.role === 'staff' && u.isActive);
  assert.ok(staff);
  return signSessionToken(staff);
}

function managerToken(): string {
  const manager = getDb().users.find((u) => u.role === 'manager' && u.isActive);
  assert.ok(manager);
  return signSessionToken(manager);
}

function statusReq(id: string, body: unknown, token?: string): [NextRequest, { params: { id: string } }] {
  const req = new NextRequest(`http://localhost:3000/api/v1/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return [req, { params: { id } }];
}

describe('PATCH /api/v1/admin/orders/[id]/status', () => {
  beforeEach(() => {
    resetDb();
  });

  it('requires authentication', async () => {
    const order = getDb().orders[0];
    const [req, ctx] = statusReq(order.id, { status: 'accepted' });
    const res = await updateStatus(req, ctx);
    assert.equal(res.status, 401);
  });

  it('moves a new order to accepted and appends an attributed timeline entry', async () => {
    const order = getDb().orders.find((o) => o.status === 'new');
    assert.ok(order, 'expected a seeded new order');
    const before = order.timeline.length;

    const [req, ctx] = statusReq(order.id, { status: 'accepted' }, staffToken());
    const res = await updateStatus(req, ctx);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.status, 'accepted');
    assert.equal(json.data.timeline.length, before + 1);
    const entry = json.data.timeline[json.data.timeline.length - 1];
    assert.equal(entry.status, 'accepted');
    assert.equal(entry.performedBy.role, 'staff');
    assert.ok(entry.performedBy.name);

    // Persisted to disk state.
    assert.equal(getDb().orders.find((o) => o.id === order.id)?.status, 'accepted');
  });

  it('rejects an invalid transition with the business-rule error', async () => {
    const order = getDb().orders.find((o) => o.status === 'new');
    assert.ok(order);
    const [req, ctx] = statusReq(order.id, { status: 'delivered' }, staffToken());
    const res = await updateStatus(req, ctx);
    assert.ok(res.status === 400 || res.status === 422 || res.status === 409, `got ${res.status}`);
    const json = await res.json();
    assert.equal(json.success, false);
    // Status unchanged.
    assert.equal(getDb().orders.find((o) => o.id === order.id)?.status, 'new');
  });

  it('cancellation is manager-only and requires a 5+ char reason', async () => {
    // Staff may not cancel even with a valid reason (manager-only action).
    const staffOrder = getDb().orders.find((o) => o.status === 'new');
    assert.ok(staffOrder);
    const [staffReq, staffCtx] = statusReq(
      staffOrder.id,
      { status: 'cancelled', reason: 'سبب وجيه للإلغاء' },
      staffToken()
    );
    assert.equal((await updateStatus(staffReq, staffCtx)).status, 403);
    assert.equal(getDb().orders.find((o) => o.id === staffOrder.id)?.status, 'new');

    // Manager without a reason, or with a short one, is refused.
    const [noReasonReq, noReasonCtx] = statusReq(
      staffOrder.id,
      { status: 'cancelled' },
      managerToken()
    );
    assert.notEqual((await updateStatus(noReasonReq, noReasonCtx)).status, 200);

    const [shortReq, shortCtx] = statusReq(
      staffOrder.id,
      { status: 'cancelled', reason: 'لا' },
      managerToken()
    );
    assert.notEqual((await updateStatus(shortReq, shortCtx)).status, 200);

    // Manager with a proper reason succeeds and the reason is stored.
    const [okReq, okCtx] = statusReq(
      staffOrder.id,
      { status: 'cancelled', reason: 'العميل طلب الإلغاء هاتفياً' },
      managerToken()
    );
    const ok = await updateStatus(okReq, okCtx);
    assert.equal(ok.status, 200);
    const json = await ok.json();
    assert.equal(json.data.status, 'cancelled');
    assert.equal(json.data.cancelReason, 'العميل طلب الإلغاء هاتفياً');
  });

  it('finds orders by order number as well as id, and 404s unknown orders', async () => {
    const order = getDb().orders.find((o) => o.status === 'new');
    assert.ok(order);
    const [req, ctx] = statusReq(order.orderNumber, { status: 'accepted' }, staffToken());
    assert.equal((await updateStatus(req, ctx)).status, 200);

    const [ghostReq, ghostCtx] = statusReq('ord-ghost', { status: 'accepted' }, staffToken());
    assert.equal((await updateStatus(ghostReq, ghostCtx)).status, 404);
  });
});
