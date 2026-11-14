/**
 * Authorization and Access Control (RBAC & Ownership Guard)
 * Strict 3-role model: 'admin' | 'client' | 'guest'
 * Enforces separation between Authentication (identity) and Authorization (permissions & ownership)
 */

import type { AdminUser } from '@/types';

export type Role = 'admin' | 'client' | 'guest';

export type ResourceType =
  | 'product'
  | 'category'
  | 'delivery_zone'
  | 'order'
  | 'user'
  | 'system_settings';

export type Action =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'toggle_availability'
  | 'transition_status'
  | 'cancel'
  | 'manage';

export interface Actor {
  id?: string;
  role: Role;
  email?: string;
  isActive?: boolean;
}

export interface ResourceContext {
  ownerId?: string;
  orderStatus?: string;
}

/**
 * فحص صلاحيات التنفيذ بناءً على الدور وقواعد الملكية الصارمة (Ownership Guard)
 */
export function canPerform(
  actor: Actor,
  action: Action,
  resource: ResourceType,
  context?: ResourceContext
): boolean {
  if (actor.isActive === false) {
    return false;
  }

  // 1. المدير (admin): يملك الصلاحيات الإدارية الكاملة
  if (actor.role === 'admin') {
    return true;
  }

  // 2. العميل المسجل (client): صلاحيات محددة مع حماية ملكية صارمة
  if (actor.role === 'client') {
    switch (resource) {
      case 'product':
      case 'category':
      case 'delivery_zone':
        return action === 'view';

      case 'order':
        if (action === 'create') return true;
        if (action === 'view') {
          // Ownership Check: العميل يرى فقط طلباته الخاصة
          return Boolean(actor.id && context?.ownerId === actor.id);
        }
        if (action === 'cancel') {
          // العميل يلغي طلبه فقط إذا كان هو المالك والطلب في حالة أولية 'new'
          return (
            Boolean(actor.id && context?.ownerId === actor.id) &&
            context?.orderStatus === 'new'
          );
        }
        return false;

      case 'user':
        // العميل يدير فقط حسابه الشخصي
        return (action === 'view' || action === 'update') && Boolean(actor.id && context?.ownerId === actor.id);

      case 'system_settings':
        return false;

      default:
        return false;
    }
  }

  // 3. الزائر غير المسجل (guest): استعراض عام وشراء دون حساب
  if (actor.role === 'guest') {
    switch (resource) {
      case 'product':
      case 'category':
      case 'delivery_zone':
        return action === 'view';

      case 'order':
        // الزائر يستطيع إنشاء طلب، والتتبع يتم برمز التتبع المقترن بالطلب
        return action === 'create';

      default:
        return false;
    }
  }

  return false;
}

/**
 * التحقق من ملكية الطلب (Order Ownership Guard)
 */
export function canAccessOrder(
  actor: Actor,
  order: {
    clientId?: string;
    orderNumber: string;
    customerPhone?: string;
    trackingToken?: string;
  },
  credentials?: {
    phone?: string;
    trackingToken?: string;
  }
): boolean {
  // المدير يستعرض كافة الطلبات
  if (actor.role === 'admin') {
    return true;
  }

  // العميل الموثق يملك الطلب إذا تطابق معرف العميل
  if (actor.role === 'client' && actor.id && order.clientId === actor.id) {
    return true;
  }

  // الزائر أو العميل غير المسجل لطلب معين: يتطلب تطابق رمز التتبع أو رقم الهاتف المحقق
  if (credentials) {
    if (order.trackingToken && credentials.trackingToken) {
      return order.trackingToken === credentials.trackingToken;
    }
    if (order.customerPhone && credentials.phone) {
      return order.customerPhone.trim() === credentials.phone.trim();
    }
  }

  return false;
}

/**
 * إخفاء وتقنيع بيانات العميل الحساسة (PII Masking) لواجهات التتبع العامة
 */
