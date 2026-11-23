import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import type { ProductUnit, ProductWeightOption } from '@/types';
import { requireAdmin } from '@/server/guard';
import { getDb, saveDb, StoredProduct } from '@/server/db';
import { slugifySafe } from '@/server/business-rules';
import { apiError, apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

const VALID_UNITS: ReadonlySet<ProductUnit> = new Set<ProductUnit>(['piece', 'kg', 'half_kg', 'box']);

export async function GET(req: NextRequest) {
  try {
    const proxied = await proxyToUpstreamIfConfigured(req, '/api/v1/admin/products');
    if (proxied) return proxied;

    const auth = requireAdmin(req);
    if (!auth.ok) return auth.response;

    const db = getDb();
    const list = db.products
      .filter((p) => !p.isArchived)
      .map(({ isArchived: _archived, ...pub }) => pub);

    return apiOk(list);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const proxied = await proxyToUpstreamIfConfigured(req, '/api/v1/admin/products');
    if (proxied) return proxied;

    const auth = requireAdmin(req, { managerOnly: true });
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return apiError('VALIDATION_ERROR', 'بيانات المنتج غير صالحة', 400);
    }

    const name = String(body.name ?? '').trim();
    const description = String(body.description ?? '').trim();
    const categoryId = String(body.categoryId ?? body.category_id ?? '').trim();
    const price = Number(body.price);
    const rawSalePrice = body.salePrice ?? body.sale_price;
    const salePrice =
      rawSalePrice !== undefined && rawSalePrice !== null && rawSalePrice !== ''
        ? Number(rawSalePrice)
        : undefined;
    const unit = (String(body.unit ?? 'kg') as ProductUnit);
    const imageUrl = String(body.imageUrl ?? body.image_url ?? '/images/catalog/hero-assortment.jpg').trim();

    if (name.length < 2) {
      return apiError('VALIDATION_ERROR', 'اسم المنتج مطلوب (حرفان على الأقل)', 400);
    }
    if (!Number.isFinite(price) || price <= 0) {
      return apiError('VALIDATION_ERROR', 'يجب أن يكون سعر المنتج أكبر من صفر', 400);
    }
    if (salePrice !== undefined && (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= price)) {
      return apiError('VALIDATION_ERROR', 'يجب أن يكون سعر الخصم أقل من السعر الأساسي وأكبر من صفر', 400);
    }
    if (!VALID_UNITS.has(unit)) {
      return apiError('VALIDATION_ERROR', 'وحدة البيع غير صالحة', 400);
    }

    const db = getDb();
    if (!db.categories.some((c) => c.id === categoryId)) {
      return apiError('VALIDATION_ERROR', 'التصنيف المحدد غير موجود', 400);
    }

    const slug = slugifySafe(String(body.slug ?? body.nameEn ?? name), 'sweet');
    if (db.products.some((p) => !p.isArchived && p.slug.toLowerCase() === slug.toLowerCase())) {
      return apiError('SLUG_CONFLICT', 'الرابط المختصر (Slug) مستخدم بالفعل لمنتج آخر', 409);
    }

    const rawWeights = Array.isArray(body.availableWeights) ? body.availableWeights : undefined;
    const availableWeights: ProductWeightOption[] | undefined = rawWeights
      ? rawWeights.map((w: Record<string, unknown>) => ({
          label: String(w.label ?? ''),
          multiplier: Number(w.multiplier ?? 1),
          price: Number(w.price ?? price),
          ...(w.salePrice ? { salePrice: Number(w.salePrice) } : {}),
        }))
      : undefined;

    const nowIso = new Date().toISOString();
    const gallery = Array.isArray(body.galleryImages) && body.galleryImages.length > 0
      ? body.galleryImages.map((g: unknown) => String(g))
      : [imageUrl];

    const newProduct: StoredProduct = {
      id: `prod-${crypto.randomUUID().slice(0, 10)}`,
      slug,
      name,
      nameEn: body.nameEn ? String(body.nameEn).trim() : undefined,
      description,
      categoryId,
      price,
      salePrice,
      unit,
      imageUrl,
      galleryImages: gallery,
      isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : true,
      isFeatured: Boolean(body.isFeatured),
      availableWeights,
      createdAt: nowIso,
      updatedAt: nowIso,
      isArchived: false,
    };

    db.products.unshift(newProduct);
    saveDb(db);

    const { isArchived: _archived, ...pub } = newProduct;
    return apiOk(pub, null, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
