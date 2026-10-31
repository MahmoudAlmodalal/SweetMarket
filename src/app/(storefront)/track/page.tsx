"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import {
  Compass,
  Package,
  ShieldCheck,
  MessageCircle,
  HelpCircle,
  ChevronLeft,
  Store,
  Sparkles,
} from "lucide-react";
import type { Order } from "@/types";
import { TrackOrderForm } from "@/components/storefront/order/track-order-form";
import { StatusTimeline } from "@/components/storefront/order/status-timeline";
import { Skeleton } from "@/components/ui/skeleton";

function TrackOrderSkeleton() {
  return (
    <div dir="rtl" className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      <div className="text-center space-y-3">
        <Skeleton className="h-10 w-64 mx-auto rounded-full" />
        <Skeleton className="h-4 w-96 max-w-full mx-auto rounded-full" />
      </div>
      <div className="bg-white border border-candy-line/80 rounded-candy-card p-8 shadow-candy-2 space-y-4">
        <Skeleton className="h-6 w-48 rounded-full" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-40 rounded-candy-pill mt-4" />
      </div>
    </div>
  );
}

function TrackOrderContent() {
  const [activeOrder, setActiveOrder] = React.useState<Order | null>(null);

  const handleOrderFound = React.useCallback((order: Order) => {
    setActiveOrder(order);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleNewSearch = React.useCallback(() => {
    setActiveOrder(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <div className="w-full min-h-[75vh] px-4 py-8 sm:py-12 bg-candy-canvas">
      <div dir="rtl" className="w-full max-w-3xl mx-auto space-y-8">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="مسار التنقل"
          className="flex items-center gap-2 text-xs font-sans text-candy-muted"
        >
          <Link
            href="/"
            className="hover:text-candy-berry transition-colors flex items-center gap-1"
          >
            <Store className="w-3.5 h-3.5" />
            <span>الرئيسية</span>
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-candy-muted/60" />
          <span className="font-bold text-candy-ink">تتبع الطلب</span>
        </nav>

        {/* Page Header */}
        <div className="text-center space-y-3 relative">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-candy-pill bg-candy-blush/60 border border-candy-line text-xs font-bold text-candy-berry shadow-xs">
            <Compass className="w-3.5 h-3.5 text-candy-strawberry animate-spin-slow" />
            <span>نظام التتبع المباشر (SCR-07)</span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl font-black text-candy-berry tracking-tight">
            تتبع مسار طلبك الملكي 🍰
          </h1>

          <p className="font-sans text-sm sm:text-base text-candy-muted max-w-xl mx-auto leading-relaxed">
            تابع مراحل إعداد وتزيين وتوصيل حلويات كاندي لوز خطوة بخطوة حتى وصولها إلى
            باب منزلك طازجة وشهية
          </p>
        </div>

        {/* Main Content Area: Form or Timeline */}
        {!activeOrder ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Tracking Lookup Form */}
            <TrackOrderForm
              onOrderFound={handleOrderFound}
              autoFocus
            />

            {/* Guarantees & Features Triple Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white border border-candy-line/80 rounded-2xl p-5 shadow-xs text-center space-y-2.5 hover:border-candy-rose/60 transition-colors">
                <div className="w-10 h-10 rounded-full bg-candy-soft text-candy-berry flex items-center justify-center mx-auto border border-candy-line">
                  <Package className="w-5 h-5 text-candy-strawberry" />
                </div>
                <h2 className="font-sans font-bold text-sm text-candy-ink">
                  تحديثات لحظية دقيقة
                </h2>
                <p className="font-sans text-xs text-candy-muted leading-relaxed">
                  متابعة دقيقة لكل مرحلة من مراحل التحضير في المعمل وحتى استلامها باليد.
                </p>
              </div>

              <div className="bg-white border border-candy-line/80 rounded-2xl p-5 shadow-xs text-center space-y-2.5 hover:border-candy-rose/60 transition-colors">
                <div className="w-10 h-10 rounded-full bg-candy-soft text-candy-berry flex items-center justify-center mx-auto border border-candy-line">
                  <ShieldCheck className="w-5 h-5 text-candy-strawberry" />
                </div>
                <h2 className="font-sans font-bold text-sm text-candy-ink">
                  نقل مبرد وتغليف ملكي
                </h2>
                <p className="font-sans text-xs text-candy-muted leading-relaxed">
                  نضمن المحافظة على قوام الكريمة الطازجة ونكهة الحلويات في صناديق مبردة.
                </p>
              </div>

              <div className="bg-white border border-candy-line/80 rounded-2xl p-5 shadow-xs text-center space-y-2.5 hover:border-candy-rose/60 transition-colors">
                <div className="w-10 h-10 rounded-full bg-candy-soft text-candy-berry flex items-center justify-center mx-auto border border-candy-line">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="font-sans font-bold text-sm text-candy-ink">
                  دعم فوري ومباشر
                </h2>
                <p className="font-sans text-xs text-candy-muted leading-relaxed">
                  فريق خدمة العملاء متواجد لمساعدتك عبر واتساب لأي تعديل أو استفسار.
                </p>
              </div>
            </div>

            {/* Quick Assistance Box */}
            <div className="bg-candy-soft/80 border border-candy-line rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-white text-candy-berry flex items-center justify-center shrink-0 border border-candy-line mt-0.5">
                <HelpCircle className="w-4 h-4 text-candy-strawberry" />
              </div>
              <div className="flex-1 text-xs sm:text-sm font-sans space-y-1">
                <h3 className="font-bold text-candy-ink">
                  أين أجد رقم الطلب الخاص بي؟
                </h3>
                <p className="text-candy-muted leading-relaxed">
                  ستجد رقم الطلب المكون من صيغة مثل (CL-2026-1001) في شاشة تأكيد الطلب فور
                  إتمامه بنجاح، أو يمكنك التواصل مع خدمة العملاء برقم هاتفك المسجل لمساعدتك فوراً.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Visual Step Timeline Component */}
            <StatusTimeline
              order={activeOrder}
              onNewSearch={handleNewSearch}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<TrackOrderSkeleton />}>
      <TrackOrderContent />
    </Suspense>
  );
}
