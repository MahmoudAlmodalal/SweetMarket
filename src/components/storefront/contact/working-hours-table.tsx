"use client";

import * as React from "react";
import { Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STORE_WORKING_HOURS,
  type WorkingHoursRule,
  getGazaNow,
  getGazaWeekday,
  isStoreOpen,
} from "@/lib/store-hours";

export {
  STORE_WORKING_HOURS,
  type WorkingHoursRule,
  getGazaNow,
  getGazaWeekday,
  isStoreOpen,
};

export interface WorkingHoursTableProps {
  className?: string;
  /**
   * Optional manual override for testing open/closed states
   */
  forcedState?: "open" | "closed";
  /**
   * Optional custom date for testing and fixtures (Asia/Gaza wall-clock time)
   */
  now?: Date;
}

interface ScheduleRow {
  days: string;
  hours: string;
  isToday: boolean;
  notes?: string;
}

export function WorkingHoursTable({
  className,
  forcedState,
  now,
}: WorkingHoursTableProps) {
  const [mounted, setMounted] = React.useState(false);
  const [currentDate, setCurrentDate] = React.useState<Date>(() => now ?? new Date());

  React.useEffect(() => {
    setMounted(true);
    if (!now) {
      setCurrentDate(new Date());

      // Update every 30 seconds so state transitions smoothly
      const timer = setInterval(() => {
        setCurrentDate(new Date());
      }, 30000);

      return () => clearInterval(timer);
    }
  }, [now]);

  // Use the injected `now` date if supplied, otherwise the reactive currentDate
  const effectiveDate = now ?? (mounted ? currentDate : new Date());

  const openNow = forcedState
    ? forcedState === "open"
    : isStoreOpen(effectiveDate);

  const gazaWeekday = getGazaWeekday(effectiveDate);

  const schedule: ScheduleRow[] = STORE_WORKING_HOURS.map((rule) => ({
    days: rule.days,
    hours: rule.hours,
    notes: rule.notes,
    isToday: rule.weekdays.includes(gazaWeekday),
  }));

  const showHighlight = mounted || Boolean(now);

  return (
    <div
      className={cn(
        "rounded-candy-card bg-white border border-candy-line shadow-candy-1 p-6 sm:p-8 transition-all duration-300 relative overflow-hidden",
        className
      )}
    >
      {/* Header with Title and Dynamic Open/Closed Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-candy-line/70">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-5 h-5 text-candy-berry" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg sm:text-xl text-candy-berry leading-tight">
              جدول ساعات العمل
            </h2>
            <p className="font-sans text-xs text-candy-muted mt-0.5">
              مواعيد استقبال الزبائن وتحضير الطلبيات وتوصيلها (بتوقيت غزة)
            </p>
          </div>
        </div>

        {/* Dynamic Badge */}
        <div className="shrink-0" suppressHydrationWarning>
          <span
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-candy-pill font-sans font-bold text-xs sm:text-sm border transition-all shadow-xs",
              openNow
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-rose-50 text-rose-700 border-rose-300"
            )}
            role="status"
            aria-live="polite"
          >
            <span
              className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0",
                openNow ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              )}
            />
            <span>{openNow ? "مفتوح الآن 🟢" : "مغلق حالياً 🔴"}</span>
          </span>
        </div>
      </div>

      {/* Opening Hours Table */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-candy-line/60 bg-candy-soft/30">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-candy-soft/80 border-b border-candy-line/60 text-candy-muted text-xs font-semibold">
              <th scope="col" className="p-3.5 sm:px-4 text-right">
                اليوم
              </th>
              <th scope="col" className="p-3.5 sm:px-4 text-right">
                أوقات العمل
              </th>
              <th scope="col" className="p-3.5 sm:px-4 text-left hidden sm:table-cell">
                ملاحظات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-candy-line/40 text-sm">
            {schedule.map((row, idx) => (
              <tr
                key={idx}
                className={cn(
                  "transition-colors",
                  row.isToday && showHighlight
                    ? "bg-candy-blush/25 font-semibold text-candy-berry"
                    : "hover:bg-candy-soft/60 text-candy-ink"
                )}
              >
                <td className="p-3.5 sm:p-4 align-middle">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold">{row.days}</span>
                    {row.isToday && showHighlight && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-candy-pill bg-candy-berry text-white text-[10px] font-bold">
                        اليوم
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3.5 sm:p-4 align-middle font-sans font-medium text-candy-ink dir-ltr text-right">
                  <span className="inline-block bg-white/80 px-2.5 py-1 rounded-lg border border-candy-line/60 text-xs sm:text-sm font-bold text-candy-berry">
                    {row.hours}
                  </span>
                </td>
                <td className="p-3.5 sm:p-4 align-middle text-candy-muted text-xs text-left hidden sm:table-cell font-sans">
                  {row.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Off-hours / Online orders availability banner */}
      <div className="mt-5 rounded-xl bg-candy-cream border border-candy-line p-3.5 flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-candy-blush text-candy-berry flex items-center justify-center shrink-0 mt-0.5">
          <Calendar className="w-3.5 h-3.5" />
        </div>
        <p className="font-sans text-xs text-candy-muted leading-relaxed">
          <strong className="text-candy-ink font-bold block mb-0.5">
            الطلب الإلكتروني متاح 24/7:
          </strong>
          يمكنكم تقديم طلباتكم وحجز كيك المناسبات في أي وقت عبر الموقع، وستتم معالجة الطلبات فور بدء ساعات العمل الرسمية.
        </p>
      </div>
    </div>
  );
}
