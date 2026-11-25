'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  KeyRound,
  LogOut,
  ArrowLeftRight,
  ShieldCheck,
  User,
  Store,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { useAdminAuth } from '@/context/admin-auth-context';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

export interface AdminNavbarProps {
  onMenuToggle?: () => void;
  title?: string;
  className?: string;
}

/**
 * استخراج عنوان الصفحة تلقائياً من المسار الحالي
 */
function resolvePageTitle(pathname: string): string {
  if (pathname.startsWith('/admin/orders')) {
    return 'إدارة الطلبات';
  }
  if (pathname.startsWith('/admin/products')) {
    return 'إدارة المنتجات';
  }
  if (pathname.startsWith('/admin/categories')) {
    return 'إدارة التصنيفات';
  }
  if (pathname.startsWith('/admin/zones')) {
    return 'مناطق التوصيل';
  }
  if (pathname.startsWith('/admin/users')) {
    return 'فريق العمل';
  }
  if (pathname.startsWith('/admin/account/password')) {
    return 'تغيير كلمة المرور';
  }
  if (pathname.startsWith('/admin/account')) {
    return 'إعدادات الحساب';
  }
  return 'لوحة الإدارة';
}

export function AdminNavbar({ onMenuToggle, title, className }: AdminNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, switchRole, logout } = useAdminAuth();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);

  const currentTitle = title || resolvePageTitle(pathname);

  const handleRoleToggle = () => {
    const nextRole: 'manager' | 'staff' = role === 'manager' ? 'staff' : 'manager';
    switchRole(nextRole);
    toast.info(
      nextRole === 'manager' ? 'تم التبديل إلى دور مدير (Manager)' : 'تم التبديل إلى دور موظف (Staff)',
      'تم تحديث صلاحيات الحساب للاختبار'
    );
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    toast.info('تم تسجيل الخروج بنجاح');
    router.push('/admin/login');
  };

  // Close logout confirmation popover on click outside or escape key
  useEffect(() => {
    if (!showLogoutConfirm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLogoutConfirm(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) {
        setShowLogoutConfirm(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLogoutConfirm]);

  const isPasswordPage = pathname === '/admin/account/password';

  return (
    <header
      className={cn(
        'h-16 border-b border-candy-line/80 bg-white/95  sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between shadow-xs transition-colors',
        className
      )}
    >
      {/* Right side: Mobile Menu Button & Current Page Title */}
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label="فتح القائمة الجانبية"
            className="lg:hidden p-2 rounded-xl text-candy-ink hover:text-candy-berry hover:bg-candy-soft transition-colors focus:outline-none focus:ring-2 focus:ring-candy-strawberry/30 shrink-0"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
        )}

        <div className="flex flex-col text-right min-w-0">
          <h1 className="font-display font-bold text-base sm:text-xl text-candy-ink leading-tight truncate">
            {currentTitle}
          </h1>
          <span className="font-sans text-[11px] text-candy-muted hidden sm:inline truncate">
            لوحة إدارة متجر كاندي لوز
          </span>
        </div>
      </div>

      {/* Center/Left: Branch Indicator & Role Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div
          className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-candy-soft/70 border border-candy-line text-xs font-sans text-candy-ink"
          title="الفرع الإداري النشط: خان يونس - المتجر الرئيسي"
        >
          <Store className="w-3.5 h-3.5 text-candy-berry shrink-0" aria-hidden="true" />
          <span className="text-candy-muted">الفرع:</span>
          <span className="font-bold text-candy-ink">خان يونس (الرئيسي)</span>
        </div>

        <div
          className="hidden md:flex xl:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-candy-soft/70 border border-candy-line text-xs font-sans text-candy-ink"
          title="فرع خان يونس الرئيسي"
        >
          <Store className="w-3.5 h-3.5 text-candy-berry shrink-0" aria-hidden="true" />
          <span className="font-semibold text-candy-ink text-[11px]">خان يونس</span>
        </div>

        {/* Role Switcher Toggle (Manager vs Staff) */}
        <button
          type="button"
          onClick={handleRoleToggle}
          title="تبديل الدور بين موظف ومدير للمعاينة"
          aria-label="تبديل الدور بين موظف ومدير"
          className={cn(
            'group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-sans transition-colors border',
            role === 'manager'
              ? 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100/70'
              : 'bg-teal-50 text-teal-950 border-teal-200 hover:bg-teal-100/70'
          )}
        >
          <ArrowLeftRight
            className="w-3.5 h-3.5 shrink-0 text-candy-muted group-hover:text-candy-berry transition-colors"
            aria-hidden="true"
          />
          <span className="inline-flex items-center gap-1.5">
            {role === 'manager' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                <span className="font-bold text-amber-950">مدير</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                <span className="font-bold text-teal-950">موظف</span>
              </>
            )}
          </span>
        </button>

        {/* Change Password Link */}
        <Link
          href="/admin/account/password"
          title="تغيير كلمة المرور"
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-candy-pill text-xs font-semibold font-sans transition-all duration-200 border',
            isPasswordPage
              ? 'bg-candy-berry text-white border-candy-berry shadow-candy-1 font-bold'
              : 'bg-candy-soft text-candy-ink border-candy-line hover:text-candy-berry hover:border-candy-ink hover:shadow-xs'
          )}
        >
          <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden md:inline">تغيير كلمة المرور</span>
        </Link>

        {/* Logout Trigger with Confirmation Style */}
        <div className="relative" ref={confirmRef}>
          {!showLogoutConfirm ? (
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              title="تسجيل الخروج من النظام"
              aria-label="تسجيل الخروج من النظام"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-candy-pill text-xs font-semibold font-sans text-rose-600 bg-rose-50 border border-rose-200/80 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-500/30 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          ) : (
            <div
              role="alertdialog"
              aria-label="تأكيد تسجيل الخروج"
              className="flex items-center gap-1 bg-candy-cream border border-rose-300 rounded-candy-pill p-1 shadow-candy-2 animate-in fade-in zoom-in-95 duration-150"
            >
              <span className="text-[11px] font-sans font-bold text-rose-700 px-2 hidden sm:inline">
                تأكيد الخروج؟
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-sans bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all shadow-xs"
                aria-label="تأكيد تسجيل الخروج"
              >
                <Check className="w-3 h-3" aria-hidden="true" />
                <span>تأكيد الخروج</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="p-1 rounded-full text-candy-muted hover:text-candy-ink hover:bg-candy-soft transition-colors"
                aria-label="إلغاء الخروج"
                title="إلغاء"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminNavbar;