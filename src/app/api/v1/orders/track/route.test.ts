import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { getDb, resetDb } from '@/server/db';
import { POST as trackOrder } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-track-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

let ipCounter = 1;
function trackRequest(body: unknown): NextRequest {
  // A unique client IP per request sequence keeps the shared rate map isolated.
  return new NextRequest('http://localhost:3000/api/v1/orders/track', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': `172.31.255.${ipCounter}`,
    },
    body: JSON.stringify(body),
  });
}

function seededOrder() {
  const db = getDb();
  const order = db.orders[0];
  assert.ok(order, 'expected a seeded order');
  return order;
}

describe('POST /api/v1/orders/track (BR-010)', () => {
  before(() => {
    resetDb();
  });

  it('finds a seeded order by orderNumber + phone and strips the trackingToken', async () => {
    ipCounter++;
    const order = seededOrder();
    const res = await trackOrder(trackRequest({ orderNumber: order.orderNumber, phone: order.customer.phone }));
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.orderNumber, order.orderNumber);
    assert.equal(json.data.trackingToken, undefined, 'internal token must not leak');
    assert.ok(json.data.estimatedDeliveryTime);
  });

  it('returns 404 for a wrong phone and does not leak whether the order exists', async () => {
    ipCounter++;
    const order = seededOrder();
    const res = await trackOrder(trackRequest({ orderNumber: order.orderNumber, phone: '0561111111' }));
    assert.equal(res.status, 404);
    const json = await res.json();
    assert.equal(json.error.code, 'ORDER_NOT_FOUND');

    ipCounter++;
    const ghost = await trackOrder(trackRequest({ orderNumber: 'CL-9999-999999', phone: '0597747084' }));
    assert.equal(ghost.status, 404);
  });

  it('locks out the client after 5 failed attempts with 429', async () => {
    ipCounter++;
    const ip = `172.31.255.${ipCounter}`;
    const order = seededOrder();
    const mk = () =>
      new NextRequest('http://localhost:3000/api/v1/orders/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
        body: JSON.stringify({ orderNumber: order.orderNumber, phone: '0569999999' }),
      });

    for (let i = 0; i < 4; i++) {
      const res = await trackOrder(mk());
      assert.notEqual(res.status, 429, `attempt ${i + 1} should not be rate limited`);
    }
    // The 5th failure trips the limiter and the 6th request is refused outright.
    const fifth = await trackOrder(mk());
    assert.equal(fifth.status, 429);
    const json = await fifth.json();
    assert.equal(json.error.code, 'RATE_LIMITED');
    const sixth = await trackOrder(mk());
    assert.equal(sixth.status, 429);

    // Even the correct credentials are refused while locked out.
    const locked = await trackOrder(
      new NextRequest('http://localhost:3000/api/v1/orders/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
        body: JSON.stringify({ orderNumber: order.orderNumber, phone: order.customer.phone }),
      })
    );
    assert.equal(locked.status, 429);
  });

  it('a successful lookup clears the failure counter', async () => {
    ipCounter++;
    const ip = `172.31.255.${ipCounter}`;
    const order = seededOrder();
    const mk = (phone: string) =>
      new NextRequest('http://localhost:3000/api/v1/orders/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
        body: JSON.stringify({ orderNumber: order.orderNumber, phone }),
      });

    for (let i = 0; i < 4; i++) {
      assert.equal((await trackOrder(mk('0569999999'))).status, 404);
    }
    // Success resets the counter before the 5th failure lands.
    assert.equal((await trackOrder(mk(order.customer.phone))).status, 200);
    for (let i = 0; i < 4; i++) {
      const res = await trackOrder(mk('0569999999'));
      assert.notEqual(res.status, 429, 'counter must restart after a success');
    }
  });
});
