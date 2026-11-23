import { NextRequest } from 'next/server';
import { requireAdmin } from '@/server/guard';
import { getDb, saveDb } from '@/server/db';
import { evaluateZoneDeletion } from '@/server/business-rules';
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
      `/api/v1/admin/delivery-zones/${encodeURIComponent(id)}`
    );
    if (proxied) return proxied;

    const auth = requireAdmin(req, { managerOnly: true });
    if (!auth.ok) return auth.response;

    const db = getDb();
    const idx = db.zones.findIndex((z) => z.id === id);
    if (idx === -1) {
      return apiError('ZONE_NOT_FOUND', 'منطقة التوصيل غير موجودة', 404);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return apiError('VALIDATION_ERROR', 'بيانات التحديث غير صالحة', 400);
    }

    const existing = db.zones[idx];
    const name = body.name !== undefined ? String(body.name).trim() : existing.name;
    const deliveryFee =
      body.deliveryFee !== undefined ? Number(body.deliveryFee) : existing.deliveryFee;
    const minOrderAmount =
      body.minOrderAmount !== undefined ? Number(body.minOrderAmount) : existing.minOrderAmount;
    const estimatedTimeMin =
      body.estimatedTimeMin !== undefined
        ? Number(body.estimatedTimeMin)
        : existing.estimatedTimeMin;
    const estimatedTimeMax =
      body.estimatedTimeMax !== undefined
        ? Number(body.estimatedTimeMax)
        : existing.estimatedTimeMax;

    if (name.length < 2) {
      return apiError('VALIDATION_ERROR', 'اسم المنطقة مطلوب', 400);
    }
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
      return apiError('VALIDATION_ERROR', 'رسوم التوصيل غير صالحة', 400);
    }
    if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
      return apiError('VALIDATION_ERROR', 'الحد الأدنى للطلب غير صالح', 400);
    }
    if (estimatedTimeMin <= 0 || estimatedTimeMax < estimatedTimeMin) {
      return apiError('VALIDATION_ERROR', 'وقت التوصيل المتوقع غير صالح', 400);
    }

    const updated = {
      ...existing,
      name,
      deliveryFee,
      minOrderAmount,
      estimatedTimeMin,
      estimatedTimeMax,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
    };

    db.zones[idx] = updated;
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
      `/api/v1/admin/delivery-zones/${encodeURIComponent(id)}`
    );
    if (proxied) return proxied;

    const auth = requireAdmin(req, { managerOnly: true });
    if (!auth.ok) return auth.response;

    const db = getDb();
    const idx = db.zones.findIndex((z) => z.id === id);
    if (idx === -1) {
      return apiError('ZONE_NOT_FOUND', 'منطقة التوصيل غير موجودة', 404);
    }

    const check = evaluateZoneDeletion(id, db.orders);
    if (!check.allowed) {
      return apiError(
        'ZONE_IN_USE',
        `لا يمكن حذف هذه المنطقة لوجود ${check.activeOrdersCount} طلب نشط مرتبط بها حالياً. يمكنك إيقاف تفعيلها بدلاً من الحذف.`,
        409
      );
    }

    db.zones.splice(idx, 1);
    saveDb(db);
    return apiOk({ id, deleted: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
