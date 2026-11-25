"use client";

import * as React from "react";
import {
  MapPin,
  Building,
  FileText,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Navigation,
} from "lucide-react";
import type { DeliveryZone } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DeliveryAddressFormProps {
  zones: DeliveryZone[];
  selectedZoneId: string;
  onZoneChange: (zoneId: string) => void;
  streetAddress: string;
  onStreetAddressChange: (value: string) => void;
  buildingOrApt: string;
  onBuildingOrAptChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  cartSubtotal: number;
  errors?: {
    zoneId?: string;
    streetAddress?: string;
    buildingOrApt?: string;
    notes?: string;
  };
  className?: string;
}

const QUICK_NOTES = [
  "🚗 يرجى الاتصال قبل الوصول بـ 15 دقيقة",
  "🕒 يرجى التوصيل بعد العصر",
  "🥄 تزويد الطلب بملاعق وشوك ضيافة",
  "🎁 تغليف إضافي للهدايا مع بطاقة",
];

export function DeliveryAddressForm({
  zones,
  selectedZoneId,
  onZoneChange,
  streetAddress,
  onStreetAddressChange,
  buildingOrApt,
  onBuildingOrAptChange,
  notes,
  onNotesChange,
  cartSubtotal,
  errors = {},
  className,
}: DeliveryAddressFormProps) {
  const selectedZone = React.useMemo(() => {
    return zones.find((z) => z.id === selectedZoneId) || null;
  }, [zones, selectedZoneId]);

  // Minimum order threshold calculation
  const minOrderAmount = selectedZone ? selectedZone.minOrderAmount : 0;
  const isMinOrderMet = cartSubtotal >= minOrderAmount;
  const remainingForMinOrder = Math.max(0, minOrderAmount - cartSubtotal);

  const handleQuickNoteClick = (preset: string) => {
    if (!notes) {
      onNotesChange(preset);
    } else if (!notes.includes(preset)) {
      const combined = `${notes} - ${preset}`.slice(0, 200);
      onNotesChange(combined);
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden border-candy-line/80 shadow-candy-1 rounded-candy-card bg-candy-cream transition-all duration-200",
        className
      )}
    >
      <CardHeader className="bg-candy-soft/60 border-b border-candy-line/60 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center shrink-0 shadow-xs ring-2 ring-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg text-candy-ink font-display font-bold">
                2. تفاصيل ومنطقة التوصيل
              </CardTitle>
              <p className="text-xs text-candy-muted font-sans mt-0.5">
                توصيل سريع ومبرد بسيارات مخصصة لحفظ قرمشة وجودة الحلويات ❄️
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-candy-pill bg-candy-mint-soft text-candy-mint-text text-xs font-bold border border-candy-mint-soft shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-candy-mint-text" />
            <span>أسطول مبرد</span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {/* Delivery Zone Dropdown & Quick Selector */}
        <div>
          <label
            htmlFor="checkout-zone"
            className="block mb-1.5 text-sm font-bold text-candy-ink font-sans select-none"
          >
            اختر منطقة التوصيل *
          </label>

          {/* Quick Zone Chips for convenient 1-tap selection */}
          {zones.length > 0 && (
            <div className="mb-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-candy-muted font-sans ml-1 flex items-center gap-1">
                <Navigation className="w-3 h-3 text-candy-berry" />
                المناطق الشائعة:
              </span>
              {zones.slice(0, 4).map((zone) => {
                const isSelected = zone.id === selectedZoneId;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => onZoneChange(zone.id)}
                    className={cn(
                      "text-xs font-sans px-2.5 py-1 rounded-full transition-all border",
                      isSelected
                        ? "bg-candy-berry text-white border-candy-berry font-bold shadow-xs scale-105"
                        : "bg-candy-soft text-candy-ink border-candy-line/70 hover:border-candy-ink hover:bg-candy-cream"
                    )}
                  >
                    {zone.name} ({zone.deliveryFee} ₪)
                  </button>
                );
              })}
            </div>
          )}

          <div className="relative">
            <Select
              id="checkout-zone"
              value={selectedZoneId}
              onChange={(e) => onZoneChange(e.target.value)}
              error={errors.zoneId}
              placeholder="-- اختر منطقتك في قطاع غزة --"
              className="font-sans text-sm h-12"
            >
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} — رسوم التوصيل: {zone.deliveryFee} ₪ (الحد الأدنى:{" "}
                  {zone.minOrderAmount} ₪)
                </option>
              ))}
            </Select>
          </div>

          {/* Real-Time Zone Fee & Time Indicator Card */}
          {selectedZone && (
            <div className="mt-3.5 p-4 rounded-2xl bg-candy-cream border border-candy-line/80 shadow-xs animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                {/* Delivery Fee Highlight */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-candy-cream border border-candy-line/60">
                  <div className="w-9 h-9 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center shrink-0 shadow-xs">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-candy-muted block text-[11px]">
                      رسوم التوصيل لمنطقة {selectedZone.name}
                    </span>
                    <span className="font-extrabold text-candy-berry text-sm">
                      {selectedZone.deliveryFee === 0 ? "توصيل مجاني 🚚" : `${selectedZone.deliveryFee} ₪ (شيكل)`}
                    </span>
                  </div>
                </div>

                {/* Estimated Arrival Time */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-candy-cream border border-candy-line/60">
                  <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 shadow-xs border border-amber-100">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-candy-muted block text-[11px]">
                      وقت التوصيل التقديري
                    </span>
                    <span className="font-bold text-candy-ink text-sm">
                      {selectedZone.estimatedTimeMin} - {selectedZone.estimatedTimeMax} دقيقة
                    </span>
                  </div>
                </div>
              </div>

              {/* Minimum Order Amount Alert / Banner */}
              <div className="mt-3">
                {!isMinOrderMet ? (
                  <div
                    role="alert"
                    className="rounded-xl bg-amber-50/90 border border-amber-200/90 p-3.5 flex items-start gap-3 text-amber-950 text-xs font-sans animate-in fade-in duration-200"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-relaxed">
                      <p className="font-bold text-amber-900">
                        الحد الأدنى للطلب في منطقة ({selectedZone.name}) هو{" "}
                        <span className="underline font-extrabold">{minOrderAmount} ₪</span>.
                      </p>
                      <p className="text-amber-800 mt-1">
                        مجموع سلتك الحالي هو{" "}
                        <span className="font-bold">{cartSubtotal.toFixed(2)} ₪</span>. يرجى إضافة
                        منتجات بقيمة{" "}
                        <span className="font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                          {remainingForMinOrder.toFixed(2)} ₪
                        </span>{" "}
                        لتتمكن من إتمام الطلب لهذه المنطقة.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 p-2.5 flex items-center gap-2 text-emerald-800 text-xs font-sans">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      تم استيفاء الحد الأدنى للطلب لمنطقة {selectedZone.name} (الحد الأدنى: {minOrderAmount} ₪).
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Street Address & Detailed Landmarks */}
        <div>
          <Input
            label="الشارع والحي وأقرب معالم قريبة *"
            id="checkout-streetAddress"
            name="streetAddress"
            type="text"
            placeholder="مثال: شارع عمر المختار - مفترق السرايا - بجوار صيدلية الأمل"
            value={streetAddress}
            onChange={(e) => onStreetAddressChange(e.target.value)}
            error={errors.streetAddress}
            helperText={
              !errors.streetAddress && streetAddress.trim().length >= 5
                ? "تم تدوين العنوان بدقة ووضوح"
                : "يرجى كتابة تفاصيل الشارع وأي معلم مميز يسهل وصول المندوب إليك"
            }
            iconPrefix={<MapPin className="w-4 h-4 text-candy-muted" />}
            iconSuffix={
              !errors.streetAddress && streetAddress.trim().length >= 5 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-in zoom-in-75 duration-200" />
              ) : undefined
            }
            className={cn(
              "h-12 text-sm font-sans transition-all duration-200",
              !errors.streetAddress &&
                streetAddress.trim().length >= 5 &&
                "border-emerald-500/80 focus:border-emerald-600 focus:ring-emerald-500/20 bg-emerald-50/15"
            )}
            required
          />
        </div>

        {/* Building / Apartment (Optional) */}
        <div>
          <Input
            label="رقم العمارة / الطابق / الشقة (اختياري)"
            id="checkout-buildingOrApt"
            name="buildingOrApt"
            type="text"
            placeholder="مثال: عمارة الشروق - الطابق الثاني - شقة 4"
            value={buildingOrApt}
            onChange={(e) => onBuildingOrAptChange(e.target.value)}
            error={errors.buildingOrApt}
            helperText="اختياري — يساعد المندوب في الوصول السريع لباب شقتك"
            iconPrefix={<Building className="w-4 h-4 text-candy-muted" />}
            className="h-12 text-sm font-sans"
          />
        </div>

        {/* Order Notes / Instructions (Optional) with Quick Prompts */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="checkout-notes"
              className="block text-sm font-bold text-candy-ink font-sans select-none"
            >
              ملاحظات إضافية وتوصيات خاصة (اختياري)
            </label>
            <span
              className={cn(
                "text-xs font-sans",
                notes.length > 180 ? "text-amber-600 font-bold" : "text-candy-muted"
              )}
            >
              {notes.length}/200 حرف
            </span>
          </div>

          {/* Quick Note Suggestions */}
          <div className="mb-2 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-candy-muted font-sans">اقتراحات سريعة:</span>
            {QUICK_NOTES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickNoteClick(preset)}
                className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-candy-soft text-candy-ink border border-candy-line/60 hover:bg-candy-blush/40 hover:text-candy-berry transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          <Textarea
            id="checkout-notes"
            name="notes"
            placeholder="مثال: يرجى التوصيل بعد العصر مباشرة، أو تزويد الطلب بملاعق ضيافة إضافية..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value.slice(0, 200))}
            error={errors.notes}
            rows={3}
            className="min-h-[85px] text-sm font-sans"
          />
          <p className="mt-1.5 text-[11px] text-candy-muted font-sans flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-candy-muted/80 shrink-0" />
            <span>
              سيتم إرفاق هذه الملاحظات في كرت تجهيز المطبخ ومندوب التوصيل المعتمد لضمان تلبية رغبتك.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
