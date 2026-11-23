import { NextRequest } from 'next/server';
import { requireAdmin } from '@/server/guard';
import { getDb } from '@/server/db';
import { apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const proxied = await proxyToUpstreamIfConfigured(req, '/api/v1/admin/orders');
    if (proxied) return proxied;

    const auth = requireAdmin(req);
    if (!auth.ok) return auth.response;

    const db = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status')?.trim();
    const zoneId = searchParams.get('zoneId')?.trim() || searchParams.get('zone_id')?.trim();
    const search = searchParams.get('search')?.trim().toLowerCase();

    let orders = [...db.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (status && status !== 'all') {
      orders = orders.filter((o) => o.status === status);
    }

    if (zoneId && zoneId !== 'all') {
      orders = orders.filter((o) => o.customer.zoneId === zoneId);
    }

    if (search) {
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(search) ||
          o.customer.fullName.toLowerCase().includes(search) ||
          o.customer.phone.includes(search)
      );
    }

    return apiOk(orders, {
      page: 1,
      limit: orders.length || 20,
      total: orders.length,
      totalItems: orders.length,
      totalPages: 1,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
