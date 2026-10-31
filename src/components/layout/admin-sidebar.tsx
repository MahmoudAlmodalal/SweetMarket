'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  Package,
  Layers,
  MapPin,
  Users,
  ShieldCheck,
  User,
  X,
  Sparkles,
  KeyRound,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { useAdminAuth } from '@/context/admin-auth-context';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  managerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'الطلبات',
    href: '/admin/orders',
    icon: ShoppingBag,
  },
  {
    name: 'المنتجات',
    href: '/admin/products',
    icon: Package,
  },
  {
    name: 'التصنيفات',
    href: '/admin/categories',
    icon: Layers,
  },
  {
    name: 'مناطق التوصيل',
    href: '/admin/zones',
    icon: MapPin,
  },
  {
    name: 'فريق العمل',
    href: '/admin/users',
    icon: Users,
    managerOnly: true,
  },
];

interface SidebarContentProps {
  isMobile?: boolean;
  onClose?: () => void;
}

function SidebarContent({ isMobile = false, onClose }: SidebarContentProps) {
  const pathname = usePathname();
  const { user, role, isManager, logout } = useAdminAuth();

  const visibleNavItems = NAV_ITEMS.filter((item) => !item.managerOnly || isManager);

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-candy-line/60 flex items-center justify-between shrink-0 bg-white">
        <Link
          href="/admin/orders"
          onClick={() => isMobile && onClose?.()}
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-strawberry rounded-xl p-1"
        >
          <div className="w-10 h-10 rounded-xl bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center shadow-candy-1 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5 text-candy-berry" aria-hidden="true" />
          </div>
          <div className="flex flex-col text-right">
            <span className="font-display font-bold text-base text-candy-ink leading-tight group-hover:text-candy-berry transition-colors">
              كاندي لوز - لوحة الإدارة
            </span>
            <span className="font-sans text-[11px] text-candy-muted font-medium">
              نظام إدارة متجر الحلويات
            </span>
          </div>
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق القائمة الجانبية"
            className="p-1.5 rounded-lg text-candy-muted hover:text-candy-ink hover:bg-candy-soft transition-colors lg:hidden focus:outline-none focus:ring-2 focus:ring-candy-strawberry/30"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav aria-label="أقسام لوحة التحكم" className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold text-candy-muted/80 font-sans uppercase tracking-wider">
          القائمة الرئيسية
        </div>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (pathname.startsWith(item.href + '/') && item.href !== '/admin');

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && onClose?.()}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group flex items-center justify-between px-3.5 py-2.5 rounded-xl font-sans text-sm font-semibold transition-all duration-200 relative',
                isActive
                  ? 'bg-candy-berry text-white shadow-candy-1 font-bold'
                  : 'text-candy-ink hover:bg-candy-soft hover:text-candy-berry'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-white' : 'text-candy-muted group-hover:text-candy-berry'
                  )}
                  aria-hidden="true"
                />
                <span>{item.name}</span>
              </div>

              {item.managerOnly && (
                <span
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full font-bold',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-candy-soft text-candy-berry border border-candy-blush'
                  )}
                >
                  مدير
                </span>
              )}

              {isActive && (
                <ChevronLeft className="w-4 h-4 text-white/70" aria-hidden="true" />
              )}
            </Link>
          );
        })}

        {/* Supporting section links */}
        <div className="pt-5 px-3 pb-2 text-[11px] font-bold text-candy-muted/80 font-sans uppercase tracking-wider">
          إعدادات الحساب
        </div>

        <Link
          href="/admin/account/password"
          onClick={() => isMobile && onClose?.()}
          aria-current={pathname === '/admin/account/password' ? 'page' : undefined}
          className={cn(
            'group flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-sans text-sm font-semibold transition-all duration-200',
            pathname === '/admin/account/password'
              ? 'bg-candy-berry text-white shadow-candy-1 font-bold'
              : 'text-candy-ink hover:bg-candy-soft hover:text-candy-berry'
          )}
        >
          <KeyRound
            className={cn(
              'w-5 h-5 transition-colors',
              pathname === '/admin/account/password'
                ? 'text-white'
                : 'text-candy-muted group-hover:text-candy-berry'
            )}
            aria-hidden="true"
          />
          <span>تغيير كلمة المرور</span>
        </Link>
      </nav>

      {/* User Info Card with Role Badge */}
      <div className="p-3 border-t border-candy-line/60 bg-candy-cream/50 shrink-0">
        <div className="p-3 rounded-2xl bg-white border border-candy-line shadow-sm space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border',
                  role === 'manager'
                    ? 'bg-candy-berry text-white border-candy-berry-dark'
                    : 'bg-candy-soft text-candy-berry border-candy-blush'
                )}
                aria-hidden="true"
              >
                {role === 'manager' ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>

              <div className="min-w-0 text-right">
                <p className="font-sans font-bold text-xs text-candy-ink truncate leading-tight">
                  {user?.fullName || 'مستخدم النظام'}
                </p>
                <p className="font-sans text-[11px] text-candy-muted truncate mt-0.5" dir="ltr">
                  {user?.email || (user ? `@${user.username}` : '')}
                </p>
              </div>
            </div>

            {/* Role Badge: "مدير" / "موظف" */}
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold font-sans shrink-0 border',
                role === 'manager'
                  ? 'bg-candy-berry text-white border-candy-berry-dark shadow-xs'
                  : 'bg-candy-blush text-candy-berry border-candy-rose/40'
              )}
            >
              {role === 'manager' ? 'مدير' : 'موظف'}
            </span>
          </div>

          <div className="pt-2 border-t border-candy-line/60 flex items-center justify-between">
            <span className="text-[10px] text-candy-muted font-sans font-medium">
              الحالة: {user?.isActive ? 'نشط' : 'معطل'}
            </span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline font-sans transition-colors"
            >
              <LogOut className="w-3 h-3" aria-hidden="true" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({ isOpen = false, onClose, className }: AdminSidebarProps) {
  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        aria-label="القائمة الجانبية لإدارة المتجر"
        className={cn(
          'hidden lg:flex flex-col w-64 xl:w-72 bg-white border-l border-candy-line h-screen sticky top-0 shrink-0 z-20',
          className
        )}
      >
        <SidebarContent isMobile={false} onClose={onClose} />
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog">
          {/* Backdrop */}
          <div
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-candy-ink/40 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Off-canvas sidebar */}
          <aside
            aria-label="القائمة الجانبية المتنقلة"
            className="fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-candy-3 flex flex-col transition-transform duration-300 ease-candy-ease"
          >
            <SidebarContent isMobile onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}

export default AdminSidebar;
