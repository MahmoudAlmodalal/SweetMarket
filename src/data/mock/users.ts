import type { AdminUser } from '@/types';

/**
 * المستخدمون الإداريون المعتمدون للوحة التحكم
 * دور موظف ودور مدير وفق PRD_v0.2
 */
export const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: 'user-staff-01',
    username: 'staff_nour',
    fullName: 'نور أحمد (موظف تشغيل)',
    email: 'staff@candyloz.com',
    role: 'staff',
    isActive: true,
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'user-manager-01',
    username: 'manager_tariq',
    fullName: 'طارق رضوان (مدير المتجر)',
    email: 'manager@candyloz.com',
    role: 'manager',
    isActive: true,
    createdAt: '2026-08-01T08:00:00Z',
  },
];

/**
 * سجل الاعتمادات الوهمية للمطابقة والتحقق (Authentication Mock DB)
 */
export const MOCK_ADMIN_CREDENTIALS: Record<
  string,
  { password: string; user: AdminUser }
> = {
  'staff@candyloz.com': {
    password: 'staff123',
    user: MOCK_ADMIN_USERS[0],
  },
  'manager@candyloz.com': {
    password: 'manager123',
    user: MOCK_ADMIN_USERS[1],
  },
};
