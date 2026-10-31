'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Clock,
  History,
  Printer,
  ChevronLeft,
  Package,
  Calendar,
  UserCheck,
} from 'lucide-react';
import type { Order, DeliveryZone, OrderStatus, AdminRole } from '@/types';
import { ALLOWED_STATUS_TRANSITIONS, ORDER_STATUS_LABELS } from '@/types';
import {
  getOrderById,
  getDeliveryZones,
  updateOrderStatus,
  cancelOrder,
} from '@/lib/repositories';
import { useAdminAuth } from '@/context/admin-auth-context';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { OrderStatusBadge } from '@/components/admin/orders/order-status-badge';
import { OrderStatusStepper } from '@/components/admin/orders/order-status-stepper';
import { CancelOrderDialog } from '@/components/admin/orders/cancel-order-dialog';
import { CustomerDetailsCard } from '@/components/admin/orders/customer-details-card';
import { OrderItemsList } from '@/components/admin/orders/order-items-list';

/**
 * تنسيق التاريخ والوقت باللغة العربية
 */
function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.id as string) || '';

  const { user, role } = useAdminAuth();
  const userRole: AdminRole = role || 'staff';
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // تحميل بيانات الطلب ومناطق التوصيل
  const loadOrderData = useCallback(
    async (isManualRefresh = false) => {
      if (!orderId) return;

      try {
        if (isManualRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const [fetchedOrder, fetchedZones] = await Promise.all([
          getOrderById(orderId),
          getDeliveryZones(),
        ]);

        if (!fetchedOrder) {
          setError('لم يتم العثور على الطلب المطلوب، قد يكون محذوفاً أو المعرف غير صحيح.');
          setOrder(null);
        } else {
          setOrder(fetchedOrder);
        }
        setZones(fetchedZones);

        if (isManualRefresh && fetchedOrder) {
          toast({
            title: 'تم التحديث بنجاح',
            description: `تم تحديث بيانات الطلب ${fetchedOrder.orderNumber}`,
            variant: 'success',
          });
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'تعذر تحميل بيانات الطلب من النظام';
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
    [orderId, toast]
  );

  useEffect(() => {
    loadOrderData();
  }, [loadOrderData]);

  // تنفيذ ترقية وانتقال حالة الطلب
  const handleStatusTransition = async (nextStatus: OrderStatus) => {
    if (!order) return;

    try {
      setIsMutating(true);
      const updatedOrder = await updateOrderStatus(
        order.id,
        nextStatus,
        undefined,
        user || undefined
      );

      setOrder(updatedOrder);

      toast({
        title: 'تم تحديث حالة الطلب',
        description: `تم ترقية حالة الطلب إلى "${ORDER_STATUS_LABELS[nextStatus] || nextStatus}" بنجاح`,
        variant: 'success',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'تعذر تحديث حالة الطلب';
      toast({
        title: 'فشل تغيير الحالة',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsMutating(false);
    }
  };

  // تنفيذ إلغاء الطلب الإلزامي للمدير مع السبب
  const handleConfirmCancel = async (reason: string) => {
    if (!order) return;

    try {
      setIsMutating(true);
      const updatedOrder = await cancelOrder(
        order.id,
        reason,
        user || undefined
      );

      setOrder(updatedOrder);
      setIsCancelDialogOpen(false);

      toast({
        title: 'تم إلغاء الطلب بنجاح',
        description: `تم توثيق إلغاء الطلب ${order.orderNumber} مع السبب في السجل`,
        variant: 'success',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'تعذر إلغاء الطلب';
      toast({
        title: 'فشل إلغاء الطلب',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsMutating(false);
    }
  };

  // اسم منطقة التوصيل
  const zoneName = React.useMemo(() => {
    if (!order) return undefined;
    const found = zones.find((z) => z.id === order.customer.zoneId);
    return found?.name;
  }, [order, zones]);

  // الانتقالات المسموحة للحالة الحالية
  const allowedTransitions = React.useMemo<OrderStatus[]>(() => {
    if (!order) return [];
    return ALLOWED_STATUS_TRANSITIONS[order.status] || [];
  }, [order]);

  // حالة التحميل الأولي (Skeleton)
  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 font-sans" dir="rtl">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-candy-pill" />
        </div>
        <Skeleton className="h-36 w-full rounded-candy-card" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-72 w-full rounded-candy-card" />
            <Skeleton className="h-48 w-full rounded-candy-card" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-candy-card" />
          </div>
        </div>
      </div>
    );
  }

  // حالة الخطأ أو عدم العثور على الطلب
  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-candy-line rounded-candy-card text-center space-y-4 shadow-candy-1 font-sans" dir="rtl">
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-candy-ink font-display">
          تعذر العثور على الطلب
        </h2>
        <p className="text-sm text-candy-muted leading-relaxed">
          {error || 'الطلب المطلوب غير متوفر في النظام.'}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/admin/orders">
            <Button variant="secondary" size="md" leftIcon={<ArrowRight className="w-4 h-4" />}>
              العودة لقائمة الطلبات
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            onClick={() => loadOrderData(true)}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans" dir="rtl">
      {/* 1. الترويسة العلوية وروابط التنقل والتحديث */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* مسار التنقل (Breadcrumbs) */}
          <nav aria-label="مسار التصفح" className="flex items-center gap-1.5 text-xs text-candy-muted mb-1.5">
            <Link
              href="/admin/orders"
              className="hover:text-candy-berry transition-colors flex items-center gap-1"
            >
              <span>إدارة الطلبات</span>
            </Link>
            <ChevronLeft className="w-3.5 h-3.5 text-candy-muted/60" />
            <span className="font-bold text-candy-ink font-mono">{order.orderNumber}</span>
          </nav>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-display font-black text-candy-ink">
              طلب #{order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} size="md" />
            <span className="text-xs text-candy-muted font-mono flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDateTime(order.createdAt)}</span>
            </span>
          </div>
        </div>

        {/* أزرار الإجراءات العلوية السريعة */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4" />}
            title="طباعة تفاصيل الطلب والفاتورة"
            className="hidden sm:inline-flex"
          >
            طباعة
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isRefreshing}
            isLoading={isRefreshing}
            onClick={() => loadOrderData(true)}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            تحديث
          </Button>

          <Link href="/admin/orders">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<ArrowRight className="w-4 h-4" />}
            >
              الطلبات
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. شريط متابعة وترقية الحالة (Status Stepper & Actions) */}
      <section aria-label="إجراءات ترقية حالة الطلب">
        <OrderStatusStepper
          currentStatus={order.status}
          allowedTransitions={allowedTransitions}
          onTransition={handleStatusTransition}
          onRequestCancel={() => setIsCancelDialogOpen(true)}
          userRole={userRole}
          isMutating={isMutating}
        />
      </section>

      {/* 3. شبكة المحتوى الرئيسي: تفاصيل الأصناف، بيانات الزبون، سجل التدقيق */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* العمود الأيمن (2/3): قائمة الأصناف وسجل حالات الطلب */}
        <div className="lg:col-span-2 space-y-6">
          {/* قائمة الأصناف والملخص المالي */}
          <section aria-label="أصناف ومحتويات الطلب">
            <OrderItemsList
              items={order.items}
              subtotal={order.subtotal}
              deliveryFee={order.deliveryFee}
              total={order.total}
            />
          </section>

          {/* سجل تتبع وتدقيق حالات الطلب (Order Timeline - FR-017) */}
          <section aria-label="سجل التغييرات ومتابعة الحالة">
            <Card className="bg-white border border-candy-line shadow-candy-1">
              <CardHeader className="pb-3 border-b border-candy-line/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-candy-ink font-sans">
                      سجل تدقيق وتغييرات الطلب (FR-017)
                    </CardTitle>
                    <p className="text-[11px] text-candy-muted">
                      توثيق التواريخ والانتقالات ومن قام بكل خطوة
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <ol className="relative border-r border-candy-line/80 mr-3 space-y-5">
                  {order.timeline.map((event, index) => (
                    <li key={`${event.status}-${index}`} className="pr-5 relative">
                      {/* نقطة مسار السجل */}
                      <span className="absolute -right-2 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-candy-berry shadow-sm" />

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <OrderStatusBadge status={event.status} size="sm" />
                          <span className="text-xs text-candy-muted font-mono">
                            {formatDateTime(event.timestamp)}
                          </span>
                        </div>

                        {/* ملاحظة الحدث */}
                        {event.note && (
                          <p className="text-xs text-candy-ink leading-relaxed font-medium bg-candy-soft/60 p-2.5 rounded-xl border border-candy-line/60 mt-1.5">
                            {event.note}
                          </p>
                        )}

                        {/* اسم ودور القائم بالإجراء */}
                        <div className="flex items-center gap-1.5 text-[11px] text-candy-muted pt-0.5">
                          <UserCheck className="w-3.5 h-3.5 text-candy-muted/80" />
                          <span>
                            بواسطة:{' '}
                            <strong className="text-candy-ink">
                              {event.performedBy?.name || 'النظام التلقائي'}
                            </strong>{' '}
                            {event.performedBy?.role && (
                              <span className="text-[10px] bg-candy-soft px-1.5 py-0.5 rounded border border-candy-line">
                                {event.performedBy.role === 'manager' ? 'مدير' : 'موظف'}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* العمود الأيسر (1/3): بطاقة بيانات الزبون والتوصيل */}
        <div className="space-y-6">
          <section aria-label="بيانات الزبون وعنوان التسليم">
            <CustomerDetailsCard
              customer={order.customer}
              zoneName={zoneName}
              orderNumber={order.orderNumber}
              paymentMethod={order.paymentMethod}
            />
          </section>
        </div>
      </div>

      {/* 4. نافذة إلغاء الطلب الإلزامية للمدير (SCR-14 / FR-018) */}
      <CancelOrderDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirmCancel={handleConfirmCancel}
        orderNumber={order.orderNumber}
        userRole={userRole}
        isSubmitting={isMutating}
      />
    </div>
  );
}
