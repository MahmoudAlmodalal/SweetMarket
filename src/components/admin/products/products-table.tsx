'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Filter,
  Plus,
  Edit3,
  Package,
  Layers,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Tag,
  RefreshCw,
  ExternalLink,
  Lock,
} from 'lucide-react';
import type { Product, Category, ProductUnit } from '@/types';
import { useAdminAuth } from '@/context/admin-auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AvailabilityToggle } from './availability-toggle';
import { ProductImage } from '@/components/storefront/catalog/product-image';
import { getAdminProducts, getAdminCategories } from './product-repository';
import { cn } from '@/lib/utils';
import { normalizeArabicText } from '@/lib/search';

const UNIT_LABELS: Record<ProductUnit, string> = {
  kg: 'كيلوغرام',
  half_kg: 'نصف كيلو',
  piece: 'قطعة',
  box: 'علبة / بوكس',
};

type AvailabilityFilter = 'all' | 'available' | 'unavailable';
type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc';

export function ProductsTable() {
  const { isManager, isStaff, role } = useAdminAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // الفلاتر والبحث
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // جلب البيانات
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedProducts, fetchedCategories] = await Promise.all([
        getAdminProducts(),
        getAdminCategories(),
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
    } catch (err) {
      console.error('[ProductsTable] Error loading products:', err);
      setError('تعذر تحميل قائمة المنتجات، يرجى المحاولة مجدداً');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // الاستماع لأي تغييرات تحدث في المنتجات من نوافذ أخرى أو نماذج
    const handleProductsChanged = () => {
      loadData();
    };

    window.addEventListener('candy-products-changed', handleProductsChanged);
    return () => {
      window.removeEventListener('candy-products-changed', handleProductsChanged);
    };
  }, [loadData]);

  // خريطة أسماء التصنيفات
  const categoriesMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => map.set(cat.id, cat.name));
    return map;
  }, [categories]);

  // تحديث حالة المنتج محلياً عند التبديل السريع
  const handleAvailabilityChange = (productId: string, newStatus: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isAvailable: newStatus } : p))
    );
  };

  // فلترة وترتيب المنتجات
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // فلتر البحث - يطبق قواعد التنقيح العربي الموحدة (توحيد الألفات والتاء المربوطة وتجريد التشكيل)
    if (searchQuery.trim()) {
      const q = normalizeArabicText(searchQuery);
      result = result.filter(
        (p) =>
          normalizeArabicText(p.name).includes(q) ||
          (p.nameEn && normalizeArabicText(p.nameEn).includes(q)) ||
          p.id.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      );
    }

    // فلتر التصنيف
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }

    // فلتر التوفر
    if (availabilityFilter === 'available') {
      result = result.filter((p) => p.isAvailable);
    } else if (availabilityFilter === 'unavailable') {
      result = result.filter((p) => !p.isAvailable);
    }

    // الترتيب
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': {
          const priceA = a.salePrice ?? a.price;
          const priceB = b.salePrice ?? b.price;
          return priceA - priceB;
        }
        case 'price-desc': {
          const priceA = a.salePrice ?? a.price;
          const priceB = b.salePrice ?? b.price;
          return priceB - priceA;
        }
        case 'name-asc':
          return a.name.localeCompare(b.name, 'ar');
        case 'newest':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return result;
  }, [products, searchQuery, selectedCategory, availabilityFilter, sortBy]);

  // إحصائيات سريعة
  const stats = useMemo(() => {
    const total = products.length;
    const available = products.filter((p) => p.isAvailable).length;
    const unavailable = total - available;
    return { total, available, unavailable };
  }, [products]);

  // إعادة ضبط الفلاتر
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setAvailabilityFilter('all');
    setSortBy('newest');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    availabilityFilter !== 'all' ||
    sortBy !== 'newest';

  return (
    <div className="space-y-6" dir="rtl">
      {/* شريط الإحصائيات السريعة */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-candy-card border border-candy-line/80 shadow-candy-1 hover:shadow-candy-soft transition-all duration-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-sans text-candy-muted font-medium">إجمالي المنتجات</p>
            <p className="text-2xl font-bold font-display text-candy-ink mt-0.5">{stats.total}</p>
          </div>
          <div className="w-11 h-11 rounded-card bg-candy-blush/40 border border-candy-line-dark flex items-center justify-center text-candy-berry shadow-xs">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-candy-card border border-candy-line/80 shadow-candy-1 hover:shadow-candy-soft transition-all duration-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-sans text-emerald-700 font-medium">متاح للطلب الفوري</p>
            <p className="text-2xl font-bold font-display text-emerald-700 mt-0.5">{stats.available}</p>
          </div>
          <div className="w-11 h-11 rounded-card bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-candy-card border border-candy-line/80 shadow-candy-1 hover:shadow-candy-soft transition-all duration-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-sans text-rose-700 font-medium">غير متاح (نفد المخزون)</p>
            <p className="text-2xl font-bold font-display text-rose-700 mt-0.5">{stats.unavailable}</p>
          </div>
          <div className="w-11 h-11 rounded-card bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shadow-xs">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* شريط أدوات الفلترة والبحث وإضافة منتج */}
      <div className="bg-white p-4 sm:p-5 rounded-candy-card border border-candy-line/80 shadow-candy-1 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* حقل البحث */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-candy-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم العربي، الإنجليزي، أو المعرّف..."
              className="w-full pr-10 pl-4 py-2.5 rounded-candy-pill border border-candy-line bg-candy-cream/40 text-sm text-candy-ink focus:outline-none focus:ring-2 focus:ring-candy-berry/30 focus:border-candy-berry transition-all placeholder:text-candy-muted/70 font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-candy-muted hover:text-candy-ink bg-candy-line/60 rounded-full w-5 h-5 flex items-center justify-center"
                aria-label="مسح البحث"
              >
                ✕
              </button>
            )}
          </div>

          {/* زر إضافة منتج جديد - للمدير فقط */}
          <div className="flex items-center gap-2">
            {isManager && (
              <Link href="/admin/products/new">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="w-full sm:w-auto font-sans font-bold shadow-sm"
                >
                  إضافة منتج جديد
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="md"
              onClick={loadData}
              className="text-candy-muted hover:text-candy-ink p-2.5 rounded-input border border-candy-line hover:bg-candy-soft transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* فلاتر التصنيف، التوفر، والترتيب */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-3 border-t border-candy-line/60">
          {/* فلتر التصنيف */}
          <div>
            <label className="block text-xs font-bold text-candy-muted mb-1 font-sans">التصنيف:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs font-sans rounded-candy-pill border border-candy-line bg-white text-candy-ink focus:outline-none focus:ring-2 focus:ring-candy-berry/30 hover:border-candy-blush transition-colors"
            >
              <option value="all">جميع التصنيفات ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* فلتر التوفر */}
          <div>
            <label className="block text-xs font-bold text-candy-muted mb-1 font-sans">حالة التوفر:</label>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as AvailabilityFilter)}
              className="w-full px-3 py-2 text-xs font-sans rounded-candy-pill border border-candy-line bg-white text-candy-ink focus:outline-none focus:ring-2 focus:ring-candy-berry/30 hover:border-candy-blush transition-colors"
            >
              <option value="all">جميع الحالات</option>
              <option value="available">متاح للطلب فقط</option>
              <option value="unavailable">غير متاح (نفد المخزون)</option>
            </select>
          </div>

          {/* الترتيب */}
          <div>
            <label className="block text-xs font-bold text-candy-muted mb-1 font-sans">الترتيب حسب:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-3 py-2 text-xs font-sans rounded-candy-pill border border-candy-line bg-white text-candy-ink focus:outline-none focus:ring-2 focus:ring-candy-berry/30 hover:border-candy-blush transition-colors"
            >
              <option value="newest">الأحدث أولاً</option>
              <option value="price-asc">السعر: من الأقل للأعلى</option>
              <option value="price-desc">السعر: من الأعلى للأقل</option>
              <option value="name-asc">الاسم (أبجدياً)</option>
            </select>
          </div>

          {/* عدد النتائج وإعادة الضبط */}
          <div className="flex items-end justify-between sm:justify-end gap-2">
            <span className="text-xs font-sans text-candy-muted py-2">
              عرض <strong className="text-candy-ink font-bold">{filteredProducts.length}</strong> من {products.length}
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-candy-berry hover:underline py-1 px-2"
              >
                إعادة الضبط
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* تنبيه حالة الدور للموظف */}
      {isStaff && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-card flex items-center gap-3 text-amber-900 text-xs font-sans shadow-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-700" />
          <span>
            أنت مسجل حالياً بصلاحية <strong>موظف تشغيل</strong>. يمكنك تبديل حالة توفر المنتجات فورياً لمطبخ الحلويات، بينما تعديل الأسعار والمواصفات متاح لمدير المتجر فقط.
          </span>
        </div>
      )}

      {/* محتوى المنتجات: جدول على الشاشات الكبيرة وبطاقات على الجوال */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-candy-card border border-candy-line space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-candy-line/40 last:border-0">
                <Skeleton className="w-14 h-14 rounded-card" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="w-20 h-6" />
                <Skeleton className="w-16 h-8" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-candy-card border border-rose-200 text-center space-y-3 shadow-candy-1">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-candy-ink font-sans">{error}</h3>
          <Button variant="secondary" size="md" onClick={loadData}>
            إعادة المحاولة
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white p-12 rounded-candy-card border border-candy-line text-center space-y-4 shadow-candy-1">
          <div className="w-16 h-16 rounded-card bg-candy-blush/40 border border-candy-line-dark flex items-center justify-center text-candy-berry mx-auto shadow-xs">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display text-candy-ink">
              {hasActiveFilters ? 'لا توجد منتجات مطابقة للبحث' : 'لا يوجد أي منتجات في الكتالوج'}
            </h3>
            <p className="text-xs text-candy-muted font-sans mt-1 max-w-md mx-auto">
              {hasActiveFilters
                ? 'جرب تغيير معايير البحث أو تصفية التصنيفات أو إعادة ضبط الفلاتر'
                : 'ابدأ بإضافة أول منتج لمتجر كاندي لوز لكي يظهر للزبائن في قائمة المتجر'}
            </p>
          </div>
          {hasActiveFilters ? (
            <Button variant="secondary" size="md" onClick={handleResetFilters}>
              إلغاء الفلاتر
            </Button>
          ) : isManager ? (
            <Link href="/admin/products/new">
              <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                إضافة أول منتج
              </Button>
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          {/* 1. جدول الشاشات المتوسطة والكبيرة (md:table) */}
          <div className="hidden md:block bg-white rounded-candy-card border border-candy-line/80 shadow-candy-1 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-candy-soft/60 border-b border-candy-line text-xs font-sans font-bold text-candy-ink">
                    <th className="py-3.5 px-4">الصورة</th>
                    <th className="py-3.5 px-4">اسم المنتج</th>
                    <th className="py-3.5 px-4">التصنيف</th>
                    <th className="py-3.5 px-4">السعر</th>
                    <th className="py-3.5 px-4">وحدة البيع</th>
                    <th className="py-3.5 px-4">التوفر الفوري</th>
                    <th className="py-3.5 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-candy-line/60 font-sans text-sm">
                  {filteredProducts.map((product) => {
                    const categoryName = categoriesMap.get(product.categoryId) || 'عام';
                    const hasDiscount = Boolean(product.salePrice && product.salePrice < product.price);

                    return (
                      <tr
                        key={product.id}
                        className={cn(
                          'hover:bg-candy-cream/40 transition-colors group',
                          !product.isAvailable && 'bg-slate-50/60'
                        )}
                      >
                        {/* الصورة المصغرة */}
                        <td className="py-3 px-4">
                          <div className="relative w-14 h-14 rounded-card overflow-hidden border border-candy-line bg-candy-soft flex-shrink-0 shadow-xs">
                            {product.imageUrl ? (
                              <ProductImage
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                sizes="56px"
                                className={cn(
                                  'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300',
                                  !product.isAvailable && 'grayscale-[40%]'
                                )}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-candy-muted">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                            {product.isFeatured && (
                              <span
                                className="absolute top-1 right-1 bg-amber-400 text-amber-950 p-0.5 rounded-full shadow-sm"
                                title="منتج مميز"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </td>

                        {/* الاسم والتفاصيل */}
                        <td className="py-3 px-4 max-w-xs">
                          <div>
                            <div className="font-bold text-candy-ink line-clamp-1 group-hover:text-candy-berry transition-colors">
                              {product.name}
                            </div>
                            {product.nameEn && (
                              <div className="text-xs text-candy-muted font-sans line-clamp-1" dir="ltr">
                                {product.nameEn}
                              </div>
                            )}
                            <div className="text-[11px] text-candy-muted/80 mt-0.5">
                              معرّف: <span className="font-mono text-xs">{product.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* التصنيف */}
                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-candy-pill bg-candy-blush/40 text-candy-berry text-xs font-semibold border border-candy-line-dark">
                            {categoryName}
                          </span>
                        </td>

                        {/* السعر والتخفيض */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {hasDiscount ? (
                            <div className="space-y-0.5">
                              <div className="font-bold text-candy-berry text-base font-mono whitespace-nowrap select-none">
                                {product.salePrice} ₪
                              </div>
                              <div className="text-xs text-candy-muted line-through font-mono whitespace-nowrap select-none">
                                {product.price} ₪
                              </div>
                            </div>
                          ) : (
                            <div className="font-bold text-candy-ink text-base font-mono whitespace-nowrap select-none">
                              {product.price} ₪
                            </div>
                          )}
                        </td>

                        {/* وحدة البيع */}
                        <td className="py-3 px-4 text-xs text-candy-ink whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-candy-soft text-candy-ink border border-candy-line/60">
                            {UNIT_LABELS[product.unit] || product.unit}
                          </span>
                        </td>

                        {/* مفتاح التبديل الفوري للتوفر */}
                        <td className="py-3 px-4">
                          <AvailabilityToggle
                            productId={product.id}
                            productName={product.name}
                            initialAvailable={product.isAvailable}
                            onToggleSuccess={(newStatus) =>
                              handleAvailabilityChange(product.id, newStatus)
                            }
                            size="md"
                          />
                        </td>

                        {/* زر التعديل - للمدير فقط */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {isManager ? (
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <Button
                                variant="secondary"
                                size="sm"
                                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                                className="text-xs font-bold"
                              >
                                تعديل
                              </Button>
                            </Link>
                          ) : (
                            <span
                              className="text-xs text-candy-muted px-2.5 py-1 bg-slate-100 rounded-candy-pill inline-flex items-center gap-1 cursor-not-allowed border border-slate-200"
                              title="تعديل المنتج متاح لمدير المتجر فقط"
                            >
                              <Lock className="w-3 h-3 text-slate-400" />
                              للمدير
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. بطاقات مكدسة على شاشات الجوال (< md) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {filteredProducts.map((product) => {
              const categoryName = categoriesMap.get(product.categoryId) || 'عام';
              const hasDiscount = Boolean(product.salePrice && product.salePrice < product.price);

              return (
                <div
                  key={product.id}
                  className={cn(
                    'bg-white p-4 rounded-candy-card border border-candy-line/80 shadow-candy-1 space-y-3',
                    !product.isAvailable && 'bg-slate-50/70 border-slate-200'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* الصورة */}
                    <div className="relative w-16 h-16 rounded-card overflow-hidden border border-candy-line bg-candy-soft flex-shrink-0 shadow-xs">
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className={cn(
                          'w-full h-full object-cover',
                          !product.isAvailable && 'grayscale-[40%]'
                        )}
                      />
                      {product.isFeatured && (
                        <span className="absolute top-1 right-1 bg-amber-400 text-amber-950 p-0.5 rounded-full shadow-sm">
                          <Sparkles className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {/* بيانات المنتج والتصنيف */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-candy-pill bg-candy-blush/40 text-candy-berry text-[10px] font-semibold border border-candy-line-dark">
                          {categoryName}
                        </span>
                        <span className="text-[10px] text-candy-muted">
                          {UNIT_LABELS[product.unit] || product.unit}
                        </span>
                      </div>
                      <h4 className="font-bold text-candy-ink text-sm mt-1 line-clamp-1">{product.name}</h4>
                      {product.nameEn && (
                        <p className="text-xs text-candy-muted font-sans line-clamp-1" dir="ltr">
                          {product.nameEn}
                        </p>
                      )}
                      <div className="mt-1 flex items-baseline gap-2">
                        {hasDiscount ? (
                          <>
                            <span className="font-bold text-candy-berry text-base font-mono whitespace-nowrap select-none">{product.salePrice} ₪</span>
                            <span className="text-xs text-candy-muted line-through font-mono whitespace-nowrap select-none">{product.price} ₪</span>
                          </>
                        ) : (
                          <span className="font-bold text-candy-ink text-base font-mono whitespace-nowrap select-none">{product.price} ₪</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* شريط الإجراءات والتوفر السريع */}
                  <div className="pt-2.5 border-t border-candy-line/60 flex items-center justify-between gap-2">
                    <AvailabilityToggle
                      productId={product.id}
                      productName={product.name}
                      initialAvailable={product.isAvailable}
                      onToggleSuccess={(newStatus) =>
                        handleAvailabilityChange(product.id, newStatus)
                      }
                      size="sm"
                    />

                    {isManager ? (
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                          className="text-xs font-bold"
                        >
                          تعديل
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-[11px] text-candy-muted flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-[4px]">
                        <Lock className="w-3 h-3 text-slate-400" />
                        تعديل للمدير فقط
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default ProductsTable;
