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
 * يدعم إمكانية الوصول ARIA وأسلوب الحلويات الراقي
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
    const isError = variant === "error";

    return (
      <div
        ref={ref}
        role={isError ? "alert" : "status"}
        aria-live={isError ? "assertive" : "polite"}
        className={cn(
          "state-box flex flex-col items-center gap-3.5 p-8 sm:p-12 text-center rounded-candy-section transition-all duration-300",
          isError
            ? "state-box--error border-[1.5px] border-solid border-rose-300 bg-gradient-to-b from-white via-white to-rose-50/40 shadow-candy-1"
            : "border-[1.5px] border-dashed border-candy-line-dark/70 bg-gradient-to-b from-white via-white to-candy-soft/30 shadow-candy-1",
          className
        )}
        {...props}
      >
        {icon && (
          <div
            className={cn(
              "state-box__icon w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-4xl sm:text-5xl select-none mb-1 transition-transform duration-300",
              isError
                ? "bg-rose-50 text-rose-600 ring-8 ring-rose-50/60 shadow-inner"
                : "bg-candy-soft text-candy-berry ring-8 ring-candy-soft/60 shadow-inner"
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        <h3
          className={cn(
            "state-box__title text-lg sm:text-xl font-bold font-display leading-snug",
            isError ? "text-rose-700" : "text-candy-ink"
          )}
        >
          {title}
        </h3>
        {description && (
          <p className="state-box__text text-sm sm:text-base text-candy-muted max-w-[46ch] leading-relaxed">
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
