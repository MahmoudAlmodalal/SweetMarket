import { NextRequest, NextResponse } from 'next/server';
import { getDb, sanitizeAdminUser } from '@/server/db';
import {
  attachAuthCookie,
  attachRefreshCookie,
  signSessionToken,
  verifyPassword,
} from '@/server/auth';
import { apiError, apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const proxied = await proxyToUpstreamIfConfigured(req, '/api/v1/admin/auth/login');
    if (proxied) {
      if (proxied.ok) {
        const text = await proxied.text();
        const res = new NextResponse(text, {
          status: proxied.status,
          headers: proxied.headers,
        });
        try {
          const parsed = JSON.parse(text);
          const payload = parsed?.data ?? parsed;
          const accessToken = payload?.token ?? payload?.access;
          const refreshToken = payload?.refresh;
          if (typeof accessToken === 'string' && accessToken.length > 0) {
            attachAuthCookie(res, accessToken);
          }
          if (typeof refreshToken === 'string' && refreshToken.length > 0) {
            attachRefreshCookie(res, refreshToken);
          }
        } catch {
          // Leave response unchanged if upstream payload isn't JSON
        }
        return res;
      }
      return proxied;
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return apiError('VALIDATION_ERROR', 'يرجى إدخال بيانات تسجيل الدخول', 400);
    }

    const identifier = String(body.email ?? body.username ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!identifier || !password) {
      return apiError('VALIDATION_ERROR', 'يرجى إدخال اسم المستخدم وكلمة المرور', 400);
    }

    const db = getDb();
    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier
    );

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return apiError('INVALID_CREDENTIALS', 'بيانات الدخول غير صحيحة، يرجى التحقق والمحاولة مجدداً', 401);
    }

    if (!user.isActive) {
      return apiError(
        'ACCOUNT_DISABLED',
        'تم تعطيل هذا الحساب. يرجى التواصل مع مدير المتجر',
        403
      );
    }

    const token = signSessionToken(user);
    const res = apiOk({
      token,
      user: sanitizeAdminUser(user),
    });
    attachAuthCookie(res, token);
    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}
