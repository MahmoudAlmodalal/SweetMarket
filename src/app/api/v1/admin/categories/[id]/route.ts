import { NextRequest } from 'next/server';
import { requireAdmin } from '@/server/guard';
import { getDb, saveDb } from '@/server/db';
import { slugifySafe } from '@/server/business-rules';
import { apiError, apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = decodeURIComponent(context.params.id);
    const proxied = await proxyToUpstreamIfConfigured(
      req,
      `/api/v1/admin/categories/${encodeURIComponent(id)}`
    );
    if (proxied) return proxied;

    const auth = requireAdmin(req, { managerOnly: true });
    if (!auth.ok) return auth.response;

    const db = getDb();
    const idx = db.categories.findIndex((c) => c.id === id);
    if (idx === -1) {
      return apiError('CATEGORY_NOT_FOUND', 'التصنيف غير موجود', 404);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return apiError('VALIDATION_ERROR', 'بيانات التحديث غير صالحة', 400);
    }

    const existing = db.categories[idx];
    const name = body.name !== undefined ? String(body.name).trim() : existing.name;
    if (name.length < 2) {
      return apiError('VALIDATION_ERROR', 'اسم التصنيف مطلوب (حرفان على الأقل)', 400);
    }

    const slug = body.slug !== undefined ? slugifySafe(String(body.slug), 'category') : existing.slug;
    if (
      db.categories.some(
        (c) => c.id !== existing.id && c.slug.toLowerCase() === slug.toLowerCase()
      )
    ) {
      return apiError('SLUG_CONFLICT', 'الرابط المختصر مستخدم لتصنيف آخر', 409);
    }

    const updated = {
      ...existing,
      name,
      slug,
      description: body.description !== undefined ? String(body.description).trim() : existing.description,
      imageUrl: body.imageUrl !== undefined ? String(body.imageUrl).trim() : existing.imageUrl,
      displayOrder:
        body.displayOrder !== undefined && Number.isFinite(Number(body.displayOrder))
          ? Number(body.displayOrder)
          : existing.displayOrder,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
    };

    db.categories[idx] = updated;
    saveDb(db);
    return apiOk(updated);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = decodeURIComponent(context.params.id);
    const proxied = await proxyToUpstreamIfConfigured(
      req,
      `/api/v1/admin/categories/${encodeURIComponent(id)}`
    );
    if (proxied) return proxied;

    const auth = requireAdmin(req, { managerOnly: true });
    if (!auth.ok) return auth.response;

    const db = getDb();
    const idx = db.categories.findIndex((c) => c.id === id);
    if (idx === -1) {
      return apiError('CATEGORY_NOT_FOUND', 'التصنيف غير موجود', 404);
    }

    const linkedProducts = db.products.filter((p) => !p.isArchived && p.categoryId === id);
    if (linkedProducts.length > 0) {
      return apiError(
        'CATEGORY_HAS_PRODUCTS',
        `لا يمكن حذف هذا التصنيف لارتباطه بـ ${linkedProducts.length} منتج نشط. انقل المنتجات أولاً أو قم بتعطيل التصنيف.`,
        409
      );
    }

    db.categories.splice(idx, 1);
    saveDb(db);
    return apiOk({ id, deleted: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
