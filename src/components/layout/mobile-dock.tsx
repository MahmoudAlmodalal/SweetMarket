"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingBag, Truck, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStorageItem, STORAGE_KEYS } from "@/lib/storage";
import {
  getResolvedFavoritesCount,
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
        "fixed bottom-0 inset-x-0 z-50 md:hidden pointer-events-none transition-all duration-200",
        "[[data-capture-mode=true]_&]:relative [[data-capture-mode=true]_&]:bottom-auto [[data-capture-mode=true]_&]:inset-x-auto [[data-capture-mode=true]_&]:mt-auto [[data-capture-mode=true]_&]:mb-4",
        className
      )}
    >
      <nav
        role="navigation"
        aria-label="شريط التنقل السفلي للهاتف"
        className="pointer-events-auto w-full min-h-[60px] px-1 pb-[env(safe-area-inset-bottom)] bg-white border-t border-candy-line flex items-stretch justify-around"
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
                "group relative flex flex-1 flex-col items-center justify-center min-h-[56px] px-1 py-1 transition-colors duration-200 select-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isItemActive
                  ? "text-primary before:absolute before:top-0 before:inset-x-3 before:h-[3px] before:bg-primary"
                  : "text-candy-muted hover:text-primary"
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-200 ease-out",
                    isItemActive ? "text-primary" : "text-candy-ink"
                  )}
                />
                {hasBadge && (
                  <span
                    aria-label={`${item.badgeCount} ${item.badgeLabel || "عناصر"}`}
                    className={cn(
                      "absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full font-sans text-[10px] font-bold flex items-center justify-center shadow-sm transition-transform duration-200",
                      isItemActive
                        ? "bg-primary text-white"
                        : "bg-primary text-white",
                      isBouncing && "scale-125 ring-2 ring-white animate-bounce"
                    )}
                  >
                    {(item.badgeCount ?? 0) > 99 ? "+99" : item.badgeCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "font-sans text-[10.5px] mt-1 leading-none transition-colors",
                  isItemActive ? "text-primary font-semibold" : "text-candy-ink font-normal group-hover:text-primary"
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
