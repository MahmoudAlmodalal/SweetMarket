import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { getDb } from '@/server/db';
import { apiError, apiOk, handleRouteError } from '@/server/http';

export const dynamic = 'force-dynamic';

/**
 * Scoped receipt lookup for the guest who just placed an order (orderNumber + trackingToken).
 * Prevents exposing unrelated orders on the confirmation or customer history page.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = (searchParams.get('orderNumber') || '').trim().toUpperCase();
    const token = (searchParams.get('token') || '').trim();

    if (!orderNumber || !token) {
      return apiError('VALIDATION_ERROR', 'بيانات التحقق من الطلب غير مكتملة', 400);
    }

    const db = getDb();
    const order = db.orders.find((o) => o.orderNumber.toUpperCase() === orderNumber);
    if (!order || !order.trackingToken) {
      return apiError('ORDER_NOT_FOUND', 'تعذّر العثور على إيصال الطلب المطلوب', 404);
    }

    const a = Buffer.from(order.trackingToken);
    const b = Buffer.from(token);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return apiError('ORDER_NOT_FOUND', 'تعذّر التحقق من صلاحية إيصال الطلب', 404);
    }

    const zone = db.zones.find((z) => z.id === order.customer.zoneId);
    return apiOk({
      ...order,
      estimatedDeliveryTime: zone
        ? `${zone.estimatedTimeMin}-${zone.estimatedTimeMax} دقيقة`
        : '45-60 دقيقة',
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
