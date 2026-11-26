import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { getDb, resetDb } from '@/server/db';
import { GET as receipt } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-receipt-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function receiptReq(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/v1/orders/receipt');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

describe('GET /api/v1/orders/receipt (token-scoped)', () => {
  before(() => {
    resetDb();
  });

  it('returns the order for the matching orderNumber + trackingToken pair', async () => {
    const order = getDb().orders[0];
    assert.ok(order?.trackingToken);
    const res = await receipt(
      receiptReq({ orderNumber: order.orderNumber, token: order.trackingToken })
    );
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.id, order.id);
    assert.ok(json.data.estimatedDeliveryTime);
  });

  it('rejects a wrong or truncated token with 404, not 403', async () => {
    const order = getDb().orders[0];
    assert.ok(order?.trackingToken);
    const orderToken: string = order.trackingToken;
    const wrong = await receipt(
      receiptReq({ orderNumber: order.orderNumber, token: 'f'.repeat(48) })
    );
    assert.equal(wrong.status, 404);

    const truncated = await receipt(
      receiptReq({ orderNumber: order.orderNumber, token: orderToken.slice(0, 24) })
    );
    assert.equal(truncated.status, 404);

    // A valid token paired with a different order number must not match either.
    const other = getDb().orders[1] ?? getDb().orders[0];
    assert.ok(other?.trackingToken);
    const swapped = await receipt(
      receiptReq({ orderNumber: 'CL-9999-000000', token: other.trackingToken })
    );
    assert.equal(swapped.status, 404);
  });

  it('requires both parameters', async () => {
    const order = getDb().orders[0];
    assert.ok(order?.trackingToken);
    assert.equal((await receipt(receiptReq({ token: order.trackingToken }))).status, 400);
    assert.equal((await receipt(receiptReq({ orderNumber: order.orderNumber }))).status, 400);
    assert.equal((await receipt(receiptReq({}))).status, 400);
  });
});
