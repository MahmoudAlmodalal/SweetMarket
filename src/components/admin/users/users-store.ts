'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AdminUser, AdminRole } from '@/types';
import { apiRequest } from '@/lib/api-client';
import { adaptAdminUser } from '@/lib/api-adapters';

export interface UserFormData {
  fullName: string;
  jobTitle?: string;
  username: string;
  email: string;
  role: AdminRole;
  isActive?: boolean;
}

export function getUserInitials(name: string): string {
  if (!name) return 'م';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const rawList = await apiRequest<Array<Record<string, unknown>>>('/api/v1/admin/users');
      const adapted = (Array.isArray(rawList) ? rawList : []).map(adaptAdminUser);
      setUsers(adapted);
    } catch (err) {
      console.error('[AdminUsers] Failed to fetch users from API:', err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeManagersCount = useMemo(
    () => users.filter((u) => u.role === 'manager' && u.isActive).length,
    [users]
  );

  const totalActiveCount = useMemo(
    () => users.filter((u) => u.isActive).length,
    [users]
  );

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

  const addUser = useCallback(
    async (data: UserFormData): Promise<{ user: AdminUser; temporaryPassword: string }> => {
      const res = await apiRequest<{
        user: Record<string, unknown>;
        temporaryPassword: string;
      }>('/api/v1/admin/users', {
        method: 'POST',
        body: {
          fullName: data.fullName.trim(),
          jobTitle: data.jobTitle?.trim() || undefined,
          username: data.username.trim(),
          email: data.email.trim().toLowerCase(),
          role: data.role,
        },
      });

      const created = adaptAdminUser(res.user);
      setUsers((prev) => [created, ...prev]);
      return { user: created, temporaryPassword: res.temporaryPassword };
    },
    []
  );

  const updateUser = useCallback(
    async (id: string, data: Partial<UserFormData>): Promise<AdminUser> => {
      const raw = await apiRequest<Record<string, unknown>>(
        `/api/v1/admin/users/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          body: {
            ...(data.fullName !== undefined ? { fullName: data.fullName.trim() } : {}),
            ...(data.jobTitle !== undefined ? { jobTitle: data.jobTitle.trim() } : {}),
            ...(data.role !== undefined ? { role: data.role } : {}),
            ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
          },
        }
      );

      const updated = adaptAdminUser(raw);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      return updated;
    },
    []
  );

  const toggleUserStatus = useCallback(
    async (id: string): Promise<AdminUser> => {
      const target = users.find((u) => u.id === id);
      if (!target) {
        throw new Error('لم يتم العثور على العضو المطلوب');
      }

      const raw = await apiRequest<Record<string, unknown>>(
        `/api/v1/admin/users/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          body: { isActive: !target.isActive },
        }
      );

      const updated = adaptAdminUser(raw);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      return updated;
    },
    [users]
  );

  const resetPassword = useCallback(
    async (id: string): Promise<{ user: AdminUser; temporaryPassword: string }> => {
      const res = await apiRequest<{
        user: Record<string, unknown>;
        temporaryPassword: string;
      }>(`/api/v1/admin/users/${encodeURIComponent(id)}/reset-password`, {
        method: 'POST',
        body: {},
      });

      return {
        user: adaptAdminUser(res.user),
        temporaryPassword: res.temporaryPassword,
      };
    },
    []
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
    refreshUsers: () => {
      void loadData();
    },
  };
}
