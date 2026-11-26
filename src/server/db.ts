import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AdminUser, Category, DeliveryZone, Order, Product } from '@/types';
import { MOCK_CATEGORIES } from '@/data/mock/categories';
import { MOCK_PRODUCTS } from '@/data/mock/products';
import { MOCK_DELIVERY_ZONES } from '@/data/mock/zones';
import { MOCK_ORDERS } from '@/data/mock/orders';
import { MOCK_ADMIN_USERS } from '@/data/mock/users';
import { hashPassword, generateTrackingToken } from './auth';

export interface StoredProduct extends Product {
  isArchived?: boolean;
}

export interface StoredAdminUser extends AdminUser {
  passwordHash: string;
  /**
   * Opaque revocation stamp of the last password change (ISO time + unique
   * suffix so consecutive changes always differ). Sessions minted before the
   * change carry the old stamp (or none) and are rejected by requireAdmin.
   */
  passwordChangedAt?: string;
}

/** jti -> exp (seconds) of explicitly revoked session tokens (e.g. logout). */
export type RevokedJtiMap = Record<string, number>;

export interface CandyLozDatabase {
  version: number;
  categories: Category[];
  products: StoredProduct[];
  zones: DeliveryZone[];
  orders: Order[];
  users: StoredAdminUser[];
  idempotencyMap: Record<string, string>; // Idempotency-Key -> Order ID
  revokedJtis?: RevokedJtiMap;
}

// High-resolution studio photography mapped cleanly to our catalog
export const STUDIO_IMAGE_MAP: Record<string, string> = {
  'prod-baklava-mixed': '/images/catalog/baklava-pistachio.jpg',
  'prod-baklava-fingers': '/images/catalog/baklava-pistachio.jpg',
  'prod-baklava-mabrouma': '/images/catalog/baklava-pistachio.jpg',
  'prod-cake-fudge': '/images/catalog/belgian-fudge-cake.jpg',
  'prod-cake-berry': '/images/catalog/belgian-fudge-cake.jpg',
  'prod-cake-red-velvet': '/images/catalog/belgian-fudge-cake.jpg',
  'prod-kunafa-nabulsia': '/images/catalog/kunafa-nabulsia.jpg',
  'prod-kunafa-cream': '/images/catalog/kunafa-nabulsia.jpg',
  'prod-chocolate-royal-box': '/images/catalog/royal-chocolate-box.jpg',
  'prod-chocolate-praline': '/images/catalog/royal-chocolate-box.jpg',
  'prod-petit-fours-mix': '/images/catalog/royal-chocolate-box.jpg',
  'prod-ghraybeh-pistachio': '/images/catalog/hero-assortment.jpg',
};

export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'cat-baklava': '/images/catalog/baklava-pistachio.jpg',
  'cat-cakes': '/images/catalog/belgian-fudge-cake.jpg',
  'cat-kunafa': '/images/catalog/kunafa-nabulsia.jpg',
  'cat-chocolate': '/images/catalog/royal-chocolate-box.jpg',
  'cat-petit-fours': '/images/catalog/hero-assortment.jpg',
};

const DB_VERSION = 2;

function getDbFilePath(): string {
  if (process.env.CANDY_LOZ_DB_PATH) {
    return path.resolve(process.env.CANDY_LOZ_DB_PATH);
  }
  return path.join(os.tmpdir(), 'candy-loz-backend-db.json');
}

function buildSeedDatabase(): CandyLozDatabase {
  const seededCategories: Category[] = MOCK_CATEGORIES.map((c) => ({
    ...c,
    imageUrl: CATEGORY_IMAGE_MAP[c.id] || c.imageUrl,
  }));

  const seededProducts: StoredProduct[] = MOCK_PRODUCTS.map((p) => {
    const photo = STUDIO_IMAGE_MAP[p.id] || p.imageUrl;
    const gallery = Array.from(
      new Set([
        photo,
        ...(p.galleryImages || []).map((img) => {
          // Upgrade svg gallery entries to matching studio photography
          if (img.includes('baklava') || img.includes('mabrouma')) return '/images/catalog/baklava-pistachio.jpg';
          if (img.includes('kunafa')) return '/images/catalog/kunafa-nabulsia.jpg';
          if (img.includes('cake') || img.includes('velvet')) return '/images/catalog/belgian-fudge-cake.jpg';
          if (img.includes('chocolate') || img.includes('gift') || img.includes('petit')) return '/images/catalog/royal-chocolate-box.jpg';
          return '/images/catalog/hero-assortment.jpg';
        }),
      ])
    );
    return {
      ...p,
      imageUrl: photo,
      galleryImages: gallery,
      isArchived: false,
    };
  });

  const seededOrders: Order[] = MOCK_ORDERS.map((o) => ({
    ...o,
    trackingToken: o.trackingToken || generateTrackingToken(),
    items: o.items.map((item) => ({
      ...item,
      imageUrl: STUDIO_IMAGE_MAP[item.productId] || item.imageUrl,
    })),
  }));

  // Initial hashed password read from env or preview seed value (never exposed to browser bundles)
  const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'CandyLoz2026!';
  const seededUsers: StoredAdminUser[] = MOCK_ADMIN_USERS.map((u) => ({
    ...u,
    passwordHash: hashPassword(initialAdminPassword),
  }));

  return {
    version: DB_VERSION,
    categories: seededCategories,
    products: seededProducts,
    zones: MOCK_DELIVERY_ZONES.map((z) => ({ ...z })),
    orders: seededOrders,
    users: seededUsers,
    idempotencyMap: {},
    revokedJtis: {},
  };
}

const globalForDb = globalThis as unknown as {
  __candyLozDb?: CandyLozDatabase;
};

function loadDbFromDisk(): CandyLozDatabase {
  const filePath = getDbFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw) as CandyLozDatabase;
      if (parsed && parsed.version === DB_VERSION && Array.isArray(parsed.products)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[DB] Failed to load existing database file, re-seeding:', err);
  }

  const fresh = buildSeedDatabase();
  persistDbToDisk(fresh);
  return fresh;
}

function persistDbToDisk(db: CandyLozDatabase): void {
  const filePath = getDbFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error('[DB] Failed to persist database:', err);
  }
}

export function getDb(): CandyLozDatabase {
  if (!globalForDb.__candyLozDb) {
    globalForDb.__candyLozDb = loadDbFromDisk();
  }
  return globalForDb.__candyLozDb;
}

export function saveDb(db: CandyLozDatabase): void {
  globalForDb.__candyLozDb = db;
  persistDbToDisk(db);
}

export function resetDb(): CandyLozDatabase {
  const fresh = buildSeedDatabase();
  saveDb(fresh);
  return fresh;
}

/**
 * Persist a revoked session jti (with its exp) so logout survives restarts.
 * Expired entries are pruned on every write to bound the map's size.
 */
export function recordRevokedJti(jti: string, expSeconds: number): void {
  const db = getDb();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const pruned: RevokedJtiMap = {};
  for (const [id, exp] of Object.entries(db.revokedJtis ?? {})) {
    if (exp > nowSeconds) pruned[id] = exp;
  }
  pruned[jti] = expSeconds;
  db.revokedJtis = pruned;
  saveDb(db);
}

export function isJtiRevoked(jti: string): boolean {
  const db = getDb();
  const exp = db.revokedJtis?.[jti];
  return typeof exp === 'number' && exp > Math.floor(Date.now() / 1000);
}

export function sanitizeAdminUser(user: StoredAdminUser): AdminUser {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    jobTitle: user.jobTitle,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}
