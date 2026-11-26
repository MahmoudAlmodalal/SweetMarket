import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { GET as listOrders } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-orders-list-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function tokenFor(role: 'staff' | 'manager'): string {
  const user = getDb().users.find((u) => u.role === role && u.isActive);
  assert.ok(user);
  return signSessionToken(user);
}

function req(query = '', token?: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/v1/admin/orders${query}`, {
    method: 'GET',
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe('admin orders list route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('requires auth and returns all orders newest-first for staff', async () => {
    assert.equal((await listOrders(req())).status, 401);
    const res = await listOrders(req('', tokenFor('staff')));
    assert.equal(res.status, 200);
    const json = await res.json();
    const seeded = getDb().orders.length;
    assert.equal(json.data.length, seeded);
    assert.equal(json.meta.total, seeded);
    for (let i = 1; i < json.data.length; i++) {
      assert.ok(
        new Date(json.data[i - 1].createdAt) >= new Date(json.data[i].createdAt),
        'orders sorted newest first'
      );
    }
  });

  it('filters by status, with "all" meaning no filter', async () => {
    const staff = tokenFor('staff');
    const res = await listOrders(req('?status=new', staff));
    const json = await res.json();
    const expected = getDb().orders.filter((o) => o.status === 'new').length;
    assert.ok(expected >= 1, 'seed must contain new orders');
    assert.equal(json.data.length, expected);
    assert.ok(json.data.every((o: { status: string }) => o.status === 'new'));

    const all = await (await listOrders(req('?status=all', staff))).json();
    assert.equal(all.data.length, getDb().orders.length);
  });

  it('filters by zone, accepting zoneId or zone_id', async () => {
    const staff = tokenFor('staff');
    const res = await listOrders(req('?zoneId=zone-gaza', staff));
    const json = await res.json();
    const expected = getDb().orders.filter((o) => o.customer.zoneId === 'zone-gaza').length;
    assert.ok(expected >= 1, 'seed must contain zone-gaza orders');
    assert.equal(json.data.length, expected);

    const snake = await (await listOrders(req('?zone_id=zone-gaza', staff))).json();
    assert.equal(snake.data.length, expected, 'zone_id alias must behave identically');
  });

  it('searches order number, customer name and phone', async () => {
    const staff = tokenFor('staff');
    const byNumber = await (await listOrders(req('?search=CL-2026-1001', staff))).json();
    assert.equal(byNumber.data.length, 1);
    assert.equal(byNumber.data[0].orderNumber, 'CL-2026-1001');

    const byName = await (await listOrders(req('?search=ريم', staff))).json();
    assert.ok(byName.data.length >= 1);
    assert.ok(
      byName.data.every((o: { customer: { fullName: string } }) =>
        o.customer.fullName.includes('ريم')
      )
    );

    const byPhone = await (await listOrders(req('?search=0599123456', staff))).json();
    assert.equal(byPhone.data.length, 1);
    assert.equal(byPhone.data[0].customer.phone, '0599123456');

    const noMatch = await (await listOrders(req('?search=لا-يوجد-مطابقة', staff))).json();
    assert.equal(noMatch.data.length, 0);
  });
});
