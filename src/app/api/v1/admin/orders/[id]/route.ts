import { NextRequest } from 'next/server';
import { requireAdmin } from '@/server/guard';
import { getDb } from '@/server/db';
import { apiError, apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = decodeURIComponent(context.params.id);
    const proxied = await proxyToUpstreamIfConfigured(
      req,
      `/api/v1/admin/orders/${encodeURIComponent(id)}`
    );
    if (proxied) return proxied;

    const auth = requireAdmin(req);
    if (!auth.ok) return auth.response;

    const db = getDb();
    const order = db.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) {
      return apiError('ORDER_NOT_FOUND', 'الطلب المطلوب غير موجود', 404);
    }

    return apiOk(order);
  } catch (err) {
    return handleRouteError(err);
  }
}
