import { NextRequest } from 'next/server';
import { getDb, sanitizeAdminUser } from '@/server/db';
import { attachAuthCookie, signSessionToken } from '@/server/auth';
import { apiError, apiOk, handleRouteError } from '@/server/http';

export const dynamic = 'force-dynamic';

/** Single source for the demo-login gate, shared by POST (issue session) and GET (UI probe). */
function isDemoLoginAllowed(): boolean {
  return (
    process.env.ALLOW_DEMO_LOGIN === 'true' ||
    (process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEMO_LOGIN !== 'false')
  );
}

/** Public availability probe so the login page can hide the quick-login buttons when disabled. */
export async function GET() {
  return apiOk({ enabled: isDemoLoginAllowed() });
}

/**
 * Preview/demo quick-sign-in endpoint that issues a real server-signed JWT + HttpOnly cookie
 * without ever exposing credentials in client bundles. Disabled if ALLOW_DEMO_LOGIN=false.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isDemoLoginAllowed()) {
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
