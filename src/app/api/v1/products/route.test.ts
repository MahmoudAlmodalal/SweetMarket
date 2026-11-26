import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { getDb, resetDb } from '@/server/db';
import { GET as listProducts } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-public-products-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

function req(query = ''): NextRequest {
  return new NextRequest(`http://localhost:3000/api/v1/products${query}`, { method: 'GET' });
}

describe('public products list route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('returns unarchived products without the isArchived field, no auth needed', async () => {
    const res = await listProducts(req());
    assert.equal(res.status, 200);
    const json = await res.json();
    const expected = getDb().products.filter((p) => !p.isArchived).length;
    assert.equal(json.data.length, expected);
    assert.equal(json.meta.total, expected);
    assert.ok(
      json.data.every((p: Record<string, unknown>) => !('isArchived' in p)),
      'isArchived must be stripped from public payloads'
    );
  });

  it('filters by category id or slug and empties on unknown category', async () => {
    const cat = getDb().categories[0];
    assert.ok(cat);
    const byId = await (await listProducts(req(`?category=${cat.id}`))).json();
    const expected = getDb().products.filter(
      (p) => !p.isArchived && p.categoryId === cat.id
    ).length;
    assert.equal(byId.data.length, expected);

    const bySlug = await (await listProducts(req(`?category=${cat.slug}`))).json();
    assert.equal(bySlug.data.length, expected, 'slug filter matches id filter');

    const unknown = await (await listProducts(req('?category=cat-nope'))).json();
    assert.equal(unknown.data.length, 0);

    const all = await (await listProducts(req('?category=all'))).json();
    assert.equal(all.data.length, getDb().products.filter((p) => !p.isArchived).length);
  });

  it('filters featured and available and searches name fields', async () => {
    const featured = await (await listProducts(req('?featured=true'))).json();
    const expectedFeatured = getDb().products.filter((p) => !p.isArchived && p.isFeatured).length;
    assert.equal(featured.data.length, expectedFeatured);
    assert.ok(featured.data.every((p: { isFeatured: boolean }) => p.isFeatured));

    const available = await (await listProducts(req('?available=true'))).json();
    assert.ok(available.data.every((p: { isAvailable: boolean }) => p.isAvailable));

    const anyProduct = getDb().products.find((p) => !p.isArchived);
    assert.ok(anyProduct);
    const term = anyProduct.name.slice(0, 4);
    const searched = await (
      await listProducts(req(`?search=${encodeURIComponent(term)}`))
    ).json();
    assert.ok(searched.data.length >= 1, 'search finds a seeded product by name fragment');
  });

  it('paginates with limit and page and clamps limit to 100', async () => {
    const page1 = await (await listProducts(req('?limit=2&page=1'))).json();
    assert.equal(page1.data.length, 2);
    assert.equal(page1.meta.limit, 2);
    assert.equal(page1.meta.page, 1);
    assert.equal(
      page1.meta.totalPages,
      Math.max(1, Math.ceil(page1.meta.total / 2))
    );

    const page2 = await (await listProducts(req('?limit=2&page=2'))).json();
    assert.notDeepEqual(
      page2.data.map((p: { id: string }) => p.id),
      page1.data.map((p: { id: string }) => p.id),
      'page 2 shows different products'
    );

    const clamped = await (await listProducts(req('?limit=500'))).json();
    assert.equal(clamped.meta.limit, 100, 'limit clamped to 100');
  });
});
