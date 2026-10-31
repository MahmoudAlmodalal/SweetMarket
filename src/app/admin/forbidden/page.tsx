'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  LogIn,
  User,
  CheckCircle2,
} from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from '@/context/admin-auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function ForbiddenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('from') || '/admin/orders';

  const { user, role, switchRole, isAuthenticated, isLoading } = useAdminAuth();
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchedSuccess, setSwitchedSuccess] = useState(false);

  const handleSwitchToManager = async () => {
    setIsSwitching(true);
    try {
      switchRole('manager');
      setSwitchedSuccess(true);
      setTimeout(() => {
        router.push(returnUrl);
      }, 700);
    } catch (err) {
      console.error('Failed to switch role:', err);
      setIsSwitching(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <Card
        elevation="md"
        className="border-candy-line shadow-candy-2 bg-white overflow-hidden text-center"
      >
        <CardHeader className="pt-8 pb-4 px-6 sm:px-8 border-b border-candy-line/40">
          <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-3xl bg-rose-50 border-2 border-rose-100 text-rose-600 shadow-sm animate-pulse">
            <ShieldAlert className="w-8 h-8" aria-hidden="true" />
          </div>

          <div className="inline-block px-3 py-1 mb-2 rounded-full bg-rose-100/70 text-rose-800 text-xs font-bold tracking-wider font-mono">
            خطأ 403 • وصول محظور
          </div>

          <CardTitle className="text-xl sm:text-2xl font-display text-candy-ink font-bold leading-relaxed">
            عذراً، هذه الصفحة مخصصة لمدير النظام فقط
          </CardTitle>

          <CardDescription className="text-sm text-candy-muted font-sans mt-2 max-w-md mx-auto leading-normal">
            لا تملك الصلاحية الكافية للوصول إلى هذا القسم. يمكنك التبديل الفوري لدور المدير لمتابعة الإدارة، أو العودة لصفحة الطلبات.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* شريط حالة المستخدم الحالي */}
          {!isLoading && (
            <div className="p-4 rounded-2xl bg-candy-soft/80 border border-candy-blush text-right flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-candy-blush/60 flex items-center justify-center text-candy-berry shrink-0">
                  <User className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs text-candy-muted font-medium">الحساب الحالي</div>
                  <div className="text-sm font-bold text-candy-ink">
                    {isAuthenticated && user ? user.fullName : 'غير مسجل دخول'}
                  </div>
                </div>
              </div>

              <div className="text-left">
                <span className="text-xs text-candy-muted block mb-0.5">الدور الفعلي</span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    role === 'manager'
                      ? 'bg-candy-berry text-white'
                      : role === 'staff'
                      ? 'bg-candy-blush text-candy-berry'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {role === 'manager' ? 'مدير (Manager)' : role === 'staff' ? 'موظف (Staff)' : 'زائر'}
                </span>
              </div>
            </div>
          )}

          {/* رسالة نجاح التبديل */}
          {switchedSuccess && (
            <div
              role="alert"
              className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium animate-in fade-in zoom-in-95 duration-200"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>تم التبديل إلى دور مدير بنجاح! جاري تحويلك...</span>
            </div>
          )}

          {/* أزرار الإجراءات */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleSwitchToManager}
              isLoading={isSwitching}
              disabled={switchedSuccess}
              leftIcon={<ShieldCheck className="w-5 h-5" />}
              className="flex-1 font-display"
            >
              التبديل إلى دور مدير
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => router.push('/admin/orders')}
              disabled={isSwitching}
              leftIcon={<ArrowRight className="w-4 h-4" />}
              className="flex-1 font-display"
            >
              العودة إلى الطلبات
            </Button>
          </div>

          {/* روابط مساعدة إضافية */}
          <div className="pt-2 border-t border-candy-line/60 flex items-center justify-center gap-6 text-xs text-candy-muted font-sans">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 hover:text-candy-berry transition-colors font-medium"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              تسجيل الدخول بحساب آخر
            </Link>
            <span>•</span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 hover:text-candy-berry transition-colors font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              واجهة المتجر الرئيسية
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ForbiddenPage() {
  return (
    <AdminAuthProvider>
      <main
        className="min-h-screen bg-candy-cream flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8"
        dir="rtl"
      >
        <Suspense
          fallback={
            <div className="w-full max-w-lg mx-auto p-8 text-center text-candy-muted font-sans animate-pulse">
              جاري تحميل الصفحة...
            </div>
          }
        >
          <ForbiddenContent />
        </Suspense>
      </main>
    </AdminAuthProvider>
  );
}
