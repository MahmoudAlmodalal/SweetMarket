"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  ShoppingBag,
  Home,
  LayoutGrid,
  Phone,
  Truck,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStorageItem, STORAGE_KEYS } from "@/lib/storage";
import type { CartItem } from "@/types";

export interface StorefrontHeaderProps {
  cartCount?: number;
  className?: string;
}

export function StorefrontHeader({
  cartCount: propCartCount,
  className,
}: StorefrontHeaderProps) {
  const pathname = usePathname();
  const [internalCount, setInternalCount] = React.useState<number>(
    propCartCount ?? 0
  );

  React.useEffect(() => {
    if (typeof propCartCount === "number") {
      setInternalCount(propCartCount);
      return;
    }

    const calculateCount = () => {
      try {
        const items = getStorageItem(STORAGE_KEYS.CART_ITEMS, [] as CartItem[]);
        if (Array.isArray(items)) {
          const total = items.reduce(
            (sum: number, item: CartItem) =>
              sum + (Number(item?.quantity) || 1),
            0
          );
          setInternalCount(total);
        } else {
          setInternalCount(0);
        }
      } catch {
        setInternalCount(0);
      }
    };

    calculateCount();

    const handleStorageChange = () => calculateCount();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("candy_cart_updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("candy_cart_updated", handleStorageChange);
    };
  }, [propCartCount]);

  const navLinks = [
    {
      href: "/",
      label: "الرئيسية",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      href: "/#categories",
      label: "الأصناف",
      icon: LayoutGrid,
      isActive: pathname.startsWith("/category"),
    },
    {
      href: "/contact",
      label: "من نحن والتواصل",
      icon: Phone,
      isActive: pathname === "/contact",
    },
    {
      href: "/track",
      label: "تتبع الطلب",
      icon: Truck,
      isActive: pathname === "/track",
    },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-candy-line/60 shadow-[0_4px_20px_rgba(184,92,110,0.06)]",
        className
      )}
    >
      {/* Top Announcement Ribbon */}
      <div className="bg-candy-soft border-b border-candy-line/40 px-4 py-1.5 text-center flex items-center justify-center gap-2 text-xs font-semibold text-[#800a40]">
        <Sparkles className="w-3.5 h-3.5 text-candy-strawberry shrink-0" />
        <span>توصيل طازج وسريع لجميع المناطق 🍰</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Brand Logo & Title */}
          <Link
            href="/"
            className="flex items-center gap-3 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-candy-strawberry rounded-lg p-1 -m-1"
          >
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-candy-blush text-[#800a40] flex items-center justify-center shadow-candy-1 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-[#800a40]" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl md:text-2xl text-[#800a40] leading-tight tracking-tight">
                كاندي لوز
              </span>
              <span className="font-sans text-[11px] md:text-xs text-candy-muted tracking-wider">
                Candy Loz
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="التنقل الرئيسي"
            className="hidden md:flex items-center gap-1.5 lg:gap-2"
          >
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-2 rounded-candy-pill text-sm font-semibold transition-all duration-200 select-none",
                    link.isActive
                      ? "bg-candy-soft text-[#800a40] shadow-sm font-bold"
                      : "text-candy-ink/80 hover:text-[#800a40] hover:bg-candy-soft/60"
                  )}
                >
                  <Icon className="w-4 h-4 text-candy-rose" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Header Action Elements */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Search Bar */}
            <div className="hidden lg:flex items-center relative w-56 xl:w-64">
              <Search className="w-4 h-4 text-candy-muted absolute right-3.5 pointer-events-none" />
              <input
                type="search"
                placeholder="ابحث عن حلاك..."
                aria-label="البحث عن منتج"
                className="w-full h-10 pr-9 pl-4 bg-candy-soft/80 hover:bg-candy-soft focus:bg-white text-candy-ink placeholder:text-candy-muted text-xs rounded-candy-pill border border-candy-line/60 focus:outline-none focus:ring-2 focus:ring-candy-strawberry/30 transition-all duration-200"
              />
            </div>

            {/* Quick Track Pill (Desktop only) */}
            <Link
              href="/track"
              className="hidden sm:inline-flex md:hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-candy-pill bg-candy-soft text-[#800a40] hover:bg-candy-blush text-xs font-bold transition-colors shadow-sm"
            >
              <Truck className="w-4 h-4 text-candy-rose" />
              <span>تتبع طلبي</span>
            </Link>

            {/* Reactive Cart Button */}
            <Link
              href="/cart"
              aria-label={`سلة المشتريات (${internalCount} عناصر)`}
              className="relative w-11 h-11 rounded-full bg-candy-soft hover:bg-candy-blush text-[#800a40] flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm border border-candy-line/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-candy-strawberry"
            >
              <ShoppingBag className="w-5 h-5 text-[#800a40]" />
              {internalCount > 0 && (
                <span
                  aria-label={`${internalCount} أصناف في السلة`}
                  className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-candy-strawberry text-white font-sans text-[11px] font-bold flex items-center justify-center shadow-candy-cta animate-in zoom-in-75 duration-200"
                >
                  {internalCount > 99 ? "+99" : internalCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar Row (< 768px) */}
        <div className="pb-3 md:hidden">
          <div className="relative flex items-center w-full">
            <Search className="w-4 h-4 text-candy-muted absolute right-3.5 pointer-events-none" />
            <input
              type="search"
              placeholder="ابحث عن حلاك المفضل..."
              aria-label="البحث عن منتج"
              className="w-full h-10 pr-9 pl-4 bg-candy-soft text-candy-ink placeholder:text-candy-muted text-xs rounded-candy-pill border border-candy-line/70 focus:outline-none focus:bg-white focus:ring-2 focus:ring-candy-strawberry/30 transition-all duration-200 shadow-sm"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
