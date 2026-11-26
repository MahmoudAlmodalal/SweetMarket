import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  updateRecentlyViewedIds,
  RECENTLY_VIEWED_MAX_ITEMS,
} from '@/components/storefront/catalog/recently-viewed-utils';

describe('Recently Viewed List Logic', () => {
  test('prepends a new product to an empty list', () => {
    assert.deepEqual(updateRecentlyViewedIds([], 'p1'), ['p1']);
  });

  test('prepends new products so the most recent comes first', () => {
    assert.deepEqual(updateRecentlyViewedIds(['p1'], 'p2'), ['p2', 'p1']);
  });

  test('re-viewing a product moves it to the front without duplicating', () => {
    assert.deepEqual(updateRecentlyViewedIds(['p1', 'p2', 'p3'], 'p2'), ['p2', 'p1', 'p3']);
  });

  test('caps the list at the maximum number of items', () => {
    const full = Array.from({ length: RECENTLY_VIEWED_MAX_ITEMS }, (_, i) => `p${i + 1}`);
    const next = updateRecentlyViewedIds(full, 'new');
    assert.equal(next.length, RECENTLY_VIEWED_MAX_ITEMS);
    assert.equal(next[0], 'new');
    assert.ok(!next.includes(`p${RECENTLY_VIEWED_MAX_ITEMS}`));
  });

  test('ignores empty product ids and drops blank entries', () => {
    assert.deepEqual(updateRecentlyViewedIds(['p1'], ''), ['p1']);
    assert.deepEqual(updateRecentlyViewedIds(['p1', '', 'p2'], 'p3'), ['p3', 'p1', 'p2']);
  });
});
