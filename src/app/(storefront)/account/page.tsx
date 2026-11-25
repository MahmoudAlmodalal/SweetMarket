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
  Search,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Filter,
} from "lucide-react";
import { STORAGE_KEYS, getStorageItem, setStorageItem } from "@/lib/storage";
import {
  getCustomerOrderRefs,
  getOrderReceipt,
  getDeliveryZones,
} from "@/lib/repositories";
import { useCart } from "@/context/cart-context";
import { getFavoriteProductIds, FAVORITES_UPDATED_EVENT } from "@/components/storefront/catalog/wishlist-utils";
import { normalizePalestinianPhone, isValidPalestinianPhone } from "@/lib/validations";
import { ORDER_STATUS_LABELS, type Order, type OrderStatus, type CheckoutCustomerData, type DeliveryZone } from "@/types";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type StatusFilterType = "all" | OrderStatus;

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

  // Orders list and lookup
  const [allOrders, setAllOrders] = React.useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilterType>("all");
  const [expandedOrderId, setExpandedOrderId] = React.useState<string | null>(null);

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

  // Fetch ONLY this customer's own placed orders via scoped receipt tokens
  React.useEffect(() => {
    let active = true;
    async function loadAccountOrders() {
      setIsLoadingOrders(true);
      try {
        const savedRefs = getCustomerOrderRefs();
        if (savedRefs.length === 0) {
          if (active) setAllOrders([]);
          return;
        }
        const resolved = await Promise.all(
          savedRefs.map((ref) =>
            getOrderReceipt(ref.orderNumber, ref.trackingToken).catch(() => null)
          )
        );
        if (active) {
          setAllOrders(resolved.filter((o): o is Order => Boolean(o)));
        }
      } catch (err) {
        console.error("Failed to load account orders:", err);
      } finally {
        if (active) setIsLoadingOrders(false);
      }
    }

    void loadAccountOrders();
    return () => {
      active = false;
    };
  }, []);

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

  // Filtered orders based on search query (order # or phone) and status chips
  const filteredOrders = React.useMemo(() => {
    let result = allOrders;
    const query = searchQuery.trim().toLowerCase();

    if (query) {
      const cleanPhoneDigits = query.replace(/\D/g, "");
      result = result.filter((ord) => {
        const orderNumMatch = ord.orderNumber.toLowerCase().includes(query);
        const nameMatch = ord.customer.fullName.toLowerCase().includes(query);
        const rawPhone = ord.customer.phone || "";
        const phoneMatch = rawPhone.includes(query) || (cleanPhoneDigits.length >= 4 && rawPhone.includes(cleanPhoneDigits));

        let normPhoneMatch = false;
        if (isValidPalestinianPhone(rawPhone) && cleanPhoneDigits.length >= 7) {
          try {
            normPhoneMatch = normalizePalestinianPhone(rawPhone).includes(cleanPhoneDigits);
          } catch {
            normPhoneMatch = false;
          }
        }

        return orderNumMatch || nameMatch || phoneMatch || normPhoneMatch;
      });
    } else {
      // Default: if customer has saved phone, prioritize matching orders
      const profilePhone = profile.phone?.trim();
      if (profilePhone && isValidPalestinianPhone(profilePhone)) {
        try {
          const normProfilePhone = normalizePalestinianPhone(profilePhone);
          const matching = result.filter((ord) => {
            try {
              return normalizePalestinianPhone(ord.customer.phone) === normProfilePhone;
            } catch {
              return ord.customer.phone.trim() === profilePhone;
            }
          });
          if (matching.length > 0) {
            result = matching;
          } else {
            result = allOrders.slice(0, 4);
          }
        } catch {
          result = allOrders.slice(0, 4);
        }
      } else {
        result = allOrders.slice(0, 4);
      }
    }

    if (statusFilter !== "all") {
      result = result.filter((ord) => ord.status === statusFilter);
    }

    return result;
  }, [allOrders, searchQuery, statusFilter, profile.phone]);

  const displayName = profile.fullName || "زائر كاندي لوز";
  const hasDetails = Boolean(profile.fullName || profile.phone || profile.streetAddress);

  // Status Filter Definitions
  const statusOptions: { id: StatusFilterType; label: string }[] = [
    { id: "all", label: "جميع الطلبات" },
    { id: "new", label: "جديد" },
    { id: "accepted", label: "مقبول" },
    { id: "in_preparation", label: "قيد التجهيز" },
    { id: "out_for_delivery", label: "خرج للتوصيل" },
    { id: "delivered", label: "تم التسليم" },
    { id: "cancelled", label: "ملغي" },
  ];

  return (
    <div dir="rtl" className="py-4 sm:py-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav aria-label="مسار التنقل" className="flex items-center gap-2 text-xs sm:text-sm text-candy-muted">
        <Link href="/" className="hover:text-candy-berry transition-colors font-medium">
          الرئيسية
        </Link>
        <ArrowRight className="w-3.5 h-3.5" />
        <span className="font-bold text-candy-berry">حسابي</span>
      </nav>

      {/* Header Banner */}
      <header className="bg-[#F2B632] border-2 border-candy-ink shadow-[6px_6px_0_#1B1A17] rounded-none p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-candy-cream text-candy-berry flex items-center justify-center shadow-sm shrink-0 border border-candy-ink">
            <UserRound className="w-7 h-7 text-candy-strawberry" />
          </div>
          <div>
            <p className="text-xs font-bold text-candy-strawberry mb-1">مساحتك الخاصة (حساب زائر محلي)</p>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-candy-berry">
              أهلاً بك، {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-candy-muted mt-1">
              راجع بيانات التوصيل المحفوظة، وتتبع طلباتك السابقة بالبحث الفوري، وأعد طلب حلوياتك المفضلة بنقرة واحدة.
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
        <section className="lg:col-span-5 rounded-candy-card bg-candy-cream border border-candy-line shadow-candy-1 p-5 sm:p-6">
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
                تُملأ هذه البيانات تلقائياً في صفحة الشراء لراحتك وسرعة إتمام الطلب.
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

        {/* Orders List & Interactive Lookup Section */}
        <section className="lg:col-span-7 rounded-candy-card bg-candy-cream border border-candy-line shadow-candy-1 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-candy-strawberry" />
              <h2 className="font-display font-bold text-lg text-candy-ink">
                سجل الطلبات والاستعلام الفوري
              </h2>
            </div>
            <Link
              href="/track"
              className="text-xs font-bold font-sans text-candy-strawberry hover:underline flex items-center gap-1"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>تتبع مفصل برقم الطلب</span>
            </Link>
          </div>

          {/* Interactive Lookup Search Bar (Phone or Order Number) */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-candy-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث برقم الطلب (مثال: CL-1001) أو برقم الهاتف الخلوي..."
                className="w-full h-11 pr-10 pl-10 rounded-xl border border-candy-line bg-candy-soft/60 hover:bg-candy-soft text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-candy-strawberry/30 focus:border-candy-strawberry/50 transition-all"
                aria-label="البحث في سجل الطلبات برقم الطلب أو الهاتف"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-candy-muted hover:text-candy-berry transition-colors"
                  aria-label="مسح نص البحث"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Helper for Saved Phone */}
            {profile.phone && !searchQuery && (
              <div className="flex items-center justify-between text-xs text-candy-muted px-1">
                <span>يتم حالياً عرض الطلبات المقترنة برقم هاتفك المسجل.</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery(profile.phone || "")}
                  className="text-candy-strawberry font-bold hover:underline"
                >
                  تصفية برقم {profile.phone}
                </button>
              </div>
            )}

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs text-candy-muted font-bold ml-1 shrink-0 flex items-center gap-1">
                <Filter className="w-3 h-3 text-candy-muted" />
                الحالة:
              </span>
              {statusOptions.map((opt) => {
                const isActive = statusFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStatusFilter(opt.id)}
                    className={cn(
                      "px-3 py-1 rounded-candy-pill text-xs font-bold whitespace-nowrap transition-all border",
                      isActive
                        ? "bg-candy-berry text-white border-candy-berry shadow-xs"
                        : "bg-candy-soft text-candy-ink border-candy-line hover:bg-candy-blush/60"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders Results List */}
          {isLoadingOrders ? (
            <div className="space-y-3">
              <div className="h-24 bg-candy-soft animate-pulse rounded-2xl" />
              <div className="h-24 bg-candy-soft animate-pulse rounded-2xl" />
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-3.5">
              {filteredOrders.map((ord) => {
                const totalUnits = ord.items.reduce((s, it) => s + it.quantity, 0);
                const isExpanded = expandedOrderId === ord.id;

                return (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl border border-candy-line/80 bg-candy-soft/30 hover:bg-candy-soft/60 transition-all space-y-3"
                  >
                    {/* Header Row: Order Number + Status Chip */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm sm:text-base text-candy-berry" dir="ltr">
                          {ord.orderNumber}
                        </span>

                        {/* Status Chip Badge */}
                        <OrderStatusChip status={ord.status} />

                        {ord.createdAt && (
                          <span className="text-[11px] text-candy-muted flex items-center gap-1">
                            <Clock className="w-3 h-3 text-candy-muted" />
                            {new Date(ord.createdAt).toLocaleDateString("ar-EG", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>

                      {/* Total Price */}
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-candy-muted font-sans ml-1.5">الإجمالي:</span>
                        <strong className="text-candy-ink font-mono font-bold text-sm sm:text-base">
                          {ord.total.toFixed(2)} ₪
                        </strong>
                      </div>
                    </div>

                    {/* Customer & Items Brief Summary */}
                    <div className="flex items-center justify-between text-xs text-candy-muted font-sans flex-wrap gap-2 pt-1 border-t border-candy-line/40">
                      <span>
                        {ord.items.length} أصناف ({totalUnits} قطعة) • العميل:{" "}
                        <strong className="text-candy-ink font-semibold">{ord.customer.fullName}</strong>
                      </span>

                      {/* Expand / Collapse Details Button */}
                      <button
                        type="button"
                        onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                        className="inline-flex items-center gap-1 text-candy-strawberry font-bold hover:underline"
                        aria-expanded={isExpanded}
                      >
                        <span>{isExpanded ? "إخفاء التفاصيل" : "عرض الأصناف"}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Expandable Order Items Breakdown */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-candy-line/50 space-y-2 animate-in fade-in-50 duration-150">
                        <div className="bg-white/80 rounded-xl p-3 border border-candy-line/60 space-y-2">
                          <p className="text-[11px] font-bold text-candy-berry">محتويات الطلبية:</p>
                          <ul className="divide-y divide-candy-line/40 text-xs">
                            {ord.items.map((item, idx) => (
                              <li key={idx} className="py-1.5 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-candy-strawberry" />
                                  <span className="font-bold text-candy-ink">{item.productName}</span>
                                  {item.selectedWeightLabel && (
                                    <span className="text-[10px] text-candy-muted bg-candy-soft px-1.5 py-0.5 rounded">
                                      {item.selectedWeightLabel}
                                    </span>
                                  )}
                                  {item.packagingLabel && (
                                    <span className="text-[10px] text-candy-berry bg-candy-blush/60 px-1.5 py-0.5 rounded">
                                      {item.packagingLabel}
                                    </span>
                                  )}
                                  <span className="text-candy-muted font-mono">× {item.quantity}</span>
                                </div>
                                <span className="font-mono font-bold text-candy-ink">{item.lineTotal.toFixed(2)} ₪</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons: Re-order & Track */}
                    <div className="flex items-center justify-end gap-2 pt-1">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-candy-pill bg-candy-cream border border-candy-line hover:border-candy-berry text-candy-berry text-xs font-bold shadow-xs transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5 text-candy-strawberry" />
                        <span>تتبع الطلب</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-candy-soft p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center mx-auto">
                <Search className="w-6 h-6 text-candy-berry" />
              </div>
              <h3 className="font-display font-bold text-base text-candy-berry">
                لم يتم العثور على طلبات مطابقة
              </h3>
              <p className="text-xs sm:text-sm text-candy-muted max-w-sm mx-auto">
                {searchQuery
                  ? "تحقق من صحة رقم الطلب أو رقم الهاتف الخلوي المدخل، أو قم بإعادة ضبط البحث."
                  : "لا توجد طلبات مسجلة بهذه الحالة بعد."}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-candy-pill bg-candy-cream border border-candy-line hover:border-candy-berry text-candy-berry text-xs font-bold transition-all shadow-xs"
                >
                  <span>إعادة ضبط البحث وعرض الكل</span>
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Live Counts Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/favorites"
          className="rounded-2xl bg-candy-cream border border-candy-line p-4 flex items-center justify-between hover:border-candy-rose hover:shadow-candy-1 transition-all group"
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
          className="rounded-2xl bg-candy-cream border border-candy-line p-4 flex items-center justify-between hover:border-candy-rose hover:shadow-candy-1 transition-all group"
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

/**
 * Status Chip with Distinctive Confectionery Palette & Visual Icons
 */
function OrderStatusChip({ status }: { status: OrderStatus }) {
  switch (status) {
    case "delivered":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-candy-pill text-[11px] font-bold font-sans bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>{ORDER_STATUS_LABELS[status]}</span>
        </span>
      );
    case "out_for_delivery":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-candy-pill text-[11px] font-bold font-sans bg-indigo-100 text-indigo-800 border border-indigo-200">
          <Truck className="w-3 h-3 text-indigo-600" />
          <span>{ORDER_STATUS_LABELS[status]}</span>
        </span>
      );
    case "in_preparation":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-candy-pill text-[11px] font-bold font-sans bg-amber-100 text-amber-900 border border-amber-200">
          <Sparkles className="w-3 h-3 text-amber-600" />
          <span>{ORDER_STATUS_LABELS[status]}</span>
        </span>
      );
    case "accepted":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-candy-pill text-[11px] font-bold font-sans bg-sky-100 text-sky-800 border border-sky-200">
          <Check className="w-3 h-3 text-sky-600" />
          <span>{ORDER_STATUS_LABELS[status]}</span>
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-candy-pill text-[11px] font-bold font-sans bg-rose-100 text-rose-800 border border-rose-200">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>{ORDER_STATUS_LABELS[status]}</span>
        </span>
      );
    case "undelivered":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-candy-pill text-[11px] font-bold font-sans bg-orange-100 text-orange-800 border border-orange-200">
          <AlertCircle className="w-3 h-3 text-orange-600" />
          <span>{ORDER_STATUS_LABELS[status]}</span>
        </span>
      );
    case "new":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-candy-pill text-[11px] font-bold font-sans bg-candy-blush text-candy-berry border border-candy-line">
          <Clock className="w-3 h-3 text-candy-strawberry" />
          <span>{ORDER_STATUS_LABELS[status] || "جديد"}</span>
        </span>
      );
  }
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
