#!/usr/bin/env node
/**
 * Generates cryptographically strong secrets for Candy Loz (Next.js + Django).
 * Prints directly to stdout so secrets are NEVER stored in tracked repository files.
 *
 * Usage:
 *   npm run secrets:generate
 *   npm run secrets:generate -- --app-url https://candyloz.com --backend-url https://api.candyloz.com
 */

import crypto from 'node:crypto';

function getArg(flag, fallback = '') {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1].trim();
  }
  return fallback;
}

function generateStrongPassword(length = 20) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-';
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

const appUrl = getArg('--app-url', 'https://your-domain.com');
const backendUrl = getArg('--backend-url', 'https://api.your-domain.com');

let backendHost = 'api.your-domain.com';
try {
  backendHost = new URL(backendUrl).hostname;
} catch {
  // keep placeholder
}

const jwtSecret = crypto.randomBytes(32).toString('hex');
const internalSecret = crypto.randomBytes(32).toString('hex');
const djangoSecret = crypto.randomBytes(48).toString('base64url');
const initialAdminPassword = generateStrongPassword(20);

console.log('# ============================================================================');
console.log('# Candy Loz — Freshly Generated Production Secrets (DO NOT COMMIT TO GIT)');
console.log('# Paste these into your hosting provider Settings -> Secrets (or local .env)');
console.log('# ============================================================================\n');

console.log('# --- Next.js Service ---');
console.log(`NEXT_PUBLIC_APP_URL=${appUrl}`);
console.log(`BACKEND_API_URL=${backendUrl}`);
console.log(`BACKEND_INTERNAL_SECRET=${internalSecret}`);
console.log('BACKEND_STRICT_PROXY=true');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`INITIAL_ADMIN_PASSWORD=${initialAdminPassword}`);
console.log('ALLOW_DEMO_LOGIN=false');
console.log('ALLOW_DEV_TOOLS=false\n');

console.log('# --- Django Backend Service (/backend) ---');
console.log(`DJANGO_SECRET_KEY=${djangoSecret}`);
console.log('DJANGO_DEBUG=False');
console.log(`DJANGO_ALLOWED_HOSTS=${backendHost}`);
console.log(`DJANGO_CORS_ALLOWED_ORIGINS=${appUrl}`);
console.log(`DJANGO_CSRF_TRUSTED_ORIGINS=${appUrl}`);
console.log(`BACKEND_INTERNAL_SECRET=${internalSecret}`);
console.log('DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/candy_loz');
console.log('REDIS_URL=redis://HOST:6379/0\n');
