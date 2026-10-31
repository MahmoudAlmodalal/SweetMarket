"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ShoppingBag,
  Store,
  Compass,
  ArrowRight,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { getOrders, getOrderById, getDeliveryZones } from "@/lib/repositories";
import type { Order, DeliveryZone } from "@/types";
import { OrderSuccessCard } from "@/components/storefront/order/order-success-card";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params?: {
    orderNumber?: string;
  };
}

export default function CheckoutSuccessPage({ params: propParams }: PageProps) {
  const routerParams = useParams();
  const rawParam =
    (routerParams?.orderNumber as string) || propParams?.orderNumber || "";

  const orderNumber = React.useMemo(() => {
    try {
      return decodeURIComponent(rawParam).trim();
    } catch {
      return rawParam.trim();
    }
  }, [rawParam]);

  const { clearCart } = useCart();
  const hasClearedRef = React.useRef(false);

  // State
  const [order, setOrder] = React.useState<Order | null>(null);
  const [deliveryZone, setDeliveryZone] = React.useState<DeliveryZone | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // 1. Clears cart automatically upon initial render
  React.useEffect(() => {
    if (!hasClearedRef.current) {
      clearCart();
      hasClearedRef.current = true;
    }
  }, [clearCart]);

  // 2. Fetches order details by orderNumber from repository
  React.useEffect(() => {
    let isMounted = true;

    async function fetchOrderDetails() {
      if (!orderNumber) {
        if (isMounted) {
          setIsLoading(false);
          setErrorMessage("رقم الطلب غير متوفر في الرابط");
        }
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [ordersList, zonesList] = await Promise.all([
          getOrders(),
          getDeliveryZones(),
        ]);

        if (!isMounted) return;

        // Try lookup by orderNumber or ID
        const normalizedTarget = orderNumber.toUpperCase();
        let matchedOrder = ordersList.find(
          (o) =>
            o.orderNumber.trim().toUpperCase() === normalizedTarget ||
            o.id.trim() === orderNumber
        );

        // Fallback to getOrderById if not found in list
        if (!matchedOrder) {
          matchedOrder = (await getOrderById(orderNumber)) || undefined;
        }

        if (matchedOrder) {
          setOrder(matchedOrder);

          // Find zone info
          const matchedZone = zonesList.find(
            (z) => z.id === matchedOrder.customer.zoneId
          );
          setDeliveryZone(matchedZone || null);
        } else {
          setErrorMessage(`لم يتم العثور على طلب برقم: ${orderNumber}`);
        }
      } catch (err) {
        console.error("Failed to fetch order details:", err);
        if (isMounted) {
          setErrorMessage("حدث خطأ أثناء تحميل بيانات الطلب، يرجى إعادة المحاولة");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchOrderDetails();

    return () => {
      isMounted = false;
    };
  }, [orderNumber]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Loading Skeleton State */}
      {isLoading && (
        <div
          dir="rtl"
          className="w-full max-w-2xl mx-auto flex flex-col gap-6 py-4 animate-pulse"
        >
          {/* Header Card Skeleton */}
          <div className="bg-white border border-candy-line/80 rounded-candy-card p-8 flex flex-col items-center text-center shadow-candy-2 gap-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <Skeleton className="h-8 w-64 rounded-full" />
            <Skeleton className="h-4 w-80 max-w-full rounded-full" />
            <Skeleton className="h-10 w-48 rounded-candy-pill mt-2" />
          </div>

          {/* Items & Summary Card Skeleton */}
          <div className="bg-white border border-candy-line/80 rounded-candy-card p-6 shadow-candy-2 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-candy-line/60">
              <Skeleton className="h-6 w-40 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-14 h-14 rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36 rounded-full" />
                    <Skeleton className="h-3 w-24 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
            <div className="pt-4 border-t border-candy-line/60 space-y-2">
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-3/4 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Error / Not Found State */}
      {!isLoading && (!order || errorMessage) && (
        <div
          dir="rtl"
          className="w-full max-w-md mx-auto bg-white border border-candy-line rounded-candy-card p-6 sm:p-8 text-center shadow-candy-2"
        >
          <div className="w-16 h-16 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-candy-ink mb-2">
            لم نتمكن من العثور على الطلب
          </h2>
          <p className="font-sans text-sm text-candy-muted mb-6 leading-relaxed">
            {errorMessage ||
              `عذراً، لم نتمكن من العثور على تفاصيل الطلب برقم "${orderNumber}". يرجى التأكد من صحة الرابط أو التواصل مع خدمة العملاء.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 min-h-[46px] bg-candy-strawberry hover:bg-candy-berry text-white rounded-candy-pill font-sans font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <Store className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </Link>
            <Link
              href={orderNumber ? `/track?order=${encodeURIComponent(orderNumber)}` : "/track"}
              className="flex-1 min-h-[46px] bg-white border border-candy-line hover:bg-candy-soft text-candy-berry rounded-candy-pill font-sans font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Compass className="w-4 h-4" />
              <span>تتبع طلب آخر</span>
            </Link>
          </div>
        </div>
      )}

      {/* Success State */}
      {!isLoading && order && (
        <OrderSuccessCard order={order} deliveryZone={deliveryZone} />
      )}
    </div>
  );
}
