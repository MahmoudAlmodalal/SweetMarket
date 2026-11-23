import { NextRequest } from 'next/server';
import { requireAdmin } from '@/server/guard';
import { getDb, saveDb } from '@/server/db';
import { apiError, apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = decodeURIComponent(context.params.id);
    const proxied = await proxyToUpstreamIfConfigured(
      req,
      `/api/v1/admin/products/${encodeURIComponent(id)}/availability`
    );
    if (proxied) return proxied;

    const auth = requireAdmin(req);
    if (!auth.ok) return auth.response;

    const db = getDb();
    const product = db.products.find((p) => !p.isArchived && p.id === id);
    if (!product) {
      return apiError('PRODUCT_NOT_FOUND', 'المنتج غير موجود', 404);
    }

    const body = await req.json().catch(() => ({}));
    const nextValue =
      typeof body?.isAvailable === 'boolean'
        ? body.isAvailable
        : typeof body?.is_available === 'boolean'
        ? body.is_available
        : !product.isAvailable;

    product.isAvailable = nextValue;
    product.updatedAt = new Date().toISOString();
    saveDb(db);

    const { isArchived: _archived, ...pub } = product;
    return apiOk(pub);
  } catch (err) {
    return handleRouteError(err);
  }
}
