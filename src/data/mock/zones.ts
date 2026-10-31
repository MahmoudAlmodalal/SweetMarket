import type { DeliveryZone } from '@/types';

/**
 * مناطق التوصيل المعتمدة ورسوم التوصيل والحد الأدنى للطلب
 * مطابقة لمواصفات PRD_v0.2 ومحددات SCR-05 و SCR-18
 */
export const MOCK_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'zone-gaza',
    name: 'مدينة غزة والرمال والنصر',
    deliveryFee: 10,
    minOrderAmount: 30,
    estimatedTimeMin: 30,
    estimatedTimeMax: 50,
    isActive: true,
  },
  {
    id: 'zone-middle',
    name: 'المحافظة الوسطى (دير البلح، النصيرات، الزوايدة، البريج)',
    deliveryFee: 12,
    minOrderAmount: 40,
    estimatedTimeMin: 40,
    estimatedTimeMax: 60,
    isActive: true,
  },
  {
    id: 'zone-khan-younis',
    name: 'خان يونس ووسط البلد والسطر',
    deliveryFee: 15,
    minOrderAmount: 50,
    estimatedTimeMin: 45,
    estimatedTimeMax: 75,
    isActive: true,
  },
  {
    id: 'zone-north',
    name: 'شمال غزة (جباليا، بيت لاهيا، بيت حانون)',
    deliveryFee: 15,
    minOrderAmount: 40,
    estimatedTimeMin: 45,
    estimatedTimeMax: 70,
    isActive: true,
  },
  {
    id: 'zone-rafah',
    name: 'مدينة رفح والحي الإداري والشابورة',
    deliveryFee: 20,
    minOrderAmount: 50,
    estimatedTimeMin: 60,
    estimatedTimeMax: 90,
    isActive: true,
  },
];
