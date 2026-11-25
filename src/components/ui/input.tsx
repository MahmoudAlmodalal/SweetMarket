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
  showCount?: boolean;
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
      showCount = false,
      maxLength,
      id,
      disabled,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Character counter state for both controlled and uncontrolled inputs
    const [charCount, setCharCount] = React.useState<number>(() => {
      const initial = value !== undefined ? value : defaultValue;
      return initial !== undefined && initial !== null ? String(initial).length : 0;
    });

    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        setCharCount(String(value).length);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setCharCount(e.target.value.length);
      }
      onChange?.(e);
    };

    const describedBy = [
      error ? errorId : null,
      helperText && !error ? helperId : null,
    ]
      .filter(Boolean)
      .join(" ");

    const hasBottomBar = Boolean(error || helperText || showCount);

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
        <div className="relative flex items-center group">
          {iconPrefix && (
            <div
              className="absolute right-3.5 flex items-center pointer-events-none text-candy-muted group-focus-within:text-primary transition-colors duration-200"
              aria-hidden="true"
            >
              {iconPrefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy || undefined}
            className={cn(
              "w-full h-12 px-4 rounded-[4px] font-sans text-sm text-candy-ink bg-candy-soft/50 border border-candy-line transition-all duration-200 outline-none shadow-xs",
              "hover:border-candy-line-dark/60 hover:bg-candy-soft/80",
              "placeholder:text-candy-muted/70",
              "focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20",
              "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
              iconPrefix ? "pr-10" : "pr-4",
              iconSuffix ? "pl-10" : "pl-4",
              error &&
                "border-rose-500 bg-rose-50/40 text-candy-ink placeholder:text-rose-300 focus:border-rose-600 focus:ring-rose-500/20 focus-visible:border-rose-600 focus-visible:ring-rose-500/20 shadow-[0_0_0_1px_rgba(244,63,94,0.1)]",
              disabled &&
                "opacity-50 cursor-not-allowed bg-candy-line/30 border-candy-line/50 pointer-events-none select-none",
              className
            )}
            {...props}
          />
          {iconSuffix && (
            <div
              className="absolute left-3.5 flex items-center pointer-events-none text-candy-muted group-focus-within:text-primary transition-colors duration-200"
              aria-hidden="true"
            >
              {iconSuffix}
            </div>
          )}
        </div>

        {hasBottomBar && (
          <div className="flex items-start justify-between gap-2 mt-1.5 px-0.5">
            <div className="flex-1">
              {error ? (
                <p
                  id={errorId}
                  role="alert"
                  className="text-xs font-medium text-rose-600 font-sans flex items-center gap-1.5 animate-in fade-in-50 duration-150"
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
                  className="text-xs text-candy-muted font-sans leading-relaxed"
                >
                  {helperText}
                </p>
              ) : null}
            </div>

            {showCount && (
              <span
                className={cn(
                  "text-xs font-mono tabular-nums text-candy-muted/80 transition-colors duration-200 select-none shrink-0",
                  maxLength && charCount >= maxLength && "text-rose-600 font-bold",
                  maxLength &&
                    charCount >= maxLength * 0.9 &&
                    charCount < maxLength &&
                    "text-amber-600 font-medium"
                )}
                aria-live="polite"
              >
                {maxLength ? `${charCount} / ${maxLength}` : charCount}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
