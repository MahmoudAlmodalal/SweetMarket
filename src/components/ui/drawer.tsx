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
    <DrawerContext.Provider
      value={{ open, setOpen, side, titleId, descriptionId }}
    >
      {children}
    </DrawerContext.Provider>
  );
}

export interface DrawerTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const DrawerTrigger = React.forwardRef<
  HTMLButtonElement,
  DrawerTriggerProps
>(({ className, onClick, children, asChild = false, ...props }, ref) => {
  const { setOpen } = useDrawerContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented) {
      setOpen(true);
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{
        onClick?: React.MouseEventHandler;
        className?: string;
      }>,
      {
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          (
            children as React.ReactElement<{
              onClick?: React.MouseEventHandler;
            }>
          ).props.onClick?.(e);
          if (!e.defaultPrevented) {
            setOpen(true);
          }
        },
        className: cn(
          (children as React.ReactElement<{ className?: string }>).props
            .className,
          className
        ),
      }
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      onClick={handleClick}
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
    const panelRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    // Handle scroll lock, ESC key and trap focus
    React.useEffect(() => {
      if (!open) return;

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Focus drawer on open if no inner autofocus element exists
      if (panelRef.current) {
        const hasAutofocus =
          panelRef.current.querySelector<HTMLElement>("[autofocus]");
        if (hasAutofocus) {
          hasAutofocus.focus();
        } else {
          panelRef.current.focus({ preventScroll: true });
        }
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          setOpen(false);
          return;
        }

        if (e.key === "Tab" && panelRef.current) {
          const focusableElements =
            panelRef.current.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
          if (focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
              }
            } else {
              if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
              }
            }
          }
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
        "inset-x-0 bottom-0 rounded-t-candy-section border-t border-candy-line/80 max-h-[85vh] animate-[modal-in_0.25s_cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none",
      right:
        "inset-y-0 right-0 w-full max-w-md border-l border-candy-line/80 rounded-l-candy-section transition-transform duration-300 ease-out",
      left:
        "inset-y-0 left-0 w-full max-w-md border-r border-candy-line/80 rounded-r-candy-section transition-transform duration-300 ease-out",
    };

    return createPortal(
      <div className="fixed inset-0 z-50 flex" dir="rtl">
        {/* Backdrop with blur-md and confectionery fade */}
        <div
          className="fixed inset-0 bg-candy-ink/50  transition-opacity duration-300 animate-[fade-in_0.2s_ease-out] motion-reduce:transition-none"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />

        {/* Drawer Panel */}
        <div
          ref={(node) => {
            panelRef.current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          className={cn(
            "fixed z-10 flex flex-col bg-candy-cream shadow-candy-3 outline-none transition-transform duration-300 ease-candy-ease overflow-hidden",
            sideStyles[side],
            className
          )}
          {...props}
        >
          {side === "bottom" && showHandle && (
            <div
              className="py-3 flex justify-center shrink-0"
              aria-hidden="true"
            >
              <span className="w-12 h-1.5 rounded-full bg-candy-blush/80 hover:bg-candy-berry/30 transition-colors" />
            </div>
          )}

          {!hideCloseButton && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute left-4 top-4 rounded-full p-2 text-candy-muted hover:text-candy-berry hover:bg-candy-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry/40 z-20"
              aria-label="إغلاق اللوحة الجانبية"
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
        "font-display font-bold text-xl text-candy-ink leading-snug tracking-tight",
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
    className={cn(
      "flex flex-col sm:flex-row gap-2 mt-auto pt-4 border-t border-candy-line/80",
      className
    )}
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
