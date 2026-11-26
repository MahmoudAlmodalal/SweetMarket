import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken } from './auth';
import { getDb, resetDb, saveDb } from './db';
import { requireAdmin } from './guard';
import { POST as changePassword } from '@/app/api/v1/admin/auth/change-password/route';
import { POST as login } from '@/app/api/v1/admin/auth/login/route';

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

  it('invalidates sessions issued before a password change', () => {
    resetDb();
    const manager = seedUser('manager');
    // Sign the stale token a few seconds in the past: iat resolution is 1s.
    const realNow = Date.now;
    let staleToken: string;
    try {
      Date.now = () => realNow() - 5000;
      staleToken = signSessionToken(manager);
    } finally {
      Date.now = realNow;
    }

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
    try {
      Date.now = () => realNow() + 2000;
      const freshToken = signSessionToken(manager);
      assert.equal(requireAdmin(authedReq(freshToken)).ok, true);
    } finally {
      Date.now = realNow;
    }
  });

  it('keeps an immediate same-second re-login valid (iat has 1s resolution)', async () => {
    resetDb();
    const staff = seedUser('staff');
    const realNow = Date.now;
    try {
      // Freeze the clock: password change and re-login land in the same second.
      const frozen = realNow();
      Date.now = () => frozen;

      const oldToken = signSessionToken(staff);
      const changeReq = new NextRequest('http://localhost:3000/api/v1/admin/auth/change-password', {
        method: 'POST',
        headers: { authorization: `Bearer ${oldToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ currentPassword: 'CandyLoz2026!', newPassword: 'NewSecret123!' }),
      });
      const changeRes = await changePassword(changeReq);
      assert.equal(changeRes.status, 200);

      // Fresh login with the new password in the same clock second.
      const loginReq = new NextRequest('http://localhost:3000/api/v1/admin/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: staff.email, password: 'NewSecret123!' }),
      });
      const loginRes = await login(loginReq);
      assert.equal(loginRes.status, 200);
      const loginJson = await loginRes.json();
      const freshToken = loginJson.data.token as string;

      // The new same-second session must work; even the SAME-second pre-change
      // token must die (stamp mismatch, no clock-granularity window).
      assert.equal(requireAdmin(authedReq(freshToken)).ok, true);
      const sameSecondOld = requireAdmin(authedReq(oldToken));
      assert.equal(sameSecondOld.ok, false);
      if (!sameSecondOld.ok) assert.equal(sameSecondOld.response.status, 401);
    } finally {
      Date.now = realNow;
    }

    // A pre-change token carries no stamp (pass id/role only, like the old format).
    const older = (() => {
      const realNow2 = Date.now;
      try {
        Date.now = () => realNow2() - 5000;
        return signSessionToken({ id: staff.id, role: staff.role });
      } finally {
        Date.now = realNow2;
      }
    })();
    const rejected = requireAdmin(authedReq(older));
    assert.equal(rejected.ok, false);
  });

  it('persists passwordChangedAt to the database file across reloads', async () => {
    resetDb();
    const staff = seedUser('staff');
    const token = signSessionToken(staff);
    const req = new NextRequest('http://localhost:3000/api/v1/admin/auth/change-password', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'CandyLoz2026!', newPassword: 'NewSecret123!' }),
    });
    assert.equal((await changePassword(req)).status, 200);

    // Read the persisted file directly: the stamp must survive a process restart.
    const raw = JSON.parse(fs.readFileSync(process.env.CANDY_LOZ_DB_PATH!, 'utf8'));
    const persisted = raw.users.find((u: { id: string }) => u.id === staff.id);
    assert.ok(persisted.passwordChangedAt, 'stamp must be written to disk');

    // Backward compatibility: users without a stamp (pre-feature databases)
    // keep working with both old-format (pwd-less) and new-format tokens.
    resetDb();
    const legacy = seedUser('staff');
    assert.equal(legacy.passwordChangedAt, undefined);
    const oldFormat = signSessionToken({ id: legacy.id, role: legacy.role });
    assert.equal(requireAdmin(authedReq(oldFormat)).ok, true);
  });

  it('change-password route stamps passwordChangedAt and old sessions die', async () => {
    resetDb();
    const staff = seedUser('staff');
    const realNow = Date.now;
    let token: string;
    try {
      Date.now = () => realNow() - 5000;
      token = signSessionToken(staff);
    } finally {
      Date.now = realNow;
    }

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
