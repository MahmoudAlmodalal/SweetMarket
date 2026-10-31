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

  return (
    <Card className={cn("overflow-hidden border-candy-line/80 shadow-candy-1", className)}>
      <CardHeader className="bg-candy-soft/50 border-b border-candy-line/60 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center shrink-0 shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg text-candy-ink font-display">
                2. تفاصيل ومنطقة التوصيل
              </CardTitle>
              <p className="text-xs text-candy-muted font-sans mt-0.5">
                توصيل سريع ومبرد بسيارات مخصصة لحفظ الحلويات طازجة ❄️
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-candy-pill bg-candy-mint-soft text-candy-mint-text text-[11px] font-bold border border-candy-mint-soft">
            <Sparkles className="w-3 h-3" />
            توصيل مبرد
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Delivery Zone Dropdown */}
        <div>
          <label
            htmlFor="checkout-zone"
            className="block mb-1.5 text-sm font-bold text-candy-ink font-sans select-none"
          >
            اختر منطقة التوصيل *
          </label>
          <div className="relative">
            <Select
              id="checkout-zone"
              value={selectedZoneId}
              onChange={(e) => onZoneChange(e.target.value)}
              error={errors.zoneId}
              placeholder="-- اختر منطقتك في قطاع غزة --"
              className="font-sans text-sm"
            >
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} — رسوم التوصيل: {zone.deliveryFee} ₪ (الحد الأدنى:{" "}
                  {zone.minOrderAmount} ₪)
                </option>
              ))}
            </Select>
          </div>

          {/* Real-Time Zone Fee & Time Indicator */}
          {selectedZone && (
            <div className="mt-3 p-3.5 rounded-2xl bg-candy-soft border border-candy-line/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-white text-candy-berry flex items-center justify-center shadow-xs shrink-0">
                  <Truck className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="text-candy-muted block text-[11px]">رسوم التوصيل</span>
                  <span className="font-extrabold text-candy-berry text-sm">
                    {selectedZone.deliveryFee} ₪ (شيكل)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-r border-candy-line/80 pt-2 sm:pt-0 sm:pr-3">
                <span className="w-7 h-7 rounded-full bg-white text-candy-strawberry flex items-center justify-center shadow-xs shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="text-candy-muted block text-[11px]">وقت الوصول التقديري</span>
                  <span className="font-bold text-candy-ink">
                    {selectedZone.estimatedTimeMin} - {selectedZone.estimatedTimeMax} دقيقة
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Minimum Order Amount Threshold Alert */}
          {selectedZone && (
            <div className="mt-3">
              {!isMinOrderMet ? (
                <div
                  role="alert"
                  className="rounded-2xl bg-amber-50 border border-amber-200/90 p-3.5 flex items-start gap-3 text-amber-900 text-xs font-sans animate-in fade-in duration-300"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold leading-relaxed">
                      الحد الأدنى للطلب في منطقة ({selectedZone.name}) هو{" "}
                      <span className="underline font-extrabold">{minOrderAmount} ₪</span>.
                    </p>
                    <p className="text-amber-800 mt-1 leading-normal">
                      مجموع سلتك الحالي هو{" "}
                      <span className="font-bold">{cartSubtotal.toFixed(2)} ₪</span>. يرجى إضافة
                      منتجات بقيمة{" "}
                      <span className="font-extrabold text-amber-900">
                        {remainingForMinOrder.toFixed(2)} ₪
                      </span>{" "}
                      لتتمكن من إتمام الطلب لهذه المنطقة.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-2.5 flex items-center gap-2 text-emerald-800 text-xs font-sans">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    تم استيفاء الحد الأدنى للطلب في هذه المنطقة (الحد الأدنى: {minOrderAmount} ₪).
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Street Address */}
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
                ? "تم تدوين العنوان بدقة"
                : "يرجى كتابة تفاصيل الشارع وأي معلم مميز يسهل وصول المندوب إليك"
            }
            iconPrefix={<MapPin className="w-4 h-4 text-candy-muted" />}
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
            iconPrefix={<Building className="w-4 h-4 text-candy-muted" />}
          />
        </div>

        {/* Order Notes / Instructions (Optional) */}
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
              {notes.length}/200
            </span>
          </div>

          <Textarea
            id="checkout-notes"
            name="notes"
            placeholder="مثال: يرجى التوصيل بعد العصر مباشرة، أو تزويد الطلب بملاعق ضيافة إضافية..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value.slice(0, 200))}
            error={errors.notes}
            rows={3}
            className="min-h-[80px]"
          />
          <p className="mt-1 text-[11px] text-candy-muted font-sans flex items-center gap-1">
            <FileText className="w-3 h-3 text-candy-muted/80" />
            سيتم إرفاق هذه الملاحظات مع أمر التحضير في المطبخ ومندوب التوصيل
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
