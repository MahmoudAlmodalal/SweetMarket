import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NextRequest, NextResponse } from 'next/server';
import {
  attachAuthCookie,
  attachRefreshCookie,
  clearAuthCookie,
  clearRefreshCookie,
  COOKIE_NAME,
  extractTokenFromRequest,
  generateTemporaryPassword,
  generateTrackingToken,
  REFRESH_COOKIE_NAME,
  revokeSessionToken,
  signSessionToken,
  verifyMutationOrigin,
  verifyPassword,
  verifySessionToken,
} from './auth';

function reqWith(
  headers: Record<string, string>,
  cookies: Record<string, string> = {},
  method = 'GET'
): NextRequest {
  const req = new NextRequest('http://localhost:3000/api/v1/admin/orders', { method, headers });
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }
  return req;
}

describe('Session token tamper resistance', () => {
  it('rejects a token whose payload was modified', () => {
    const token = signSessionToken({ id: 'usr-1', role: 'staff' });
    const [header, payload, sig] = token.split('.');
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: 'usr-1', role: 'manager', jti: 'x', iat: 1, exp: 9999999999 })
    )
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    assert.equal(verifySessionToken(`${header}.${forgedPayload}.${sig}`), null);
  });

  it('rejects a token with a corrupted signature', () => {
    const token = signSessionToken({ id: 'usr-1', role: 'manager' });
    const [header, payload, sig] = token.split('.');
    const flipped = sig.slice(0, -2) + (sig.endsWith('A') ? 'B' : 'A');
    assert.equal(verifySessionToken(`${header}.${payload}.${flipped}`), null);
  });

  it('rejects malformed tokens: wrong part count, empty, non-string, bad payload encoding', () => {
    assert.equal(verifySessionToken(''), null);
    assert.equal(verifySessionToken('only.two'), null);
    assert.equal(verifySessionToken('a.b.c.d'), null);
    assert.equal(verifySessionToken(null as unknown as string), null);
    const token = signSessionToken({ id: 'usr-1', role: 'manager' });
    const [header, , sig] = token.split('.');
    // Payload that is not valid base64/JSON must not throw.
    assert.equal(verifySessionToken(`${header}.!!!not-json!!!.${sig}`), null);
  });

  it('rejects a signed token once it has expired', () => {
    const realNow = Date.now;
    try {
      // Sign a token 13 hours in the past (TTL is 12 hours), then verify now.
      Date.now = () => realNow() - 13 * 60 * 60 * 1000;
      const stale = signSessionToken({ id: 'usr-1', role: 'manager' });
      Date.now = realNow;
      assert.equal(verifySessionToken(stale), null);
    } finally {
      Date.now = realNow;
    }
  });

  it('keeps tokens without a jti rejected after revocation bookkeeping', () => {
    // Revoking an already-invalid token must not throw or create state.
    revokeSessionToken('garbage.token.here');
    const token = signSessionToken({ id: 'usr-2', role: 'staff' });
    revokeSessionToken(token);
    revokeSessionToken(token); // idempotent second revoke
    assert.equal(verifySessionToken(token), null);
  });
});

describe('extractTokenFromRequest', () => {
  it('prefers a Bearer header over the auth cookie', () => {
    const req = reqWith({ authorization: 'Bearer header-token' }, { [COOKIE_NAME]: 'cookie-token' });
    const { token, viaCookie } = extractTokenFromRequest(req);
    assert.equal(token, 'header-token');
    assert.equal(viaCookie, false);
  });

  it('accepts a case-insensitive Bearer scheme', () => {
    const req = reqWith({ authorization: 'bearer lower-token' });
    const { token, viaCookie } = extractTokenFromRequest(req);
    assert.equal(token, 'lower-token');
    assert.equal(viaCookie, false);
  });

  it('falls back to the auth cookie and flags it', () => {
    const req = reqWith({}, { [COOKIE_NAME]: 'cookie-token' });
    const { token, viaCookie } = extractTokenFromRequest(req);
    assert.equal(token, 'cookie-token');
    assert.equal(viaCookie, true);
  });

  it('returns null when neither source carries a token and ignores empty Bearer values', () => {
    const empty = extractTokenFromRequest(reqWith({}));
    assert.equal(empty.token, null);
    assert.equal(empty.viaCookie, false);

    const blankBearer = extractTokenFromRequest(reqWith({ authorization: 'Bearer   ' }));
    assert.equal(blankBearer.token, null);
  });
});

