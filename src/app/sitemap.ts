import type { MetadataRoute } from 'next';
import { getDb } from '@/server/db';
import { getBaseUrl } from '@/lib/structured-data';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  const now = new Date();
  const db = getDb();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/track`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = db.categories
    .filter((c) => c.isActive)
    .map((c) => ({
      url: `${baseUrl}/category/${encodeURIComponent(c.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  const productRoutes: MetadataRoute.Sitemap = db.products
    .filter((p) => !p.isArchived && p.isAvailable)
    .map((p) => ({
      url: `${baseUrl}/product/${encodeURIComponent(p.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
