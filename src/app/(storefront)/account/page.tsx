"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package, Phone, ShoppingBag, UserRound } from "lucide-react";
import { MOCK_ORDERS } from "@/data/mock/orders";
import { STORAGE_KEYS, getStorageItem } from "@/lib/storage";
import type { CheckoutCustomerData } from "@/types";

export default function AccountPage() {
  const [draft, setDraft] = React.useState<Partial<CheckoutCustomerData>>({});
  React.useEffect(() => {
    setDraft(getStorageItem(STORAGE_KEYS.CHECKOUT_DRAFT, {} as Partial<CheckoutCustomerData>));
  }, []);

  const displayName = draft.fullName || "زائر كاندي لوز";
  const hasDetails = Boolean(draft.fullName || draft.phone || draft.streetAddress);

  return (
    <div dir="rtl" className="py-4 sm:py-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <nav aria-label="مسار التنقل" className="flex items-center gap-2 text-xs sm:text-sm text-candy-muted">
        <Link href="/" className="hover:text-candy-berry transition-colors">الرئيسية</Link>
        <ArrowRight className="w-3.5 h-3.5" />
        <span className="font-bold text-candy-berry">حسابي</span>
      </nav>

      <header className="rounded-candy-section bg-gradient-to-br from-candy-soft via-candy-blush/30 to-candy-pastel-2/30 border border-candy-blush p-5 sm:p-8 shadow-candy-1 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-white text-candy-berry flex items-center justify-center shadow-sm shrink-0"><UserRound className="w-7 h-7" /></div>
        <div>
          <p className="text-xs font-bold text-candy-strawberry mb-1">مساحتك الخاصة</p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-candy-berry">أهلاً بك، {displayName}</h1>
          <p className="text-xs sm:text-sm text-candy-muted mt-1">راجع بيانات التوصيل وطلباتك الأخيرة بسرعة.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        <section className="lg:col-span-7 rounded-candy-card bg-white border border-candy-line shadow-candy-1 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2"><UserRound className="w-5 h-5 text-candy-strawberry" /><h2 className="font-display font-bold text-lg text-candy-ink">بياناتي المحفوظة</h2></div>
            <span className="text-[11px] font-bold text-candy-muted bg-candy-soft rounded-candy-pill px-2.5 py-1">حساب زائر</span>
          </div>
          {hasDetails ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <InfoItem icon={<UserRound />} label="الاسم" value={draft.fullName || "غير مضاف"} />
              <InfoItem icon={<Phone />} label="الهاتف" value={draft.phone || "غير مضاف"} dir="ltr" />
              <InfoItem icon={<MapPin />} label="العنوان" value={draft.streetAddress || "غير مضاف"} className="sm:col-span-2" />
              {draft.buildingOrApt && <InfoItem icon={<MapPin />} label="تفاصيل إضافية" value={draft.buildingOrApt} className="sm:col-span-2" />}
            </div>
          ) : (
            <div className="rounded-2xl bg-candy-soft p-5 text-center"><p className="text-sm text-candy-muted mb-4">ستظهر بياناتك هنا بعد إتمام أول طلب.</p><Link href="/category/all" className="inline-flex min-h-11 items-center justify-center gap-2 px-5 rounded-candy-pill bg-candy-strawberry text-white text-sm font-bold">ابدأ التسوق</Link></div>
          )}
        </section>

        <section className="lg:col-span-5 rounded-candy-card bg-white border border-candy-line shadow-candy-1 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5"><Package className="w-5 h-5 text-candy-strawberry" /><h2 className="font-display font-bold text-lg text-candy-ink">طلباتك</h2></div>
          <div className="flex items-center justify-between rounded-2xl bg-candy-soft p-4 mb-4"><span className="text-sm text-candy-muted">طلبات تجريبية متاحة للتتبع</span><strong className="text-2xl text-candy-berry">{MOCK_ORDERS.length}</strong></div>
          <Link href="/track" className="w-full min-h-11 inline-flex items-center justify-center gap-2 rounded-candy-pill border-2 border-candy-blush text-candy-berry font-bold text-sm hover:bg-candy-soft transition-colors"><Package className="w-4 h-4" />تتبع طلب</Link>
        </section>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/favorites" className="rounded-2xl bg-white border border-candy-line p-4 flex items-center gap-3 hover:border-candy-rose hover:shadow-candy-1 transition-all"><Heart className="w-5 h-5 text-candy-strawberry" /><span className="font-bold text-sm text-candy-ink">فتح قائمة المفضلة</span></Link>
        <Link href="/cart" className="rounded-2xl bg-white border border-candy-line p-4 flex items-center gap-3 hover:border-candy-rose hover:shadow-candy-1 transition-all"><ShoppingBag className="w-5 h-5 text-candy-strawberry" /><span className="font-bold text-sm text-candy-ink">فتح سلة المشتريات</span></Link>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, dir, className = "" }: { icon: React.ReactNode; label: string; value: string; dir?: "ltr" | "rtl"; className?: string }) {
  return <div className={`rounded-2xl bg-candy-soft/70 border border-candy-line/60 p-3 ${className}`}><div className="flex items-center gap-1.5 text-xs text-candy-muted mb-1">{React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-3.5 h-3.5 text-candy-strawberry" })}<span>{label}</span></div><p dir={dir} className="font-bold text-sm text-candy-ink break-words">{value}</p></div>;
}
