'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Clock, DollarSign, Check, Sparkles } from 'lucide-react';
import type { DeliveryZone } from '@/types';

export interface ZoneFormData {
  id?: string;
  name: string;
  deliveryFee: number;
  minOrderAmount: number;
  estimatedTimeMin: number;
  estimatedTimeMax: number;
  isActive: boolean;
}

export interface ZoneEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone?: DeliveryZone | null;
  existingZones: DeliveryZone[];
  onSave: (data: ZoneFormData) => Promise<void> | void;
}

// اقتراحات سريعة لمناطق ومحافظات فلسطينية
const SUGGESTED_PALESTINIAN_ZONES = [
  { name: 'مدينة غزة والرمال والنصر', fee: 10, minOrder: 30, tMin: 30, tMax: 50 },
  { name: 'المحافظة الوسطى (دير البلح، النصيرات)', fee: 12, minOrder: 40, tMin: 40, tMax: 60 },
  { name: 'خان يونس ووسط البلد والسطر', fee: 15, minOrder: 50, tMin: 45, tMax: 75 },
  { name: 'شمال غزة (جباليا، بيت لاهيا)', fee: 15, minOrder: 40, tMin: 45, tMax: 70 },
  { name: 'مدينة رفح والحي الإداري', fee: 20, minOrder: 50, tMin: 60, tMax: 90 },
  { name: 'رام الله والبيرة وبيتونيا', fee: 15, minOrder: 40, tMin: 30, tMax: 50 },
  { name: 'نابلس وجبل النار ورفيديا', fee: 15, minOrder: 40, tMin: 30, tMax: 50 },
  { name: 'الخليل وعين سارة والحرس', fee: 18, minOrder: 45, tMin: 35, tMax: 60 },
];

