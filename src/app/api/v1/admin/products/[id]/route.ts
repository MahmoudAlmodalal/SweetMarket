import { NextRequest } from 'next/server';
import type { ProductUnit, ProductWeightOption } from '@/types';
import { requireAdmin } from '@/server/guard';
import { getDb, saveDb } from '@/server/db';
import { evaluateProductDeletion, slugifySafe } from '@/server/business-rules';
import { apiError, apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

const VALID_UNITS: ReadonlySet<ProductUnit> = new Set<ProductUnit>(['piece', 'kg', 'half_kg', 'box']);

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = decodeURIComponent(context.params.id);
    const proxied = await proxyToUpstreamIfConfigured(
      req,
      `/api/v1/admin/products/${encodeURIComponent(id)}`
    );
    if (proxied) return proxied;

    const auth = requireAdmin(req);
    if (!auth.ok) return auth.response;

    const db = getDb();
    const product = db.products.find((p) => !p.isArchived && (p.id === id || p.slug === id));
    if (!product) {
      return apiError('PRODUCT_NOT_FOUND', 'المنتج غير موجود', 404);
    }

    const { isArchived: _archived, ...pub } = product;
    return apiOk(pub);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = decodeURIComponent(context.params.id);
    const proxied = await proxyToUpstreamIfConfigured(
      req,
      `/api/v1/admin/products/${encodeURIComponent(id)}`
    );
    if (proxied) return proxied;

    const auth = requireAdmin(req, { managerOnly: true });
    if (!auth.ok) return auth.response;

    const db = getDb();
    const idx = db.products.findIndex((p) => !p.isArchived && p.id === id);
    if (idx === -1) {
      return apiError('PRODUCT_NOT_FOUND', 'المنتج غير موجود', 404);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return apiError('VALIDATION_ERROR', 'بيانات التحديث غير صالحة', 400);
    }

    const existing = db.products[idx];
    const name = body.name !== undefined ? String(body.name).trim() : existing.name;
    const price = body.price !== undefined ? Number(body.price) : existing.price;
    const rawSale = body.salePrice !== undefined ? body.salePrice : existing.salePrice;
    const salePrice =
      rawSale !== undefined && rawSale !== null && rawSale !== ''
        ? Number(rawSale)
        : undefined;
    const unit = (body.unit !== undefined ? String(body.unit) : existing.unit) as ProductUnit;
    const categoryId = body.categoryId !== undefined ? String(body.categoryId) : existing.categoryId;

    if (name.length < 2) {
      return apiError('VALIDATION_ERROR', 'اسم المنتج مطلوب (حرفان على الأقل)', 400);
    }
    if (!Number.isFinite(price) || price <= 0) {
      return apiError('VALIDATION_ERROR', 'يجب أن يكون سعر المنتج أكبر من صفر', 400);
    }
    if (salePrice !== undefined && (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= price)) {
      return apiError('VALIDATION_ERROR', 'سعر الخصم يجب أن يكون أقل من السعر الأساسي وأكبر من صفر', 400);
    }
    if (!VALID_UNITS.has(unit)) {
      return apiError('VALIDATION_ERROR', 'وحدة البيع غير صالحة', 400);
    }
    if (!db.categories.some((c) => c.id === categoryId)) {
      return apiError('VALIDATION_ERROR', 'التصنيف المحدد غير موجود', 400);
    }

    const slug = body.slug !== undefined ? slugifySafe(String(body.slug), 'sweet') : existing.slug;
    if (
      db.products.some(
        (p) => !p.isArchived && p.id !== existing.id && p.slug.toLowerCase() === slug.toLowerCase()
      )
    ) {
      return apiError('SLUG_CONFLICT', 'الرابط المختصر مستخدم بالفعل لمنتج آخر', 409);
    }

    const imageUrl = body.imageUrl !== undefined ? String(body.imageUrl).trim() : existing.imageUrl;
    const galleryImages = Array.isArray(body.galleryImages)
      ? body.galleryImages.map((g: unknown) => String(g))
      : existing.galleryImages && existing.galleryImages.length > 0
      ? [imageUrl, ...existing.galleryImages.filter((g) => g !== existing.imageUrl && g !== imageUrl)]
      : [imageUrl];

    const availableWeights: ProductWeightOption[] | undefined = Array.isArray(body.availableWeights)
      ? body.availableWeights.map((w: Record<string, unknown>) => ({
          label: String(w.label ?? ''),
          multiplier: Number(w.multiplier ?? 1),
          price: Number(w.price ?? price),
          ...(w.salePrice ? { salePrice: Number(w.salePrice) } : {}),
        }))
      : existing.availableWeights;

    const updated = {
      ...existing,
      name,
      nameEn: body.nameEn !== undefined ? String(body.nameEn).trim() || undefined : existing.nameEn,
      slug,
      description: body.description !== undefined ? String(body.description).trim() : existing.description,
      categoryId,
      price,
      salePrice,
      unit,
      imageUrl,
      galleryImages,
      isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : existing.isAvailable,
      isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : existing.isFeatured,
      availableWeights,
      updatedAt: new Date().toISOString(),
    };

    db.products[idx] = updated;
    saveDb(db);

    const { isArchived: _archived, ...pub } = updated;
    return apiOk(pub);
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
      `/api/v1/admin/products/${encodeURIComponent(id)}`
    );
    if (proxied) return proxied;

    const auth = requireAdmin(req, { managerOnly: true });
    if (!auth.ok) return auth.response;

    const db = getDb();
    const idx = db.products.findIndex((p) => !p.isArchived && p.id === id);
    if (idx === -1) {
      return apiError('PRODUCT_NOT_FOUND', 'المنتج غير موجود', 404);
    }

    const decision = evaluateProductDeletion(id, db.orders);
    if (decision.mode === 'archive') {
      db.products[idx].isArchived = true;
      db.products[idx].isAvailable = false;
      db.products[idx].updatedAt = new Date().toISOString();
      saveDb(db);
      return apiOk({
        id,
        mode: 'archived',
        referencedOrdersCount: decision.referencedOrdersCount,
        message: 'تمت أرشفة المنتج للحفاظ على سلامة سجل الطلبات السابقة',
      });
    }

    db.products.splice(idx, 1);
    saveDb(db);
    return apiOk({
      id,
      mode: 'deleted',
      referencedOrdersCount: 0,
      message: 'تم حذف المنتج نهائياً',
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
