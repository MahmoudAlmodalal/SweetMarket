'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  BellRing,
  CookingPot,
  Banknote,
  PackageX,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  LayoutDashboard,
} from 'lucide-react';
import { getOrders, getProducts } from '@/lib/repositories';
import type { Order, OrderStatus, Product } from '@/types';
import { ORDER_STATUS_LABELS } from '@/types';
import { OrderStatusBadge } from '@/components/admin/orders/order-status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/tokens';
import { useAdminAuth } from '@/context/admin-auth-context';

const ACTIVE_STATUSES: OrderStatus[] = ['accepted', 'in_preparation', 'out_for_delivery'];

const STATUS_ORDER: OrderStatus[] = [
  'new',
  'accepted',
  'in_preparation',
  'out_for_delivery',
  'delivered',
  'undelivered',
  'cancelled',
];

function isToday(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function AdminDashboardPage() {
  const { user } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const [fetchedOrders, fetchedProducts] = await Promise.all([
        getOrders(),
        getProducts(),
      ]);
      setOrders(fetchedOrders);
      setProducts(fetchedProducts);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'تعذر تحميل بيانات النظرة العامة';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const todayOrders = orders.filter((o) => isToday(o.createdAt));
  const newOrders = orders.filter((o) => o.status === 'new');
  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const todaySales = todayOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  const unavailableProducts = products.filter((p) => !p.isAvailable);

  const statusCounts = STATUS_ORDER.map((status) => ({
    status,
    count: orders.filter((o) => o.status === status).length,
  }));

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statCards = [
    {
      label: 'طلبات اليوم',
      value: todayOrders.length,
      icon: ShoppingBag,
      hint: `مبيعات اليوم ${formatPrice(todaySales)}`,
    },
    {
      label: 'طلبات جديدة بانتظار القبول',
      value: newOrders.length,
      icon: BellRing,
      hint: newOrders.length > 0 ? 'تحتاج مراجعة فورية' : 'لا طلبات معلقة',
    },
    {
      label: 'طلبات قيد التنفيذ',
      value: activeOrders.length,
      icon: CookingPot,
      hint: 'مقبول + قيد التجهيز + خرج للتوصيل',
    },
    {
      label: 'أصناف غير متاحة',
      value: unavailableProducts.length,
      icon: PackageX,
      hint: unavailableProducts.length > 0 ? 'راجع صفحة المنتجات' : 'كل الأصناف متاحة',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ترويسة الصفحة */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-card bg-candy-plum/10 text-candy-plum flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-candy-ink">نظرة عامة</h1>
            <p className="text-sm text-candy-muted mt-0.5">
              {user?.fullName ? `أهلاً ${user.fullName}، ` : ''}ملخص حي لنشاط المتجر اليوم
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => loadData(true)}
          disabled={isLoading || isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={isRefreshing ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
          تحديث
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* بطاقات الإحصاءات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-card" />
            ))
          : statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-card bg-white border border-candy-line p-4 flex items-start gap-3"
              >
                <span className="w-10 h-10 rounded-input bg-candy-soft text-candy-berry flex items-center justify-center shrink-0">
                  <card.icon className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-2xl font-extrabold text-candy-ink tabular-nums">
                    {card.value}
                  </div>
                  <div className="text-xs font-bold text-candy-ink mt-0.5">{card.label}</div>
                  <div className="text-[11px] text-candy-muted mt-0.5">{card.hint}</div>
                </div>
              </div>
            ))}
      </div>

      {/* توزيع الحالات */}
      <section
        aria-label="توزيع الطلبات حسب الحالة"
        className="rounded-card bg-white border border-candy-line p-4 sm:p-5"
      >
        <h2 className="font-display text-lg font-bold text-candy-ink mb-3">
          توزيع الطلبات حسب الحالة
        </h2>
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-28 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {statusCounts.map(({ status, count }) => (
              <Link
                key={status}
                href="/admin/orders"
                className="inline-flex items-center gap-2 rounded-full border border-candy-line bg-candy-soft/40 px-3 py-1.5 text-xs font-bold text-candy-ink hover:border-candy-berry/40 transition-colors"
              >
                <OrderStatusBadge status={status} size="sm" />
                <span className="tabular-nums text-candy-muted">{count}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* أحدث الطلبات */}
      <section
        aria-label="أحدث الطلبات"
        className="rounded-card bg-white border border-candy-line p-4 sm:p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-bold text-candy-ink">أحدث الطلبات</h2>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-candy-berry hover:underline"
          >
            كل الطلبات
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-input" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="text-sm text-candy-muted py-6 text-center">
            لا توجد طلبات بعد. ستظهر هنا أحدث الطلبات فور وصولها.
          </p>
        ) : (
          <ul className="divide-y divide-candy-line/60">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 px-1 hover:bg-candy-cream/40 rounded-input transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-candy-ink" dir="ltr">
                        {order.orderNumber}
                      </span>
                      <OrderStatusBadge status={order.status} size="sm" />
                    </div>
                    <div className="text-xs text-candy-muted mt-1">
                      {order.customer.fullName} • {order.items.length} صنف
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-extrabold text-sm text-candy-ink tabular-nums">
                      {formatPrice(order.total)}
                    </div>
                    <div className="text-[11px] text-candy-muted mt-0.5">
                      {new Date(order.createdAt).toLocaleTimeString('ar-PS', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* الأصناف غير المتاحة - تظهر فقط عند وجود أصناف موقوفة */}
      {!isLoading && unavailableProducts.length > 0 && (
        <section
          aria-label="الأصناف غير المتاحة"
          className="rounded-card bg-white border border-candy-line p-4 sm:p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PackageX className="w-4 h-4 text-candy-berry" />
              <h2 className="font-display text-lg font-bold text-candy-ink">
                أصناف غير متاحة للزبائن
              </h2>
              <span className="text-xs font-bold text-candy-muted tabular-nums">
                ({unavailableProducts.length})
              </span>
            </div>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1 text-xs font-bold text-candy-berry hover:underline"
            >
              كل المنتجات
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-xs text-candy-muted mb-3">
            هذه الأصناف مخفية عن واجهة المتجر حتى إعادة تفعيل توفرها.
          </p>
          <ul className="divide-y divide-candy-line/60">
            {unavailableProducts.slice(0, 6).map((product) => (
              <li key={product.id}>
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="flex items-center justify-between gap-2 py-2.5 px-1 hover:bg-candy-cream/40 rounded-input transition-colors"
                >
                  <span className="font-bold text-sm text-candy-ink truncate">
                    {product.name}
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-candy-muted tabular-nums">
                      {formatPrice(product.salePrice ?? product.price)}
                    </span>
                    <span className="text-[11px] font-bold text-candy-berry">
                      تعديل
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {unavailableProducts.length > 6 && (
            <p className="text-[11px] text-candy-muted mt-2">
              و{unavailableProducts.length - 6} صنف آخر في صفحة المنتجات.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
