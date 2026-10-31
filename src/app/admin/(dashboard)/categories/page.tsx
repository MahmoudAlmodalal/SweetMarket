'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Search,
  Sparkles,
  Package,
  Eye,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useAdminAuth } from '@/context/admin-auth-context';
import { CategoryList, CategoryDialog, type CategoryFormData } from '@/components/admin/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import {
  STORAGE_KEYS,
  getStorageItem,
  setStorageItem,
} from '@/lib/storage';
import { MOCK_CATEGORIES } from '@/data/mock/categories';
import { MOCK_PRODUCTS } from '@/data/mock/products';
import type { Category, Product } from '@/types';

export default function AdminCategoriesPage() {
  const { user, isManager } = useAdminAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // حالة نافذة إضافة / تعديل التصنيف
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // حالة نافذة تأكيد الحذف
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // استرجاع التصنيفات والمنتجات من التخزين المحلي
  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      // 1. التصنيفات
      const storedCategories = getStorageItem(STORAGE_KEYS.MOCK_CATEGORIES, null);
      if (storedCategories && storedCategories.length > 0) {
        setCategories([...storedCategories].sort((a, b) => a.displayOrder - b.displayOrder));
      } else {
        setStorageItem(STORAGE_KEYS.MOCK_CATEGORIES, MOCK_CATEGORIES);
        setCategories([...MOCK_CATEGORIES].sort((a, b) => a.displayOrder - b.displayOrder));
      }

      // 2. المنتجات (لحساب عدد المنتجات في كل تصنيف)
      const storedProducts = getStorageItem(STORAGE_KEYS.MOCK_PRODUCTS, null);
      if (storedProducts && storedProducts.length > 0) {
        setProducts(storedProducts);
      } else {
        setStorageItem(STORAGE_KEYS.MOCK_PRODUCTS, MOCK_PRODUCTS);
        setProducts(MOCK_PRODUCTS);
      }
    } catch (err) {
      console.error('Failed to load categories or products:', err);
      toast.error('حدث خطأ أثناء تحميل بيانات التصنيفات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // حساب عدد المنتجات لكل تصنيف
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const prod of products) {
      counts[prod.categoryId] = (counts[prod.categoryId] || 0) + 1;
    }
    return counts;
  }, [products]);

  // حفظ التعديلات في التخزين المحلي فوراً وتحديث الحالة
  const persistCategories = (updated: Category[]) => {
    const sorted = [...updated].sort((a, b) => a.displayOrder - b.displayOrder);
    setCategories(sorted);
    setStorageItem(STORAGE_KEYS.MOCK_CATEGORIES, sorted);
    // إشعار النوافذ الأخرى بتحديث التخزين
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  };

  // فلترة التصنيفات بحسب نص البحث
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.trim().toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  // حفظ تصنيف (إنشاء جديد أو تعديل حالي)
  const handleSaveCategory = async (data: CategoryFormData) => {
    if (!isManager) {
      toast.error('عذراً، تعديل التصنيفات مخصص لمدير النظام فقط');
      return;
    }

    if (data.id) {
      // تعديل تصنيف حالي
      const updated = categories.map((cat) => {
        if (cat.id === data.id) {
          return {
            ...cat,
            name: data.name,
            slug: data.slug,
            description: data.description,
            imageUrl: data.imageUrl,
            displayOrder: data.displayOrder,
            isActive: data.isActive,
          };
        }
        return cat;
      });

      persistCategories(updated);
      toast.success(`تم تحديث تصنيف "${data.name}" بنجاح`);
    } else {
      // إنشاء تصنيف جديد
      const newCat: Category = {
        id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      };

      const updated = [...categories, newCat];
      persistCategories(updated);
      toast.success(`تمت إضافة تصنيف "${data.name}" بنجاح`);
    }
  };

  // تبديل حالة التفعيل
  const handleToggleActive = (cat: Category) => {
    if (!isManager) {
      toast.error('فقط المدير يمكنه تفعيل أو تعطيل التصنيفات');
      return;
    }

    const updated = categories.map((c) =>
      c.id === cat.id ? { ...c, isActive: !c.isActive } : c
    );
    persistCategories(updated);
    toast.info(
      cat.isActive
        ? `تم تعطيل تصنيف "${cat.name}" وإخفاؤه من المتجر`
        : `تم تفعيل تصنيف "${cat.name}" وإظهاره في المتجر`
    );
  };

  // تقديم التصنيف للأعلى
  const handleMoveUp = (index: number) => {
    if (index <= 0 || !isManager) return;
    const current = categories[index];
    const prev = categories[index - 1];

    const updated = [...categories];
    const tempOrder = current.displayOrder;
    current.displayOrder = prev.displayOrder;
    prev.displayOrder = tempOrder;

    persistCategories(updated);
    toast.success(`تم نقل "${current.name}" للأعلى`);
  };

  // تأخير التصنيف للأسفل
  const handleMoveDown = (index: number) => {
    if (index >= categories.length - 1 || !isManager) return;
    const current = categories[index];
    const next = categories[index + 1];

    const updated = [...categories];
    const tempOrder = current.displayOrder;
    current.displayOrder = next.displayOrder;
    next.displayOrder = tempOrder;

    persistCategories(updated);
    toast.success(`تم نقل "${current.name}" للأسفل`);
  };

  // طلب حذف تصنيف
  const handleDeleteRequest = (cat: Category) => {
    if (!isManager) {
      toast.error('فقط المدير يملك صلاحية حذف التصنيفات');
      return;
    }

    const count = productCounts[cat.id] ?? 0;
    if (count > 0) {
      toast.error(
        'لا يمكن حذف هذا التصنيف',
        `يوجد ${count} منتج مرتبط بهذا التصنيف. يرجى نقل أو حذف المنتجات أولاً.`
      );
      return;
    }

    setDeleteTarget(cat);
  };

  // تأكيد الحذف النهائي
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    const targetName = deleteTarget.name;
    const updated = categories
      .filter((c) => c.id !== deleteTarget.id)
      .map((c, i) => ({ ...c, displayOrder: i + 1 }));

    persistCategories(updated);
    setDeleteTarget(null);
    toast.success(`تم حذف تصنيف "${targetName}" بنجاح`);
  };

  // إحصائيات سريعة
  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.isActive).length;
  const totalProducts = Object.values(productCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12" dir="rtl">
      {/* مسار التصفح (Breadcrumb) */}
      <nav aria-label="مسار التصفح" className="flex items-center gap-2 text-xs text-candy-muted font-sans">
        <Link href="/admin/orders" className="hover:text-candy-berry transition-colors">
          لوحة الإدارة
        </Link>
        <span>/</span>
        <span className="font-bold text-candy-ink">التصنيفات (SCR-17)</span>
      </nav>

      {/* ترويسة الصفحة مع زر الإضافة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center shadow-candy-1 shrink-0">
              <Layers className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-candy-ink">
                إدارة التصنيفات
              </h1>
              <p className="font-sans text-xs sm:text-sm text-candy-muted mt-0.5">
                إدارة أقسام الحلويات وترتيب ظهورها في واجهة المتجر وشريط التصفح (SCR-17)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setSelectedCategory(null);
              setDialogOpen(true);
            }}
            disabled={!isManager}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-candy-cta font-sans font-bold"
          >
            إضافة تصنيف جديد
          </Button>
        </div>
      </div>

      {/* تنبيه صلاحيات الموظف (إذا كان المستخدم موظفاً وليس مديراً) */}
      {!isManager && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs sm:text-sm font-sans"
        >
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <span className="font-bold block">وضع العرض فقط (صلاحية موظف تشغيل)</span>
            <p className="text-amber-800 text-xs">
              أنت مسجل حالياً بحساب موظف، الإضافة والتعديل وإعادة الترتيب مخصصة لمدير النظام (FR-023).
            </p>
          </div>
        </div>
      )}

      {/* شريط الإحصائيات السريعة */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card elevation="sm" className="border-candy-line">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-candy-muted font-sans block mb-1">
                إجمالي التصنيفات
              </span>
              <span className="font-display font-bold text-2xl text-candy-ink">
                {totalCategories}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card elevation="sm" className="border-candy-line">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-candy-muted font-sans block mb-1">
                التصنيفات المفعلة
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-2xl text-emerald-700">
                  {activeCategories}
                </span>
                <span className="text-xs text-candy-muted">من {totalCategories}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card elevation="sm" className="border-candy-line">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-candy-muted font-sans block mb-1">
                إجمالي المنتجات الموزعة
              </span>
              <span className="font-display font-bold text-2xl text-candy-berry">
                {totalProducts}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* شريط البحث والفلترة السريعة */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث بالاسم أو المعرف..."
            iconPrefix={<Search className="w-4 h-4 text-candy-muted" />}
            className="text-xs sm:text-sm bg-white"
          />
        </div>

        <button
          type="button"
          onClick={loadData}
          title="إعادة تحميل البيانات"
          className="p-2.5 rounded-xl border border-candy-line bg-white hover:bg-candy-soft text-candy-muted hover:text-candy-berry transition-colors text-xs flex items-center gap-1.5 font-sans"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">تحديث</span>
        </button>
      </div>

      {/* قائمة التصنيفات */}
      <section aria-label="قائمة التصنيفات">
        <CategoryList
          categories={filteredCategories}
          productCounts={productCounts}
          onEdit={(cat) => {
            setSelectedCategory(cat);
            setDialogOpen(true);
          }}
          onDelete={handleDeleteRequest}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onToggleActive={handleToggleActive}
          onAddNew={() => {
            setSelectedCategory(null);
            setDialogOpen(true);
          }}
          isLoading={isLoading}
          canManage={isManager}
        />
      </section>

      {/* نافذة إنشاء / تعديل التصنيف */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={selectedCategory}
        existingCategories={categories}
        onSave={handleSaveCategory}
      />

      {/* نافذة تأكيد حذف التصنيف (ER-001) */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-candy-ink/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white border border-candy-line shadow-candy-3 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-display font-bold text-lg text-candy-ink">
                تأكيد حذف التصنيف
              </h3>
              <p className="font-sans text-xs text-candy-muted">
                هل أنت متأكد من حذف تصنيف{' '}
                <span className="font-bold text-candy-ink">"{deleteTarget.name}"</span>؟
                لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleConfirmDelete}
                className="flex-1"
              >
                تأكيد الحذف
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
