import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { signSessionToken } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { PATCH as patchUser } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-user-id-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function tokenFor(role: 'staff' | 'manager'): string {
  const user = getDb().users.find((u) => u.role === role && u.isActive);
  assert.ok(user);
  return signSessionToken(user);
}

function reqFor(id: string, body?: unknown, token?: string) {
  const req = new NextRequest(`http://localhost:3000/api/v1/admin/users/${id}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return [req, { params: { id } }] as const;
}

describe('admin users [id] PATCH route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('is manager-only', async () => {
    const staff = getDb().users.find((u) => u.role === 'staff');
    assert.ok(staff);
    const [req, ctx] = reqFor(staff.id, { jobTitle: 'موظف' }, tokenFor('staff'));
    assert.equal((await patchUser(req, ctx)).status, 403);
  });

  it('404s unknown users', async () => {
    const [req, ctx] = reqFor('user-does-not-exist', { jobTitle: 'x' }, tokenFor('manager'));
    assert.equal((await patchUser(req, ctx)).status, 404);
  });

  it('forbids deactivating your own account', async () => {
    const self = getDb().users.find((u) => u.role === 'manager' && u.isActive);
    assert.ok(self);
    const [req, ctx] = reqFor(self.id, { isActive: false }, tokenFor('manager'));
    const res = await patchUser(req, ctx);
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error.code, 'SELF_DEACTIVATION_FORBIDDEN');
    assert.equal(
      getDb().users.find((u) => u.id === self.id)?.isActive,
      true,
      'self-deactivation must not persist'
    );
  });

  it('guards the last active manager from demotion', async () => {
    const manager = tokenFor('manager');
    const managers = getDb().users.filter((u) => u.role === 'manager' && u.isActive);
    assert.ok(managers.length >= 2, 'seed must have at least two active managers');

    // Demote all but one manager first; each step is legal.
    for (const m of managers.slice(1)) {
      const [req, ctx] = reqFor(m.id, { role: 'staff' }, manager);
      assert.equal((await patchUser(req, ctx)).status, 200);
    }

    const lastManager = managers[0];
    const [demoteReq, demoteCtx] = reqFor(lastManager.id, { role: 'staff' }, manager);
    const demote = await patchUser(demoteReq, demoteCtx);
    assert.equal(demote.status, 400);
    assert.equal((await demote.json()).error.code, 'LAST_MANAGER_GUARD');

    // Deactivating the last manager is unreachable as LAST_MANAGER_GUARD: the
    // actor is an active manager, so a distinct last manager cannot exist, and
    // deactivating yourself hits SELF_DEACTIVATION_FORBIDDEN first (covered above).
    const after = getDb().users.find((u) => u.id === lastManager.id);
    assert.equal(after?.role, 'manager', 'last manager must keep the role');
    assert.equal(after?.isActive, true);
  });

  it('applies a valid patch and returns the sanitized user', async () => {
    const staff = getDb().users.find((u) => u.role === 'staff' && u.isActive);
    assert.ok(staff);
    const [req, ctx] = reqFor(
      staff.id,
      { role: 'manager', fullName: 'نور المديرة', jobTitle: 'مديرة فرع' },
      tokenFor('manager')
    );
    const res = await patchUser(req, ctx);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.role, 'manager');
    assert.equal(json.data.fullName, 'نور المديرة');
    assert.equal(json.data.jobTitle, 'مديرة فرع');
    assert.equal('passwordHash' in json.data, false, 'hash must be stripped');

    const stored = getDb().users.find((u) => u.id === staff.id);
    assert.equal(stored?.role, 'manager', 'patch persisted');
  });
});
