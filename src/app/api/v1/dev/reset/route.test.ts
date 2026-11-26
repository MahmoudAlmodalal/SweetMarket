import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { POST as devReset } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-dev-reset-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function tokenFor(role: 'staff' | 'manager'): string {
  const user = getDb().users.find((u) => u.role === role && u.isActive);
  assert.ok(user);
  return signSessionToken(user);
}

function req(token?: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/dev/reset', {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

// NODE_ENV is typed read-only by Next.js; assign through a mutable view.
function setNodeEnv(value: string): void {
  (process.env as unknown as Record<string, string>).NODE_ENV = value;
}

describe('dev reset route', () => {
  const savedNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    resetDb();
  });

  afterEach(() => {
    setNodeEnv(savedNodeEnv ?? 'test');
  });

  it('requires a manager session', async () => {
    assert.equal((await devReset(req())).status, 401);
    assert.equal((await devReset(req(tokenFor('staff')))).status, 403);
  });

  it('resets a mutated database back to seed for a manager', async () => {
    const db = getDb();
    const seededZones = db.zones.length;
    db.zones.splice(0, 1);
    getDb().users[0].passwordChangedAt = '2026-01-01T00:00:00.000Z#stale';
    assert.equal(getDb().zones.length, seededZones - 1);

    const res = await devReset(req(tokenFor('manager')));
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.reset, true);
    assert.equal(json.data.counts.zones, seededZones);
    assert.ok(json.data.resetBy, 'reports who reset');

    const fresh = getDb();
    assert.equal(fresh.zones.length, seededZones, 'zones restored to seed');
    assert.equal(
      fresh.users[0].passwordChangedAt,
      undefined,
      'revocation stamps cleared with the reset'
    );
  });

  it('returns 404 in production without ALLOW_DEV_TOOLS', async () => {
    setNodeEnv('production');
    const savedFlag = process.env.ALLOW_DEV_TOOLS;
    delete process.env.ALLOW_DEV_TOOLS;
    try {
      assert.equal((await devReset(req(tokenFor('manager')))).status, 404);
    } finally {
      if (savedFlag !== undefined) process.env.ALLOW_DEV_TOOLS = savedFlag;
    }
  });
});
