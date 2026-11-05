import * as React from "react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-[2.5px]",
  lg: "spinner--lg w-10 h-10 border-4 text-candy-berry",
};

/**
 * مكون مؤشر التحميل الدائري المشترك (Spinner)
 * مطابق لـ .spinner و .spinner--lg في نظام التصميم
 */
export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size = "md", label = "جاري التحميل...", ...props }, ref) => {
    return (
      <span
        ref={ref}
        role="status"
        aria-label={label}
        className={cn(
          "spinner inline-block rounded-full border-current border-e-transparent animate-spin shrink-0",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <span className="sr-only">{label}</span>
      </span>
    );
  }
);

Spinner.displayName = "Spinner";
