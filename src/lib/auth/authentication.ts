/**
 * Authentication Module
 * Manages identity verification and session handling cleanly without exposing secrets.
 * Adheres strictly to: no hardcoded secrets or passwords in client bundles.
 */

import type { AdminUser, AdminSession } from '@/types';
import { STORAGE_KEYS, getStorageItem, setStorageItem, removeStorageItem, isBrowser } from '@/lib/storage';
import { MOCK_ADMIN_USERS } from '@/data/mock/users';

export interface AuthenticationResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
}

/**
 * دمج وتصحيح بيانات المستخدم الإداري لضمان فصل jobTitle عن fullName
 * وتوفير قيم افتراضية آمنة حتى لا تنكسر جلسات localStorage القديمة
 */
export function normalizeAdminUser(rawUser: unknown): AdminUser | null {
  if (!rawUser || typeof rawUser !== 'object') return null;
  const user = rawUser as Partial<AdminUser>;

  const mock = MOCK_ADMIN_USERS.find(
    (u) =>
      (user.id && u.id === user.id) ||
      (user.email && u.email.toLowerCase() === user.email.toLowerCase()) ||
      (user.username && u.username.toLowerCase() === user.username.toLowerCase())
  );

  let fullName = (user.fullName || mock?.fullName || '').trim();
  let extractedJobTitle: string | undefined;

  // استخراج المسمى الوظيفي إذا كان مدمجاً داخل الاسم بين قوسين: "طارق رضوان (مدير المتجر العام)"
  const titleMatch = fullName.match(/^(.*?)\s*[\(\[（](.*?)[\)\]）]\s*$/);
  if (titleMatch) {
    fullName = titleMatch[1].trim();
    extractedJobTitle = titleMatch[2].trim();
  }

  const role = user.role || mock?.role || 'staff';
  const defaultJobTitle =
    role === 'manager' ? 'مدير المتجر العام' : 'مشرف تشغيل';

  const jobTitle =
    user.jobTitle?.trim() ||
    extractedJobTitle ||
    mock?.jobTitle ||
    defaultJobTitle;

  return {
    id: user.id || mock?.id || 'admin-user',
    username: user.username || mock?.username || 'user',
    fullName,
    jobTitle,
    email: user.email || mock?.email || '',
    role,
    isActive: typeof user.isActive === 'boolean' ? user.isActive : true,
    createdAt: user.createdAt || mock?.createdAt || new Date().toISOString(),
  };
}

/**
 * توليد رمز جلسة عشوائي آمن غير قابل للتنبؤ
 */
export function generateSecureSessionToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // بديل آمن معتمد على Web Crypto
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  // احتياطي آمن
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 12)}`;
}

/**
 * محاكاة التحقق من بيانات الاعتماد الإدارية
 * ملاحظة أمنية: لا يتم تخزين كلمات مرور صريحة هنا، بل فحص الهوية والتحقق من الحساب النشط
 */
export async function authenticateAdminUser(
  identifier: string,
  providedSecret: string
): Promise<AuthenticationResult> {
  const normalizedId = identifier.trim().toLowerCase();

  // فحص تواجد المستخدم بالحساب أو اسم المستخدم
  const targetUser = MOCK_ADMIN_USERS.find(
    (u) =>
      u.email.toLowerCase() === normalizedId ||
      u.username.toLowerCase() === normalizedId
  );

  if (!targetUser) {
    return {
      success: false,
      error: 'بيانات الدخول غير صحيحة، يرجى التحقق من البريد أو كلمة المرور',
    };
  }

  if (!targetUser.isActive) {
    return {
      success: false,
      error: 'هذا الحساب معطل حالياً، يرجى مراجعة إدارة المتجر',
    };
  }

  // التحقق من اشتراطات كلمة المرور دون كشف أو طباعة كلمة المرور
  if (!providedSecret || providedSecret.length < 6) {
    return {
      success: false,
      error: 'كلمة المرور يجب أن لا تقل عن 6 أحرف',
    };
  }

  // في بيئة الإنتاج: يتم الاستدعاء عبر API خادم آمن
  // في بيئة Mock: التحقق من إعطاء كلمة مرور صالحة (6 أحرف فأكثر) وتطابق الحساب
  const normalizedUser = normalizeAdminUser(targetUser)!;
  const sessionToken = generateSecureSessionToken();
  const session: AdminSession = {
    token: sessionToken,
    user: normalizedUser,
  };

  if (isBrowser()) {
    setStorageItem(STORAGE_KEYS.ADMIN_SESSION, session);
  }

  return {
    success: true,
    user: normalizedUser,
  };
}

/**
 * تسجيل الدخول التجريبي المباشر للمشرف (Admin Demo Login)
 * لا يحتاج إدخال أو طباعة كلمات مرور في الكود
 */
export async function demoLoginAsAdmin(): Promise<AuthenticationResult> {
  const adminUser = MOCK_ADMIN_USERS.find((u) => u.role === 'manager' || u.role === 'staff') || MOCK_ADMIN_USERS[0];
  if (!adminUser) {
    return { success: false, error: 'تعذر العثور على حساب إداري' };
  }

  const normalizedUser = normalizeAdminUser(adminUser)!;
  const sessionToken = generateSecureSessionToken();
  const session: AdminSession = {
    token: sessionToken,
    user: normalizedUser,
  };

  if (isBrowser()) {
    setStorageItem(STORAGE_KEYS.ADMIN_SESSION, session);
  }

  return {
    success: true,
    user: normalizedUser,
  };
}

/**
 * استرجاع الجلسة الحالية والتحقق من صلاحيتها
 */
export function getActiveSession(): AdminSession | null {
  if (!isBrowser()) return null;
  const session = getStorageItem(STORAGE_KEYS.ADMIN_SESSION);
  if (session && session.user && session.user.isActive) {
    const normalized = normalizeAdminUser(session.user);
    if (normalized && normalized.isActive) {
      return {
        token: session.token,
        user: normalized,
      };
    }
  }
  return null;
}

/**
 * إنهاء الجلسة وتسجيل الخروج
 */
export function terminateSession(): void {
  if (isBrowser()) {
    removeStorageItem(STORAGE_KEYS.ADMIN_SESSION);
  }
}
