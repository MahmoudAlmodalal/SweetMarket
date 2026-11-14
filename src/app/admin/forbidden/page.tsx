'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from '@/context/admin-auth-context';
import { ToastProvider } from '@/components/ui/toast';
import { validateAdminReturnUrl } from '@/lib/auth/authorization';
import {
  ForbiddenLoadingSkeleton,
  GuestUnauthenticatedCard,
  StaffForbiddenCard,
} from '@/components/admin/forbidden';

function ForbiddenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawFrom = searchParams.get('from');

  const { user, isAuthenticated, isLoading, isManager, logout } = useAdminAuth();

  const isSystemAdmin = Boolean(
    isManager || user?.role === 'manager' || (user?.role as string) === 'admin'
  );

  // 1. Auto-redirect System Admins with validated from path
  useEffect(() => {
    if (!isLoading && isSystemAdmin) {
      const target = validateAdminReturnUrl(rawFrom);
      router.replace(target);
    }
  }, [isLoading, isSystemAdmin, rawFrom, router]);

  // 2. Neutral Loading State: Prevent guest flash during auth resolution or auto-redirect
  if (isLoading || isSystemAdmin) {
    return (
      <ForbiddenLoadingSkeleton
        message={isSystemAdmin ? 'جاري تحويلك إلى وجهتك...' : 'جاري التحقق من الصلاحيات...'}
      />
    );
  }

  // 3. Unauthenticated Visitors / Guests (401 Card)
  if (!isAuthenticated || !user) {
    return <GuestUnauthenticatedCard rawFrom={rawFrom} />;
  }

  // 4. Authenticated Staff lacking Admin privileges (403 Card)
  return <StaffForbiddenCard user={user} rawFrom={rawFrom} onLogout={logout} />;
}

export default function ForbiddenPage() {
  return (
    <AdminAuthProvider>
      <ToastProvider>
        <main
          id="main-content"
          role="main"
          className="min-h-screen bg-candy-cream flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8"
          dir="rtl"
        >
          <Suspense fallback={<ForbiddenLoadingSkeleton />}>
            <ForbiddenContent />
          </Suspense>
        </main>
      </ToastProvider>
    </AdminAuthProvider>
  );
}
