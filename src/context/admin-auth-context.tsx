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
} from '@/lib/auth/authentication';

export interface PreSeededAccount {
  email: string;
  role: AdminRole;
  user: AdminUser;
}

/**
 * حسابات الإدارة المعتمدة للاختبار التجريبي (بدون كلمات مرور مكشوفة في الكود)
 */
export const PRE_SEEDED_USERS: Record<AdminRole, PreSeededAccount> = {
  admin: {
    email: 'admin@candyloz.com',
    role: 'admin',
    user: MOCK_ADMIN_USERS.find((u) => u.role === 'admin') || MOCK_ADMIN_USERS[0],
  },
  manager: {
    email: 'manager@candyloz.com',
    role: 'manager',
    user: MOCK_ADMIN_USERS.find((u) => u.role === 'manager') || MOCK_ADMIN_USERS[0],
  },
  staff: {
    email: 'staff@candyloz.com',
    role: 'staff',
    user: MOCK_ADMIN_USERS.find((u) => u.role === 'staff') || MOCK_ADMIN_USERS[1],
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
  switchRole: (role: AdminRole) => void;
  logout: () => void;
  hasRole: (role: AdminRole) => boolean;
}

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

function AdminAuthProviderInternal({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // استرجاع الجلسة عند التحميل الأولي من التخزين المحلي
  useEffect(() => {
    try {
      const session = getStorageItem(STORAGE_KEYS.ADMIN_SESSION, null);
      if (session && session.user && session.user.isActive) {
        setUser(session.user);
      }
    } catch (err) {
      console.error('[AdminAuth] Error reading initial session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // المزامنة التلقائية عبر النوافذ والتبويبات
  useEffect(() => {
    if (!isBrowser()) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.ADMIN_SESSION) {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue) as AdminSession;
            if (parsed && parsed.user && parsed.user.isActive) {
              setUser(parsed.user);
              return;
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
        setUser(result.user);
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
  const quickLogin = useCallback(async (targetRole: AdminRole = 'admin'): Promise<{ success: boolean; error?: string }> => {
    const target = PRE_SEEDED_USERS[targetRole] || PRE_SEEDED_USERS.admin;
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
   * تبديل الدور تحت إطار التحكم الآمن
   */
  const switchRole = useCallback((newRole: AdminRole) => {
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
      if (targetRole === 'admin' || targetRole === 'manager') {
        return user.role === 'admin' || user.role === 'manager';
      }
      return user.role === targetRole;
    },
    [user]
  );

  const value = useMemo<AdminAuthContextValue>(() => {
    const role = user?.role ?? null;
    const isAdmin = user?.role === 'admin' || user?.role === 'manager';
    return {
      user,
      role,
      isAuthenticated: Boolean(user),
      isLoading,
      isAdmin,
      isManager: isAdmin,
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
