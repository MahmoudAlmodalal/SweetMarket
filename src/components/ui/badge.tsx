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
}

const badgeVariants: Record<BadgeVariant, string> = {
  // Order statuses (strictly bound to design tokens)
  new: "bg-status-new text-white border-transparent",
  accepted: "bg-status-accepted text-white border-transparent",
  in_preparation: "bg-status-preparing text-status-preparing-text border-transparent",
  out_for_delivery: "bg-status-out text-white border-transparent",
  delivered: "bg-status-delivered text-white border-transparent",
  undelivered: "bg-status-failed text-white border-transparent",
  cancelled: "bg-status-cancelled text-white border-transparent",

  // Feedback states
  success: "bg-emerald-700 text-white border-transparent",
  warning: "bg-amber-700 text-white border-transparent",
  danger: "bg-rose-700 text-white border-transparent",
  muted: "bg-candy-soft text-candy-muted border-candy-line",

  // Marketing & Tags
  bestseller: "bg-amber-100 text-amber-900 border-candy-amber/40 shadow-sm",
  discount: "bg-candy-strawberry text-white border-transparent shadow-candy-cta",
  tag: "bg-candy-blush text-candy-berry border-candy-line-dark",
};

const badgeDots: Record<BadgeVariant, string> = {
  new: "bg-white animate-pulse",
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
  tag: "bg-candy-berry",
};

const badgeSizes: Record<"sm" | "md" | "lg", string> = {
  sm: "px-2.5 py-0.5 text-xs gap-1.5",
  md: "px-3.5 py-1 text-sm gap-2",
  lg: "px-4 py-1.5 text-base gap-2",
};

/**
 * مكون الشارة (Badge)
 * متوافق كلياً مع محددات الرموز وحالات الطلب السبعة
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "tag",
      size = "sm",
      showDot = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-sans font-bold rounded-candy-pill border transition-colors select-none whitespace-nowrap",
          badgeVariants[variant],
          badgeSizes[size],
          className
        )}
        {...props}
      >
        {showDot && (
          <span
            className={cn("w-1.5 h-1.5 rounded-full shrink-0", badgeDots[variant])}
            aria-hidden="true"
          />
        )}
        <span>{children}</span>
      </span>
    );
  }
);

Badge.displayName = "Badge";
