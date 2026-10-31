'use client';

import * as React from 'react';
import {
  UserPlus,
  ShieldCheck,
  UserCheck,
  User,
  Mail,
  AtSign,
  AlertCircle,
  Save,
  Info,
} from 'lucide-react';
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
import type { AdminUser, AdminRole } from '@/types';
import type { UserFormData } from './users-store';
import { cn } from '@/lib/utils';

export interface UserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AdminUser | null; // إذا وُجد فنحن في وضع التعديل، وإلا ففي وضع الإضافة
  onSave: (data: UserFormData, isEdit: boolean) => Promise<void>;
  existingUsers: AdminUser[];
  isLastManager?: boolean;
}

interface FormErrors {
  fullName?: string;
  username?: string;
  email?: string;
  role?: string;
  general?: string;
}

export function UserRoleDialog({
  open,
  onOpenChange,
  user,
  onSave,
  existingUsers,
  isLastManager = false,
}: UserRoleDialogProps) {
  const isEdit = Boolean(user);

  const [fullName, setFullName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<AdminRole>('staff');
  const [isActive, setIsActive] = React.useState(true);

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // تحديث الحقول عند فتح النافذة أو تغيير المستخدم المستهدف
  React.useEffect(() => {
    if (open) {
      if (user) {
        setFullName(user.fullName);
        setUsername(user.username);
        setEmail(user.email);
        setRole(user.role);
        setIsActive(user.isActive);
      } else {
        setFullName('');
        setUsername('');
        setEmail('');
        setRole('staff');
        setIsActive(true);
      }
      setErrors({});
    }
  }, [open, user]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. الاسم الكامل
    if (!fullName.trim()) {
      newErrors.fullName = 'يرجى إدخال الاسم الكامل للعضو';
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = 'يجب ألا يقل الاسم الكامل عن 3 أحرف';
    }

    // 2. اسم المستخدم
    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername) {
      newErrors.username = 'يرجى إدخال اسم المستخدم';
    } else if (trimmedUsername.length < 3) {
      newErrors.username = 'يجب ألا يقل اسم المستخدم عن 3 أحرف';
    } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      newErrors.username = 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطة سفلية فقط';
    } else {
      const isTaken = existingUsers.some(
        (u) => (!user || u.id !== user.id) && u.username.toLowerCase() === trimmedUsername
      );
      if (isTaken) {
        newErrors.username = 'اسم المستخدم هذا مستخدم بالفعل، اختر اسماً آخر';
      }
    }

    // 3. البريد الإلكتروني
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      newErrors.email = 'يرجى إدخال البريد الإلكتروني';
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = 'صيغة البريد الإلكتروني غير صحيحة';
    } else {
      const isTaken = existingUsers.some(
        (u) => (!user || u.id !== user.id) && u.email.toLowerCase() === trimmedEmail
      );
      if (isTaken) {
        newErrors.email = 'البريد الإلكتروني مستخدم بالفعل لحساب آخر';
      }
    }

    // 4. فحص حظر تجريد آخر مدير نشط من دوره
    if (isEdit && user && user.role === 'manager' && user.isActive && isLastManager && role === 'staff') {
      newErrors.role = 'لا يمكن تحويل آخر مدير نشط إلى موظف؛ يجب ترقية مدير آخر أولاً';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave(
        {
          fullName: fullName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          role,
          isActive,
        },
        isEdit
      );
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ البيانات';
      setErrors((prev) => ({ ...prev, general: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-xl p-6 sm:p-7 text-right">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-candy-soft text-candy-berry border border-candy-blush flex items-center justify-center shrink-0 shadow-xs">
              {isEdit ? (
                <ShieldCheck className="w-6 h-6" aria-hidden="true" />
              ) : (
                <UserPlus className="w-6 h-6" aria-hidden="true" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-display font-bold text-candy-ink">
                {isEdit ? 'تعديل بيانات العضو والصلاحيات' : 'إضافة عضو جديد لفريق العمل'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-candy-muted font-sans mt-0.5">
                {isEdit
                  ? 'قم بتحديث الاسم أو البريد أو تعيين الدور الإداري المناسب'
                  : 'أدخل بيانات الموظف الجديد وسيتم تعيين كلمة مرور مؤقتة لحسابه'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errors.general && (
          <div
            role="alert"
            className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-2.5 text-xs font-sans"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="font-medium leading-relaxed">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4 font-sans">
          {/* الاسم الكامل */}
          <div className="space-y-1">
            <Input
              id="user-full-name"
              label="الاسم الكامل"
              placeholder="مثال: سارة خالد"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              error={errors.fullName}
              iconPrefix={<User className="w-4 h-4" />}
            />
          </div>

          {/* اسم المستخدم والبريد الإلكتروني */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Input
                id="user-username"
                label="اسم المستخدم"
                placeholder="مثال: sara_khaled"
                dir="ltr"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                }}
                error={errors.username}
                iconPrefix={<AtSign className="w-4 h-4" />}
              />
            </div>

            <div className="space-y-1">
              <Input
                id="user-email"
                type="email"
                label="البريد الإلكتروني"
                placeholder="sara@candyloz.com"
                dir="ltr"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                error={errors.email}
                iconPrefix={<Mail className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* تعيين الدور الإداري (RBAC Role Assignment) */}
          <div className="space-y-2 pt-1">
            <label className="block text-sm font-bold text-candy-ink select-none">
              الدور والصلاحيات الإدارية (RBAC):
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* خيار موظف تشغيل */}
              <button
                type="button"
                onClick={() => {
                  setRole('staff');
                  if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
                }}
                className={cn(
                  'p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between relative cursor-pointer',
                  role === 'staff'
                    ? 'border-candy-berry bg-candy-soft/60 shadow-candy-1 ring-2 ring-candy-strawberry/20'
                    : 'border-candy-line bg-white hover:bg-candy-soft/30 hover:border-candy-blush'
                )}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="font-bold text-sm text-candy-ink flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-candy-berry" aria-hidden="true" />
                    <span>موظف تشغيل (Staff)</span>
                  </span>
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                      role === 'staff'
                        ? 'border-candy-berry bg-candy-berry text-white'
                        : 'border-candy-line bg-white'
                    )}
                  >
                    {role === 'staff' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </div>
                <p className="text-xs text-candy-muted leading-relaxed">
                  معالجة الطلبات، تحديث حالات الشحن والتجهيز، ومتابعة توفر المخزون.
                </p>
              </button>

              {/* خيار مدير المتجر */}
              <button
                type="button"
                onClick={() => {
                  setRole('manager');
                  if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
                }}
                className={cn(
                  'p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between relative cursor-pointer',
                  role === 'manager'
                    ? 'border-candy-berry bg-candy-soft/60 shadow-candy-1 ring-2 ring-candy-strawberry/20'
                    : 'border-candy-line bg-white hover:bg-candy-soft/30 hover:border-candy-blush'
                )}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="font-bold text-sm text-candy-ink flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-candy-berry" aria-hidden="true" />
                    <span>مدير النظام (Manager)</span>
                  </span>
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                      role === 'manager'
                        ? 'border-candy-berry bg-candy-berry text-white'
                        : 'border-candy-line bg-white'
                    )}
                  >
                    {role === 'manager' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </div>
                <p className="text-xs text-candy-muted leading-relaxed">
                  صلاحيات كاملة للمتجر: إدارة الأسعار، التصنيفات، مناطق التوصيل، وفريق العمل.
                </p>
              </button>
            </div>

            {errors.role && (
              <p role="alert" className="text-xs font-semibold text-rose-600 mt-1">
                {errors.role}
              </p>
            )}

            {isLastManager && user?.role === 'manager' && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 flex items-center gap-1.5 mt-2">
                <Info className="w-4 h-4 shrink-0 text-amber-600" aria-hidden="true" />
                <span>هذا الحساب هو المدير النشط الوحيد حالياً، لا يمكن خفض صلاحياته لموظف.</span>
              </p>
            )}
          </div>

          {/* حالة تفعيل الحساب (في وضع التعديل) */}
          {isEdit && (
            <div className="pt-2 border-t border-candy-line/60">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-candy-soft/40 border border-candy-line cursor-pointer select-none">
                <div>
                  <span className="text-xs font-bold text-candy-ink block">حالة الحساب</span>
                  <span className="text-[11px] text-candy-muted block mt-0.5">
                    {isActive ? 'الحساب نشط ويمكنه تسجيل الدخول' : 'الحساب معطل وممنوع من الوصول للوحة'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  disabled={isLastManager && user?.role === 'manager'}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded text-candy-berry focus:ring-candy-strawberry/40 border-candy-line"
                />
              </label>
            </div>
          )}

          {/* تلميح توليد كلمة المرور المؤقتة عند الإضافة */}
          {!isEdit && (
            <div className="p-3 rounded-xl bg-candy-cream border border-candy-line text-xs text-candy-muted flex items-start gap-2">
              <Info className="w-4 h-4 text-candy-berry shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                سيتم توليد كلمة مرور مؤقتة وعرضها لك في نافذة منبثقة فور الضغط على حفظ.
              </span>
            </div>
          )}

          <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Save className="w-4 h-4" aria-hidden="true" />}
              className="w-full sm:w-auto min-w-[120px]"
            >
              {isEdit ? 'حفظ التعديلات' : 'إضافة العضو'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
