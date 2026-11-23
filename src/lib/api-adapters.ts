import type {
  AdminUser,
  CartItem,
  Category,
  DeliveryZone,
  Order,
  OrderStatus,
  OrderTimelineEvent,
  Product,
  ProductWeightOption,
} from '@/types';

type UnknownRecord = Record<string, unknown>;

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Normalizes a Category object from either Next.js /api/v1 or Django DRF /api/v1.
 */
export function adaptCategory(raw: UnknownRecord): Category {
  return {
    id: String(raw.id ?? ''),
    slug: String(raw.slug ?? ''),
    name: String(raw.name ?? ''),
    description: raw.description ? String(raw.description) : '',
    imageUrl: String(raw.imageUrl ?? raw.image_url ?? '/categories/all.svg'),
    displayOrder: toNumber(raw.displayOrder ?? raw.display_order, 0),
    isActive: typeof raw.isActive === 'boolean' ? raw.isActive : Boolean(raw.is_active ?? true),
  };
}

/**
 * Normalizes a Product object from either Next.js /api/v1 or Django DRF /api/v1.
 */
export function adaptProduct(raw: UnknownRecord): Product {
  const rawWeights = (raw.availableWeights ?? raw.available_weights) as unknown;
  const availableWeights: ProductWeightOption[] | undefined = Array.isArray(rawWeights)
    ? rawWeights.map((w) => {
        const wRec = w as UnknownRecord;
        const sale = wRec.salePrice ?? wRec.sale_price;
        return {
          label: String(wRec.label ?? ''),
          multiplier: toNumber(wRec.multiplier, 1),
          price: toNumber(wRec.price, 0),
          ...(sale !== null && sale !== undefined && toNumber(sale) > 0
            ? { salePrice: toNumber(sale) }
            : {}),
        };
      })
    : undefined;

  const rawSale = raw.salePrice ?? raw.sale_price;
  const salePrice =
    rawSale !== null && rawSale !== undefined && toNumber(rawSale) > 0
      ? toNumber(rawSale)
      : undefined;

  const imageUrl = String(raw.imageUrl ?? raw.image_url ?? '');
  const rawGallery = (raw.galleryImages ?? raw.gallery_images) as unknown;
  const galleryImages = Array.isArray(rawGallery) && rawGallery.length > 0
    ? rawGallery.map((g) => String(g))
    : imageUrl
    ? [imageUrl]
    : [];

  return {
    id: String(raw.id ?? ''),
    slug: String(raw.slug ?? ''),
    name: String(raw.name ?? ''),
    nameEn: raw.nameEn || raw.name_en ? String(raw.nameEn ?? raw.name_en) : undefined,
    description: String(raw.description ?? ''),
    categoryId: String(raw.categoryId ?? raw.category_id ?? ''),
    price: toNumber(raw.price, 0),
    salePrice,
    unit: (raw.unit as Product['unit']) || 'kg',
    imageUrl,
    galleryImages,
    isAvailable:
      typeof raw.isAvailable === 'boolean'
        ? raw.isAvailable
        : typeof raw.is_available === 'boolean'
        ? raw.is_available
        : true,
    isFeatured: Boolean(raw.isFeatured ?? raw.is_featured ?? false),
    availableWeights: availableWeights && availableWeights.length > 0 ? availableWeights : undefined,
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? new Date().toISOString()),
  };
}

/**
 * Normalizes a DeliveryZone object from either Next.js /api/v1 or Django DRF /api/v1.
 */
export function adaptDeliveryZone(raw: UnknownRecord): DeliveryZone {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    deliveryFee: toNumber(raw.deliveryFee ?? raw.delivery_fee, 0),
    minOrderAmount: toNumber(raw.minOrderAmount ?? raw.min_order_amount, 0),
    estimatedTimeMin: toNumber(raw.estimatedTimeMin ?? raw.estimated_time_min, 30),
    estimatedTimeMax: toNumber(raw.estimatedTimeMax ?? raw.estimated_time_max, 60),
    isActive: typeof raw.isActive === 'boolean' ? raw.isActive : Boolean(raw.is_active ?? true),
  };
}

/**
 * Normalizes an OrderItem from either frontend CartItem or Django OrderItemSerializer.
 */
