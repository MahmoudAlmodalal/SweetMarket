"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TabsVariant = "pills" | "line";

interface TabsContextValue {
  value: string;
  onValueChange: (val: string) => void;
  variant: TabsVariant;
  tabsId: string;
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
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const tabsId = id || generatedId;
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
          tabsId,
        }}
      >
        <div
          ref={ref}
          id={tabsId}
          className={cn("w-full", className)}
          {...props}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, onKeyDown, ...props }, ref) => {
    const { variant } = useTabsContext();

    // Accessible keyboard navigation across tabs in tablist (Arrow keys, Home, End)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;

      const target = e.target as HTMLElement;
      if (target.getAttribute("role") !== "tab") return;

      const container = e.currentTarget;
      const tabs = Array.from(
        container.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
      );
      const currentIndex = tabs.indexOf(target as HTMLButtonElement);
      if (currentIndex === -1) return;

      let nextIndex = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const isRtl = typeof document !== "undefined" && (document.dir === "rtl" || container.closest('[dir="rtl"]') !== null);
        if (isRtl && e.key === "ArrowRight") {
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else {
          nextIndex = (currentIndex + 1) % tabs.length;
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const isRtl = typeof document !== "undefined" && (document.dir === "rtl" || container.closest('[dir="rtl"]') !== null);
        if (isRtl && e.key === "ArrowLeft") {
          nextIndex = (currentIndex + 1) % tabs.length;
        } else {
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        }
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = tabs.length - 1;
      }

      if (nextIndex >= 0 && tabs[nextIndex]) {
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
      }
    };

    return (
      <div
        ref={ref}
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        className={cn(
          "flex items-center select-none overflow-x-auto no-scrollbar",
          variant === "pills" &&
            "p-1.5 rounded-candy-pill bg-white/95  border border-candy-line/80 shadow-candy-1 gap-1.5 inline-flex max-w-full",
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
>(({ className, value: triggerValue, children, onClick, id, ...props }, ref) => {
  const { value, onValueChange, variant, tabsId } = useTabsContext();
  const isSelected = value === triggerValue;
  const triggerId = id || `${tabsId}-tab-${triggerValue}`;
  const panelId = `${tabsId}-panel-${triggerValue}`;

  return (
    <button
      ref={ref}
      id={triggerId}
      type="button"
      role="tab"
      aria-selected={isSelected}
      aria-controls={panelId}
      tabIndex={isSelected ? 0 : -1}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) {
          onValueChange(triggerValue);
        }
      }}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap font-sans font-medium transition-all duration-200 outline-none select-none",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        variant === "pills" && [
          "px-4 py-2 text-sm rounded-candy-pill relative",
          isSelected
            ? "bg-candy-berry text-white font-bold shadow-candy-cta shadow-candy-cta scale-[1.02] ring-1 ring-candy-berry/20"
            : "text-candy-ink hover:text-candy-berry hover:bg-candy-soft/80 active:scale-[0.98]",
        ],
        variant === "line" && [
          "pb-2.5 pt-1 text-sm border-b-2 -mb-[1px] relative",
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
  forceMount?: boolean;
}

export const TabsContent = React.forwardRef<
  HTMLDivElement,
  TabsContentProps
>(({ className, value: contentValue, children, id, forceMount = false, ...props }, ref) => {
  const { value, tabsId } = useTabsContext();
  const isSelected = value === contentValue;
  const panelId = id || `${tabsId}-panel-${contentValue}`;
  const triggerId = `${tabsId}-tab-${contentValue}`;

  if (!isSelected && !forceMount) return null;

  return (
    <div
      ref={ref}
      id={panelId}
      role="tabpanel"
      aria-labelledby={triggerId}
      tabIndex={0}
      hidden={!isSelected}
      className={cn(
        "outline-none mt-4 transition-all duration-200 animate-in fade-in-50",
        !isSelected && "hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
TabsContent.displayName = "TabsContent";
