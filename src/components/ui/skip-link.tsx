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
          "skip-link z-[1200] fixed top-2 start-4 -translate-y-[200%] focus:translate-y-0 px-4 py-2 bg-candy-berry text-white font-sans font-bold text-sm rounded-xl shadow-candy-2 transition-transform duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-white",
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
