import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  spinner?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const buttonVariants = {
  variant: {
    primary:
      "bg-primary text-white border border-transparent hover:bg-primary-hover shadow-1 hover:shadow-candy-cta hover:-translate-y-0.5 active:translate-y-[1px] active:shadow-sm",
    secondary:
      "bg-surface border-2 border-blush text-primary hover:bg-soft hover:border-secondary hover:text-secondary shadow-sm hover:shadow-candy-1 hover:-translate-y-0.5 active:translate-y-[1px]",
    ghost:
      "bg-transparent text-candy-ink border border-transparent hover:bg-soft hover:text-primary active:bg-blush/40 active:translate-y-[1px]",
    danger:
      "bg-red-700 text-white border border-transparent hover:bg-red-800 focus-visible:ring-red-600 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-[1px]",
  },
  size: {
    sm: "min-h-11 px-3 text-xs rounded-button gap-1.5",
    md: "h-11 px-5 text-sm rounded-button gap-2",
    lg: "h-13 min-h-[50px] px-7 text-base rounded-button gap-2.5",
  },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      spinner,
      disabled,
      children,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-sans font-semibold transition-all duration-200 select-none touch-manipulation",
          "hover:scale-[1.015] active:scale-[0.98]",
          "motion-reduce:hover:scale-100 motion-reduce:active:scale-100 motion-reduce:hover:translate-y-0 motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none",
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            {spinner ? (
              <span className="inline-flex shrink-0">{spinner}</span>
            ) : (
              <Loader2
                className={cn(
                  "animate-spin text-current shrink-0",
                  size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
                )}
                aria-hidden="true"
              />
            )}
            <span className="sr-only">جاري التحميل...</span>
            {loadingText ? <span>{loadingText}</span> : children}
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
