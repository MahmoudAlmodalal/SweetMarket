"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingBag, Truck, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStorageItem, STORAGE_KEYS } from "@/lib/storage";
import {
  getFavoriteProductIds,
  FAVORITES_UPDATED_EVENT,
} from "@/components/storefront/catalog/wishlist-utils";
import type { CartItem } from "@/types";

export interface MobileDockProps {
  cartCount?: number;
  favoritesCount?: number;
  className?: string;
}

export function MobileDock({
  cartCount: propCartCount,
  favoritesCount: propFavoritesCount,
  className,
}: MobileDockProps) {
  const pathname = usePathname();
  const [internalCount, setInternalCount] = React.useState<number>(
    propCartCount ?? 0
  );
  const [favoriteCount, setFavoriteCount] = React.useState<number>(
    propFavoritesCount ?? 0
  );
  const [cartBouncing, setCartBouncing] = React.useState(false);
  const [favBouncing, setFavBouncing] = React.useState(false);

  const prevCartRef = React.useRef(internalCount);
  const prevFavRef = React.useRef(favoriteCount);

  React.useEffect(() => {
    if (prevCartRef.current !== internalCount && internalCount > 0) {
      setCartBouncing(true);
      const timer = setTimeout(() => setCartBouncing(false), 600);
      return () => clearTimeout(timer);
    }
    prevCartRef.current = internalCount;
  }, [internalCount]);

  React.useEffect(() => {
    if (prevFavRef.current !== favoriteCount && favoriteCount > 0) {
      setFavBouncing(true);
      const timer = setTimeout(() => setFavBouncing(false), 600);
      return () => clearTimeout(timer);
    }
    prevFavRef.current = favoriteCount;
  }, [favoriteCount]);

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

  const dockItems = [
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
      href: "/favorites",
      label: "المفضلة",
      icon: Heart,
      isActive: pathname === "/favorites",
      badgeCount: favoriteCount,
      badgeLabel: "عناصر في المفضلة",
    },
    {
      href: "/cart",
      label: "السلة",
      icon: ShoppingBag,
      isActive: pathname === "/cart",
      badgeCount: internalCount,
      badgeLabel: "عناصر بالسلة",
    },
    {
      href: "/track",
      label: "تتبع الطلب",
      icon: Truck,
      isActive: pathname === "/track",
    },
  ];

  return (
    <div
      data-mobile-dock
      className={cn(
        "fixed bottom-3 inset-x-2 sm:inset-x-6 z-50 md:hidden pointer-events-none transition-all duration-200",
        "[[data-capture-mode=true]_&]:relative [[data-capture-mode=true]_&]:bottom-auto [[data-capture-mode=true]_&]:inset-x-auto [[data-capture-mode=true]_&]:mt-auto [[data-capture-mode=true]_&]:mb-4",
        className
      )}
    >
      <nav
        role="navigation"
        aria-label="شريط التنقل السفلي للهاتف"
        className="pointer-events-auto mx-auto max-w-md min-h-[58px] px-2 pt-1 pb-[calc(0.35rem+env(safe-area-inset-bottom))] bg-[#F3EBDD] rounded-none border-2 border-candy-ink shadow-[4px_4px_0_#1B1A17] flex items-center justify-around"
      >
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isItemActive = item.isActive;
          const hasBadge = (item.badgeCount ?? 0) > 0;
          const isBouncing = item.href === "/cart" ? cartBouncing : item.href === "/favorites" ? favBouncing : false;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isItemActive ? "page" : undefined}
              className={cn(
                "group relative flex flex-col items-center justify-center min-w-[56px] sm:min-w-[64px] min-h-[48px] px-1 sm:px-2 py-1 rounded-none transition-all duration-200 select-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isItemActive
                  ? "bg-[#1B1A17] text-[#F2B632]"
                  : "text-candy-muted hover:text-primary hover:bg-candy-soft/70 active:scale-95"
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-200 ease-out",
                    isItemActive
                      ? "text-white scale-110 drop-shadow-sm"
                      : "text-secondary group-hover:scale-105"
                  )}
                />
                {hasBadge && (
                  <span
                    aria-label={`${item.badgeCount} ${item.badgeLabel || "عناصر"}`}
                    className={cn(
                      "absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-none font-sans text-[10px] font-bold flex items-center justify-center shadow-sm transition-transform duration-200",
                      isItemActive
                        ? "bg-candy-cream text-primary border border-primary/30"
                        : "bg-[#C2431F] text-white",
                      isBouncing && "scale-125 ring-2 ring-white animate-bounce"
                    )}
                  >
                    {(item.badgeCount ?? 0) > 99 ? "+99" : item.badgeCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "font-sans text-[10px] sm:text-[11px] font-bold mt-0.5 leading-none transition-colors",
                  isItemActive ? "text-white" : "text-candy-ink/90 group-hover:text-primary"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
