import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { DELETE as deleteZone, PUT as updateZone } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-zone-id-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function tokenFor(role: 'staff' | 'manager'): string {
  const user = getDb().users.find((u) => u.role === role && u.isActive);
  assert.ok(user);
  return signSessionToken(user);
}

function reqFor(method: string, id: string, body?: unknown, token?: string) {
  const req = new NextRequest(`http://localhost:3000/api/v1/admin/delivery-zones/${id}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return [req, { params: { id } }] as const;
}

describe('admin delivery-zones [id] route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('PUT and DELETE are manager-only', async () => {
    const zone = getDb().zones[0];
    assert.ok(zone);
    const [putReq, putCtx] = reqFor('PUT', zone.id, { name: 'اسم جديد' }, tokenFor('staff'));
    assert.equal((await updateZone(putReq, putCtx)).status, 403);
    const [delReq, delCtx] = reqFor('DELETE', zone.id, undefined, tokenFor('staff'));
    assert.equal((await deleteZone(delReq, delCtx)).status, 403);
  });

  it('PUT updates fields partially and validates the ETA window', async () => {
    const zone = getDb().zones[0];
    assert.ok(zone);
    const [req, ctx] = reqFor('PUT', zone.id, { name: 'الاسم المعدّل' }, tokenFor('manager'));
    const res = await updateZone(req, ctx);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.name, 'الاسم المعدّل');
    assert.equal(json.data.deliveryFee, zone.deliveryFee, 'untouched fields preserved');

    const [badReq, badCtx] = reqFor(
      'PUT',
      zone.id,
      { estimatedTimeMin: 90, estimatedTimeMax: 30 },
      tokenFor('manager')
    );
    assert.equal((await updateZone(badReq, badCtx)).status, 400);

    const [ghostReq, ghostCtx] = reqFor('PUT', 'zone-ghost', { name: 'x' }, tokenFor('manager'));
    assert.equal((await updateZone(ghostReq, ghostCtx)).status, 404);
  });

  it('DELETE refuses a zone with active orders (EC-09) and deletes an unused one', async () => {
    const db = getDb();
    const usedZoneId = db.orders[0]?.customer.zoneId;
    assert.ok(usedZoneId);
    const before = db.zones.length;

    const [busyReq, busyCtx] = reqFor('DELETE', usedZoneId, undefined, tokenFor('manager'));
    const busy = await deleteZone(busyReq, busyCtx);
    assert.equal(busy.status, 409);
    assert.equal((await busy.json()).error.code, 'ZONE_IN_USE');
    assert.equal(getDb().zones.length, before, 'zone in use must survive');

    // A freshly added zone with no orders can be deleted.
    db.zones.push({
      id: 'zone-unused',
      name: 'منطقة غير مستخدمة',
      deliveryFee: 5,
      minOrderAmount: 0,
      estimatedTimeMin: 30,
      estimatedTimeMax: 60,
      isActive: true,
    });
    const [freeReq, freeCtx] = reqFor('DELETE', 'zone-unused', undefined, tokenFor('manager'));
    const free = await deleteZone(freeReq, freeCtx);
    assert.equal(free.status, 200);
    assert.equal(getDb().zones.some((z) => z.id === 'zone-unused'), false);
  });
});
