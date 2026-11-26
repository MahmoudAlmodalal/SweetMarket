import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { getDb, resetDb } from '@/server/db';
import { GET as listCategories } from './route';

// Isolate the JSON database for this test process before any getDb() call.
process.env.CANDY_LOZ_DB_PATH = path.join(
  os.tmpdir(),
  `candy-loz-public-categories-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`
);

describe('public categories route', () => {
  beforeEach(() => {
    resetDb();
  });

  it('returns only active categories sorted by displayOrder, no auth needed', async () => {
    const db = getDb();
    db.categories[0].isActive = false;

    const res = await listCategories(
      new NextRequest('http://localhost:3000/api/v1/categories', { method: 'GET' })
    );
    assert.equal(res.status, 200);
    const json = await res.json();
    const expected = db.categories.filter((c) => c.isActive).length;
    assert.equal(json.data.length, expected);
    assert.ok(json.data.every((c: { isActive: boolean }) => c.isActive));
    for (let i = 1; i < json.data.length; i++) {
      assert.ok(
        json.data[i - 1].displayOrder <= json.data[i].displayOrder,
        'sorted by displayOrder'
      );
    }
  });
});
