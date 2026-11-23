import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/server/http';

export const dynamic = 'force-dynamic';

function isDevToolsAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_TOOLS === 'true';
}

const OPENAPI_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'Candy Loz API (كاندي لوز)',
    version: '1.0.0',
    description:
      'Storefront & Admin Portal REST API for Candy Loz luxury patisserie. Supports local persistent mode and transparent Django upstream proxy via BACKEND_API_URL.',
  },
  servers: [{ url: '/api/v1', description: 'Current host API v1' }],
  tags: [
    { name: 'System', description: 'Health and developer diagnostics' },
    { name: 'Storefront', description: 'Public catalog, delivery zones, checkout & order tracking' },
    { name: 'Admin Auth', description: 'Session authentication & password management' },
    { name: 'Admin Operations', description: 'Protected orders, products, categories, zones & user management' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      sessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'candy_loz_session',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'API health & active backend mode',
        responses: { '200': { description: 'Healthy status payload' } },
      },
    },
    '/categories': {
      get: {
        tags: ['Storefront'],
        summary: 'List active storefront categories',
        responses: { '200': { description: 'Array of categories' } },
      },
    },
    '/products': {
      get: {
        tags: ['Storefront'],
        summary: 'List available products with optional search, category, featured & sort filters',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'featured', in: 'query', schema: { type: 'boolean' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['featured', 'price_asc', 'price_desc', 'newest'] } },
        ],
        responses: { '200': { description: 'Array of products' } },
      },
    },
    '/products/{slug}': {
      get: {
        tags: ['Storefront'],
        summary: 'Get a single product by slug',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Product detail' }, '404': { description: 'Not found' } },
      },
    },
    '/delivery-zones': {
      get: {
        tags: ['Storefront'],
        summary: 'List active delivery zones with fees and minimum order amounts',
        responses: { '200': { description: 'Array of delivery zones' } },
      },
    },
    '/orders': {
      post: {
        tags: ['Storefront'],
        summary: 'Create a customer order with authoritative server-side pricing & Idempotency-Key support',
        parameters: [
          {
            name: 'Idempotency-Key',
            in: 'header',
            required: false,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '201': { description: 'Order created with scoped trackingToken' },
          '422': { description: 'Validation, stock, or minimum order error' },
        },
      },
    },
    '/orders/receipt': {
      get: {
        tags: ['Storefront'],
        summary: 'Fetch an order receipt using orderNumber + scoped tracking token',
        parameters: [
          { name: 'orderNumber', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'token', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Order receipt' }, '403': { description: 'Invalid token' } },
      },
    },
    '/orders/track': {
      post: {
        tags: ['Storefront'],
        summary: 'Rate-limited order tracking by orderNumber + customer phone (059/056)',
        responses: {
          '200': { description: 'Order status and timeline' },
          '404': { description: 'Order/phone mismatch' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/admin/auth/login': {
      post: {
        tags: ['Admin Auth'],
        summary: 'Authenticate admin user and issue HttpOnly session cookie + bearer token',
        responses: { '200': { description: 'Authenticated user & token' }, '401': { description: 'Invalid credentials' } },
      },
    },
    '/admin/auth/demo-login': {
      post: {
        tags: ['Admin Auth'],
        summary: 'Preview quick sign-in as manager or staff (disabled when ALLOW_DEMO_LOGIN=false)',
        responses: { '200': { description: 'Authenticated demo user' }, '403': { description: 'Disabled' } },
      },
    },
    '/admin/auth/me': {
      get: {
        tags: ['Admin Auth'],
        summary: 'Get currently authenticated admin user profile',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        responses: { '200': { description: 'Current user' }, '401': { description: 'Unauthenticated' } },
      },
    },
    '/admin/auth/logout': {
      post: {
        tags: ['Admin Auth'],
        summary: 'Revoke current session token and clear HttpOnly cookie',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        responses: { '200': { description: 'Logged out' } },
      },
    },
    '/admin/auth/change-password': {
      post: {
        tags: ['Admin Auth'],
        summary: 'Change current authenticated user password',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        responses: { '200': { description: 'Password updated' } },
      },
    },
    '/admin/orders': {
      get: {
        tags: ['Admin Operations'],
        summary: 'List all orders (Staff & Manager)',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        responses: { '200': { description: 'Orders list' } },
      },
    },
    '/admin/orders/{id}': {
      get: {
        tags: ['Admin Operations'],
        summary: 'Get full order details by ID (Staff & Manager)',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Order detail' } },
      },
    },
    '/admin/orders/{id}/status': {
      patch: {
        tags: ['Admin Operations'],
        summary: 'Transition order status enforcing BR-004 lifecycle & Manager-only cancellation/undelivered rules',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated order' }, '403': { description: 'Role forbidden' } },
      },
    },
    '/admin/products': {
      get: {
        tags: ['Admin Operations'],
        summary: 'List all non-archived products (Staff & Manager)',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        responses: { '200': { description: 'Products list' } },
      },
      post: {
        tags: ['Admin Operations'],
        summary: 'Create product (Manager only)',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        responses: { '201': { description: 'Created product' } },
      },
    },
    '/admin/products/{id}': {
      patch: {
        tags: ['Admin Operations'],
        summary: 'Update product (Manager only)',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated product' } },
      },
      delete: {
        tags: ['Admin Operations'],
        summary: 'Delete or archive product per BR-009 (Manager only)',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Deleted or archived status' } },
      },
    },
    '/admin/products/{id}/availability': {
      patch: {
        tags: ['Admin Operations'],
        summary: 'Toggle product availability (Staff & Manager)',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated availability' } },
      },
    },
    '/admin/categories': {
      get: {
        tags: ['Admin Operations'],
        summary: 'List all categories (Staff & Manager)',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        responses: { '200': { description: 'Categories list' } },
      },
      post: {
        tags: ['Admin Operations'],
        summary: 'Create category (Manager only)',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        responses: { '201': { description: 'Created category' } },
      },
    },
    '/admin/delivery-zones': {
      get: {
        tags: ['Admin Operations'],
        summary: 'List all delivery zones (Staff & Manager)',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        responses: { '200': { description: 'Zones list' } },
      },
      post: {
        tags: ['Admin Operations'],
        summary: 'Create delivery zone (Manager only)',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        responses: { '201': { description: 'Created zone' } },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin Operations'],
        summary: 'List admin users (Manager only)',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        responses: { '200': { description: 'Admin users list' } },
      },
      post: {
        tags: ['Admin Operations'],
        summary: 'Create admin user (Manager only)',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        responses: { '201': { description: 'Created user' } },
      },
    },
    '/dev/reset': {
      post: {
        tags: ['System'],
        summary: 'Reset local backend DB to fresh seed data (Dev only, Manager session required)',
        security: [{ sessionCookie: [] }, { bearerAuth: [] }],
        responses: { '200': { description: 'Database reset summary' }, '404': { description: 'Disabled in production' } },
      },
    },
  },
};

export async function GET(_req: NextRequest) {
  if (!isDevToolsAllowed()) {
    return apiError('NOT_FOUND', 'هذا المسار غير متاح في بيئة الإنتاج', 404);
  }
  return NextResponse.json(OPENAPI_SPEC, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
