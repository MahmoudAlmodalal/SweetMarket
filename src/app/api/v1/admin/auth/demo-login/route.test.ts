import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { resetDb } from '@/server/db';
import { POST as demoLogin } from './route';
import { GET as me } from '../me/route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-demo-login-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

// process.env.NODE_ENV is typed read-only; write through a mutable view.
const mutableEnv = process.env as unknown as Record<string, string | undefined>;
const ORIGINAL_ALLOW = mutableEnv.ALLOW_DEMO_LOGIN;
const ORIGINAL_NODE_ENV = mutableEnv.NODE_ENV;

function demoReq(body?: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/admin/auth/demo-login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
}

function meReq(token: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/admin/auth/me', {
    method: 'GET',
    headers: { authorization: `Bearer ${token}` },
  });
}

describe('POST /api/v1/admin/auth/demo-login gating', () => {
  before(() => {
    resetDb();
  });

  after(() => {
    if (ORIGINAL_ALLOW === undefined) delete mutableEnv.ALLOW_DEMO_LOGIN;
    else mutableEnv.ALLOW_DEMO_LOGIN = ORIGINAL_ALLOW;
    if (ORIGINAL_NODE_ENV === undefined) delete mutableEnv.NODE_ENV;
    else mutableEnv.NODE_ENV = ORIGINAL_NODE_ENV;
  });

  it('refuses with 403 when ALLOW_DEMO_LOGIN=false outside production', async () => {
    mutableEnv.NODE_ENV = 'development';
    mutableEnv.ALLOW_DEMO_LOGIN = 'false';

    const res = await demoLogin(demoReq());
    assert.equal(res.status, 403);
    assert.equal((await res.json()).error.code, 'FORBIDDEN');
  });

  it('refuses with 403 in production when ALLOW_DEMO_LOGIN is unset', async () => {
    mutableEnv.NODE_ENV = 'production';
    delete mutableEnv.ALLOW_DEMO_LOGIN;

    const res = await demoLogin(demoReq());
    assert.equal(res.status, 403);
  });

  it('refuses with 403 in production when ALLOW_DEMO_LOGIN is not exactly "true"', async () => {
    mutableEnv.NODE_ENV = 'production';
    mutableEnv.ALLOW_DEMO_LOGIN = '1';

    const res = await demoLogin(demoReq());
    assert.equal(res.status, 403);
  });

  it('issues a working manager session when explicitly allowed', async () => {
    mutableEnv.NODE_ENV = 'production';
    mutableEnv.ALLOW_DEMO_LOGIN = 'true';

    const res = await demoLogin(demoReq());
    assert.equal(res.status, 200);
    const payload = await res.json();
    assert.ok(payload.data.token, 'returns a session token');
    assert.equal(payload.data.user.role, 'manager');
    assert.ok(!('passwordHash' in payload.data.user), 'never leaks the password hash');
    assert.match(res.headers.get('set-cookie') ?? '', /HttpOnly/i);

    // The issued token authenticates against the session endpoint.
    const meRes = await me(meReq(payload.data.token));
    assert.equal(meRes.status, 200);
    const mePayload = await meRes.json();
    assert.equal(mePayload.data.user.role, 'manager');
  });

  it('issues a staff session when role=staff is requested', async () => {
    mutableEnv.NODE_ENV = 'production';
    mutableEnv.ALLOW_DEMO_LOGIN = 'true';

    const res = await demoLogin(demoReq({ role: 'staff' }));
    assert.equal(res.status, 200);
    const payload = await res.json();
    assert.equal(payload.data.user.role, 'staff');
  });
});
