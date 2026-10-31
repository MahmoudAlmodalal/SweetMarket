'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  User,
  ArrowRight,
  Save,
  Lock,
  ChevronLeft,
} from 'lucide-react';
import { useAdminAuth, PRE_SEEDED_USERS } from '@/context/admin-auth-context';
import { MOCK_ADMIN_CREDENTIALS } from '@/data/mock/users';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, role } = useAdminAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. التحقق من كلمة المرور الحالية
    if (!currentPassword) {
      newErrors.currentPassword = 'يرجى إدخال كلمة المرور الحالية';
    } else {
      // مطابقة كلمة المرور مع السجل الوهمي للمستخدم الحالي
      const expectedPassword =
        (user?.email && MOCK_ADMIN_CREDENTIALS[user.email]?.password) ||
        (role && PRE_SEEDED_USERS[role]?.password) ||
        '';

      if (expectedPassword && currentPassword !== expectedPassword) {
        newErrors.currentPassword = 'كلمة المرور الحالية غير صحيحة';
      }
    }

    // 2. التحقق من كلمة المرور الجديدة
    if (!newPassword) {
      newErrors.newPassword = 'يرجى إدخال كلمة المرور الجديدة';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف';
    } else if (currentPassword && newPassword === currentPassword) {
      newErrors.newPassword = 'كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية';
    }

    // 3. التحقق من تأكيد كلمة المرور
    if (!confirmPassword) {
      newErrors.confirmPassword = 'يرجى تأكيد كلمة المرور الجديدة';
    } else if (newPassword && confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'كلمتا المرور غير متطابقتين';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // محاكاة تأخير معالجة الخادم الآمنة (350ms)
      await new Promise((resolve) => setTimeout(resolve, 350));

      // تحديث كلمة المرور في السجل الوهمي للمستخدم
      if (user?.email && MOCK_ADMIN_CREDENTIALS[user.email]) {
        MOCK_ADMIN_CREDENTIALS[user.email].password = newPassword;
      }
      if (role && PRE_SEEDED_USERS[role]) {
        PRE_SEEDED_USERS[role].password = newPassword;
      }

      setIsSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});

      toast.success(
        'تم تغيير كلمة المرور بنجاح',
        'تم حفظ كلمة المرور الجديدة لحسابك، يمكنك استخدامها في تسجيل الدخول القادم'
      );
    } catch {
      setErrors({
        general: 'حدث خطأ أثناء حفظ كلمة المرور، يرجى المحاولة مرة أخرى',
      });
      toast.error('فشل حفظ كلمة المرور');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* مسار التنقل التوجيهي (Breadcrumb) */}
      <nav aria-label="مسار التصفح" className="flex items-center gap-2 text-xs text-candy-muted font-sans">
        <Link
          href="/admin/orders"
          className="hover:text-candy-berry transition-colors flex items-center gap-1"
        >
          <span>لوحة الإدارة</span>
        </Link>
        <ChevronLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>الحساب</span>
        <ChevronLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span className="text-candy-ink font-bold">تغيير كلمة المرور (SCR-12)</span>
      </nav>

      {/* بطاقة معلومات الحساب الحالي */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-candy-line shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs',
              role === 'manager'
                ? 'bg-candy-berry text-white border-candy-berry-dark'
                : 'bg-candy-soft text-candy-berry border-candy-blush'
            )}
            aria-hidden="true"
          >
            {role === 'manager' ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-base text-candy-ink">
                {user?.fullName || 'مستخدم النظام'}
              </h2>
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-xs font-bold font-sans border',
                  role === 'manager'
                    ? 'bg-candy-berry text-white border-candy-berry-dark'
                    : 'bg-candy-blush text-candy-berry border-candy-rose/30'
                )}
              >
                {role === 'manager' ? 'مدير' : 'موظف'}
              </span>
            </div>
            <p className="font-sans text-xs text-candy-muted mt-0.5" dir="ltr">
              {user?.email || `@${user?.username}`}
            </p>
          </div>
        </div>

        <div className="text-xs text-candy-muted font-sans sm:text-left border-t sm:border-t-0 pt-2 sm:pt-0 border-candy-line/60">
          <span className="inline-block px-2.5 py-1 rounded-lg bg-candy-soft border border-candy-blush text-candy-berry font-medium">
            حساب إداري نشط
          </span>
        </div>
      </div>

      {/* قسم النموذج الرئيسي */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card elevation="md" className="border-candy-line bg-white shadow-candy-1 overflow-hidden">
            <CardHeader className="p-6 border-b border-candy-line/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-candy-soft text-candy-berry border border-candy-blush flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display font-bold text-candy-ink">
                    تغيير كلمة المرور
                  </CardTitle>
                  <CardDescription className="text-xs text-candy-muted font-sans mt-0.5">
                    أدخل كلمة المرور الحالية، ثم عيّن كلمة مرور جديدة لحسابك
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* إشعار نجاح الحفظ */}
              {isSuccess && (
                <div
                  role="alert"
                  className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3 transition-all duration-300"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-1 text-right flex-1">
                    <p className="text-sm font-bold font-sans">تم تغيير كلمة المرور بنجاح!</p>
                    <p className="text-xs text-emerald-800 leading-relaxed font-sans">
                      تم حفظ كلمة المرور الجديدة وتحديث بيانات الأمان لحسابك بنجاح.
                    </p>
                  </div>
                </div>
              )}

              {/* إشعار خطأ عام */}
              {errors.general && (
                <div
                  role="alert"
                  className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-sm font-semibold font-sans">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* 1. حقل كلمة المرور الحالية */}
                <div className="space-y-1.5 text-right">
                  <label
                    htmlFor="current-password-input"
                    className="block text-sm font-bold text-candy-ink font-sans"
                  >
                    كلمة المرور الحالية <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="current-password-input"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (errors.currentPassword) {
                          setErrors((prev) => ({ ...prev, currentPassword: undefined }));
                        }
                      }}
                      autoComplete="current-password"
                      placeholder="أدخل كلمة المرور الحالية"
                      aria-invalid={Boolean(errors.currentPassword)}
                      aria-describedby={errors.currentPassword ? 'current-password-error' : undefined}
                      className={cn(
                        'w-full h-12 pr-4 pl-12 rounded-[14px] font-sans text-sm text-candy-ink bg-candy-soft/60 border border-candy-line transition-all duration-200 outline-none',
                        'placeholder:text-candy-muted',
                        'focus:bg-white focus:border-candy-berry focus:ring-2 focus:ring-candy-strawberry/20',
                        errors.currentPassword &&
                          'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20 text-rose-900 bg-rose-50/30'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      aria-label={showCurrentPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-candy-muted hover:text-candy-ink hover:bg-candy-soft transition-colors focus:outline-none focus:ring-2 focus:ring-candy-strawberry/30"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p
                      id="current-password-error"
                      role="alert"
                      className="text-xs font-semibold text-rose-600 font-sans mt-1"
                    >
                      {errors.currentPassword}
                    </p>
                  )}
                </div>

                {/* 2. حقل كلمة المرور الجديدة */}
                <div className="space-y-1.5 text-right">
                  <label
                    htmlFor="new-password-input"
                    className="block text-sm font-bold text-candy-ink font-sans"
                  >
                    كلمة المرور الجديدة <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="new-password-input"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errors.newPassword) {
                          setErrors((prev) => ({ ...prev, newPassword: undefined }));
                        }
                      }}
                      autoComplete="new-password"
                      placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                      aria-invalid={Boolean(errors.newPassword)}
                      aria-describedby={errors.newPassword ? 'new-password-error' : 'new-password-helper'}
                      className={cn(
                        'w-full h-12 pr-4 pl-12 rounded-[14px] font-sans text-sm text-candy-ink bg-candy-soft/60 border border-candy-line transition-all duration-200 outline-none',
                        'placeholder:text-candy-muted',
                        'focus:bg-white focus:border-candy-berry focus:ring-2 focus:ring-candy-strawberry/20',
                        errors.newPassword &&
                          'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20 text-rose-900 bg-rose-50/30'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-candy-muted hover:text-candy-ink hover:bg-candy-soft transition-colors focus:outline-none focus:ring-2 focus:ring-candy-strawberry/30"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword ? (
                    <p
                      id="new-password-error"
                      role="alert"
                      className="text-xs font-semibold text-rose-600 font-sans mt-1"
                    >
                      {errors.newPassword}
                    </p>
                  ) : (
                    <p id="new-password-helper" className="text-xs text-candy-muted font-sans mt-1">
                      يجب ألا تقل كلمة المرور عن 6 خانات، ويفضل أن تحتوي على حروف وأرقام.
                    </p>
                  )}
                </div>

                {/* 3. حقل تأكيد كلمة المرور الجديدة */}
                <div className="space-y-1.5 text-right">
                  <label
                    htmlFor="confirm-password-input"
                    className="block text-sm font-bold text-candy-ink font-sans"
                  >
                    تأكيد كلمة المرور الجديدة <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password-input"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) {
                          setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                        }
                      }}
                      autoComplete="new-password"
                      placeholder="أعد كتابة كلمة المرور الجديدة"
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                      className={cn(
                        'w-full h-12 pr-4 pl-12 rounded-[14px] font-sans text-sm text-candy-ink bg-candy-soft/60 border border-candy-line transition-all duration-200 outline-none',
                        'placeholder:text-candy-muted',
                        'focus:bg-white focus:border-candy-berry focus:ring-2 focus:ring-candy-strawberry/20',
                        errors.confirmPassword &&
                          'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20 text-rose-900 bg-rose-50/30'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-candy-muted hover:text-candy-ink hover:bg-candy-soft transition-colors focus:outline-none focus:ring-2 focus:ring-candy-strawberry/30"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p
                      id="confirm-password-error"
                      role="alert"
                      className="text-xs font-semibold text-rose-600 font-sans mt-1"
                    >
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* أزرار الإجراءات (حفظ ورجوع) */}
                <div className="pt-4 border-t border-candy-line/60 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push('/admin/orders')}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                    rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
                  >
                    رجوع للطلبات
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    className="w-full sm:w-auto min-w-[150px]"
                    leftIcon={<Save className="w-4 h-4" aria-hidden="true" />}
                  >
                    حفظ كلمة المرور
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* لوحة إرشادات الأمان الجانبية */}
        <div className="space-y-4">
          <Card elevation="sm" className="border-candy-line bg-candy-soft/60">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2 text-candy-berry">
                <Lock className="w-4 h-4" aria-hidden="true" />
                <CardTitle className="text-sm font-bold font-sans">
                  إرشادات الأمان
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2.5 text-xs text-candy-muted font-sans leading-relaxed">
              <p>• كلمة المرور يجب ألا تقل عن 6 خانات.</p>
              <p>• احرص على استخدام مزيج من الأحرف والأرقام لتعزيز أمان الحساب.</p>
              <p>• لا تشارك كلمة المرور مع أي شخص أو موظف آخر.</p>
              <p>• في حال نسيان كلمة المرور، يمكن للمدير إعادة تعيينها من قسم فريق العمل (SCR-19).</p>
            </CardContent>
          </Card>

          <Card elevation="sm" className="border-candy-line bg-white">
            <CardContent className="p-4 space-y-2 text-xs font-sans text-candy-muted">
              <span className="font-bold text-candy-ink block">بيانات الحساب الحالي:</span>
              <div className="flex justify-between py-1 border-b border-candy-line/40">
                <span>اسم المستخدم:</span>
                <span className="font-semibold text-candy-ink" dir="ltr">
                  {user?.username}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-candy-line/40">
                <span>البريد الإلكتروني:</span>
                <span className="font-semibold text-candy-ink" dir="ltr">
                  {user?.email}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>الدور:</span>
                <span className="font-semibold text-candy-berry">
                  {role === 'manager' ? 'مدير المتجر' : 'موظف تشغيل'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
