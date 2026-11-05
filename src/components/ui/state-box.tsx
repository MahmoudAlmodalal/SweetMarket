import * as React from "react";
import { cn } from "@/lib/utils";

export interface StateBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  variant?: "default" | "error";
}

/**
 * مكون عرض الحالات (فارغة / خطأ / إشعار) مطابق لـ .state-box في نظام التصميم
 */
export const StateBox = React.forwardRef<HTMLDivElement, StateBoxProps>(
  (
    {
      className,
      icon,
      title,
      description,
      actions,
      variant = "default",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "state-box flex flex-col items-center gap-3 p-8 sm:p-12 text-center bg-white rounded-candy-section border-[1.5px] border-dashed border-candy-line-dark",
          variant === "error" && "state-box--error border-solid border-rose-600",
          className
        )}
        {...props}
      >
        {icon && (
          <div className="state-box__icon text-5xl leading-none select-none" aria-hidden="true">
            {icon}
          </div>
        )}
        <h3
          className={cn(
            "state-box__title text-lg sm:text-xl font-bold font-display text-candy-ink",
            variant === "error" && "text-rose-600"
          )}
        >
          {title}
        </h3>
        {description && (
          <p className="state-box__text text-sm sm:text-base text-candy-muted max-w-[42ch]">
            {description}
          </p>
        )}
        {children}
        {actions && (
          <div className="state-box__actions flex flex-wrap justify-center gap-3 mt-2">
            {actions}
          </div>
        )}
      </div>
    );
  }
);

StateBox.displayName = "StateBox";
