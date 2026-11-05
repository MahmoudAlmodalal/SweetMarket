"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormErrorItem {
  id?: string;
  field?: string;
  message: string;
}

export interface ErrorSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  errors: (string | FormErrorItem)[];
  autoFocus?: boolean;
}

/**
 * مكون ملخص أخطاء النماذج مطابق لـ .error-summary في نظام التصميم
 * يدعم معايير WCAG 2.1 AA والتركيز التلقائي والروابط السريعة للحقول
 */
export const ErrorSummary = React.forwardRef<HTMLDivElement, ErrorSummaryProps>(
  (
    {
      className,
      title = "يرجى تصحيح الأخطاء التالية للمتابعة:",
      errors,
      autoFocus = false,
      ...props
    },
    ref
  ) => {
    const internalRef = React.useRef<HTMLDivElement>(null);
    const combinedRef = (ref || internalRef) as React.RefObject<HTMLDivElement>;

    React.useEffect(() => {
      if (autoFocus && combinedRef.current) {
        combinedRef.current.focus();
      }
    }, [autoFocus, combinedRef]);

    if (!errors || errors.length === 0) return null;

    return (
      <div
        ref={combinedRef}
        role="alert"
        tabIndex={-1}
        className={cn(
          "error-summary mb-4 p-4 border-[1.5px] border-rose-600 rounded-2xl bg-white text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/40",
          className
        )}
        {...props}
      >
        <div className="error-summary__title font-bold text-sm sm:text-base mb-2 flex items-center gap-2">
          <span aria-hidden="true" className="text-rose-600">⚠</span>
          <span>{title}</span>
        </div>
        <ul className="error-summary__list list-disc list-inside space-y-1 text-xs sm:text-sm ps-2">
          {errors.map((error, index) => {
            if (typeof error === "string") {
              return <li key={index}>{error}</li>;
            }

            const targetId = error.id || error.field;
            return (
              <li key={targetId || index}>
                {targetId ? (
                  <a
                    href={`#${targetId}`}
                    onClick={(e) => {
                      const targetEl = document.getElementById(targetId);
                      if (targetEl) {
                        e.preventDefault();
                        targetEl.focus();
                        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }}
                    className="underline hover:text-rose-900 transition-colors"
                  >
                    {error.message}
                  </a>
                ) : (
                  <span>{error.message}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
);

ErrorSummary.displayName = "ErrorSummary";
