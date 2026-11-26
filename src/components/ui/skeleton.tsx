import * as React from "react";
import { cn } from "@/lib/utils";

export type SkeletonVariant =
  | "default"
  | "text"
  | "title"
  | "block"
  | "card"
  | "row"
  | "avatar";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
}

const variantClasses: Record<SkeletonVariant, string> = {
  default: "min-h-[1em] rounded-input",
  text: "skeleton--text h-4 my-2 rounded-md",
  title: "skeleton--title h-6 w-3/5 mb-3 rounded-[4px]",
  block: "skeleton--block h-[120px] w-full rounded-card",
  card: "skeleton--card h-[280px] w-full rounded-candy-card",
  row: "skeleton--row h-14 w-full mb-2 rounded-input",
  avatar: "h-10 w-10 rounded-full",
};

/**
 * مكون هيكل التحميل المشترك (Skeleton)
 * يدعم تأثير تموج بريق الحلويات الانسيابي (Confectionery Shimmer Sweep)
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="جاري التحميل..."
        className={cn(
          "skeleton relative overflow-hidden select-none bg-candy-soft bg-[length:200%_100%]",
          "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent",
          "motion-reduce:before:hidden motion-reduce:animate-none",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <span className="sr-only">جاري التحميل...</span>
      </div>
    );
  }
);

Skeleton.displayName = "Skeleton";
