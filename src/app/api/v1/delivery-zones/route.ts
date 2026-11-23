import { NextRequest } from 'next/server';
import { getDb } from '@/server/db';
import { apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const proxied = await proxyToUpstreamIfConfigured(req, '/api/v1/delivery-zones');
    if (proxied) return proxied;

    const db = getDb();
    const activeZones = db.zones.filter((z) => z.isActive);
    return apiOk(activeZones);
  } catch (err) {
    return handleRouteError(err);
  }
}
