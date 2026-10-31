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
import { MOCK_ADMIN_USERS, MOCK_ADMIN_CREDENTIALS } from '@/data/mock/users';

export interface PreSeededAccount {
  email: string;
  password: string;
  role: AdminRole;
  user: AdminUser;
}

/**
 * المستخدمون الإداريون المهيئون مسبقاً للاختبار والتسجيل السريع
 * staff@candyloz.com / staff123 (staff)
 * manager@candyloz.com / manager123 (manager)
 */
export const PRE_SEEDED_USERS: Record<AdminRole, PreSeededAccount> = {
  staff: {
    email: 'staff@candyloz.com',
    password: 'staff123',
    role: 'staff',
    user: MOCK_ADMIN_USERS.find((u) => u.role === 'staff') || {
      id: 'user-staff-01',
      username: 'staff_nour',
      fullName: 'نور أحمد (موظف تشغيل)',
      email: 'staff@candyloz.com',
      role: 'staff',
      isActive: true,
      createdAt: '2026-09-01T08:00:00Z',
    },
  },
  manager: {
    email: 'manager@candyloz.com',
    password: 'manager123',
    role: 'manager',
    user: MOCK_ADMIN_USERS.find((u) => u.role === 'manager') || {
      id: 'user-manager-01',
      username: 'manager_tariq',
      fullName: 'طارق رضوان (مدير المتجر)',
      email: 'manager@candyloz.com',
      role: 'manager',
      isActive: true,
      createdAt: '2026-08-01T08:00:00Z',
    },
  },
};

export interface AdminAuthContextValue {
  user: AdminUser | null;
  role: AdminRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isManager: boolean;
  isStaff: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
   * تسجيل الدخول بالبريد الإلكتروني/اسم المستخدم وكلمة المرور
   */
  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      const normalizedIdentifier = email.trim().toLowerCase();

      // البحث في سجل الاعتمادات الوهمية بالبريد أو اسم المستخدم
      const credentialEntry = Object.entries(MOCK_ADMIN_CREDENTIALS).find(([keyEmail, item]) => {
        return (
          keyEmail.toLowerCase() === normalizedIdentifier ||
          item.user.email.toLowerCase() === normalizedIdentifier ||
          item.user.username.toLowerCase() === normalizedIdentifier
        );
      });

      if (!credentialEntry || credentialEntry[1].password !== password) {
        return {
          success: false,
          error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        };
      }

      const { user: authedUser } = credentialEntry[1];
      if (!authedUser.isActive) {
        return {
          success: false,
          error: 'هذا الحساب معطل حالياً، يرجى مراجعة إدارة المتجر',
        };
      }

      const session: AdminSession = {
        token: `candy-admin-token-${authedUser.role}-${Date.now()}`,
        user: authedUser,
      };

      setStorageItem(STORAGE_KEYS.ADMIN_SESSION, session);
      setUser(authedUser);

      return { success: true };
    },
    []
  );

  /**
   * تبديل الدور فوراً بين موظف (Staff) ومدير (Manager)
   */
  const switchRole = useCallback((newRole: AdminRole) => {
    const targetAccount = PRE_SEEDED_USERS[newRole];
    const targetUser = targetAccount.user;

    const session: AdminSession = {
      token: `candy-admin-token-${newRole}-${Date.now()}`,
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
    return {
      user,
      role,
      isAuthenticated: Boolean(user),
      isLoading,
      isManager: user?.role === 'manager',
      isStaff: user?.role === 'staff',
      login,
      switchRole,
      logout,
      hasRole,
    };
  }, [user, isLoading, login, switchRole, logout, hasRole]);

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
