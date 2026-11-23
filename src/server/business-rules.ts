import type {
  AdminRole,
  AdminUser,
  CartItem,
  DeliveryZone,
  Order,
  OrderStatus,
  Product,
  ProductWeightOption,
} from '@/types';
import { ALLOWED_STATUS_TRANSITIONS } from '@/types';

export interface DomainValidationError {
  code: string;
  message: string;
  status: number;
  details?: Array<{ field: string; message: string }>;
}

export class BusinessRuleError extends Error {
  code: string;
  status: number;
  details?: Array<{ field: string; message: string }>;

  constructor(
    code: string,
    message: string,
    status = 400,
    details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'BusinessRuleError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const PACKAGING_FEES: Record<string, { id: 'standard' | 'royal'; label: string; fee: number }> = {
  standard: {
    id: 'standard',
    label: 'تغليف قياسي فاخر (مجاناً)',
    fee: 0,
  },
  royal: {
    id: 'royal',
    label: 'صندوق إهداء مخملي ملكي (+12 ₪)',
    fee: 12,
  },
};

export const ACTIVE_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  'new',
  'accepted',
  'in_preparation',
  'out_for_delivery',
  'undelivered',
]);

/**
 * Normalize and validate Palestinian mobile numbers (059 / 056, 10 digits).
 */
export function normalizePhoneNumber(rawPhone: string): string {
  const digits = String(rawPhone || '').replace(/[\s\-().+]/g, '');
  let normalized = digits;

  if (normalized.startsWith('00970')) {
    normalized = '0' + normalized.slice(5);
  } else if (normalized.startsWith('970')) {
    normalized = '0' + normalized.slice(3);
  } else if (normalized.startsWith('00972')) {
    normalized = '0' + normalized.slice(5);
  } else if (normalized.startsWith('972')) {
    normalized = '0' + normalized.slice(3);
  }

  if (!/^(059|056)\d{7}$/.test(normalized)) {
    throw new BusinessRuleError(
      'VALIDATION_ERROR',
      'يجب أن يبدأ رقم الهاتف بـ 059 أو 056 ويتكون من 10 أرقام',
      400,
      [{ field: 'customer.phone', message: 'يجب أن يبدأ رقم الهاتف بـ 059 أو 056 ويتكون من 10 أرقام' }]
    );
  }

  return normalized;
}

