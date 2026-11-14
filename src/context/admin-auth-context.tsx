'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { AdminUser, AdminRole, AdminSession } from '@/types';
import {
  STORAGE_KEYS,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  isBrowser,
} from '@/lib/storage';
import { MOCK_ADMIN_USERS } from '@/data/mock/users';
import {
  authenticateAdminUser,
  demoLoginAsAdmin,
  generateSecureSessionToken,
  getActiveSession,
  normalizeAdminUser,
} from '@/lib/auth/authentication';

export { normalizeAdminUser };

export interface PreSeededAccount {
  email: string;
  role: AdminRole;
  user: AdminUser;
}

/**
 * حسابات الإدارة المعتمدة للاختبار التجريبي (بدون كلمات مرور مكشوفة في الكود)
 */
export const PRE_SEEDED_USERS: Record<AdminRole, PreSeededAccount> = {
  manager: {
    email: 'manager@candyloz.com',
    role: 'manager',
    user: normalizeAdminUser(MOCK_ADMIN_USERS.find((u) => u.role === 'manager') || MOCK_ADMIN_USERS[0])!,
  },
  staff: {
    email: 'staff@candyloz.com',
    role: 'staff',
    user: normalizeAdminUser(MOCK_ADMIN_USERS.find((u) => u.role === 'staff') || MOCK_ADMIN_USERS[2])!,
  },
};

export interface AdminAuthContextValue {
  user: AdminUser | null;
  role: AdminRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  quickLogin: (role?: AdminRole) => Promise<{ success: boolean; error?: string }>;
  /**
   * @deprecated Role self-escalation is disabled on production error surfaces.
   * Retained for dev/QA environment testing and backwards-compatibility.
   */
  switchRole: (role: AdminRole) => void;
  logout: () => void;
  hasRole: (role: AdminRole) => boolean;
}

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

function AdminAuthProviderInternal({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // استرجاع الجلسة عند التحميل الأولي من التخزين المحلي مع دمج الحقول الافتراضية بأمان (ADR Invariant)
  useEffect(() => {
    try {
      const activeSession = getActiveSession();
      if (activeSession && activeSession.user && activeSession.user.isActive) {
        setUser(activeSession.user);
      } else {
        // فحص احتياطي مباشر من التخزين مع المعالجة والدمج
        const rawSession = getStorageItem(STORAGE_KEYS.ADMIN_SESSION);
        if (rawSession && rawSession.user) {
          const normalized = normalizeAdminUser(rawSession.user);
          if (normalized && normalized.isActive) {
            setUser(normalized);
          }
        }
      }
    } catch (err) {
      console.error('[AdminAuth] Error reading initial session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // المزامنة التلقائية عبر النوافذ والتبويبات مع معالجة البيانات القديمة
  useEffect(() => {
    if (!isBrowser()) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.ADMIN_SESSION) {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue) as AdminSession;
            if (parsed && parsed.user) {
              const normalized = normalizeAdminUser(parsed.user);
              if (normalized && normalized.isActive) {
                setUser(normalized);
                return;
              }
            }
          } catch {
            // تجاهل خطأ التحليل
          }
        }
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * تسجيل الدخول بالبريد الإلكتروني/اسم المستخدم وكلمة المرور عبر وحدة المصادقة الآمنة
   */
  const login = useCallback(
    async (identifier: string, secret: string): Promise<{ success: boolean; error?: string }> => {
      const result = await authenticateAdminUser(identifier, secret);
      if (result.success && result.user) {
        const normalized = normalizeAdminUser(result.user);
        setUser(normalized);
        return { success: true };
      }
      return {
        success: false,
        error: result.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      };
    },
    []
  );

  /**
   * تسجيل دخول تجريبي آمن دون تداول كلمات مرور في واجهة المتصفح
   */
  const quickLogin = useCallback(async (targetRole: AdminRole = 'manager'): Promise<{ success: boolean; error?: string }> => {
    const target = PRE_SEEDED_USERS[targetRole] || PRE_SEEDED_USERS.manager;
    const sessionToken = generateSecureSessionToken();
    const session: AdminSession = {
      token: sessionToken,
      user: target.user,
    };
    setStorageItem(STORAGE_KEYS.ADMIN_SESSION, session);
    setUser(target.user);
    return { success: true };
  }, []);

  /**
   * تبديل الدور - معطل في واجهات الأخطاء الإنتاجية لمنع الترقية الذاتية (Self-Escalation)
   * متاح فقط للاختبار في بيئة التطوير أو مع راية NEXT_PUBLIC_DEMO_MODE
   */
  const switchRole = useCallback((newRole: AdminRole) => {
    const isDev = process.env.NODE_ENV !== 'production';
    const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    if (!isDev && !isDemo) {
      console.warn(
        '[AdminAuth] Role self-escalation is blocked on production error surfaces.'
      );
      return;
    }

    const targetAccount = PRE_SEEDED_USERS[newRole];
    if (!targetAccount) return;

    const targetUser = targetAccount.user;
    const session: AdminSession = {
      token: generateSecureSessionToken(),
      user: targetUser,
    };

    setStorageItem(STORAGE_KEYS.ADMIN_SESSION, session);
    setUser(targetUser);
  }, []);

  /**
   * تسجيل الخروج ومسح الجلسة من التخزين المحلي
   */
  const logout = useCallback(() => {
    removeStorageItem(STORAGE_KEYS.ADMIN_SESSION);
    setUser(null);
  }, []);

  /**
   * التحقق مما إذا كان المستخدم يملك دوراً محدداً
   */
  const hasRole = useCallback(
    (targetRole: AdminRole): boolean => {
      if (!user) return false;
      return user.role === targetRole;
    },
    [user]
  );

  const value = useMemo<AdminAuthContextValue>(() => {
    const role = user?.role ?? null;
    const isManager = user?.role === 'manager';
    return {
      user,
      role,
      isAuthenticated: Boolean(user),
      isLoading,
      isAdmin: isManager,
      isManager,
      isStaff: user?.role === 'staff',
      login,
      quickLogin,
      switchRole,
      logout,
      hasRole,
    };
  }, [user, isLoading, login, quickLogin, switchRole, logout, hasRole]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const existingContext = useContext(AdminAuthContext);
  if (existingContext) {
    return <>{children}</>;
  }
  return <AdminAuthProviderInternal>{children}</AdminAuthProviderInternal>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

export default AdminAuthProvider;
