import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import type { AdminRole } from '@/types';
import { requireAdmin } from '@/server/guard';
import { getDb, sanitizeAdminUser, saveDb, StoredAdminUser } from '@/server/db';
import { generateTemporaryPassword, hashPassword } from '@/server/auth';
import { apiError, apiOk, handleRouteError, proxyToUpstreamIfConfigured } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const proxied = await proxyToUpstreamIfConfigured(req, '/api/v1/admin/users');
    if (proxied) return proxied;

    const auth = requireAdmin(req, { managerOnly: true });
    if (!auth.ok) return auth.response;

    const db = getDb();
    return apiOk(db.users.map(sanitizeAdminUser));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const proxied = await proxyToUpstreamIfConfigured(req, '/api/v1/admin/users');
    if (proxied) return proxied;

    const auth = requireAdmin(req, { managerOnly: true });
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return apiError('VALIDATION_ERROR', 'بيانات المستخدم غير صالحة', 400);
    }

    const fullName = String(body.fullName ?? body.full_name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const username = String(body.username ?? email.split('@')[0] ?? '')
      .trim()
      .toLowerCase();
    const role: AdminRole = body.role === 'manager' ? 'manager' : 'staff';
    const jobTitle = String(
      body.jobTitle ?? body.job_title ?? (role === 'manager' ? 'مدير فرع' : 'مشرف تشغيل وطلبات')
    ).trim();

    if (fullName.length < 2) {
      return apiError('VALIDATION_ERROR', 'الاسم الكامل مطلوب', 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiError('VALIDATION_ERROR', 'البريد الإلكتروني غير صالح', 400);
    }
    if (username.length < 2) {
      return apiError('VALIDATION_ERROR', 'اسم المستخدم مطلوب', 400);
    }

    const db = getDb();
    if (
      db.users.some(
        (u) => u.email.toLowerCase() === email || u.username.toLowerCase() === username
      )
    ) {
      return apiError(
        'USER_CONFLICT',
        'البريد الإلكتروني أو اسم المستخدم مسجل بالفعل في النظام',
        409
      );
    }

    const temporaryPassword = generateTemporaryPassword();
    const newUser: StoredAdminUser = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      username,
      fullName,
      jobTitle,
      email,
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(temporaryPassword),
    };

    db.users.push(newUser);
    saveDb(db);

    return apiOk(
      {
        user: sanitizeAdminUser(newUser),
        temporaryPassword,
      },
      null,
      201
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
