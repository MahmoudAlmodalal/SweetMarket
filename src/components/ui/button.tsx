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
      "bg-primary text-white border border-primary hover:bg-primary-hover hover:border-primary-hover active:bg-primary-hover",
    secondary:
      "bg-transparent border border-candy-ink text-candy-ink hover:bg-candy-ink hover:text-white active:bg-candy-ink active:text-white",
    ghost:
      "bg-transparent text-candy-ink border border-transparent hover:bg-soft hover:text-primary active:bg-blush/40",
    danger:
      "bg-red-700 text-white border border-red-700 hover:bg-red-800 focus-visible:ring-red-600",
  },
  size: {
    sm: "min-h-11 px-3.5 text-[13px] rounded-button gap-1.5",
    md: "h-11 px-5 text-sm rounded-button gap-2",
    lg: "h-13 min-h-[52px] px-8 text-[15px] rounded-button gap-2.5",
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
          "inline-flex items-center justify-center font-sans font-medium transition-colors duration-200 select-none touch-manipulation",
          "active:translate-y-px motion-reduce:transition-none",
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
