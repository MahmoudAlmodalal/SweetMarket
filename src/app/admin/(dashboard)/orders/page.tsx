'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  Bell,
  Clock,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { getOrders, getDeliveryZones } from '@/lib/repositories';
import type { Order, DeliveryZone } from '@/types';
import { OrdersDataTable, type FilterTabKey } from '@/components/admin/orders/orders-data-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTabKey>('all');

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
  const grossRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const netRevenue = orders
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

      {/* 2. مؤشر الطلبات الجديدة السريع */}
      {!isLoading && newOrdersCount > 0 && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('new')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTab('new');
            }
          }}
          className="bg-candy-cream border border-candy-ink rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-candy-ink transition-colors cursor-pointer select-none"
          title="انقر لتصفية الطلبات الجديدة"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-candy-berry text-white flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-sm text-candy-ink tabular-nums">
                يوجد {newOrdersCount} {newOrdersCount === 1 ? 'طلب جديد' : 'طلبات جديدة'} بانتظار المراجعة
              </h2>
              <p className="font-sans text-xs text-candy-muted mt-0.5">
                راجع الطلبات الجديدة وابدأ التجهيز لضمان سرعة التسليم.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('new');
            }}
            className="text-xs font-sans font-bold text-candy-berry bg-candy-soft border border-candy-line px-3.5 py-1.5 rounded-full whitespace-nowrap self-end sm:self-auto hover:bg-candy-berry hover:text-white transition-colors cursor-pointer"
          >
            عرض الطلبات الجديدة
          </button>
        </div>
      )}

      {/* 3. بطاقات الإحصاءات السريعة (Stats Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-candy-cream p-4 sm:p-5 rounded-2xl border border-candy-line flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-candy-soft text-candy-berry flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-sans text-xs text-candy-muted block">
              إجمالي الطلبات
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-14 mt-1" />
            ) : (
              <strong className="font-sans font-extrabold text-2xl text-candy-ink tabular-nums">
                {orders.length}
              </strong>
            )}
          </div>
        </div>

        <div className="bg-candy-cream p-4 sm:p-5 rounded-2xl border border-candy-line flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-sans text-xs text-candy-muted font-medium block">
              طلبات جديدة
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-12 mt-1" />
            ) : (
              <strong className="font-sans font-extrabold text-2xl text-blue-700 tabular-nums">
                {newOrdersCount}
              </strong>
            )}
          </div>
        </div>

        <div className="bg-candy-cream p-4 sm:p-5 rounded-2xl border border-candy-line flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-sans text-xs text-candy-muted font-medium block">
              قيد التجهيز والتوصيل
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-12 mt-1" />
            ) : (
              <strong className="font-sans font-extrabold text-2xl text-amber-800 tabular-nums">
                {inProgressCount}
              </strong>
            )}
          </div>
        </div>

        <div className="bg-candy-cream p-4 sm:p-5 rounded-2xl border border-candy-line flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-sans text-xs text-candy-muted block">
              صافي المبيعات المعتمدة
            </span>
            {isLoading ? (
              <div className="space-y-1 mt-1">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            ) : (
              <div className="space-y-0.5 tabular-nums">
                <strong className="font-sans font-extrabold text-xl text-emerald-800 block whitespace-nowrap">
                  {netRevenue.toFixed(0)} ₪
                </strong>
                <span className="text-[11px] text-candy-muted block font-sans truncate">
                  الإجمالي: {grossRevenue.toFixed(0)} ₪
                </span>
              </div>
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
          <div className="bg-candy-cream rounded-2xl border border-candy-line p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-1.5 pb-2">
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
          <div className="bg-candy-cream rounded-2xl border border-candy-line p-4 space-y-3">
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
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )
      )}
    </div>
  );
}
