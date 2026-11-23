'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { AdminUser, AdminRole } from '@/types';
import { MOCK_ADMIN_USERS } from '@/data/mock/users';
import {
  authenticateAdminUser,
  demoLoginAsAdmin,
  fetchServerSession,
  normalizeAdminUser,
  terminateSession,
} from '@/lib/auth/authentication';
import { STORAGE_KEYS, removeStorageItem, isBrowser } from '@/lib/storage';

export { normalizeAdminUser };

export interface PreSeededAccount {
  email: string;
  role: AdminRole;
  user: AdminUser;
}

/**
 * حسابات الإدارة المعروضة للمعاينة السريعة (بدون كلمات مرور)
 */
export const PRE_SEEDED_USERS: Record<AdminRole, PreSeededAccount> = {
  manager: {
    email: 'manager@candyloz.com',
    role: 'manager',
    user: normalizeAdminUser(
      MOCK_ADMIN_USERS.find((u) => u.role === 'manager') || MOCK_ADMIN_USERS[0]
    )!,
  },
  staff: {
    email: 'staff@candyloz.com',
    role: 'staff',
    user: normalizeAdminUser(
      MOCK_ADMIN_USERS.find((u) => u.role === 'staff') || MOCK_ADMIN_USERS[2]
    )!,
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

  // Hydrate authenticated admin session directly from server HttpOnly cookie
  useEffect(() => {
    let active = true;
    if (isBrowser()) {
      removeStorageItem(STORAGE_KEYS.ADMIN_SESSION);
      if (window.location.pathname === '/admin/login') {
        setIsLoading(false);
        return () => {
          active = false;
        };
      }
    }

    (async () => {
      try {
        const serverUser = await fetchServerSession();
        if (active) {
          setUser(serverUser);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (
      identifier: string,
      secret: string
    ): Promise<{ success: boolean; error?: string }> => {
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

  const quickLogin = useCallback(
    async (targetRole: AdminRole = 'manager'): Promise<{ success: boolean; error?: string }> => {
      const result = await demoLoginAsAdmin(targetRole);
      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      }
      return {
        success: false,
        error: result.error || 'تعذّر تسجيل الدخول السريع',
      };
    },
    []
  );

  const switchRole = useCallback((newRole: AdminRole) => {
    void demoLoginAsAdmin(newRole).then((res) => {
      if (res.success && res.user) {
        setUser(res.user);
      }
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    void terminateSession();
  }, []);

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
