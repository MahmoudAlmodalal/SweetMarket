'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  ShieldAlert,
  ChevronLeft,
  KeyRound,
  AlertCircle,
  Loader2,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { useAdminAuth } from '@/context/admin-auth-context';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AdminUsersTable,
  UserRoleDialog,
  TempPasswordDialog,
  useAdminUsers,
  type UserFormData,
} from '@/components/admin/users';
import type { AdminUser } from '@/types';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentAdmin, role, isManager, isLoading: isAuthLoading, switchRole } = useAdminAuth();

  const {
    users,
    isLoading: isUsersLoading,
    activeManagersCount,
    totalActiveCount,
    addUser,
    updateUser,
    toggleUserStatus,
    resetPassword,
    isLastActiveManager,
  } = useAdminUsers();

  // Dialogs state
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = React.useState<AdminUser | null>(null);

  const [tempPasswordDialogOpen, setTempPasswordDialogOpen] = React.useState(false);
  const [tempPasswordData, setTempPasswordData] = React.useState<{
    user: AdminUser | null;
    temporaryPassword: string;
    isNewUser: boolean;
  }>({
    user: null,
    temporaryPassword: '',
    isNewUser: false,
  });

  const [confirmDeactivateUser, setConfirmDeactivateUser] = React.useState<AdminUser | null>(null);

  // حظر الوصول لغير دور المدير (RBAC Enforcement)
  // إذا كان المستخدم موظفاً (role === 'staff')، يتم توجيهه تلقائياً إلى /admin/forbidden?from=/admin/users
  React.useEffect(() => {
    if (!isAuthLoading && !isManager) {
      router.replace('/admin/forbidden?from=/admin/users');
    }
  }, [isAuthLoading, isManager, router]);

  // حالة انتظار التحقق من المصادقة والصلاحيات
  if (isAuthLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="w-8 h-8 text-candy-berry animate-spin mb-3" aria-hidden="true" />
        <p className="font-sans font-bold text-sm text-candy-ink">جاري التحقق من صلاحيات المدير...</p>
      </div>
    );
  }

  // في حال كان المستخدم موظفاً وقبل اكتمال التوجيه إلى صفحة الحظر (Fallback Message)
  if (!isManager) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-white border border-candy-line shadow-candy-2 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border-2 border-rose-100 text-rose-600 mx-auto flex items-center justify-center animate-pulse">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
        </div>
        <h2 className="font-display font-bold text-xl text-candy-ink">
          وصول محظور (403) • هذه الصفحة للمدير فقط
        </h2>
        <p className="font-sans text-xs text-candy-muted max-w-md mx-auto leading-relaxed">
          حسابك الحالي يحمل دور <strong>موظف (Staff)</strong>، ولا يملك صلاحية إدارة المستخدمين وتعيين الأدوار (SCR-19).
        </p>
        <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            type="button"
            variant="primary"
            onClick={() => switchRole('manager')}
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            التبديل لدور مدير
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/admin/orders')}
          >
            العودة للطلبات
          </Button>
        </div>
      </div>
    );
  }

  // معالجات الإجراءات
  const handleOpenAdd = () => {
    setSelectedUserForEdit(null);
    setRoleDialogOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setSelectedUserForEdit(user);
    setRoleDialogOpen(true);
  };

  const handleSaveUser = async (data: UserFormData, isEdit: boolean) => {
    if (isEdit && selectedUserForEdit) {
      await updateUser(selectedUserForEdit.id, data);
      toast.success('تم تحديث العضو بنجاح', `تم تحديث بيانات ودور "${data.fullName}" في النظام.`);
    } else {
      const result = await addUser(data);
      toast.success('تمت إضافة العضو بنجاح', `تم إنشاء حساب "${data.fullName}" وتعيين كلمة المرور المؤقتة.`);
      // فتح نافذة عرض كلمة المرور المؤقتة لمرة واحدة
      setTempPasswordData({
        user: result.user,
        temporaryPassword: result.temporaryPassword,
        isNewUser: true,
      });
      setTempPasswordDialogOpen(true);
    }
  };

  const handleToggleStatusClick = async (user: AdminUser) => {
    // إذا كان الحساب نشطاً وسيتم إيقافه، نتحقق من حظر إيقاف آخر مدير نشط أولاً
    if (user.isActive) {
      if (user.role === 'manager' && isLastActiveManager(user.id)) {
        toast.error(
          'لا يمكن إيقاف الحساب',
          'هذا الحساب هو المدير النشط الوحيد المتبقي في النظام، يجب وجود مدير نشط واحد على الأقل.'
        );
        return;
      }
      // إظهار نافذة تأكيد الإيقاف
      setConfirmDeactivateUser(user);
    } else {
      // التفعيل الفوري
      try {
        await toggleUserStatus(user.id);
        toast.success('تم تفعيل الحساب', `تمت استعادة تفعيل حساب "${user.fullName}" بنجاح.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'فشل تفعيل الحساب';
        toast.error('خطأ في العملية', msg);
      }
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!confirmDeactivateUser) return;
    try {
      await toggleUserStatus(confirmDeactivateUser.id);
      toast.info('تم إيقاف الحساب', `تم تعطيل حساب "${confirmDeactivateUser.fullName}" وإنهاء وصوله.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل إيقاف الحساب';
      toast.error('خطأ في العملية', msg);
    } finally {
      setConfirmDeactivateUser(null);
    }
  };

  const handleResetPassword = async (user: AdminUser) => {
    try {
      const result = await resetPassword(user.id);
      setTempPasswordData({
        user: result.user,
        temporaryPassword: result.temporaryPassword,
        isNewUser: false,
      });
      setTempPasswordDialogOpen(true);
      toast.info(
        'تم توليد كلمة مرور مؤقتة',
        `تم إعادة تعيين كلمة مرور "${user.fullName}". انسخ الكلمة المؤقتة الآن.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل إعادة التعيين';
      toast.error('خطأ في العملية', msg);
    }
  };

  // إحصائيات سريعة
  const totalUsersCount = users.length;
  const staffCount = users.filter((u) => u.role === 'staff').length;
  const managersCount = users.filter((u) => u.role === 'manager').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* مسار التصفح (Breadcrumbs) */}
      <nav aria-label="مسار التصفح" className="flex items-center gap-2 text-xs text-candy-muted font-sans">
        <Link
          href="/admin/orders"
          className="hover:text-candy-berry transition-colors flex items-center gap-1"
        >
          <span>لوحة الإدارة</span>
        </Link>
        <ChevronLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>فريق العمل</span>
        <ChevronLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span className="text-candy-ink font-bold">إدارة المستخدمين والصلاحيات (SCR-19)</span>
      </nav>

      {/* ترويسة الصفحة مع زر الإضافة الرئيسي */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white border border-candy-line shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-candy-soft text-candy-berry border border-candy-blush flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-candy-ink">
                إدارة فريق العمل والصلاحيات (RBAC)
              </h1>
              <p className="font-sans text-xs sm:text-sm text-candy-muted">
                إدارة حسابات الموظفين والمديرين، وتعيين الصلاحيات، وتوليد كلمات المرور المؤقتة.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            type="button"
            variant="primary"
            onClick={handleOpenAdd}
            leftIcon={<UserPlus className="w-4 h-4" aria-hidden="true" />}
            className="font-sans"
          >
            إضافة عضو جديد
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصاءات السريعة (KPI Metric Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-sans">
        {/* إجمالي الفريق */}
        <div className="p-4 rounded-2xl bg-white border border-candy-line shadow-sm">
          <div className="flex items-center justify-between text-candy-muted mb-2">
            <span className="text-xs font-semibold">إجمالي الفريق</span>
            <Users className="w-4 h-4 text-candy-berry" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-candy-ink">
              {totalUsersCount}
            </span>
            <span className="text-xs text-candy-muted">أعضاء مسجلين</span>
          </div>
        </div>

        {/* المديرون */}
        <div className="p-4 rounded-2xl bg-white border border-candy-line shadow-sm">
          <div className="flex items-center justify-between text-candy-muted mb-2">
            <span className="text-xs font-semibold">المديرون (Managers)</span>
            <ShieldCheck className="w-4 h-4 text-candy-berry" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-candy-ink">
              {managersCount}
            </span>
            <span className="text-xs text-candy-muted">
              ({activeManagersCount} نشط)
            </span>
          </div>
        </div>

        {/* الموظفون */}
        <div className="p-4 rounded-2xl bg-white border border-candy-line shadow-sm">
          <div className="flex items-center justify-between text-candy-muted mb-2">
            <span className="text-xs font-semibold">الموظفون (Staff)</span>
            <UserCheck className="w-4 h-4 text-candy-berry" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-candy-ink">
              {staffCount}
            </span>
            <span className="text-xs text-candy-muted">تشغيل ومخزون</span>
          </div>
        </div>

        {/* الحسابات النشطة */}
        <div className="p-4 rounded-2xl bg-white border border-candy-line shadow-sm">
          <div className="flex items-center justify-between text-candy-muted mb-2">
            <span className="text-xs font-semibold">الحسابات النشطة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-emerald-800">
              {totalActiveCount}
            </span>
            <span className="text-xs text-candy-muted">
              من أصل {totalUsersCount}
            </span>
          </div>
        </div>
      </div>

      {/* جدول وبطاقات المستخدمين الإداريين */}
      <AdminUsersTable
        users={users}
        currentUserId={currentAdmin?.id}
        onEditUser={handleOpenEdit}
        onToggleStatus={handleToggleStatusClick}
        onResetPassword={handleResetPassword}
        isLastManager={isLastActiveManager}
        isLoading={isUsersLoading}
      />

      {/* نافذة إضافة / تعديل العضو والصلاحيات */}
      <UserRoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        user={selectedUserForEdit}
        onSave={handleSaveUser}
        existingUsers={users}
        isLastManager={
          selectedUserForEdit ? isLastActiveManager(selectedUserForEdit.id) : false
        }
      />

      {/* نافذة عرض كلمة المرور المؤقتة (تُعرض مرة واحدة فقط) */}
      <TempPasswordDialog
        open={tempPasswordDialogOpen}
        onOpenChange={setTempPasswordDialogOpen}
        user={tempPasswordData.user}
        temporaryPassword={tempPasswordData.temporaryPassword}
        isNewUser={tempPasswordData.isNewUser}
      />

      {/* نافذة تأكيد إيقاف الحساب */}
      <Dialog
        open={Boolean(confirmDeactivateUser)}
        onOpenChange={(open) => !open && setConfirmDeactivateUser(null)}
      >
        <DialogContent className="max-w-md p-6 text-right font-sans">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-candy-ink">
                  تأكيد إيقاف الحساب
                </DialogTitle>
                <DialogDescription className="text-xs text-candy-muted mt-0.5">
                  سيتم منع هذا الحساب من تسجيل الدخول للوحة التحكم
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {confirmDeactivateUser && (
            <div className="space-y-3 py-2 text-xs text-candy-ink">
              <p className="leading-relaxed">
                هل أنت متأكد من رغبتك في إيقاف حساب{' '}
                <strong className="text-candy-berry font-bold">
                  {confirmDeactivateUser.fullName}
                </strong>{' '}
                (@{confirmDeactivateUser.username})؟
              </p>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed">
                لن يتمكن العضو من الوصول إلى أقسام لوحة الإدارة حتى تقوم بإعادة تفعيله مرة أخرى.
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmDeactivateUser(null)}
              className="w-full sm:w-auto text-xs"
            >
              إلغاء التراجع
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmDeactivate}
              className="w-full sm:w-auto text-xs"
            >
              نعم، إيقاف الحساب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
