import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      helperText,
      id,
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

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
            htmlFor={textareaId}
            className="block mb-1.5 text-sm font-bold text-candy-ink font-sans select-none"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={cn(
            "w-full p-3.5 rounded-[14px] font-sans text-sm text-candy-ink bg-candy-soft/60 border border-candy-line transition-all duration-200 outline-none resize-y min-h-[100px]",
            "placeholder:text-candy-muted",
            "focus:bg-white focus:border-candy-berry focus:ring-2 focus:ring-candy-strawberry/20",
            error &&
              "border-rose-500 focus:border-rose-600 focus:ring-rose-500/20 text-rose-900 bg-rose-50/30",
            disabled &&
              "opacity-50 cursor-not-allowed bg-candy-line/40 pointer-events-none",
            className
          )}
          {...props}
        />
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

Textarea.displayName = "Textarea";
