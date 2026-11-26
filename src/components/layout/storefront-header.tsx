"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Heart,
  UserRound,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StoreStatusBadge } from "@/components/storefront/home/store-status-badge";
import { getStorageItem, STORAGE_KEYS } from "@/lib/storage";
import {
  getResolvedFavoritesCount,
  FAVORITES_UPDATED_EVENT,
} from "@/components/storefront/catalog/wishlist-utils";
import { StoreLogo } from "@/components/ui/store-logo";
import type { CartItem } from "@/types";

export interface StorefrontHeaderProps {
  cartCount?: number;
  favoritesCount?: number;
  className?: string;
}

interface StorefrontHeaderUIProps extends StorefrontHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSubmitSearch: (event: React.FormEvent<HTMLFormElement>) => void;
}

function StorefrontHeaderUI({
  cartCount: propCartCount,
  favoritesCount: propFavoritesCount,
  className,
  searchQuery,
  onSearchChange,
  onSubmitSearch,
}: StorefrontHeaderUIProps) {
  const pathname = usePathname();
  const [internalCount, setInternalCount] = React.useState<number>(
    propCartCount ?? 0
  );
  const [favoriteCount, setFavoriteCount] = React.useState<number>(
    propFavoritesCount ?? 0
  );

  React.useEffect(() => {
    if (typeof propFavoritesCount === "number") {
      setFavoriteCount(propFavoritesCount);
      return;
    }

    const syncFavorites = () => {
      // Resolved against the public catalog so the badge matches the favorites page
      // (saved IDs are never pruned; archived products are excluded from the count).
      void getResolvedFavoritesCount().then(setFavoriteCount);
    };

    syncFavorites();
    window.addEventListener(FAVORITES_UPDATED_EVENT, syncFavorites);
    window.addEventListener("candy_favorites_updated", syncFavorites);
    window.addEventListener("storage", syncFavorites);

    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, syncFavorites);
      window.removeEventListener("candy_favorites_updated", syncFavorites);
      window.removeEventListener("storage", syncFavorites);
    };
  }, [propFavoritesCount]);

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
    { href: "/", label: "الرئيسية", isActive: pathname === "/" },
    {
      href: "/category/all",
      label: "التشكيلة",
      isActive: pathname.startsWith("/category") || pathname.startsWith("/product"),
    },
    { href: "/track", label: "تتبع الطلب", isActive: pathname === "/track" },
    { href: "/contact", label: "من نحن", isActive: pathname === "/contact" },
  ];

  const iconBtn = (active: boolean) =>
    cn(
      "relative flex w-10 h-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry",
      active ? "bg-candy-soft text-candy-berry" : "text-candy-ink hover:bg-candy-soft hover:text-candy-berry"
    );

  return (
    <header role="banner" className={cn("sticky top-0 z-40 w-full bg-background", className)}>
      {/* Announcement strip */}
      <div className="bg-candy-soft border-b border-candy-line text-candy-plum">
        <p className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 min-h-[40px] py-2 flex items-center justify-center gap-2.5 sm:gap-4 text-[13px] sm:text-[13.5px] font-medium text-center leading-snug whitespace-nowrap">
          <Truck className="w-4 h-4 text-candy-berry shrink-0" aria-hidden="true" />
          <span className="sm:hidden">توصيل مبرد</span>
          <span className="hidden sm:inline">توصيل مبرد لكافة المناطق المعتمدة</span>
          <span className="text-candy-berry/60" aria-hidden="true">|</span>
          <span>الدفع نقداً عند الاستلام</span>
          <span className="text-candy-berry/60 hidden sm:inline" aria-hidden="true">|</span>
          <StoreStatusBadge className="hidden sm:inline-flex" />
        </p>
      </div>

      <div className="border-b border-candy-line bg-background">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center h-[84px] md:h-[104px] gap-3">
            {/* Right (RTL start): search on desktop, nothing on mobile */}
            <form
              role="search"
              aria-label="بحث المتجر"
              onSubmit={onSubmitSearch}
              className="hidden md:flex items-center relative max-w-[260px]"
            >
              <Search className="w-4 h-4 text-candy-muted absolute right-3 pointer-events-none" />
              <input
                type="search"
                placeholder="ابحث عن صنف..."
                aria-label="البحث عن منتج"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                className="w-full h-10 pr-9 pl-3 bg-transparent text-candy-ink placeholder:text-candy-muted text-[13px] border-0 border-b border-candy-line-dark rounded-none focus:outline-none focus:border-candy-berry transition-colors"
              />
            </form>
            <div className="md:hidden" aria-hidden="true" />

            {/* Center: logo */}
            <Link
              href="/"
              aria-label="الصفحة الرئيسية لمتجر كاندي لوز"
              className="justify-self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry rounded-[4px]"
            >
              <StoreLogo variant="main" height={56} />
            </Link>

            {/* Left (RTL end): utilities */}
            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
              <Link
                href="/favorites"
                aria-label={favoriteCount > 0 ? `المفضلة (${favoriteCount} عناصر)` : "المفضلة"}
                className={iconBtn(pathname === "/favorites")}
              >
                <Heart className="w-[19px] h-[19px]" />
                {favoriteCount > 0 && (
                  <span
                    aria-label={`${favoriteCount} عناصر في المفضلة`}
                    className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-candy-berry text-white font-sans text-[10px] font-bold tabular-nums flex items-center justify-center"
                  >
                    {favoriteCount > 99 ? "+99" : favoriteCount}
                  </span>
                )}
              </Link>
              <Link href="/account" aria-label="حسابي" className={iconBtn(pathname === "/account")}>
                <UserRound className="w-[19px] h-[19px]" />
              </Link>
              <Link
                href="/cart"
                aria-label={`سلة المشتريات (${internalCount} عناصر)`}
                className={cn(
                  "relative inline-flex items-center gap-2 h-10 px-3 sm:px-4 ms-1 rounded-button border font-sans text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry",
                  internalCount > 0
                    ? "bg-candy-berry border-candy-berry text-white hover:bg-candy-berry-dark"
                    : "border-candy-ink text-candy-ink hover:bg-candy-ink hover:text-white"
                )}
              >
                <ShoppingBag className="w-[17px] h-[17px]" />
                <span className="hidden sm:inline">السلة</span>
                {internalCount > 0 && (
                  <span
                    aria-label={`${internalCount} أصناف في السلة`}
                    className="min-w-[18px] h-[18px] px-1 rounded-full bg-white text-candy-berry text-[11px] font-bold tabular-nums flex items-center justify-center"
                  >
                    {internalCount > 99 ? "+99" : internalCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Desktop navigation row */}
          <nav
            aria-label="التنقل الرئيسي"
            className="hidden md:flex items-center justify-center gap-12 h-12 border-t border-candy-line"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.isActive ? "page" : undefined}
                className={cn(
                  "relative h-full inline-flex items-center text-[13.5px] font-sans whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry",
                  link.isActive ? "text-candy-berry font-semibold" : "text-candy-ink font-normal hover:text-candy-berry"
                )}
              >
                <span>{link.label}</span>
                {link.isActive && (
                  <span aria-hidden="true" className="absolute -bottom-px inset-x-0 h-[2px] bg-candy-berry" />
                )}
              </Link>
            ))}
          </nav>

          {/* Mobile search row */}
          <form
            role="search"
            aria-label="بحث المتجر للجوال"
            onSubmit={onSubmitSearch}
            className="pb-4 md:hidden"
          >
            <div className="relative flex items-center w-full">
              <Search className="w-4 h-4 text-candy-muted absolute right-3.5 pointer-events-none" />
              <input
                type="search"
                placeholder="ابحث عن بقلاوة، كنافة، كيك..."
                aria-label="البحث عن منتج"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                enterKeyHint="search"
                className="w-full h-10 pr-10 pl-4 bg-white text-candy-ink placeholder:text-candy-muted text-[13px] rounded-input border border-candy-line focus:outline-none focus:border-candy-berry transition-colors"
              />
            </div>
          </form>
        </div>
      </div>
    </header>
  );
}