export function ZoneEditDialog({
  open,
  onOpenChange,
  zone,
  existingZones,
  onSave,
}: ZoneEditDialogProps) {
  const isEditing = Boolean(zone);

  const [name, setName] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number | string>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number | string>(30);
  const [estimatedTimeMin, setEstimatedTimeMin] = useState<number | string>(30);
  const [estimatedTimeMax, setEstimatedTimeMax] = useState<number | string>(50);
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (zone) {
        setName(zone.name);
        setDeliveryFee(zone.deliveryFee);
        setMinOrderAmount(zone.minOrderAmount);
        setEstimatedTimeMin(zone.estimatedTimeMin);
        setEstimatedTimeMax(zone.estimatedTimeMax);
        setIsActive(zone.isActive);
      } else {
        setName('');
        setDeliveryFee(10);
        setMinOrderAmount(30);
        setEstimatedTimeMin(30);
        setEstimatedTimeMax(50);
        setIsActive(true);
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open, zone]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'اسم منطقة التوصيل مطلوب';
    } else if (trimmedName.length < 3) {
      newErrors.name = 'اسم المنطقة يجب أن لا يقل عن 3 أحرف';
    } else {
      // فحص فرادة الاسم (ER-001)
      const isDuplicate = existingZones.some(
        (z) =>
          z.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
          (!zone || z.id !== zone.id)
      );
      if (isDuplicate) {
        newErrors.name = 'يوجد منطقة توصيل أخرى بنفس هذا الاسم بالفعل';
      }
    }

    const feeNum = Number(deliveryFee);
    if (deliveryFee === '' || isNaN(feeNum)) {
      newErrors.deliveryFee = 'يرجى إدخال رسوم التوصيل بالشيكل';
    } else if (feeNum < 0) {
      newErrors.deliveryFee = 'رسوم التوصيل لا يمكن أن تكون سالبة (F-4: الصفر مسموح للتوصيل المجاني)';
    }

    const minOrderNum = Number(minOrderAmount);
    if (minOrderAmount === '' || isNaN(minOrderNum)) {
      newErrors.minOrderAmount = 'يرجى إدخال الحد الأدنى للطلب بالشيكل';
    } else if (minOrderNum < 0) {
      newErrors.minOrderAmount = 'الحد الأدنى للطلب لا يمكن أن يكون سالباً';
    }

    const tMin = Number(estimatedTimeMin);
    const tMax = Number(estimatedTimeMax);
    if (estimatedTimeMin === '' || isNaN(tMin) || tMin <= 0) {
      newErrors.estimatedTimeMin = 'يرجى إدخال وقت صحيح بالدقائق (أكبر من 0)';
    }
    if (estimatedTimeMax === '' || isNaN(tMax) || tMax <= 0) {
      newErrors.estimatedTimeMax = 'يرجى إدخال أقصى وقت بالدقائق';
    } else if (tMax < tMin) {
      newErrors.estimatedTimeMax = 'أقصى وقت توصيل يجب أن يكون أكبر من أو يساوي الحد الأدنى';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: zone?.id,
        name: name.trim(),
        deliveryFee: Number(deliveryFee),
        minOrderAmount: Number(minOrderAmount),
        estimatedTimeMin: Number(estimatedTimeMin),
        estimatedTimeMax: Number(estimatedTimeMax),
        isActive,
      });
      onOpenChange(false);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        form: err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ المنطقة',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold font-display text-candy-ink">
                {isEditing ? `تعديل منطقة: ${zone?.name}` : 'إضافة منطقة توصيل جديدة'}
              </DialogTitle>
              <DialogDescription className="text-xs text-candy-muted font-sans mt-0.5">
                {isEditing
                  ? 'تعديل رسوم التوصيل والحد الأدنى للطلب وأوقات الوصول المتوقعة'
                  : 'إضافة محافظة أو حي جديد وضبط تكلفة التوصيل بالشيكل (SCR-18)'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errors.form && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-sans font-medium"
            >
              {errors.form}
            </div>
          )}

          {/* اسم المنطقة */}
          <div>
            <Input
              id="zone-name"
              label="اسم المنطقة / المحافظة *"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="مثال: مدينة غزة والرمال والنصر"
              error={errors.name}
              disabled={isSubmitting}
              autoFocus
            />

            {/* اقتراحات سريعة للمناطق الفلسطينية عند الإنشاء */}
            {!isEditing && (
              <div className="mt-2">
                <span className="text-[11px] text-candy-muted font-sans font-medium block mb-1">
                  اقتراحات لمحافظات ومناطق فلسطينية:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-candy-soft/60 rounded-xl border border-candy-line">
                  {SUGGESTED_PALESTINIAN_ZONES.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setName(s.name);
                        setDeliveryFee(s.fee);
                        setMinOrderAmount(s.minOrder);
                        setEstimatedTimeMin(s.tMin);
                        setEstimatedTimeMax(s.tMax);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-sans bg-white border border-candy-line hover:border-candy-rose hover:text-candy-berry transition-colors"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-candy-strawberry" />
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* رسوم التوصيل والحد الأدنى للطلب (بالشيكل ILS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                id="zone-delivery-fee"
                type="number"
                min="0"
                step="0.5"
                label="رسوم التوصيل (شيكل ₪) *"
                value={deliveryFee}
                onChange={(e) => {
                  setDeliveryFee(e.target.value);
                  if (errors.deliveryFee) setErrors((prev) => ({ ...prev, deliveryFee: '' }));
                }}
                error={errors.deliveryFee}
                disabled={isSubmitting}
                helperText="أدخل 0 للتوصيل المجاني (F-4)"
                iconSuffix={<span className="text-xs text-candy-muted font-bold">₪</span>}
              />
            </div>

            <div>
              <Input
                id="zone-min-order"
                type="number"
                min="0"
                step="1"
                label="الحد الأدنى للطلب (شيكل ₪) *"
                value={minOrderAmount}
                onChange={(e) => {
                  setMinOrderAmount(e.target.value);
                  if (errors.minOrderAmount) setErrors((prev) => ({ ...prev, minOrderAmount: '' }));
                }}
                error={errors.minOrderAmount}
                disabled={isSubmitting}
                helperText="أدخل 0 إن لم يوجد حد أدنى"
                iconSuffix={<span className="text-xs text-candy-muted font-bold">₪</span>}
              />
            </div>
          </div>

          {/* الوقت التقديري للتوصيل (بالدقائق) */}
          <div className="p-3 rounded-2xl bg-candy-soft/60 border border-candy-line space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-candy-ink font-sans">
              <Clock className="w-3.5 h-3.5 text-candy-berry" />
              <span>وقت التوصيل التقديري للزبون (بالدقائق) *</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  id="zone-time-min"
                  type="number"
                  min="5"
                  step="5"
                  label="من (دقيقة)"
                  value={estimatedTimeMin}
                  onChange={(e) => {
                    setEstimatedTimeMin(e.target.value);
                    if (errors.estimatedTimeMin) setErrors((prev) => ({ ...prev, estimatedTimeMin: '' }));
                  }}
                  error={errors.estimatedTimeMin}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Input
                  id="zone-time-max"
                  type="number"
                  min="5"
                  step="5"
                  label="إلى (دقيقة)"
                  value={estimatedTimeMax}
                  onChange={(e) => {
                    setEstimatedTimeMax(e.target.value);
                    if (errors.estimatedTimeMax) setErrors((prev) => ({ ...prev, estimatedTimeMax: '' }));
                  }}
                  error={errors.estimatedTimeMax}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <p className="text-[11px] text-candy-muted font-sans">
              يظهر للمشتري في صفحة إتمام الطلب مثل: {estimatedTimeMin || 30} - {estimatedTimeMax || 50} دقيقة
            </p>
          </div>

          {/* حالة تفعيل المنطقة */}
          <div className="pt-2 border-t border-candy-line/60">
            <label
              htmlFor="zone-is-active"
              className="flex items-center gap-2.5 p-3 rounded-xl border border-candy-line bg-white hover:bg-candy-soft cursor-pointer transition-colors"
            >
              <input
                id="zone-is-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isSubmitting}
                className="w-4 h-4 rounded text-candy-berry focus:ring-candy-strawberry border-candy-line"
              />
              <div className="text-right">
                <span className="text-xs font-bold text-candy-ink font-sans block">
                  {isActive ? 'المنطقة مفعّلة ومتاحة للزبائن' : 'المنطقة معطّلة (مخفية عن قائمة التوصيل)'}
                </span>
                <span className="text-[11px] text-candy-muted font-sans block mt-0.5">
                  عند التعطيل لن يتمكن الزبون من اختيار هذه المنطقة أثناء إتمام الطلب (SCR-05)
                </span>
              </div>
            </label>
          </div>

          <DialogFooter className="pt-4 border-t border-candy-line/60 gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Check className="w-4 h-4" />}
            >
              {isEditing ? 'حفظ التعديلات' : 'إضافة المنطقة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ZoneEditDialog;
