"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type ToastInput = Omit<ToastItem, "id"> & { id?: string };

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (toast: ToastInput) => string;
  removeToast: (id: string) => void;
  toast: {
    (toast: ToastInput): string;
    success: (title: string, description?: string) => string;
    error: (title: string, description?: string) => string;
    info: (title: string, description?: string) => string;
  };
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

let toastListeners: Array<(toasts: ToastItem[]) => void> = [];
let memoryToasts: ToastItem[] = [];

function emitChange() {
  toastListeners.forEach((listener) => listener([...memoryToasts]));
}

function addMemoryToast(toast: ToastInput): string {
  const id = toast.id || Math.random().toString(36).substring(2, 9);
  const newToast: ToastItem = {
    ...toast,
    id,
    variant: toast.variant || "info",
    duration: toast.duration ?? 4000,
  };

  memoryToasts = [newToast, ...memoryToasts];
  emitChange();

  if (newToast.duration && newToast.duration > 0) {
    setTimeout(() => {
      removeMemoryToast(id);
    }, newToast.duration);
  }

  return id;
}

function removeMemoryToast(id: string) {
  memoryToasts = memoryToasts.filter((t) => t.id !== id);
  emitChange();
}

export const toast = (options: ToastInput) => addMemoryToast(options);
toast.success = (title: string, description?: string) =>
  addMemoryToast({ title, description, variant: "success" });
toast.error = (title: string, description?: string) =>
  addMemoryToast({ title, description, variant: "error" });
toast.info = (title: string, description?: string) =>
  addMemoryToast({ title, description, variant: "info" });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>(memoryToasts);

  React.useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setToasts);
    };
  }, []);

  const contextValue: ToastContextValue = React.useMemo(
    () => ({
      toasts,
      addToast: addMemoryToast,
      removeToast: removeMemoryToast,
      toast,
    }),
    [toasts]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    return {
      toasts: memoryToasts,
      addToast: addMemoryToast,
      removeToast: removeMemoryToast,
      toast,
    };
  }
  return context;
}

const toastVariantStyles: Record<
  ToastVariant,
  {
    container: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    container: "border-emerald-200 bg-white text-emerald-950",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />,
  },
  error: {
    container: "border-rose-200 bg-white text-rose-950",
    icon: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />,
  },
  info: {
    container: "border-candy-blush bg-white text-candy-ink",
    icon: <Info className="h-5 w-5 text-candy-berry shrink-0 mt-0.5" />,
  },
};

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  item: ToastItem;
  onDismiss?: (id: string) => void;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, item, onDismiss, ...props }, ref) => {
    const variantConfig =
      toastVariantStyles[item.variant || "info"] || toastVariantStyles.info;

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        dir="rtl"
        className={cn(
          "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-candy-card border p-4 shadow-candy-2 transition-all duration-300",
          variantConfig.container,
          className
        )}
        {...props}
      >
        {variantConfig.icon}
        <div className="flex-1 space-y-1 text-right">
          <p className="font-sans font-bold text-sm leading-tight">
            {item.title}
          </p>
          {item.description && (
            <p className="font-sans text-xs text-candy-muted leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            className="rounded-full p-1 text-candy-muted hover:text-candy-ink hover:bg-candy-soft transition-colors focus:outline-none focus:ring-2 focus:ring-candy-strawberry/30"
            aria-label="إغلاق التنبيه"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);
Toast.displayName = "Toast";

export function Toaster({ className }: { className?: string }) {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="الإشعارات"
      className={cn(
        "fixed bottom-4 left-4 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none p-2 sm:bottom-6 sm:left-6",
        className
      )}
    >
      {toasts.map((item) => (
        <Toast key={item.id} item={item} onDismiss={removeToast} />
      ))}
    </div>
  );
}