export function isPhoneValid(rawPhone: string): boolean {
  try {
    normalizePhoneNumber(rawPhone);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates a clean URL-safe lowercase slug matching /^[a-z0-9]+(?:-[a-z0-9]+)*$/.
 */
export function slugifySafe(input: string, fallbackPrefix = 'item'): string {
  const cleaned = String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (cleaned.length >= 2) {
    return cleaned;
  }
  return `${fallbackPrefix}-${Date.now().toString(36)}`;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
  selectedWeightMultiplier?: number;
  weightMultiplier?: number;
  selectedWeightLabel?: string;
  weightLabel?: string;
  packagingOptionId?: string;
  giftMessage?: string;
}

export interface ComputedOrderResult {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Server-authoritative order pricing & stock/minimum-order enforcement.
 */
export function computeAuthoritativeOrderTotals(
  rawItems: OrderItemInput[],
  productsById: Map<string, Product & { isArchived?: boolean }>,
  zone: DeliveryZone | undefined
): ComputedOrderResult {
  if (!zone || !zone.isActive) {
    throw new BusinessRuleError(
      'ZONE_UNAVAILABLE',
      'منطقة التوصيل المحددة غير متاحة حالياً، يرجى اختيار منطقة أخرى',
      422,
      [{ field: 'customer.zoneId', message: 'منطقة التوصيل غير متاحة حالياً' }]
    );
  }

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new BusinessRuleError(
      'VALIDATION_ERROR',
      'يجب أن يحتوي الطلب على منتج واحد على الأقل',
      400,
      [{ field: 'items', message: 'السلة فارغة' }]
    );
  }

  const resolvedItems: CartItem[] = [];
  let subtotal = 0;

  for (let idx = 0; idx < rawItems.length; idx++) {
    const reqItem = rawItems[idx];
    const product = productsById.get(reqItem.productId);
    if (!product || product.isArchived) {
      throw new BusinessRuleError(
        'PRODUCT_NOT_FOUND',
        'أحد الأصناف في السلة لم يعد موجوداً في المتجر',
        422,
        [{ field: `items[${idx}].productId`, message: 'الصنف غير موجود' }]
      );
    }

    if (!product.isAvailable) {
      throw new BusinessRuleError(
        'PRODUCT_UNAVAILABLE',
        `عذراً، الصنف "${product.name}" غير متوفر حالياً في المخزون`,
        422,
        [{ field: `items[${idx}].productId`, message: `"${product.name}" نفد من المخزون` }]
      );
    }

    const quantity = Math.floor(Number(reqItem.quantity));
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 50) {
      throw new BusinessRuleError(
        'VALIDATION_ERROR',
        'الكمية يجب أن تكون بين 1 و 50',
        400,
        [{ field: `items[${idx}].quantity`, message: 'الكمية غير صالحة (1-50)' }]
      );
    }

    const requestedMultiplier = reqItem.selectedWeightMultiplier ?? reqItem.weightMultiplier;
    const requestedLabel = reqItem.selectedWeightLabel ?? reqItem.weightLabel;

    let matchedWeight: ProductWeightOption | undefined;
    if (product.availableWeights && product.availableWeights.length > 0) {
      if (requestedMultiplier !== undefined) {
        matchedWeight = product.availableWeights.find(
          (w) =>
            Number(w.multiplier) === Number(requestedMultiplier) &&
            (!requestedLabel || w.label === requestedLabel)
        );
      }
      if (!matchedWeight && requestedLabel) {
        matchedWeight = product.availableWeights.find((w) => w.label === requestedLabel);
      }
      if (!matchedWeight) {
        matchedWeight =
          product.availableWeights.find((w) => w.multiplier === 1) ?? product.availableWeights[0];
      }
    }

    const listBasePrice = matchedWeight ? matchedWeight.price : product.price;
    const effectiveBasePrice = matchedWeight
      ? matchedWeight.salePrice && matchedWeight.salePrice > 0 && matchedWeight.salePrice < matchedWeight.price
        ? matchedWeight.salePrice
        : matchedWeight.price
      : product.salePrice && product.salePrice > 0 && product.salePrice < product.price
      ? product.salePrice
      : product.price;

    const packagingKey = reqItem.packagingOptionId === 'royal' ? 'royal' : 'standard';
    const packaging = PACKAGING_FEES[packagingKey];
    const unitPrice = roundCurrency(effectiveBasePrice + packaging.fee);
    const listUnitPrice = roundCurrency(listBasePrice + packaging.fee);
    const lineTotal = roundCurrency(unitPrice * quantity);
    const giftMessage = reqItem.giftMessage?.trim()
      ? reqItem.giftMessage.trim().slice(0, 120)
      : undefined;

    subtotal = roundCurrency(subtotal + lineTotal);

    resolvedItems.push({
      id: `item-${idx + 1}-${product.id}`,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: product.imageUrl,
      unitPrice,
      listUnitPrice,
      unit: product.unit,
      selectedWeightMultiplier: matchedWeight?.multiplier,
      selectedWeightLabel: matchedWeight?.label,
      packagingOptionId: packaging.id,
      packagingLabel: packaging.label,
      packagingFee: packaging.fee,
      giftMessage,
      quantity,
      lineTotal,
    });
  }

  if (subtotal < zone.minOrderAmount) {
    throw new BusinessRuleError(
      'MIN_ORDER_NOT_MET',
      `الحد الأدنى للطلب لمنطقة "${zone.name}" هو ${zone.minOrderAmount} ₪ (إجمالي سلتك الحالي ${subtotal} ₪)`,
      422,
      [
        {
          field: 'subtotal',
          message: `يرجى إضافة أصناف بقيمة ${roundCurrency(zone.minOrderAmount - subtotal)} ₪ على الأقل لإتمام الطلب`,
        },
      ]
    );
  }

  const deliveryFee = roundCurrency(zone.deliveryFee);
  const total = roundCurrency(subtotal + deliveryFee);

  return {
    items: resolvedItems,
    subtotal,
    deliveryFee,
    total,
  };
}

/**
 * Enforces BR-004 Order State Machine & Role Guards (Staff vs Manager).
 */
export function validateOrderStatusTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
  actorRole: AdminRole,
  reason?: string
): void {
  const validStatuses = Object.keys(ALLOWED_STATUS_TRANSITIONS) as OrderStatus[];
  if (!validStatuses.includes(nextStatus)) {
    throw new BusinessRuleError('VALIDATION_ERROR', 'حالة الطلب المحددة غير صالحة', 400);
  }

  const isManager = actorRole === 'manager';

  // Manager-only actions: cancelled and undelivered
  if ((nextStatus === 'cancelled' || nextStatus === 'undelivered') && !isManager) {
    throw new BusinessRuleError(
      'FORBIDDEN',
      nextStatus === 'cancelled'
        ? 'إلغاء الطلبات مخصص لمدير النظام فقط'
        : 'تسجيل تعذّر التسليم مخصص لمدير النظام فقط',
      403
    );
  }

  // Terminal states cannot be mutated by anyone
  if (currentStatus === 'delivered' || currentStatus === 'cancelled') {
    throw new BusinessRuleError(
      'INVALID_TRANSITION',
      'هذا الطلب في حالة نهائية مغلقة ولا يمكن تعديل حالته',
      400
    );
  }

  const allowedNext = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  // Manager override: manager may cancel from in_preparation if urgent, otherwise strictly follow BR-004
  const managerEmergencyCancel =
    isManager && nextStatus === 'cancelled' && currentStatus === 'in_preparation';

  if (!allowedNext.includes(nextStatus) && !managerEmergencyCancel) {
    throw new BusinessRuleError(
      'INVALID_TRANSITION',
      `لا يمكن نقل الطلب من "${currentStatus}" إلى "${nextStatus}" وفق قواعد سير العمل`,
      400
    );
  }

  if (nextStatus === 'cancelled' || nextStatus === 'undelivered') {
    const trimmedReason = (reason || '').trim();
    if (trimmedReason.length < 5) {
      throw new BusinessRuleError(
        'VALIDATION_ERROR',
        'يجب تدوين سبب واضح لا يقل عن 5 أحرف لهذه العملية',
        400,
        [{ field: 'reason', message: 'السبب إلزامي ولا يقل عن 5 أحرف' }]
      );
    }
  }
}

