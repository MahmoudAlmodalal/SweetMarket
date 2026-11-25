'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  ArrowLeft,
  KeyRound,
  LogIn,
  RotateCcw,
  User,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { AdminUser } from '@/types';
import { getArabicRoleLabel, validateAdminReturnUrl } from '@/lib/auth/authorization';
import { AccessRequestDialog } from './access-request-dialog';
import { cn } from '@/lib/utils';

interface StaffForbiddenCardProps {
  user: AdminUser;
  rawFrom?: string | null;
  onLogout: () => void;
}

export function StaffForbiddenCard({
  user,
  rawFrom,
  onLogout,
}: StaffForbiddenCardProps) {
  const router = useRouter();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = React.useState(false);

  const safeReturnUrl = validateAdminReturnUrl(rawFrom);

  const handleReturnToOrders = () => {
    router.push('/admin/orders');
  };

  const handleSwitchAccount = () => {
    onLogout();
    const loginUrl = `/admin/login?redirect=${encodeURIComponent(safeReturnUrl)}`;
    router.push(loginUrl);
  };

  return (
    <>
      <div className="w-full max-w-lg mx-auto" dir="rtl">
        <Card
          elevation="md"
          className="border-candy-line/80 shadow-candy-2 bg-candy-cream overflow-hidden text-center rounded-3xl"
        >
          {/* شريط الإشعاع التنبيهي */}
          <div className="h-1.5 bg-candy-cream" aria-hidden="true" />

          <CardHeader className="pt-8 pb-4 px-6 sm:px-8 border-b border-candy-line/40">
            {/* 403 Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-3xl bg-rose-50 border-2 border-rose-200/80 text-rose-600 shadow-sm animate-pulse">
              <ShieldAlert className="w-8 h-8" aria-hidden="true" />
            </div>

            {/* 403 Pill */}
            <div className="inline-block px-3.5 py-1 mb-2.5 rounded-full bg-rose-100/80 text-rose-800 text-xs font-bold tracking-wider font-mono border border-rose-200/60">
              403 • صلاحية غير كافية
            </div>

            {/* Headline */}
            <CardTitle className="text-xl sm:text-2xl font-display text-candy-ink font-bold leading-relaxed">
              عذراً، هذه الصفحة مخصصة لمدير النظام فقط
            </CardTitle>

            {/* Explanation */}
            <CardDescription className="text-sm text-candy-muted font-sans mt-2 max-w-md mx-auto leading-relaxed">
              لا تملك الصلاحيات الكافية للوصول إلى هذا القسم. يمكنك طلب ترقية الصلاحية من مدير النظام أو العودة إلى قائمة الطلبات.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-5">
            {/* Identity Box: separate fullName, separate jobTitle, and Arabic role badge */}
            <div
              className="p-4 rounded-2xl bg-candy-soft/80 border border-candy-ink text-right shadow-2xs"
              role="region"
              aria-label="بيانات المستخدم الحالي"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-candy-blush/60 flex items-center justify-center text-candy-berry shrink-0 shadow-xs">
                    <User className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-candy-muted font-medium">اسم المستخدم</div>
                    <div className="text-sm font-bold text-candy-ink truncate">
                      {user.fullName}
                    </div>
                    {user.jobTitle && (
                      <div className="text-xs text-candy-muted font-sans mt-0.5 truncate">
                        المسمى الوظيفي: <span className="font-semibold text-candy-ink">{user.jobTitle}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <span className="text-xs text-candy-muted block mb-0.5">الدور الفعلي</span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-candy-blush text-candy-berry border border-candy-line/60 shadow-xs">
                    {getArabicRoleLabel(user.role)}
                  </span>
                </div>
              </div>
            </div>

            {/* Required Scope Row: clearly states required access: "مدير النظام" */}
            <div
              className="flex items-center justify-between p-3.5 rounded-2xl bg-candy-cream/70 border border-candy-line/70 text-xs shadow-2xs"
              role="region"
              aria-label="الصلاحية المطلوبة"
            >
              <div className="flex items-center gap-2 text-candy-muted">
                <Shield className="w-4 h-4 text-candy-berry shrink-0" aria-hidden="true" />
                <span className="font-medium">الصلاحية المطلوبة للوصول:</span>
              </div>
              <span className="font-bold text-candy-ink bg-candy-cream px-3 py-1 rounded-xl border border-candy-line shadow-xs font-display">
                مدير النظام
              </span>
            </div>

            {/* Action Buttons: 48px minimum touch height, vertical stacking on mobile */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleReturnToOrders}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="w-full sm:flex-1 font-display min-h-[48px] shadow-sm font-bold"
              >
                العودة إلى إدارة الطلبات
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setIsRequestDialogOpen(true)}
                leftIcon={<KeyRound className="w-4 h-4 text-candy-berry" />}
                className="w-full sm:flex-1 font-display min-h-[48px] border-candy-ink hover:bg-candy-soft font-bold"
              >
                طلب صلاحية الوصول
              </Button>
            </div>

            {/* Secondary Utility Links: minimum 48px touch height, accessible */}
            <div className="pt-3 border-t border-candy-line/60 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs text-candy-muted font-sans">
              <button
                type="button"
                onClick={handleSwitchAccount}
                className="inline-flex items-center justify-center gap-1.5 min-h-[48px] px-3 py-2 rounded-xl text-candy-muted hover:text-candy-berry hover:bg-candy-soft/60 transition-colors font-medium touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>تسجيل الدخول بحساب آخر</span>
              </button>

              <span className="hidden sm:inline text-candy-line" aria-hidden="true">
                •
              </span>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-1.5 min-h-[48px] px-3 py-2 rounded-xl text-candy-muted hover:text-candy-berry hover:bg-candy-soft/60 transition-colors font-medium touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>العودة للمتجر</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accessible Request Access Dialog */}
      <AccessRequestDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        user={user}
      />
    </>
  );
}
