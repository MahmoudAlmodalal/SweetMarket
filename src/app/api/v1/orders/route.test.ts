import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { getDb, resetDb } from '@/server/db';
import { POST as createOrder } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-orders-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function orderRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function validOrderBody() {
  const db = getDb();
  const zone = db.zones.find((z) => z.isActive);
  const product = db.products.find((p) => p.isAvailable && !p.isArchived);
  assert.ok(zone && product, 'expected seeded active zone and product');
  return {
    zone,
    product,
    body: {
      customer: {
        fullName: 'اختبار المستخدم الكامل',
        phone: '0597747084',
        zoneId: zone.id,
        streetAddress: 'شارع رئيسي، عمارة ٥',
      },
      items: [{ productId: product.id, quantity: 2, unitPrice: 0.01, price: 0.01 }],
    },
  };
}

describe('POST /api/v1/orders', () => {
  before(() => {
    resetDb();
  });

  it('creates an order with server-computed totals, ignoring client-sent prices', async () => {
    resetDb();
    const { body, zone } = validOrderBody();
    const before = getDb().orders.length;

    const res = await createOrder(orderRequest(body));
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);

    const order = json.data;
    assert.ok(order.id && order.orderNumber && order.trackingToken);
    assert.equal(getDb().orders.length, before + 1);

    // Totals come from the database prices and zone fee, never from the request body.
    const expectedItem = order.items[0];
    assert.ok(expectedItem.unitPrice > 1, 'client-sent 0.01 price must be ignored');
    assert.equal(order.subtotal + order.deliveryFee, order.total);
    assert.equal(order.deliveryFee, zone.deliveryFee);
  });

  it('replays the same order for a repeated Idempotency-Key without duplicating', async () => {
    resetDb();
    const { body } = validOrderBody();
    const before = getDb().orders.length;
    const key = `test-idem-${Date.now()}`;

    const first = await createOrder(orderRequest(body, { 'idempotency-key': key }));
    assert.equal(first.status, 201);
    const firstJson = await first.json();

    const replay = await createOrder(orderRequest(body, { 'idempotency-key': key }));
    assert.equal(replay.status, 200, 'replay answers 200, not a fresh 201');
    const replayJson = await replay.json();

    assert.equal(replayJson.data.id, firstJson.data.id);
    assert.equal(replayJson.data.orderNumber, firstJson.data.orderNumber);
    assert.equal(getDb().orders.length, before + 1, 'no duplicate order stored');
  });

  it('creates separate orders for different Idempotency-Keys', async () => {
    resetDb();
    const { body } = validOrderBody();
    const before = getDb().orders.length;

    const a = await createOrder(orderRequest(body, { 'idempotency-key': `k-a-${Date.now()}` }));
    const b = await createOrder(orderRequest(body, { 'idempotency-key': `k-b-${Date.now()}` }));
    const aJson = await a.json();
    const bJson = await b.json();
    assert.notEqual(aJson.data.id, bJson.data.id);
    assert.equal(getDb().orders.length, before + 2);
  });

  it('rejects invalid phone, empty items, and unknown zone', async () => {
    resetDb();
    const { body } = validOrderBody();

    const badPhone = await createOrder(
      orderRequest({ ...body, customer: { ...body.customer, phone: '12345' } })
    );
    assert.equal(badPhone.status, 400);

    const noItems = await createOrder(orderRequest({ ...body, items: [] }));
    assert.equal(noItems.status, 400);

    const badZone = await createOrder(
      orderRequest({ ...body, customer: { ...body.customer, zoneId: 'zone-does-not-exist' } })
    );
    assert.equal(badZone.status, 422);

    const malformed = new NextRequest('http://localhost:3000/api/v1/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    });
    const badJson = await createOrder(malformed);
    assert.equal(badJson.status, 400);
  });
});
