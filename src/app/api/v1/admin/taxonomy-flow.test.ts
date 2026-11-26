import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import type { Category, DeliveryZone, Order, Product } from '@/types';
import { signSessionToken } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { GET as listAdminCategories, POST as createCategory } from './categories/route';
import { PUT as updateCategory, DELETE as deleteCategory } from './categories/[id]/route';
import { POST as createZone } from './delivery-zones/route';
import { PUT as updateZone, DELETE as deleteZone } from './delivery-zones/[id]/route';
import { PUT as updateProduct } from './products/[id]/route';
import { PATCH as updateOrderStatus } from './orders/[id]/status/route';
import { GET as listPublicCategories } from '../categories/route';
import { GET as listPublicZones } from '../delivery-zones/route';
import { POST as createOrder } from '../orders/route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-taxonomy-flow-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
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

function req(method: string, url: string, token?: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

async function publicCategories(): Promise<Category[]> {
  const res = await listPublicCategories(req('GET', 'http://localhost:3000/api/v1/categories'));
  assert.equal(res.status, 200);
  return (await res.json()).data as Category[];
}

async function publicZones(): Promise<DeliveryZone[]> {
  const res = await listPublicZones(req('GET', 'http://localhost:3000/api/v1/delivery-zones'));
  assert.equal(res.status, 200);
  return (await res.json()).data as DeliveryZone[];
}

function checkoutProductId(): string {
  const product = getDb().products.find((p) => p.isAvailable && !p.isArchived);
  assert.ok(product);
  return product.id;
}

async function checkout(zoneId: string): Promise<{ status: number; code?: string; order?: Order }> {
  const res = await createOrder(
    req('POST', 'http://localhost:3000/api/v1/orders', undefined, {
      customer: {
        fullName: 'اختبار التصنيفات والمناطق',
        phone: PHONE,
        zoneId,
        streetAddress: 'شارع رئيسي، عمارة ٥',
      },
      items: [{ productId: checkoutProductId(), quantity: 1 }],
    })
  );
  if (res.status !== 201) {
    const json = await res.json();
    return { status: res.status, code: json?.error?.code };
  }
  return { status: 201, order: (await res.json()).data as Order };
}

describe('admin category and zone CRUD propagation across routes', () => {
  beforeEach(() => {
    resetDb();
  });

  it('publishes a manager-created active category and hides an inactive one', async () => {
    const active = await createCategory(
      req('POST', 'http://localhost:3000/api/v1/admin/categories', managerToken(), {
        name: 'حلويات موسمية',
        slug: 'seasonal-flow-test',
      })
    );
    assert.equal(active.status, 201);
    const activeCat = (await active.json()).data as Category;
    assert.ok((await publicCategories()).some((c) => c.id === activeCat.id));

    const inactive = await createCategory(
      req('POST', 'http://localhost:3000/api/v1/admin/categories', managerToken(), {
        name: 'تصنيف مخفي',
        slug: 'hidden-flow-test',
        isActive: false,
      })
    );
    assert.equal(inactive.status, 201);
    const inactiveCat = (await inactive.json()).data as Category;

    // Public list is active-only; the admin list shows both.
    assert.ok(!(await publicCategories()).some((c) => c.id === inactiveCat.id));
    const adminRes = await listAdminCategories(
      req('GET', 'http://localhost:3000/api/v1/admin/categories', staffToken())
    );
    const adminList = (await adminRes.json()).data as Category[];
    assert.ok(adminList.some((c) => c.id === inactiveCat.id), 'admin list includes inactive categories');
  });

  it('rejects staff from category mutations without touching the public list', async () => {
    const staff = staffToken();
    const before = await publicCategories();
    const target = getDb().categories[0];
    assert.ok(target);

    assert.equal(
      (
        await createCategory(
          req('POST', 'http://localhost:3000/api/v1/admin/categories', staff, { name: 'محاولة موظف' })
        )
      ).status,
      403
    );
    assert.equal(
      (
        await updateCategory(
          req('PUT', `http://localhost:3000/api/v1/admin/categories/${target.id}`, staff, { name: 'اسم معدل' }),
          { params: { id: target.id } }
        )
      ).status,
      403
    );
    assert.equal(
      (
        await deleteCategory(
          req('DELETE', `http://localhost:3000/api/v1/admin/categories/${target.id}`, staff),
          { params: { id: target.id } }
        )
      ).status,
      403
    );

    const after = await publicCategories();
    assert.deepEqual(after, before);
  });

  it('reflects category updates publicly and preserves state on rejected updates', async () => {
    const manager = managerToken();
    const createRes = await createCategory(
      req('POST', 'http://localhost:3000/api/v1/admin/categories', manager, {
        name: 'تصنيف قابل للتعديل',
        slug: 'editable-flow-test',
      })
    );
    const cat = (await createRes.json()).data as Category;
    const other = getDb().categories.find((c) => c.id !== cat.id);
    assert.ok(other);

    // Deactivation hides it publicly; reactivation restores it.
    await updateCategory(
      req('PUT', `http://localhost:3000/api/v1/admin/categories/${cat.id}`, manager, { isActive: false }),
      { params: { id: cat.id } }
    );
    assert.ok(!(await publicCategories()).some((c) => c.id === cat.id));
    const back = await updateCategory(
      req('PUT', `http://localhost:3000/api/v1/admin/categories/${cat.id}`, manager, {
        isActive: true,
        name: 'تصنيف معدل الاسم',
        displayOrder: 0,
      }),
      { params: { id: cat.id } }
    );
    assert.equal(back.status, 200);
    const publicList = await publicCategories();
    const renamed = publicList.find((c) => c.id === cat.id);
    assert.equal(renamed?.name, 'تصنيف معدل الاسم');
    assert.equal(publicList[0]?.id, cat.id, 'displayOrder 0 sorts first');

    // Rejected updates: short name and slug conflict preserve the stored record.
    const beforeUpdate = JSON.stringify(getDb().categories.find((c) => c.id === cat.id));
    assert.equal(
      (
        await updateCategory(
          req('PUT', `http://localhost:3000/api/v1/admin/categories/${cat.id}`, manager, { name: 'خ' }),
          { params: { id: cat.id } }
        )
      ).status,
      400
    );
    assert.equal(
      (
        await updateCategory(
          req('PUT', `http://localhost:3000/api/v1/admin/categories/${cat.id}`, manager, { slug: other.slug }),
          { params: { id: cat.id } }
        )
      ).status,
      409
    );
    assert.equal(
      JSON.stringify(getDb().categories.find((c) => c.id === cat.id)),
      beforeUpdate,
      'rejected category updates must not mutate the stored record'
    );
  });

  it('blocks deleting a category with linked products until they move, then deletes cleanly', async () => {
    const manager = managerToken();
    const createRes = await createCategory(
      req('POST', 'http://localhost:3000/api/v1/admin/categories', manager, {
        name: 'تصنيف مؤقت',
        slug: 'temporary-flow-test',
      })
    );
    const cat = (await createRes.json()).data as Category;

    // Link a product to it through the admin product update route.
    const product = getDb().products.find((p) => !p.isArchived);
    assert.ok(product);
    const originalCategoryId = product.categoryId;
    assert.equal(
      (
        await updateProduct(
          req('PUT', `http://localhost:3000/api/v1/admin/products/${product.id}`, manager, {
            categoryId: cat.id,
          }),
          { params: { id: product.id } }
        )
      ).status,
      200
    );

    // Delete is refused while products are linked; the category stays public.
    const blocked = await deleteCategory(
      req('DELETE', `http://localhost:3000/api/v1/admin/categories/${cat.id}`, manager),
      { params: { id: cat.id } }
    );
    assert.equal(blocked.status, 409);
    assert.equal((await blocked.json()).error.code, 'CATEGORY_HAS_PRODUCTS');
    assert.ok((await publicCategories()).some((c) => c.id === cat.id));

    // Move the product back and the delete goes through.
    await updateProduct(
      req('PUT', `http://localhost:3000/api/v1/admin/products/${product.id}`, manager, {
        categoryId: originalCategoryId,
      }),
      { params: { id: product.id } }
    );
    const removed = await deleteCategory(
      req('DELETE', `http://localhost:3000/api/v1/admin/categories/${cat.id}`, manager),
      { params: { id: cat.id } }
    );
    assert.equal(removed.status, 200);
    assert.ok(!(await publicCategories()).some((c) => c.id === cat.id));
    assert.ok(!getDb().categories.some((c) => c.id === cat.id));
  });

  it('publishes a new zone whose fee, minimum and ETA drive checkout pricing', async () => {
    const createRes = await createZone(
      req('POST', 'http://localhost:3000/api/v1/admin/delivery-zones', managerToken(), {
        name: 'منطقة الاختبار الجديدة',
        deliveryFee: 15,
        minOrderAmount: 0,
        estimatedTimeMin: 20,
        estimatedTimeMax: 35,
      })
    );
    assert.equal(createRes.status, 201);
    const zone = (await createRes.json()).data as DeliveryZone;
    assert.ok((await publicZones()).some((z) => z.id === zone.id));

    const placed = await checkout(zone.id);
    assert.equal(placed.status, 201);
    assert.ok(placed.order);
    assert.equal(placed.order.deliveryFee, 15, 'new zone fee applied at checkout');
    assert.equal(placed.order.total, placed.order.subtotal + 15);
    assert.equal(
      (placed.order as Order & { estimatedDeliveryTime?: string }).estimatedDeliveryTime,
      '20-35 دقيقة',
      'new zone ETA window applied'
    );
  });

  it('applies zone fee changes to new checkouts only and preserves placed orders', async () => {
    const manager = managerToken();
    const zone = getDb().zones.find((z) => z.id === 'zone-gaza');
    assert.ok(zone);
    const originalFee = zone.deliveryFee;

    const first = await checkout(zone.id);
    assert.equal(first.status, 201);
    assert.equal(first.order?.deliveryFee, originalFee);

    const newFee = originalFee + 5;
    assert.equal(
      (
        await updateZone(
          req('PUT', `http://localhost:3000/api/v1/admin/delivery-zones/${zone.id}`, manager, {
            deliveryFee: newFee,
          }),
          { params: { id: zone.id } }
        )
      ).status,
      200
    );
    const publicZone = (await publicZones()).find((z) => z.id === zone.id);
    assert.equal(publicZone?.deliveryFee, newFee, 'public zone list reflects the new fee');

    const second = await checkout(zone.id);
    assert.equal(second.status, 201);
    assert.equal(second.order?.deliveryFee, newFee, 'new checkouts use the new fee');

    // The earlier order keeps its original totals.
    const stored = getDb().orders.find((o) => o.id === first.order?.id);
    assert.equal(stored?.deliveryFee, originalFee);
    assert.equal(stored?.total, first.order?.total);
  });

  it('deactivating a zone hides it publicly and blocks checkout until reactivated', async () => {
    const manager = managerToken();
    const zone = getDb().zones.find((z) => z.id === 'zone-gaza' && z.isActive);
    assert.ok(zone);

    assert.equal(
      (
        await updateZone(
          req('PUT', `http://localhost:3000/api/v1/admin/delivery-zones/${zone.id}`, manager, {
            isActive: false,
          }),
          { params: { id: zone.id } }
        )
      ).status,
      200
    );
    assert.ok(!(await publicZones()).some((z) => z.id === zone.id));
    const blocked = await checkout(zone.id);
    assert.equal(blocked.status, 422);
    assert.equal(blocked.code, 'ZONE_UNAVAILABLE');

    // Rejected updates preserve state: negative fee and an illogical ETA window.
    const beforeRejected = JSON.stringify(getDb().zones.find((z) => z.id === zone.id));
    assert.equal(
      (
        await updateZone(
          req('PUT', `http://localhost:3000/api/v1/admin/delivery-zones/${zone.id}`, manager, {
            deliveryFee: -3,
          }),
          { params: { id: zone.id } }
        )
      ).status,
      400
    );
    assert.equal(
      (
        await updateZone(
          req('PUT', `http://localhost:3000/api/v1/admin/delivery-zones/${zone.id}`, manager, {
            estimatedTimeMin: 60,
            estimatedTimeMax: 30,
          }),
          { params: { id: zone.id } }
        )
      ).status,
      400
    );
    assert.equal(JSON.stringify(getDb().zones.find((z) => z.id === zone.id)), beforeRejected);

    // Reactivation restores the public listing and checkout.
    assert.equal(
      (
        await updateZone(
          req('PUT', `http://localhost:3000/api/v1/admin/delivery-zones/${zone.id}`, manager, {
            isActive: true,
          }),
          { params: { id: zone.id } }
        )
      ).status,
      200
    );
    assert.ok((await publicZones()).some((z) => z.id === zone.id));
    assert.equal((await checkout(zone.id)).status, 201);
  });

  it('blocks deleting a zone with active orders until they close, then deletes cleanly', async () => {
    const manager = managerToken();
    const createRes = await createZone(
      req('POST', 'http://localhost:3000/api/v1/admin/delivery-zones', manager, {
        name: 'منطقة مؤقتة للحذف',
        deliveryFee: 5,
        minOrderAmount: 0,
        estimatedTimeMin: 15,
        estimatedTimeMax: 25,
      })
    );
    const zone = (await createRes.json()).data as DeliveryZone;

    // An active order in the zone blocks deletion with the dedicated code.
    const placed = await checkout(zone.id);
    assert.equal(placed.status, 201);
    assert.ok(placed.order);
    const blocked = await deleteZone(
      req('DELETE', `http://localhost:3000/api/v1/admin/delivery-zones/${zone.id}`, manager),
      { params: { id: zone.id } }
    );
    assert.equal(blocked.status, 409);
    assert.equal((await blocked.json()).error.code, 'ZONE_IN_USE');
    assert.ok((await publicZones()).some((z) => z.id === zone.id), 'zone stays public while blocked');

    // Walk the order to delivered (a closed state) via the status route, then delete succeeds.
    for (const step of ['accepted', 'in_preparation', 'out_for_delivery', 'delivered'] as const) {
      const res = await updateOrderStatus(
        req('PATCH', `http://localhost:3000/api/v1/admin/orders/${placed.order.id}/status`, staffToken(), {
          status: step,
        }),
        { params: { id: placed.order.id } }
      );
      assert.equal(res.status, 200, `transition ${step}`);
    }
    const removed = await deleteZone(
      req('DELETE', `http://localhost:3000/api/v1/admin/delivery-zones/${zone.id}`, manager),
      { params: { id: zone.id } }
    );
    assert.equal(removed.status, 200);
    assert.ok(!(await publicZones()).some((z) => z.id === zone.id));

    // The delivered order keeps its zone reference and totals.
    const stored = getDb().orders.find((o) => o.id === placed.order?.id);
    assert.equal(stored?.customer?.zoneId, zone.id);
    assert.equal(stored?.total, placed.order?.total);

    // Checkout against the deleted zone is refused.
    const gone = await checkout(zone.id);
    assert.equal(gone.status, 422);
    assert.equal(gone.code, 'ZONE_UNAVAILABLE');
  });
});
