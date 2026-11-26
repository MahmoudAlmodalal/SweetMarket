import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { arabicCountLabel, ITEM_COUNT_FORMS } from '@/lib/arabic-plural';

describe('arabicCountLabel plural agreement', () => {
  it('uses the singular form for 1', () => {
    assert.equal(arabicCountLabel(1, ITEM_COUNT_FORMS), 'عنصر واحد');
  });

  it('uses the dual form for 2', () => {
    assert.equal(arabicCountLabel(2, ITEM_COUNT_FORMS), 'عنصران');
  });

  it('uses the few form with the digit for 3-10', () => {
    assert.equal(arabicCountLabel(3, ITEM_COUNT_FORMS), '3 عناصر');
    assert.equal(arabicCountLabel(10, ITEM_COUNT_FORMS), '10 عناصر');
  });

  it('uses the many form with the digit for 11+', () => {
    assert.equal(arabicCountLabel(11, ITEM_COUNT_FORMS), '11 عنصراً');
    assert.equal(arabicCountLabel(100, ITEM_COUNT_FORMS), '100 عنصراً');
  });

  it('supports custom noun forms', () => {
    const forms = { one: 'صنف محفوظ واحد', two: 'صنفان محفوظان', few: 'أصناف محفوظة', many: 'صنفاً محفوظاً' };
    assert.equal(arabicCountLabel(2, forms), 'صنفان محفوظان');
    assert.equal(arabicCountLabel(5, forms), '5 أصناف محفوظة');
  });
});
