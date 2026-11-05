import type { AdminUser } from '@/types';

/**
 * المستخدمون الإداريون المعتمدون للوحة التحكم
 * الدور الإداري المعتمد: admin مع الحفاظ على التوافقية لـ manager و staff
 */
export const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: 'user-admin-01',
    username: 'admin_tariq',
    fullName: 'طارق رضوان (مدير المتجر العام)',
    email: 'admin@candyloz.com',
    role: 'admin',
    isActive: true,
    createdAt: '2026-08-01T08:00:00Z',
  },
  {
    id: 'user-staff-01',
    username: 'staff_nour',
    fullName: 'نور أحمد (مشرف تشغيل)',
    email: 'staff@candyloz.com',
    role: 'staff',
    isActive: true,
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'user-manager-01',
    username: 'manager_tariq',
    fullName: 'طارق رضوان (مدير العمليات)',
    email: 'manager@candyloz.com',
    role: 'manager',
    isActive: true,
    createdAt: '2026-08-01T08:00:00Z',
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
  'admin@candyloz.com': {
    user: MOCK_ADMIN_USERS[0],
  },
  'staff@candyloz.com': {
    user: MOCK_ADMIN_USERS[1],
  },
  'manager@candyloz.com': {
    user: MOCK_ADMIN_USERS[2],
  },
};
