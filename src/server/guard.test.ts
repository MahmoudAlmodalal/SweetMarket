import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken } from './auth';
import { getDb, resetDb, saveDb } from './db';
import { requireAdmin } from './guard';
import { POST as changePassword } from '@/app/api/v1/admin/auth/change-password/route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-guard-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function authedReq(token: string, method = 'GET'): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/admin/orders', {
    method,
    headers: { authorization: `Bearer ${token}` },
  });
}

function seedUser(role: 'manager' | 'staff') {
  const db = getDb();
  const user = db.users.find((u) => u.role === role && u.isActive);
  assert.ok(user, `expected a seeded active ${role} user`);
  return user;
}

describe('requireAdmin guard', () => {
  before(() => {
    resetDb();
  });

  it('accepts a valid manager token and rejects staff for manager-only routes', () => {
    const manager = seedUser('manager');
    const staff = seedUser('staff');

    const managerToken = signSessionToken(manager);
    const staffToken = signSessionToken(staff);

    const ok = requireAdmin(authedReq(managerToken), { managerOnly: true });
    assert.equal(ok.ok, true);

    const forbidden = requireAdmin(authedReq(staffToken), { managerOnly: true });
    assert.equal(forbidden.ok, false);
    if (!forbidden.ok) assert.equal(forbidden.response.status, 403);

    const staffAllowed = requireAdmin(authedReq(staffToken));
    assert.equal(staffAllowed.ok, true);
  });

  it('rejects missing, invalid, and unknown or inactive users', () => {
    const anonymous = requireAdmin(new NextRequest('http://localhost:3000/api/v1/admin/orders'));
    assert.equal(anonymous.ok, false);
    if (!anonymous.ok) assert.equal(anonymous.response.status, 401);

    const garbage = requireAdmin(authedReq('not.a.token'));
    assert.equal(garbage.ok, false);

    const ghost = requireAdmin(authedReq(signSessionToken({ id: 'usr-ghost', role: 'manager' })));
    assert.equal(ghost.ok, false);
    if (!ghost.ok) assert.equal(ghost.response.status, 401);

    const staff = seedUser('staff');
    staff.isActive = false;
    saveDb(getDb());
    const inactive = requireAdmin(authedReq(signSessionToken(staff)));
    assert.equal(inactive.ok, false);
    if (!inactive.ok) assert.equal(inactive.response.status, 401);
    staff.isActive = true;
    saveDb(getDb());
  });

  it('invalidates sessions issued at or before a password change', () => {
    resetDb();
    const manager = seedUser('manager');
    const staleToken = signSessionToken(manager);

    // Baseline: token works before any password change.
    assert.equal(requireAdmin(authedReq(staleToken)).ok, true);

    const db = getDb();
    const target = db.users.find((u) => u.id === manager.id);
    assert.ok(target);
    target.passwordChangedAt = new Date().toISOString();
    saveDb(db);

    // The pre-change token is rejected with a re-login message.
    const rejected = requireAdmin(authedReq(staleToken));
    assert.equal(rejected.ok, false);
    if (!rejected.ok) assert.equal(rejected.response.status, 401);

    // A token issued after the change is accepted.
    const realNow = Date.now;
    try {
      Date.now = () => realNow() + 2000;
      const freshToken = signSessionToken(manager);
      assert.equal(requireAdmin(authedReq(freshToken)).ok, true);
    } finally {
      Date.now = realNow;
    }
  });

  it('change-password route stamps passwordChangedAt and old sessions die', async () => {
    resetDb();
    const staff = seedUser('staff');
    const token = signSessionToken(staff);

    const req = new NextRequest('http://localhost:3000/api/v1/admin/auth/change-password', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'CandyLoz2026!', newPassword: 'NewSecret123!' }),
    });
    const res = await changePassword(req);
    assert.equal(res.status, 200);

    const updated = getDb().users.find((u) => u.id === staff.id);
    assert.ok(updated?.passwordChangedAt, 'passwordChangedAt must be stamped');

    // The session used for the change is itself invalidated afterwards.
    const after = requireAdmin(authedReq(token));
    assert.equal(after.ok, false);
    if (!after.ok) assert.equal(after.response.status, 401);
  });

  it('change-password route rejects a wrong current password without side effects', async () => {
    resetDb();
    const staff = seedUser('staff');
    const token = signSessionToken(staff);

    const req = new NextRequest('http://localhost:3000/api/v1/admin/auth/change-password', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'wrong-password', newPassword: 'NewSecret123!' }),
    });
    const res = await changePassword(req);
    assert.equal(res.status, 400);

    const unchanged = getDb().users.find((u) => u.id === staff.id);
    assert.equal(unchanged?.passwordChangedAt, undefined);
    assert.equal(requireAdmin(authedReq(token)).ok, true);
  });
});
