'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { toggleAdminProductAvailability } from './product-repository';
import { cn } from '@/lib/utils';

export interface AvailabilityToggleProps {
  productId: string;
  productName: string;
  initialAvailable: boolean;
  onToggleSuccess?: (newStatus: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function AvailabilityToggle({
  productId,
  productName,
  initialAvailable,
  onToggleSuccess,
  disabled = false,
  size = 'md',
  showLabel = true,
  className,
}: AvailabilityToggleProps) {
  const [isAvailable, setIsAvailable] = useState<boolean>(initialAvailable);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // تحديث الحالة المحلية إذا تغيرت القيمة الأولية من الخارج
  useEffect(() => {
    setIsAvailable(initialAvailable);
  }, [initialAvailable]);

  const handleToggle = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || isUpdating) {
      return;
    }

    const previousState = isAvailable;
    const targetState = !previousState;

    // 1. التحديث التفاؤلي الفوري (Optimistic UI Update)
    setIsAvailable(targetState);
    setIsUpdating(true);

    try {
      // 2. إرسال طلب التبديل إلى المستودع
      const updatedProduct = await toggleAdminProductAvailability(productId);

      // 3. تأكيد التحديث وإشعار المستخدم
      setIsAvailable(updatedProduct.isAvailable);
      onToggleSuccess?.(updatedProduct.isAvailable);

      if (updatedProduct.isAvailable) {
        toast.success(
          'تم تحديث حالة التوفر',
          `أصبح المنتج "${productName}" متاحاً للطلب الفوري في المتجر`
        );
      } else {
        toast.info(
          'تم تحديث حالة التوفر',
          `أصبح المنتج "${productName}" غير متاح (نفد من المخزون)`
        );
      }
    } catch (error) {
      // 4. التراجع عند الفشل وإظهار رسالة خطأ واضحة
      setIsAvailable(previousState);
      const errorMessage =
        error instanceof Error ? error.message : 'فشل الاتصال لتحديث حالة المنتج';
      toast.error('تعذر تحديث حالة التوفر', errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      handleToggle(e);
    }
  };

  const isSmall = size === 'sm';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 select-none',
        className
      )}
      dir="rtl"
    >
      <button
        type="button"
        role="switch"
        aria-checked={isAvailable}
        aria-label={`تغيير حالة توفر ${productName}: حالياً ${
          isAvailable ? 'متاح للطلب' : 'غير متاح للطلب'
        }`}
        disabled={disabled || isUpdating}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative inline-flex flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry focus-visible:ring-offset-2',
          isSmall ? 'h-6 w-11' : 'h-7 w-14',
          isAvailable
            ? 'bg-emerald-500 hover:bg-emerald-600'
            : 'bg-slate-300 hover:bg-slate-400',
          (disabled || isUpdating) && 'opacity-70 cursor-not-allowed'
        )}
      >
        {/* Thumb Circle */}
        <span
          className={cn(
            'pointer-events-none flex items-center justify-center rounded-full bg-white shadow-md transform transition duration-200 ease-in-out',
            isSmall
              ? cn(
                  'h-5 w-5 top-0.5',
                  isAvailable ? 'translate-x-[-1.35rem]' : 'translate-x-[-0.15rem]'
                )
              : cn(
                  'h-6 w-6 top-0.5',
                  isAvailable ? 'translate-x-[-1.85rem]' : 'translate-x-[-0.2rem]'
                )
          )}
        >
          {isUpdating ? (
            <Loader2
              className={cn(
                'animate-spin text-candy-berry',
                isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'
              )}
              aria-hidden="true"
            />
          ) : isAvailable ? (
            <Check
              className={cn(
                'text-emerald-600 stroke-[2.5]',
                isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'
              )}
              aria-hidden="true"
            />
          ) : (
            <X
              className={cn(
                'text-slate-400 stroke-[2.5]',
                isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'
              )}
              aria-hidden="true"
            />
          )}
        </span>
      </button>

      {showLabel && (
        <span
          onClick={disabled || isUpdating ? undefined : handleToggle}
          className={cn(
            'font-sans text-xs font-semibold cursor-pointer transition-colors',
            isAvailable ? 'text-emerald-700' : 'text-slate-500',
            (disabled || isUpdating) && 'cursor-not-allowed opacity-70'
          )}
        >
          {isUpdating ? 'جاري الحفظ...' : isAvailable ? 'متاح للطلب' : 'غير متاح'}
        </span>
      )}
    </div>
  );
}

export default AvailabilityToggle;
