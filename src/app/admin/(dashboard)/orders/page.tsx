'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  Bell,
  Clock,
  TrendingUp,
  PackageCheck,
  Truck,
  Sparkles,
} from 'lucide-react';
import { getOrders, getDeliveryZones } from '@/lib/repositories';
import type { Order, DeliveryZone } from '@/types';
import { OrdersDataTable } from '@/components/admin/orders/orders-data-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const loadData = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const [fetchedOrders, fetchedZones] = await Promise.all([
          getOrders(),
          getDeliveryZones(),
        ]);

        setOrders(fetchedOrders);
        setZones(fetchedZones);

        if (isManualRefresh) {
          toast({
            title: 'تم التحديث بنجاح',
            description: `تم تحديث قائمة الطلبات (${fetchedOrders.length} طلب حالي)`,
            variant: 'success',
          });
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'تعذر تحميل بيانات الطلبات من النظام';
        setError(message);
        toast({
          title: 'خطأ في جلب البيانات',
          description: message,
          variant: 'error',
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // إحصائيات سريعة للطلبات
  const newOrdersCount = orders.filter((o) => o.status === 'new').length;
  const inProgressCount = orders.filter(
    (o) => o.status === 'accepted' || o.status === 'in_preparation' || o.status === 'out_for_delivery'
  ).length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. الترويسة الرئيسية وأزرار التحكم */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-candy-ink">
              إدارة الطلبات
            </h1>
            <span className="bg-candy-blush text-candy-berry font-bold text-xs px-2.5 py-0.5 rounded-full border border-candy-line-dark">
              SCR-13
            </span>
          </div>
          <p className="font-sans text-xs sm:text-sm text-candy-muted mt-1">
            متابعة ومراجعة طلبات الزبائن الواردة، ومعالجة الطلبات الجديدة أولاً وتحديث مسار التوصيل.
          </p>
        </div>

        {/* زر التحديث اليدوي */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadData(true)}
            isLoading={isRefreshing}
            disabled={isLoading || isRefreshing}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            className="border-candy-line shadow-sm hover:border-candy-strawberry"
          >
            تحديث القائمة
          </Button>
        </div>
      </div>

      {/* 2. مؤشر الطلبات الجديدة (FR-027 / UX_BLUEPRINT SCR-13) */}
      {!isLoading && newOrdersCount > 0 && (
        <div className="bg-gradient-to-l from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-sm text-blue-900">
                تنبيه: يوجد {newOrdersCount} {newOrdersCount === 1 ? 'طلب جديد' : 'طلبات جديدة'} بانتظار المراجعة!
              </h2>
              <p className="font-sans text-xs text-blue-700 mt-0.5">
                يرجى قبول الطلبات والبدء بتجهيزها لضمان سرعة التسليم للزبائن.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-blue-800 bg-white/80 border border-blue-200 px-3 py-1 rounded-full whitespace-nowrap self-end sm:self-auto">
            معالجة عاجلة
          </span>
        </div>
      )}

      {/* 3. بطاقات الإحصاءات السريعة (Stats Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* إجمالي الطلبات */}
        <div className="bg-white p-4 rounded-2xl border border-candy-line shadow-candy-1 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-candy-blush text-candy-berry flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-sans text-xs text-candy-muted block truncate">
              إجمالي الطلبات
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-14 mt-1" />
            ) : (
              <strong className="font-sans font-extrabold text-xl text-candy-ink">
                {orders.length}
              </strong>
            )}
          </div>
        </div>

        {/* بانتظار المراجعة (جديد) */}
        <div className="bg-white p-4 rounded-2xl border border-candy-line shadow-candy-1 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-sans text-xs text-blue-700 font-semibold block truncate">
              طلبات جديدة
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-12 mt-1" />
            ) : (
              <strong className="font-sans font-extrabold text-xl text-blue-700">
                {newOrdersCount}
              </strong>
            )}
          </div>
        </div>

        {/* قيد المعالجة والتوصيل */}
        <div className="bg-white p-4 rounded-2xl border border-candy-line shadow-candy-1 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-sans text-xs text-amber-800 font-semibold block truncate">
              قيد التجهيز / التوصيل
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-12 mt-1" />
            ) : (
              <strong className="font-sans font-extrabold text-xl text-amber-800">
                {inProgressCount}
              </strong>
            )}
          </div>
        </div>

        {/* إجمالي المبيعات النشطة */}
        <div className="bg-white p-4 rounded-2xl border border-candy-line shadow-candy-1 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-sans text-xs text-emerald-800 font-semibold block truncate">
              إجمالي القيمة
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-20 mt-1" />
            ) : (
              <strong className="font-sans font-extrabold text-lg sm:text-xl text-emerald-800">
                {totalRevenue.toFixed(0)} ₪
              </strong>
            )}
          </div>
        </div>
      </div>

      {/* 4. معالجة حالات الخطأ (Error State) */}
      {error && !isLoading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-base text-rose-900">
            تعذر تحميل قائمة الطلبات
          </h3>
          <p className="font-sans text-xs sm:text-sm text-rose-700 max-w-md mx-auto">
            {error}
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => loadData(false)}
            className="mx-auto"
          >
            إعادة المحاولة
          </Button>
        </div>
      )}

      {/* 5. حالة الهياكل العظمية أثناء التحميل (Loading Skeletons) */}
      {isLoading ? (
        <div className="space-y-4">
          {/* Skeleton Tabs & Search Bar */}
          <div className="bg-white rounded-2xl border border-candy-line p-4 space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-xl shrink-0" />
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </div>

          {/* Skeleton Table Rows */}
          <div className="bg-white rounded-2xl border border-candy-line p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border-b border-candy-line/60 last:border-none gap-4"
              >
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 6. جدول الطلبات المتكامل مع الفلترة والبحث */
        !error && (
          <OrdersDataTable
            orders={orders}
            zones={zones}
            onRefresh={() => loadData(true)}
            isRefreshing={isRefreshing}
          />
        )
      )}
    </div>
  );
}
