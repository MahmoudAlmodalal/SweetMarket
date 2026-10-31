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
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AdminAuthProvider, useAdminAuth, PRE_SEEDED_USERS } from '@/context/admin-auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/admin/orders';

  const { login, user, isAuthenticated, isLoading } = useAdminAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickLoginRole, setQuickLoginRole] = useState<'manager' | 'staff' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني أو اسم المستخدم');
      return;
    }

    if (!password) {
      setErrorMessage('يرجى إدخال كلمة المرور');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(identifier, password);
      if (result.success) {
        router.push(redirectTarget);
      } else {
        setErrorMessage(result.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      setErrorMessage('حدث خطأ غير متوقع أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * تسجيل دخول فوري بنقرة واحدة للحسابات التجريبية
   */
  const handleQuickLogin = async (role: 'manager' | 'staff') => {
    setErrorMessage(null);
    setQuickLoginRole(role);
    const account = PRE_SEEDED_USERS[role];

    // تحديث الحقول للإشارة للمستخدم
    setIdentifier(account.email);
    setPassword(account.password);

    try {
      const result = await login(account.email, account.password);
      if (result.success) {
        router.push(redirectTarget);
      } else {
        setErrorMessage(result.error || 'فشل تسجيل الدخول بالحساب التجريبي');
      }
    } catch (err) {
      setErrorMessage('حدث خطأ غير متوقع أثناء تسجيل الدخول');
    } finally {
      setQuickLoginRole(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card elevation="md" className="border-candy-line shadow-candy-2 bg-white overflow-hidden">
        <CardHeader className="text-center pb-4 pt-7 px-6 sm:px-8 border-b border-candy-line/40">
          <div className="inline-flex items-center justify-center w-14 h-14 mx-auto mb-3 rounded-2xl bg-candy-soft border border-candy-blush text-candy-berry shadow-candy-1">
            <Lock className="w-7 h-7" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-display text-candy-ink font-bold">
            تسجيل الدخول للإدارة
          </CardTitle>
          <CardDescription className="text-sm text-candy-muted font-sans mt-1.5">
            أدخل بيانات اعتمادك للوصول إلى لوحة تحكم كاندي لوز
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 pt-6">
          {/* تنبيه الخطأ */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-sans animate-in fade-in-50 duration-200"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 text-right leading-relaxed font-medium">
                {errorMessage}
              </div>
            </div>
          )}

          {/* تنبيه في حال كان المستخدم مسجلاً بالفعل */}
          {isAuthenticated && user && !isLoading && (
            <div className="mb-5 p-3.5 rounded-xl bg-candy-soft border border-candy-blush text-candy-ink text-xs sm:text-sm font-sans flex items-center justify-between">
              <div>
                <span className="font-semibold text-candy-berry">مسجل حالياً: </span>
                <span>{user.fullName}</span>
                <span className="text-candy-muted mr-1.5">({user.role === 'manager' ? 'مدير' : 'موظف'})</span>
              </div>
              <button
                type="button"
                onClick={() => router.push(redirectTarget)}
                className="text-candy-berry hover:text-candy-berry-dark font-bold underline mr-2 shrink-0"
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
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="staff@candyloz.com"
                  disabled={isSubmitting || quickLoginRole !== null}
                  className="w-full h-12 pr-10 pl-4 rounded-[14px] font-sans text-sm text-candy-ink bg-candy-soft/60 border border-candy-line transition-all duration-200 outline-none placeholder:text-candy-muted focus:bg-white focus:border-candy-berry focus:ring-2 focus:ring-candy-strawberry/20 text-right disabled:opacity-50"
                  required
                />
              </div>
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting || quickLoginRole !== null}
                  className="w-full h-12 pr-10 pl-11 rounded-[14px] font-sans text-sm text-candy-ink bg-candy-soft/60 border border-candy-line transition-all duration-200 outline-none placeholder:text-candy-muted focus:bg-white focus:border-candy-berry focus:ring-2 focus:ring-candy-strawberry/20 text-right disabled:opacity-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  tabIndex={0}
                  className="absolute left-3.5 flex items-center text-candy-muted hover:text-candy-berry transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* زر تسجيل الدخول */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full mt-2 font-display text-base"
            >
              تسجيل الدخول
            </Button>
          </form>

          {/* خط فاصل */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-candy-line" />
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
              className="w-full flex-col h-auto py-2.5 px-3 text-xs leading-tight border-candy-blush hover:bg-candy-soft"
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
              className="w-full flex-col h-auto py-2.5 px-3 text-xs leading-tight border-candy-blush hover:bg-candy-soft"
            >
              <span className="font-bold text-candy-ink">دخول كموظف</span>
              <span className="text-[11px] text-candy-muted font-normal mt-0.5">طلبات وتجهيز</span>
            </Button>
          </div>

          {/* ملخص بيانات الدخول التجريبية */}
          <div className="mt-4 p-3 rounded-xl bg-candy-soft/70 border border-candy-line/60 text-[11px] text-candy-muted font-sans space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-medium text-candy-ink">المدير:</span>
              <code className="text-candy-berry font-mono" dir="ltr">manager@candyloz.com / manager123</code>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-candy-ink">الموظف:</span>
              <code className="text-candy-berry font-mono" dir="ltr">staff@candyloz.com / staff123</code>
            </div>
          </div>

          {/* رابط العودة للواجهة العامة */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-candy-muted hover:text-candy-berry transition-colors font-medium"
            >
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              العودة إلى متجر كاندي لوز
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
