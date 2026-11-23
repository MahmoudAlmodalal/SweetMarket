import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import type { DeliveryZone } from '@/types';
import { requireAdmin } from '@/server/guard';
import { getDb, saveDb } from '@/server/db';
import { apiError, apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const proxied = await proxyToUpstreamIfConfigured(req, '/api/v1/admin/delivery-zones');
    if (proxied) return proxied;

    const auth = requireAdmin(req);
    if (!auth.ok) return auth.response;

    const db = getDb();
    return apiOk(db.zones);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const proxied = await proxyToUpstreamIfConfigured(req, '/api/v1/admin/delivery-zones');
    if (proxied) return proxied;

    const auth = requireAdmin(req, { managerOnly: true });
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return apiError('VALIDATION_ERROR', 'بيانات منطقة التوصيل غير صالحة', 400);
    }

    const name = String(body.name ?? '').trim();
    const deliveryFee = Number(body.deliveryFee ?? body.delivery_fee ?? 0);
    const minOrderAmount = Number(body.minOrderAmount ?? body.min_order_amount ?? 0);
    const estimatedTimeMin = Number(body.estimatedTimeMin ?? body.estimated_time_min ?? 30);
    const estimatedTimeMax = Number(body.estimatedTimeMax ?? body.estimated_time_max ?? 60);

    if (name.length < 2) {
      return apiError('VALIDATION_ERROR', 'اسم المنطقة مطلوب', 400);
    }
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
      return apiError('VALIDATION_ERROR', 'رسوم التوصيل يجب أن تكون صفراً أو أكبر', 400);
    }
    if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
      return apiError('VALIDATION_ERROR', 'الحد الأدنى للطلب يجب أن يكون صفراً أو أكبر', 400);
    }
    if (estimatedTimeMin <= 0 || estimatedTimeMax < estimatedTimeMin) {
      return apiError('VALIDATION_ERROR', 'نطاق وقت التوصيل المتوقع غير منطقي', 400);
    }

    const db = getDb();
    const created: DeliveryZone = {
      id: `zone-${crypto.randomUUID().slice(0, 8)}`,
      name,
      deliveryFee,
      minOrderAmount,
      estimatedTimeMin,
      estimatedTimeMax,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    };

    db.zones.push(created);
    saveDb(db);
    return apiOk(created, null, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
