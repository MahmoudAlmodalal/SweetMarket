'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Terminal,
  Play,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Database,
  ExternalLink,
  Code2,
  FileJson,
  LogOut,
  UserCheck,
  AlertTriangle,
  Layers,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface EndpointPreset {
  id: string;
  group: 'System' | 'Storefront' | 'Admin';
  method: HttpMethod;
  path: string;
  label: string;
  requiresAuth?: boolean;
  sampleBody?: Record<string, unknown>;
}

const ENDPOINT_PRESETS: EndpointPreset[] = [
  {
    id: 'health',
    group: 'System',
    method: 'GET',
    path: '/api/v1/health',
    label: 'Health & Catalog Counts',
  },
  {
    id: 'openapi',
    group: 'System',
    method: 'GET',
    path: '/api/v1/dev/openapi',
    label: 'OpenAPI 3.1 Schema',
  },
  {
    id: 'categories',
    group: 'Storefront',
    method: 'GET',
    path: '/api/v1/categories',
    label: 'List Categories',
  },
  {
    id: 'products',
    group: 'Storefront',
    method: 'GET',
    path: '/api/v1/products?featured=true',
    label: 'Featured Products',
  },
  {
    id: 'product-detail',
    group: 'Storefront',
    method: 'GET',
    path: '/api/v1/products/mixed-baklava-extra-pistachio',
    label: 'Product Detail by Slug',
  },
  {
    id: 'zones',
    group: 'Storefront',
    method: 'GET',
    path: '/api/v1/delivery-zones',
    label: 'Active Delivery Zones',
  },
  {
    id: 'track-order',
    group: 'Storefront',
    method: 'POST',
    path: '/api/v1/orders/track',
    label: 'Track Order (Phone + Number)',
    sampleBody: {
      orderNumber: 'CL-2026-1001',
      phone: '0599112233',
    },
  },
  {
    id: 'create-order',
    group: 'Storefront',
    method: 'POST',
    path: '/api/v1/orders',
    label: 'Create Sample Order',
    sampleBody: {
      customer: {
        fullName: 'اختبار مطور كاندي لوز',
        phone: '0599887766',
        zoneId: 'zone-ramallah-center',
        streetAddress: 'شارع الإرسال - عمارة اللوز الطابق 2',
        notes: 'طلب تجريبي من لوحة المطورين',
      },
      items: [
        {
          productId: 'prod-baklava-mixed',
          quantity: 1,
          weightLabel: '1 كيلو',
          packagingOptionId: 'royal',
        },
      ],
    },
  },
  {
    id: 'admin-me',
    group: 'Admin',
    method: 'GET',
    path: '/api/v1/admin/auth/me',
    label: 'Current Admin Session',
    requiresAuth: true,
  },
  {
    id: 'admin-orders',
    group: 'Admin',
    method: 'GET',
    path: '/api/v1/admin/orders',
    label: 'List Admin Orders',
    requiresAuth: true,
  },
  {
    id: 'admin-products',
    group: 'Admin',
    method: 'GET',
    path: '/api/v1/admin/products',
    label: 'List Admin Products',
    requiresAuth: true,
  },
  {
    id: 'admin-zones',
    group: 'Admin',
    method: 'GET',
    path: '/api/v1/admin/delivery-zones',
    label: 'List Admin Delivery Zones',
    requiresAuth: true,
  },
  {
    id: 'admin-users',
    group: 'Admin',
    method: 'GET',
    path: '/api/v1/admin/users',
    label: 'List Admin Users (Manager)',
    requiresAuth: true,
  },
];

const QUICK_ROUTES = [
  { group: 'Storefront', label: 'Home Storefront', href: '/' },
  { group: 'Storefront', label: 'Baklava Category', href: '/category/baklava-eastern' },
  { group: 'Storefront', label: 'Product Detail', href: '/product/mixed-baklava-extra-pistachio' },
  { group: 'Storefront', label: 'Cart', href: '/cart' },
  { group: 'Storefront', label: 'Checkout', href: '/checkout' },
  { group: 'Storefront', label: 'Order Tracking', href: '/track' },
  { group: 'Storefront', label: 'Favorites', href: '/favorites' },
  { group: 'Storefront', label: 'Customer Account', href: '/account' },
  { group: 'Admin', label: 'Admin Login', href: '/admin/login' },
  { group: 'Admin', label: 'Orders Console', href: '/admin/orders' },
  { group: 'Admin', label: 'Products Manager', href: '/admin/products' },
  { group: 'Admin', label: 'Categories Manager', href: '/admin/categories' },
  { group: 'Admin', label: 'Delivery Zones', href: '/admin/zones' },
  { group: 'Admin', label: 'Admin Users', href: '/admin/users' },
];

