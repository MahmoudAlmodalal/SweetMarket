import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { GET as listZones, POST as createZone } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-zones-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function tokenFor(role: 'staff' | 'manager'): string {
  const user = getDb().users.find((u) => u.role === role && u.isActive);
  assert.ok(user);
  return signSessionToken(user);
}

function req(method: string, body?: unknown, token?: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/admin/delivery-zones', {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const VALID_ZONE = {
  name: 'المنطقة الجديدة',
  deliveryFee: 10,
  minOrderAmount: 50,
  estimatedTimeMin: 30,
  estimatedTimeMax: 60,
};

describe('admin delivery-zones collection route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('GET requires auth and returns the seeded zones for staff', async () => {
    assert.equal((await listZones(req('GET'))).status, 401);
    const res = await listZones(req('GET', undefined, tokenFor('staff')));
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data) && json.data.length >= 3);
  });

  it('POST is manager-only', async () => {
    const staffRes = await createZone(req('POST', VALID_ZONE, tokenFor('staff')));
    assert.equal(staffRes.status, 403);

    const managerRes = await createZone(req('POST', VALID_ZONE, tokenFor('manager')));
    assert.equal(managerRes.status, 201);
    const json = await managerRes.json();
    assert.ok(json.data.id.startsWith('zone-'));
    assert.equal(json.data.isActive, true, 'new zones default to active');
    assert.ok(getDb().zones.some((z) => z.id === json.data.id), 'zone persisted');
  });

  it('POST validates name, fees, minimums and the ETA window', async () => {
    const manager = tokenFor('manager');
    const cases: Array<Record<string, unknown>> = [
      { ...VALID_ZONE, name: 'x' },
      { ...VALID_ZONE, deliveryFee: -5 },
      { ...VALID_ZONE, minOrderAmount: -1 },
      { ...VALID_ZONE, estimatedTimeMin: 0 },
      { ...VALID_ZONE, estimatedTimeMin: 90, estimatedTimeMax: 30 },
    ];
    for (const body of cases) {
      const res = await createZone(req('POST', body, manager));
      assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(body)}`);
    }
    assert.equal(
      getDb().zones.some((z) => z.name === VALID_ZONE.name),
      false,
      'invalid payloads must not persist'
    );
  });
});
