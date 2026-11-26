import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import type { Order, OrderStatus } from '@/types';
import { signSessionToken } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { POST as createOrder } from '../../../../orders/route';
import { POST as trackOrder } from '../../../../orders/track/route';
import { GET as getAdminOrder } from '../route';
import { PATCH as updateStatus } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-status-flow-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

const PHONE = '0597747084';

function staffToken(): string {
  const staff = getDb().users.find((u) => u.role === 'staff' && u.isActive);
  assert.ok(staff);
  return signSessionToken(staff);
}

function managerToken(): string {
  const manager = getDb().users.find((u) => u.role === 'manager' && u.isActive);
  assert.ok(manager);
  return signSessionToken(manager);
}

function post(url: string, body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function patchStatus(
  id: string,
  body: unknown,
  token: string
): [NextRequest, { params: { id: string } }] {
  const req = new NextRequest(`http://localhost:3000/api/v1/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return [req, { params: { id } }];
}

function getAdmin(id: string, token: string): [NextRequest, { params: { id: string } }] {
  const req = new NextRequest(`http://localhost:3000/api/v1/admin/orders/${id}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return [req, { params: { id } }];
}

/** Creates a fresh order through the public checkout route and returns it. */
async function checkoutNewOrder(): Promise<Order> {
  const product = getDb().products.find(
    (p) => p.isAvailable && !p.isArchived && p.availableWeights && p.availableWeights.length > 0
  );
  assert.ok(product, 'seed must contain a product with weight options');
  const res = await createOrder(
    post('http://localhost:3000/api/v1/orders', {
      customer: {
        fullName: 'اختبار انتقالات الحالة',
        phone: PHONE,
        zoneId: 'zone-gaza',
        streetAddress: 'شارع رئيسي، عمارة ٥',
      },
      items: [{ productId: product.id, quantity: 1 }],
    })
  );
  assert.equal(res.status, 201);
  return (await res.json()).data as Order;
}

/** Customer-facing view of an order through the public track route. */
async function trackView(orderNumber: string): Promise<Order> {
  const res = await trackOrder(
    post('http://localhost:3000/api/v1/orders/track', { orderNumber, phone: PHONE })
  );
  assert.equal(res.status, 200);
  return (await res.json()).data as Order;
}

/** Applies one admin status transition and asserts the expected HTTP status. */
async function transition(
  orderId: string,
  nextStatus: OrderStatus | string,
  token: string,
  expectedHttp: number,
  extra: Record<string, unknown> = {}
): Promise<Order | null> {
  const [req, ctx] = patchStatus(orderId, { status: nextStatus, ...extra }, token);
  const res = await updateStatus(req, ctx);
  assert.equal(res.status, expectedHttp, `transition to ${String(nextStatus)}`);
  if (expectedHttp !== 200) return null;
  return (await res.json()).data as Order;
}

describe('admin order-status transitions across routes', () => {
  beforeEach(() => {
    resetDb();
  });

  it('walks the full lifecycle new -> accepted -> in_preparation -> out_for_delivery -> delivered, visible to admin and customer', async () => {
    const order = await checkoutNewOrder();
    assert.equal(order.status, 'new');
    assert.equal(order.timeline.length, 1);
    const trackingToken = order.trackingToken;
    assert.ok(trackingToken, 'tracking token issued');

    const staff = staffToken();
    const steps: OrderStatus[] = ['accepted', 'in_preparation', 'out_for_delivery', 'delivered'];
    for (const step of steps) {
      const updated = await transition(order.id, step, staff, 200);
      assert.ok(updated);
      assert.equal(updated.status, step);
      const last = updated.timeline[updated.timeline.length - 1];
      assert.equal(last.status, step);
      assert.equal(last.performedBy?.role, 'staff');

      // Admin detail route and the public track route agree with the PATCH response.
      const [getReq, getCtx] = getAdmin(order.id, staff);
      const adminGet = await getAdminOrder(getReq, getCtx);
      assert.equal(adminGet.status, 200);
      assert.equal((await adminGet.json()).data.status, step);

      const customerView = await trackView(order.orderNumber);
      assert.equal(customerView.status, step, `customer track shows ${step}`);
      assert.equal(customerView.timeline.length, updated.timeline.length);
      assert.equal(
        JSON.stringify(customerView).includes(trackingToken),
        false,
        'tracking token never leaks to the customer payload'
      );
    }

    // Persisted state matches the last response.
    const stored = getDb().orders.find((o) => o.id === order.id);
    assert.equal(stored?.status, 'delivered');
    assert.equal(stored?.timeline.length, 1 + steps.length);
  });

  it('rejects skipped and unknown transitions without touching status or timeline', async () => {
    const order = await checkoutNewOrder();
    const staff = staffToken();

    // new -> in_preparation skips acceptance: rejected.
    await transition(order.id, 'in_preparation', staff, 400);
    // new -> out_for_delivery skips two stages: rejected.
    await transition(order.id, 'out_for_delivery', staff, 400);
    // Unknown status string: rejected as a validation error.
    const [badReq, badCtx] = patchStatus(order.id, { status: 'on_hold' }, staff);
    const badRes = await updateStatus(badReq, badCtx);
    assert.equal(badRes.status, 400);
    assert.equal((await badRes.json()).error.code, 'VALIDATION_ERROR');

    // Nothing changed anywhere the order is readable.
    const stored = getDb().orders.find((o) => o.id === order.id);
    assert.equal(stored?.status, 'new');
    assert.equal(stored?.timeline.length, 1);
    const customerView = await trackView(order.orderNumber);
    assert.equal(customerView.status, 'new');
    assert.equal(customerView.timeline.length, 1);
  });

  it('keeps cancelled and undelivered manager-only across the lifecycle', async () => {
    const order = await checkoutNewOrder();
    const staff = staffToken();

    // Staff cannot cancel a new order, even with a valid reason.
    await transition(order.id, 'cancelled', staff, 403, { reason: 'العميل طلب الإلغاء' });

    // Walk to out_for_delivery, then staff cannot record undelivered either.
    await transition(order.id, 'accepted', staff, 200);
    await transition(order.id, 'in_preparation', staff, 200);
    await transition(order.id, 'out_for_delivery', staff, 200);
    await transition(order.id, 'undelivered', staff, 403, { reason: 'العميل لم يرد على الهاتف' });

    const stored = getDb().orders.find((o) => o.id === order.id);
    assert.equal(stored?.status, 'out_for_delivery');
    assert.equal(stored?.timeline.length, 4);
  });

  it('supports the undelivered recovery flow: out_for_delivery -> undelivered -> out_for_delivery -> delivered', async () => {
    const order = await checkoutNewOrder();
    const staff = staffToken();
    const manager = managerToken();

    await transition(order.id, 'accepted', staff, 200);
    await transition(order.id, 'in_preparation', staff, 200);
    await transition(order.id, 'out_for_delivery', staff, 200);

    // Manager records the failed delivery with a reason; it is stored on the order.
    const undelivered = await transition(order.id, 'undelivered', manager, 200, {
      reason: 'العميل لم يرد على الهاتف',
    });
    assert.ok(undelivered);
    assert.equal(undelivered.cancelReason, 'العميل لم يرد على الهاتف');
    assert.equal(
      undelivered.timeline[undelivered.timeline.length - 1].performedBy?.role,
      'manager'
    );
    assert.equal((await trackView(order.orderNumber)).status, 'undelivered');

    // Re-dispatch and complete the delivery.
    await transition(order.id, 'out_for_delivery', staff, 200);
    await transition(order.id, 'delivered', staff, 200);

    const stored = getDb().orders.find((o) => o.id === order.id);
    assert.equal(stored?.status, 'delivered');
    assert.equal(stored?.cancelReason, 'العميل لم يرد على الهاتف', 'cancel reason survives re-dispatch');
  });

  it('honours the manager emergency cancel from in_preparation and requires a reason', async () => {
    const order = await checkoutNewOrder();
    const staff = staffToken();
    const manager = managerToken();

    await transition(order.id, 'accepted', staff, 200);
    await transition(order.id, 'in_preparation', staff, 200);

    // Not in ALLOWED_STATUS_TRANSITIONS, but the manager override permits it with a reason.
    const cancelled = await transition(order.id, 'cancelled', manager, 200, {
      reason: 'نفد صنف أساسي من المخزون',
    });
    assert.ok(cancelled);
    assert.equal(cancelled.status, 'cancelled');
    assert.equal(cancelled.cancelReason, 'نفد صنف أساسي من المخزون');
    assert.equal((await trackView(order.orderNumber)).status, 'cancelled');
  });

  it('treats delivered and cancelled as terminal for every actor', async () => {
    const deliveredOrder = await checkoutNewOrder();
    const staff = staffToken();
    const manager = managerToken();
    await transition(deliveredOrder.id, 'accepted', staff, 200);
    await transition(deliveredOrder.id, 'in_preparation', staff, 200);
    await transition(deliveredOrder.id, 'out_for_delivery', staff, 200);
    await transition(deliveredOrder.id, 'delivered', staff, 200);
    const deliveredTimeline = getDb().orders.find((o) => o.id === deliveredOrder.id)?.timeline.length;

    // Even a manager cannot reopen a delivered order.
    await transition(deliveredOrder.id, 'out_for_delivery', manager, 400);
    await transition(deliveredOrder.id, 'cancelled', manager, 400, { reason: 'محاولة إلغاء بعد التسليم' });
    assert.equal(getDb().orders.find((o) => o.id === deliveredOrder.id)?.status, 'delivered');
    assert.equal(
      getDb().orders.find((o) => o.id === deliveredOrder.id)?.timeline.length,
      deliveredTimeline
    );

    // A cancelled order cannot be reopened either.
    const cancelledOrder = await checkoutNewOrder();
    await transition(cancelledOrder.id, 'cancelled', manager, 200, { reason: 'العميل طلب الإلغاء' });
    await transition(cancelledOrder.id, 'accepted', manager, 400);
    assert.equal(getDb().orders.find((o) => o.id === cancelledOrder.id)?.status, 'cancelled');
  });

  it('rejects duplicate and replayed transition requests without duplicating timeline entries', async () => {
    const order = await checkoutNewOrder();
    const staff = staffToken();

    // Double-submit of the same transition: first wins, replay is refused by the state machine.
    const first = await transition(order.id, 'accepted', staff, 200, { note: 'تأكيد المخزون' });
    assert.ok(first);
    const replay = await transition(order.id, 'accepted', staff, 400, { note: 'تأكيد المخزون' });
    assert.equal(replay, null);

    const stored = getDb().orders.find((o) => o.id === order.id);
    assert.equal(stored?.status, 'accepted');
    assert.equal(
      stored?.timeline.filter((e) => e.status === 'accepted').length,
      1,
      'replayed request must not append a second timeline entry'
    );
    // The customer sees exactly one acceptance as well.
    const customerView = await trackView(order.orderNumber);
    assert.equal(customerView.timeline.filter((e) => e.status === 'accepted').length, 1);

    // Replaying an older stage after progress is equally refused (accepted is not reachable again).
    await transition(order.id, 'in_preparation', staff, 200);
    await transition(order.id, 'accepted', staff, 400);
    assert.equal(getDb().orders.find((o) => o.id === order.id)?.status, 'in_preparation');

    // Replaying a cancel against an already-cancelled order hits the terminal-state guard.
    const cancelOrder = await checkoutNewOrder();
    const manager = managerToken();
    await transition(cancelOrder.id, 'cancelled', manager, 200, { reason: 'العميل طلب الإلغاء' });
    const cancelTimeline = getDb().orders.find((o) => o.id === cancelOrder.id)?.timeline.length;
    await transition(cancelOrder.id, 'cancelled', manager, 400, { reason: 'العميل طلب الإلغاء' });
    assert.equal(
      getDb().orders.find((o) => o.id === cancelOrder.id)?.timeline.length,
      cancelTimeline,
      'replayed cancel must not append another timeline entry'
    );
  });

  it('applies the note precedence reason > note > default Arabic note', async () => {
    const order = await checkoutNewOrder();
    const staff = staffToken();
    const manager = managerToken();

    // No reason, no note: the per-status default note is used.
    const defaulted = await transition(order.id, 'accepted', staff, 200);
    assert.ok(defaulted);
    assert.equal(
      defaulted.timeline[defaulted.timeline.length - 1].note,
      'تم قبول الطلب وتأكيد توفر الأصناف'
    );

    // A custom note overrides the default.
    const noted = await transition(order.id, 'in_preparation', staff, 200, {
      note: 'بدأ التجهيز قبل الموعد',
    });
    assert.ok(noted);
    assert.equal(noted.timeline[noted.timeline.length - 1].note, 'بدأ التجهيز قبل الموعد');

    // For cancel/undelivered the reason wins over any note and feeds cancelReason.
    const cancelled = await transition(order.id, 'cancelled', manager, 200, {
      reason: 'العميل غيّر رأيه',
      note: 'ملاحظة داخلية لا تظهر',
    });
    assert.ok(cancelled);
    assert.equal(cancelled.timeline[cancelled.timeline.length - 1].note, 'العميل غيّر رأيه');
    assert.equal(cancelled.cancelReason, 'العميل غيّر رأيه');
  });
});
