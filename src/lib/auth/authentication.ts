/**
 * Authentication Client Module
 * Communicates with /api/v1/admin/auth/* using HttpOnly cookies + in-memory Bearer JWT.
 * Never persists auth tokens or credentials in localStorage.
 */

import type { AdminRole, AdminSession, AdminUser } from '@/types';
import { apiRequest, ApiClientError, getAuthToken, setAuthToken } from '@/lib/api-client';
import { adaptAdminUser } from '@/lib/api-adapters';
import { STORAGE_KEYS, removeStorageItem, isBrowser } from '@/lib/storage';

export interface AuthenticationResult {
  success: boolean;
  user?: AdminUser;
  token?: string;
  error?: string;
}

let activeUserCache: AdminUser | null = null;

/**
 * Normalize raw admin user payload into strict AdminUser shape.
 */
export function normalizeAdminUser(rawUser: unknown): AdminUser | null {
  if (!rawUser || typeof rawUser !== 'object') return null;
  const adapted = adaptAdminUser(rawUser as Record<string, unknown>);
  if (!adapted.id) return null;
  return adapted;
}

/**
 * Generates a client-side idempotency or correlation UUID.
 */
export function generateSecureSessionToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Authenticate admin user against POST /api/v1/admin/auth/login.
 */
export async function authenticateAdminUser(
  identifier: string,
  providedSecret: string
): Promise<AuthenticationResult> {
  try {
    const data = await apiRequest<{ token: string; user: Record<string, unknown> }>(
      '/api/v1/admin/auth/login',
      {
        method: 'POST',
        body: {
          email: identifier.trim(),
          username: identifier.trim(),
          password: providedSecret,
        },
      }
    );

    const user = normalizeAdminUser(data.user);
    if (!user) {
      return { success: false, error: 'تعذّر قراءة بيانات الحساب الإداري' };
    }

    setAuthToken(data.token || null);
    activeUserCache = user;
    // Purge any legacy localStorage session from older builds
    if (isBrowser()) {
      removeStorageItem(STORAGE_KEYS.ADMIN_SESSION);
    }

    return { success: true, user, token: data.token };
  } catch (err) {
    const msg =
      err instanceof ApiClientError
        ? err.message
        : 'بيانات الدخول غير صحيحة، يرجى التحقق والمحاولة مجدداً';
    return { success: false, error: msg };
  }
}

/**
 * Preview/demo quick login via server-signed POST /api/v1/admin/auth/demo-login.
 */
export async function demoLoginAsAdmin(
  role: AdminRole = 'manager'
): Promise<AuthenticationResult> {
  try {
    const data = await apiRequest<{ token: string; user: Record<string, unknown> }>(
      '/api/v1/admin/auth/demo-login',
      {
        method: 'POST',
        body: { role },
      }
    );

    const user = normalizeAdminUser(data.user);
    if (!user) {
      return { success: false, error: 'تعذّر تهيئة جلسة الإدارة التجريبية' };
    }

    setAuthToken(data.token || null);
    activeUserCache = user;
    if (isBrowser()) {
      removeStorageItem(STORAGE_KEYS.ADMIN_SESSION);
    }

    return { success: true, user, token: data.token };
  } catch (err) {
    const msg =
      err instanceof ApiClientError
        ? err.message
        : 'تعذّر الدخول التجريبي، يرجى تسجيل الدخول يدوياً';
    return { success: false, error: msg };
  }
}

/**
 * Hydrate active session from server cookie via GET /api/v1/admin/auth/me.
 */
export async function fetchServerSession(): Promise<AdminUser | null> {
  try {
    const data = await apiRequest<{ user: Record<string, unknown> }>(
      '/api/v1/admin/auth/me',
      { method: 'GET' }
    );
    const user = normalizeAdminUser(data?.user);
    activeUserCache = user;
    return user;
  } catch {
    activeUserCache = null;
    setAuthToken(null);
    return null;
  }
}

/**
 * Returns in-memory cached session synchronously when already hydrated.
 */
export function getActiveSession(): AdminSession | null {
  if (!activeUserCache) return null;
  return {
    token: getAuthToken() || 'cookie-session',
    user: activeUserCache,
  };
}

/**
 * End session on server and clear in-memory token.
 */
export async function terminateSession(): Promise<void> {
  activeUserCache = null;
  setAuthToken(null);
  if (isBrowser()) {
    removeStorageItem(STORAGE_KEYS.ADMIN_SESSION);
  }
  try {
    await apiRequest('/api/v1/admin/auth/logout', { method: 'POST' });
  } catch {
    // Ignore network failures during logout cleanup
  }
}
