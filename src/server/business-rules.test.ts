import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BusinessRuleError,
  normalizePhoneNumber,
  slugifySafe,
  computeAuthoritativeOrderTotals,
  validateOrderStatusTransition,
  evaluateProductDeletion,
  evaluateZoneDeletion,
  validateAdminUserMutation,
} from './business-rules';
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
  revokeSessionToken,
} from './auth';
import type { AdminUser, DeliveryZone, Order, Product } from '@/types';

const sampleZone: DeliveryZone = {
  id: 'zone-center',
  name: 'خان يونس - البلد',
  deliveryFee: 10,
  minOrderAmount: 50,
  estimatedTimeMin: 30,
  estimatedTimeMax: 45,
  isActive: true,
};

const sampleProduct: Product = {
  id: 'prod-1',
  categoryId: 'cat-1',
  name: 'بقلاوة مشكلة بالفستق',
  slug: 'mixed-baklava',
  description: 'بقلاوة فاخرة',
  price: 65,
  salePrice: 55,
  unit: 'kg',
  imageUrl: '/images/catalog/baklava-pistachio.jpg',
  galleryImages: ['/images/catalog/baklava-pistachio.jpg'],
  isAvailable: true,
  isFeatured: true,
  availableWeights: [
    { label: 'نصف كيلو (500 جم)', multiplier: 0.5, price: 35, salePrice: 30 },
    { label: '1 كيلو (1000 جم)', multiplier: 1, price: 65, salePrice: 55 },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const unavailableProduct: Product = {
  ...sampleProduct,
  id: 'prod-2',
  name: 'كنافة غير متوفرة',
  slug: 'out-of-stock-kunafa',
  isAvailable: false,
};

describe('normalizePhoneNumber', () => {
  it('normalizes local and international Palestinian mobile formats', () => {
    assert.equal(normalizePhoneNumber('0599123456'), '0599123456');
    assert.equal(normalizePhoneNumber('+970-59-912-3456'), '0599123456');
    assert.equal(normalizePhoneNumber('00972 56 123 4567'), '0561234567');
  });

  it('rejects invalid phone numbers', () => {
    assert.throws(() => normalizePhoneNumber('0501234567'), BusinessRuleError);
    assert.throws(() => normalizePhoneNumber('059123'), BusinessRuleError);
  });
});

describe('computeAuthoritativeOrderTotals', () => {
  const productsMap = new Map<string, Product>([
    [sampleProduct.id, sampleProduct],
    [unavailableProduct.id, unavailableProduct],
  ]);

  it('computes authoritative prices using sale price, selected weight, and royal packaging fee', () => {
    const result = computeAuthoritativeOrderTotals(
      [
        {
          productId: sampleProduct.id,
          quantity: 2,
          selectedWeightMultiplier: 0.5,
          selectedWeightLabel: 'نصف كيلو (500 جم)',
          packagingOptionId: 'royal',
          giftMessage: 'مبارك التخرج',
        },
      ],
      productsMap,
      sampleZone
    );

    // 30 (salePrice for 0.5kg) + 12 (royal packaging) = 42 per unit -> 84 subtotal + 10 delivery = 94
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].unitPrice, 42);
    assert.equal(result.items[0].lineTotal, 84);
    assert.equal(result.subtotal, 84);
    assert.equal(result.deliveryFee, 10);
    assert.equal(result.total, 94);
  });

  it('rejects unavailable products with PRODUCT_UNAVAILABLE (422)', () => {
    assert.throws(
      () =>
        computeAuthoritativeOrderTotals(
          [{ productId: unavailableProduct.id, quantity: 1 }],
          productsMap,
          sampleZone
        ),
      (err: unknown) =>
        err instanceof BusinessRuleError &&
        err.code === 'PRODUCT_UNAVAILABLE' &&
        err.status === 422
    );
  });

  it('enforces delivery zone minimum order amount', () => {
    assert.throws(
      () =>
        computeAuthoritativeOrderTotals(
          [
            {
              productId: sampleProduct.id,
              quantity: 1,
              selectedWeightMultiplier: 0.5,
              packagingOptionId: 'standard',
            },
          ],
          productsMap,
          sampleZone
        ),
      (err: unknown) =>
        err instanceof BusinessRuleError &&
        err.code === 'MIN_ORDER_NOT_MET' &&
        err.status === 422
    );
  });

  it('rejects inactive delivery zones', () => {
    assert.throws(
      () =>
        computeAuthoritativeOrderTotals(
          [{ productId: sampleProduct.id, quantity: 1 }],
          productsMap,
          { ...sampleZone, isActive: false }
        ),
      (err: unknown) =>
        err instanceof BusinessRuleError &&
        err.code === 'ZONE_UNAVAILABLE' &&
        err.status === 422
    );
  });
});

