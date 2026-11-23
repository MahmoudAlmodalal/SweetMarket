import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import type { Category } from '@/types';
import { requireAdmin } from '@/server/guard';
import { getDb, saveDb } from '@/server/db';
import { slugifySafe } from '@/server/business-rules';
import { apiError, apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const proxied = await proxyToUpstreamIfConfigured(req, '/api/v1/admin/categories');
    if (proxied) return proxied;

    const auth = requireAdmin(req);
    if (!auth.ok) return auth.response;

    const db = getDb();
    const sorted = [...db.categories].sort((a, b) => a.displayOrder - b.displayOrder);
    return apiOk(sorted);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const proxied = await proxyToUpstreamIfConfigured(req, '/api/v1/admin/categories');
    if (proxied) return proxied;

    const auth = requireAdmin(req, { managerOnly: true });
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return apiError('VALIDATION_ERROR', 'بيانات التصنيف غير صالحة', 400);
    }

    const name = String(body.name ?? '').trim();
    if (name.length < 2) {
      return apiError('VALIDATION_ERROR', 'اسم التصنيف مطلوب (حرفان على الأقل)', 400);
    }

    const db = getDb();
    const slug = slugifySafe(String(body.slug ?? name), 'category');
    if (db.categories.some((c) => c.slug.toLowerCase() === slug.toLowerCase())) {
      return apiError('SLUG_CONFLICT', 'الرابط المختصر للتصنيف مستخدم بالفعل', 409);
    }

    const maxOrder = db.categories.reduce((acc, c) => Math.max(acc, c.displayOrder), 0);
    const created: Category = {
      id: `cat-${crypto.randomUUID().slice(0, 8)}`,
      name,
      slug,
      description: String(body.description ?? '').trim(),
      imageUrl: String(body.imageUrl ?? '/images/catalog/hero-assortment.jpg').trim(),
      displayOrder:
        body.displayOrder !== undefined && Number.isFinite(Number(body.displayOrder))
          ? Number(body.displayOrder)
          : maxOrder + 1,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    };

    db.categories.push(created);
    saveDb(db);
    return apiOk(created, null, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
