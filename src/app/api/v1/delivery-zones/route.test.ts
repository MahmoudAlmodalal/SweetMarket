import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { getDb, resetDb } from '@/server/db';
import { GET as listZones } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-public-zones-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

describe('public delivery-zones route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('returns only active zones without auth', async () => {
    const db = getDb();
    db.zones[0].isActive = false;

    const res = await listZones(
      new NextRequest('http://localhost:3000/api/v1/delivery-zones', { method: 'GET' })
    );
    assert.equal(res.status, 200);
    const json = await res.json();
    const expected = db.zones.filter((z) => z.isActive).length;
    assert.equal(json.data.length, expected);
    assert.ok(json.data.every((z: { isActive: boolean }) => z.isActive));
    assert.ok(
      !json.data.some((z: { id: string }) => z.id === db.zones[0].id),
      'inactive zone excluded'
    );
  });
});
