import { NextRequest } from 'next/server';
import { requireAdmin } from '@/server/guard';
import { sanitizeAdminUser } from '@/server/db';
import { apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const proxied = await proxyToUpstreamIfConfigured(req, '/api/v1/admin/auth/me');
    if (proxied) return proxied;

    const auth = requireAdmin(req);
    if (!auth.ok) return auth.response;

    return apiOk({
      user: sanitizeAdminUser(auth.user),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
