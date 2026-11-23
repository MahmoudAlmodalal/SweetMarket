import { NextRequest } from 'next/server';
import { getDb } from '@/server/db';
import { apiError, apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: { slugOrId: string } }
) {
  try {
    const slugOrId = decodeURIComponent(context.params.slugOrId);
    const proxied = await proxyToUpstreamIfConfigured(
      req,
      `/api/v1/products/${encodeURIComponent(slugOrId)}`
    );
    if (proxied) return proxied;

    const db = getDb();
    const product = db.products.find(
      (p) => !p.isArchived && (p.slug === slugOrId || p.id === slugOrId)
    );

    if (!product) {
      return apiError('PRODUCT_NOT_FOUND', 'المنتج المطلوب غير موجود أو لم يعد متاحاً', 404);
    }

    const { isArchived: _archived, ...pub } = product;
    return apiOk(pub);
  } catch (err) {
    return handleRouteError(err);
  }
}
