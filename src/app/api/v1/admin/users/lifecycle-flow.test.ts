import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import type { AdminUser } from '@/types';
import { getDb, resetDb } from '@/server/db';
import { signSessionToken } from '@/server/auth';
import { GET as listUsers, POST as createUser } from './route';
import { PATCH as patchUser } from './[id]/route';
import { POST as resetPassword } from './[id]/reset-password/route';
import { POST as login } from '../auth/login/route';
import { GET as me } from '../auth/me/route';
import { GET as listAdminProducts } from '../products/route';
import { GET as listAdminOrders } from '../orders/route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-user-lifecycle-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

let ipCounter = 10;

function req(
  method: string,
  url: string,
  options: { token?: string; body?: unknown; freshIp?: boolean } = {}
): NextRequest {
  // Each failed login attempt in this file gets its own source IP so the
  // per-IP login rate limiter never interferes with the scenario itself.
  const ip = `203.0.113.${ipCounter++}`;
  return new NextRequest(url, {
    method,
    headers: {
      'x-forwarded-for': ip,
      ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
}

function managerToken(): string {
  const manager = getDb().users.find((u) => u.role === 'manager' && u.isActive);
  assert.ok(manager);
  return signSessionToken(manager);
}

async function loginAs(
  identifier: string,
  password: string
): Promise<{ status: number; code?: string; token?: string }> {
  const res = await login(
    req('POST', 'http://localhost:3000/api/v1/admin/auth/login', {
      body: { username: identifier, password },
    })
  );
  if (res.status !== 200) {
    const json = await res.json();
    return { status: res.status, code: json?.error?.code };
  }
  return { status: 200, token: (await res.json()).data.token as string };
}

async function meStatus(token: string): Promise<number> {
  const res = await me(req('GET', 'http://localhost:3000/api/v1/admin/auth/me', { token }));
  return res.status;
}

async function createStaffUser(
  suffix: string
): Promise<{ user: AdminUser; temporaryPassword: string }> {
  const res = await createUser(
    req('POST', 'http://localhost:3000/api/v1/admin/users', {
      token: managerToken(),
      body: {
        fullName: 'موظف اختبار دورة الحياة',
        email: `lifecycle-${suffix}@example.com`,
        role: 'staff',
      },
    })
  );
  assert.equal(res.status, 201);
  const data = (await res.json()).data;
  return { user: data.user as AdminUser, temporaryPassword: data.temporaryPassword as string };
}

describe('admin user management effects across auth routes', () => {
  beforeEach(() => {
    resetDb();
  });

  it('a manager-created staff user can log in and work within staff scope only', async () => {
    const { user, temporaryPassword } = await createStaffUser('a');
    assert.equal((user as unknown as Record<string, unknown>).passwordHash, undefined, 'hash never leaks');

    // Real login with the temporary password issues a working session.
    const session = await loginAs(user.username, temporaryPassword);
    assert.equal(session.status, 200);
    assert.ok(session.token);

    const meRes = await me(req('GET', 'http://localhost:3000/api/v1/admin/auth/me', { token: session.token }));
    assert.equal(meRes.status, 200);
    assert.equal((await meRes.json()).data.user.id, user.id);

    // Staff-scope routes accept the token; manager-only routes refuse it.
    assert.equal(
      (await listAdminProducts(req('GET', 'http://localhost:3000/api/v1/admin/products', { token: session.token }))).status,
      200
    );
    assert.equal(
      (await listAdminOrders(req('GET', 'http://localhost:3000/api/v1/admin/orders', { token: session.token }))).status,
      200
    );
    const forbidden = await createUser(
      req('POST', 'http://localhost:3000/api/v1/admin/users', {
        token: session.token,
        body: { fullName: 'محاولة موظف', email: 'staff-attempt@example.com' },
      })
    );
    assert.equal(forbidden.status, 403);

    // The new user appears on the manager's user list without its hash.
    const listRes = await listUsers(
      req('GET', 'http://localhost:3000/api/v1/admin/users', { token: managerToken() })
    );
    const listed = ((await listRes.json()).data as AdminUser[]).find((u) => u.id === user.id);
    assert.ok(listed);
    assert.equal((listed as unknown as Record<string, unknown>).passwordHash, undefined);
  });

  it('rejects invalid and duplicate user creates without changing the user list', async () => {
    const manager = managerToken();
    const beforeCount = (await (await listUsers(req('GET', 'http://localhost:3000/api/v1/admin/users', { token: manager }))).json()).data.length;
    const existing = getDb().users[0];
    assert.ok(existing);

    const badBodies: Record<string, unknown>[] = [
      { fullName: 'مستخدم تجريبي', email: 'not-an-email' },
      { fullName: 'خ', email: 'short-name@example.com' },
      { fullName: 'مستخدم مكرر', email: existing.email }, // duplicate email
      { fullName: 'مستخدم مكرر', email: 'other@example.com', username: existing.username }, // duplicate username
    ];
    for (const body of badBodies) {
      const res = await createUser(
        req('POST', 'http://localhost:3000/api/v1/admin/users', { token: manager, body })
      );
      assert.ok(res.status === 400 || res.status === 409, `expected 400/409, got ${res.status}`);
    }

    const afterRes = await listUsers(req('GET', 'http://localhost:3000/api/v1/admin/users', { token: manager }));
    assert.equal((await afterRes.json()).data.length, beforeCount, 'user list unchanged');
  });

  it('deactivating a user kills the live token and new logins until reactivation', async () => {
    const { user, temporaryPassword } = await createStaffUser('b');
    const session = await loginAs(user.email, temporaryPassword);
    assert.equal(session.status, 200);
    assert.ok(session.token);
    assert.equal(await meStatus(session.token), 200);

    // Manager deactivates the account: the live token dies immediately.
    const patchRes = await patchUser(
      req('PATCH', `http://localhost:3000/api/v1/admin/users/${user.id}`, {
        token: managerToken(),
        body: { isActive: false },
      }),
      { params: { id: user.id } }
    );
    assert.equal(patchRes.status, 200);
    assert.equal(await meStatus(session.token), 401, 'deactivated account token rejected');
    assert.equal(
      (await listAdminOrders(req('GET', 'http://localhost:3000/api/v1/admin/orders', { token: session.token }))).status,
      401
    );

    // Fresh login with the still-correct password is refused as disabled.
    const blocked = await loginAs(user.email, temporaryPassword);
    assert.equal(blocked.status, 403);
    assert.equal(blocked.code, 'ACCOUNT_DISABLED');

    // Reactivation restores logins.
    await patchUser(
      req('PATCH', `http://localhost:3000/api/v1/admin/users/${user.id}`, {
        token: managerToken(),
        body: { isActive: true },
      }),
      { params: { id: user.id } }
    );
    const restored = await loginAs(user.email, temporaryPassword);
    assert.equal(restored.status, 200);
    assert.equal(await meStatus(restored.token as string), 200);
  });

  it('manager password reset revokes existing sessions through the real login flow', async () => {
    const { user, temporaryPassword } = await createStaffUser('c');
    const session = await loginAs(user.email, temporaryPassword);
    assert.equal(session.status, 200);
    assert.ok(session.token);
    assert.equal(await meStatus(session.token), 200);

    // Manager resets the password; the response hands over a new temporary one.
    const resetRes = await resetPassword(
      req('POST', `http://localhost:3000/api/v1/admin/users/${user.id}/reset-password`, {
        token: managerToken(),
        body: {},
      }),
      { params: { id: user.id } }
    );
    assert.equal(resetRes.status, 200);
    const newTemporary = (await resetRes.json()).data.temporaryPassword as string;
    assert.ok(newTemporary);
    assert.notEqual(newTemporary, temporaryPassword);

    // The pre-reset session is revoked, and the old password no longer logs in.
    assert.equal(await meStatus(session.token), 401, 'session minted before the reset is revoked');
    const oldLogin = await loginAs(user.email, temporaryPassword);
    assert.equal(oldLogin.status, 401);
    assert.equal(oldLogin.code, 'INVALID_CREDENTIALS');

    // The new temporary password logs in and the fresh session works.
    const fresh = await loginAs(user.email, newTemporary);
    assert.equal(fresh.status, 200);
    assert.equal(await meStatus(fresh.token as string), 200);
  });

  it('enforces self-deactivation and last-manager guards', async () => {
    const db = getDb();
    const managers = db.users.filter((u) => u.role === 'manager' && u.isActive);
    assert.ok(managers.length >= 2, 'seed provides at least two active managers');
    const [managerA, managerB] = managers;
    const tokenA = signSessionToken(managerA);

    // A manager cannot deactivate their own logged-in account.
    const selfOff = await patchUser(
      req('PATCH', `http://localhost:3000/api/v1/admin/users/${managerA.id}`, {
        token: tokenA,
        body: { isActive: false },
      }),
      { params: { id: managerA.id } }
    );
    assert.equal(selfOff.status, 400);
    assert.equal((await selfOff.json()).error.code, 'SELF_DEACTIVATION_FORBIDDEN');
    assert.equal(getDb().users.find((u) => u.id === managerA.id)?.isActive, true);

    // Another manager may deactivate manager B while A remains active.
    const offB = await patchUser(
      req('PATCH', `http://localhost:3000/api/v1/admin/users/${managerB.id}`, {
        token: tokenA,
        body: { isActive: false },
      }),
      { params: { id: managerB.id } }
    );
    assert.equal(offB.status, 200);

    // Now A is the last active manager: demoting A to staff is refused,
    // and A stays an active manager.
    const demoteA = await patchUser(
      req('PATCH', `http://localhost:3000/api/v1/admin/users/${managerA.id}`, {
        token: tokenA,
        body: { role: 'staff' },
      }),
      { params: { id: managerA.id } }
    );
    assert.equal(demoteA.status, 400);
    assert.equal((await demoteA.json()).error.code, 'LAST_MANAGER_GUARD');
    const storedA = getDb().users.find((u) => u.id === managerA.id);
    assert.equal(storedA?.role, 'manager');
    assert.equal(storedA?.isActive, true);
  });

  it('a promoted staff user gains manager scope on their existing session', async () => {
    const { user, temporaryPassword } = await createStaffUser('d');
    const session = await loginAs(user.email, temporaryPassword);
    assert.equal(session.status, 200);
    assert.ok(session.token);

    // Before promotion: manager-only route refuses.
    const beforePromotion = await createUser(
      req('POST', 'http://localhost:3000/api/v1/admin/users', {
        token: session.token,
        body: { fullName: 'قبل الترقية', email: 'before-promo@example.com' },
      })
    );
    assert.equal(beforePromotion.status, 403);

    // Promote to manager through the admin route.
    const promote = await patchUser(
      req('PATCH', `http://localhost:3000/api/v1/admin/users/${user.id}`, {
        token: managerToken(),
        body: { role: 'manager' },
      }),
      { params: { id: user.id } }
    );
    assert.equal(promote.status, 200);
    assert.equal((await promote.json()).data.role, 'manager');

    // The same session token now passes manager-only routes: role is read live.
    const afterPromotion = await createUser(
      req('POST', 'http://localhost:3000/api/v1/admin/users', {
        token: session.token,
        body: { fullName: 'بعد الترقية', email: 'after-promo@example.com' },
      })
    );
    assert.equal(afterPromotion.status, 201, 'existing session gains manager scope after promotion');
  });
});
