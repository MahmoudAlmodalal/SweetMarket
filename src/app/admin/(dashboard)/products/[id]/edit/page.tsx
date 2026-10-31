'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Edit, AlertCircle, Loader2, Package } from 'lucide-react';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductForm } from '@/components/admin/products/product-form';
import { getAdminProductById } from '@/components/admin/products/product-repository';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      setIsLoading(true);
      setError(null);
      try {
        const found = await getAdminProductById(productId);
        if (!found) {
          setError('لم يتم العثور على المنتج المطلوب. قد يكون تم حذفه أو المعرف غير صحيح.');
        } else {
          setProduct(found);
        }
      } catch (err) {
        console.error('Error fetching product for editing:', err);
        setError('حدث خطأ أثناء تحميل بيانات المنتج، يرجى المحاولة لاحقاً');
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6" dir="rtl">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-candy-card border border-candy-line space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-candy-card border border-rose-200 text-center space-y-4 shadow-candy-1" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-display text-candy-ink">
          المنتج غير موجود
        </h2>
        <p className="text-sm font-sans text-candy-muted leading-relaxed">
          {error || 'لم نتمكن من العثور على المنتج المطلوب في قاعدة البيانات.'}
        </p>
        <div className="pt-2">
          <Link href="/admin/products">
            <Button variant="primary" size="md">
              العودة إلى كتالوج المنتجات
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      {/* رأس الصفحة مع روابط التنقل */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-candy-line/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans text-candy-muted mb-1">
            <Link
              href="/admin/products"
              className="hover:text-candy-berry transition-colors flex items-center gap-1"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة إلى قائمة المنتجات</span>
            </Link>
            <span>/</span>
            <span className="text-candy-ink font-semibold">تعديل المنتج (SCR-16)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-candy-ink flex items-center gap-2.5">
            <Edit className="w-7 h-7 text-candy-berry" />
            <span>تعديل المنتج: {product.name}</span>
          </h1>
          <p className="text-xs sm:text-sm font-sans text-candy-muted mt-1">
            تحديث تفاصيل المنتج، الأسعار، الأوزان، أو تبديل حالة التوفر (معرّف المنتج: {product.id})
          </p>
        </div>
      </div>

      {/* نموذج التعديل */}
      <ProductForm mode="edit" initialProduct={product} />
    </div>
  );
}
