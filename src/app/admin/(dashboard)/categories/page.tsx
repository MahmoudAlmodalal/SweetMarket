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
  getAdminAllCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '@/lib/repositories';
import { getAdminProducts } from '@/components/admin/products/product-repository';
import type { Category, Product } from '@/types';

export default function AdminCategoriesPage() {
  const { isManager } = useAdminAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // حالة نافذة إضافة / تعديل التصنيف
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // حالة نافذة تأكيد الحذف
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedCategories, fetchedProducts] = await Promise.all([
        getAdminAllCategories(),
        getAdminProducts(),
      ]);
      setCategories([...fetchedCategories].sort((a, b) => a.displayOrder - b.displayOrder));
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Failed to load categories or products:', err);
      toast.error('حدث خطأ أثناء تحميل بيانات التصنيفات من الخادم');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // حساب عدد المنتجات لكل تصنيف
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const prod of products) {
      counts[prod.categoryId] = (counts[prod.categoryId] || 0) + 1;
    }
    return counts;
  }, [products]);

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

    try {
      if (data.id) {
        const updated = await updateAdminCategory(data.id, {
          name: data.name,
          slug: data.slug,
          description: data.description,
          imageUrl: data.imageUrl,
          displayOrder: data.displayOrder,
          isActive: data.isActive,
        });
        setCategories((prev) =>
          prev
            .map((cat) => (cat.id === updated.id ? updated : cat))
            .sort((a, b) => a.displayOrder - b.displayOrder)
        );
        toast.success(`تم تحديث تصنيف "${updated.name}" بنجاح`);
      } else {
        const created = await createAdminCategory({
          name: data.name,
          slug: data.slug,
          description: data.description,
          imageUrl: data.imageUrl,
          displayOrder: data.displayOrder,
          isActive: data.isActive,
        });
        setCategories((prev) =>
          [...prev, created].sort((a, b) => a.displayOrder - b.displayOrder)
        );
        toast.success(`تمت إضافة تصنيف "${created.name}" بنجاح`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر حفظ بيانات التصنيف');
    }
  };

  // تبديل حالة التفعيل
  const handleToggleActive = async (cat: Category) => {
    if (!isManager) {
      toast.error('فقط المدير يمكنه تفعيل أو تعطيل التصنيفات');
      return;
    }

    try {
      const updated = await updateAdminCategory(cat.id, { isActive: !cat.isActive });
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.info(
        cat.isActive
          ? `تم تعطيل تصنيف "${cat.name}" وإخفاؤه من المتجر`
          : `تم تفعيل تصنيف "${cat.name}" وإظهاره في المتجر`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر تحديث حالة التصنيف');
    }
  };

  // تقديم التصنيف للأعلى
  const handleMoveUp = async (index: number) => {
    if (index <= 0 || !isManager) return;
    const current = categories[index];
    const prev = categories[index - 1];

    try {
      const [uCurr, uPrev] = await Promise.all([
        updateAdminCategory(current.id, { displayOrder: prev.displayOrder }),
        updateAdminCategory(prev.id, { displayOrder: current.displayOrder }),
      ]);
      setCategories((list) =>
        list
          .map((c) => (c.id === uCurr.id ? uCurr : c.id === uPrev.id ? uPrev : c))
          .sort((a, b) => a.displayOrder - b.displayOrder)
      );
      toast.success(`تم نقل "${current.name}" للأعلى`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر تحديث ترتيب التصنيفات');
    }
  };

  // تأخير التصنيف للأسفل
  const handleMoveDown = async (index: number) => {
    if (index >= categories.length - 1 || !isManager) return;
    const current = categories[index];
    const next = categories[index + 1];

    try {
      const [uCurr, uNext] = await Promise.all([
        updateAdminCategory(current.id, { displayOrder: next.displayOrder }),
        updateAdminCategory(next.id, { displayOrder: current.displayOrder }),
      ]);
      setCategories((list) =>
        list
          .map((c) => (c.id === uCurr.id ? uCurr : c.id === uNext.id ? uNext : c))
          .sort((a, b) => a.displayOrder - b.displayOrder)
      );
      toast.success(`تم نقل "${current.name}" للأسفل`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر تحديث ترتيب التصنيفات');
    }
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
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const targetName = deleteTarget.name;
    try {
      await deleteAdminCategory(deleteTarget.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success(`تم حذف تصنيف "${targetName}" بنجاح`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر حذف التصنيف');
      setDeleteTarget(null);
    }
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
        <span className="font-bold text-candy-ink">التصنيفات</span>
      </nav>

      {/* ترويسة الصفحة مع زر الإضافة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-candy-soft border border-candy-ink text-candy-berry flex items-center justify-center shadow-candy-1 shrink-0">
              <Layers className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-candy-ink">
                إدارة التصنيفات
              </h1>
              <p className="font-sans text-xs sm:text-sm text-candy-muted mt-0.5">
                إدارة أقسام الحلويات وترتيب ظهورها في واجهة المتجر وشريط التصفح
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
              أنت مسجل حالياً بحساب موظف، الإضافة والتعديل وإعادة الترتيب مخصصة لمدير النظام.
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
            <div className="w-10 h-10 rounded-xl bg-candy-soft border border-candy-ink text-candy-berry flex items-center justify-center">
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
            <div className="w-10 h-10 rounded-xl bg-candy-soft border border-candy-ink text-candy-berry flex items-center justify-center">
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
            className="text-xs sm:text-sm bg-candy-cream"
          />
        </div>

        <button
          type="button"
          onClick={loadData}
          title="إعادة تحميل البيانات"
          className="p-2.5 rounded-xl border border-candy-line bg-candy-cream hover:bg-candy-soft text-candy-muted hover:text-candy-berry transition-colors text-xs flex items-center gap-1.5 font-sans"
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
            className="fixed inset-0 bg-candy-ink/40 "
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-candy-cream border border-candy-line shadow-candy-3 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-display font-bold text-lg text-candy-ink">
                تأكيد حذف التصنيف
              </h3>
              <p className="font-sans text-xs text-candy-muted">
                هل أنت متأكد من حذف تصنيف{' '}
                <span className="font-bold text-candy-ink">&quot;{deleteTarget.name}&quot;</span>؟
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
