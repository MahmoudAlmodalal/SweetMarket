import { NextRequest } from 'next/server';
import { getDb } from '@/server/db';
import { apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const proxied = await proxyToUpstreamIfConfigured(req, '/api/v1/categories');
    if (proxied) return proxied;

    const db = getDb();
    const activeCategories = db.categories
      .filter((c) => c.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    return apiOk(activeCategories);
  } catch (err) {
    return handleRouteError(err);
  }
}
