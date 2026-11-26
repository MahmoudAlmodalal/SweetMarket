import { NextRequest } from 'next/server';
import { requireAdmin } from '@/server/guard';
import { getDb, saveDb } from '@/server/db';
import { hashPassword, verifyPassword } from '@/server/auth';
import { apiError, apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const proxied = await proxyToUpstreamIfConfigured(
      req,
      '/api/v1/admin/auth/change-password'
    );
    if (proxied) return proxied;

    const auth = requireAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return apiError('VALIDATION_ERROR', 'يرجى تعبئة حقول كلمة المرور', 400);
    }

    const currentPassword = String(body.currentPassword ?? body.current_password ?? '');
    const newPassword = String(body.newPassword ?? body.new_password ?? '');

    if (!currentPassword || !newPassword) {
      return apiError('VALIDATION_ERROR', 'كلمة المرور الحالية والجديدة مطلوبة', 400);
    }

    if (!verifyPassword(currentPassword, auth.user.passwordHash)) {
      return apiError('INVALID_CREDENTIALS', 'كلمة المرور الحالية غير صحيحة', 400, [
        { field: 'currentPassword', message: 'كلمة المرور الحالية غير متطابقة' },
      ]);
    }

    if (newPassword.length < 6) {
      return apiError(
        'VALIDATION_ERROR',
        'يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل',
        400,
        [{ field: 'newPassword', message: 'الحد الأدنى 6 أحرف' }]
      );
    }

    if (currentPassword === newPassword) {
      return apiError(
        'VALIDATION_ERROR',
        'يجب أن تختلف كلمة المرور الجديدة عن كلمة المرور الحالية',
        400,
        [{ field: 'newPassword', message: 'اختر كلمة مرور جديدة مختلفة' }]
      );
    }

    const db = getDb();
    const target = db.users.find((u) => u.id === auth.user.id);
    if (target) {
      target.passwordHash = hashPassword(newPassword);
      // Invalidate every session issued up to this moment (including this one);
      // the next request must authenticate with the new password.
      target.passwordChangedAt = new Date().toISOString();
      saveDb(db);
    }

    return apiOk({ updated: true, message: 'تم تحديث كلمة المرور بنجاح' });
  } catch (err) {
    return handleRouteError(err);
  }
}
