'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, PackagePlus } from 'lucide-react';
import { ProductForm } from '@/components/admin/products/product-form';

export default function NewProductPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      {/* رأس الصفحة مع روابط التنقل */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-candy-line/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans text-candy-muted mb-1">
            <Link href="/admin/products" className="hover:text-candy-berry transition-colors flex items-center gap-1">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة إلى قائمة المنتجات</span>
            </Link>
            <span>/</span>
            <span className="text-candy-ink font-semibold">إضافة منتج جديد (SCR-16)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-candy-ink flex items-center gap-2.5">
            <PackagePlus className="w-7 h-7 text-candy-berry" />
            <span>إضافة صنف جديد للكتالوج</span>
          </h1>
          <p className="text-xs sm:text-sm font-sans text-candy-muted mt-1">
            أدخل مواصفات المنتج الجديد والأسعار وخيارات الأوزان لظهوره فوراً في واجهة الزبائن
          </p>
        </div>
      </div>

      {/* نموذج الإضافة */}
      <ProductForm mode="create" />
    </div>
  );
}
