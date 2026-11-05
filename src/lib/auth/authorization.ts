/**
 * Authorization and Access Control (RBAC & Ownership Guard)
 * Strict 3-role model: 'admin' | 'client' | 'guest'
 * Enforces separation between Authentication (identity) and Authorization (permissions & ownership)
 */

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
