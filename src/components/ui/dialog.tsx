"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within a Dialog");
  }
  return context;
}

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: DialogProps) {
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
    <DialogContext.Provider value={{ open, setOpen, titleId, descriptionId }}>
      {children}
    </DialogContext.Provider>
  );
}

export interface DialogTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  DialogTriggerProps
>(({ className, onClick, children, asChild = false, ...props }, ref) => {
  const { setOpen } = useDialogContext();

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
DialogTrigger.displayName = "DialogTrigger";

export interface DialogContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  hideCloseButton?: boolean;
}

export const DialogContent = React.forwardRef<
  HTMLDivElement,
  DialogContentProps
>(({ className, children, hideCloseButton = false, ...props }, ref) => {
  const { open, setOpen, titleId, descriptionId } = useDialogContext();
  const [mounted, setMounted] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll, handle Escape key and trap keyboard focus
  React.useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Auto-focus dialog on open if no inner autofocus element exists
    if (contentRef.current) {
      const hasAutofocus =
        contentRef.current.querySelector<HTMLElement>("[autofocus]");
      if (hasAutofocus) {
        hasAutofocus.focus();
      } else {
        contentRef.current.focus({ preventScroll: true });
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        return;
      }

      if (e.key === "Tab" && contentRef.current) {
        const focusableElements =
          contentRef.current.querySelectorAll<HTMLElement>(
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      dir="rtl"
    >
      {/* Backdrop with blur-md and confectionery fade */}
      <div
        className="fixed inset-0 bg-candy-ink/50 backdrop-blur-md transition-opacity duration-300 animate-[fade-in_0.2s_ease-out] motion-reduce:transition-none"
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      {/* Modal Dialog Card with smooth scale/fade transitions */}
      <div
        ref={(node) => {
          contentRef.current = node;
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
          "relative z-10 w-full max-w-lg rounded-candy-card bg-white p-6 shadow-candy-3 border border-candy-line/80 outline-none transition-all duration-300 ease-out transform animate-[modal-in_0.25s_cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none",
          className
        )}
        {...props}
      >
        {!hideCloseButton && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute left-4 top-4 rounded-full p-2 text-candy-muted hover:text-candy-berry hover:bg-candy-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry/40 z-20"
            aria-label="إغلاق النافذة"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
});
DialogContent.displayName = "DialogContent";

export const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 text-right mb-4", className)}
    {...props}
  />
));
DialogHeader.displayName = "DialogHeader";

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const { titleId } = useDialogContext();
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
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { descriptionId } = useDialogContext();
  return (
    <p
      ref={ref}
      id={descriptionId}
      className={cn(
        "text-sm text-candy-muted font-sans leading-relaxed",
        className
      )}
      {...props}
    />
  );
});
DialogDescription.displayName = "DialogDescription";

export const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-start gap-2.5 mt-6",
      className
    )}
    {...props}
  />
));
DialogFooter.displayName = "DialogFooter";

export const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { setOpen } = useDialogContext();
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
DialogClose.displayName = "DialogClose";
