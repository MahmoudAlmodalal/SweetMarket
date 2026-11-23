import { NextRequest } from 'next/server';
import {
  clearAuthCookie,
  clearRefreshCookie,
  extractTokenFromRequest,
  REFRESH_COOKIE_NAME,
  revokeSessionToken,
} from '@/server/auth';
import { apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const refreshCookie = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
    let overrideBody: string | undefined;
    if (process.env.BACKEND_API_URL?.trim()) {
      const raw = await req.text().catch(() => '');
      let parsed: Record<string, unknown> = {};
      try {
        parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      } catch {
        parsed = {};
      }
      if (!parsed.refresh && refreshCookie) {
        parsed.refresh = refreshCookie;
      }
      overrideBody = JSON.stringify(parsed);
    }

    const proxied = await proxyToUpstreamIfConfigured(req, '/api/v1/admin/auth/logout', {
      overrideBody,
    });
    if (proxied) {
      clearAuthCookie(proxied);
      clearRefreshCookie(proxied);
      return proxied;
    }

    const { token } = extractTokenFromRequest(req);
    if (token) {
      revokeSessionToken(token);
    }

    const res = apiOk({ loggedOut: true });
    clearAuthCookie(res);
    clearRefreshCookie(res);
    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}
