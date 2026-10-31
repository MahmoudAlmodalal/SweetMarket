'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types';
import { ORDER_STATUS_LABELS } from '@/types';

export interface OrderStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export interface StatusVisualConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
}

/**
 * خريطة الألوان والأنماط البصرية لحالات الطلب المعتمدة
 */
export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusVisualConfig> = {
  new: {
    label: ORDER_STATUS_LABELS.new || 'جديد',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dotClass: 'bg-blue-500 animate-pulse',
  },
  accepted: {
    label: ORDER_STATUS_LABELS.accepted || 'مقبول',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200/80',
    dotClass: 'bg-teal-500',
  },
  in_preparation: {
    label: ORDER_STATUS_LABELS.in_preparation || 'قيد التجهيز',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
    dotClass: 'bg-amber-500',
  },
  out_for_delivery: {
    label: ORDER_STATUS_LABELS.out_for_delivery || 'خرج للتوصيل',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dotClass: 'bg-purple-500',
  },
  delivered: {
    label: ORDER_STATUS_LABELS.delivered || 'تم التسليم',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500',
  },
  undelivered: {
    label: ORDER_STATUS_LABELS.undelivered || 'تعذّر التسليم',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200/80',
    dotClass: 'bg-orange-500',
  },
  cancelled: {
    label: ORDER_STATUS_LABELS.cancelled || 'ملغي',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dotClass: 'bg-rose-500',
  },
};

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-2 py-0.5 text-xs gap-1.5',
  md: 'px-2.5 py-1 text-xs sm:text-sm gap-1.5',
  lg: 'px-3.5 py-1.5 text-sm gap-2',
};

/**
 * مكون شارة حالة الطلب الملونة وفق معايير SCR-13 و PRD 0.2
 */
export const OrderStatusBadge = React.forwardRef<HTMLSpanElement, OrderStatusBadgeProps>(
  ({ status, size = 'sm', showDot = true, className, ...props }, ref) => {
    const config = ORDER_STATUS_CONFIG[status] || {
      label: status,
      badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
      dotClass: 'bg-gray-500',
    };

    return (
      <span
        ref={ref}
        role="status"
        aria-label={`حالة الطلب: ${config.label}`}
        className={cn(
          'inline-flex items-center justify-center font-sans font-bold rounded-full border transition-colors select-none whitespace-nowrap',
          config.badgeClass,
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {showDot && (
          <span
            className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotClass)}
            aria-hidden="true"
          />
        )}
        <span>{config.label}</span>
      </span>
    );
  }
);

OrderStatusBadge.displayName = 'OrderStatusBadge';
