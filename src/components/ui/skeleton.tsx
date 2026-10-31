import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="جاري التحميل..."
        className={cn(
          "animate-pulse rounded-xl bg-candy-line/60 dark:bg-candy-soft",
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";
