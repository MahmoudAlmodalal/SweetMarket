import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { getDb, resetDb } from '@/server/db';
import { POST as createOrder } from './route';
import { POST as trackOrder } from './track/route';
import { GET as getReceipt } from './receipt/route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-checkout-flow-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

const PHONE = '0597747084';

function post(url: string, body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function weightedProduct() {
  const product = getDb().products.find(
    (p) => p.isAvailable && !p.isArchived && p.availableWeights && p.availableWeights.length > 0
  );
  assert.ok(product, 'seed must contain a product with weight options');
  return product;
}

function orderBody(zoneId: string, items: unknown[]) {
  return {
    customer: {
      fullName: 'اختبار المستخدم الكامل',
      phone: PHONE,
      zoneId,
      streetAddress: 'شارع رئيسي، عمارة ٥',
    },
    items,
  };
}

describe('checkout integration paths', () => {
  beforeEach(() => {
    resetDb();
  });

  it('runs the full guest lifecycle: order -> track -> receipt, with zone fee and ETA', async () => {
    const product = weightedProduct();
    const res = await createOrder(
      post('http://localhost:3000/api/v1/orders', orderBody('zone-gaza', [{ productId: product.id, quantity: 1 }]))
    );
    assert.equal(res.status, 201);
    const order = (await res.json()).data;

    // Default weight (multiplier 1) carries the sale price 59 instead of 65; zone fee 10.
    assert.equal(order.items[0].unitPrice, 59, 'weight sale price wins over list price');
    assert.equal(order.subtotal, 59);
    assert.equal(order.deliveryFee, 10, 'zone-gaza delivery fee applied');
    assert.equal(order.total, 69);
    assert.equal(order.estimatedDeliveryTime, '30-50 دقيقة', 'zone ETA window returned');
    assert.equal(order.status, 'new');
    assert.equal(order.timeline.length, 1);
    assert.ok(order.trackingToken, 'tracking token issued once');

    // Guest tracks the order with order number + phone; the token stays hidden.
    const trackRes = await trackOrder(
      post('http://localhost:3000/api/v1/orders/track', {
        orderNumber: order.orderNumber,
        phone: PHONE,
      })
    );
    assert.equal(trackRes.status, 200);
    const tracked = (await trackRes.json()).data;
    assert.equal(tracked.orderNumber, order.orderNumber);
    assert.equal(tracked.status, 'new');
    assert.equal(
      JSON.stringify(tracked).includes(order.trackingToken),
      false,
      'tracking payload must not leak the tracking token'
    );

    // The receipt endpoint serves the full order to the token holder.
    const receiptRes = await getReceipt(
      new NextRequest(
        `http://localhost:3000/api/v1/orders/receipt?orderNumber=${order.orderNumber}&token=${order.trackingToken}`,
        { method: 'GET' }
      )
    );
    assert.equal(receiptRes.status, 200);
    const receipt = (await receiptRes.json()).data;
    assert.equal(receipt.id, order.id);
    assert.equal(receipt.total, 69);
  });

  it('prices selected weights, weight labels and royal packaging from server data', async () => {
    const product = weightedProduct();

    // Half-kilo by multiplier+label: 35; with royal packaging (+12): 47.
    const half = await createOrder(
      post('http://localhost:3000/api/v1/orders', orderBody('zone-gaza', [
        {
          productId: product.id,
          quantity: 1,
          selectedWeightMultiplier: 0.5,
          selectedWeightLabel: 'نصف كيلو (500 جم)',
          packagingOptionId: 'royal',
        },
      ]))
    );
    assert.equal(half.status, 201);
    const halfOrder = (await half.json()).data;
    assert.equal(halfOrder.items[0].unitPrice, 47, 'weight price 35 + royal fee 12');
    assert.equal(halfOrder.items[0].packagingLabel, 'صندوق إهداء مخملي ملكي (+12 ₪)');

    // Two kilos by label only: 125, standard packaging free.
    const family = await createOrder(
      post('http://localhost:3000/api/v1/orders', orderBody('zone-gaza', [
        { productId: product.id, quantity: 2, weightLabel: 'صينية عائلية (2 كجم)' },
      ]))
    );
    assert.equal(family.status, 201);
    const familyOrder = (await family.json()).data;
    assert.equal(familyOrder.items[0].unitPrice, 125);
    assert.equal(familyOrder.items[0].lineTotal, 250);
  });

  it('enforces the zone minimum with 422 and persists nothing', async () => {
    const product = weightedProduct();
    const zone = getDb().zones.find((z) => z.id === 'zone-gaza');
    assert.ok(zone);
    zone.minOrderAmount = 10000;
    const before = getDb().orders.length;

    const res = await createOrder(
      post('http://localhost:3000/api/v1/orders', orderBody('zone-gaza', [{ productId: product.id, quantity: 1 }]))
    );
    assert.equal(res.status, 422);
    const json = await res.json();
    assert.equal(json.error.code, 'MIN_ORDER_NOT_MET');
    assert.equal(json.error.details[0].field, 'subtotal');
    assert.equal(getDb().orders.length, before, 'rejected order must not persist');
  });

  it('rejects an inactive zone with 422 ZONE_UNAVAILABLE', async () => {
    const product = weightedProduct();
    const zone = getDb().zones.find((z) => z.id === 'zone-gaza');
    assert.ok(zone);
    zone.isActive = false;

    const res = await createOrder(
      post('http://localhost:3000/api/v1/orders', orderBody('zone-gaza', [{ productId: product.id, quantity: 1 }]))
    );
    assert.equal(res.status, 422);
    assert.equal((await res.json()).error.code, 'ZONE_UNAVAILABLE');
  });

  it('replays an Idempotency-Key with 200, same order, single timeline entry', async () => {
    const product = weightedProduct();
    const key = 'checkout-flow-key-1';
    const body = orderBody('zone-gaza', [{ productId: product.id, quantity: 1 }]);

    const first = await createOrder(
      post('http://localhost:3000/api/v1/orders', body, { 'idempotency-key': key })
    );
    assert.equal(first.status, 201);
    const firstOrder = (await first.json()).data;
    const count = getDb().orders.length;

    const replay = await createOrder(
      post('http://localhost:3000/api/v1/orders', body, { 'idempotency-key': key })
    );
    assert.equal(replay.status, 200, 'replay is 200, not a fresh 201');
    const replayOrder = (await replay.json()).data;
    assert.equal(replayOrder.id, firstOrder.id);
    assert.equal(replayOrder.estimatedDeliveryTime, '30-50 دقيقة', 'replay also carries the ETA');
    assert.equal(getDb().orders.length, count, 'no duplicate order created');
    assert.equal(
      getDb().orders.find((o) => o.id === firstOrder.id)?.timeline.length,
      1,
      'timeline not duplicated on replay'
    );
  });

  it('numbers orders sequentially and uniquely', async () => {
    const product = weightedProduct();
    const body = orderBody('zone-gaza', [{ productId: product.id, quantity: 1 }]);

    const a = (await (await createOrder(post('http://localhost:3000/api/v1/orders', body))).json()).data;
    const b = (await (await createOrder(post('http://localhost:3000/api/v1/orders', body))).json()).data;

    const year = new Date().getFullYear();
    const seqA = Number(a.orderNumber.split('-')[2]);
    const seqB = Number(b.orderNumber.split('-')[2]);
    assert.equal(a.orderNumber, `CL-${year}-${seqA}`);
    assert.equal(seqB, seqA + 1, 'order numbers increment');
    assert.notEqual(a.orderNumber, b.orderNumber);
  });
});
