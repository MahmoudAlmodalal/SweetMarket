"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Sparkles,
  ArrowLeft,
  Heart,
  Package,
  Home,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyCartProps {
  className?: string;
  isCheckout?: boolean;
}

/**
 * Charming Confectionery Cloche & Sweets Illustration
 */
function ConfectioneryEmptyCartIllustration() {
  return (
    <div
      role="img"
      aria-label="رسم توضيحي لسلة حلويات فارغة بانتظار أشهى المذاقات"
      className="relative w-44 h-44 sm:w-52 sm:h-52 mx-auto flex items-center justify-center select-none"
    >
      {/* Ambient background glow & confectionery aura */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-candy-blush/80 via-candy-soft to-candy-blush/30 blur-xl opacity-80" />

      {/* Decorative dashed boundary circle */}
      <div className="absolute inset-2 rounded-full border-2 border-dashed border-candy-line/80 bg-white/70 backdrop-blur-xs flex items-center justify-center shadow-candy-1" />

      {/* Central SVG: Luxury Confectionery Dome / Cake Stand with Treats */}
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 drop-shadow-sm"
      >
        {/* Soft Radial Base Shadow */}
        <ellipse cx="100" cy="164" rx="60" ry="8" fill="#F0DDD8" />

        {/* Elegant Pedestal Cake Stand */}
        <path
          d="M75 160h50v4H75z"
          fill="#1F5C45"
          opacity="0.85"
        />
        <path
          d="M94 136h12l4 24H90l4-24z"
          fill="#C2431F"
          opacity="0.75"
        />
        <path
          d="M48 132c0-3 3-5 6-5h92c3 0 6 2 6 5v4H48v-4z"
          fill="#1F5C45"
        />

        {/* Glass Dessert Cloche Dome (Semi-transparent luxury bell) */}
        <path
          d="M56 127c0-26 19.5-47 44-47s44 21 44 47H56z"
          fill="#FFF5F7"
          fillOpacity="0.82"
          stroke="#E6B4C4"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Cloche Dome Handle Ring */}
        <circle
          cx="100"
          cy="74"
          r="6.5"
          fill="#F2B632"
          stroke="#1F5C45"
          strokeWidth="2"
        />
        <path
          d="M97 80h6v2h-6z"
          fill="#1F5C45"
        />

        {/* Inside Sweets: 1. Strawberry Swirl Cupcake */}
        <g transform="translate(68, 98)">
          {/* Cupcake Base / Liner */}
          <path
            d="M5 22L7 32h16l2-10H5z"
            fill="#D49A7A"
          />
          <path
            d="M5 22h20v2H5z"
            fill="#B97855"
          />
          {/* Fluffy Swirl Frosting */}
          <path
            d="M3 21c0-4 4-7 8-7 2 0 4 1 4 3 2-2 5-2 7 1 2 2 3 5 1 7H3z"
            fill="#FF85A1"
          />
          <path
            d="M7 16c1-3 4-5 8-5 3 0 6 2 6 5H7z"
            fill="#FFA3B8"
          />
          {/* Glossy Berry Cherry on Top */}
          <circle cx="15" cy="9.5" r="3.5" fill="#1F5C45" />
          <path d="M16 6.5c1-3 3-4 5-4" stroke="#5BCFCB" strokeWidth="1.2" strokeLinecap="round" />
        </g>

        {/* Inside Sweets: 2. Golden Pistachio Baklava Diamond */}
        <g transform="translate(104, 102)">
          {/* Baklava Diamond Layers */}
          <path
            d="M14 8l14 8-14 8-14-8 14-8z"
            fill="#F2B632"
          />
          <path
            d="M0 16l14 8v5l-14-8v-5z"
            fill="#D98A1E"
          />
          <path
            d="M14 24l14-8v5l-14 8v-5z"
            fill="#C07212"
          />
          {/* Pistachio Emerald Sprinkle */}
          <circle cx="14" cy="15" r="2" fill="#2F8A6D" />
          <circle cx="18" cy="14" r="1.3" fill="#5BCFCB" />
          <circle cx="11" cy="17" r="1.2" fill="#2F8A6D" />
        </g>

        {/* Wrapped Candy in Foreground */}
        <g transform="translate(86, 128)">
          {/* Candy Wrapper Left Twist */}
          <path d="M4 8L0 4v8l4-4z" fill="#C2431F" />
          {/* Candy Body */}
          <rect x="4" y="4.5" width="16" height="7" rx="3.5" fill="#1F5C45" />
          <line x1="9" y1="4.5" x2="7" y2="11.5" stroke="#FFF" strokeWidth="1.2" opacity="0.6" />
          <line x1="14" y1="4.5" x2="12" y2="11.5" stroke="#FFF" strokeWidth="1.2" opacity="0.6" />
          {/* Candy Wrapper Right Twist */}
          <path d="M20 8l4-4v8l-4-4z" fill="#C2431F" />
        </g>

        {/* Shiny Glass Reflection Highlight on Cloche */}
        <path
          d="M66 122c-3-12 1-26 8-32"
          stroke="#FFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.75"
        />
        <circle cx="76" cy="86" r="1.5" fill="#FFF" opacity="0.9" />
      </svg>

      {/* Floating Animated Confectionery Badges */}
      {/* 1. Sparkles Pill (Top Right) */}
      <div className="absolute top-1 -right-1 w-9 h-9 rounded-full bg-white shadow-candy-1 border border-candy-line flex items-center justify-center text-candy-strawberry z-20 animate-bounce">
        <Sparkles className="w-4 h-4 text-candy-strawberry" />
      </div>

      {/* 2. Sweet Heart Badge (Bottom Left) */}
      <div className="absolute bottom-2 -left-2 w-8 h-8 rounded-full bg-white shadow-candy-1 border border-candy-line flex items-center justify-center text-candy-rose z-20">
        <Heart className="w-4 h-4 fill-candy-rose/30 text-candy-rose" />
      </div>

      {/* 3. Gift Ribbon Badge (Top Left) */}
      <div className="absolute top-4 -left-1 w-7 h-7 rounded-full bg-candy-blush shadow-xs border border-candy-line/60 flex items-center justify-center text-candy-berry z-20">
        <Gift className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

export function EmptyCart({ className, isCheckout = false }: EmptyCartProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 sm:py-16 px-4 sm:px-6 max-w-lg mx-auto",
        className
      )}
    >
      {/* Charming Confectionery Illustration Motif */}
      <div className="mb-6">
        <ConfectioneryEmptyCartIllustration />
      </div>

      {/* Main Cheerful Heading */}
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-candy-berry mb-3">
        {isCheckout ? "سلة المشتريات فارغة" : "سلتك فارغة وتنتظر أشهى الحلويات!"}
      </h2>

      {/* Warm Friendly Sensory Arabic Description */}
      <p className="font-sans text-candy-muted text-sm sm:text-base leading-relaxed mb-8 max-w-md">
        {isCheckout
          ? "لم تقم بإضافة أي أصناف فاخرة إلى سلتك بعد. تفضل بتصفح قائمة الحلويات لاختيار ما يناسب ضيافتك وتأكيد طلبك بكل يسر."
          : "يبدو أنك لم تضف أي صنف من حلوياتنا الفاخرة بعد. استكشف تشكيلتنا الطازجة من البقلاوة المقرمشة، الكيك والتورتات، والمعمول الفاخر ودلل حواسك بأشهى المذاقات!"}
      </p>

      {/* Action Buttons: Direct 'تصفح الحلويات' button, Tracking, Home */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
        <Link
          href="/category/all"
          data-testid="browse-sweets-button"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-candy-pill bg-gradient-to-r from-candy-berry via-candy-strawberry to-candy-magenta text-white font-sans font-bold text-sm sm:text-base shadow-candy-cta hover:brightness-105 active:scale-95 transition-all duration-200"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>تصفح الحلويات</span>
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <Link
          href="/track"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-candy-pill bg-white text-candy-ink border border-candy-line font-sans font-semibold text-sm hover:bg-candy-soft hover:border-candy-berry/40 transition-all shadow-xs"
        >
          <Package className="w-4 h-4 text-candy-muted" />
          <span>تتبع طلب سابق</span>
        </Link>

        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-candy-pill bg-candy-soft text-candy-muted hover:text-candy-berry hover:bg-candy-blush/40 font-sans font-medium text-sm transition-all"
        >
          <Home className="w-4 h-4" />
          <span>الرئيسية</span>
        </Link>
      </div>

      {/* Quick Suggested Categories */}
      <div className="mt-10 pt-8 border-t border-candy-line/60 w-full">
        <p className="font-sans text-xs text-candy-muted mb-3.5 font-medium">
          أو اختر مباشرة من أصنافنا الأكثر طلباً:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/category/all"
            className="px-3.5 py-1.5 rounded-candy-pill bg-candy-soft text-candy-ink text-xs font-medium border border-candy-line hover:border-candy-strawberry/40 hover:text-candy-berry hover:bg-white transition-all shadow-xs"
          >
            بقلاوة وحلويات شرقية
          </Link>
          <Link
            href="/category/all"
            className="px-3.5 py-1.5 rounded-candy-pill bg-candy-soft text-candy-ink text-xs font-medium border border-candy-line hover:border-candy-strawberry/40 hover:text-candy-berry hover:bg-white transition-all shadow-xs"
          >
            كيك وتورتات
          </Link>
          <Link
            href="/category/all"
            className="px-3.5 py-1.5 rounded-candy-pill bg-candy-soft text-candy-ink text-xs font-medium border border-candy-line hover:border-candy-strawberry/40 hover:text-candy-berry hover:bg-white transition-all shadow-xs"
          >
            معمول وبيتي فور ملكي
          </Link>
          <Link
            href="/category/all"
            className="px-3.5 py-1.5 rounded-candy-pill bg-candy-soft text-candy-ink text-xs font-medium border border-candy-line hover:border-candy-strawberry/40 hover:text-candy-berry hover:bg-white transition-all shadow-xs"
          >
            صواني وهدايا الضيافة
          </Link>
        </div>
      </div>
    </div>
  );
}
