'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogIn, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { validateAdminReturnUrl } from '@/lib/auth/authorization';

interface GuestUnauthenticatedCardProps {
  rawFrom?: string | null;
}

export function GuestUnauthenticatedCard({ rawFrom }: GuestUnauthenticatedCardProps) {
  const router = useRouter();
  const safeReturnUrl = validateAdminReturnUrl(rawFrom);
  const loginUrl = `/admin/login?redirect=${encodeURIComponent(safeReturnUrl)}`;

  const handleLoginClick = () => {
    router.push(loginUrl);
  };

  const handleStorefrontClick = () => {
    router.push('/');
  };

  return (
    <div className="w-full max-w-lg mx-auto" dir="rtl">
      <Card
        elevation="md"
        className="border-candy-line/80 shadow-candy-2 bg-candy-cream overflow-hidden text-center rounded-3xl"
      >
        {/* شريط الإشعاع العلوي */}
        <div className="h-1.5 bg-candy-cream" aria-hidden="true" />

        <CardHeader className="pt-8 pb-4 px-6 sm:px-8 border-b border-candy-line/40">
          {/* Lock Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-3xl bg-amber-50 border-2 border-amber-200/80 text-amber-700 shadow-sm animate-pulse">
            <Lock className="w-8 h-8" aria-hidden="true" />
          </div>

          {/* 401 Pill */}
          <div className="inline-block px-3.5 py-1 mb-2.5 rounded-none bg-amber-100/80 text-amber-900 text-xs font-bold tracking-wider font-mono border border-amber-200/60">
            401 • تسجيل الدخول مطلوب
          </div>

          {/* Headline */}
          <CardTitle className="text-xl sm:text-2xl font-display text-candy-ink font-bold leading-relaxed">
            تسجيل الدخول مطلوب للمتابعة
          </CardTitle>

          {/* Explanation */}
          <CardDescription className="text-sm text-candy-muted font-sans mt-2 max-w-md mx-auto leading-relaxed">
            هذا القسم مخصص لفريق عمل وإدارة متجر كاندي لوز. يرجى تسجيل الدخول بحسابك المعتمد للمتابعة.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Status Box */}
          <div
            className="p-4 rounded-2xl bg-candy-soft/80 border border-candy-line text-right flex items-center justify-between shadow-2xs"
            role="region"
            aria-label="حالة الجلسة"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-candy-blush/60 flex items-center justify-center text-candy-berry shrink-0 shadow-xs">
                <Lock className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs text-candy-muted font-medium">حالة الجلسة</div>
                <div className="text-sm font-bold text-candy-ink">
                  الحالة: غير مسجل دخول
                </div>
              </div>
            </div>

            <div className="text-left">
              <span className="text-xs text-candy-muted block mb-0.5">الدور</span>
              <span className="inline-block px-2.5 py-0.5 rounded-none text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 shadow-xs">
                زائر
              </span>
            </div>
          </div>

          {/* Action Buttons: 48px minimum touch height, vertical stacking on mobile */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleLoginClick}
              leftIcon={<LogIn className="w-5 h-5" />}
              className="w-full sm:flex-1 font-display min-h-[48px] shadow-sm font-bold"
            >
              تسجيل الدخول إلى النظام
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleStorefrontClick}
              leftIcon={<Store className="w-4 h-4 text-candy-berry" />}
              className="w-full sm:flex-1 font-display min-h-[48px] border-candy-ink hover:bg-candy-soft font-bold"
            >
              العودة لواجهة المتجر الرئيسية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GuestUnauthenticatedCard;
