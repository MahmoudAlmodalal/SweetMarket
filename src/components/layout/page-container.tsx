import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  children?: React.ReactNode;
  className?: string;
  fluid?: boolean;
}

export function PageContainer({
  as: Component = "div",
  className,
  children,
  fluid = false,
  ...props
}: PageContainerProps) {
  return (
    <Component
      className={cn(
        "w-full px-4 sm:px-6 lg:px-8",
        !fluid && "max-w-7xl mx-auto",
        "pb-24 md:pb-10",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
