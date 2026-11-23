import { NextRequest } from 'next/server';
import { resetDb } from '@/server/db';
import { requireAdmin } from '@/server/guard';
import { apiError, apiOk, handleRouteError } from '@/server/http';

export const dynamic = 'force-dynamic';

function isDevToolsAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_TOOLS === 'true';
}

/**
 * Developer-only database reset endpoint.
 * Guarded by:
 * 1. Non-production environment (or explicit ALLOW_DEV_TOOLS=true).
 * 2. Authenticated Manager session + CSRF/Origin verification via requireAdmin.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isDevToolsAllowed()) {
      return apiError('NOT_FOUND', 'هذا المسار غير متاح في بيئة الإنتاج', 404);
    }

    const auth = requireAdmin(req, { managerOnly: true });
    if (!auth.ok) return auth.response;

    const fresh = resetDb();

    return apiOk({
      reset: true,
      resetAt: new Date().toISOString(),
      resetBy: auth.user.username,
      counts: {
        categories: fresh.categories.length,
        products: fresh.products.length,
        zones: fresh.zones.length,
        orders: fresh.orders.length,
        users: fresh.users.length,
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
