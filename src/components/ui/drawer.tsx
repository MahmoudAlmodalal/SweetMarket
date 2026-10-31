"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type DrawerSide = "bottom" | "right" | "left";

interface DrawerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  side: DrawerSide;
  titleId: string;
  descriptionId: string;
}

const DrawerContext = React.createContext<DrawerContextValue | null>(null);

function useDrawerContext() {
  const context = React.useContext(DrawerContext);
  if (!context) {
    throw new Error("Drawer subcomponents must be used within a Drawer");
  }
  return context;
}

export interface DrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: DrawerSide;
  children: React.ReactNode;
}

export function Drawer({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  side = "bottom",
  children,
}: DrawerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  const titleId = React.useId();
  const descriptionId = React.useId();

  return (
    <DrawerContext.Provider value={{ open, setOpen, side, titleId, descriptionId }}>
      {children}
    </DrawerContext.Provider>
  );
}

export interface DrawerTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const DrawerTrigger = React.forwardRef<
  HTMLButtonElement,
  DrawerTriggerProps
>(({ className, onClick, children, ...props }, ref) => {
  const { setOpen } = useDrawerContext();

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) {
          setOpen(true);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
});
DrawerTrigger.displayName = "DrawerTrigger";

export interface DrawerContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  hideCloseButton?: boolean;
  showHandle?: boolean;
}

export const DrawerContent = React.forwardRef<
  HTMLDivElement,
  DrawerContentProps
>(
  (
    {
      className,
      children,
      hideCloseButton = false,
      showHandle = true,
      ...props
    },
    ref
  ) => {
    const { open, setOpen, side, titleId, descriptionId } = useDrawerContext();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    // Handle scroll lock & ESC
    React.useEffect(() => {
      if (!open) return;

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setOpen(false);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [open, setOpen]);

    if (!mounted || !open) return null;

    const sideStyles: Record<DrawerSide, string> = {
      bottom:
        "inset-x-0 bottom-0 rounded-t-candy-section border-t border-candy-line max-h-[85vh]",
      right:
        "inset-y-0 right-0 w-full max-w-md border-l border-candy-line rounded-l-candy-section",
      left:
        "inset-y-0 left-0 w-full max-w-md border-r border-candy-line rounded-r-candy-section",
    };

    return createPortal(
      <div className="fixed inset-0 z-50 flex" dir="rtl">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-candy-ink/40 backdrop-blur-sm transition-opacity duration-300"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />

        {/* Drawer Panel */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className={cn(
            "fixed z-10 flex flex-col bg-white shadow-candy-3 transition-transform duration-300 ease-candy-ease overflow-hidden",
            sideStyles[side],
            className
          )}
          {...props}
        >
          {side === "bottom" && showHandle && (
            <div className="py-2.5 flex justify-center shrink-0">
              <span
                className="w-12 h-1.5 rounded-full bg-candy-line-dark"
                aria-hidden="true"
              />
            </div>
          )}

          {!hideCloseButton && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute left-4 top-4 rounded-full p-2 text-candy-muted hover:text-candy-ink hover:bg-candy-soft transition-colors focus:outline-none focus:ring-2 focus:ring-candy-strawberry/30 z-20"
              aria-label="إغلاق القائمة"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}

          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
            {children}
          </div>
        </div>
      </div>,
      document.body
    );
  }
);
DrawerContent.displayName = "DrawerContent";

export const DrawerHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 text-right mb-4", className)}
    {...props}
  />
));
DrawerHeader.displayName = "DrawerHeader";

export const DrawerTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const { titleId } = useDrawerContext();
  return (
    <h2
      ref={ref}
      id={titleId}
      className={cn(
        "font-display font-semibold text-xl text-candy-ink leading-snug",
        className
      )}
      {...props}
    />
  );
});
DrawerTitle.displayName = "DrawerTitle";

export const DrawerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { descriptionId } = useDrawerContext();
  return (
    <p
      ref={ref}
      id={descriptionId}
      className={cn("text-sm text-candy-muted font-sans", className)}
      {...props}
    />
  );
});
DrawerDescription.displayName = "DrawerDescription";

export const DrawerFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col sm:flex-row gap-2 mt-auto pt-4 border-t border-candy-line", className)}
    {...props}
  />
));
DrawerFooter.displayName = "DrawerFooter";

export const DrawerClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { setOpen } = useDrawerContext();
  return (
    <button
      ref={ref}
      type="button"
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) {
          setOpen(false);
        }
      }}
      {...props}
    />
  );
});
DrawerClose.displayName = "DrawerClose";
