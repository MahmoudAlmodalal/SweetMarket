'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  Phone,
  Calendar,
  Clock,
  ArrowUpDown,
  ExternalLink,
  ChevronLeft,
  Package,
  MapPin,
  RefreshCw,
  Filter,
  Inbox,
  User,
} from 'lucide-react';
import type { Order, OrderStatus, DeliveryZone } from '@/types';
import { OrderStatusBadge } from './order-status-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface OrdersDataTableProps {
  orders: Order[];
  zones?: DeliveryZone[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

type FilterTabKey = 'all' | OrderStatus;

interface TabDefinition {
  key: FilterTabKey;
  label: string;
  statusMatch?: OrderStatus;
}

const FILTER_TABS: TabDefinition[] = [
  { key: 'all', label: 'الكل' },
  { key: 'new', label: 'جديد', statusMatch: 'new' },
  { key: 'accepted', label: 'مقبول', statusMatch: 'accepted' },
  { key: 'in_preparation', label: 'قيد التجهيز', statusMatch: 'in_preparation' },
  { key: 'out_for_delivery', label: 'خرج للتوصيل', statusMatch: 'out_for_delivery' },
  { key: 'delivered', label: 'تم التسليم', statusMatch: 'delivered' },
  { key: 'cancelled', label: 'ملغي', statusMatch: 'cancelled' },
];

/**
 * تنسيق الوقت والتاريخ باللغة العربية
 */
function formatOrderDateTime(isoString: string): { date: string; time: string } {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: isoString, time: '' };

    const date = new Intl.DateTimeFormat('ar-PS', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);

    const time = new Intl.DateTimeFormat('ar-PS', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);

    return { date, time };
  } catch {
    return { date: isoString, time: '' };
  }
}

