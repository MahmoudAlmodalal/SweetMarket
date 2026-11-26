import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { getDb, resetDb } from '@/server/db';
import { GET as getProduct } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-public-product-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function reqFor(slugOrId: string) {
  const req = new NextRequest(`http://localhost:3000/api/v1/products/${slugOrId}`, {
    method: 'GET',
  });
  return [req, { params: { slugOrId } }] as const;
}

describe('public product detail route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('finds a product by slug or id without auth', async () => {
    const product = getDb().products.find((p) => !p.isArchived);
    assert.ok(product);

    const [bySlugReq, bySlugCtx] = reqFor(product.slug);
    const bySlug = await getProduct(bySlugReq, bySlugCtx);
    assert.equal(bySlug.status, 200);
    assert.equal((await bySlug.json()).data.id, product.id);

    const [byIdReq, byIdCtx] = reqFor(product.id);
    const byId = await getProduct(byIdReq, byIdCtx);
    assert.equal(byId.status, 200);
    const json = await byId.json();
    assert.equal(json.data.slug, product.slug);
    assert.equal('isArchived' in json.data, false, 'isArchived must be stripped');
  });

  it('404s unknown and archived products', async () => {
    const [missingReq, missingCtx] = reqFor('prod-does-not-exist');
    assert.equal((await getProduct(missingReq, missingCtx)).status, 404);

    const product = getDb().products.find((p) => !p.isArchived);
    assert.ok(product);
    getDb().products.find((p) => p.id === product.id)!.isArchived = true;
    const [archReq, archCtx] = reqFor(product.slug);
    assert.equal(
      (await getProduct(archReq, archCtx)).status,
      404,
      'archived products must not be publicly visible'
    );
  });
});
