"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TabsVariant = "pills" | "line";

interface TabsContextValue {
  value: string;
  onValueChange: (val: string) => void;
  variant: TabsVariant;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs subcomponents must be used within a Tabs component");
  }
  return context;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      className,
      value: controlledValue,
      defaultValue = "",
      onValueChange,
      variant = "pills",
      children,
      ...props
    },
    ref
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : uncontrolledValue;

    const handleValueChange = React.useCallback(
      (val: string) => {
        if (!isControlled) {
          setUncontrolledValue(val);
        }
        onValueChange?.(val);
      },
      [isControlled, onValueChange]
    );

    return (
      <TabsContext.Provider
        value={{
          value,
          onValueChange: handleValueChange,
          variant,
        }}
      >
        <div ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => {
    const { variant } = useTabsContext();

    return (
      <div
        ref={ref}
        role="tablist"
        aria-orientation="horizontal"
        className={cn(
          "flex items-center select-none overflow-x-auto no-scrollbar",
          variant === "pills" &&
            "p-1.5 rounded-candy-pill bg-white border border-candy-line shadow-sm gap-1.5",
          variant === "line" &&
            "border-b border-candy-line gap-4 sm:gap-6 w-full",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsList.displayName = "TabsList";

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  TabsTriggerProps
>(({ className, value: triggerValue, children, onClick, ...props }, ref) => {
  const { value, onValueChange, variant } = useTabsContext();
  const isSelected = value === triggerValue;

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) {
          onValueChange(triggerValue);
        }
      }}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap font-sans font-medium transition-all duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-candy-strawberry/40 focus-visible:ring-offset-1",
        variant === "pills" && [
          "px-4 py-2 text-sm rounded-candy-pill",
          isSelected
            ? "bg-gradient-to-l from-candy-berry to-candy-strawberry text-white font-bold shadow-candy-cta"
            : "text-candy-ink hover:text-candy-berry hover:bg-candy-soft",
        ],
        variant === "line" && [
          "pb-2.5 pt-1 text-sm border-b-2 -mb-[1px]",
          isSelected
            ? "border-candy-berry text-candy-berry font-bold"
            : "border-transparent text-candy-muted hover:text-candy-ink",
        ],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
TabsTrigger.displayName = "TabsTrigger";

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<
  HTMLDivElement,
  TabsContentProps
>(({ className, value: contentValue, children, ...props }, ref) => {
  const { value } = useTabsContext();
  const isSelected = value === contentValue;

  if (!isSelected) return null;

  return (
    <div
      ref={ref}
      role="tabpanel"
      tabIndex={0}
      className={cn("outline-none mt-4", className)}
      {...props}
    >
      {children}
    </div>
  );
});
TabsContent.displayName = "TabsContent";
