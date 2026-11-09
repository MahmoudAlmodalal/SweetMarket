"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  ShoppingBag,
  Home,
  LayoutGrid,
  Phone,
  Truck,
  Search,
  Heart,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStorageItem, STORAGE_KEYS } from "@/lib/storage";
import { StoreLogo } from "@/components/ui/store-logo";
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
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
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

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    router.push(query ? `/category/all?q=${encodeURIComponent(query)}` : "/category/all");
  };

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
        "sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-candy-line/60 shadow-card",
        className
      )}
    >
      {/* Top Announcement Ribbon */}
      <div className="bg-candy-soft border-b border-candy-line/40 px-4 py-1.5 text-center flex items-center justify-center gap-2 text-xs font-semibold text-primary">
        <Sparkles className="w-3.5 h-3.5 text-secondary shrink-0" />
        <span>خيارات التوصيل والرسوم حسب المنطقة 🍰</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Brand Logo & Title */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1 -m-1"
          >
            <StoreLogo
              variant="main"
              width={154}
              height={45}
              priority
              className="w-[124px] sm:w-[142px] md:w-[154px] group-hover:scale-[1.02] transition-transform duration-200"
            />
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
                    "inline-flex items-center gap-2 px-3.5 py-2 rounded-button text-sm font-semibold transition-all duration-200 select-none",
                    link.isActive
                      ? "bg-candy-soft text-primary shadow-sm font-bold"
                      : "text-candy-ink/80 hover:text-primary hover:bg-candy-soft/60"
                  )}
                >
                  <Icon className="w-4 h-4 text-secondary" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Header Action Elements */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/favorites"
              aria-label="المفضلة"
              className="hidden sm:flex w-11 h-11 rounded-full bg-candy-soft hover:bg-candy-blush text-candy-rose items-center justify-center transition-all active:scale-95 border border-candy-line/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Heart className="w-5 h-5" />
            </Link>
            <Link
              href="/account"
              aria-label="حسابي"
              className="hidden sm:flex w-11 h-11 rounded-full bg-candy-soft hover:bg-candy-blush text-primary items-center justify-center transition-all active:scale-95 border border-candy-line/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <UserRound className="w-5 h-5" />
            </Link>
            {/* Desktop Search Bar */}
            <form onSubmit={submitSearch} className="hidden lg:flex items-center relative w-56 xl:w-64">
              <Search className="w-4 h-4 text-candy-muted absolute right-3.5 pointer-events-none" />
              <input
                type="search"
                placeholder="ابحث عن حلاك..."
                aria-label="البحث عن منتج"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full h-10 pr-9 pl-4 bg-candy-soft/80 hover:bg-candy-soft focus:bg-white text-candy-ink placeholder:text-candy-muted text-xs rounded-button border border-candy-line/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
              />
            </form>

            {/* Quick Track Pill (Desktop only) */}
            <Link
              href="/track"
              className="hidden sm:inline-flex md:hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-button bg-candy-soft text-primary hover:bg-candy-blush text-xs font-bold transition-colors shadow-sm"
            >
              <Truck className="w-4 h-4 text-secondary" />
              <span>تتبع طلبي</span>
            </Link>

            {/* Reactive Cart Button */}
            <Link
              href="/cart"
              aria-label={`سلة المشتريات (${internalCount} عناصر)`}
              className="relative w-11 h-11 rounded-full bg-candy-soft hover:bg-candy-blush text-primary flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm border border-candy-line/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ShoppingBag className="w-5 h-5 text-primary" />
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
        <form onSubmit={submitSearch} className="pb-3 md:hidden">
          <div className="relative flex items-center w-full">
            <Search className="w-4 h-4 text-candy-muted absolute right-3.5 pointer-events-none" />
            <input
              type="search"
              placeholder="ابحث عن حلاك المفضل..."
              aria-label="البحث عن منتج"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              enterKeyHint="search"
              className="w-full h-10 pr-9 pl-4 bg-candy-soft text-candy-ink placeholder:text-candy-muted text-xs rounded-candy-pill border border-candy-line/70 focus:outline-none focus:bg-white focus:ring-2 focus:ring-candy-strawberry/30 transition-all duration-200 shadow-sm"
            />
          </div>
        </form>
      </div>
    </header>
  );
}
