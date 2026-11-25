'use client';

import * as React from 'react';
import {
  Search,
  ShieldCheck,
  User,
  KeyRound,
  Edit2,
  Power,
  Mail,
  Calendar,
  Briefcase,
  Users,
} from 'lucide-react';
import type { AdminUser, AdminRole } from '@/types';
import { Button } from '@/components/ui/button';
import { getUserInitials } from './users-store';
import { getArabicRoleLabel } from '@/lib/auth/authorization';
import { cn } from '@/lib/utils';

export interface AdminUsersTableProps {
  users: AdminUser[];
  currentUserId?: string;
  onEditUser: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
  isLastManager: (userId: string) => boolean;
  isLoading?: boolean;
}

export interface RoleCapabilityScope {
  summary: string;
  description: string;
  capabilities: string[];
}

export function getRolePermissionScope(role: AdminRole): RoleCapabilityScope {
  if (role === 'manager') {
    return {
      summary: 'صلاحيات كاملة',
      description: 'إدارة شاملة لجميع أقسام المتجر وفريق العمل',
      capabilities: ['إدارة الطلبات', 'المنتجات والتصنيفات', 'المستخدمون والصلاحيات', 'مناطق التوصيل'],
    };
  }
  return {
    summary: 'معالجة الطلبات',
    description: 'تشغيل وتجهيز الطلبات وتحديث توفر المخزون',
    capabilities: ['معالجة وتجهيز الطلبات', 'تحديث توفر المنتجات', 'متابعة الشحن'],
  };
}

