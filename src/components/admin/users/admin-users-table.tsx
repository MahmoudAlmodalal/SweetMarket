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
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
} from 'lucide-react';
import type { AdminUser, AdminRole } from '@/types';
import { Button } from '@/components/ui/button';
import { getUserInitials } from './users-store';
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
      // 1. فلتر البحث
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const matchesName = u.fullName.toLowerCase().includes(query);
        const matchesUsername = u.username.toLowerCase().includes(query);
        const matchesEmail = u.email.toLowerCase().includes(query);
        if (!matchesName && !matchesUsername && !matchesEmail) {
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

  return (
    <div className="space-y-4">
      {/* شريط البحث والفلاتر */}
      <div className="p-4 rounded-2xl bg-white border border-candy-line shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* حقل البحث */}
        <div className="relative flex-1 min-w-[240px]">
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-candy-muted pointer-events-none">
            <Search className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، اسم المستخدم، أو البريد..."
            className="w-full h-10 pr-10 pl-4 rounded-xl text-xs sm:text-sm font-sans bg-candy-soft/60 border border-candy-line text-candy-ink placeholder:text-candy-muted focus:outline-none focus:bg-white focus:border-candy-berry focus:ring-2 focus:ring-candy-strawberry/20 transition-all"
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
                'px-2.5 py-1 rounded-lg font-semibold transition-colors',
                roleFilter === 'all'
                  ? 'bg-white text-candy-berry shadow-xs'
                  : 'text-candy-muted hover:text-candy-ink'
              )}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('manager')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1',
                roleFilter === 'manager'
                  ? 'bg-white text-candy-berry shadow-xs'
                  : 'text-candy-muted hover:text-candy-ink'
              )}
            >
              <span>المديرون</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('staff')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1',
                roleFilter === 'staff'
                  ? 'bg-white text-candy-berry shadow-xs'
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
                'px-2.5 py-1 rounded-lg font-semibold transition-colors',
                statusFilter === 'all'
                  ? 'bg-white text-candy-ink shadow-xs'
                  : 'text-candy-muted hover:text-candy-ink'
              )}
            >
              الحالة
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1',
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
                'px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1',
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
        <div className="p-12 text-center bg-white rounded-3xl border border-candy-line shadow-sm space-y-3">
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
          {/* جدول سطح المكتب (Desktop Table: شاشات متوسطة وأكبر) */}
          <div className="hidden md:block overflow-hidden rounded-2xl bg-white border border-candy-line shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-candy-line/60 bg-candy-soft/50 text-candy-muted font-sans text-xs font-bold uppercase tracking-wider">
                    <th scope="col" className="py-3.5 px-4">
                      عضو الفريق
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      البريد الإلكتروني
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      الدور (RBAC)
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
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-candy-soft text-candy-berry border border-candy-blush font-bold">
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

                        {/* البريد الإلكتروني */}
                        <td className="py-3.5 px-4">
                          <span className="text-candy-ink font-mono text-xs" dir="ltr">
                            {member.email}
                          </span>
                        </td>

                        {/* شارة الدور (مدير / موظف) */}
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border select-none',
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
                            <span>{member.role === 'manager' ? 'مدير' : 'موظف'}</span>
                          </span>
                        </td>

                        {/* شارة الحالة (نشط / معطل) */}
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold select-none',
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
                              className="p-1.5 rounded-lg text-candy-ink hover:text-candy-berry hover:bg-candy-soft transition-colors focus:outline-none focus:ring-2 focus:ring-candy-strawberry/30"
                              title="تعديل الدور والبيانات"
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

                            {/* تفعيل / تعطيل الحساب مع فحص حظر إيقاف آخر مدير نشط */}
                            <button
                              type="button"
                              onClick={() => onToggleStatus(member)}
                              disabled={isLast && member.isActive}
                              className={cn(
                                'p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2',
                                isLast && member.isActive
                                  ? 'opacity-30 cursor-not-allowed text-candy-muted'
                                  : member.isActive
                                  ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 focus:ring-rose-500/30'
                                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 focus:ring-emerald-500/30'
                              )}
                              title={
                                isLast && member.isActive
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

          {/* بطاقات الجوال (Mobile Cards: شاشات أصغر من md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredUsers.map((member) => {
              const isSelf = currentUserId === member.id;
              const isLast = isLastManager(member.id);

              return (
                <div
                  key={member.id}
                  className={cn(
                    'p-4 rounded-2xl bg-white border border-candy-line shadow-sm space-y-3 font-sans transition-all',
                    !member.isActive && 'bg-gray-50/70 border-gray-200 opacity-80'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border shadow-xs select-none',
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
                          <h4 className="font-bold text-sm text-candy-ink truncate">
                            {member.fullName}
                          </h4>
                          {isSelf && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-candy-soft text-candy-berry border border-candy-blush font-bold">
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
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0',
                        member.role === 'manager'
                          ? 'bg-candy-berry text-white border-candy-berry-dark'
                          : 'bg-candy-blush text-candy-berry border-candy-rose/30'
                      )}
                    >
                      {member.role === 'manager' ? (
                        <ShieldCheck className="w-3 h-3" />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                      <span>{member.role === 'manager' ? 'مدير' : 'موظف'}</span>
                    </span>
                  </div>

                  <div className="pt-2 border-t border-candy-line/60 flex items-center justify-between text-xs text-candy-muted">
                    <div className="flex items-center gap-1 font-mono truncate" dir="ltr">
                      <Mail className="w-3.5 h-3.5 text-candy-muted shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>

                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0',
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

                  {/* أزرار الإجراءات على بطاقة الجوال */}
                  <div className="pt-2 border-t border-candy-line/60 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onEditUser(member)}
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      className="text-xs font-sans h-8 px-2.5"
                    >
                      تعديل الدور
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onResetPassword(member)}
                      leftIcon={<KeyRound className="w-3.5 h-3.5 text-amber-600" />}
                      className="text-xs font-sans h-8 px-2.5 text-amber-900 border-amber-200 hover:bg-amber-50"
                    >
                      كلمة مرور
                    </Button>

                    <Button
                      type="button"
                      variant={member.isActive ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => onToggleStatus(member)}
                      disabled={isLast && member.isActive}
                      leftIcon={<Power className="w-3.5 h-3.5" />}
                      className={cn(
                        'text-xs font-sans h-8 px-2.5',
                        member.isActive && !isLast
                          ? 'text-rose-700 border-rose-200 hover:bg-rose-50'
                          : ''
                      )}
                    >
                      {member.isActive ? 'إيقاف' : 'تفعيل'}
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
