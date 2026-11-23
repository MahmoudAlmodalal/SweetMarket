import { NextRequest } from 'next/server';
import type { OrderStatus } from '@/types';
import { requireAdmin } from '@/server/guard';
import { getDb, saveDb } from '@/server/db';
import { validateOrderStatusTransition } from '@/server/business-rules';
import { apiError, apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

const STATUS_DEFAULT_NOTES: Record<OrderStatus, string> = {
  new: 'تم تسجيل الطلب كجديد',
  accepted: 'تم قبول الطلب وتأكيد توفر الأصناف',
  in_preparation: 'جاري تجهيز وتغليف الطلب في المطبخ',
  out_for_delivery: 'الطلب خرج مع المندوب وفي طريقه إليك',
  delivered: 'تم تسليم الطلب للعميل وتحصيل المبلغ بنجاح',
  undelivered: 'تعذّر تسليم الطلب في الوقت المحدد',
  cancelled: 'تم إلغاء الطلب',
};

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = decodeURIComponent(context.params.id);
    const proxied = await proxyToUpstreamIfConfigured(
      req,
      `/api/v1/admin/orders/${encodeURIComponent(id)}/status`
    );
    if (proxied) return proxied;

    const auth = requireAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return apiError('VALIDATION_ERROR', 'بيانات تحديث الحالة غير صالحة', 400);
    }

    const nextStatus = String(body.status ?? '') as OrderStatus;
    const reason = body.reason ? String(body.reason).trim() : undefined;
    const note = body.note ? String(body.note).trim() : undefined;

    const db = getDb();
    const order = db.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) {
      return apiError('ORDER_NOT_FOUND', 'الطلب المطلوب غير موجود', 404);
    }

    validateOrderStatusTransition(order.status, nextStatus, auth.user.role, reason);

    const nowIso = new Date().toISOString();
    order.status = nextStatus;
    order.updatedAt = nowIso;

    if (nextStatus === 'cancelled' || nextStatus === 'undelivered') {
      order.cancelReason = reason;
    }

    order.timeline.push({
      status: nextStatus,
      timestamp: nowIso,
      note: reason || note || STATUS_DEFAULT_NOTES[nextStatus],
      performedBy: {
        id: auth.user.id,
        name: auth.user.fullName,
        role: auth.user.role,
      },
    });

    saveDb(db);
    return apiOk(order);
  } catch (err) {
    return handleRouteError(err);
  }
}
