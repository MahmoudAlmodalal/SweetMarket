"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Heart,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStorageItem, STORAGE_KEYS } from "@/lib/storage";
import {
  getFavoriteProductIds,
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
      try {
        const ids = getFavoriteProductIds();
        setFavoriteCount(Array.isArray(ids) ? ids.length : 0);
      } catch {
        setFavoriteCount(0);
      }
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

  return (
    <header
      role="banner"
      className={cn(
        "sticky top-0 z-40 w-full bg-[#FFFAF8]/92 backdrop-blur-md border-b border-candy-line/70 transition-colors",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-[74px] gap-4">
          {/* Brand Logo */}
          <Link
            href="/"
            aria-label="الصفحة الرئيسية لمتجر كاندي لوز"
            className="flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry rounded-lg"
          >
            <StoreLogo
              variant="main"
              width={142}
              height={40}
              priority
              className="w-[116px] sm:w-[138px] md:w-[148px] transition-opacity hover:opacity-90"
            />
          </Link>

          {/* Center Editorial Navigation */}
          <nav
            aria-label="التنقل الرئيسي"
            className="hidden md:flex items-center gap-7 lg:gap-9"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.isActive ? "page" : undefined}
                className={cn(
                  "relative py-2 text-sm font-sans whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry rounded-sm",
                  link.isActive
                    ? "text-candy-berry font-bold"
                    : "text-candy-ink/75 font-medium hover:text-candy-ink"
                )}
              >
                <span>{link.label}</span>
                {link.isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 inset-x-0 h-[2px] rounded-full bg-candy-berry"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Left Actions: Search + Utility Icons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <form
              role="search"
              aria-label="بحث المتجر"
              onSubmit={onSubmitSearch}
              className="hidden lg:flex items-center relative w-52 xl:w-60 ml-1"
            >
              <Search className="w-4 h-4 text-candy-muted absolute right-3.5 pointer-events-none" />
              <input
                type="search"
                placeholder="ابحث عن صنف..."
                aria-label="البحث عن منتج"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                className="w-full h-10 pr-10 pl-3.5 bg-white text-candy-ink placeholder:text-candy-muted/80 text-xs rounded-xl border border-candy-line/80 focus:outline-none focus:border-candy-berry/50 focus:ring-2 focus:ring-candy-berry/15 transition-all"
              />
            </form>

            <Link
              href="/favorites"
              aria-label={favoriteCount > 0 ? `المفضلة (${favoriteCount} عناصر)` : "المفضلة"}
              className={cn(
                "relative flex w-10 h-10 rounded-xl border items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry",
                pathname === "/favorites"
                  ? "bg-candy-soft border-candy-berry/30 text-candy-berry"
                  : "bg-white border-candy-line/70 text-candy-ink/75 hover:text-candy-berry hover:border-candy-line"
              )}
            >
              <Heart className="w-[18px] h-[18px]" />
              {favoriteCount > 0 && (
                <span
                  aria-label={`${favoriteCount} عناصر في المفضلة`}
                  className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-candy-berry text-white font-sans text-[10px] font-bold tabular-nums flex items-center justify-center ring-2 ring-[#FFFAF8]"
                >
                  {favoriteCount > 99 ? "+99" : favoriteCount}
                </span>
              )}
            </Link>

            <Link
              href="/account"
              aria-label="حسابي"
              className={cn(
                "flex w-10 h-10 rounded-xl border items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry",
                pathname === "/account"
                  ? "bg-candy-soft border-candy-berry/30 text-candy-berry"
                  : "bg-white border-candy-line/70 text-candy-ink/75 hover:text-candy-berry hover:border-candy-line"
              )}
            >
              <UserRound className="w-[18px] h-[18px]" />
            </Link>

            <Link
              href="/cart"
              aria-label={`سلة المشتريات (${internalCount} عناصر)`}
              className={cn(
                "relative inline-flex items-center gap-2 h-10 px-3 sm:px-3.5 rounded-xl border font-sans text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry",
                internalCount > 0
                  ? "bg-candy-berry border-candy-berry text-white hover:bg-candy-berry-dark"
                  : "bg-white border-candy-line/70 text-candy-ink hover:border-candy-berry/40 hover:text-candy-berry"
              )}
            >
              <ShoppingBag className="w-[18px] h-[18px]" />
              <span className="hidden sm:inline">السلة</span>
              {internalCount > 0 && (
                <span
                  aria-label={`${internalCount} أصناف في السلة`}
                  className="min-w-[20px] h-5 px-1.5 rounded-md bg-white/20 text-white text-[11px] font-bold tabular-nums flex items-center justify-center"
                >
                  {internalCount > 99 ? "+99" : internalCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar Row (< 768px) */}
        <form
          role="search"
          aria-label="بحث المتجر للجوال"
          onSubmit={onSubmitSearch}
          className="pb-3 md:hidden"
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
              className="w-full h-10 pr-10 pl-4 bg-white text-candy-ink placeholder:text-candy-muted/80 text-xs rounded-xl border border-candy-line/80 focus:outline-none focus:border-candy-berry/50 focus:ring-2 focus:ring-candy-berry/15 transition-all"
            />
          </div>
        </form>
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
