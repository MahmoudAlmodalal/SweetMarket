import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptCategory,
  adaptProduct,
  adaptDeliveryZone,
  adaptOrder,
  adaptAdminUser,
} from './api-adapters';

describe('API Adapters (Next.js camelCase & Django DRF snake_case)', () => {
  it('adapts snake_case Django category payload', () => {
    const cat = adaptCategory({
      id: 'cat-1',
      slug: 'baklava-eastern',
      name: 'البقلاوة والحلويات الشرقية',
      description: 'بقلاوة بالسمن البلدي',
      image_url: '/images/catalog/baklava-pistachio.jpg',
      display_order: 1,
      is_active: true,
    });

    assert.equal(cat.slug, 'baklava-eastern');
    assert.equal(cat.imageUrl, '/images/catalog/baklava-pistachio.jpg');
    assert.equal(cat.displayOrder, 1);
    assert.equal(cat.isActive, true);
  });

  it('adapts snake_case Django product payload with weight options', () => {
    const prod = adaptProduct({
      id: 'prod-1',
      slug: 'royal-baklava',
      name: 'بقلاوة ملكية',
      category_id: 'cat-1',
      price: '65.00',
      sale_price: '55.00',
      unit: 'kg',
      image_url: '/images/catalog/baklava-pistachio.jpg',
      is_available: true,
      is_featured: true,
      available_weights: [
        { label: '500 جم', multiplier: 0.5, price: '35.00', sale_price: '30.00' },
      ],
    });

    assert.equal(prod.categoryId, 'cat-1');
    assert.equal(prod.price, 65);
    assert.equal(prod.salePrice, 55);
    assert.equal(prod.isAvailable, true);
    assert.equal(prod.isFeatured, true);
    assert.equal(prod.availableWeights?.[0].salePrice, 30);
  });

  it('adapts snake_case delivery zone payload', () => {
    const zone = adaptDeliveryZone({
      id: 'zone-1',
      name: 'خان يونس - البلد',
      delivery_fee: '10.00',
      min_order_amount: '50.00',
      estimated_time_min: 30,
      estimated_time_max: 45,
      is_active: true,
    });

    assert.equal(zone.deliveryFee, 10);
    assert.equal(zone.minOrderAmount, 50);
    assert.equal(zone.estimatedTimeMin, 30);
    assert.equal(zone.estimatedTimeMax, 45);
    assert.equal(zone.isActive, true);
  });

  it('adapts snake_case order with nested items and timeline', () => {
    const order = adaptOrder({
      id: 'ord-1',
      order_number: 'CL-2026-1001',
      status: 'in_preparation',
      created_at: '2026-01-01T10:00:00Z',
      updated_at: '2026-01-01T10:05:00Z',
      customer: {
        name: 'خالد الأسطل',
        phone: '0599123456',
        zone_id: 'zone-1',
        street_address: 'شارع جلال',
      },
      items: [
        {
          id: 'item-1',
          product_id: 'prod-1',
          product_name: 'بقلاوة ملكية',
          product_slug: 'royal-baklava',
          product_image_url: '/images/catalog/baklava-pistachio.jpg',
          unit_price: '67.00',
          packaging_fee: '12.00',
          quantity: 2,
          line_total: '134.00',
        },
      ],
      subtotal: '134.00',
      delivery_fee: '10.00',
      total: '144.00',
      tracking_token: 'tok-abc',
      timeline: [
        {
          to_status: 'in_preparation',
          created_at: '2026-01-01T10:05:00Z',
          reason: 'بدأ التجهيز',
          performed_by: { id: 'usr-1', full_name: 'سارة', role: 'staff' },
        },
      ],
    });

    assert.equal(order.orderNumber, 'CL-2026-1001');
    assert.equal(order.customer.fullName, 'خالد الأسطل');
    assert.equal(order.customer.zoneId, 'zone-1');
    assert.equal(order.items[0].packagingOptionId, 'royal');
    assert.equal(order.items[0].lineTotal, 134);
    assert.equal(order.deliveryFee, 10);
    assert.equal(order.total, 144);
    assert.equal(order.trackingToken, 'tok-abc');
    assert.equal(order.timeline?.[0].performedBy?.name, 'سارة');
  });

  it('adapts admin user from snake_case payload', () => {
    const user = adaptAdminUser({
      id: 'usr-1',
      username: 'manager',
      full_name: 'محمد الفرا',
      email: 'manager@candyloz.com',
      role: 'manager',
      is_active: true,
    });

    assert.equal(user.fullName, 'محمد الفرا');
    assert.equal(user.role, 'manager');
    assert.equal(user.isActive, true);
  });
});
