"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingBag, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStorageItem, STORAGE_KEYS } from "@/lib/storage";
import type { CartItem } from "@/types";

export interface MobileDockProps {
  cartCount?: number;
  className?: string;
}

export function MobileDock({
  cartCount: propCartCount,
  className,
}: MobileDockProps) {
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
      href: "/cart",
      label: "السلة",
      icon: ShoppingBag,
      isActive: pathname === "/cart",
      badgeCount: internalCount,
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
      className={cn(
        "fixed bottom-3 inset-x-3 sm:inset-x-6 z-50 md:hidden pb-safe pointer-events-none",
        className
      )}
    >
      <nav
        aria-label="شريط التنقل السفلي للهاتف"
        className="pointer-events-auto mx-auto max-w-md h-16 px-2 bg-white/95 backdrop-blur-xl rounded-candy-pill border border-candy-line/70 shadow-candy-dock flex items-center justify-around"
      >
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isItemActive = item.isActive;
          const hasBadge = (item.badgeCount ?? 0) > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isItemActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center min-w-[62px] min-h-[48px] px-2.5 py-1 rounded-candy-pill transition-all duration-200 select-none",
                isItemActive
                  ? "bg-candy-strawberry text-white shadow-candy-cta scale-105"
                  : "text-candy-muted hover:text-[#800a40] active:scale-95"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isItemActive ? "text-white scale-110" : "text-candy-rose"
                  )}
                />
                {hasBadge && (
                  <span
                    aria-label={`${item.badgeCount} عناصر بالسلة`}
                    className={cn(
                      "absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full font-sans text-[10px] font-bold flex items-center justify-center shadow-sm",
                      isItemActive
                        ? "bg-white text-candy-strawberry border border-candy-strawberry/30"
                        : "bg-candy-strawberry text-white shadow-candy-cta"
                    )}
                  >
                    {(item.badgeCount ?? 0) > 99 ? "+99" : item.badgeCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "font-sans text-[11px] font-bold mt-0.5 leading-none",
                  isItemActive ? "text-white" : "text-candy-ink/90"
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