describe('validateOrderStatusTransition (BR-004 & RBAC)', () => {
  it('allows valid forward lifecycle transitions for staff', () => {
    assert.doesNotThrow(() => validateOrderStatusTransition('new', 'accepted', 'staff'));
    assert.doesNotThrow(() =>
      validateOrderStatusTransition('accepted', 'in_preparation', 'staff')
    );
    assert.doesNotThrow(() =>
      validateOrderStatusTransition('in_preparation', 'out_for_delivery', 'staff')
    );
    assert.doesNotThrow(() =>
      validateOrderStatusTransition('out_for_delivery', 'delivered', 'staff')
    );
  });

  it('forbids staff from cancelling or marking undelivered', () => {
    assert.throws(
      () =>
        validateOrderStatusTransition('new', 'cancelled', 'staff', 'العميل ألغى الطلب'),
      (err: unknown) =>
        err instanceof BusinessRuleError && err.code === 'FORBIDDEN' && err.status === 403
    );
    assert.throws(
      () =>
        validateOrderStatusTransition(
          'out_for_delivery',
          'undelivered',
          'staff',
          'لم يتم الرد على الهاتف'
        ),
      (err: unknown) =>
        err instanceof BusinessRuleError && err.code === 'FORBIDDEN' && err.status === 403
    );
  });

  it('allows manager cancellation with valid reason and blocks short reason', () => {
    assert.throws(
      () => validateOrderStatusTransition('new', 'cancelled', 'manager', 'قصير'),
      (err: unknown) =>
        err instanceof BusinessRuleError && err.code === 'VALIDATION_ERROR'
    );
    assert.doesNotThrow(() =>
      validateOrderStatusTransition('new', 'cancelled', 'manager', 'بناءً على طلب العميل')
    );
  });

  it('forbids mutating terminal order states', () => {
    assert.throws(
      () =>
        validateOrderStatusTransition('delivered', 'cancelled', 'manager', 'محاولة إلغاء'),
      (err: unknown) =>
        err instanceof BusinessRuleError && err.code === 'INVALID_TRANSITION'
    );
  });
});

