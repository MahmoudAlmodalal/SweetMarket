"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info" | "warning";

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
    warning: (title: string, description?: string) => string;
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
toast.warning = (title: string, description?: string) =>
  addMemoryToast({ title, description, variant: "warning" });

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
    container:
      "border-emerald-200/90 border-r-4 border-r-emerald-500 bg-white/95 text-emerald-950",
    icon: (
      <div className="shrink-0 p-1.5 rounded-full bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50/50">
        <CheckCircle2 className="h-4 w-4" />
      </div>
    ),
  },
  error: {
    container:
      "border-rose-200/90 border-r-4 border-r-rose-500 bg-white/95 text-rose-950",
    icon: (
      <div className="shrink-0 p-1.5 rounded-full bg-rose-50 text-rose-600 ring-4 ring-rose-50/50">
        <AlertCircle className="h-4 w-4" />
      </div>
    ),
  },
  info: {
    container:
      "border-candy-ink border-r-4 border-r-candy-berry bg-white/95 text-candy-ink",
    icon: (
      <div className="shrink-0 p-1.5 rounded-full bg-candy-soft text-candy-berry ring-4 ring-candy-soft/60">
        <Info className="h-4 w-4" />
      </div>
    ),
  },
  warning: {
    container:
      "border-amber-200/90 border-r-4 border-r-amber-500 bg-white/95 text-amber-950",
    icon: (
      <div className="shrink-0 p-1.5 rounded-full bg-amber-50 text-amber-600 ring-4 ring-amber-50/50">
        <AlertTriangle className="h-4 w-4" />
      </div>
    ),
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

    const isError = item.variant === "error";

    return (
      <div
        ref={ref}
        role={isError ? "alert" : "status"}
        aria-live={isError ? "assertive" : "polite"}
        aria-atomic="true"
        dir="rtl"
        className={cn(
          "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-candy-card border p-4 shadow-candy-2  transition-all duration-300 hover:shadow-candy-3 animate-[toast-in_0.3s_cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none",
          variantConfig.container,
          className
        )}
        {...props}
      >
        {variantConfig.icon}
        <div className="flex-1 min-w-0 space-y-1 text-right">
          <p className="font-sans font-bold text-sm text-candy-ink leading-tight">
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
            className="shrink-0 rounded-full p-1 text-candy-muted hover:text-candy-berry hover:bg-candy-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry/30"
            aria-label="إغلاق التنبيه"
          >
            <X className="h-4 w-4" aria-hidden="true" />
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
        "fixed bottom-4 left-4 z-[1100] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none p-2 sm:bottom-6 sm:left-6",
        className
      )}
    >
      {toasts.map((item) => (
        <Toast key={item.id} item={item} onDismiss={removeToast} />
      ))}
    </div>
  );
}
