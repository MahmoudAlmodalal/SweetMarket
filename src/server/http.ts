import { NextRequest, NextResponse } from 'next/server';
import { BusinessRuleError } from './business-rules';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalItems: number;
  totalPages: number;
}

export function apiOk<T>(data: T, meta?: PaginationMeta | null, status = 200): NextResponse {
  const body: Record<string, unknown> = {
    success: true,
    data,
  };
  if (meta !== undefined && meta !== null) {
    body.meta = meta;
  }
  return NextResponse.json(body, { status });
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: Array<{ field: string; message: string }>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && details.length > 0 ? { details } : {}),
      },
    },
    { status }
  );
}

export function handleRouteError(err: unknown): NextResponse {
  if (err instanceof BusinessRuleError) {
    return apiError(err.code, err.message, err.status, err.details);
  }
  console.error('[API Error]', err);
  return apiError('INTERNAL_ERROR', 'حدث خطأ داخلي غير متوقع في الخادم', 500);
}

// ============================================================================
// Rate limiter for public Order Tracking (BR-010: max 5 failed attempts / 15m)
// ============================================================================
const TRACK_MAX_FAILED = 5;
const TRACK_WINDOW_MS = 15 * 60 * 1000;

interface RateEntry {
  count: number;
  resetAt: number;
}

const globalForRate = globalThis as unknown as {
  __candyTrackRateMap?: Map<string, RateEntry>;
};

function getRateMap(): Map<string, RateEntry> {
  if (!globalForRate.__candyTrackRateMap) {
    globalForRate.__candyTrackRateMap = new Map<string, RateEntry>();
  }
  return globalForRate.__candyTrackRateMap;
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

export function checkTrackingRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const map = getRateMap();
  const entry = map.get(ip);
  const now = Date.now();
  if (!entry || entry.resetAt <= now) {
    map.delete(ip);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (entry.count >= TRACK_MAX_FAILED) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordFailedTrackingAttempt(ip: string): {
  attempts: number;
  locked: boolean;
  retryAfterSeconds: number;
} {
  const map = getRateMap();
  const now = Date.now();
  const current = map.get(ip);
  if (!current || current.resetAt <= now) {
    const next: RateEntry = { count: 1, resetAt: now + TRACK_WINDOW_MS };
    map.set(ip, next);
    return { attempts: 1, locked: false, retryAfterSeconds: 0 };
  }

  current.count += 1;
  map.set(ip, current);
  const locked = current.count >= TRACK_MAX_FAILED;
  return {
    attempts: current.count,
    locked,
    retryAfterSeconds: locked ? Math.max(1, Math.ceil((current.resetAt - now) / 1000)) : 0,
  };
}

export function clearTrackingRateLimit(ip: string): void {
  getRateMap().delete(ip);
}

/**
 * Validate configured BACKEND_API_URL scheme (only http: or https: allowed).
 */
function parseConfiguredUpstreamUrl(rawBase: string | undefined): URL | null {
  const trimmed = rawBase?.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Lightweight readiness check against the configured Django upstream backend.
 */
export async function pingUpstreamHealth(): Promise<{
  configured: boolean;
  reachable: boolean;
  statusCode?: number;
}> {
  const base = parseConfiguredUpstreamUrl(process.env.BACKEND_API_URL);
  if (!base) {
    return { configured: false, reachable: false };
  }

  try {
    const target = `${base.toString().replace(/\/+$/, '')}/api/v1/health/`;
    const headers = new Headers({ Accept: 'application/json' });
    const internalSecret = process.env.BACKEND_INTERNAL_SECRET?.trim();
    if (internalSecret) {
      headers.set('X-Backend-Internal-Secret', internalSecret);
    }

    const res = await fetch(target, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
    return {
      configured: true,
      reachable: res.ok,
      statusCode: res.status,
    };
  } catch {
    return { configured: true, reachable: false };
  }
}

/**
 * Transparent upstream proxy when BACKEND_API_URL is configured (e.g., Django DRF in /backend).
 * - Automatically bridges Next.js HttpOnly cookie (`candy_admin_token`) to `Authorization: Bearer`.
 * - Attaches optional server-to-server `X-Backend-Internal-Secret` header.
 * - Honors `BACKEND_STRICT_PROXY=true` (returns 502 instead of falling back to local JSON DB).
 */
export async function proxyToUpstreamIfConfigured(
  req: NextRequest,
  apiSubPath: string,
  options?: { overrideBody?: string }
): Promise<NextResponse | null> {
  const base = parseConfiguredUpstreamUrl(process.env.BACKEND_API_URL);
  if (!base) return null;

  const strictProxy = process.env.BACKEND_STRICT_PROXY === 'true';

  try {
    const url = new URL(`${base.toString().replace(/\/+$/, '')}${apiSubPath}`);
    const reqUrl = new URL(req.url);
    reqUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const headers = new Headers();
    const forwardHeaders = ['authorization', 'content-type', 'idempotency-key', 'accept'];
    for (const h of forwardHeaders) {
      const val = req.headers.get(h);
      if (val) headers.set(h, val);
    }

    // Bridge HttpOnly cookie session to Django SimpleJWT Bearer authentication
    if (!headers.has('authorization')) {
      const cookieToken = req.cookies.get('candy_admin_token')?.value;
      if (cookieToken) {
        headers.set('authorization', `Bearer ${cookieToken}`);
      }
    }

    // Optional server-to-server shared secret
    const internalSecret = process.env.BACKEND_INTERNAL_SECRET?.trim();
    if (internalSecret) {
      headers.set('x-backend-internal-secret', internalSecret);
    }

    const init: RequestInit = {
      method: req.method,
      headers,
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = options?.overrideBody !== undefined ? options.overrideBody : await req.text();
    }

    const upstreamRes = await fetch(url.toString(), init);
    const bodyText = await upstreamRes.text();
    const responseHeaders = new Headers();
    responseHeaders.set(
      'content-type',
      upstreamRes.headers.get('content-type') || 'application/json; charset=utf-8'
    );

    return new NextResponse(bodyText, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.warn('[Upstream Proxy] Failed to reach BACKEND_API_URL:', err);
    if (strictProxy) {
      return apiError(
        'UPSTREAM_UNAVAILABLE',
        'تعذّر الاتصال بالخادم الخلفي حالياً، يرجى المحاولة بعد قليل',
        502
      );
    }
    return null;
  }
}
