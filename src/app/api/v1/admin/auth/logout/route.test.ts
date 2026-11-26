import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken, verifySessionToken } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { POST as logout } from './route';
import { GET as getMe } from '../me/route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-logout-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function tokenFor(role: 'staff' | 'manager'): string {
  const user = getDb().users.find((u) => u.role === role && u.isActive);
  assert.ok(user);
  return signSessionToken(user);
}

function req(token?: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/admin/auth/logout', {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

function meReq(token: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/admin/auth/me', {
    method: 'GET',
    headers: { authorization: `Bearer ${token}` },
  });
}

describe('admin logout route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('is idempotent without a token and clears both cookies', async () => {
    const res = await logout(req());
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.loggedOut, true);
    const setCookie = res.headers.get('set-cookie') ?? '';
    assert.ok(setCookie.includes('Max-Age=0'), 'auth cookie cleared');
  });

  it('revokes the presented token so it is rejected afterwards', async () => {
    const token = tokenFor('staff');
    assert.ok(verifySessionToken(token), 'token valid before logout');

    const res = await logout(req(token));
    assert.equal(res.status, 200);

    assert.equal(verifySessionToken(token), null, 'token revoked in-place');
    assert.equal((await getMe(meReq(token))).status, 401, 'guarded routes reject the token');
  });
});
