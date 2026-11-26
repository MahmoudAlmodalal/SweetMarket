import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { getDb, resetDb } from '@/server/db';
import { POST as login } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-login-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

let ipCounter = 1;
function loginReq(body: unknown, ip?: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/admin/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip ?? `10.77.0.${ipCounter}`,
    },
    body: JSON.stringify(body),
  });
}

function staffEmail(): string {
  const staff = getDb().users.find((u) => u.role === 'staff' && u.isActive);
  assert.ok(staff);
  return staff.email;
}

describe('POST /api/v1/admin/auth/login rate limiting', () => {
  before(() => {
    resetDb();
  });

  it('locks the client after 5 failed attempts and refuses even valid credentials', async () => {
    ipCounter++;
    const ip = `10.77.0.${ipCounter}`;
    const email = staffEmail();

    for (let i = 0; i < 4; i++) {
      const res = await login(loginReq({ email, password: 'wrong-pass' }, ip));
      assert.equal(res.status, 401, `attempt ${i + 1} should be a plain 401`);
    }
    // The 5th failure trips the limiter (same behavior as order tracking).
    const fifth = await login(loginReq({ email, password: 'wrong-pass' }, ip));
    assert.equal(fifth.status, 429);
    assert.equal((await fifth.json()).error.code, 'RATE_LIMITED');

    // While locked, even the correct password is refused.
    const locked = await login(loginReq({ email, password: 'CandyLoz2026!' }, ip));
    assert.equal(locked.status, 429);
  });

  it('does not share the counter across client IPs', async () => {
    ipCounter++;
    const ipA = `10.77.0.${ipCounter}`;
    ipCounter++;
    const ipB = `10.77.0.${ipCounter}`;
    const email = staffEmail();

    for (let i = 0; i < 5; i++) {
      await login(loginReq({ email, password: 'wrong-pass' }, ipA));
    }
    assert.equal((await login(loginReq({ email, password: 'wrong-pass' }, ipA))).status, 429);
    assert.equal((await login(loginReq({ email, password: 'CandyLoz2026!' }, ipB))).status, 200);
  });

  it('a successful login clears the failure counter', async () => {
    ipCounter++;
    const ip = `10.77.0.${ipCounter}`;
    const email = staffEmail();

    for (let i = 0; i < 4; i++) {
      assert.equal((await login(loginReq({ email, password: 'wrong-pass' }, ip))).status, 401);
    }
    assert.equal((await login(loginReq({ email, password: 'CandyLoz2026!' }, ip))).status, 200);
    for (let i = 0; i < 4; i++) {
      const res = await login(loginReq({ email, password: 'wrong-pass' }, ip));
      assert.equal(res.status, 401, 'counter must restart after a success');
    }
  });

  it('validation errors do not consume rate-limit attempts', async () => {
    ipCounter++;
    const ip = `10.77.0.${ipCounter}`;
    for (let i = 0; i < 8; i++) {
      const res = await login(loginReq({ email: '', password: '' }, ip));
      assert.equal(res.status, 400);
    }
    // Still not limited after 8 malformed submissions.
    const res = await login(loginReq({ email: staffEmail(), password: 'wrong-pass' }, ip));
    assert.equal(res.status, 401);
  });
});
