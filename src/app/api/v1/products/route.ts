import { NextRequest } from 'next/server';
import { getDb } from '@/server/db';
import { apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const proxied = await proxyToUpstreamIfConfigured(req, '/api/v1/products');
    if (proxied) return proxied;

    const db = getDb();
    const { searchParams } = new URL(req.url);
    const categoryParam = searchParams.get('category')?.trim() || '';
    const searchParam = searchParams.get('search')?.trim().toLowerCase() || '';
    const featuredParam = searchParams.get('featured');
    const availableParam = searchParams.get('available');
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)));

    let list = db.products.filter((p) => !p.isArchived);

    if (categoryParam && categoryParam !== 'all') {
      const cat = db.categories.find(
        (c) => c.id === categoryParam || c.slug === categoryParam
      );
      if (cat) {
        list = list.filter((p) => p.categoryId === cat.id);
      } else {
        list = [];
      }
    }

    if (searchParam) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(searchParam) ||
          (p.nameEn && p.nameEn.toLowerCase().includes(searchParam)) ||
          p.description.toLowerCase().includes(searchParam)
      );
    }

    if (featuredParam === 'true') {
      list = list.filter((p) => p.isFeatured);
    }

    if (availableParam === 'true') {
      list = list.filter((p) => p.isAvailable);
    }

    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const paged = list.slice(start, start + limit).map(({ isArchived: _archived, ...pub }) => pub);

    return apiOk(paged, {
      page,
      limit,
      total,
      totalItems: total,
      totalPages,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
