'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from '@/context/admin-auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StoreLogo } from '@/components/ui/store-logo';
import { cn } from '@/lib/utils';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/admin/orders';

  const { login, quickLogin, user, isAuthenticated, isLoading } = useAdminAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickLoginRole, setQuickLoginRole] = useState<'manager' | 'staff' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const errors: { identifier?: string; password?: string } = {};
    if (!identifier.trim()) {
      errors.identifier = 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم';
    }
    if (!password) {
      errors.password = 'يرجى إدخال كلمة المرور';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const result = await login(identifier, password);
      if (result.success) {
        router.push(redirectTarget);
      } else {
        setErrorMessage(result.error || 'بيانات الدخول غير صحيحة، يرجى التحقق من البريد أو كلمة المرور');
      }
    } catch {
      setErrorMessage('حدث خطأ غير متوقع أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * تسجيل دخول فوري بنقرة واحدة للحسابات التجريبية (دون تعريض أو تداول كلمات مرور)
   */
  const handleQuickLogin = async (targetRole: 'manager' | 'staff') => {
    setErrorMessage(null);
    setFieldErrors({});
    setQuickLoginRole(targetRole);

    try {
      const result = await quickLogin(targetRole);
      if (result.success) {
        router.push(redirectTarget);
      } else {
        setErrorMessage(result.error || 'فشل تسجيل الدخول بالحساب التجريبي');
      }
    } catch {
      setErrorMessage('حدث خطأ غير متوقع أثناء تسجيل الدخول');
    } finally {
      setQuickLoginRole(null);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto relative px-1 sm:px-0">
      <Card elevation="sm" className="relative border-candy-line bg-white overflow-hidden rounded-card">
        <div className="h-1 bg-candy-berry" aria-hidden="true" />

        <CardHeader className="text-center pb-5 pt-8 px-6 sm:px-8 border-b border-candy-line/60">
          <Link href="/" aria-label="العودة إلى متجر كاندي لوز" className="inline-flex mx-auto mb-4 rounded-input focus-visible:ring-2 focus-visible:ring-candy-berry">
            <StoreLogo variant="main" width={180} height={52} priority className="max-w-[175px]" />
          </Link>
          <CardTitle className="text-2xl font-display text-candy-ink font-bold">
            بوابة إدارة كاندي لوز
          </CardTitle>
          <CardDescription className="text-sm text-candy-muted font-sans mt-1.5">
            سجّل الدخول لإدارة الطلبات والمنتجات ومناطق التوصيل
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 pt-6">
          {/* تنبيه الخطأ العام (المصادقة غير الصحيحة) */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start gap-2.5 p-3.5 mb-5 rounded-card bg-rose-50 border border-rose-200 text-rose-800 text-sm font-sans animate-in fade-in-50 duration-200 shadow-2xs"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 text-right leading-relaxed font-medium">
                {errorMessage}
              </div>
            </div>
          )}

          {/* تنبيه في حال كان المستخدم مسجلاً بالفعل */}
          {isAuthenticated && user && !isLoading && (
            <div className="mb-5 p-3.5 rounded-card bg-candy-soft border border-candy-blush text-candy-ink text-xs sm:text-sm font-sans flex items-center justify-between shadow-2xs">
              <div>
                <span className="font-bold text-candy-berry">مسجل حالياً: </span>
                <span className="font-semibold">{user.fullName}</span>
                <span className="text-candy-muted mr-1.5">({user.role === 'manager' ? 'مدير' : 'موظف'})</span>
              </div>
              <button
                type="button"
                onClick={() => router.push(redirectTarget)}
                className="text-candy-berry hover:text-candy-berry-dark font-bold underline mr-2 shrink-0 transition-colors"
              >
                المتابعة للوحة
              </button>
            </div>
          )}

          {/* نموذج تسجيل الدخول */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* حقل اسم المستخدم أو البريد الإلكتروني */}
            <div className="text-right">
              <label
                htmlFor="admin-identifier"
                className="block mb-1.5 text-sm font-bold text-candy-ink font-sans select-none"
              >
                البريد الإلكتروني أو اسم المستخدم
              </label>
              <div className="relative flex items-center">
                <div className="absolute right-3.5 flex items-center pointer-events-none text-candy-muted">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="admin-identifier"
                  name="username"
                  type="text"
                  autoComplete="username"
                  dir="ltr"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (fieldErrors.identifier) setFieldErrors((prev) => ({ ...prev, identifier: undefined }));
                  }}
                  placeholder="staff@candyloz.com"
                  disabled={isSubmitting || quickLoginRole !== null}
                  className={cn(
                    'w-full h-12 pr-10 pl-4 rounded-card font-sans text-sm text-candy-ink bg-candy-soft/60 border transition-all duration-200 outline-none placeholder:text-candy-muted focus:bg-white text-right disabled:opacity-50 shadow-2xs',
                    fieldErrors.identifier
                      ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-candy-line focus:border-candy-berry focus:ring-2 focus:ring-candy-strawberry/20 hover:border-candy-blush'
                  )}
                  required
                />
              </div>
              {fieldErrors.identifier && (
                <p role="alert" className="mt-1.5 text-xs text-rose-600 font-sans font-medium">
                  {fieldErrors.identifier}
                </p>
              )}
            </div>

            {/* حقل كلمة المرور */}
            <div className="text-right">
              <label
                htmlFor="admin-password"
                className="block mb-1.5 text-sm font-bold text-candy-ink font-sans select-none"
              >
                كلمة المرور
              </label>
              <div className="relative flex items-center">
                <div className="absolute right-3.5 flex items-center pointer-events-none text-candy-muted">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  disabled={isSubmitting || quickLoginRole !== null}
                  className={cn(
                    'w-full h-12 pr-10 pl-11 rounded-card font-sans text-sm text-candy-ink bg-candy-soft/60 border transition-all duration-200 outline-none placeholder:text-candy-muted focus:bg-white text-right disabled:opacity-50 shadow-2xs',
                    fieldErrors.password
                      ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-candy-line focus:border-candy-berry focus:ring-2 focus:ring-candy-strawberry/20 hover:border-candy-blush'
                  )}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  tabIndex={0}
                  className="absolute left-3.5 flex items-center text-candy-muted hover:text-candy-berry transition-colors focus:outline-none p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p role="alert" className="mt-1.5 text-xs text-rose-600 font-sans font-medium">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* زر تسجيل الدخول */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full mt-2 font-display text-base font-bold shadow-sm"
            >
              تسجيل الدخول
            </Button>
          </form>

          {/* خط فاصل أنيق */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-candy-line/80" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-medium">
              <span className="bg-white px-3 text-candy-muted font-sans flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-candy-amber" aria-hidden="true" />
                دخول تجريبي سريع بنقرة واحدة
              </span>
            </div>
          </div>

          {/* أزرار الدخول التجريبي السريع */}
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => handleQuickLogin('manager')}
              isLoading={quickLoginRole === 'manager'}
              leftIcon={<ShieldCheck className="w-4 h-4 text-candy-berry" />}
              className="w-full flex-col h-auto py-2.5 px-3 text-xs leading-tight border-candy-blush hover:bg-candy-soft transition-all active:scale-95"
            >
              <span className="font-bold text-candy-ink">دخول كمدير</span>
              <span className="text-[11px] text-candy-muted font-normal mt-0.5">صلاحيات كاملة</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => handleQuickLogin('staff')}
              isLoading={quickLoginRole === 'staff'}
              leftIcon={<UserCheck className="w-4 h-4 text-candy-rose" />}
              className="w-full flex-col h-auto py-2.5 px-3 text-xs leading-tight border-candy-blush hover:bg-candy-soft transition-all active:scale-95"
            >
              <span className="font-bold text-candy-ink">دخول كموظف</span>
              <span className="text-[11px] text-candy-muted font-normal mt-0.5">طلبات وتجهيز</span>
            </Button>
          </div>

          {/* تنويه الأمان وسياسة الدخول */}
          <div className="mt-4 p-3 rounded-card bg-candy-soft/70 border border-candy-line/60 text-[11px] text-candy-muted font-sans space-y-1">
            <p className="text-candy-ink font-semibold">بوابة الإدارة المحمية</p>
            <p className="text-candy-muted leading-relaxed">
              يرجى استخدام بيانات الاعتماد المخصصة للمسؤول أو النقر على أحد أزرار الدخول التجريبي السريع المعزول.
            </p>
          </div>

          {/* رابط العودة للواجهة العامة */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-candy-muted hover:text-candy-berry transition-colors font-medium group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
              <span>العودة إلى متجر كاندي لوز</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <AdminAuthProvider>
      <main className="min-h-screen bg-candy-cream flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8" dir="rtl">
        <Suspense
          fallback={
            <div className="w-full max-w-md mx-auto p-8 text-center text-candy-muted font-sans animate-pulse">
              جاري تجهيز صفحة الدخول...
            </div>
          }
        >
          <LoginFormContent />
        </Suspense>
      </main>
    </AdminAuthProvider>
  );
}