/**
 * BR-009: If a product appears in any historical order, archive instead of hard-deleting.
 */
export function evaluateProductDeletion(
  productId: string,
  orders: Order[]
): { mode: 'archive' | 'delete'; referencedOrdersCount: number } {
  let count = 0;
  for (const order of orders) {
    if (order.items.some((item) => item.productId === productId)) {
      count++;
    }
  }
  return {
    mode: count > 0 ? 'archive' : 'delete',
    referencedOrdersCount: count,
  };
}

/**
 * EC-09: Block deleting a delivery zone that is referenced by active orders.
 */
export function evaluateZoneDeletion(
  zoneId: string,
  orders: Order[]
): { allowed: boolean; activeOrdersCount: number } {
  let activeCount = 0;
  for (const order of orders) {
    if (ACTIVE_ORDER_STATUSES.has(order.status) && order.customer?.zoneId === zoneId) {
      activeCount++;
    }
  }
  return {
    allowed: activeCount === 0,
    activeOrdersCount: activeCount,
  };
}

/**
 * Admin user management guard: prevents self-deactivation and removing/demoting the last active manager.
 */
export function validateAdminUserMutation(
  target: AdminUser,
  patch: { role?: AdminRole; isActive?: boolean },
  allUsers: AdminUser[],
  actorId: string
): void {
  if (target.id === actorId && patch.isActive === false) {
    throw new BusinessRuleError(
      'SELF_DEACTIVATION_FORBIDDEN',
      'لا يمكنك إيقاف حسابك الحالي أثناء تسجيل الدخول',
      400
    );
  }

  const activeManagersCount = allUsers.filter((u) => u.role === 'manager' && u.isActive).length;
  const isTargetActiveManager = target.role === 'manager' && target.isActive;

  if (isTargetActiveManager && activeManagersCount <= 1) {
    if (patch.isActive === false) {
      throw new BusinessRuleError(
        'LAST_MANAGER_GUARD',
        'لا يمكن إيقاف آخر مدير نشط في النظام؛ يجب وجود مدير نشط واحد على الأقل',
        400
      );
    }
    if (patch.role && patch.role !== 'manager') {
      throw new BusinessRuleError(
        'LAST_MANAGER_GUARD',
        'لا يمكن تغيير دور آخر مدير نشط إلى موظف؛ يجب ترقية مدير آخر أولاً',
        400
      );
    }
  }
}
