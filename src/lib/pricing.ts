/**
 * نظام تسعير المنتجات الموحد لمتجر كاندي لوز (Storefront Canonical Pricing)
 * المصدر المعتمد والوحيد لاحتساب أسعار البنود، الخصومات، وخيارات التغليف
 * وفق التذكرة #26 (T-22)
 */

import type { Product, ProductWeightOption } from '@/types';

/**
 * معرّف خيار التغليف
 */
export type PackagingOptionId = 'standard' | 'royal';

/**
 * بيانات خيار التغليف
 */
export interface PackagingOption {
  id: PackagingOptionId;
  label: string;
  fee: number;
}

/**
 * خيارات التغليف المعتمدة
 */
export const PACKAGING_OPTIONS: readonly PackagingOption[] = [
  { id: 'standard', label: 'تغليف عادي', fee: 0 },
  { id: 'royal', label: 'صندوق إهداء ملكي', fee: 25 },
] as const;

/**
 * خيار التغليف الافتراضي
 */
export const DEFAULT_PACKAGING_OPTION_ID: PackagingOptionId = 'standard';

/**
 * جلب خيار الوزن الافتراضي للمنتج (المضاعف 1، أو أول خيار متاح، أو undefined إذا لم تتوفر خيارات وزن)
 */
export function getDefaultWeightOption(product: Product): ProductWeightOption | undefined {
  if (!product.availableWeights || product.availableWeights.length === 0) {
    return undefined;
  }
  return product.availableWeights.find((w) => w.multiplier === 1) ?? product.availableWeights[0];
}

/**
 * مدخلات احتساب سعر البند
 */
export interface ComputeLinePriceInput {
  product: Product;
  weightOption?: ProductWeightOption;
  packagingOptionId?: PackagingOptionId;
  quantity: number;
}

/**
 * مخرجات احتساب سعر البند
 */
export interface ComputedLinePrice {
  listUnitPrice: number;
  unitPrice: number;
  lineTotal: number;
  discount: number;
}

/**
 * احتساب السعر الموحد للبند شاملاً التغليف والخصم والإجمالي
 *
 * - listUnitPrice: السعر الأساسي للوحدة قبل الخصم (الرقم المشطوب)
 * - baseUnitPrice: سعر الوحدة الفعلي بعد الخصم للمنتج أو خيار الوزن
 * - unitPrice: سعر الوحدة النهائي متضمناً رسوم التغليف
 * - discount: قيمة الخصم لكل وحدة (listUnitPrice - baseUnitPrice)، لا تقل عن صفر
 * - lineTotal: الإجمالي = unitPrice × quantity (صفر إذا كانت الكمية <= 0)
 */
export function computeLinePrice(input: {
  product: Product;
  weightOption?: ProductWeightOption;
  packagingOptionId?: PackagingOptionId;
  quantity: number;
}): {
  listUnitPrice: number;
  unitPrice: number;
  lineTotal: number;
  discount: number;
} {
  const { product, weightOption, packagingOptionId, quantity } = input;

  // خيار التغليف، مع الرجوع للتغليف العادي في حال عدم التعرف على الخيار
  const packaging =
    PACKAGING_OPTIONS.find((pkg) => pkg.id === packagingOptionId) ?? PACKAGING_OPTIONS[0];
  const packagingFee = packaging.fee;

  // سعر القائمة للوحدة قبل الخصم
  const listUnitPrice = weightOption?.price ?? product.price;

  // سعر الوحدة الأساسي بعد الخصم
  const baseUnitPrice =
    weightOption?.salePrice ?? weightOption?.price ?? product.salePrice ?? product.price;

  // سعر الوحدة النهائي بعد إضافة رسوم التغليف
  const unitPrice = baseUnitPrice + packagingFee;

  // قيمة الخصم لكل وحدة (غير سالبة إطلاقاً)
  const discount = Math.max(0, listUnitPrice - baseUnitPrice);

  // إجمالي السطر (صفر إذا كانت الكمية <= 0)
  const lineTotal = quantity <= 0 ? 0 : unitPrice * quantity;

  return {
    listUnitPrice,
    unitPrice,
    lineTotal,
    discount,
  };
}
