import crypto from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';
import type { AdminRole, AdminUser } from '@/types';

export const COOKIE_NAME = 'candy_admin_token';
export const REFRESH_COOKIE_NAME = 'candy_admin_refresh';
const TOKEN_TTL_SECONDS = 60 * 60 * 12; // 12 hours
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Process-stable secret: reads JWT_SECRET from env, otherwise derives a random runtime secret once.
const globalForAuth = globalThis as unknown as {
  __candyJwtSecret?: string;
  __candyRevokedTokens?: Set<string>;
};

function getJwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16) {
    return process.env.JWT_SECRET.trim();
  }
  if (!globalForAuth.__candyJwtSecret) {
    globalForAuth.__candyJwtSecret = crypto.randomBytes(32).toString('hex');
  }
  return globalForAuth.__candyJwtSecret;
}

function getRevokedSet(): Set<string> {
  if (!globalForAuth.__candyRevokedTokens) {
    globalForAuth.__candyRevokedTokens = new Set<string>();
  }
  return globalForAuth.__candyRevokedTokens;
}

/**
 * Hash a password with random 16-byte salt using Node's native scrypt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

/**
 * Constant-time password verification against a stored scrypt hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;

  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(keyHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

/**
 * Generate a readable, cryptographically random temporary password (CL-Temp-XXXXXX).
 */
export function generateTemporaryPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return `CL-${code}`;
}

interface JwtPayload {
  sub: string;
  role: AdminRole;
  jti: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function signSessionToken(user: Pick<AdminUser, 'id' | 'role'>): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: user.id,
    role: user.role,
    jti: crypto.randomUUID(),
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${header}.${payloadB64}`;
  const sig = crypto
    .createHmac('sha256', getJwtSecret())
    .update(data)
    .digest();
  return `${data}.${base64UrlEncode(sig)}`;
}

export function verifySessionToken(token: string): JwtPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = parts;
  const expectedSig = base64UrlEncode(
    crypto.createHmac('sha256', getJwtSecret()).update(`${headerB64}.${payloadB64}`).digest()
  );

  const a = Buffer.from(sigB64);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as JwtPayload;
    if (!payload.sub || !payload.exp || !payload.jti) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (getRevokedSet().has(payload.jti)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function revokeSessionToken(token: string): void {
  const payload = verifySessionToken(token);
  if (payload?.jti) {
    getRevokedSet().add(payload.jti);
  }
}

export function extractTokenFromRequest(req: NextRequest): { token: string | null; viaCookie: boolean } {
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return { token: bearer, viaCookie: false };
  }

  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) {
    return { token: cookieToken, viaCookie: true };
  }

  return { token: null, viaCookie: false };
}

/**
 * CSRF protection for cookie-authenticated mutations:
 * Requires either Bearer header, X-Requested-With header, or matching Origin/Host.
 */
export function verifyMutationOrigin(req: NextRequest, viaCookie: boolean): boolean {
  if (!viaCookie) return true;
  if (req.headers.get('x-requested-with')) return true;

  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!origin || !host) return true; // Same-origin fetch without Origin header
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

export function attachAuthCookie(res: NextResponse, token: string): void {
  res.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=${TOKEN_TTL_SECONDS}`
  );
}

export function clearAuthCookie(res: NextResponse): void {
  res.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0`
  );
}

export function attachRefreshCookie(res: NextResponse, refreshToken: string): void {
  res.headers.append(
    'Set-Cookie',
    `${REFRESH_COOKIE_NAME}=${encodeURIComponent(refreshToken)}; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=${REFRESH_TTL_SECONDS}`
  );
}

export function clearRefreshCookie(res: NextResponse): void {
  res.headers.append(
    'Set-Cookie',
    `${REFRESH_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0`
  );
}

export function generateTrackingToken(): string {
  return crypto.randomBytes(24).toString('hex');
}
