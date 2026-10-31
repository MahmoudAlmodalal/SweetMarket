'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from '@/context/admin-auth-context';
import { ToastProvider } from '@/components/ui/toast';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminNavbar } from '@/components/layout/admin-navbar';

function DashboardProtectedShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // إغلاق القائمة الجانبية تلقائياً على الهواتف عند تغيير المسار
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // التحقق من حماية لوحة الإدارة وإعادة التوجيه لصفحة تسجيل الدخول إذا لم يوجد مستخدم
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      const redirectTarget = encodeURIComponent(pathname);
      router.replace(`/admin/login?redirect=${redirectTarget}`);
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  // حالة انتظار استرجاع الجلسة من التخزين المحلي
  if (isLoading) {
    return (
      <div className="min-h-screen bg-candy-cream flex flex-col items-center justify-center p-6 text-candy-ink">
        <div className="w-14 h-14 rounded-2xl bg-white border border-candy-line shadow-candy-1 flex items-center justify-center mb-4">
          <Loader2 className="w-7 h-7 text-candy-berry animate-spin" aria-hidden="true" />
        </div>
        <p className="font-sans font-bold text-sm text-candy-ink">جاري التحقق من الجلسة...</p>
        <p className="font-sans text-xs text-candy-muted mt-1">كاندي لوز - لوحة الإدارة</p>
      </div>
    );
  }

  // في حالة عدم وجود مصادقة، منع عرض المحتوى أثناء إعادة التوجيه
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-candy-cream flex flex-row antialiased">
      {/* القائمة الجانبية للإدارة */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* منطقة المحتوى الرئيسية مع الشريط العلوي */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AdminNavbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <ToastProvider>
        <DashboardProtectedShell>{children}</DashboardProtectedShell>
      </ToastProvider>
    </AdminAuthProvider>
  );
}
