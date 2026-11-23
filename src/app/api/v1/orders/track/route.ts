import { NextRequest } from 'next/server';
import { getDb } from '@/server/db';
import { normalizePhoneNumber } from '@/server/business-rules';
import {
  apiError,
  apiOk,
  checkTrackingRateLimit,
  clearTrackingRateLimit,
  getClientIp,
  handleRouteError,
  proxyToUpstreamIfConfigured,
  recordFailedTrackingAttempt,
} from '@/server/http';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const proxied = await proxyToUpstreamIfConfigured(req, '/api/v1/orders/track');
    if (proxied) return proxied;

    const ip = getClientIp(req);
    const rate = checkTrackingRateLimit(ip);
    if (!rate.allowed) {
      return apiError(
        'RATE_LIMITED',
        `تم تجاوز الحد المسموح من المحاولات، يرجى المحاولة بعد ${Math.ceil(rate.retryAfterSeconds / 60)} دقيقة`,
        429
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return apiError('VALIDATION_ERROR', 'يرجى إدخال رقم الطلب ورقم الهاتف', 400);
    }

    const orderNumber = String(body.orderNumber ?? body.order_number ?? '')
      .trim()
      .toUpperCase();
    const rawPhone = String(body.phone ?? '').trim();

    if (!orderNumber) {
      return apiError('VALIDATION_ERROR', 'يرجى إدخال رقم الطلب', 400, [
        { field: 'orderNumber', message: 'رقم الطلب مطلوب' },
      ]);
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhoneNumber(rawPhone);
    } catch {
      const attempt = recordFailedTrackingAttempt(ip);
      if (attempt.locked) {
        return apiError(
          'RATE_LIMITED',
          'تم تجاوز عدد المحاولات الخاطئة، يرجى الانتظار 15 دقيقة قبل المحاولة مجدداً',
          429
        );
      }
      return apiError(
        'VALIDATION_ERROR',
        'يرجى إدخال رقم هاتف فلسطيني صحيح مكون من 10 أرقام يبدأ بـ 059 أو 056',
        400,
        [{ field: 'phone', message: 'رقم الهاتف غير صالح' }]
      );
    }

    const db = getDb();
    const order = db.orders.find((o) => {
      if (o.orderNumber.toUpperCase() !== orderNumber) return false;
      try {
        return normalizePhoneNumber(o.customer.phone) === normalizedPhone;
      } catch {
        return o.customer.phone.replace(/\D/g, '') === normalizedPhone;
      }
    });

    if (!order) {
      const attempt = recordFailedTrackingAttempt(ip);
      if (attempt.locked) {
        return apiError(
          'RATE_LIMITED',
          'تم تجاوز عدد المحاولات المسموح بها (5 محاولات). يرجى الانتظار 15 دقيقة',
          429
        );
      }
      return apiError(
        'ORDER_NOT_FOUND',
        'لم يتم العثور على طلب يطابق رقم الطلب ورقم الهاتف المدخلين',
        404
      );
    }

    clearTrackingRateLimit(ip);

    // Strip internal trackingToken from public phone-lookup response
    const { trackingToken: _token, ...safeOrder } = order;
    const zone = db.zones.find((z) => z.id === order.customer.zoneId);

    return apiOk({
      ...safeOrder,
      estimatedDeliveryTime: zone
        ? `${zone.estimatedTimeMin}-${zone.estimatedTimeMax} دقيقة`
        : '45-60 دقيقة',
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