export function OrdersDataTable({
  orders,
  zones = [],
  onRefresh,
  isRefreshing = false,
}: OrdersDataTableProps) {
  const [activeTab, setActiveTab] = useState<FilterTabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // خريطة مناطق التوصيل لسهولة وسرعة جلب اسم المنطقة
  const zonesMap = useMemo(() => {
    const map = new Map<string, string>();
    zones.forEach((zone) => {
      map.set(zone.id, zone.name);
    });
    return map;
  }, [zones]);

  // حساب أعداد الطلبات لكل تبويب فلترة
  const tabCounts = useMemo(() => {
    const counts: Record<FilterTabKey, number> = {
      all: orders.length,
      new: 0,
      accepted: 0,
      in_preparation: 0,
      out_for_delivery: 0,
      delivered: 0,
      undelivered: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      if (counts[order.status] !== undefined) {
        counts[order.status]++;
      }
    });

    return counts;
  }, [orders]);

  // تصفية الطلبات بناءً على التبويب النشط وشريط البحث الفوري
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // 1. فلترة التبويب
    if (activeTab !== 'all') {
      result = result.filter((order) => order.status === activeTab);
    }

    // 2. البحث الفوري برقم الطلب أو اسم العميل أو رقم الهاتف
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((order) => {
        const orderNumberMatch = order.orderNumber.toLowerCase().includes(query);
        const customerNameMatch = order.customer.fullName.toLowerCase().includes(query);
        const customerPhoneMatch = order.customer.phone.replace(/\s+/g, '').includes(query);
        const zoneName = zonesMap.get(order.customer.zoneId) || '';
        const zoneMatch = zoneName.toLowerCase().includes(query);

        return orderNumberMatch || customerNameMatch || customerPhoneMatch || zoneMatch;
      });
    }

    // 3. الترتيب الزمني (الأحدث أو الأقدم)
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [orders, activeTab, searchQuery, sortOrder, zonesMap]);

  const handleResetFilters = () => {
    setActiveTab('all');
    setSearchQuery('');
  };

  const isFiltered = activeTab !== 'all' || searchQuery.trim() !== '';

  return (
    <div className="space-y-4">
      {/* 1. أشرطة التبويبات الفلترة وأدوات البحث */}
      <div className="bg-white rounded-2xl border border-candy-line shadow-candy-1 p-3 sm:p-4 space-y-4">
        {/* التبويبات الأفقية للفلترة السريعة */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
          {FILTER_TABS.map((tab) => {
            const count = tabCounts[tab.key] || 0;
            const isActive = activeTab === tab.key;
            const isNewWithAlert = tab.key === 'new' && count > 0;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-sans font-bold whitespace-nowrap transition-all duration-150',
                  isActive
                    ? 'bg-candy-berry text-white shadow-candy-1'
                    : 'bg-candy-soft text-candy-muted hover:text-candy-ink hover:bg-candy-blush/60'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold transition-colors',
                    isActive
                      ? 'bg-white/25 text-white'
                      : isNewWithAlert
                      ? 'bg-blue-100 text-blue-700 font-extrabold animate-pulse'
                      : 'bg-candy-line text-candy-muted'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* شريط البحث الفوري وأزرار التحكم */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-candy-line/60">
          <div className="relative flex-1">
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-candy-muted pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث برقم الطلب، اسم العميل، أو رقم الهاتف..."
              className="w-full h-10 pr-10 pl-10 rounded-xl bg-candy-cream/70 border border-candy-line text-candy-ink text-sm font-sans placeholder:text-candy-muted focus:outline-none focus:ring-2 focus:ring-candy-strawberry/40 focus:border-candy-strawberry transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-candy-muted hover:text-candy-berry hover:bg-candy-blush/60 transition-colors"
                title="مسح البحث"
                aria-label="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-end">
            {/* زر ترتيب النتائج الأحدث/الأقدم */}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-sans font-semibold border border-candy-line bg-candy-cream/50 text-candy-ink hover:bg-candy-soft transition-colors"
              title="تبديل اتجاه الترتيب"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-candy-berry" />
              <span>{sortOrder === 'desc' ? 'الأحدث أولاً' : 'الأقدم أولاً'}</span>
            </button>

            {/* زر إعادة التحميل اليدوي */}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-sans font-semibold border border-candy-line bg-candy-cream/50 text-candy-ink hover:bg-candy-soft disabled:opacity-50 transition-colors"
                title="تحديث البيانات"
              >
                <RefreshCw className={cn('w-3.5 h-3.5 text-candy-berry', isRefreshing && 'animate-spin')} />
                <span className="hidden sm:inline">تحديث</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. شريط إحصائي ومؤشر الفلترة */}
      <div className="flex items-center justify-between text-xs text-candy-muted font-sans px-1">
        <div>
          <span>يتم عرض </span>
          <strong className="text-candy-ink font-bold">{filteredOrders.length}</strong>
          <span> من إجمالي </span>
          <strong className="text-candy-ink font-bold">{orders.length}</strong>
          <span> طلب</span>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-candy-berry font-bold hover:underline flex items-center gap-1"
          >
            <Filter className="w-3 h-3" />
            <span>إعادة ضبط الفلاتر</span>
          </button>
        )}
      </div>

      {/* 3. الجدول الرئيسي (Desktop/Tablet) وشبكة البطاقات (Mobile) */}
      {filteredOrders.length === 0 ? (
        // حالة الفراغ: لا توجد طلبات تطابق المعايير
        <div className="bg-white rounded-2xl border border-dashed border-candy-line-dark p-8 sm:p-12 text-center shadow-candy-1">
          <div className="w-16 h-16 rounded-2xl bg-candy-blush/60 border border-candy-line flex items-center justify-center mx-auto mb-4 text-candy-berry">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-bold text-lg text-candy-ink mb-1">
            لا توجد طلبات مطابقة
          </h3>
          <p className="font-sans text-xs sm:text-sm text-candy-muted max-w-sm mx-auto mb-5 leading-relaxed">
            {isFiltered
              ? 'لم يتم العثور على أي طلبات تطابق معايير الفلترة أو البحث الحالية. جرب تغيير الحالة أو مسح نص البحث.'
              : 'لم يتم تسجيل أي طلبات حتى الآن في النظام.'}
          </p>
          {isFiltered && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetFilters}
              className="mx-auto"
            >
              عرض كافة الطلبات
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* عرض سطح المكتب والأجهزة اللوحية (Table) */}
          <div className="hidden md:block bg-white rounded-2xl border border-candy-line shadow-candy-1 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-candy-soft/60 border-b border-candy-line text-xs font-sans font-bold text-candy-muted select-none">
                    <th scope="col" className="py-3.5 px-4 font-bold">
                      رقم الطلب
                    </th>
                    <th scope="col" className="py-3.5 px-4 font-bold">
                      وقت الطلب
                    </th>
                    <th scope="col" className="py-3.5 px-4 font-bold">
                      العميل
                    </th>
                    <th scope="col" className="py-3.5 px-4 font-bold">
                      الهاتف
                    </th>
                    <th scope="col" className="py-3.5 px-4 font-bold">
                      المنطقة
                    </th>
                    <th scope="col" className="py-3.5 px-4 font-bold">
                      الإجمالي
                    </th>
                    <th scope="col" className="py-3.5 px-4 font-bold text-center">
                      الحالة
                    </th>
                    <th scope="col" className="py-3.5 px-4 font-bold text-center">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-candy-line/60 font-sans text-sm">
                  {filteredOrders.map((order) => {
                    const { date, time } = formatOrderDateTime(order.createdAt);
                    const zoneName =
                      zonesMap.get(order.customer.zoneId) ||
                      order.customer.streetAddress ||
                      'المنطقة المحددة';

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-candy-soft/40 transition-colors group"
                      >
                        {/* رقم الطلب */}
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-mono font-bold text-candy-berry hover:text-candy-berry-dark hover:underline flex items-center gap-1"
                          >
                            <span>{order.orderNumber}</span>
                          </Link>
                          <span className="text-[11px] text-candy-muted font-sans block mt-0.5">
                            {order.items.length} أصناف
                          </span>
                        </td>

                        {/* وقت الطلب */}
                        <td className="py-3.5 px-4 text-xs text-candy-ink whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-candy-muted shrink-0" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-candy-muted text-[11px] mt-0.5">
                            <Clock className="w-3 h-3 text-candy-muted shrink-0" />
                            <span>{time}</span>
                          </div>
                        </td>

                        {/* العميل */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-candy-ink">
                            {order.customer.fullName}
                          </div>
                          {order.customer.notes && (
                            <span
                              className="text-[11px] text-candy-berry truncate max-w-[180px] block mt-0.5"
                              title={order.customer.notes}
                            >
                              ملاحظة: {order.customer.notes}
                            </span>
                          )}
                        </td>

                        {/* الهاتف */}
                        <td className="py-3.5 px-4 text-xs font-mono whitespace-nowrap" dir="ltr">
                          <a
                            href={`tel:${order.customer.phone}`}
                            className="text-candy-ink hover:text-candy-berry inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-candy-muted" />
                            <span>{order.customer.phone}</span>
                          </a>
                        </td>

                        {/* المنطقة */}
                        <td className="py-3.5 px-4 text-xs text-candy-ink max-w-[160px] truncate">
                          <div className="flex items-center gap-1.5" title={zoneName}>
                            <MapPin className="w-3.5 h-3.5 text-candy-muted shrink-0" />
                            <span className="truncate">{zoneName}</span>
                          </div>
                        </td>

                        {/* الإجمالي */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-candy-berry font-sans">
                            {order.total.toFixed(2)} ₪
                          </div>
                          <span className="text-[10px] text-candy-muted block font-sans">
                            دفع عند الاستلام
                          </span>
                        </td>

                        {/* الحالة */}
                        <td className="py-3.5 px-4 text-center">
                          <OrderStatusBadge status={order.status} size="sm" />
                        </td>

                        {/* إجراءات */}
                        <td className="py-3.5 px-4 text-center">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-candy-berry bg-candy-blush/60 hover:bg-candy-blush hover:shadow-sm transition-all"
                          >
                            <span>التفاصيل</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* عرض الهواتف المحمولة (Mobile Cards View) */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((order) => {
              const { date, time } = formatOrderDateTime(order.createdAt);
              const zoneName =
                zonesMap.get(order.customer.zoneId) ||
                order.customer.streetAddress ||
                'المنطقة المحددة';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-candy-line shadow-candy-1 p-4 space-y-3"
                >
                  {/* رأس البطاقة: رقم الطلب والحالة */}
                  <div className="flex items-center justify-between pb-2 border-b border-candy-line/60">
                    <div>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono font-bold text-sm text-candy-berry hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <div className="text-[11px] text-candy-muted flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-candy-muted" />
                        <span>
                          {date} - {time}
                        </span>
                      </div>
                    </div>
                    <OrderStatusBadge status={order.status} size="sm" />
                  </div>

                  {/* بيانات العميل والتوصيل */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                    <div>
                      <span className="text-candy-muted block text-[10px]">العميل:</span>
                      <strong className="text-candy-ink font-bold truncate block">
                        {order.customer.fullName}
                      </strong>
                    </div>

                    <div dir="ltr" className="text-right">
                      <span className="text-candy-muted block text-[10px]">الهاتف:</span>
                      <a
                        href={`tel:${order.customer.phone}`}
                        className="text-candy-ink font-mono font-semibold hover:text-candy-berry inline-flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-candy-muted" />
                        <span>{order.customer.phone}</span>
                      </a>
                    </div>

                    <div className="col-span-2 pt-1">
                      <span className="text-candy-muted block text-[10px]">المنطقة:</span>
                      <div className="flex items-center gap-1 text-candy-ink text-xs truncate">
                        <MapPin className="w-3 h-3 text-candy-muted shrink-0" />
                        <span className="truncate">{zoneName}</span>
                      </div>
                    </div>
                  </div>

                  {/* أسفل البطاقة: الإجمالي وزر الإجراءات */}
                  <div className="flex items-center justify-between pt-2 border-t border-candy-line/60">
                    <div>
                      <span className="text-[10px] text-candy-muted block">الإجمالي:</span>
                      <strong className="text-sm font-bold text-candy-berry font-sans">
                        {order.total.toFixed(2)} ₪
                      </strong>
                    </div>

                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-candy-berry bg-candy-blush/60 hover:bg-candy-blush transition-colors"
                    >
                      <span>عرض تفاصيل الطلب</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
