import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { GET as getMe } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-me-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function tokenFor(role: 'staff' | 'manager'): string {
  const user = getDb().users.find((u) => u.role === role && u.isActive);
  assert.ok(user);
  return signSessionToken(user);
}

function req(token?: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/admin/auth/me', {
    method: 'GET',
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe('admin auth/me route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('rejects unauthenticated requests', async () => {
    assert.equal((await getMe(req())).status, 401);
  });

  it('returns the current user without password material', async () => {
    const res = await getMe(req(tokenFor('staff')));
    assert.equal(res.status, 200);
    const json = await res.json();
    const user = json.data.user;
    assert.equal(user.role, 'staff');
    assert.ok(user.email, 'email present');
    assert.equal(user.passwordHash, undefined, 'password hash must be stripped');
    assert.equal('password' in user, false, 'password field must be stripped');
  });
});