export function AdminUsersTable({
  users,
  currentUserId,
  onEditUser,
  onToggleStatus,
  onResetPassword,
  isLastManager,
  isLoading = false,
}: AdminUsersTableProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<'all' | AdminRole>('all');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');

  // تصفية وتصفح المستخدمين
  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      // 1. فلتر البحث (الاسم الكامل، المسمى الوظيفي، اسم المستخدم، البريد)
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const matchesName = u.fullName.toLowerCase().includes(query);
        const matchesJobTitle = Boolean(u.jobTitle?.toLowerCase().includes(query));
        const matchesUsername = u.username.toLowerCase().includes(query);
        const matchesEmail = u.email.toLowerCase().includes(query);
        if (!matchesName && !matchesJobTitle && !matchesUsername && !matchesEmail) {
          return false;
        }
      }

      // 2. فلتر الدور
      if (roleFilter !== 'all' && u.role !== roleFilter) {
        return false;
      }

      // 3. فلتر الحالة
      if (statusFilter === 'active' && !u.isActive) {
        return false;
      }
      if (statusFilter === 'inactive' && u.isActive) {
        return false;
      }

      return true;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  // هيكل تحميل محايد عند جلب البيانات
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="جاري تحميل المستخدمين...">
        <div className="h-16 bg-candy-cream rounded-2xl border border-candy-line" />
        <div className="hidden md:block h-64 bg-candy-cream rounded-2xl border border-candy-line" />
        <div className="md:hidden space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-56 bg-candy-cream rounded-2xl border border-candy-line" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* شريط البحث والفلاتر */}
      <div className="p-4 rounded-2xl bg-candy-cream border border-candy-line shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* حقل البحث */}
        <div className="relative flex-1 min-w-[240px]">
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-candy-muted pointer-events-none">
            <Search className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، المسمى الوظيفي، اسم المستخدم، أو البريد..."
            className="w-full h-10 pr-10 pl-4 rounded-xl text-xs sm:text-sm font-sans bg-candy-soft/60 border border-candy-line text-candy-ink placeholder:text-candy-muted focus:outline-none focus:bg-candy-cream focus:border-candy-berry focus:ring-2 focus:ring-candy-strawberry/20 transition-all"
          />
        </div>

        {/* فلاتر الدور والحالة */}
        <div className="flex flex-wrap items-center gap-2">
          {/* فلتر الدور */}
          <div className="flex items-center gap-1 p-1 bg-candy-soft/60 rounded-xl border border-candy-line text-xs font-sans">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={cn(
                'min-h-[36px] px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center',
                roleFilter === 'all'
                  ? 'bg-candy-cream text-candy-berry shadow-xs'
                  : 'text-candy-muted hover:text-candy-ink'
              )}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('manager')}
              className={cn(
                'min-h-[36px] px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1',
                roleFilter === 'manager'
                  ? 'bg-candy-cream text-candy-berry shadow-xs'
                  : 'text-candy-muted hover:text-candy-ink'
              )}
            >
              <span>المديرون</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('staff')}
              className={cn(
                'min-h-[36px] px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1',
                roleFilter === 'staff'
                  ? 'bg-candy-cream text-candy-berry shadow-xs'
                  : 'text-candy-muted hover:text-candy-ink'
              )}
            >
              <span>الموظفون</span>
            </button>
          </div>

          {/* فلتر الحالة */}
          <div className="flex items-center gap-1 p-1 bg-candy-soft/60 rounded-xl border border-candy-line text-xs font-sans">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={cn(
                'min-h-[36px] px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center',
                statusFilter === 'all'
                  ? 'bg-candy-cream text-candy-ink shadow-xs'
                  : 'text-candy-muted hover:text-candy-ink'
              )}
            >
              الحالة
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={cn(
                'min-h-[36px] px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1',
                statusFilter === 'active'
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs'
                  : 'text-candy-muted hover:text-candy-ink'
              )}
            >
              <span>نشط</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={cn(
                'min-h-[36px] px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1',
                statusFilter === 'inactive'
                  ? 'bg-rose-50 text-rose-800 shadow-xs'
                  : 'text-candy-muted hover:text-candy-ink'
              )}
            >
              <span>معطل</span>
            </button>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي: جدول لسطح المكتب وبطاقات للجوال */}
      {filteredUsers.length === 0 ? (
        <div className="p-12 text-center bg-candy-cream rounded-3xl border border-candy-line shadow-sm space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-candy-soft text-candy-berry flex items-center justify-center">
            <Users className="w-7 h-7" aria-hidden="true" />
          </div>
          <h3 className="font-display font-bold text-base text-candy-ink">
            لا يوجد أعضاء يطابقون خيارات البحث
          </h3>
          <p className="font-sans text-xs text-candy-muted max-w-sm mx-auto">
            جرّب تغيير كلمات البحث أو إعادة ضبط الفلاتر لعرض فريق العمل.
          </p>
          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
              className="mt-2"
            >
              إعادة تعيين الفلاتر
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* جدول سطح المكتب (Desktop Table: شاشات md وما فوق) */}
          <div className="hidden md:block overflow-hidden rounded-2xl bg-candy-cream border border-candy-line shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-candy-line/60 bg-candy-soft/50 text-candy-muted font-sans text-xs font-bold uppercase tracking-wider">
                    <th scope="col" className="py-3.5 px-4">
                      عضو الفريق
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      المسمى الوظيفي
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      البريد الإلكتروني
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      الدور (RBAC)
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      نطاق الصلاحيات
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      الحالة
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      تاريخ الإضافة
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-center">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-candy-line/50 font-sans text-xs sm:text-sm">
                  {filteredUsers.map((member) => {
                    const isSelf = currentUserId === member.id;
                    const isLast = isLastManager(member.id);
                    const permissionScope = getRolePermissionScope(member.role);

                    return (
                      <tr
                        key={member.id}
                        className={cn(
                          'hover:bg-candy-soft/30 transition-colors',
                          !member.isActive && 'bg-gray-50/60 opacity-80'
                        )}
                      >
                        {/* عمود الأفاتار والاسم واسم المستخدم */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border shadow-xs select-none',
                                member.role === 'manager'
                                  ? 'bg-candy-berry text-white border-candy-berry-dark'
                                  : 'bg-candy-blush text-candy-berry border-candy-line-dark'
                              )}
                              aria-hidden="true"
                            >
                              {getUserInitials(member.fullName)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-candy-ink truncate">
                                  {member.fullName}
                                </span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-candy-soft text-candy-berry border border-candy-ink font-bold">
                                    أنت
                                  </span>
                                )}
                              </div>
                              <span className="text-candy-muted text-xs block font-mono" dir="ltr">
                                @{member.username}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* عمود المسمى الوظيفي المنفصل */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Briefcase className="w-3.5 h-3.5 text-candy-muted shrink-0" aria-hidden="true" />
                            <span className={cn('font-medium', member.jobTitle ? 'text-candy-ink' : 'text-candy-muted italic')}>
                              {member.jobTitle || 'غير محدد'}
                            </span>
                          </div>
                        </td>

                        {/* البريد الإلكتروني */}
                        <td className="py-3.5 px-4">
                          <span className="text-candy-ink font-mono text-xs" dir="ltr">
                            {member.email}
                          </span>
                        </td>

                        {/* شارة الدور الموحدة باللغة العربية حصراً */}
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-bold border select-none',
                              member.role === 'manager'
                                ? 'bg-candy-berry text-white border-candy-berry-dark shadow-xs'
                                : 'bg-candy-blush text-candy-berry border-candy-rose/30'
                            )}
                          >
                            {member.role === 'manager' ? (
                              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                            ) : (
                              <User className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                            <span>{getArabicRoleLabel(member.role)}</span>
                          </span>
                        </td>

                        {/* ملخص نطاق الصلاحيات واستعراض القدرات المضغوط */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1 max-w-[200px]">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border',
                                member.role === 'manager'
                                  ? 'bg-candy-soft text-candy-berry border-candy-ink'
                                  : 'bg-gray-100 text-gray-700 border-gray-200'
                              )}
                            >
                              {permissionScope.summary}
                            </span>
                            <p
                              className="text-[11px] text-candy-muted leading-tight truncate"
                              title={permissionScope.capabilities.join(' • ')}
                            >
                              {permissionScope.capabilities.join(' • ')}
                            </p>
                          </div>
                        </td>

                        {/* شارة الحالة (نشط / معطل) */}
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-semibold select-none',
                              member.isActive
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            )}
                          >
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                member.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                              )}
                              aria-hidden="true"
                            />
                            <span>{member.isActive ? 'نشط' : 'معطل'}</span>
                          </span>
                        </td>

                        {/* تاريخ الإنشاء */}
                        <td className="py-3.5 px-4 text-candy-muted text-xs">
                          {formatDate(member.createdAt)}
                        </td>

                        {/* أزرار الإجراءات */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* تعديل الدور والبيانات */}
                            <button
                              type="button"
                              onClick={() => onEditUser(member)}
                              disabled={isSelf}
                              className={cn(
                                'p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-candy-strawberry/30',
                                isSelf
                                  ? 'opacity-30 cursor-not-allowed text-candy-muted'
                                  : 'text-candy-ink hover:text-candy-berry hover:bg-candy-soft'
                              )}
                              title={
                                isSelf
                                  ? 'لا يمكن تعديل دور حسابك الحالي أثناء تسجيل الدخول'
                                  : 'تعديل الدور والبيانات'
                              }
                              aria-label={`تعديل دور ${member.fullName}`}
                            >
                              <Edit2 className="w-4 h-4" aria-hidden="true" />
                            </button>

                            {/* إعادة تعيين كلمة المرور */}
                            <button
                              type="button"
                              onClick={() => onResetPassword(member)}
                              className="p-1.5 rounded-lg text-amber-700 hover:text-amber-800 hover:bg-amber-50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                              title="إعادة تعيين كلمة المرور وتوليد مؤقتة"
                              aria-label={`إعادة تعيين كلمة مرور ${member.fullName}`}
                            >
                              <KeyRound className="w-4 h-4" aria-hidden="true" />
                            </button>

                            {/* تفعيل / تعطيل الحساب مع فحص حظر إيقاف آخر مدير نشط أو الحساب الذاتي */}
                            <button
                              type="button"
                              onClick={() => onToggleStatus(member)}
                              disabled={isSelf || (isLast && member.isActive)}
                              className={cn(
                                'p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2',
                                isSelf || (isLast && member.isActive)
                                  ? 'opacity-30 cursor-not-allowed text-candy-muted'
                                  : member.isActive
                                  ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 focus:ring-rose-500/30'
                                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 focus:ring-emerald-500/30'
                              )}
                              title={
                                isSelf
                                  ? 'لا يمكن إيقاف حسابك الحالي أثناء تسجيل الدخول'
                                  : isLast && member.isActive
                                  ? 'لا يمكن إيقاف آخر مدير نشط في النظام'
                                  : member.isActive
                                  ? 'إيقاف الحساب'
                                  : 'تفعيل الحساب'
                              }
                              aria-label={
                                member.isActive
                                  ? `إيقاف حساب ${member.fullName}`
                                  : `تفعيل حساب ${member.fullName}`
                              }
                            >
                              <Power className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* بطاقات الجوال المكدسة القابلة للوصول (Mobile Stacked Cards: شاشات أصغر من md مع أهداف لمس 48px كحد أدنى) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {filteredUsers.map((member) => {
              const isSelf = currentUserId === member.id;
              const isLast = isLastManager(member.id);
              const permissionScope = getRolePermissionScope(member.role);

              return (
                <div
                  key={member.id}
                  className={cn(
                    'p-4 rounded-2xl bg-candy-cream border border-candy-line shadow-sm space-y-3 font-sans transition-all',
                    !member.isActive && 'bg-gray-50/70 border-gray-200 opacity-85'
                  )}
                >
                  {/* رأس البطاقة: الأفاتار، الاسم، المعرف، وشارة الدور الموحدة */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border shadow-xs select-none',
                          member.role === 'manager'
                            ? 'bg-candy-berry text-white border-candy-berry-dark'
                            : 'bg-candy-blush text-candy-berry border-candy-line-dark'
                        )}
                        aria-hidden="true"
                      >
                        {getUserInitials(member.fullName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-base text-candy-ink truncate">
                            {member.fullName}
                          </h4>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-candy-soft text-candy-berry border border-candy-ink font-bold">
                              أنت
                            </span>
                          )}
                        </div>
                        <p className="text-candy-muted text-xs font-mono truncate" dir="ltr">
                          @{member.username}
                        </p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-xs font-bold border shrink-0',
                        member.role === 'manager'
                          ? 'bg-candy-berry text-white border-candy-berry-dark'
                          : 'bg-candy-blush text-candy-berry border-candy-rose/30'
                      )}
                    >
                      {member.role === 'manager' ? (
                        <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <User className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>{getArabicRoleLabel(member.role)}</span>
                    </span>
                  </div>

                  {/* تفاصيل المسمى الوظيفي والبريد الإلكتروني */}
                  <div className="pt-2 border-t border-candy-line/60 space-y-1.5 text-xs">
                    {/* المسمى الوظيفي المنفصل */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-candy-muted flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-candy-muted shrink-0" aria-hidden="true" />
                        <span>المسمى الوظيفي:</span>
                      </span>
                      <span className={cn('font-semibold truncate', member.jobTitle ? 'text-candy-ink' : 'text-candy-muted italic')}>
                        {member.jobTitle || 'غير محدد'}
                      </span>
                    </div>

                    {/* البريد الإلكتروني */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-candy-muted flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-candy-muted shrink-0" aria-hidden="true" />
                        <span>البريد:</span>
                      </span>
                      <span className="font-mono text-candy-ink truncate" dir="ltr">
                        {member.email}
                      </span>
                    </div>
                  </div>

                  {/* تفاصيل نطاق الصلاحيات والقدرات المتاحة */}
                  <div className="pt-2 border-t border-candy-line/60 space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-candy-muted">نطاق الصلاحيات:</span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border',
                          member.role === 'manager'
                            ? 'bg-candy-soft text-candy-berry border-candy-ink'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        )}
                      >
                        {permissionScope.summary}
                      </span>
                    </div>
                    <p className="text-[11px] text-candy-muted leading-relaxed">
                      {permissionScope.capabilities.join(' • ')}
                    </p>
                  </div>

                  {/* الحالة وتاريخ الإضافة */}
                  <div className="pt-2 border-t border-candy-line/60 flex items-center justify-between text-xs text-candy-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-candy-muted" aria-hidden="true" />
                      <span>{formatDate(member.createdAt)}</span>
                    </span>

                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[11px] font-semibold shrink-0',
                        member.isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          member.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                        )}
                        aria-hidden="true"
                      />
                      <span>{member.isActive ? 'نشط' : 'معطل'}</span>
                    </span>
                  </div>

                  {/* أزرار الإجراءات على بطاقة الجوال (مع ضمان أهداف لمس لا تقل عن 48px: min-h-[48px] h-12) */}
                  <div className="pt-3 border-t border-candy-line/60 flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => onEditUser(member)}
                      disabled={isSelf}
                      leftIcon={<Edit2 className="w-4 h-4" aria-hidden="true" />}
                      className="w-full min-h-[48px] h-12 text-xs font-sans font-semibold justify-center"
                      title={
                        isSelf
                          ? 'لا يمكن تعديل دور حسابك الحالي أثناء تسجيل الدخول'
                          : 'تعديل الدور والبيانات'
                      }
                    >
                      تعديل الدور والبيانات
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => onResetPassword(member)}
                      leftIcon={<KeyRound className="w-4 h-4 text-amber-600" aria-hidden="true" />}
                      className="w-full min-h-[48px] h-12 text-xs font-sans font-semibold text-amber-900 border-amber-200 hover:bg-amber-50 justify-center"
                      title="إعادة تعيين كلمة المرور وتوليد كلمة مؤقتة"
                    >
                      إعادة تعيين كلمة المرور
                    </Button>

                    <Button
                      type="button"
                      variant={member.isActive ? 'secondary' : 'primary'}
                      onClick={() => onToggleStatus(member)}
                      disabled={isSelf || (isLast && member.isActive)}
                      leftIcon={<Power className="w-4 h-4" aria-hidden="true" />}
                      className={cn(
                        'w-full min-h-[48px] h-12 text-xs font-sans font-semibold justify-center',
                        member.isActive && !isLast && !isSelf
                          ? 'text-rose-700 border-rose-200 hover:bg-rose-50'
                          : ''
                      )}
                      title={
                        isSelf
                          ? 'لا يمكن إيقاف حسابك الحالي أثناء تسجيل الدخول'
                          : isLast && member.isActive
                          ? 'لا يمكن إيقاف آخر مدير نشط في النظام'
                          : member.isActive
                          ? 'إيقاف الحساب'
                          : 'تفعيل الحساب'
                      }
                    >
                      {member.isActive ? 'إيقاف الحساب' : 'تفعيل الحساب'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
