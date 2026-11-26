import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import type { Product } from '@/types';
import { getDb, resetDb } from '@/server/db';
import { GET as listProducts } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-search-normalization-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

async function search(term: string): Promise<Product[]> {
  const res = await listProducts(
    new NextRequest(`http://localhost:3000/api/v1/products?search=${encodeURIComponent(term)}`)
  );
  assert.equal(res.status, 200);
  return (await res.json()).data as Product[];
}

describe('public products search applies the canonical Arabic normalization', () => {
  beforeEach(() => {
    resetDb();
  });

  it('matches teh marbuta and heh interchangeably on real seed products', async () => {
    // Seed evidence: 'كنافة نابلسية خشنة بالجبنة البلدية' is spelled with ة.
    const kunafa = getDb().products.find((p) => !p.isArchived && p.name.includes('كنافة'));
    assert.ok(kunafa, 'seed contains a كنافة product');

    // Customers routinely type the ه variant; the canonical search rules unify them.
    const hehVariant = await search('كنافه');
    assert.ok(
      hehVariant.some((p) => p.id === kunafa.id),
      'search with ه must find the ة-spelled product'
    );

    // And the reverse direction keeps working.
    const tehVariant = await search('كنافة');
    assert.ok(tehVariant.some((p) => p.id === kunafa.id));
  });

  it('matches hamza-carrying and plain alef forms interchangeably', async () => {
    // Seed evidence: 'أصابع بقلاوة مقرمشة بالكاجو' starts with أ.
    const fingers = getDb().products.find((p) => !p.isArchived && p.name.includes('أصابع'));
    assert.ok(fingers, 'seed contains the أصابع product');

    const plainAlef = await search('اصابع');
    assert.ok(
      plainAlef.some((p) => p.id === fingers.id),
      'search with plain alef must find the hamza-spelled product'
    );
  });

  it('ignores diacritics in the query', async () => {
    const baklava = getDb().products.find((p) => !p.isArchived && p.name.includes('بقلاوة'));
    assert.ok(baklava, 'seed contains a بقلاوة product');

    // بَقلاوة with an explicit fatha on the first letter.
    const vocalized = await search('بَقلاوة');
    assert.ok(
      vocalized.some((p) => p.id === baklava.id),
      'vocalized query must match the unvocalized product name'
    );
  });

  it('keeps English nameEn search working after normalization', async () => {
    const withEnglish = getDb().products.find((p) => !p.isArchived && p.nameEn);
    assert.ok(withEnglish?.nameEn, 'seed contains a product with an English name');
    const term = withEnglish.nameEn.split(' ')[0].toLowerCase();
    assert.ok(term.length >= 2);

    const results = await search(term);
    assert.ok(
      results.some((p) => p.id === withEnglish.id),
      'lowercase English fragment still matches nameEn'
    );
  });

  it('treats an empty or whitespace-only search as no filter', async () => {
    const all = await search('');
    const blank = await search('   ');
    const expected = getDb().products.filter((p) => !p.isArchived).length;
    assert.equal(all.length, expected);
    assert.equal(blank.length, expected);
  });
});
