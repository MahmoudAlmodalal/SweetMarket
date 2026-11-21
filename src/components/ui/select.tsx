import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      helperText,
      options,
      placeholder,
      id,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

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
            htmlFor={selectId}
            className="block mb-1.5 text-sm font-bold text-candy-ink font-sans select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center group">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy || undefined}
            aria-disabled={disabled}
            className={cn(
              "w-full h-12 pr-4 pl-10 rounded-[14px] font-sans text-sm text-candy-ink bg-candy-soft/50 border border-candy-line transition-all duration-200 outline-none appearance-none cursor-pointer shadow-xs",
              "hover:border-candy-line-dark/60 hover:bg-candy-soft/80",
              "focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20",
              "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
              error &&
                "border-rose-500 bg-rose-50/40 text-candy-ink focus:border-rose-600 focus:ring-rose-500/20 focus-visible:border-rose-600 focus-visible:ring-rose-500/20 shadow-[0_0_0_1px_rgba(244,63,94,0.1)]",
              disabled &&
                "opacity-50 cursor-not-allowed bg-candy-line/30 border-candy-line/50 pointer-events-none select-none",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-candy-muted bg-white font-sans">
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="py-2 text-candy-ink bg-white font-sans"
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          {/* Polished custom chevron with smooth hover & focus-within rotation */}
          <div
            className={cn(
              "absolute left-3.5 pointer-events-none text-candy-muted flex items-center justify-center transition-all duration-200",
              "group-hover:text-primary group-focus-within:text-primary",
              disabled && "opacity-40"
            )}
            aria-hidden="true"
          >
            <ChevronDown className="h-4 w-4 transition-transform duration-200 ease-out group-focus-within:rotate-180" />
          </div>
        </div>

        {error ? (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 text-xs font-medium text-rose-600 font-sans flex items-center gap-1.5 animate-in fade-in-50 duration-150"
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"
              aria-hidden="true"
            />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p
            id={helperId}
            className="mt-1.5 text-xs text-candy-muted font-sans leading-relaxed"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
