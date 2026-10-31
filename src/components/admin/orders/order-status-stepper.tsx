'use client';

import * as React from 'react';
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderStatus, AdminRole } from '@/types';
import { ORDER_STATUS_LABELS } from '@/types';
import { Button } from '@/components/ui/button';

export interface OrderStatusStepperProps {
  currentStatus: OrderStatus;
  allowedTransitions: OrderStatus[];
  onTransition: (nextStatus: OrderStatus) => Promise<void>;
  onRequestCancel: () => void;
  userRole: AdminRole;
  isMutating?: boolean;
  className?: string;
}

interface StepDefinition {
  status: OrderStatus;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ORDER_STEPS: StepDefinition[] = [
  {
    status: 'new',
    title: ORDER_STATUS_LABELS.new,
    description: 'تم إنشاء الطلب',
    icon: Clock,
  },
  {
    status: 'accepted',
    title: ORDER_STATUS_LABELS.accepted,
    description: 'موافقة وقبول المتجر',
    icon: CheckCircle,
  },
  {
    status: 'in_preparation',
    title: ORDER_STATUS_LABELS.in_preparation,
    description: 'إعداد وتجهيز الحلويات',
    icon: Package,
  },
  {
    status: 'out_for_delivery',
    title: ORDER_STATUS_LABELS.out_for_delivery,
    description: 'مع سائق التوصيل',
    icon: Truck,
  },
  {
    status: 'delivered',
    title: ORDER_STATUS_LABELS.delivered,
    description: 'تم الاستلام بنجاح',
    icon: CheckCircle2,
  },
];

const STEP_ORDER_MAP: Record<OrderStatus, number> = {
  new: 0,
  accepted: 1,
  in_preparation: 2,
  out_for_delivery: 3,
  delivered: 4,
  undelivered: 3, // فرع تفرع من مرحلة التوصيل
  cancelled: -1,
};

export function OrderStatusStepper({
  currentStatus,
  allowedTransitions,
  onTransition,
  onRequestCancel,
  userRole,
  isMutating = false,
  className,
}: OrderStatusStepperProps) {
  const currentStepIndex = STEP_ORDER_MAP[currentStatus];
  const isTerminal = currentStatus === 'delivered' || currentStatus === 'cancelled';
  const isCancelled = currentStatus === 'cancelled';
  const isUndelivered = currentStatus === 'undelivered';
  const isManager = userRole === 'manager';

  // تحديد الإجراء الرئيسي التالي المسموح به للتسلسل الطبيعي
  const nextSequentialStatus = React.useMemo<OrderStatus | null>(() => {
    if (allowedTransitions.includes('accepted')) return 'accepted';
    if (allowedTransitions.includes('in_preparation')) return 'in_preparation';
    if (allowedTransitions.includes('out_for_delivery')) return 'out_for_delivery';
    if (allowedTransitions.includes('delivered')) return 'delivered';
    return null;
  }, [allowedTransitions]);

  // التحقق من إمكانية تعليم الطلب كـ "تعذر التسليم"
  const canMarkUndelivered = allowedTransitions.includes('undelivered');

  // نص الزر الرئيسي التالي
  const getNextActionLabel = (nextStatus: OrderStatus): string => {
    switch (nextStatus) {
      case 'accepted':
        return 'قبول الطلب';
      case 'in_preparation':
        return 'بدء التجهيز';
      case 'out_for_delivery':
        return isUndelivered ? 'إعادة الإرسال للتوصيل' : 'إرسال للتوصيل';
      case 'delivered':
        return 'تأكيد اكتمال التسليم';
      default:
        return `نقل إلى: ${ORDER_STATUS_LABELS[nextStatus] || nextStatus}`;
    }
  };

  return (
    <div
      className={cn(
        'bg-white border border-candy-line rounded-candy-card p-4 sm:p-6 shadow-candy-1',
        className
      )}
      aria-label="مسار معالجة حالة الطلب"
    >
      {/* 1. تنبيه الحالات الاستثنائية (ملغي / تعذر التسليم) */}
      {isCancelled && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-900 flex items-start gap-3"
        >
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold text-rose-800">الطلب ملغي</h4>
            <p className="text-rose-700 mt-0.5">
              تم إلغاء هذا الطلب ولا يمكن تمريره عبر مراحل التنفيذ الإضافية.
            </p>
          </div>
        </div>
      )}

      {isUndelivered && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold text-amber-800">تعذّر تسليم الطلب للزبون</h4>
            <p className="text-amber-700 mt-0.5">
              حدث عائق أثناء التوصيل. يمكنك إعادة محاولة إرسال الطلب للتوصيل أو إلغاء الطلب (للمدير).
            </p>
          </div>
        </div>
      )}

