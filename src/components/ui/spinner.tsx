import * as React from "react";
import { cn } from "@/lib/utils";

export type SpinnerVariant = "berry" | "current" | "white" | "primary";

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: SpinnerVariant;
  label?: string;
}

const sizeClasses: Record<"sm" | "md" | "lg" | "xl", string> = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-[2.5px]",
  lg: "spinner--lg w-10 h-10 border-4",
  xl: "w-12 h-12 border-4",
};

const variantClasses: Record<SpinnerVariant, string> = {
  berry: "text-primary border-blush/60 border-t-primary",
  primary: "text-primary border-primary/20 border-t-primary",
  current: "border-current border-e-transparent",
  white: "text-white border-white/25 border-t-white",
};

/**
 * مكون مؤشر التحميل الدائري المشترك (Spinner)
 * مؤشر حلويات فاخر مزود بلمسات التوت المخملي (Berry Accents)
 */
export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  (
    {
      className,
      size = "md",
      variant = "berry",
      label = "جاري التحميل...",
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        role="status"
        aria-label={label}
        className={cn(
          "spinner inline-block rounded-full animate-spin shrink-0 motion-reduce:animate-[spin_1.5s_linear_infinite]",
          sizeClasses[size],
          variantClasses[variant],
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