describe('BR-009 Product Deletion & EC-09 Zone Deletion', () => {
  const sampleOrders: Order[] = [
    {
      id: 'ord-1',
      orderNumber: 'CL-2025-0001',
      customer: {
        fullName: 'أحمد',
        phone: '0599123456',
        zoneId: 'zone-center',
        streetAddress: 'البلد',
      },
      items: [
        {
          id: 'i-1',
          productId: 'prod-1',
          productName: 'بقلاوة',
          productSlug: 'mixed-baklava',
          imageUrl: '/images/catalog/baklava-pistachio.jpg',
          unitPrice: 55,
          unit: 'kg',
          quantity: 1,
          lineTotal: 55,
        },
      ],
      subtotal: 55,
      deliveryFee: 10,
      total: 65,
      paymentMethod: 'cash_on_delivery',
      status: 'in_preparation',
      timeline: [{ status: 'in_preparation', timestamp: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it('archives products referenced in historical orders and deletes unreferenced products', () => {
    assert.deepEqual(evaluateProductDeletion('prod-1', sampleOrders), {
      mode: 'archive',
      referencedOrdersCount: 1,
    });
    assert.deepEqual(evaluateProductDeletion('prod-999', sampleOrders), {
      mode: 'delete',
      referencedOrdersCount: 0,
    });
  });

  it('blocks deleting a delivery zone referenced by active orders', () => {
    assert.deepEqual(evaluateZoneDeletion('zone-center', sampleOrders), {
      allowed: false,
      activeOrdersCount: 1,
    });
    assert.deepEqual(evaluateZoneDeletion('zone-other', sampleOrders), {
      allowed: true,
      activeOrdersCount: 0,
    });
  });
});

describe('Admin User Mutation Guards', () => {
  const mgr1: AdminUser = {
    id: 'usr-1',
    username: 'manager1',
    email: 'manager1@candyloz.ps',
    fullName: 'المدير الأول',
    role: 'manager',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  const staff1: AdminUser = {
    id: 'usr-2',
    username: 'staff1',
    email: 'staff1@candyloz.ps',
    fullName: 'موظف',
    role: 'staff',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  it('prevents self-deactivation and removing the last active manager', () => {
    assert.throws(
      () => validateAdminUserMutation(mgr1, { isActive: false }, [mgr1, staff1], 'usr-1'),
      (err: unknown) =>
        err instanceof BusinessRuleError && err.code === 'SELF_DEACTIVATION_FORBIDDEN'
    );
    assert.throws(
      () => validateAdminUserMutation(mgr1, { role: 'staff' }, [mgr1, staff1], 'usr-other'),
      (err: unknown) =>
        err instanceof BusinessRuleError && err.code === 'LAST_MANAGER_GUARD'
    );
  });
});

describe('Password Hashing & Session Token Lifecycle', () => {
  it('hashes and verifies passwords with scrypt', () => {
    const hash = hashPassword('CandyLoz#2026!');
    assert.equal(verifyPassword('CandyLoz#2026!', hash), true);
    assert.equal(verifyPassword('WrongPassword', hash), false);
  });

  it('signs, verifies, and revokes HMAC-SHA256 session tokens', () => {
    const token = signSessionToken({ id: 'usr-1', role: 'manager' });
    const payload = verifySessionToken(token);
    assert.ok(payload);
    assert.equal(payload.sub, 'usr-1');
    assert.equal(payload.role, 'manager');

    revokeSessionToken(token);
    assert.equal(verifySessionToken(token), null);
  });
});

describe('slugifySafe', () => {
  it('lowercases, strips punctuation, and collapses separators', () => {
    assert.equal(slugifySafe('Mixed Baklava Extra!'), 'mixed-baklava-extra');
    assert.equal(slugifySafe('hello  world__test--x'), 'hello-world-test-x');
    assert.equal(slugifySafe('  Kunafa-Nabulsia  '), 'kunafa-nabulsia');
  });

  it('falls back with the given prefix for Arabic-only or too-short input', () => {
    const arabicSlug = slugifySafe('بقلاوة', 'sweet');
    assert.ok(arabicSlug.startsWith('sweet-'), `expected sweet- fallback, got ${arabicSlug}`);
    assert.equal(slugifySafe('a', 'sweet').startsWith('sweet-'), true);
    assert.equal(slugifySafe('', 'category').startsWith('category-'), true);
  });
});

describe('computeAuthoritativeOrderTotals - edge cases', () => {
  const productsMap = new Map<string, Product>([
    [sampleProduct.id, sampleProduct],
  ]);

  it('rejects an empty cart with VALIDATION_ERROR (400)', () => {
    assert.throws(
      () => computeAuthoritativeOrderTotals([], productsMap, sampleZone),
      (err: unknown) =>
        err instanceof BusinessRuleError && err.code === 'VALIDATION_ERROR' && err.status === 400
    );
  });

  it('rejects quantities outside 1-50 or non-numeric', () => {
    for (const badQty of [0, 51, -3, 'abc']) {
      assert.throws(
        () =>
          computeAuthoritativeOrderTotals(
            [{ productId: sampleProduct.id, quantity: badQty as unknown as number }],
            productsMap,
            sampleZone
          ),
        (err: unknown) =>
          err instanceof BusinessRuleError && err.code === 'VALIDATION_ERROR' && err.status === 400,
        `quantity ${badQty} should be rejected`
      );
    }
  });

  it('rejects unknown or archived products with PRODUCT_NOT_FOUND (422)', () => {
    assert.throws(
      () =>
        computeAuthoritativeOrderTotals(
          [{ productId: 'prod-missing', quantity: 1 }],
          productsMap,
          sampleZone
        ),
      (err: unknown) =>
        err instanceof BusinessRuleError && err.code === 'PRODUCT_NOT_FOUND' && err.status === 422
    );

    const archivedMap = new Map<string, Product>([
      [sampleProduct.id, { ...sampleProduct, isArchived: true } as Product],
    ]);
    assert.throws(
      () =>
        computeAuthoritativeOrderTotals(
          [{ productId: sampleProduct.id, quantity: 1 }],
          archivedMap,
          sampleZone
        ),
      (err: unknown) => err instanceof BusinessRuleError && err.code === 'PRODUCT_NOT_FOUND'
    );
  });

  it('matches weight options by multiplier and applies their sale price', () => {
    const result = computeAuthoritativeOrderTotals(
      [{ productId: sampleProduct.id, quantity: 2, selectedWeightMultiplier: 0.5 }],
      productsMap,
      sampleZone
    );
    // نصف كيلو sale price 30 + standard packaging 0 => unit 30, line 60
    assert.equal(result.items[0].unitPrice, 30);
    assert.equal(result.items[0].lineTotal, 60);
    assert.equal(result.subtotal, 60);
    assert.equal(result.items[0].selectedWeightLabel, 'نصف كيلو (500 جم)');
  });

  it('falls back to the multiplier-1 weight when the requested weight is unknown', () => {
    const result = computeAuthoritativeOrderTotals(
      [{ productId: sampleProduct.id, quantity: 1, selectedWeightMultiplier: 9 }],
      productsMap,
      sampleZone
    );
    // fallback: 1 كيلو sale price 55
    assert.equal(result.items[0].selectedWeightMultiplier, 1);
    assert.equal(result.items[0].unitPrice, 55);
  });

  it('trims gift messages and caps them at 120 characters', () => {
    const longMessage = `  ${'أ'.repeat(200)}  `;
    const result = computeAuthoritativeOrderTotals(
      [{ productId: sampleProduct.id, quantity: 1, giftMessage: longMessage }],
      productsMap,
      sampleZone
    );
    assert.equal(result.items[0].giftMessage?.length, 120);

    const blank = computeAuthoritativeOrderTotals(
      [{ productId: sampleProduct.id, quantity: 1, giftMessage: '   ' }],
      productsMap,
      sampleZone
    );
    assert.equal(blank.items[0].giftMessage, undefined);
  });
});
