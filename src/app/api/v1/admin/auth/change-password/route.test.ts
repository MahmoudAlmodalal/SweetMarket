import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken, verifyPassword } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { POST as changePassword } from './route';
import { GET as getMe } from '../me/route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-changepw-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

const SEED_PASSWORD = 'CandyLoz2026!';

function staffUser() {
  const user = getDb().users.find((u) => u.role === 'staff' && u.isActive);
  assert.ok(user);
  return user;
}

function tokenForStaff(): string {
  return signSessionToken(staffUser());
}

function req(body?: unknown, token?: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/admin/auth/change-password', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('admin change-password route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('requires authentication', async () => {
    const res = await changePassword(
      req({ currentPassword: SEED_PASSWORD, newPassword: 'brand-new-pass' })
    );
    assert.equal(res.status, 401);
  });

  it('rejects a wrong current password, a short new password and an unchanged password', async () => {
    const token = tokenForStaff();
    const wrong = await changePassword(
      req({ currentPassword: 'not-the-password', newPassword: 'brand-new-pass' }, token)
    );
    assert.equal(wrong.status, 400);
    assert.equal((await wrong.json()).error.code, 'INVALID_CREDENTIALS');

    const short = await changePassword(
      req({ currentPassword: SEED_PASSWORD, newPassword: '12345' }, token)
    );
    assert.equal(short.status, 400);

    const same = await changePassword(
      req({ currentPassword: SEED_PASSWORD, newPassword: SEED_PASSWORD }, token)
    );
    assert.equal(same.status, 400);

    assert.ok(
      verifyPassword(SEED_PASSWORD, staffUser().passwordHash),
      'failed attempts must not change the stored hash'
    );
  });

  it('updates the hash and invalidates the session used for the change', async () => {
    const token = tokenForStaff();
    const res = await changePassword(
      req({ currentPassword: SEED_PASSWORD, newPassword: 'brand-new-pass' }, token)
    );
    assert.equal(res.status, 200);

    const user = staffUser();
    assert.ok(verifyPassword('brand-new-pass', user.passwordHash), 'new password stored');
    assert.ok(user.passwordChangedAt, 'revocation stamp set');

    const meReq = new NextRequest('http://localhost:3000/api/v1/admin/auth/me', {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(
      (await getMe(meReq)).status,
      401,
      'the session minted before the change must be rejected'
    );
  });
});
