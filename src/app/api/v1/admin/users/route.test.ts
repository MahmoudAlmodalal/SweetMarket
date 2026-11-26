import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken, verifyPassword } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { POST as createUser } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-users-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function tokenFor(role: 'staff' | 'manager'): string {
  const user = getDb().users.find((u) => u.role === role && u.isActive);
  assert.ok(user);
  return signSessionToken(user);
}

function postReq(body: unknown, token?: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/admin/users', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

const VALID_USER = {
  fullName: 'موظف تجريبي جديد',
  email: 'new.staff@candyloz.ps',
  role: 'staff',
};

describe('POST /api/v1/admin/users', () => {
  beforeEach(() => {
    resetDb();
  });

  it('is manager-only and requires authentication', async () => {
    assert.equal((await createUser(postReq(VALID_USER))).status, 401);
    assert.equal((await createUser(postReq(VALID_USER, tokenFor('staff')))).status, 403);
  });

  it('creates a user with a working temporary password and sanitized response', async () => {
    const res = await createUser(postReq(VALID_USER, tokenFor('manager')));
    assert.equal(res.status, 201);
    const json = await res.json();

    assert.match(json.data.temporaryPassword, /^CL-[A-HJ-NP-Z2-9]{8}$/);
    assert.equal(json.data.user.email, VALID_USER.email);
    assert.equal(json.data.user.passwordHash, undefined, 'hash must not leak');
    assert.equal(json.data.user.isActive, true);

    // The temp password actually authenticates against the stored hash.
    const stored = getDb().users.find((u) => u.email === VALID_USER.email);
    assert.ok(stored);
    assert.equal(verifyPassword(json.data.temporaryPassword, stored.passwordHash), true);
    assert.equal(stored.username, 'new.staff', 'username derived from email');
  });

  it('rejects duplicate email or username with 409 and invalid payloads with 400', async () => {
    const manager = tokenFor('manager');
    const existing = getDb().users[0];
    assert.ok(existing);

    const dupEmail = await createUser(
      postReq({ ...VALID_USER, email: existing.email.toUpperCase() }, manager)
    );
    assert.equal(dupEmail.status, 409, 'email match is case-insensitive');

    const dupUsername = await createUser(
      postReq({ ...VALID_USER, username: existing.username }, manager)
    );
    assert.equal(dupUsername.status, 409);

    for (const body of [
      { ...VALID_USER, fullName: 'x' },
      { ...VALID_USER, email: 'not-an-email' },
      { fullName: 'اسم صالح', email: '' },
    ]) {
      assert.equal((await createUser(postReq(body, manager))).status, 400);
    }

    // Unknown role strings fall back to staff, never escalate.
    const odd = await createUser(
      postReq({ ...VALID_USER, email: 'odd@candyloz.ps', role: 'superadmin' }, manager)
    );
    assert.equal(odd.status, 201);
    assert.equal((await odd.json()).data.user.role, 'staff');
  });
});
