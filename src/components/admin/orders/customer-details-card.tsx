'use client';

import * as React from 'react';
import {
  User,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  MessageCircle,
  Copy,
  Check,
  Building,
  Navigation,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CheckoutCustomerData } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export interface CustomerDetailsCardProps {
  customer: CheckoutCustomerData;
  zoneName?: string;
  orderNumber?: string;
  paymentMethod?: string;
  className?: string;
}

/**
 * تنظيف وتهيئة رقم الهاتف لرسائل واتساب المباشرة
 * يحول 059xxxxxxx أو 056xxxxxxx إلى 97059xxxxxxx
 */
function formatWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return `970${digits.substring(1)}`;
  }
  if (!digits.startsWith('970') && !digits.startsWith('972')) {
    return `970${digits}`;
  }
  return digits;
}

export function CustomerDetailsCard({
  customer,
  zoneName,
  orderNumber,
  paymentMethod = 'cash_on_delivery',
  className,
}: CustomerDetailsCardProps) {
  const [copied, setCopied] = React.useState(false);

  const cleanPhone = customer.phone.trim();
  const waNumber = formatWhatsAppNumber(cleanPhone);
  const waMessage = encodeURIComponent(
    `مرحباً ${customer.fullName}، نتواصل معك من متجر كاندي لوز للحلويات بخصوص طلبك ${orderNumber ? `رقم (${orderNumber})` : ''}.`
  );
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(cleanPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <Card className={cn('bg-white border border-candy-line shadow-candy-1', className)}>
      <CardHeader className="pb-3 border-b border-candy-line/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-candy-ink font-sans">
              بيانات الزبون والتوصيل
            </CardTitle>
            <p className="text-[11px] text-candy-muted">
              معلومات الاتصال وعنوان تسليم الطلب
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4 text-sm font-sans">
        {/* 1. اسم الزبون ورقم الهاتف مع روابط الاتصال السريع */}
        <div className="p-3 rounded-2xl bg-candy-soft/60 border border-candy-line/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-candy-muted" />
              <span className="font-bold text-candy-ink text-base">
                {customer.fullName}
              </span>
            </div>
            <span className="text-[11px] text-candy-berry font-bold bg-candy-blush px-2 py-0.5 rounded-full">
              زبون كاش
            </span>
          </div>

          {/* رقم الهاتف والإجراءات السريعة */}
          <div className="flex items-center justify-between pt-1 border-t border-candy-line/40">
            <div className="flex items-center gap-1.5 font-mono text-candy-ink font-semibold" dir="ltr">
              <Phone className="w-3.5 h-3.5 text-candy-muted shrink-0" />
              <span>{cleanPhone}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* زر نسخ الرقم */}
              <button
                type="button"
                onClick={handleCopyPhone}
                title="نسخ رقم الهاتف"
                className="p-1.5 rounded-lg border border-candy-line bg-white hover:bg-candy-soft text-candy-muted hover:text-candy-ink transition-colors"
                aria-label="نسخ رقم الهاتف"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {/* اتصال هاتفي مباشر */}
              <a
                href={`tel:${cleanPhone}`}
                title="اتصال هاتفي مباشر"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-candy-line text-xs font-bold text-candy-berry hover:bg-candy-blush hover:border-candy-rose transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>اتصال</span>
              </a>

              {/* رابط واتساب مباشر */}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="محادثة واتساب مباشرة"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <MessageCircle className="w-3 h-3 text-emerald-600" />
                <span>واتساب</span>
              </a>
            </div>
          </div>
        </div>

        {/* 2. عنوان التوصيل والمنطقة */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-candy-ink">
            <MapPin className="w-4 h-4 text-candy-berry" />
            <span>عنوان التوصيل</span>
          </div>

          <div className="pr-6 space-y-1.5 text-xs text-candy-ink">
            {/* المنطقة الجغرافية */}
            <div className="flex items-center gap-1.5 text-candy-berry font-bold">
              <Navigation className="w-3.5 h-3.5 text-candy-berry shrink-0" />
              <span>منطقة التوصيل: {zoneName || customer.zoneId}</span>
            </div>

            {/* تفاصيل الشارع */}
            <div className="text-candy-ink font-medium leading-relaxed">
              <span className="text-candy-muted">الشارع والمعالم: </span>
              {customer.streetAddress}
            </div>

            {/* تفاصيل العمارة والشقة */}
            {customer.buildingOrApt && (
              <div className="flex items-center gap-1.5 text-candy-muted">
                <Building className="w-3.5 h-3.5 shrink-0" />
                <span>{customer.buildingOrApt}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. طريقة الدفع */}
        <div className="pt-3 border-t border-candy-line/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-candy-muted">
            <CreditCard className="w-4 h-4" />
            <span>طريقة الدفع:</span>
          </div>
          <span className="font-bold text-candy-ink bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
            {paymentMethod === 'cash_on_delivery' ? 'الدفع نقداً عند الاستلام' : paymentMethod}
          </span>
        </div>

        {/* 4. ملاحظات الطلب الخاصة بالزبون */}
        <div className="pt-3 border-t border-candy-line/60 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-candy-ink">
            <FileText className="w-3.5 h-3.5 text-candy-muted" />
            <span>ملاحظات الزبون على الطلب:</span>
          </div>

          {customer.notes ? (
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 leading-relaxed font-sans">
              {customer.notes}
            </div>
          ) : (
            <p className="text-xs text-candy-muted italic pr-5">
              لا توجد ملاحظات إضافية مسجلة من الزبون.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
