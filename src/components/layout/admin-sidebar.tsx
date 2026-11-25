'use client';

import React, { useState } from 'react';
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
  KeyRound,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsRight,
  ChevronsLeft,
  Sparkles,
} from 'lucide-react';
import { useAdminAuth } from '@/context/admin-auth-context';
import { StoreLogo } from '@/components/ui/store-logo';
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
    managerOnly: true,
  },
  {
    name: 'مناطق التوصيل',
    href: '/admin/zones',
    icon: MapPin,
    managerOnly: true,
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

function SidebarContent({
  isMobile = false,
  isCollapsed = false,
  onToggleCollapse,
  onClose,
}: SidebarContentProps) {
  const pathname = usePathname();
  const { user, role, isManager, logout } = useAdminAuth();

  const [mainNavOpen, setMainNavOpen] = useState(true);
  const [accountNavOpen, setAccountNavOpen] = useState(true);

  const visibleNavItems = NAV_ITEMS
    .filter((item) => !item.managerOnly || isManager)
    .map((item) => {
      if (item.href === '/admin/products') {
        return {
          ...item,
          name: isManager ? 'المنتجات' : 'المنتجات (التوفر الفوري)',
        };
      }
      return item;
    });

  return (
    <div className="flex flex-col h-full bg-candy-cream select-none relative">
      {/* Brand Header */}
      <div
        className={cn(
          'h-16 px-4 border-b border-candy-line/60 flex items-center justify-between shrink-0 bg-candy-cream transition-all',
          isCollapsed && !isMobile ? 'justify-center px-2' : 'justify-between px-4 sm:px-5'
        )}
      >
        <Link
          href="/admin/orders"
          onClick={() => isMobile && onClose?.()}
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-strawberry rounded-xl p-1 transition-transform"
          title="كاندي لوز - لوحة الإدارة"
        >
          <StoreLogo
            variant="icon"
            width={38}
            height={38}
            className="w-10 h-10 group-hover:scale-105 transition-transform duration-200 shrink-0"
          />
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col text-right min-w-0">
              <span className="font-display font-bold text-sm sm:text-base text-candy-ink leading-tight group-hover:text-candy-berry transition-colors truncate">
                كاندي لوز - لوحة الإدارة
              </span>
              <span className="font-sans text-[11px] text-candy-muted font-medium truncate">
                نظام إدارة متجر الحلويات
              </span>
            </div>
          )}
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

        {!isMobile && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
            title={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
            className="hidden lg:flex p-1.5 rounded-lg text-candy-muted hover:text-candy-berry hover:bg-candy-soft transition-colors focus:outline-none focus:ring-2 focus:ring-candy-strawberry/30"
          >
            {isCollapsed ? (
              <ChevronsLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
            ) : (
              <ChevronsRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Links with Active Berry Borders & Hover Transitions */}
      <nav
        aria-label="أقسام لوحة التحكم"
        className={cn(
          'flex-1 py-4 space-y-1 overflow-y-auto transition-all',
          isCollapsed && !isMobile ? 'px-2' : 'px-3'
        )}
      >
        {/* Section Header: Main Menu */}
        {(!isCollapsed || isMobile) && (
          <button
            type="button"
            onClick={() => setMainNavOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-bold text-candy-muted/80 font-sans uppercase tracking-wider hover:text-candy-berry transition-colors"
          >
            <span>القائمة الرئيسية</span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-200',
                !mainNavOpen && '-rotate-90'
              )}
              aria-hidden="true"
            />
          </button>
        )}

        {mainNavOpen && (
          <div className="space-y-1.5 pt-1">
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
                  title={item.name}
                  className={cn(
                    'group flex items-center justify-between py-2.5 rounded-xl font-sans text-sm font-semibold transition-colors relative',
                    isCollapsed && !isMobile ? 'px-2 justify-center' : 'px-3.5',
                    isActive
                      ? 'bg-candy-berry text-white font-bold'
                      : 'text-candy-ink hover:bg-candy-soft hover:text-candy-berry'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={cn(
                        'w-5 h-5 shrink-0 transition-colors',
                        isActive
                          ? 'text-white'
                          : 'text-candy-muted group-hover:text-candy-berry'
                      )}
                      aria-hidden="true"
                    />
                    {(!isCollapsed || isMobile) && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </div>

                  {(!isCollapsed || isMobile) && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.managerOnly && (
                        <span
                          className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full font-bold',
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-candy-soft text-candy-berry border border-candy-ink'
                          )}
                        >
                          مدير
                        </span>
                      )}

                      {isActive && (
                        <ChevronLeft className="w-4 h-4 text-white/80 shrink-0" aria-hidden="true" />
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Section Header: Account Settings */}
        {(!isCollapsed || isMobile) && (
          <div className="pt-4">
            <button
              type="button"
              onClick={() => setAccountNavOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-bold text-candy-muted/80 font-sans uppercase tracking-wider hover:text-candy-berry transition-colors"
            >
              <span>إعدادات الحساب</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-200',
                  !accountNavOpen && '-rotate-90'
                )}
                aria-hidden="true"
              />
            </button>
          </div>
        )}

        {accountNavOpen && (
          <div className="space-y-1.5 pt-1">
            <Link
              href="/admin/account/password"
              onClick={() => isMobile && onClose?.()}
              aria-current={pathname === '/admin/account/password' ? 'page' : undefined}
              title="تغيير كلمة المرور"
              className={cn(
                'group flex items-center justify-between py-2.5 rounded-xl font-sans text-sm font-semibold transition-colors relative',
                isCollapsed && !isMobile ? 'px-2 justify-center' : 'px-3.5',
                pathname === '/admin/account/password'
                  ? 'bg-candy-berry text-white font-bold'
                  : 'text-candy-ink hover:bg-candy-soft hover:text-candy-berry'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <KeyRound
                  className={cn(
                    'w-5 h-5 shrink-0 transition-colors',
                    pathname === '/admin/account/password'
                      ? 'text-white'
                      : 'text-candy-muted group-hover:text-candy-berry'
                  )}
                  aria-hidden="true"
                />
                {(!isCollapsed || isMobile) && (
                  <span className="truncate">تغيير كلمة المرور</span>
                )}
              </div>

              {(!isCollapsed || isMobile) && pathname === '/admin/account/password' && (
                <ChevronLeft className="w-4 h-4 text-white/80 shrink-0" aria-hidden="true" />
              )}
            </Link>
          </div>
        )}
      </nav>

      {/* User Info Card with Role Badge */}
      <div
        className={cn(
          'border-t border-candy-line/60 bg-candy-cream/60 shrink-0 transition-all',
          isCollapsed && !isMobile ? 'p-2' : 'p-3'
        )}
      >
        <div
          className={cn(
            'rounded-2xl bg-candy-cream border border-candy-line/80 shadow-sm transition-all',
            isCollapsed && !isMobile ? 'p-2 flex flex-col items-center gap-2' : 'p-3 space-y-2.5'
          )}
        >
          <div
            className={cn(
              'flex items-center gap-2',
              isCollapsed && !isMobile ? 'flex-col items-center' : 'justify-between'
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors',
                  role === 'manager'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-teal-500 text-white border-teal-600 shadow-xs'
                )}
                aria-hidden="true"
                title={user?.fullName || 'مستخدم النظام'}
              >
                {role === 'manager' ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>

              {(!isCollapsed || isMobile) && (
                <div className="min-w-0 text-right">
                  <p className="font-sans font-bold text-xs text-candy-ink truncate leading-tight">
                    {user?.fullName || 'مستخدم النظام'}
                  </p>
                  <p className="font-sans text-[11px] text-candy-muted truncate mt-0.5" dir="ltr">
                    {user?.email || (user ? `@${user.username}` : '')}
                  </p>
                </div>
              )}
            </div>

            {/* Role Badge: "مدير" / "موظف" */}
            {(!isCollapsed || isMobile) ? (
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold font-sans shrink-0 border shadow-xs',
                  role === 'manager'
                    ? 'bg-candy-cream text-amber-950 border-amber-300'
                    : 'bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-950 border-teal-300'
                )}
              >
                {role === 'manager' ? 'مدير' : 'موظف'}
              </span>
            ) : (
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  role === 'manager' ? 'bg-amber-500' : 'bg-teal-500'
                )}
                title={role === 'manager' ? 'مدير' : 'موظف'}
              />
            )}
          </div>

          {(!isCollapsed || isMobile) && (
            <div className="pt-2 border-t border-candy-line/60 flex items-center justify-between">
              <span className="text-[10px] text-candy-muted font-sans font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                <span>الحالة: {user?.isActive ? 'نشط' : 'معطل'}</span>
              </span>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline font-sans transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3 h-3" aria-hidden="true" />
                <span>خروج</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({ isOpen = false, onClose, className }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Desktop Persistent Sidebar with sleek collapse transition */}
      <aside
        aria-label="القائمة الجانبية لإدارة المتجر"
        className={cn(
          'hidden lg:flex flex-col bg-candy-cream border-l border-candy-line h-screen sticky top-0 shrink-0 z-20 transition-all duration-300 ease-candy-ease',
          isCollapsed ? 'w-20' : 'w-64 xl:w-72',
          className
        )}
      >
        <SidebarContent
          isMobile={false}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
          onClose={onClose}
        />
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog">
          {/* Backdrop Scrim */}
          <div
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-slate-900/50  transition-opacity duration-300 z-50"
          />

          {/* Off-canvas sidebar */}
          <aside
            aria-label="القائمة الجانبية المتنقلة"
            className="fixed inset-y-0 right-0 z-50 w-72 bg-candy-cream shadow-candy-3 flex flex-col transition-transform duration-300 ease-candy-ease"
          >
            <SidebarContent isMobile onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}

export default AdminSidebar;