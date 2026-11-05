import * as React from "react";
import { cn } from "@/lib/utils";

export type SkeletonVariant = "default" | "text" | "title" | "block" | "card" | "row";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
}

const variantClasses: Record<SkeletonVariant, string> = {
  default: "min-h-[1em] rounded-xl",
  text: "skeleton--text h-4 my-2 rounded-md",
  title: "skeleton--title h-6 w-3/5 mb-3 rounded-lg",
  block: "skeleton--block h-[120px] w-full rounded-2xl",
  card: "skeleton--card h-[280px] w-full rounded-candy-card",
  row: "skeleton--row h-14 w-full mb-2 rounded-xl",
};

/**
 * مكون هيكل التحميل المشترك (Skeleton)
 * يدعم الأنواع المعتمدة (text, title, block, card, row) وتأثير التموج اللوني (Shimmer)
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="جاري التحميل..."
        className={cn(
          "skeleton select-none",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";
