import type { AdminUser } from '@/types';

/**
 * المستخدمون الإداريون الأساسيون للوحة التحكم — 3 حسابات بأدوار RBAC صارمة: manager | staff
 */
export const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: 'user-manager-01',
    username: 'manager_tariq',
    fullName: 'طارق رضوان',
    email: 'manager@candyloz.com',
    role: 'manager',
    isActive: true,
    createdAt: '2026-08-01T08:00:00Z',
  },
  {
    id: 'user-manager-02',
    username: 'manager_rami',
    fullName: 'رامي الكرد',
    email: 'rami@candyloz.com',
    role: 'manager',
    isActive: true,
    createdAt: '2026-08-15T08:00:00Z',
  },
  {
    id: 'user-staff-01',
    username: 'staff_nour',
    fullName: 'نور أحمد',
    email: 'staff@candyloz.com',
    role: 'staff',
    isActive: true,
    createdAt: '2026-09-01T08:00:00Z',
  },
];

/**
 * سجل الاعتمادات الوهمية للمطابقة والتحقق (Authentication Mock DB)
 * ملاحظة أمنية صارمة: تم مسح أي كلمات مرور صريحة من حزم المتصفح ومستودع GitHub
 */
export const MOCK_ADMIN_CREDENTIALS: Record<
  string,
  { password?: string; user: AdminUser; passwordHash?: string }
> = {
  'manager@candyloz.com': {
    user: MOCK_ADMIN_USERS[0],
  },
  'rami@candyloz.com': {
    user: MOCK_ADMIN_USERS[1],
  },
  'staff@candyloz.com': {
    user: MOCK_ADMIN_USERS[2],
  },
};
