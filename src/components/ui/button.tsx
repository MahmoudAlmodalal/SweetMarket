import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const buttonVariants = {
  variant: {
    primary:
      "bg-candy-berry text-white hover:bg-candy-berry-dark shadow-candy-1 hover:shadow-candy-cta active:translate-y-[1px]",
    secondary:
      "bg-white border-2 border-candy-blush text-candy-berry hover:bg-candy-soft hover:border-candy-rose active:translate-y-[1px] shadow-sm",
    ghost:
      "bg-transparent text-candy-ink hover:bg-candy-soft hover:text-candy-berry active:bg-candy-blush/40",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500 shadow-sm active:translate-y-[1px]",
  },
  size: {
    sm: "h-8 px-3 text-xs rounded-candy-pill gap-1.5",
    md: "h-11 px-5 text-sm rounded-candy-pill gap-2",
    lg: "h-13 min-h-[50px] px-7 text-base rounded-candy-pill gap-2.5",
  },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
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
          "inline-flex items-center justify-center font-sans font-semibold transition-all duration-200 select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-candy-strawberry focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:shadow-none",
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-current" aria-hidden="true" />
            <span className="sr-only">جاري التحميل...</span>
          </>
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
