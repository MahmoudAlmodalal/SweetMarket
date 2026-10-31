'use client';

import React from 'react';
import {
  MapPin,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ShoppingBag,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DeliveryZone } from '@/types';

export interface ZonesTableProps {
  zones: DeliveryZone[];
  activeOrdersCountByZone?: Record<string, number>;
  onEdit: (zone: DeliveryZone) => void;
  onDelete: (zone: DeliveryZone) => void;
  onToggleActive: (zone: DeliveryZone) => void;
  onAddNew?: () => void;
  isLoading?: boolean;
  canManage?: boolean;
}

export function ZonesTable({
  zones,
  activeOrdersCountByZone = {},
  onEdit,
  onDelete,
  onToggleActive,
  onAddNew,
  isLoading = false,
  canManage = true,
}: ZonesTableProps) {
  // حالة التحميل (Loading Skeletons)
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="جاري تحميل مناطق التوصيل">
        <div className="hidden md:block rounded-2xl bg-white border border-candy-line p-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-candy-line/40 last:border-0 animate-pulse">
              <Skeleton className="w-48 h-5 rounded-md" />
              <Skeleton className="w-20 h-5 rounded-md" />
              <Skeleton className="w-20 h-5 rounded-md" />
              <Skeleton className="w-28 h-5 rounded-md" />
              <Skeleton className="w-16 h-7 rounded-full" />
              <Skeleton className="w-20 h-8 rounded-full" />
            </div>
          ))}
        </div>
        <div className="md:hidden space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-white border border-candy-line space-y-3 animate-pulse">
              <Skeleton className="w-3/4 h-5 rounded-md" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-4 rounded-md" />
                <Skeleton className="h-4 rounded-md" />
              </div>
              <Skeleton className="w-full h-8 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // حالة الفراغ (Empty State)
  if (zones.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-3xl bg-white border border-candy-line shadow-candy-1">
        <div className="w-16 h-16 rounded-2xl bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8" aria-hidden="true" />
        </div>
        <h3 className="font-display font-bold text-lg text-candy-ink mb-1">
          لا توجد مناطق توصيل معرفة
        </h3>
        <p className="font-sans text-xs text-candy-muted max-w-sm mx-auto mb-6">
          أضف محافظات ومناطق التوصيل في فلسطين ورسوم التوصيل والحد الأدنى لكل منطقة ليتمكن الزبائن من الطلب.
        </p>
        {canManage && onAddNew && (
          <Button
            type="button"
            variant="primary"
            onClick={onAddNew}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            إضافة أول منطقة توصيل
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. جدول الشاشات المتوسطة والكبيرة (Desktop View: >= 768px) */}
      <div className="hidden md:block overflow-hidden rounded-2xl bg-white border border-candy-line shadow-candy-1">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse" aria-label="جدول مناطق التوصيل والرسوم">
            <thead>
              <tr className="bg-candy-soft/60 border-b border-candy-line text-xs font-bold text-candy-ink font-sans">
                <th scope="col" className="py-3.5 px-4 font-bold">المنطقة / المحافظة</th>
                <th scope="col" className="py-3.5 px-4 font-bold">رسوم التوصيل</th>
                <th scope="col" className="py-3.5 px-4 font-bold">الحد الأدنى للطلب</th>
                <th scope="col" className="py-3.5 px-4 font-bold">وقت التوصيل المتوقع</th>
                <th scope="col" className="py-3.5 px-4 font-bold">الحالة</th>
                <th scope="col" className="py-3.5 px-4 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-candy-line/60 font-sans text-xs sm:text-sm">
              {zones.map((zone) => {
                const activeOrders = activeOrdersCountByZone[zone.id] ?? 0;
                const hasActiveOrders = activeOrders > 0;

                return (
                  <tr
                    key={zone.id}
                    className={cn(
                      'hover:bg-candy-soft/40 transition-colors',
                      !zone.isActive && 'bg-gray-50/70 opacity-80'
                    )}
                  >
                    {/* اسم المنطقة */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-candy-ink block truncate">
                            {zone.name}
                          </span>
                          {hasActiveOrders && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-semibold mt-0.5">
                              <ShoppingBag className="w-3 h-3" />
                              <span>{activeOrders} طلبات نشطة قيد التجهيز</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* رسوم التوصيل */}
                    <td className="py-3.5 px-4">
                      {zone.deliveryFee === 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          مجاني
                        </span>
                      ) : (
                        <span className="font-bold text-candy-ink font-mono text-sm">
                          {zone.deliveryFee} <span className="font-sans text-xs text-candy-muted">شيكل ₪</span>
                        </span>
                      )}
                    </td>

                    {/* الحد الأدنى للطلب */}
                    <td className="py-3.5 px-4">
                      {zone.minOrderAmount === 0 ? (
                        <span className="text-candy-muted text-xs">لا يوجد حد</span>
                      ) : (
                        <span className="font-bold text-candy-ink font-mono text-sm">
                          {zone.minOrderAmount} <span className="font-sans text-xs text-candy-muted">شيكل ₪</span>
                        </span>
                      )}
                    </td>

                    {/* الوقت التقديري */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-candy-muted font-sans">
                        <Clock className="w-3.5 h-3.5 text-candy-berry shrink-0" aria-hidden="true" />
                        <span className="font-semibold text-candy-ink font-mono">
                          {zone.estimatedTimeMin} - {zone.estimatedTimeMax}
                        </span>
                        <span>دقيقة</span>
                      </span>
                    </td>

                    {/* الحالة ومفتاح التبديل السريع */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onToggleActive(zone)}
                        disabled={!canManage}
                        aria-label={`تبديل حالة منطقة ${zone.name} (حالياً ${zone.isActive ? 'مفعّلة' : 'معطّلة'})`}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-sans font-semibold transition-all duration-200 border',
                          zone.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200',
                          !canManage && 'opacity-60 cursor-not-allowed'
                        )}
                      >
                        {zone.isActive ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>مفعّلة</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                            <span>معطّلة</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* الإجراءات */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onEdit(zone)}
                          disabled={!canManage}
                          aria-label={`تعديل منطقة ${zone.name}`}
                          title={`تعديل منطقة ${zone.name}`}
                          className="h-8 px-2.5"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-candy-berry" />
                          <span className="mr-1 text-xs">تعديل</span>
                        </Button>

                        <div className="relative inline-block">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(zone)}
                            disabled={hasActiveOrders || !canManage}
                            aria-label={
                              hasActiveOrders
                                ? `لا يمكن حذف ${zone.name} لوجود طلبات نشطة (EC-09)`
                                : `حذف منطقة ${zone.name}`
                            }
                            title={
                              hasActiveOrders
                                ? `لا يمكن حذف منطقة مرتبطة بطلبات نشطة قيد التجهيز (EC-09)، يرجى تعطيلها بدلاً من ذلك`
                                : `حذف منطقة ${zone.name}`
                            }
                            className={cn(
                              'h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50',
                              hasActiveOrders && 'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-rose-600'
                            )}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. بطاقات الجوال للشاشات الصغيرة (Mobile Cards: < 768px) */}
      <div className="md:hidden space-y-3" role="list" aria-label="قائمة مناطق التوصيل">
        {zones.map((zone) => {
          const activeOrders = activeOrdersCountByZone[zone.id] ?? 0;
          const hasActiveOrders = activeOrders > 0;

          return (
            <div
              key={zone.id}
              role="listitem"
              className={cn(
                'p-4 rounded-2xl bg-white border transition-all duration-200 shadow-candy-1 space-y-3',
                zone.isActive ? 'border-candy-line' : 'border-candy-line/60 bg-gray-50/70 opacity-90'
              )}
            >
              {/* ترويسة البطاقة: الاسم والحالة */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-candy-ink">
                      {zone.name}
                    </h4>
                    {hasActiveOrders && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-semibold mt-0.5">
                        <ShoppingBag className="w-3 h-3" />
                        <span>{activeOrders} طلبات نشطة</span>
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleActive(zone)}
                  disabled={!canManage}
                  aria-label={`تبديل حالة منطقة ${zone.name}`}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-sans font-semibold border shrink-0',
                    zone.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  )}
                >
                  {zone.isActive ? (
                    <>
                      <Eye className="w-3 h-3 text-emerald-600" />
                      <span>مفعّلة</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 text-gray-500" />
                      <span>معطّلة</span>
                    </>
                  )}
                </button>
              </div>

              {/* تفاصيل الرسوم والحد الأدنى والوقت */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-candy-soft/60 border border-candy-line text-center text-xs">
                <div>
                  <span className="text-[10px] text-candy-muted block mb-0.5">رسوم التوصيل</span>
                  <span className="font-bold text-candy-ink font-mono">
                    {zone.deliveryFee === 0 ? 'مجاني' : `${zone.deliveryFee} ₪`}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-candy-muted block mb-0.5">الحد الأدنى</span>
                  <span className="font-bold text-candy-ink font-mono">
                    {zone.minOrderAmount === 0 ? 'لا يوجد' : `${zone.minOrderAmount} ₪`}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-candy-muted block mb-0.5">الوقت المتوقع</span>
                  <span className="font-bold text-candy-ink font-mono">
                    {zone.estimatedTimeMin}-{zone.estimatedTimeMax} د
                  </span>
                </div>
              </div>

              {/* أزرار الإجراءات على الجوال */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-candy-line/60">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(zone)}
                  disabled={!canManage}
                  className="flex-1 text-xs h-8"
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  تعديل الرسوم
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(zone)}
                  disabled={hasActiveOrders || !canManage}
                  title={
                    hasActiveOrders
                      ? 'لا يمكن حذف المنطقة لوجود طلبات نشطة (EC-09)'
                      : 'حذف المنطقة'
                  }
                  className={cn(
                    'text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-3 text-xs',
                    hasActiveOrders && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ZonesTable;
