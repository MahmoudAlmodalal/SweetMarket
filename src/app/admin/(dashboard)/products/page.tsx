'use client';

import React from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { ProductsTable } from '@/components/admin/products/products-table';

export default function AdminProductsPage() {
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
            <span className="text-candy-ink font-semibold">إدارة الكتالوج والمنتجات</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-candy-ink flex items-center gap-2.5">
            <Package className="w-7 h-7 text-candy-berry" />
            <span>كتالوج المنتجات والتوفر الفوري</span>
          </h1>
          <p className="text-xs sm:text-sm font-sans text-candy-muted mt-1">
            إدارة أصناف الحلويات والأسعار، وتبديل حالة التوفر الفوري في المتجر
          </p>
        </div>
      </div>

      {/* جدول المنتجات التفاعلي مع الفلاتر والتبديل السريع */}
      <ProductsTable />
    </div>
  );
}
