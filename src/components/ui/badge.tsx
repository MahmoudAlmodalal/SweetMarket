import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "new"
  | "accepted"
  | "in_preparation"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "bestseller"
  | "discount"
  | "tag";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  showDot?: boolean;
}

const badgeVariants: Record<BadgeVariant, string> = {
  // Order statuses
  new: "bg-blue-50 text-blue-700 border-blue-200/70",
  accepted: "bg-teal-50 text-teal-700 border-teal-200/70",
  in_preparation: "bg-amber-50 text-amber-800 border-amber-200/70",
  out_for_delivery: "bg-purple-50 text-purple-700 border-purple-200/70",
  delivered: "bg-candy-mint-soft text-candy-mint-text border-candy-mint/30",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200/70",
  // Marketing & Tags
  bestseller: "bg-amber-100 text-amber-900 border-candy-amber/40 shadow-sm",
  discount: "bg-candy-strawberry text-white border-transparent shadow-candy-cta",
  tag: "bg-candy-blush text-candy-berry border-candy-line-dark",
};

const badgeDots: Record<BadgeVariant, string> = {
  new: "bg-blue-500",
  accepted: "bg-teal-500",
  in_preparation: "bg-amber-500",
  out_for_delivery: "bg-purple-500",
  delivered: "bg-emerald-500",
  cancelled: "bg-rose-500",
  bestseller: "bg-amber-500",
  discount: "bg-white",
  tag: "bg-candy-berry",
};

const badgeSizes = {
  sm: "px-2.5 py-0.5 text-xs gap-1.5",
  md: "px-3.5 py-1 text-sm gap-2",
};

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
          "inline-flex items-center justify-center font-sans font-bold rounded-candy-pill border transition-colors select-none",
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
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