export function adaptOrderItem(raw: UnknownRecord): CartItem {
  const weightMult = raw.selectedWeightMultiplier ?? raw.weightMultiplier ?? raw.weight_multiplier;
  const weightLabel = raw.selectedWeightLabel ?? raw.weightLabel ?? raw.weight_label;
  const pkgFee = toNumber(raw.packagingFee ?? raw.packaging_fee, 0);
  const pkgId =
    raw.packagingOptionId === 'royal' || pkgFee > 0 ? 'royal' : 'standard';

  return {
    id: String(raw.id ?? `${raw.productId ?? raw.product_id ?? 'item'}`),
    productId: String(raw.productId ?? raw.product_id ?? ''),
    productName: String(raw.productName ?? raw.product_name ?? ''),
    productSlug: String(raw.productSlug ?? raw.product_slug ?? ''),
    imageUrl: String(raw.imageUrl ?? raw.productImageUrl ?? raw.product_image_url ?? ''),
    unitPrice: toNumber(raw.unitPrice ?? raw.unit_price, 0),
    listUnitPrice: raw.listUnitPrice !== undefined ? toNumber(raw.listUnitPrice) : undefined,
    unit: (raw.unit as CartItem['unit']) || 'kg',
    selectedWeightMultiplier: weightMult !== undefined && weightMult !== null ? toNumber(weightMult) : undefined,
    selectedWeightLabel: weightLabel ? String(weightLabel) : undefined,
    packagingOptionId: pkgId,
    packagingLabel: raw.packagingLabel || raw.packaging_label ? String(raw.packagingLabel ?? raw.packaging_label) : undefined,
    packagingFee: pkgFee,
    giftMessage: raw.giftMessage || raw.gift_message ? String(raw.giftMessage ?? raw.gift_message) : undefined,
    quantity: toNumber(raw.quantity, 1),
    lineTotal: toNumber(raw.lineTotal ?? raw.line_total, 0),
  };
}

/**
 * Normalizes an OrderTimelineEvent from either frontend schema or Django OrderStatusHistorySerializer.
 */
export function adaptTimelineEvent(raw: UnknownRecord): OrderTimelineEvent {
  const actor = (raw.performedBy ?? raw.performed_by) as UnknownRecord | null | undefined;
  return {
    status: String(raw.status ?? raw.toStatus ?? raw.to_status ?? 'new') as OrderStatus,
    timestamp: String(raw.timestamp ?? raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    note: raw.note
      ? String(raw.note)
      : raw.reason
      ? String(raw.reason)
      : raw.label
      ? String(raw.label)
      : undefined,
    performedBy: actor
      ? {
          id: String(actor.id ?? 'usr-admin'),
          name: String(actor.name ?? actor.fullName ?? actor.full_name ?? 'مسؤول المتجر'),
          role: (actor.role === 'manager' ? 'manager' : 'staff'),
        }
      : undefined,
  };
}

/**
 * Normalizes an Order object from either Next.js /api/v1 or Django DRF /api/v1.
 */
export function adaptOrder(raw: UnknownRecord): Order {
  const rawCust = (raw.customer || {}) as UnknownRecord;
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const rawTimeline = Array.isArray(raw.timeline) ? raw.timeline : [];

  return {
    id: String(raw.id ?? ''),
    orderNumber: String(raw.orderNumber ?? raw.order_number ?? ''),
    status: String(raw.status ?? 'new') as OrderStatus,
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? raw.createdAt ?? new Date().toISOString()),
    customer: {
      fullName: String(rawCust.fullName ?? rawCust.name ?? ''),
      phone: String(rawCust.phone ?? ''),
      zoneId: String(rawCust.zoneId ?? rawCust.zone_id ?? ''),
      streetAddress: String(rawCust.streetAddress ?? rawCust.street_address ?? ''),
      buildingOrApt: rawCust.buildingOrApt || rawCust.building_or_apt
        ? String(rawCust.buildingOrApt ?? rawCust.building_or_apt)
        : undefined,
      notes: rawCust.notes ? String(rawCust.notes) : undefined,
    },
    items: rawItems.map((it) => adaptOrderItem(it as UnknownRecord)),
    subtotal: toNumber(raw.subtotal, 0),
    deliveryFee: toNumber(raw.deliveryFee ?? raw.delivery_fee, 0),
    total: toNumber(raw.total, 0),
    paymentMethod: 'cash_on_delivery',
    timeline: rawTimeline.map((ev) => adaptTimelineEvent(ev as UnknownRecord)),
    cancelReason: raw.cancelReason || raw.cancel_reason ? String(raw.cancelReason ?? raw.cancel_reason) : undefined,
    trackingToken: raw.trackingToken || raw.tracking_token ? String(raw.trackingToken ?? raw.tracking_token) : undefined,
  };
}

/**
 * Normalizes an AdminUser from either Next.js /api/v1 or Django DRF /api/v1.
 */
export function adaptAdminUser(raw: UnknownRecord): AdminUser {
  const role = raw.role === 'manager' ? 'manager' : 'staff';
  return {
    id: String(raw.id ?? ''),
    username: String(raw.username ?? ''),
    fullName: String(raw.fullName ?? raw.full_name ?? ''),
    jobTitle: raw.jobTitle || raw.job_title
      ? String(raw.jobTitle ?? raw.job_title)
      : role === 'manager'
      ? 'مدير المتجر العام'
      : 'مشرف تشغيل',
    email: String(raw.email ?? ''),
    role,
    isActive: typeof raw.isActive === 'boolean' ? raw.isActive : Boolean(raw.is_active ?? true),
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
  };
}
