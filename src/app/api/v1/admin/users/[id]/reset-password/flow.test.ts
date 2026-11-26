import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { COOKIE_NAME } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { POST as login } from '../../../auth/login/route';
import { GET as getMe } from '../../../auth/me/route';
import { POST as resetPassword } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-reset-flow-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

const SEED_PASSWORD = 'CandyLoz2026!';

function extractSessionCookie(res: { headers: Headers }): string {
  const cookies = res.headers.getSetCookie();
  const session = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`));
  assert.ok(session, 'login must set the session cookie');
  const value = session.slice(COOKIE_NAME.length + 1).split(';')[0];
  return decodeURIComponent(value);
}

async function loginAs(identifier: string, password: string) {
  const req = new NextRequest('http://localhost:3000/api/v1/admin/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: identifier, password }),
  });
  return login(req);
}

function meReq(token: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/admin/auth/me', {
    method: 'GET',
    headers: { authorization: `Bearer ${token}` },
  });
}

describe('manager reset-password through the real authenticated flow', () => {
  beforeEach(() => {
    resetDb();
  });

  it('kills the staff session, retires the old password and admits the temporary one', async () => {
    const staff = getDb().users.find((u) => u.role === 'staff' && u.isActive);
    const manager = getDb().users.find((u) => u.role === 'manager' && u.isActive);
    assert.ok(staff && manager);

    // 1. Staff signs in through the real login route and reaches a guarded route.
    const staffLogin = await loginAs(staff.email, SEED_PASSWORD);
    assert.equal(staffLogin.status, 200);
    const staffToken = extractSessionCookie(staffLogin);
    assert.equal((await getMe(meReq(staffToken))).status, 200);

    // 2. Manager signs in through the real login route.
    const managerLogin = await loginAs(manager.email, SEED_PASSWORD);
    assert.equal(managerLogin.status, 200);
    const managerToken = extractSessionCookie(managerLogin);

    // 3. Manager resets the staff password.
    const resetReq = new NextRequest(
      `http://localhost:3000/api/v1/admin/users/${staff.id}/reset-password`,
      { method: 'POST', headers: { authorization: `Bearer ${managerToken}` } }
    );
    const resetRes = await resetPassword(resetReq, { params: { id: staff.id } });
    assert.equal(resetRes.status, 200);
    const temporaryPassword = (await resetRes.json()).data.temporaryPassword as string;

    // 4. The pre-reset staff session is rejected.
    assert.equal(
      (await getMe(meReq(staffToken))).status,
      401,
      'pre-reset session must be revoked'
    );

    // 5. The old password no longer signs in; the temporary password does.
    assert.equal((await loginAs(staff.email, SEED_PASSWORD)).status, 401);
    const freshLogin = await loginAs(staff.email, temporaryPassword);
    assert.equal(freshLogin.status, 200);
    const freshToken = extractSessionCookie(freshLogin);
    assert.equal((await getMe(meReq(freshToken))).status, 200);

    // 6. The manager's own session survives resetting someone else's password.
    assert.equal((await getMe(meReq(managerToken))).status, 200);
  });
});
