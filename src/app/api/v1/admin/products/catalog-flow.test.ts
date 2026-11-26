import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import type { Product } from '@/types';
import { signSessionToken } from '@/server/auth';
import { getDb, resetDb } from '@/server/db';
import { GET as listAdminProducts, POST as createProduct } from './route';
import { PUT as updateProduct, DELETE as deleteProduct } from './[id]/route';
import { PATCH as patchAvailability } from './[id]/availability/route';
import { GET as listPublicProducts } from '../../products/route';
import { GET as getPublicProduct } from '../../products/[slugOrId]/route';
import { POST as createOrder } from '../../orders/route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-catalog-flow-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
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

function req(
  method: string,
  url: string,
  token?: string,
  body?: unknown
): NextRequest {
  return new NextRequest(url, {
    method,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

function seedCategoryId(): string {
  const category = getDb().categories[0];
  assert.ok(category, 'seed must contain a category');
  return category.id;
}

function validProductBody(overrides: Record<string, unknown> = {}) {
  return {
    name: 'تمر محشي بالجوز الفاخر',
    description: 'تمر فاخر محشي يدوياً',
    categoryId: seedCategoryId(),
    price: 45,
    unit: 'kg',
    slug: 'dates-flow-test',
    ...overrides,
  };
}

async function publicList(query = ''): Promise<Product[]> {
  const res = await listPublicProducts(req('GET', `http://localhost:3000/api/v1/products${query}`));
  assert.equal(res.status, 200);
  return (await res.json()).data as Product[];
}

async function publicDetail(
  slugOrId: string
): Promise<{ status: number; product: Product | null }> {
  const res = await getPublicProduct(
    req('GET', `http://localhost:3000/api/v1/products/${slugOrId}`),
    { params: { slugOrId } }
  );
  if (res.status !== 200) return { status: res.status, product: null };
  return { status: 200, product: (await res.json()).data as Product };
}

async function checkout(productId: string): Promise<{ status: number; code?: string }> {
  const res = await createOrder(
    req('POST', 'http://localhost:3000/api/v1/orders', undefined, {
      customer: {
        fullName: 'اختبار كتالوج',
        phone: PHONE,
        zoneId: 'zone-gaza',
        streetAddress: 'شارع رئيسي، عمارة ٥',
      },
      items: [{ productId, quantity: 1 }],
    })
  );
  if (res.status !== 201) {
    const json = await res.json();
    return { status: res.status, code: json?.error?.code };
  }
  return { status: 201 };
}

describe('admin product CRUD effects on the public catalog', () => {
  beforeEach(() => {
    resetDb();
  });

  it('a manager-created product becomes visible on the public list and detail routes', async () => {
    const res = await createProduct(
      req('POST', 'http://localhost:3000/api/v1/admin/products', managerToken(), validProductBody())
    );
    assert.equal(res.status, 201);
    const created = (await res.json()).data as Product;
    assert.ok(created.id);
    assert.equal((created as unknown as Record<string, unknown>).isArchived, undefined, 'isArchived never leaks');

    // Public list contains it, including the available-only filter.
    const list = await publicList();
    assert.ok(list.some((p) => p.id === created.id), 'public list shows the new product');
    const availableOnly = await publicList('?available=true');
    assert.ok(availableOnly.some((p) => p.id === created.id), 'available filter shows it');
    assert.ok(
      list.every((p) => (p as unknown as Record<string, unknown>).isArchived === undefined),
      'no public payload leaks isArchived'
    );

    // Public detail resolves by id and by slug.
    const byId = await publicDetail(created.id);
    assert.equal(byId.status, 200);
    assert.equal(byId.product?.name, 'تمر محشي بالجوز الفاخر');
    const bySlug = await publicDetail('dates-flow-test');
    assert.equal(bySlug.status, 200);
    assert.equal(bySlug.product?.id, created.id);
  });

  it('rejects staff from create, update and delete without touching the catalog', async () => {
    const staff = staffToken();
    const beforeCount = (await publicList()).length;
    const target = getDb().products.find((p) => !p.isArchived);
    assert.ok(target);

    const postRes = await createProduct(
      req('POST', 'http://localhost:3000/api/v1/admin/products', staff, validProductBody())
    );
    assert.equal(postRes.status, 403);

    const putRes = await updateProduct(
      req('PUT', `http://localhost:3000/api/v1/admin/products/${target.id}`, staff, { price: 1 }),
      { params: { id: target.id } }
    );
    assert.equal(putRes.status, 403);

    const delRes = await deleteProduct(
      req('DELETE', `http://localhost:3000/api/v1/admin/products/${target.id}`, staff),
      { params: { id: target.id } }
    );
    assert.equal(delRes.status, 403);

    // Nothing changed for customers.
    assert.equal((await publicList()).length, beforeCount);
    const detail = await publicDetail(target.id);
    assert.equal(detail.status, 200);
    assert.notEqual(detail.product?.price, 1);
  });

  it('reflects manager updates on the public detail and search', async () => {
    const createRes = await createProduct(
      req('POST', 'http://localhost:3000/api/v1/admin/products', managerToken(), validProductBody())
    );
    const created = (await createRes.json()).data as Product;

    const putRes = await updateProduct(
      req('PUT', `http://localhost:3000/api/v1/admin/products/${created.id}`, managerToken(), {
        price: 50,
        salePrice: 39,
        isFeatured: true,
        name: 'تمر محشي بالجوز الإصدار الجديد',
      }),
      { params: { id: created.id } }
    );
    assert.equal(putRes.status, 200);

    const detail = await publicDetail(created.id);
    assert.equal(detail.product?.price, 50);
    assert.equal(detail.product?.salePrice, 39);
    assert.equal(detail.product?.isFeatured, true);

    // The new name is searchable on the public list route.
    const found = await publicList(`?search=${encodeURIComponent('الإصدار الجديد')}`);
    assert.ok(found.some((p) => p.id === created.id), 'public search finds the renamed product');

    // Featured filter picks it up too.
    const featured = await publicList('?featured=true');
    assert.ok(featured.some((p) => p.id === created.id));
  });

  it('rejects invalid updates and preserves the stored product exactly', async () => {
    const createRes = await createProduct(
      req('POST', 'http://localhost:3000/api/v1/admin/products', managerToken(), validProductBody())
    );
    const created = (await createRes.json()).data as Product;
    const other = getDb().products.find((p) => !p.isArchived && p.id !== created.id);
    assert.ok(other);
    const before = JSON.stringify(getDb().products.find((p) => p.id === created.id));

    const badPayloads: Record<string, unknown>[] = [
      { price: 0 },
      { price: -10 },
      { salePrice: 45 }, // salePrice must stay below price
      { categoryId: 'cat-does-not-exist' },
      { unit: 'liter' },
      { slug: other.slug }, // slug conflict
      { name: 'خ' }, // too short
    ];
    for (const payload of badPayloads) {
      const res = await updateProduct(
        req('PUT', `http://localhost:3000/api/v1/admin/products/${created.id}`, managerToken(), payload),
        { params: { id: created.id } }
      );
      assert.ok(
        res.status === 400 || res.status === 409,
        `payload ${JSON.stringify(payload)} expected 400/409, got ${res.status}`
      );
    }

    // Stored record and public view are untouched.
    assert.equal(
      JSON.stringify(getDb().products.find((p) => p.id === created.id)),
      before,
      'rejected updates must not mutate the stored product'
    );
    const detail = await publicDetail(created.id);
    assert.equal(detail.product?.price, 45);
    assert.equal(detail.product?.slug, 'dates-flow-test');
  });

  it('rejects invalid creates without changing the public catalog', async () => {
    const manager = managerToken();
    const beforeCount = (await publicList()).length;

    const badBodies: Record<string, unknown>[] = [
      validProductBody({ name: 'خ' }),
      validProductBody({ price: 0 }),
      validProductBody({ salePrice: 60 }), // above the 45 base price
      validProductBody({ categoryId: 'cat-does-not-exist' }),
      validProductBody({ unit: 'liter' }),
    ];
    for (const body of badBodies) {
      const res = await createProduct(
        req('POST', 'http://localhost:3000/api/v1/admin/products', manager, body)
      );
      assert.equal(res.status, 400, `body should be rejected: ${JSON.stringify(body)}`);
    }

    // Duplicate slug of a live product is a 409 conflict.
    const existing = getDb().products.find((p) => !p.isArchived);
    assert.ok(existing);
    const conflict = await createProduct(
      req('POST', 'http://localhost:3000/api/v1/admin/products', manager, validProductBody({ slug: existing.slug }))
    );
    assert.equal(conflict.status, 409);
    assert.equal((await conflict.json()).error.code, 'SLUG_CONFLICT');

    assert.equal((await publicList()).length, beforeCount, 'catalog unchanged after rejected creates');
  });

  it('availability toggles propagate to the public filters and checkout', async () => {
    const createRes = await createProduct(
      req('POST', 'http://localhost:3000/api/v1/admin/products', managerToken(), validProductBody())
    );
    const created = (await createRes.json()).data as Product;

    // Checkout works while available.
    assert.equal((await checkout(created.id)).status, 201);

    // Staff (not only managers) may toggle availability; turn it off.
    const offRes = await patchAvailability(
      req('PATCH', `http://localhost:3000/api/v1/admin/products/${created.id}/availability`, staffToken(), {
        isAvailable: false,
      }),
      { params: { id: created.id } }
    );
    assert.equal(offRes.status, 200);
    assert.equal((await offRes.json()).data.isAvailable, false);

    // Still listed publicly (only archived items are hidden), but out of the available filter.
    assert.ok((await publicList()).some((p) => p.id === created.id));
    assert.ok(!(await publicList('?available=true')).some((p) => p.id === created.id));

    // Checkout now refuses it with the dedicated code.
    const blocked = await checkout(created.id);
    assert.equal(blocked.status, 422);
    assert.equal(blocked.code, 'PRODUCT_UNAVAILABLE');

    // Toggle back on (empty body toggles) and checkout recovers.
    const onRes = await patchAvailability(
      req('PATCH', `http://localhost:3000/api/v1/admin/products/${created.id}/availability`, staffToken(), {}),
      { params: { id: created.id } }
    );
    assert.equal(onRes.status, 200);
    assert.equal((await onRes.json()).data.isAvailable, true);
    assert.equal((await checkout(created.id)).status, 201);
  });

  it('hard-deletes an unreferenced product and removes it from every public route', async () => {
    const createRes = await createProduct(
      req('POST', 'http://localhost:3000/api/v1/admin/products', managerToken(), validProductBody())
    );
    const created = (await createRes.json()).data as Product;

    const delRes = await deleteProduct(
      req('DELETE', `http://localhost:3000/api/v1/admin/products/${created.id}`, managerToken()),
      { params: { id: created.id } }
    );
    assert.equal(delRes.status, 200);
    assert.equal((await delRes.json()).data.mode, 'deleted');

    assert.ok(!(await publicList()).some((p) => p.id === created.id));
    assert.equal((await publicDetail(created.id)).status, 404);
    assert.equal((await publicDetail('dates-flow-test')).status, 404);

    // A second delete is a clean 404, and checkout can no longer reference it.
    const again = await deleteProduct(
      req('DELETE', `http://localhost:3000/api/v1/admin/products/${created.id}`, managerToken()),
      { params: { id: created.id } }
    );
    assert.equal(again.status, 404);
    assert.equal((await checkout(created.id)).status, 422);
  });

  it('archives a referenced product: hidden publicly, preserved on the order record', async () => {
    const createRes = await createProduct(
      req('POST', 'http://localhost:3000/api/v1/admin/products', managerToken(), validProductBody())
    );
    const created = (await createRes.json()).data as Product;

    // Place a real order containing the product.
    assert.equal((await checkout(created.id)).status, 201);
    const order = getDb().orders.find((o) => o.items.some((i) => i.productId === created.id));
    assert.ok(order, 'order references the new product');

    const delRes = await deleteProduct(
      req('DELETE', `http://localhost:3000/api/v1/admin/products/${created.id}`, managerToken()),
      { params: { id: created.id } }
    );
    assert.equal(delRes.status, 200);
    const delJson = (await delRes.json()).data;
    assert.equal(delJson.mode, 'archived');
    assert.ok(delJson.referencedOrdersCount >= 1);

    // Hidden from every public surface...
    assert.ok(!(await publicList()).some((p) => p.id === created.id));
    assert.equal((await publicDetail(created.id)).status, 404);
    assert.equal((await publicDetail('dates-flow-test')).status, 404);

    // ...and from the admin list, which excludes archived products.
    const adminListRes = await listAdminProducts(
      req('GET', 'http://localhost:3000/api/v1/admin/products', managerToken())
    );
    const adminList = (await adminListRes.json()).data as Product[];
    assert.ok(!adminList.some((p) => p.id === created.id), 'admin list excludes archived products');

    // Availability and update routes treat it as gone.
    const patchRes = await patchAvailability(
      req('PATCH', `http://localhost:3000/api/v1/admin/products/${created.id}/availability`, staffToken(), {}),
      { params: { id: created.id } }
    );
    assert.equal(patchRes.status, 404);

    // But the order record keeps its items and totals intact.
    const storedOrder = getDb().orders.find((o) => o.id === order.id);
    assert.ok(storedOrder);
    assert.equal(storedOrder.items.length, order.items.length);
    assert.equal(storedOrder.total, order.total);
    assert.equal(storedOrder.items[0].productId, created.id);

    // Checkout with the archived product is refused as not found.
    const blocked = await checkout(created.id);
    assert.equal(blocked.status, 422);
    assert.equal(blocked.code, 'PRODUCT_NOT_FOUND');
  });
});
