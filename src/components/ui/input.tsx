import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  iconPrefix?: React.ReactNode;
  iconSuffix?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      type = "text",
      label,
      error,
      helperText,
      iconPrefix,
      iconSuffix,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy = [
      error ? errorId : null,
      helperText && !error ? helperId : null,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={cn("w-full text-right", containerClassName)} dir="rtl">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-1.5 text-sm font-bold text-candy-ink font-sans select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {iconPrefix && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-candy-muted">
              {iconPrefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy || undefined}
            className={cn(
              "w-full h-12 px-4 rounded-[14px] font-sans text-sm text-candy-ink bg-candy-soft/60 border border-candy-line transition-all duration-200 outline-none",
              "placeholder:text-candy-muted",
              "focus:bg-white focus:border-candy-berry focus:ring-2 focus:ring-candy-strawberry/20",
              iconPrefix ? "pr-10" : "pr-4",
              iconSuffix ? "pl-10" : "pl-4",
              error &&
                "border-rose-500 focus:border-rose-600 focus:ring-rose-500/20 text-rose-900 bg-rose-50/30",
              disabled &&
                "opacity-50 cursor-not-allowed bg-candy-line/40 pointer-events-none",
              className
            )}
            {...props}
          />
          {iconSuffix && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-candy-muted">
              {iconSuffix}
            </div>
          )}
        </div>
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 text-xs font-medium text-rose-600 font-sans"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={helperId}
            className="mt-1.5 text-xs text-candy-muted font-sans"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
