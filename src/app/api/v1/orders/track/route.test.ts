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

  it('finds the order when the customer types their phone in Eastern Arabic digits', async () => {
    // The track form's own validator (src/lib/validations.ts) accepts ٠-٩ digits;
    // the server must normalize them the same way instead of rejecting the lookup.
    ipCounter++;
    const order = seededOrder();
    const easternPhone = order.customer.phone.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
    const res = await trackOrder(trackRequest({ orderNumber: order.orderNumber, phone: easternPhone }));
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.orderNumber, order.orderNumber);
  });

  it('finds the order when the customer keeps the trunk zero after the +970 prefix', async () => {
    // '+970 059 …' / '00970 059…' are common ways to write a Palestinian number.
    // The storefront validator (src/lib/validations.ts) accepts them; the server
    // must agree instead of rejecting a lookup the client said was valid.
    const seededPhone = seededOrder().customer.phone;
    const variants = [`+970 ${seededPhone.slice(0, 3)} ${seededPhone.slice(3, 6)} ${seededPhone.slice(6)}`, `00970${seededPhone}`];
    for (const phone of variants) {
      ipCounter++;
      const order = seededOrder();
      const res = await trackOrder(trackRequest({ orderNumber: order.orderNumber, phone }));
      assert.equal(res.status, 200, `expected 200 for ${phone}`);
      const json = await res.json();
      assert.equal(json.data.orderNumber, order.orderNumber);
    }
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
