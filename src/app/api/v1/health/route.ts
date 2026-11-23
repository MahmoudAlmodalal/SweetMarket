import { NextRequest } from 'next/server';
import { getDb } from '@/server/db';
import { apiOk, handleRouteError, pingUpstreamHealth } from '@/server/http';

export const dynamic = 'force-dynamic';

/**
 * Lightweight health check for monitoring, smoke tests, and local dev tooling.
 * Intentionally exposes only non-sensitive operational metadata.
 */
export async function GET(_req: NextRequest) {
  try {
    const db = getDb();
    const activeCategories = db.categories.filter((c) => c.isActive).length;
    const activeProducts = db.products.filter((p) => !p.isArchived && p.isAvailable).length;
    const activeZones = db.zones.filter((z) => z.isActive).length;
    const upstream = await pingUpstreamHealth();

    return apiOk({
      status: 'ok',
      service: 'candy-loz-api',
      version: 'v1',
      mode: upstream.configured ? 'upstream-proxy' : 'local-persistent',
      strictProxy: process.env.BACKEND_STRICT_PROXY === 'true',
      upstream,
      devToolsEnabled:
        process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_TOOLS === 'true',
      timestamp: new Date().toISOString(),
      catalog: {
        activeCategories,
        activeProducts,
        activeZones,
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
