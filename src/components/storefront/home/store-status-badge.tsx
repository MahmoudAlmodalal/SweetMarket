"use client";

import * as React from "react";
import { getStoreStatusLabel, type StoreStatusLabel } from "@/lib/store-status";
import { cn } from "@/lib/utils";

/**
 * شارة حالة المتجر الحيّة (مفتوح الآن / مغلق حالياً) بتوقيت غزة.
 * تُحسب على المتصفح بعد التركيب لتفادي اختلاف الترطيب، وتُحدَّث كل دقيقة.
 */
export function StoreStatusBadge({ className }: { className?: string }) {
  const [status, setStatus] = React.useState<StoreStatusLabel | null>(null);

  React.useEffect(() => {
    const update = () => setStatus(getStoreStatusLabel());
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, []);

  if (!status) return null;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          status.isOpen ? "bg-emerald-600" : "bg-amber-500"
        )}
      />
      <span>{status.label}</span>
    </span>
  );
}
