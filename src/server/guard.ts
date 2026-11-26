import { NextRequest, NextResponse } from 'next/server';
import { getDb, StoredAdminUser } from './db';
import {
  extractTokenFromRequest,
  verifyMutationOrigin,
  verifySessionToken,
} from './auth';
import { apiError } from './http';

export interface AdminGuardSuccess {
  ok: true;
  user: StoredAdminUser;
  token: string;
}

export interface AdminGuardFailure {
  ok: false;
  response: NextResponse;
}

export type AdminGuardResult = AdminGuardSuccess | AdminGuardFailure;

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function requireAdmin(
  req: NextRequest,
  options?: { managerOnly?: boolean }
): AdminGuardResult {
  const { token, viaCookie } = extractTokenFromRequest(req);
  if (!token) {
    return {
      ok: false,
      response: apiError('UNAUTHORIZED', 'يرجى تسجيل الدخول للوصول إلى لوحة التحكم', 401),
    };
  }

  if (MUTATION_METHODS.has(req.method.toUpperCase())) {
    if (!verifyMutationOrigin(req, viaCookie)) {
      return {
        ok: false,
        response: apiError('FORBIDDEN', 'مصدر الطلب غير مصرح به', 403),
      };
    }
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return {
      ok: false,
      response: apiError('UNAUTHORIZED', 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى', 401),
    };
  }

  const db = getDb();
  const user = db.users.find((u) => u.id === payload.sub);
  if (!user || !user.isActive) {
    return {
      ok: false,
      response: apiError('UNAUTHORIZED', 'الحساب غير نشط أو غير موجود', 401),
    };
  }

  // Sessions issued at or before the last password change are no longer valid.
  if (user.passwordChangedAt) {
    const changedAtMs = Date.parse(user.passwordChangedAt);
    if (!Number.isNaN(changedAtMs) && payload.iat * 1000 <= changedAtMs) {
      return {
        ok: false,
        response: apiError(
          'UNAUTHORIZED',
          'تم تغيير كلمة المرور، يرجى تسجيل الدخول من جديد',
          401
        ),
      };
    }
  }

  if (options?.managerOnly && user.role !== 'manager') {
    return {
      ok: false,
      response: apiError('FORBIDDEN', 'هذا الإجراء مخصص لمدير النظام فقط', 403),
    };
  }

  return { ok: true, user, token };
}
