'use client';

import React from 'react';
import {
  Layers,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Package,
  Eye,
  EyeOff,
  Image as ImageIcon,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

export interface CategoryListProps {
  categories: Category[];
  productCounts?: Record<string, number>;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onToggleActive: (category: Category) => void;
  onAddNew?: () => void;
  isLoading?: boolean;
  canManage?: boolean;
}

export function CategoryList({
  categories,
  productCounts = {},
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleActive,
  onAddNew,
  isLoading = false,
  canManage = true,
}: CategoryListProps) {
  // حالة التحميل (Skeleton)
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="جاري تحميل التصنيفات">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white border border-candy-line shadow-candy-1 flex items-center justify-between gap-4 animate-pulse"
          >
            <div className="flex items-center gap-3.5">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="w-14 h-14 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="w-40 h-4 rounded-md" />
                <Skeleton className="w-24 h-3 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-20 h-8 rounded-full" />
              <Skeleton className="w-16 h-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // حالة القائمة الفارغة (Empty State)
  if (categories.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-3xl bg-white border border-candy-line shadow-candy-1">
        <div className="w-16 h-16 rounded-2xl bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center mx-auto mb-4">
          <Layers className="w-8 h-8" aria-hidden="true" />
        </div>
        <h3 className="font-display font-bold text-lg text-candy-ink mb-1">
          لا توجد تصنيفات حالياً
        </h3>
        <p className="font-sans text-xs text-candy-muted max-w-sm mx-auto mb-6">
          أضف تصنيفات الحلويات الشرقية، التورتات، الكنافة، والشوكولاتة لتبدأ بتنظيم منتجات المتجر.
        </p>
        {canManage && onAddNew && (
          <Button
            type="button"
            variant="primary"
            onClick={onAddNew}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            إضافة أول تصنيف
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label="قائمة التصنيفات مرتبة"
      className="space-y-3"
    >
      {categories.map((cat, index) => {
        const count = productCounts[cat.id] ?? 0;
        const hasProducts = count > 0;
        const isFirst = index === 0;
        const isLast = index === categories.length - 1;

        return (
          <div
            key={cat.id}
            role="listitem"
            className={cn(
              'group p-3.5 sm:p-4 rounded-2xl bg-white border transition-all duration-200 shadow-candy-1 hover:shadow-candy-2 flex flex-col md:flex-row md:items-center justify-between gap-4',
              cat.isActive
                ? 'border-candy-line hover:border-candy-blush'
                : 'border-candy-line/60 bg-gray-50/70 opacity-90'
            )}
          >
            {/* الطرف الأيمن: الترتيب، الصورة، الاسم، والوصف */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              {/* أزرار الترتيب السريع */}
              <div className="flex flex-col items-center justify-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onMoveUp(index)}
                  disabled={isFirst || !canManage}
                  aria-label={`نقل تصنيف ${cat.name} للأعلى`}
                  title={`نقل تصنيف ${cat.name} للأعلى`}
                  className={cn(
                    'p-1.5 rounded-lg border text-candy-ink transition-colors focus:outline-none focus:ring-2 focus:ring-candy-strawberry/30',
                    isFirst || !canManage
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                      : 'border-candy-line hover:bg-candy-soft hover:text-candy-berry hover:border-candy-rose'
                  )}
                >
                  <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                <span
                  className="font-mono text-[11px] font-bold text-candy-muted/80"
                  title={`الترتيب: ${cat.displayOrder}`}
                >
                  #{cat.displayOrder}
                </span>

                <button
                  type="button"
                  onClick={() => onMoveDown(index)}
                  disabled={isLast || !canManage}
                  aria-label={`نقل تصنيف ${cat.name} للأسفل`}
                  title={`نقل تصنيف ${cat.name} للأسفل`}
                  className={cn(
                    'p-1.5 rounded-lg border text-candy-ink transition-colors focus:outline-none focus:ring-2 focus:ring-candy-strawberry/30',
                    isLast || !canManage
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                      : 'border-candy-line hover:bg-candy-soft hover:text-candy-berry hover:border-candy-rose'
                  )}
                >
                  <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              {/* صورة مصغرة للتصنيف */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-candy-soft border border-candy-line shrink-0 flex items-center justify-center relative">
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback icon on broken image
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-candy-muted/50" />
                )}
              </div>

              {/* اسم التصنيف والمعلومات */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-display font-bold text-sm sm:text-base text-candy-ink truncate">
                    {cat.name}
                  </h4>
                  {/* شارة عدد المنتجات */}
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-sans font-medium',
                      hasProducts
                        ? 'bg-candy-soft text-candy-berry border border-candy-blush'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    )}
                  >
                    <Package className="w-3 h-3" />
                    <span>{count} منتجات</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[11px] text-candy-muted dir-ltr">
                    /{cat.slug}
                  </span>
                  {cat.description && (
                    <span className="hidden sm:inline text-xs text-candy-muted truncate max-w-xs">
                      • {cat.description}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* الطرف الأيسر: الحالة والإجراءات */}
            <div className="flex items-center justify-between md:justify-end gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-candy-line/60">
              {/* مفتاح تبديل الحالة (مفعل / معطل) */}
              <button
                type="button"
                onClick={() => onToggleActive(cat)}
                disabled={!canManage}
                aria-label={`تبديل حالة تصنيف ${cat.name} (حالياً ${cat.isActive ? 'مفعّل' : 'معطّل'})`}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-sans font-semibold transition-all duration-200 border',
                  cat.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200',
                  !canManage && 'opacity-60 cursor-not-allowed'
                )}
              >
                {cat.isActive ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>مفعّل</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                    <span>معطّل</span>
                  </>
                )}
              </button>

              {/* زر التعديل */}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onEdit(cat)}
                disabled={!canManage}
                aria-label={`تعديل تصنيف ${cat.name}`}
                title={`تعديل تصنيف ${cat.name}`}
                className="h-8 px-2.5"
              >
                <Edit2 className="w-3.5 h-3.5 text-candy-berry" />
                <span className="hidden sm:inline mr-1 text-xs">تعديل</span>
              </Button>

              {/* زر الحذف: معطل مع إشعار إن كان يحتوي على منتجات */}
              <div className="relative inline-block">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(cat)}
                  disabled={hasProducts || !canManage}
                  aria-label={
                    hasProducts
                      ? `لا يمكن حذف ${cat.name} لوجود ${count} منتجات مرتبطة به`
                      : `حذف تصنيف ${cat.name}`
                  }
                  title={
                    hasProducts
                      ? `لا يمكن حذف هذا التصنيف لوجود ${count} منتجات مرتبطة به (ER-001)`
                      : `حذف تصنيف ${cat.name}`
                  }
                  className={cn(
                    'h-8 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50',
                    hasProducts && 'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-rose-600'
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline mr-1 text-xs">حذف</span>
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CategoryList;
