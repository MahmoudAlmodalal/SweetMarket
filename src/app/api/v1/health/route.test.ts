import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { getDb, resetDb } from '@/server/db';
import { GET as health } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-health-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

describe('health route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('reports ok status and catalog counts without auth or secrets', async () => {
    const savedUpstream = process.env.BACKEND_API_URL;
    delete process.env.BACKEND_API_URL;
    try {
      const res = await health(
        new NextRequest('http://localhost:3000/api/v1/health', { method: 'GET' })
      );
      assert.equal(res.status, 200);
      const json = await res.json();
      const db = getDb();

      assert.equal(json.data.status, 'ok');
      assert.equal(json.data.service, 'candy-loz-api');
      assert.equal(json.data.mode, 'local-persistent', 'no upstream configured in tests');
      assert.equal(json.data.upstream.configured, false);
      assert.equal(
        json.data.catalog.activeCategories,
        db.categories.filter((c) => c.isActive).length
      );
      assert.equal(
        json.data.catalog.activeProducts,
        db.products.filter((p) => !p.isArchived && p.isAvailable).length
      );
      assert.equal(
        json.data.catalog.activeZones,
        db.zones.filter((z) => z.isActive).length
      );

      const body = JSON.stringify(json);
      assert.ok(!body.includes('passwordHash'), 'no password material in health payload');
      assert.ok(!body.includes('trackingToken'), 'no tracking tokens in health payload');
    } finally {
      if (savedUpstream !== undefined) process.env.BACKEND_API_URL = savedUpstream;
    }
  });
});