const CLI_COMMANDS = [
  { cmd: 'npm run check', desc: 'TypeScript + ESLint + 20 unit tests' },
  { cmd: 'npm run test:unit', desc: 'Run pure business rules & adapter tests' },
  { cmd: 'npm run dev:smoke', desc: 'Run live API smoke test against port 3000' },
  { cmd: 'npm run dev:reset-db', desc: 'Delete local persisted DB file for clean re-seed' },
  { cmd: 'npm run typecheck', desc: 'Standalone TypeScript verification' },
];

interface AdminSessionUser {
  id: string;
  username: string;
  fullName: string;
  role: 'manager' | 'staff';
  email: string;
}

interface HealthSummary {
  status: string;
  mode: string;
  timestamp: string;
  catalog?: {
    activeCategories: number;
    activeProducts: number;
    activeZones: number;
  };
}

interface ApiRunResult {
  status: number;
  ok: boolean;
  durationMs: number;
  body: string;
  timestamp: string;
}

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  POST: 'bg-sky-500/15 text-sky-700 border-sky-500/30',
  PATCH: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
  DELETE: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
};

export function DevWorkbench({
  backendMode,
  initialSessionUser = null,
}: {
  backendMode: string;
  initialSessionUser?: AdminSessionUser | null;
}) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('health');
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [endpointPath, setEndpointPath] = useState<string>('/api/v1/health');
  const [requestBody, setRequestBody] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<ApiRunResult | null>(null);

  const [health, setHealth] = useState<HealthSummary | null>(null);
  const [sessionUser, setSessionUser] = useState<AdminSessionUser | null>(initialSessionUser);
  const [authBusy, setAuthBusy] = useState(false);

  const [confirmReset, setConfirmReset] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const healthRes = await fetch('/api/v1/health', { cache: 'no-store' });
      if (healthRes.ok) {
        const hJson = await healthRes.json();
        setHealth(hJson?.data ?? null);
      }
    } catch {
      // Ignore transient refresh errors
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleSelectPreset = (preset: EndpointPreset) => {
    setSelectedPresetId(preset.id);
    setMethod(preset.method);
    setEndpointPath(preset.path);
    setRequestBody(preset.sampleBody ? JSON.stringify(preset.sampleBody, null, 2) : '');
    setResult(null);
  };

  const handleSendRequest = async () => {
    const cleanPath = endpointPath.trim();
    if (!cleanPath.startsWith('/api/')) {
      setFeedback({ type: 'err', text: 'Only relative /api/* paths are allowed in the runner.' });
      return;
    }

    setIsSending(true);
    setFeedback(null);
    const start = performance.now();

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Requested-With': 'CandyLozDevWorkbench',
      };
      let bodyToSend: string | undefined;

      if (method !== 'GET' && method !== 'DELETE' && requestBody.trim()) {
        // Validate JSON before sending
        JSON.parse(requestBody);
        headers['Content-Type'] = 'application/json';
        bodyToSend = requestBody;
      }

      if (method === 'POST' && cleanPath === '/api/v1/orders') {
        headers['Idempotency-Key'] = `dev-${Date.now()}`;
      }

      const res = await fetch(cleanPath, {
        method,
        credentials: 'include',
        headers,
        body: bodyToSend,
      });

      const durationMs = Math.round(performance.now() - start);
      const rawText = await res.text();
      let formatted = rawText;
      try {
        formatted = JSON.stringify(JSON.parse(rawText), null, 2);
      } catch {
        // Keep raw text if not JSON
      }

      setResult({
        status: res.status,
        ok: res.ok,
        durationMs,
        body: formatted,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setResult({
        status: 0,
        ok: false,
        durationMs: Math.round(performance.now() - start),
        body: JSON.stringify({ error: message }, null, 2),
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDemoLogin = async (role: 'manager' | 'staff') => {
    setAuthBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/v1/admin/auth/demo-login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'CandyLozDevWorkbench',
        },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: json?.error?.message || 'Sign-in failed' });
      } else {
        setSessionUser(json?.data?.user ?? null);
        setFeedback({
          type: 'ok',
          text: `Signed in as ${json?.data?.user?.username} (${role}) via HttpOnly session cookie.`,
        });
      }
    } catch {
      setFeedback({ type: 'err', text: 'Unable to reach demo-login endpoint.' });
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    setAuthBusy(true);
    setFeedback(null);
    try {
      await fetch('/api/v1/admin/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Requested-With': 'CandyLozDevWorkbench' },
      });
      setSessionUser(null);
      setFeedback({ type: 'ok', text: 'Admin session revoked and cookie cleared.' });
    } finally {
      setAuthBusy(false);
    }
  };

  const handleResetDb = async () => {
    setResetBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/v1/dev/reset', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Requested-With': 'CandyLozDevWorkbench' },
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: 'err',
          text: json?.error?.message || 'Database reset requires an active Manager session.',
        });
      } else {
        setConfirmReset(false);
        setFeedback({
          type: 'ok',
          text: `Database reset cleanly (${json?.data?.counts?.products ?? 0} products, ${json?.data?.counts?.orders ?? 0} seeded orders).`,
        });
        await refreshStatus();
      }
    } catch {
      setFeedback({ type: 'err', text: 'Failed to reset database.' });
    } finally {
      setResetBusy(false);
    }
  };

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      // Ignore clipboard failure
    }
  };

  const buildCurlCommand = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const parts = [`curl -X ${method} "${origin}${endpointPath}"`, `-H "Accept: application/json"`];
    if (method !== 'GET' && method !== 'DELETE' && requestBody.trim()) {
      const compact = requestBody.replace(/\s+/g, ' ').replace(/'/g, "'\\''");
      parts.push(`-H "Content-Type: application/json"`, `-d '${compact}'`);
    }
    return parts.join(' \\\n  ');
  };

  return (
    <div dir="ltr" className="min-h-screen bg-[#FAF7F5] text-stone-900 font-sans">
      {/* Top Dev Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/95 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#12382A] text-white flex items-center justify-center shadow-sm">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-stone-900">
                  Candy Loz Developer Workbench
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                  DEV ONLY
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono">
                API v1 Explorer · OpenAPI 3.1 · Session &amp; Seed Controls
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/v1/dev/openapi"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 bg-candy-cream hover:bg-stone-50 text-stone-700 transition-colors"
            >
              <FileJson className="w-3.5 h-3.5 text-[#1F5C45]" />
              <span>OpenAPI JSON</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#12382A] text-white hover:bg-[#0E2C21] transition-colors"
            >
              <span>Storefront</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Feedback banner */}
        {feedback && (
          <div
            className={cn(
              'rounded-xl px-4 py-3 text-xs font-medium border flex items-center justify-between',
              feedback.type === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            )}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Operational Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Backend Health Card */}
          <div className="bg-candy-cream rounded-2xl border border-stone-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#1F5C45]" />
                Backend Runtime
              </span>
              <button
                type="button"
                onClick={refreshStatus}
                className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                title="Refresh status"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-mono text-sm font-bold text-stone-900">
                {health?.mode || backendMode}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="rounded-lg bg-stone-50 border border-stone-100 py-1.5">
                <div className="font-mono text-sm font-bold text-stone-900">
                  {health?.catalog?.activeCategories ?? '—'}
                </div>
                <div className="text-[10px] text-stone-500">Categories</div>
              </div>
              <div className="rounded-lg bg-stone-50 border border-stone-100 py-1.5">
                <div className="font-mono text-sm font-bold text-stone-900">
                  {health?.catalog?.activeProducts ?? '—'}
                </div>
                <div className="text-[10px] text-stone-500">Products</div>
              </div>
              <div className="rounded-lg bg-stone-50 border border-stone-100 py-1.5">
                <div className="font-mono text-sm font-bold text-stone-900">
                  {health?.catalog?.activeZones ?? '—'}
                </div>
                <div className="text-[10px] text-stone-500">Zones</div>
              </div>
            </div>
          </div>

          {/* Auth Session Switcher */}
          <div className="bg-candy-cream rounded-2xl border border-stone-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1F5C45]" />
                Admin Session (Cookie)
              </span>
              {sessionUser && (
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline disabled:opacity-50"
                >
                  <LogOut className="w-3 h-3" />
                  Logout
                </button>
              )}
            </div>
            {sessionUser ? (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50/70 border border-emerald-200/70 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-stone-900 truncate">
                    {sessionUser.username}{' '}
                    <span className="font-mono uppercase text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/70 text-emerald-900">
                      {sessionUser.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 truncate">{sessionUser.email}</div>
                </div>
                <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              </div>
            ) : (
              <div className="rounded-lg bg-stone-50 border border-stone-200/70 px-3 py-2 text-xs text-stone-500">
                Not authenticated. Sign in below to test <code className="font-mono">/api/v1/admin/*</code>.
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={authBusy}
                onClick={() => handleDemoLogin('manager')}
                className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-[#12382A] text-white hover:bg-[#0E2C21] disabled:opacity-50 transition-colors"
              >
                Sign in Manager
              </button>
              <button
                type="button"
                disabled={authBusy}
                onClick={() => handleDemoLogin('staff')}
                className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold border border-stone-300 bg-candy-cream text-stone-800 hover:bg-stone-50 disabled:opacity-50 transition-colors"
              >
                Sign in Staff
              </button>
            </div>
          </div>

          {/* Seed Reset Card */}
          <div className="bg-candy-cream rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Local Seed Database
              </span>
              <p className="text-xs text-stone-600 leading-relaxed">
                Restore seeded categories, products, delivery zones, and orders via{' '}
                <code className="font-mono text-[11px] bg-stone-100 px-1 rounded">
                  POST /api/v1/dev/reset
                </code>
                . Requires an active Manager session.
              </p>
            </div>

            {!confirmReset ? (
              <button
                type="button"
                disabled={sessionUser?.role !== 'manager'}
                onClick={() => setConfirmReset(true)}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
              >
                {sessionUser?.role === 'manager'
                  ? 'Reset Local Seed Data'
                  : 'Sign in as Manager to Reset DB'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={resetBusy}
                  onClick={handleResetDb}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-50"
                >
                  {resetBusy ? 'Resetting...' : 'Confirm Reset'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="py-2 px-3 rounded-lg text-xs font-semibold border border-stone-300 bg-candy-cream text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Main Interactive API Explorer */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Endpoint Presets */}
          <aside className="lg:col-span-4 bg-candy-cream rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#1F5C45]" />
                API v1 Endpoints
              </span>
              <span className="font-mono text-[11px] text-stone-400">
                {ENDPOINT_PRESETS.length} presets
              </span>
            </div>
            <div className="divide-y divide-stone-100 max-h-[540px] overflow-y-auto">
              {(['System', 'Storefront', 'Admin'] as const).map((group) => (
                <div key={group} className="p-2">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    {group}
                  </div>
                  <div className="space-y-1">
                    {ENDPOINT_PRESETS.filter((p) => p.group === group).map((preset) => {
                      const active = selectedPresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={cn(
                            'w-full text-left px-2.5 py-2 rounded-xl transition-colors flex items-start gap-2',
                            active
                              ? 'bg-[#12382A]/10 ring-1 ring-[#12382A]/25'
                              : 'hover:bg-stone-50'
                          )}
                        >
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 mt-0.5',
                              METHOD_COLORS[preset.method]
                            )}
                          >
                            {preset.method}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-stone-900 truncate">
                              {preset.label}
                            </div>
                            <div className="text-[11px] font-mono text-stone-500 truncate">
                              {preset.path}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Right: Live Request Runner & Response Viewer */}
          <div className="lg:col-span-8 bg-candy-cream rounded-2xl border border-stone-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-stone-200 bg-stone-50/70 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as HttpMethod)}
                  aria-label="HTTP Method"
                  className="h-10 px-3 rounded-xl border border-stone-300 bg-candy-cream font-mono text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#1F5C45]/30"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <input
                  type="text"
                  value={endpointPath}
                  onChange={(e) => setEndpointPath(e.target.value)}
                  placeholder="/api/v1/..."
                  className="flex-1 h-10 px-3 rounded-xl border border-stone-300 bg-candy-cream font-mono text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1F5C45]/30"
                />
                <button
                  type="button"
                  disabled={isSending}
                  onClick={handleSendRequest}
                  className="h-10 px-4 rounded-xl bg-[#12382A] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-[#0E2C21] disabled:opacity-50 transition-colors shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Running...' : 'Send'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyText('curl', buildCurlCommand())}
                  className="h-10 px-3 rounded-xl border border-stone-300 bg-candy-cream text-stone-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-stone-50 shrink-0"
                  title="Copy as curl"
                >
                  {copiedKey === 'curl' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>cURL</span>
                </button>
              </div>

              {(method === 'POST' || method === 'PATCH') && (
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-semibold text-stone-500">
                    Request JSON Body
                  </label>
                  <textarea
                    rows={6}
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder='{ "key": "value" }'
                    className="w-full p-3 rounded-xl border border-stone-300 bg-candy-cream font-mono text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#1F5C45]/30"
                  />
                </div>
              )}
            </div>

            {/* Response Panel */}
            <div className="flex-1 flex flex-col min-h-[300px]">
              <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 font-mono">
                  <span className="font-bold text-stone-500">Response</span>
                  {result && (
                    <>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded font-bold text-[11px]',
                          result.ok
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        )}
                      >
                        HTTP {result.status}
                      </span>
                      <span className="text-stone-400">{result.durationMs} ms</span>
                      <span className="text-stone-400 hidden sm:inline">{result.timestamp}</span>
                    </>
                  )}
                </div>
                {result && (
                  <button
                    type="button"
                    onClick={() => copyText('response', result.body)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900"
                  >
                    {copiedKey === 'response' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy JSON</span>
                  </button>
                )}
              </div>

              <pre className="flex-1 p-4 bg-stone-950 text-stone-100 font-mono text-xs overflow-auto max-h-[420px] leading-relaxed">
                {result
                  ? result.body
                  : '// Select an endpoint preset on the left and click "Send" to inspect the live response.'}
              </pre>
            </div>
          </div>
        </section>

        {/* Bottom Reference Row: Route Launcher + CLI & Business Rules */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Quick Route Launcher */}
          <div className="lg:col-span-6 bg-candy-cream rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600">
              <Layers className="w-4 h-4 text-[#1F5C45]" />
              <span>Quick Route Directory</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUICK_ROUTES.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="group rounded-xl border border-stone-200/80 px-3 py-2 hover:border-[#1F5C45]/40 hover:bg-[#FAF4F6] transition-all"
                >
                  <div className="text-[10px] font-mono uppercase text-stone-400">
                    {route.group}
                  </div>
                  <div className="text-xs font-semibold text-stone-800 group-hover:text-[#12382A] flex items-center justify-between gap-1 mt-0.5">
                    <span className="truncate">{route.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-40 group-hover:opacity-100 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* CLI & Domain Cheat Sheet */}
          <div className="lg:col-span-6 bg-candy-cream rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600">
              <BookOpen className="w-4 h-4 text-[#1F5C45]" />
              <span>CLI Commands &amp; Domain Rules</span>
            </div>

            <div className="space-y-2">
              {CLI_COMMANDS.map((item) => (
                <div
                  key={item.cmd}
                  className="flex items-center justify-between gap-2 rounded-xl bg-stone-50 border border-stone-200/70 px-3 py-2"
                >
                  <div className="min-w-0">
                    <code className="font-mono text-xs font-bold text-[#12382A]">{item.cmd}</code>
                    <p className="text-[11px] text-stone-500">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(item.cmd, item.cmd)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 shrink-0"
                    title="Copy command"
                  >
                    {copiedKey === item.cmd ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3 text-xs text-amber-950 space-y-1">
              <div className="font-bold">Authoritative Business Rules</div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-900">
                <li>
                  <strong>Packaging fees:</strong> Standard <code className="font-mono">0 ₪</code> · Royal Velvet Box{' '}
                  <code className="font-mono">+12 ₪</code> (enforced identically on client &amp; server).
                </li>
                <li>
                  <strong>Phone validation:</strong> Palestinian mobile <code className="font-mono">059 / 056</code> (10 digits; accepts <code className="font-mono">+970 / 00970</code>).
                </li>
                <li>
                  <strong>Lifecycle (BR-004):</strong>{' '}
                  <code className="font-mono">new → accepted → in_preparation → out_for_delivery → delivered</code> (cancellation &amp; undelivered restricted to Manager).
                </li>
                <li>
                  <strong>Upstream proxy:</strong> Set <code className="font-mono">BACKEND_API_URL</code> to route all <code className="font-mono">/api/v1/*</code> traffic to Django DRF.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
