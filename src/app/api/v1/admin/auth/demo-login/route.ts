import { NextRequest } from 'next/server';
import { getDb, sanitizeAdminUser } from '@/server/db';
import { attachAuthCookie, signSessionToken } from '@/server/auth';
import { apiError, apiOk, handleRouteError } from '@/server/http';

export const dynamic = 'force-dynamic';

/**
 * Preview/demo quick-sign-in endpoint that issues a real server-signed JWT + HttpOnly cookie
 * without ever exposing credentials in client bundles. Disabled if ALLOW_DEMO_LOGIN=false.
 */
export async function POST(req: NextRequest) {
  try {
    const isDemoAllowed =
      process.env.ALLOW_DEMO_LOGIN === 'true' ||
      (process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEMO_LOGIN !== 'false');

    if (!isDemoAllowed) {
      return apiError('FORBIDDEN', 'الدخول التجريبي السريع معطّل في بيئة الإنتاج', 403);
    }

    const body = await req.json().catch(() => ({}));
    const requestedRole = body?.role === 'staff' ? 'staff' : 'manager';

    const db = getDb();
    const user = db.users.find((u) => u.role === requestedRole && u.isActive);
    if (!user) {
      return apiError('USER_NOT_FOUND', 'لا يوجد حساب تجريبي نشط لهذا الدور', 404);
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
