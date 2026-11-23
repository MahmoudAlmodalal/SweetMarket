import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import type { Order } from '@/types';
import { getDb, saveDb } from '@/server/db';
import { generateTrackingToken } from '@/server/auth';
import {
  BusinessRuleError,
  computeAuthoritativeOrderTotals,
  normalizePhoneNumber,
  type OrderItemInput,
} from '@/server/business-rules';
import {
  apiError,
  apiOk,
  handleRouteError,
  proxyToUpstreamIfConfigured,
} from '@/server/http';

export const dynamic = 'force-dynamic';

function generateOrderNumber(existing: Order[]): string {
  const year = new Date().getFullYear();
  let seq = 1001 + existing.length;
  let candidate = `CL-${year}-${seq}`;
  const taken = new Set(existing.map((o) => o.orderNumber));
  while (taken.has(candidate)) {
    seq += 1;
    candidate = `CL-${year}-${seq}`;
  }
  return candidate;
}

export async function POST(req: NextRequest) {
  try {
    const proxied = await proxyToUpstreamIfConfigured(req, '/api/v1/orders');
    if (proxied) return proxied;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return apiError('VALIDATION_ERROR', 'بيانات الطلب غير صالحة', 400);
    }

    const db = getDb();
    const idempotencyKey = req.headers.get('idempotency-key')?.trim();

    if (idempotencyKey && db.idempotencyMap[idempotencyKey]) {
      const existingOrder = db.orders.find(
        (o) => o.id === db.idempotencyMap[idempotencyKey]
      );
      if (existingOrder) {
        const zone = db.zones.find((z) => z.id === existingOrder.customer.zoneId);
        return apiOk(
          {
            ...existingOrder,
            estimatedDeliveryTime: zone
              ? `${zone.estimatedTimeMin}-${zone.estimatedTimeMax} دقيقة`
              : '45-60 دقيقة',
          },
          null,
          200
        );
      }
    }

    const rawCustomer = (body.customer || {}) as Record<string, unknown>;
    const fullName = String(rawCustomer.fullName ?? rawCustomer.name ?? '').trim();
    const rawPhone = String(rawCustomer.phone ?? '').trim();
    const zoneId = String(rawCustomer.zoneId ?? rawCustomer.zone_id ?? '').trim();
    const streetAddress = String(
      rawCustomer.streetAddress ?? rawCustomer.street_address ?? ''
    ).trim();
    const buildingOrApt = rawCustomer.buildingOrApt
      ? String(rawCustomer.buildingOrApt).trim().slice(0, 120)
      : undefined;
    const notes = rawCustomer.notes
      ? String(rawCustomer.notes).trim().slice(0, 300)
      : undefined;

    if (fullName.length < 2) {
      throw new BusinessRuleError(
        'VALIDATION_ERROR',
        'يرجى إدخال الاسم الكامل بشكل صحيح',
        400,
        [{ field: 'customer.fullName', message: 'الاسم الكامل مطلوب (حرفان على الأقل)' }]
      );
    }

    const normalizedPhone = normalizePhoneNumber(rawPhone);

    if (streetAddress.length < 4) {
      throw new BusinessRuleError(
        'VALIDATION_ERROR',
        'يرجى إدخال عنوان تفصيلي واضح للتوصيل',
        400,
        [{ field: 'customer.streetAddress', message: 'العنوان التفصيلي مطلوب (4 أحرف على الأقل)' }]
      );
    }

    const zone = db.zones.find((z) => z.id === zoneId);
    const productsById = new Map(db.products.map((p) => [p.id, p]));
    const rawItems = Array.isArray(body.items) ? (body.items as OrderItemInput[]) : [];

    const computed = computeAuthoritativeOrderTotals(rawItems, productsById, zone);
    const nowIso = new Date().toISOString();
    const orderNumber = generateOrderNumber(db.orders);
    const orderId = `ord-${crypto.randomUUID().slice(0, 12)}`;
    const trackingToken = generateTrackingToken();

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      status: 'new',
      createdAt: nowIso,
      updatedAt: nowIso,
      customer: {
        fullName,
        phone: normalizedPhone,
        zoneId: zone!.id,
        streetAddress,
        buildingOrApt,
        notes,
      },
      items: computed.items,
      subtotal: computed.subtotal,
      deliveryFee: computed.deliveryFee,
      total: computed.total,
      paymentMethod: 'cash_on_delivery',
      trackingToken,
      timeline: [
        {
          status: 'new',
          timestamp: nowIso,
          note: 'تم استلام الطلب بنجاح من المتجر الإلكتروني',
        },
      ],
    };

    db.orders.unshift(newOrder);
    if (idempotencyKey) {
      db.idempotencyMap[idempotencyKey] = newOrder.id;
    }
    saveDb(db);

    return apiOk(
      {
        ...newOrder,
        estimatedDeliveryTime: `${zone!.estimatedTimeMin}-${zone!.estimatedTimeMax} دقيقة`,
      },
      null,
      201
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
