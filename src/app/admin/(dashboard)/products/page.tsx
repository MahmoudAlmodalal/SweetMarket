'use client';

import React from 'react';
import Link from 'next/link';
import { Package, Plus, Sparkles, Layers, ArrowLeft } from 'lucide-react';
import { useAdminAuth } from '@/context/admin-auth-context';
import { Button } from '@/components/ui/button';
import { ProductsTable } from '@/components/admin/products/products-table';

export default function AdminProductsPage() {
  const { isManager } = useAdminAuth();

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* رأس الصفحة مع العنوان والمسار */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-candy-line/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans text-candy-muted mb-1">
            <Link href="/admin/orders" className="hover:text-candy-berry transition-colors">
              لوحة الإدارة
            </Link>
            <span>/</span>
            <span className="text-candy-ink font-semibold">إدارة الكتالوج والمنتجات (SCR-15)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-candy-ink flex items-center gap-2.5">
            <Package className="w-7 h-7 text-candy-berry" />
            <span>كتالوج المنتجات والتوفر الفوري</span>
          </h1>
          <p className="text-xs sm:text-sm font-sans text-candy-muted mt-1">
            إدارة أصناف الحلويات والأسعار، وتبديل حالة التوفر الفوري في المتجر (FR-022)
          </p>
        </div>

        {/* زر إضافة منتج سريع في الشريط العلوي للمدير */}
        {isManager && (
          <div className="flex items-center gap-2">
            <Link href="/admin/products/new">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-4 h-4" />}
                className="font-sans font-bold shadow-candy-cta"
              >
                إضافة منتج جديد
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* جدول المنتجات التفاعلي مع الفلاتر والتبديل السريع */}
      <ProductsTable />
    </div>
  );
}
