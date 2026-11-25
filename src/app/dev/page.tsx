import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { DevWorkbench } from '@/components/dev/dev-workbench';
import { COOKIE_NAME, verifySessionToken } from '@/server/auth';
import { getDb, sanitizeAdminUser } from '@/server/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Developer Workbench | Candy Loz' },
  description: 'Interactive API v1 Explorer, OpenAPI 3.1 spec, and local seed tools for Candy Loz developers.',
  robots: { index: false, follow: false },
};

export default function DevPage() {
  const isEnabled =
    process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_TOOLS === 'true';

  if (!isEnabled) {
    return (
      <main
        dir="ltr"
        className="min-h-screen bg-[#FAF7F5] flex items-center justify-center p-6 font-sans"
      >
        <div className="max-w-md w-full bg-candy-cream rounded-2xl border border-stone-200 p-8 text-center shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-stone-900">Developer Workbench Disabled</h1>
          <p className="text-xs text-stone-600 leading-relaxed">
            The <code className="font-mono bg-stone-100 px-1 rounded">/dev</code> workbench is
            disabled in production builds. Set{' '}
            <code className="font-mono bg-stone-100 px-1 rounded">ALLOW_DEV_TOOLS=true</code> in a
            staging environment if you explicitly need to enable it.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#12382A] text-white text-xs font-bold hover:bg-[#0E2C21] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Storefront</span>
          </Link>
        </div>
      </main>
    );
  }

  const backendMode = process.env.BACKEND_API_URL ? 'upstream-proxy' : 'local-persistent';

  let initialSessionUser: {
    id: string;
    username: string;
    fullName: string;
    role: 'manager' | 'staff';
    email: string;
  } | null = null;

  const cookieToken = cookies().get(COOKIE_NAME)?.value;
  if (cookieToken) {
    const payload = verifySessionToken(cookieToken);
    if (payload) {
      const found = getDb().users.find((u) => u.id === payload.sub && u.isActive);
      if (found) {
        const safe = sanitizeAdminUser(found);
        initialSessionUser = {
          id: safe.id,
          username: safe.username,
          fullName: safe.fullName,
          role: safe.role,
          email: safe.email,
        };
      }
    }
  }

  return <DevWorkbench backendMode={backendMode} initialSessionUser={initialSessionUser} />;
}
