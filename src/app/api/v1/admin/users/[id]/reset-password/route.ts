import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { requireAdmin } from '@/server/guard';
import { getDb, sanitizeAdminUser, saveDb } from '@/server/db';
import { generateTemporaryPassword, hashPassword } from '@/server/auth';
import { apiError, apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = decodeURIComponent(context.params.id);
    const proxied = await proxyToUpstreamIfConfigured(
      req,
      `/api/v1/admin/users/${encodeURIComponent(id)}/reset-password`
    );
    if (proxied) return proxied;

    const auth = requireAdmin(req, { managerOnly: true });
    if (!auth.ok) return auth.response;

    const db = getDb();
    const target = db.users.find((u) => u.id === id);
    if (!target) {
      return apiError('USER_NOT_FOUND', 'المستخدم غير موجود', 404);
    }

    const temporaryPassword = generateTemporaryPassword();
    target.passwordHash = hashPassword(temporaryPassword);
    // Invalidate every session minted with a previous stamp, the same as a
    // user-initiated password change; a reset must cut off the old sessions.
    // The random suffix guarantees consecutive resets never reuse a stamp.
    target.passwordChangedAt = `${new Date().toISOString()}#${crypto.randomUUID().slice(0, 8)}`;
    saveDb(db);

    return apiOk({
      user: sanitizeAdminUser(target),
      temporaryPassword,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
