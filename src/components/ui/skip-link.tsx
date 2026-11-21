import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkipLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  targetId?: string;
}

/**
 * رابط تخطي إلى المحتوى الرئيسي (.skip-link)
 * يدعم قارئات الشاشة والملاحة عبر لوحة المفاتيح وفق معايير WCAG 2.1 AA
 */
export const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
  (
    {
      className,
      targetId = "main-content",
      children = "تخطي إلى المحتوى الرئيسي",
      href,
      ...props
    },
    ref
  ) => {
    return (
      <a
        ref={ref}
        href={href || `#${targetId}`}
        className={cn(
          "skip-link z-[1200] fixed top-3 start-4 -translate-y-[200%] focus:translate-y-0 px-4 py-2 bg-primary text-white font-sans font-bold text-sm rounded-candy-pill shadow-candy-2 transition-all duration-200 ease-out",
          "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary focus:shadow-candy-3",
          "motion-reduce:transition-none",
          className
        )}
        {...props}
      >
        {children}
      </a>
    );
  }
);

SkipLink.displayName = "SkipLink";