      {/* 2. مؤشر مسار الحالات خطوة بخطوة (Visual Pipeline) */}
      {!isCancelled && (
        <div className="mb-6 overflow-x-auto pb-2 scrollbar-thin">
          <ol
            className="flex items-center justify-between min-w-[560px] relative"
            aria-live="polite"
          >
            {ORDER_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isPassed = currentStepIndex > index;
              const isCurrent = currentStepIndex === index;
              const isPending = currentStepIndex < index;

              return (
                <li
                  key={step.status}
                  className="flex-1 flex flex-col items-center relative text-center group"
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {/* خط الربط بين الخطوات */}
                  {index > 0 && (
                    <div
                      aria-hidden="true"
                      className={cn(
                        'absolute top-4 sm:top-5 right-[-50%] w-full h-1 -translate-y-1/2 transition-colors duration-300',
                        isPassed || (isCurrent && !isUndelivered)
                          ? 'bg-candy-berry'
                          : 'bg-candy-line'
                      )}
                    />
                  )}

                  {/* دائرة أيقونة الخطوة */}
                  <div
                    className={cn(
                      'relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 font-bold text-xs',
                      isPassed &&
                        'bg-candy-berry text-white shadow-candy-1',
                      isCurrent &&
                        !isUndelivered &&
                        'bg-candy-berry text-white ring-4 ring-candy-strawberry/30 shadow-md scale-105',
                      isCurrent &&
                        isUndelivered &&
                        'bg-amber-600 text-white ring-4 ring-amber-300 shadow-md',
                      isPending &&
                        'bg-candy-soft text-candy-muted border border-candy-line'
                    )}
                  >
                    <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>

                  {/* نص الخطوة */}
                  <div className="mt-2 text-right">
                    <p
                      className={cn(
                        'text-xs sm:text-sm font-bold font-sans transition-colors',
                        (isPassed || isCurrent) ? 'text-candy-ink' : 'text-candy-muted'
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-[11px] text-candy-muted hidden md:block mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* 3. شريط أزرار الإجراءات التفاعلية (Actions Bar) */}
      <div className="pt-4 border-t border-candy-line/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* معلومات الحالة الإضافية */}
        <div className="flex items-center gap-2 text-xs text-candy-muted">
          <span>الحالة الحالية:</span>
          <span className="font-bold text-candy-ink">
            {ORDER_STATUS_LABELS[currentStatus] || currentStatus}
          </span>
          {isTerminal && (
            <span className="text-[11px] bg-candy-soft px-2 py-0.5 rounded-full border border-candy-line">
              حالة نهائية
            </span>
          )}
        </div>

        {/* مجموعة الأزرار */}
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {/* زر تعذر التسليم (يظهر في مرحلة خرج للتوصيل) */}
          {canMarkUndelivered && !isTerminal && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isMutating}
              isLoading={isMutating}
              onClick={() => onTransition('undelivered')}
              className="border-amber-300 text-amber-800 hover:bg-amber-50 hover:border-amber-400"
              leftIcon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
            >
              تعذّر التسليم
            </Button>
          )}

          {/* زر التقدم إلى الخطوة المسموحة التالية */}
          {nextSequentialStatus && !isTerminal && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isMutating}
              isLoading={isMutating}
              onClick={() => onTransition(nextSequentialStatus)}
              leftIcon={
                nextSequentialStatus === 'delivered' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : nextSequentialStatus === 'out_for_delivery' ? (
                  <Truck className="w-4 h-4" />
                ) : nextSequentialStatus === 'in_preparation' ? (
                  <Package className="w-4 h-4" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )
              }
            >
              {getNextActionLabel(nextSequentialStatus)}
            </Button>
          )}

          {/* زر إلغاء الطلب (متاح حصرياً للمدير وفق FR-018 طالما لم يكتمل أو يلغى) */}
          {isManager && !isTerminal && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={isMutating}
              onClick={onRequestCancel}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              إلغاء الطلب
            </Button>
          )}

          {/* للموظف: توضيح أن الإلغاء للمدير فقط */}
          {!isManager && !isTerminal && (
            <div
              className="hidden lg:flex items-center gap-1 text-[11px] text-candy-muted"
              title="إلغاء الطلب محصور بالمدير فقط (FR-018)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-candy-muted/80" />
              <span>إلغاء الطلب صلاحية مدير فقط</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