export function maskSensitiveCustomerData(customer: {
  fullName: string;
  phone: string;
  streetAddress: string;
  buildingOrApt?: string;
}): {
  fullName: string;
  phone: string;
  streetAddress: string;
  buildingOrApt?: string;
} {
  // إخفاء معظم رقم الهاتف (مثال: 059****123)
  const phone = customer.phone || '';
  const maskedPhone =
    phone.length >= 7
      ? `${phone.slice(0, 3)}****${phone.slice(-3)}`
      : '***-***';

  // إخفاء الاسم الأخير للخصوصية (مثال: أحمد م.)
  const nameParts = customer.fullName.trim().split(/\s+/);
  const maskedName =
    nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[1].charAt(0)}.`
      : customer.fullName;

  // إخفاء تفاصيل المبنى والشقة بدقة
  return {
    fullName: maskedName,
    phone: maskedPhone,
    streetAddress: 'منطقة التسليم المعتمدة',
    buildingOrApt: undefined,
  };
}

/**
 * الخريطة الموحدة لتسميات الأدوار الإدارية باللغة العربية (ADR Invariant: Unified Arabic Role Mapping)
 * 'admin' و 'manager' -> 'مدير النظام'
 * 'staff' -> 'موظف'
 */
export const ROLE_LABELS_AR: Record<string, string> = {
  admin: 'مدير النظام',
  manager: 'مدير النظام',
  staff: 'موظف',
  client: 'عميل',
  guest: 'زائر',
};

export const ADMIN_ROLE_LABELS_AR: Record<string, string> = {
  admin: 'مدير النظام',
  manager: 'مدير النظام',
  staff: 'موظف',
};

/**
 * دالة مساعدة معتمدة للحصول على المسمى العربي الموحد للأدوار
 */
export function getRoleLabelAr(role?: string | null): string {
  if (!role) return '';
  const normalized = role.toLowerCase().trim();
  if (normalized === 'admin' || normalized === 'manager') {
    return 'مدير النظام';
  }
  if (normalized === 'staff') {
    return 'موظف';
  }
  return ROLE_LABELS_AR[normalized] || role;
}

export const getAdminRoleLabelAr = getRoleLabelAr;
export const getRoleLabel = getRoleLabelAr;
export const getArabicRoleLabel = getRoleLabelAr;

export type RouteAccessStatus = 'allowed' | 'unauthenticated' | 'forbidden';

export interface RouteAccessResult {
  status: RouteAccessStatus;
  requiredRole?: string;
  requiredScopeLabel?: string;
}

/**
 * تقييم صلاحية الوصول للمسارات الإدارية وفق سياسة مركزية موحدة
 * Protected admin routes:
 * - /admin/login متاح للجميع (status: 'allowed')
 * - /admin/users يتطلب دور مدير النظام ('manager' أو 'admin')
 * - باقي مسارات /admin تتطلب مستخدم إداري نشط موثق (staff أو manager)
 */
export function evaluateRouteAccess(
  pathname: string,
  user: AdminUser | null
): RouteAccessResult {
  // تنظيف المسار من معلمات الاستعلام وعلامات التجزئة والشرطات الزائدة
  const cleanPath = (pathname || '')
    .split('?')[0]
    .split('#')[0]
    .replace(/\/+$/, '') || '/';

  // 1. المسارات غير الإدارية مسموحة دائماً للجميع (متجر، سلة، تتبع، إلخ)
  if (!cleanPath.startsWith('/admin')) {
    return { status: 'allowed' };
  }

  // 2. صفحة تسجيل الدخول متاحة للجميع دائماً
  if (cleanPath === '/admin/login') {
    return { status: 'allowed' };
  }

  // 3. التحقق من توفر جلسة مستخدم إداري نشطة
  if (!user || !user.isActive) {
    return {
      status: 'unauthenticated',
      requiredRole: 'staff',
      requiredScopeLabel: 'تسجيل دخول بحساب موظف أو مدير نشط',
    };
  }

  // 4. صفحة إدارة المستخدمين وفريق العمل (/admin/users) تتطلب دور مدير النظام حصراً
  const isUsersRoute =
    cleanPath === '/admin/users' || cleanPath.startsWith('/admin/users/');

  if (isUsersRoute) {
    const isManagerOrAdmin =
      user.role === 'manager' || (user.role as string) === 'admin';

    if (isManagerOrAdmin) {
      return { status: 'allowed' };
    }

    return {
      status: 'forbidden',
      requiredRole: 'manager',
      requiredScopeLabel: 'إدارة المستخدمين وصلاحيات النظام (مدير النظام)',
    };
  }

  // 5. صفحة الوصول المحظور (/admin/forbidden):
  // إذا كان المستخدم مديراً، يسمح له بالمرور (للتحويل التلقائي إلى وجهته المطلوبة)
  // إذا لم يكن مديراً، status: forbidden
  if (cleanPath === '/admin/forbidden') {
    const isManagerOrAdmin =
      user.role === 'manager' || (user.role as string) === 'admin';
    if (isManagerOrAdmin) {
      return { status: 'allowed' };
    }
    return {
      status: 'forbidden',
      requiredRole: 'manager',
      requiredScopeLabel: 'صلاحيات إدارية موسعة (مدير النظام)',
    };
  }

  // 6. باقي مسارات لوحة الإدارة متاحة لأي موظف أو مدير موثق ونشط
  const isAuthorizedAdminRole =
    user.role === 'manager' ||
    user.role === 'staff' ||
    (user.role as string) === 'admin';

  if (isAuthorizedAdminRole) {
    return { status: 'allowed' };
  }

  return {
    status: 'forbidden',
    requiredRole: 'staff',
    requiredScopeLabel: 'حساب إدارة معتمد',
  };
}

/**
 * التحقق الأمني الصارم من وجهة إعادة التوجيه الإدارية (Return URL / from)
 * يسمح فقط بالمسارات النسبية المطابقة لنطاق لوحة التحكم /admin/*
 * يحمي ضد هجمات إعادة التوجيه المفتوح (Open Redirect) ومسارات الحلقات المفرغة
 */
export function validateAdminReturnUrl(url: string | null | undefined): string {
  const fallback = '/admin/orders';
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  const trimmed = url.trim();

  // رفض المسارات التي لا تبدأ بشرطة مائلة واحدة أو تبدأ ببروتوكول نسبي // أو /\
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  // رفض أي بروتوكول صريح أو رموز محارف مشبوهة
  if (
    /^(?:[a-z]+:|\/\/)/i.test(trimmed) ||
    trimmed.includes('\\') ||
    trimmed.includes('\0')
  ) {
    return fallback;
  }

  // استخراج المسار المجرد بدون query parameters
  const pathOnly = trimmed.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';

  // التأكد من أن المسار يقع حصراً داخل نطاق الإدارة /admin
  if (!pathOnly.startsWith('/admin')) {
    return fallback;
  }

  // منع التوجيه لصفحات الدخول أو الحظر لتفادي الحلقات التكرارية اللانهائية
  if (pathOnly === '/admin/login' || pathOnly === '/admin/forbidden') {
    return fallback;
  }

  return trimmed;
}
