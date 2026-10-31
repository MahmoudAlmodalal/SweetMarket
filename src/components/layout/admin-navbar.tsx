'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  KeyRound,
  LogOut,
  ArrowLeftRight,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAdminAuth } from '@/context/admin-auth-context';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
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

  const currentTitle = title || resolvePageTitle(pathname);

  const handleRoleToggle = () => {
    const nextRole = role === 'manager' ? 'staff' : 'manager';
    switchRole(nextRole);
    toast.info(
      nextRole === 'manager' ? 'تم التبديل إلى دور مدير' : 'تم التبديل إلى دور موظف',
      'تم تحديث صلاحيات الحساب للاختبار السريع'
    );
  };

  const handleLogout = () => {
    logout();
    toast.info('تم تسجيل الخروج بنجاح');
    router.push('/admin/login');
  };

  const isPasswordPage = pathname === '/admin/account/password';

  return (
    <header
      className={cn(
        'h-16 border-b border-candy-line/70 bg-white/95 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs',
        className
      )}
    >
      {/* Right side: Mobile Menu Button & Current Page Title */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label="فتح القائمة الجانبية"
            className="lg:hidden p-2 rounded-xl text-candy-ink hover:text-candy-berry hover:bg-candy-soft transition-colors focus:outline-none focus:ring-2 focus:ring-candy-strawberry/30"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
        )}

        <div className="flex flex-col text-right">
          <h1 className="font-display font-bold text-lg sm:text-xl text-candy-ink leading-tight">
            {currentTitle}
          </h1>
          <span className="font-sans text-[11px] text-candy-muted hidden sm:inline">
            متجر حلويات كاندي لوز
          </span>
        </div>
      </div>

      {/* Left side: Role Switcher, Password Link, Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Role Switcher Toggle ("تبديل موظف/مدير" for testing) */}
        <button
          type="button"
          onClick={handleRoleToggle}
          title="تبديل موظف/مدير للاختبار السريع"
          aria-label="تبديل الدور بين موظف ومدير"
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-candy-pill text-xs font-bold font-sans transition-all duration-200 border shadow-xs active:scale-95',
            role === 'manager'
              ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              : 'bg-teal-50 text-teal-900 border-teal-300 hover:bg-teal-100'
          )}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 shrink-0 text-current" aria-hidden="true" />
          <span className="hidden sm:inline">تبديل موظف/مدير:</span>
          <span className="inline-flex items-center gap-1">
            {role === 'manager' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                <span>مدير</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
                <span>موظف</span>
              </>
            )}
          </span>
        </button>

        {/* Change Password Link */}
        <Link
          href="/admin/account/password"
          title="تغيير كلمة المرور"
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-candy-pill text-xs font-semibold font-sans transition-colors border',
            isPasswordPage
              ? 'bg-candy-berry text-white border-candy-berry shadow-candy-1 font-bold'
              : 'bg-candy-soft text-candy-ink border-candy-line hover:text-candy-berry hover:border-candy-blush'
          )}
        >
          <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden md:inline">تغيير كلمة المرور</span>
        </Link>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          title="تسجيل الخروج من النظام"
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-candy-pill text-xs font-semibold font-sans text-rose-600 bg-rose-50 border border-rose-200/80 hover:bg-rose-100/80 hover:text-rose-700 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/30"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">خروج</span>
        </button>
      </div>
    </header>
  );
}

export default AdminNavbar;
