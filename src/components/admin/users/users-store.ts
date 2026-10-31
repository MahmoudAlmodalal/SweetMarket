'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AdminUser, AdminRole } from '@/types';
import { MOCK_ADMIN_USERS, MOCK_ADMIN_CREDENTIALS } from '@/data/mock/users';
import { isBrowser } from '@/lib/storage';

export const ADMIN_USERS_STORAGE_KEY = 'candy_admin_users_v1';

export interface UserFormData {
  fullName: string;
  username: string;
  email: string;
  role: AdminRole;
  isActive?: boolean;
}

/**
 * دالة لتوليد كلمة مرور مؤقتة عشوائية قوية وسهلة القراءة
 * بصيغة CL-Temp-XXXX
 */
export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CL-Temp-${code}`;
}

/**
 * دالة للحصول على الأحرف الأولى للاسم باللغة العربية أو الإنجليزية للأفاتار
 */
export function getUserInitials(name: string): string {
  if (!name) return 'م';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * استرجاع قائمة المستخدمين من التخزين المحلي أو من البيانات الأولية
 */
export function getStoredAdminUsers(): AdminUser[] {
  if (!isBrowser()) {
    return MOCK_ADMIN_USERS;
  }

  try {
    const raw = window.localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        ADMIN_USERS_STORAGE_KEY,
        JSON.stringify(MOCK_ADMIN_USERS)
      );
      return MOCK_ADMIN_USERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return MOCK_ADMIN_USERS;
  } catch (err) {
    console.error('[AdminUsers] Failed to parse users from localStorage:', err);
    return MOCK_ADMIN_USERS;
  }
}

/**
 * حفظ قائمة المستخدمين في التخزين المحلي
 */
export function setStoredAdminUsers(users: AdminUser[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('[AdminUsers] Failed to persist users to localStorage:', err);
  }
}

export interface UseAdminUsersReturn {
  users: AdminUser[];
  isLoading: boolean;
  activeManagersCount: number;
  totalActiveCount: number;
  addUser: (data: UserFormData) => Promise<{ user: AdminUser; temporaryPassword: string }>;
  updateUser: (id: string, data: Partial<UserFormData>) => Promise<AdminUser>;
  toggleUserStatus: (id: string) => Promise<AdminUser>;
  resetPassword: (id: string) => Promise<{ user: AdminUser; temporaryPassword: string }>;
  isLastActiveManager: (userId: string) => boolean;
  refreshUsers: () => void;
}

export function useAdminUsers(): UseAdminUsersReturn {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    const stored = getStoredAdminUsers();
    setUsers(stored);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeManagersCount = useMemo(() => {
    return users.filter((u) => u.role === 'manager' && u.isActive).length;
  }, [users]);

  const totalActiveCount = useMemo(() => {
    return users.filter((u) => u.isActive).length;
  }, [users]);

  const isLastActiveManager = useCallback(
    (userId: string): boolean => {
      const targetUser = users.find((u) => u.id === userId);
      if (!targetUser || targetUser.role !== 'manager' || !targetUser.isActive) {
        return false;
      }
      return activeManagersCount <= 1;
    },
    [users, activeManagersCount]
  );

  /**
   * إضافة عضو جديد للفريق
   */
  const addUser = useCallback(
    async (data: UserFormData): Promise<{ user: AdminUser; temporaryPassword: string }> => {
      const normalizedEmail = data.email.trim().toLowerCase();
      const normalizedUsername = data.username.trim().toLowerCase();

      // التحقق من فرادة البريد واسم المستخدم
      const emailExists = users.some(
        (u) => u.email.trim().toLowerCase() === normalizedEmail
      );
      if (emailExists) {
        throw new Error('البريد الإلكتروني مستخدم بالفعل من قبل عضو آخر في الفريق');
      }

      const usernameExists = users.some(
        (u) => u.username.trim().toLowerCase() === normalizedUsername
      );
      if (usernameExists) {
        throw new Error('اسم المستخدم محجوز بالفعل، يرجى اختيار اسم مستخدم آخر');
      }

      const temporaryPassword = generateTemporaryPassword();
      const newUser: AdminUser = {
        id: `user-${data.role}-${Date.now()}`,
        fullName: data.fullName.trim(),
        username: data.username.trim(),
        email: normalizedEmail,
        role: data.role,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date().toISOString(),
      };

      const updated = [newUser, ...users];
      setUsers(updated);
      setStoredAdminUsers(updated);

      // تحديث الاعتمادات الوهمية للمصادقة التجريبية
      MOCK_ADMIN_CREDENTIALS[normalizedEmail] = {
        password: temporaryPassword,
        user: newUser,
      };

      return { user: newUser, temporaryPassword };
    },
    [users]
  );

  /**
   * تحديث بيانات ودور عضو الفريق
   */
  const updateUser = useCallback(
    async (id: string, data: Partial<UserFormData>): Promise<AdminUser> => {
      const index = users.findIndex((u) => u.id === id);
      if (index === -1) {
        throw new Error('لم يتم العثور على العضو المطلوب');
      }

      const current = users[index];

      // إذا كان التعديل يحول دور مدير نشط إلى موظف، وهو آخر مدير نشط
      if (
        current.role === 'manager' &&
        current.isActive &&
        data.role === 'staff' &&
        activeManagersCount <= 1
      ) {
        throw new Error(
          'لا يمكن تغيير دور هذا المدير إلى موظف لأنه المدير النشط الوحيد في النظام. يجب ترقية مدير آخر أولاً.'
        );
      }

      // التحقق من البريد إذا تغير
      if (data.email) {
        const normalizedEmail = data.email.trim().toLowerCase();
        const emailConflict = users.some(
          (u) => u.id !== id && u.email.trim().toLowerCase() === normalizedEmail
        );
        if (emailConflict) {
          throw new Error('البريد الإلكتروني مستخدم بالفعل من قبل عضو آخر في الفريق');
        }
      }

      // التحقق من اسم المستخدم إذا تغير
      if (data.username) {
        const normalizedUsername = data.username.trim().toLowerCase();
        const usernameConflict = users.some(
          (u) => u.id !== id && u.username.trim().toLowerCase() === normalizedUsername
        );
        if (usernameConflict) {
          throw new Error('اسم المستخدم محجوز بالفعل');
        }
      }

      const updatedUser: AdminUser = {
        ...current,
        fullName: data.fullName ? data.fullName.trim() : current.fullName,
        username: data.username ? data.username.trim() : current.username,
        email: data.email ? data.email.trim().toLowerCase() : current.email,
        role: data.role || current.role,
        isActive: data.isActive !== undefined ? data.isActive : current.isActive,
      };

      const updatedList = [...users];
      updatedList[index] = updatedUser;

      setUsers(updatedList);
      setStoredAdminUsers(updatedList);

      // تحديث الاعتمادات في الذاكرة
      if (MOCK_ADMIN_CREDENTIALS[current.email.toLowerCase()]) {
        const cred = MOCK_ADMIN_CREDENTIALS[current.email.toLowerCase()];
        delete MOCK_ADMIN_CREDENTIALS[current.email.toLowerCase()];
        MOCK_ADMIN_CREDENTIALS[updatedUser.email.toLowerCase()] = {
          ...cred,
          user: updatedUser,
        };
      }

      return updatedUser;
    },
    [users, activeManagersCount]
  );

  /**
   * تبديل حالة تفعيل / إيقاف الحساب مع فحص حظر إيقاف آخر مدير نشط
   */
  const toggleUserStatus = useCallback(
    async (id: string): Promise<AdminUser> => {
      const index = users.findIndex((u) => u.id === id);
      if (index === -1) {
        throw new Error('لم يتم العثور على العضو المطلوب');
      }

      const target = users[index];

      // فحص حظر إيقاف آخر مدير نشط وفق ميثاق UX_BLUEPRINT (SCR-19 / BR-004)
      if (target.role === 'manager' && target.isActive && activeManagersCount <= 1) {
        throw new Error(
          'لا يُسمح بإيقاف آخر مدير نشط في النظام؛ يجب توفر مدير نشط واحد على الأقل لضمان استمرارية الإدارة.'
        );
      }

      const updatedUser: AdminUser = {
        ...target,
        isActive: !target.isActive,
      };

      const updatedList = [...users];
      updatedList[index] = updatedUser;

      setUsers(updatedList);
      setStoredAdminUsers(updatedList);

      if (MOCK_ADMIN_CREDENTIALS[target.email.toLowerCase()]) {
        MOCK_ADMIN_CREDENTIALS[target.email.toLowerCase()].user = updatedUser;
      }

      return updatedUser;
    },
    [users, activeManagersCount]
  );

  /**
   * إعادة تعيين كلمة المرور وتوليد كلمة مؤقتة
   */
  const resetPassword = useCallback(
    async (id: string): Promise<{ user: AdminUser; temporaryPassword: string }> => {
      const index = users.findIndex((u) => u.id === id);
      if (index === -1) {
        throw new Error('لم يتم العثور على العضو المطلوب');
      }

      const target = users[index];
      const temporaryPassword = generateTemporaryPassword();

      // تحديث كلمة المرور في الاعتمادات الوهمية
      const emailLower = target.email.toLowerCase();
      MOCK_ADMIN_CREDENTIALS[emailLower] = {
        password: temporaryPassword,
        user: target,
      };

      return { user: target, temporaryPassword };
    },
    [users]
  );

  return {
    users,
    isLoading,
    activeManagersCount,
    totalActiveCount,
    addUser,
    updateUser,
    toggleUserStatus,
    resetPassword,
    isLastActiveManager,
    refreshUsers: loadData,
  };
}
