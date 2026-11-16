"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Heart,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  UserRound,
  Truck,
  RotateCcw,
  Check,
  Save,
  Clock,
  Sparkles,
} from "lucide-react";
import { STORAGE_KEYS, getStorageItem, setStorageItem } from "@/lib/storage";
import { getOrders, getDeliveryZones, getProducts } from "@/lib/repositories";
import { useCart } from "@/context/cart-context";
import { getFavoriteProductIds, FAVORITES_UPDATED_EVENT } from "@/components/storefront/catalog/wishlist-utils";
import { normalizePalestinianPhone, isValidPalestinianPhone } from "@/lib/validations";
import { ORDER_STATUS_LABELS, type Order, type CheckoutCustomerData, type DeliveryZone } from "@/types";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function AccountPage() {
  const router = useRouter();
  const { restoreCartItems, totalUnitsCount } = useCart();

  // Profile fields
  const [profile, setProfile] = React.useState<Partial<CheckoutCustomerData>>({});
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [streetAddress, setStreetAddress] = React.useState("");
  const [buildingOrApt, setBuildingOrApt] = React.useState("");
  const [zoneId, setZoneId] = React.useState("");
  const [zones, setZones] = React.useState<DeliveryZone[]>([]);

  // Orders list
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = React.useState(true);

  // Live Counts
  const [favoritesCount, setFavoritesCount] = React.useState(0);

  // Load initial profile, zones, and live counts
  React.useEffect(() => {
    const savedProfile =
      getStorageItem(STORAGE_KEYS.CUSTOMER_PROFILE) ||
      getStorageItem(STORAGE_KEYS.CHECKOUT_DRAFT, {} as Partial<CheckoutCustomerData>);

    if (savedProfile) {
      setProfile(savedProfile);
      setFullName(savedProfile.fullName || "");
      setPhone(savedProfile.phone || "");
      setStreetAddress(savedProfile.streetAddress || "");
      setBuildingOrApt(savedProfile.buildingOrApt || "");
      setZoneId(savedProfile.zoneId || "");
    }

    getDeliveryZones().then(setZones).catch(console.error);

    // Sync favorites count
    const syncFavs = () => {
      try {
        const ids = getFavoriteProductIds();
        setFavoritesCount(Array.isArray(ids) ? ids.length : 0);
      } catch {
        setFavoritesCount(0);
      }
    };
    syncFavs();
    window.addEventListener(FAVORITES_UPDATED_EVENT, syncFavs);
    window.addEventListener("storage", syncFavs);

    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, syncFavs);
      window.removeEventListener("storage", syncFavs);
    };
  }, []);

  // Fetch orders matching profile phone or fallback to mock/recent orders
  React.useEffect(() => {
    async function loadAccountOrders() {
      setIsLoadingOrders(true);
      try {
        const allOrders = await getOrders();
        const profilePhone = profile.phone?.trim();

        if (profilePhone && isValidPalestinianPhone(profilePhone)) {
          const normProfilePhone = normalizePalestinianPhone(profilePhone);
          const matching = allOrders.filter((ord) => {
            try {
              return normalizePalestinianPhone(ord.customer.phone) === normProfilePhone;
            } catch {
              return ord.customer.phone.trim() === profilePhone;
            }
          });
          // If no matching orders yet, show demo orders so page is never barren
          setOrders(matching.length > 0 ? matching : allOrders.slice(0, 4));
        } else {
          setOrders(allOrders.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to load account orders:", err);
      } finally {
        setIsLoadingOrders(false);
      }
    }

    loadAccountOrders();
  }, [profile.phone]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Partial<CheckoutCustomerData> = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      streetAddress: streetAddress.trim(),
      buildingOrApt: buildingOrApt.trim(),
      zoneId: zoneId.trim(),
    };

    setStorageItem(STORAGE_KEYS.CUSTOMER_PROFILE, updated);
    // Also sync checkout draft
    setStorageItem(STORAGE_KEYS.CHECKOUT_DRAFT, updated);
    setProfile(updated);
    setIsEditingProfile(false);
    toast.success("تم حفظ بيانات التوصيل", "سيتم استخدام هذه البيانات تلقائياً عند إتمام الطلب القادم.");
  };

  const handleReOrder = (order: Order) => {
    try {
      const cartItemsToRestore = order.items.map((item) => ({
        id: `${item.productId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: item.productId,
        productName: item.productName,
        productSlug: item.productSlug,
        unitPrice: item.unitPrice,
        unit: (item.unit || "box") as any,
        quantity: item.quantity,
        selectedWeightMultiplier: item.selectedWeightMultiplier,
        selectedWeightLabel: item.selectedWeightLabel,
        packagingOptionId: item.packagingOptionId || "standard",
        packagingLabel: item.packagingLabel || "تغليف قياسي مجاني",
        packagingFee: item.packagingFee || 0,
        giftMessage: item.giftMessage || "",
        imageUrl: item.imageUrl,
        lineTotal: item.lineTotal,
      }));

      restoreCartItems(cartItemsToRestore);
      const totalCount = order.items.reduce((sum, it) => sum + it.quantity, 0);

      toast.success(
        "تمت استعادة محتويات الطلب",
        `تمت إضافة ${totalCount} قطعة إلى سلة المشتريات بنجاح.`
      );
      router.push("/cart");
    } catch (err) {
      console.error("Failed to re-order:", err);
      toast.error("تعذر إعادة الطلب", "يرجى المحاولة مجدداً.");
    }
  };

  const displayName = profile.fullName || "زائر كاندي لوز";
  const hasDetails = Boolean(profile.fullName || profile.phone || profile.streetAddress);

  return (
    <div dir="rtl" className="py-4 sm:py-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav aria-label="مسار التنقل" className="flex items-center gap-2 text-xs sm:text-sm text-candy-muted">
        <Link href="/" className="hover:text-candy-berry transition-colors">
          الرئيسية
        </Link>
        <ArrowRight className="w-3.5 h-3.5" />
        <span className="font-bold text-candy-berry">حسابي</span>
      </nav>

      {/* Header Banner */}
      <header className="rounded-candy-section bg-gradient-to-br from-candy-soft via-candy-blush/30 to-candy-pastel-2/30 border border-candy-blush p-5 sm:p-8 shadow-candy-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white text-candy-berry flex items-center justify-center shadow-sm shrink-0">
            <UserRound className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-candy-strawberry mb-1">مساحتك الخاصة (حساب زائر محلي)</p>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-candy-berry">
              أهلاً بك، {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-candy-muted mt-1">
              راجع بيانات التوصيل المحفوظة وتتبع طلباتك السابقة وأعد طلب حلوياتك المفضلة بنقرة واحدة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-candy-pill bg-white/90 border border-candy-line text-xs font-bold text-candy-berry shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-candy-strawberry" />
            بدون كلمة مرور
          </span>
        </div>
      </header>

      {/* Main Grid: Profile & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Saved Delivery Profile Section */}
        <section className="lg:col-span-5 rounded-candy-card bg-white border border-candy-line shadow-candy-1 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <UserRound className="w-5 h-5 text-candy-strawberry" />
              <h2 className="font-display font-bold text-lg text-candy-ink">
                بيانات التوصيل المحفوظة
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingProfile((prev) => !prev)}
              className="text-xs font-bold font-sans text-candy-strawberry hover:underline"
            >
              {isEditingProfile ? "إلغاء التعديل" : "تعديل البيانات"}
            </button>
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="الاسم الكامل"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: أحمد خليل"
                required
              />
              <Input
                label="رقم الهاتف الخلوي"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0599123456"
                dir="ltr"
                required
              />
              <div>
                <label className="block text-xs font-bold text-candy-ink mb-1.5 font-sans">
                  منطقة التوصيل
                </label>
                <select
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-candy-line bg-candy-soft text-sm font-sans focus:outline-none focus:ring-2 focus:ring-candy-strawberry/30"
                >
                  <option value="">اختر المنطقة...</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.deliveryFee === 0 ? "توصيل مجاني" : `${z.deliveryFee} ₪`})
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="الشارع والمعالم القريبة"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="مثال: شارع النصر، عمارة الأمل"
                required
              />
              <Input
                label="تفاصيل البناية أو الشقة (اختياري)"
                value={buildingOrApt}
                onChange={(e) => setBuildingOrApt(e.target.value)}
                placeholder="مثال: الطابق الثاني - شقة 4"
              />

              <div className="pt-2 flex items-center gap-2">
                <Button type="submit" variant="primary" size="md" className="flex-1">
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setIsEditingProfile(false)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          ) : hasDetails ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <InfoItem icon={<UserRound />} label="الاسم" value={profile.fullName || "غير مضاف"} />
                <InfoItem icon={<Phone />} label="الهاتف" value={profile.phone || "غير مضاف"} dir="ltr" />
                <InfoItem
                  icon={<MapPin />}
                  label="العنوان"
                  value={profile.streetAddress || "غير مضاف"}
                  className="sm:col-span-2"
                />
                {profile.buildingOrApt && (
                  <InfoItem
                    icon={<MapPin />}
                    label="تفاصيل إضافية"
                    value={profile.buildingOrApt}
                    className="sm:col-span-2"
                  />
                )}
              </div>
              <p className="text-xs text-candy-muted font-sans pt-2">
                تُملأ هذه البيانات تلقائياً في صفحة الشراء لراحتك.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-candy-soft p-5 text-center">
              <p className="text-sm text-candy-muted mb-4">
                لم تقم بحفظ بيانات توصيل بعد. احفظ بياناتك الآن لتسريع عملية الشراء.
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsEditingProfile(true)}
              >
                إضافة بيانات التوصيل
              </Button>
            </div>
          )}
        </section>

        {/* Orders List & Re-Order Section */}
        <section className="lg:col-span-7 rounded-candy-card bg-white border border-candy-line shadow-candy-1 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-candy-strawberry" />
              <h2 className="font-display font-bold text-lg text-candy-ink">
                سجل الطلبات وإعادة الطلب
              </h2>
            </div>
            <Link
              href="/track"
              className="text-xs font-bold font-sans text-candy-strawberry hover:underline flex items-center gap-1"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>تتبع برقم آخر</span>
            </Link>
          </div>

          {isLoadingOrders ? (
            <div className="space-y-3">
              <div className="h-20 bg-candy-soft animate-pulse rounded-2xl" />
              <div className="h-20 bg-candy-soft animate-pulse rounded-2xl" />
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-3.5">
              {orders.map((ord) => {
                const totalUnits = ord.items.reduce((s, it) => s + it.quantity, 0);
                return (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl border border-candy-line/80 bg-candy-soft/30 hover:bg-candy-soft/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-candy-berry" dir="ltr">
                          {ord.orderNumber}
                        </span>
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-candy-pill text-[11px] font-bold font-sans",
                            ord.status === "delivered" && "bg-emerald-100 text-emerald-800",
                            ord.status === "cancelled" && "bg-rose-100 text-rose-800",
                            ord.status === "in_preparation" && "bg-amber-100 text-amber-800",
                            ord.status !== "delivered" &&
                              ord.status !== "cancelled" &&
                              ord.status !== "in_preparation" &&
                              "bg-candy-blush text-candy-berry"
                          )}
                        >
                          {ORDER_STATUS_LABELS[ord.status]}
                        </span>
                      </div>
                      <p className="text-xs text-candy-muted font-sans">
                        {ord.items.length} أصناف ({totalUnits} قطعة) • الإجمالي:{" "}
                        <strong className="text-candy-ink font-mono">{ord.total.toFixed(2)} ₪</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReOrder(ord)}
                        className="text-xs font-bold"
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        <span>إعادة الطلب</span>
                      </Button>
                      <Link
                        href={`/track?order=${encodeURIComponent(ord.orderNumber)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-candy-pill bg-white border border-candy-line hover:border-candy-berry text-candy-berry text-xs font-bold shadow-xs transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>تتبع</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-candy-soft p-5 text-center">
              <p className="text-sm text-candy-muted mb-4">
                لا توجد طلبات مسجلة برقم هاتفك الحالي بعد.
              </p>
              <Link
                href="/category/all"
                className="inline-flex min-h-11 items-center justify-center gap-2 px-5 rounded-candy-pill bg-candy-strawberry text-white text-sm font-bold shadow-candy-cta"
              >
                تصفح الحلويات واطلب الآن
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* Live Counts Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/favorites"
          className="rounded-2xl bg-white border border-candy-line p-4 flex items-center justify-between hover:border-candy-rose hover:shadow-candy-1 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-candy-blush text-candy-strawberry flex items-center justify-center group-hover:scale-110 transition-transform">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-candy-ink block">قائمة المفضلة</span>
              <span className="text-xs text-candy-muted font-sans">
                {favoritesCount > 0 ? `${favoritesCount} منتج محفوظ` : "لا توجد عناصر محفوظة"}
              </span>
            </div>
          </div>
          {favoritesCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-candy-strawberry text-white text-xs font-bold font-sans">
              {favoritesCount}
            </span>
          )}
        </Link>

        <Link
          href="/cart"
          className="rounded-2xl bg-white border border-candy-line p-4 flex items-center justify-between hover:border-candy-rose hover:shadow-candy-1 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-candy-soft text-candy-berry flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-candy-ink block">سلة المشتريات</span>
              <span className="text-xs text-candy-muted font-sans">
                {totalUnitsCount > 0 ? `${totalUnitsCount} وحدة مضافة` : "السلة فارغة"}
              </span>
            </div>
          </div>
          {totalUnitsCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-candy-berry text-white text-xs font-bold font-sans">
              {totalUnitsCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
  dir,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-candy-soft/70 border border-candy-line/60 p-3 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs text-candy-muted mb-1">
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
          className: "w-3.5 h-3.5 text-candy-strawberry",
        })}
        <span>{label}</span>
      </div>
      <p dir={dir} className="font-bold text-sm text-candy-ink break-words">
        {value}
      </p>
    </div>
  );
}
