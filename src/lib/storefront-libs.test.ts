import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeArabicText, matchesProductSearch } from '@/lib/search';
import {
  computeLinePrice,
  getDefaultWeightOption,
  formatArabicDistinctItems,
  formatArabicTotalUnits,
} from '@/lib/pricing';
import { isStoreOpen, getGazaWeekday, getGazaNow } from '@/lib/store-hours';
import {
  normalizePalestinianPhone,
  isValidPalestinianPhone,
} from '@/lib/validations';
import type { Product } from '@/types';

const baseProduct: Product = {
  id: 'p1',
  slug: 'test-product',
  name: 'صينية بقلاوة',
  description: 'وصف تجريبي',
  categoryId: 'c1',
  price: 100,
  unit: 'kg',
  imageUrl: '/images/test.jpg',
  galleryImages: [],
  isAvailable: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('Arabic Search Normalization', () => {
  test('unifies alef variants', () => {
    assert.equal(normalizeArabicText('أحمد إبراهيم آمن ٱلله'), 'احمد ابراهيم امن الله');
  });

  test('strips diacritics and tatweel', () => {
    assert.equal(normalizeArabicText('بَقْلَاوَةٌ'), 'بقلاوه');
    assert.equal(normalizeArabicText('كـنـافـة'), 'كنافه');
  });

  test('unifies taa marbuta and alef maqsura', () => {
    assert.equal(normalizeArabicText('حلوى'), 'حلوي');
    assert.equal(normalizeArabicText('تورتة'), 'تورته');
  });

  test('converts Arabic-Indic digits and lowercases latin', () => {
    assert.equal(normalizeArabicText('٥٩٩ KG'), '599 kg');
  });

  test('collapses whitespace and handles empty input', () => {
    assert.equal(normalizeArabicText('  متجر   حلويات  '), 'متجر حلويات');
    assert.equal(normalizeArabicText(''), '');
  });

  test('matches products across spelling variants', () => {
    const product = { name: 'تورتة شوكولاتة', description: 'بالكريمة البلجيكية' };
    assert.equal(matchesProductSearch(product, 'تورته'), true);
    assert.equal(matchesProductSearch(product, 'شوكولاته'), true);
    assert.equal(matchesProductSearch(product, 'بقلاوة'), false);
    assert.equal(matchesProductSearch(product, ''), true);
  });
});

describe('Canonical Pricing', () => {
  test('computes base price with standard packaging', () => {
    const result = computeLinePrice({ product: baseProduct, quantity: 2 });
    assert.deepEqual(result, { listUnitPrice: 100, unitPrice: 100, lineTotal: 200, discount: 0 });
  });

  test('applies product sale price and reports the discount', () => {
    const onSale = { ...baseProduct, salePrice: 80 };
    const result = computeLinePrice({ product: onSale, quantity: 1 });
    assert.deepEqual(result, { listUnitPrice: 100, unitPrice: 80, lineTotal: 80, discount: 20 });
  });

  test('weight option overrides product price, including its sale price', () => {
    const weighted = {
      ...baseProduct,
      availableWeights: [
        { label: 'نصف كغ', multiplier: 0.5, price: 60, salePrice: 50 },
        { label: 'كغ', multiplier: 1, price: 100 },
      ],
    };
    const half = weighted.availableWeights![0];
    const result = computeLinePrice({ product: weighted, weightOption: half, quantity: 3 });
    assert.deepEqual(result, { listUnitPrice: 60, unitPrice: 50, lineTotal: 150, discount: 10 });
  });

  test('adds royal packaging fee per unit and falls back on unknown option', () => {
    const result = computeLinePrice({ product: baseProduct, packagingOptionId: 'royal', quantity: 2 });
    assert.equal(result.unitPrice, 112);
    assert.equal(result.lineTotal, 224);

    const fallback = computeLinePrice({
      product: baseProduct,
      packagingOptionId: 'does-not-exist' as never,
      quantity: 1,
    });
    assert.equal(fallback.unitPrice, 100);
  });

  test('zero or negative quantity yields zero line total', () => {
    assert.equal(computeLinePrice({ product: baseProduct, quantity: 0 }).lineTotal, 0);
    assert.equal(computeLinePrice({ product: baseProduct, quantity: -2 }).lineTotal, 0);
  });

  test('default weight option prefers multiplier 1', () => {
    const weighted = {
      ...baseProduct,
      availableWeights: [
        { label: 'نصف كغ', multiplier: 0.5, price: 60 },
        { label: 'كغ', multiplier: 1, price: 100 },
      ],
    };
    assert.equal(getDefaultWeightOption(weighted)?.label, 'كغ');
    assert.equal(getDefaultWeightOption(baseProduct), undefined);
  });

  test('Arabic plural formatting for item and unit counts', () => {
    assert.equal(formatArabicDistinctItems(0), 'لا توجد أصناف');
    assert.equal(formatArabicDistinctItems(1), 'صنف فاخر واحد');
    assert.equal(formatArabicDistinctItems(2), 'صنفان فاخران');
    assert.equal(formatArabicDistinctItems(5), '5 أصناف فاخرة');
    assert.equal(formatArabicDistinctItems(12), '12 صنفاً فاخراً');
    assert.equal(formatArabicTotalUnits(0), '0 قطعة');
    assert.equal(formatArabicTotalUnits(1), 'قطعة واحدة');
    assert.equal(formatArabicTotalUnits(2), 'قطعتان');
    assert.equal(formatArabicTotalUnits(7), '7 قطع');
    assert.equal(formatArabicTotalUnits(15), '15 قطعة');
  });
});

describe('Store Hours (Asia/Gaza)', () => {
  // غزة في نوفمبر على توقيت UTC+2؛ 27 نوفمبر 2026 جمعة و28 نوفمبر سبت
  test('resolves Gaza weekday from a UTC instant', () => {
    assert.equal(getGazaWeekday(new Date('2026-11-27T10:00:00Z')), 5);
    assert.equal(getGazaWeekday(new Date('2026-11-28T10:00:00Z')), 6);
    assert.equal(getGazaNow(new Date('2026-11-28T08:30:00Z')).hour, 10);
  });

  test('Friday opens at 13:00 instead of 09:00', () => {
    assert.equal(isStoreOpen(new Date('2026-11-27T09:00:00Z')), false); // 11:00 غزة
    assert.equal(isStoreOpen(new Date('2026-11-27T11:30:00Z')), true); // 13:30 غزة
  });

  test('Saturday to Thursday hours run 09:00 to 23:00', () => {
    assert.equal(isStoreOpen(new Date('2026-11-28T06:30:00Z')), false); // 08:30 غزة
    assert.equal(isStoreOpen(new Date('2026-11-28T07:00:00Z')), true); // 09:00 غزة
    assert.equal(isStoreOpen(new Date('2026-11-28T20:30:00Z')), true); // 22:30 غزة
    assert.equal(isStoreOpen(new Date('2026-11-28T21:00:00Z')), false); // 23:00 غزة
  });
});

describe('Palestinian Phone Validation', () => {
  test('normalizes every accepted format to 05Xxxxxxxx', () => {
    assert.equal(normalizePalestinianPhone('0599777888'), '0599777888');
    assert.equal(normalizePalestinianPhone('+970599777888'), '0599777888');
    assert.equal(normalizePalestinianPhone('00970599777888'), '0599777888');
    assert.equal(normalizePalestinianPhone('970 599 777 888'), '0599777888');
    assert.equal(normalizePalestinianPhone('599777888'), '0599777888');
    assert.equal(normalizePalestinianPhone('٠٥٩٩٧٧٧٨٨٨'), '0599777888');
    assert.equal(normalizePalestinianPhone('0561234567'), '0561234567');
  });

  test('rejects invalid numbers with an Arabic error', () => {
    assert.throws(() => normalizePalestinianPhone('0581234567'), /059 أو 056/);
    assert.throws(() => normalizePalestinianPhone('0599777'), /059 أو 056/);
    assert.throws(() => normalizePalestinianPhone(''), /059 أو 056/);
    assert.equal(isValidPalestinianPhone('0599777888'), true);
    assert.equal(isValidPalestinianPhone('12345'), false);
  });
});
