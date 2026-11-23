import { NextRequest } from 'next/server';
import type { AdminRole } from '@/types';
import { requireAdmin } from '@/server/guard';
import { getDb, sanitizeAdminUser, saveDb } from '@/server/db';
import { validateAdminUserMutation } from '@/server/business-rules';
import { apiError, apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = decodeURIComponent(context.params.id);
    const proxied = await proxyToUpstreamIfConfigured(
      req,
      `/api/v1/admin/users/${encodeURIComponent(id)}`
    );
    if (proxied) return proxied;

    const auth = requireAdmin(req, { managerOnly: true });
    if (!auth.ok) return auth.response;

    const db = getDb();
    const target = db.users.find((u) => u.id === id);
    if (!target) {
      return apiError('USER_NOT_FOUND', 'المستخدم غير موجود', 404);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return apiError('VALIDATION_ERROR', 'بيانات التحديث غير صالحة', 400);
    }

    const patchRole: AdminRole | undefined =
      body.role === 'manager' || body.role === 'staff' ? body.role : undefined;
    const patchActive: boolean | undefined =
      typeof body.isActive === 'boolean'
        ? body.isActive
        : typeof body.is_active === 'boolean'
        ? body.is_active
        : undefined;

    validateAdminUserMutation(
      sanitizeAdminUser(target),
      { role: patchRole, isActive: patchActive },
      db.users.map(sanitizeAdminUser),
      auth.user.id
    );

    if (patchRole) target.role = patchRole;
    if (patchActive !== undefined) target.isActive = patchActive;
    if (body.fullName !== undefined && String(body.fullName).trim().length >= 2) {
      target.fullName = String(body.fullName).trim();
    }
    if (body.jobTitle !== undefined) {
      target.jobTitle = String(body.jobTitle).trim();
    }

    saveDb(db);
    return apiOk(sanitizeAdminUser(target));
  } catch (err) {
    return handleRouteError(err);
  }
}