describe('verifyMutationOrigin (CSRF guard for cookie-authenticated mutations)', () => {
  it('bypasses origin checks for Bearer-token requests', () => {
    const req = reqWith({ authorization: 'Bearer token', origin: 'http://evil.example' });
    assert.equal(verifyMutationOrigin(req, false), true);
  });

  it('accepts cookie requests carrying an X-Requested-With header', () => {
    const req = reqWith({ 'x-requested-with': 'XMLHttpRequest', origin: 'http://evil.example' });
    assert.equal(verifyMutationOrigin(req, true), true);
  });

  it('accepts cookie requests whose Origin matches the Host', () => {
    const req = reqWith({ origin: 'http://localhost:3000', host: 'localhost:3000' });
    assert.equal(verifyMutationOrigin(req, true), true);
  });

  it('accepts cookie requests whose Origin matches the forwarded host', () => {
    const req = reqWith({
      origin: 'https://candyloz.example',
      host: 'internal:3000',
      'x-forwarded-host': 'candyloz.example',
    });
    assert.equal(verifyMutationOrigin(req, true), true);
  });

  it('rejects cookie requests whose Origin points at a different host', () => {
    const req = reqWith({ origin: 'http://evil.example', host: 'localhost:3000' });
    assert.equal(verifyMutationOrigin(req, true), false);
  });

  it('rejects cookie requests with an unparseable Origin header', () => {
    const req = reqWith({ origin: 'not a url', host: 'localhost:3000' });
    assert.equal(verifyMutationOrigin(req, true), false);
  });
});

describe('Auth cookie attributes', () => {
  it('sets HttpOnly Secure cookies with a 12 hour Max-Age and clears with Max-Age=0', () => {
    const res = NextResponse.json({ ok: true });
    attachAuthCookie(res, 'session-token');
    const setCookie = res.headers.get('set-cookie') ?? '';
    assert.ok(setCookie.includes(`${COOKIE_NAME}=`), 'session cookie name present');
    assert.ok(setCookie.includes('HttpOnly'));
    assert.ok(setCookie.includes('Secure'));
    assert.ok(setCookie.includes('SameSite=none') || setCookie.includes('SameSite=None'));
    assert.ok(setCookie.includes('Max-Age=43200'), '12 hour session TTL');

    const cleared = NextResponse.json({ ok: true });
    clearAuthCookie(cleared);
    const clearedCookie = cleared.headers.get('set-cookie') ?? '';
    assert.ok(clearedCookie.includes('Max-Age=0'));
  });

  it('sets the refresh cookie with a 7 day Max-Age and clears it', () => {
    const res = NextResponse.json({ ok: true });
    attachRefreshCookie(res, 'refresh-token');
    const setCookie = res.headers.get('set-cookie') ?? '';
    assert.ok(setCookie.includes(`${REFRESH_COOKIE_NAME}=`));
    assert.ok(setCookie.includes('HttpOnly'));
    assert.ok(setCookie.includes('Max-Age=604800'), '7 day refresh TTL');

    const cleared = NextResponse.json({ ok: true });
    clearRefreshCookie(cleared);
    assert.ok((cleared.headers.get('set-cookie') ?? '').includes('Max-Age=0'));
  });
});

describe('Credential and token generation', () => {
  it('generates temporary passwords in the documented unambiguous alphabet', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const pwd = generateTemporaryPassword();
      assert.match(pwd, /^CL-[A-HJ-NP-Z2-9]{8}$/);
      assert.ok(!/[01IO]/.test(pwd), 'no ambiguous characters 0, 1, I, O');
      seen.add(pwd);
    }
    assert.ok(seen.size > 150, 'temporary passwords should be highly unique');
  });

  it('generates 24-byte hex tracking tokens', () => {
    const token = generateTrackingToken();
    assert.match(token, /^[0-9a-f]{48}$/);
    assert.notEqual(generateTrackingToken(), token);
  });
});

describe('verifyPassword robustness', () => {
  it('rejects malformed stored hashes and empty inputs without throwing', () => {
    assert.equal(verifyPassword('secret', ''), false);
    assert.equal(verifyPassword('secret', 'no-salt-separator'), false);
    assert.equal(verifyPassword('secret', ':'), false);
    assert.equal(verifyPassword('', 'salt:hash'), false);
    assert.equal(verifyPassword('secret', null as unknown as string), false);
  });
});
