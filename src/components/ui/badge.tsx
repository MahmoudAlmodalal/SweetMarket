import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "new"
  | "accepted"
  | "in_preparation"
  | "out_for_delivery"
  | "delivered"
  | "undelivered"
  | "cancelled"
  | "success"
  | "warning"
  | "danger"
  | "muted"
  | "bestseller"
  | "discount"
  | "tag";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
  pulseDot?: boolean;
}

const badgeVariants: Record<BadgeVariant, string> = {
  // Order statuses (strictly bound to design tokens with subtle luxury borders)
  new: "bg-status-new text-white border-white/25 shadow-xs",
  accepted: "bg-status-accepted text-white border-white/25 shadow-xs",
  in_preparation: "bg-status-preparing text-status-preparing-text border-candy-ink/15 shadow-xs",
  out_for_delivery: "bg-status-out text-white border-white/25 shadow-xs",
  delivered: "bg-status-delivered text-white border-white/25 shadow-xs",
  undelivered: "bg-status-failed text-white border-white/25 shadow-xs",
  cancelled: "bg-status-cancelled text-white border-white/25 shadow-xs",

  // Feedback states
  success: "bg-emerald-700 text-white border-emerald-600/30 shadow-xs",
  warning: "bg-amber-700 text-white border-amber-600/30 shadow-xs",
  danger: "bg-rose-700 text-white border-rose-600/30 shadow-xs",
  muted: "bg-candy-soft text-candy-muted border-candy-line/80 shadow-xs",

  // Marketing & Tags
  bestseller: "bg-amber-100 text-amber-900 border-accent/40 shadow-xs",
  discount: "bg-secondary text-white border-white/25 shadow-xs",
  tag: "bg-blush text-primary border-candy-line-dark/40 shadow-xs",
};

const badgeDots: Record<BadgeVariant, string> = {
  new: "bg-white",
  accepted: "bg-white",
  in_preparation: "bg-status-preparing-text",
  out_for_delivery: "bg-white",
  delivered: "bg-white",
  undelivered: "bg-white",
  cancelled: "bg-white",
  success: "bg-white",
  warning: "bg-white",
  danger: "bg-white",
  muted: "bg-candy-muted",
  bestseller: "bg-amber-500",
  discount: "bg-white",
  tag: "bg-primary",
};

const badgeSizes: Record<"sm" | "md" | "lg", string> = {
  sm: "px-2.5 py-0.5 text-xs gap-1.5",
  md: "px-3.5 py-1 text-sm gap-2",
  lg: "px-4 py-1.5 text-base gap-2",
};

/**
 * مكون الشارة (Badge)
 * متوافق كلياً مع محددات الرموز وحالات الطلب السبعة مع حدود ناعمة ومؤشر نبض اختياري
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "tag",
      size = "sm",
      showDot = false,
      pulseDot,
      children,
      ...props
    },
    ref
  ) => {
    const isPulsing = pulseDot ?? (variant === "new");

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-sans font-bold rounded-candy-pill border transition-all duration-200 select-none whitespace-nowrap",
          badgeVariants[variant],
          badgeSizes[size],
          className
        )}
        {...props}
      >
        {showDot && (
          <span className="relative flex items-center justify-center shrink-0">
            {isPulsing && (
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping motion-reduce:hidden",
                  badgeDots[variant]
                )}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                "relative w-1.5 h-1.5 rounded-full shrink-0 shadow-xs",
                badgeDots[variant],
                isPulsing && "animate-pulse motion-reduce:animate-none"
              )}
              aria-hidden="true"
            />
          </span>
        )}
        <span>{children}</span>
      </span>
    );
  }
);

Badge.displayName = "Badge";
