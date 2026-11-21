"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
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
 * يدعم معايير WCAG 2.1 AA والتركيز التلقائي والروابط السريعة للحقول وأسلوب الحلويات الراقي
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
        aria-live="assertive"
        aria-atomic="true"
        tabIndex={-1}
        className={cn(
          "error-summary mb-4 p-4 sm:p-5 border-[1.5px] border-rose-200 border-r-4 border-r-rose-600 rounded-candy-card bg-gradient-to-l from-white to-rose-50/70 text-rose-900 shadow-candy-1 focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-all",
          className
        )}
        {...props}
      >
        <div className="error-summary__title font-display font-bold text-sm sm:text-base text-rose-950 mb-2.5 flex items-center gap-2.5">
          <div
            className="p-1 rounded-full bg-rose-100 text-rose-600 shrink-0"
            aria-hidden="true"
          >
            <AlertCircle className="h-4 w-4" />
          </div>
          <span>{title}</span>
        </div>
        <ul className="error-summary__list list-disc list-inside space-y-1.5 text-xs sm:text-sm ps-2 text-rose-800">
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
                        targetEl.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }
                    }}
                    className="underline underline-offset-4 decoration-rose-300 hover:decoration-rose-600 hover:text-rose-950 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30 rounded-sm"
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
