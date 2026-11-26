import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken, verifyPassword } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { POST as resetPassword } from './route';
import { GET as getMe } from '../../../auth/me/route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-resetpw-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

const SEED_PASSWORD = 'CandyLoz2026!';

function tokenFor(role: 'staff' | 'manager'): string {
  const user = getDb().users.find((u) => u.role === role && u.isActive);
  assert.ok(user);
  return signSessionToken(user);
}

function reqFor(id: string, token?: string) {
  const req = new NextRequest(
    `http://localhost:3000/api/v1/admin/users/${id}/reset-password`,
    {
      method: 'POST',
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }
  );
  return [req, { params: { id } }] as const;
}

describe('admin reset-password route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('is manager-only', async () => {
    const staff = getDb().users.find((u) => u.role === 'staff' && u.isActive);
    assert.ok(staff);
    const [req, ctx] = reqFor(staff.id, tokenFor('staff'));
    assert.equal((await resetPassword(req, ctx)).status, 403);
  });

  it('404s unknown users', async () => {
    const [req, ctx] = reqFor('user-does-not-exist', tokenFor('manager'));
    assert.equal((await resetPassword(req, ctx)).status, 404);
  });

  it('issues a working temporary password and returns the sanitized user', async () => {
    const staff = getDb().users.find((u) => u.role === 'staff' && u.isActive);
    assert.ok(staff);
    const oldHash = staff.passwordHash;

    const [req, ctx] = reqFor(staff.id, tokenFor('manager'));
    const res = await resetPassword(req, ctx);
    assert.equal(res.status, 200);
    const json = await res.json();

    assert.ok(json.data.temporaryPassword.length >= 8, 'temporary password issued');
    assert.equal('passwordHash' in json.data.user, false, 'hash must be stripped');

    const stored = getDb().users.find((u) => u.id === staff.id);
    assert.ok(stored);
    assert.notEqual(stored.passwordHash, oldHash, 'hash rotated');
    assert.ok(verifyPassword(json.data.temporaryPassword, stored.passwordHash));
    assert.equal(
      verifyPassword(SEED_PASSWORD, stored.passwordHash),
      false,
      'old password must stop working'
    );
  });

  it('invalidates the target user\'s existing sessions', async () => {
    const staff = getDb().users.find((u) => u.role === 'staff' && u.isActive);
    assert.ok(staff);
    const staffToken = signSessionToken(staff);

    const [req, ctx] = reqFor(staff.id, tokenFor('manager'));
    assert.equal((await resetPassword(req, ctx)).status, 200);

    const meReq = new NextRequest('http://localhost:3000/api/v1/admin/auth/me', {
      method: 'GET',
      headers: { authorization: `Bearer ${staffToken}` },
    });
    assert.equal(
      (await getMe(meReq)).status,
      401,
      'sessions minted before the reset must be rejected'
    );
  });
});
