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

import { ORDER_STATUS_CONFIG, type StatusTokenConfig } from '@/lib/tokens';

export type StatusVisualConfig = StatusTokenConfig;
export { ORDER_STATUS_CONFIG };

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