function StorefrontHeaderConnected(props: StorefrontHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeQ = searchParams?.get("q") ?? "";

  const [searchQuery, setSearchQuery] = React.useState(activeQ);

  React.useEffect(() => {
    setSearchQuery(activeQ);
  }, [activeQ]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    const isCategoryRoute =
      pathname === "/category" || pathname.startsWith("/category/");

    if (isCategoryRoute) {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    } else {
      router.push(
        query ? `/category/all?q=${encodeURIComponent(query)}` : "/category/all"
      );
    }
  };

  return (
    <StorefrontHeaderUI
      {...props}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSubmitSearch={submitSearch}
    />
  );
}

function StorefrontHeaderFallback(props: StorefrontHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    const isCategoryRoute =
      pathname === "/category" || pathname.startsWith("/category/");

    if (isCategoryRoute) {
      router.push(query ? `${pathname}?q=${encodeURIComponent(query)}` : pathname);
    } else {
      router.push(
        query ? `/category/all?q=${encodeURIComponent(query)}` : "/category/all"
      );
    }
  };

  return (
    <StorefrontHeaderUI
      {...props}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSubmitSearch={submitSearch}
    />
  );
}

export function StorefrontHeader(props: StorefrontHeaderProps) {
  return (
    <React.Suspense fallback={<StorefrontHeaderFallback {...props} />}>
      <StorefrontHeaderConnected {...props} />
    </React.Suspense>
  );
}
