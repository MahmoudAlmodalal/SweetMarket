'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Sparkles, Layers, Check, RefreshCw } from 'lucide-react';
import type { Category } from '@/types';

export interface CategoryFormData {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  existingCategories: Category[];
  onSave: (data: CategoryFormData) => Promise<void> | void;
}

// عينات صور افتراضية للحلويات للاختيار السريع
const SUGGESTED_IMAGES = [
  {
    label: 'بقلاوة وشرفيات',
    url: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'كيك وتورتات',
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'كنافة نابلسية',
    url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'شوكولاتة فاخرة',
    url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'بيتيفور وبسكويت',
    url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
  },
];

function generateSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, '-')
    .replace(/[^\w\u0621-\u064A0-9-]/g, '')
    .replace(/^-+|-+$/g, '');
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  existingCategories,
  onSave,
}: CategoryDialogProps) {
  const isEditing = Boolean(category);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);

  const [imageError, setImageError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // تحديث الحقول عند فتح النافذة أو تغيير التصنيف المختار
  useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name);
        setSlug(category.slug);
        setDescription(category.description || '');
        setImageUrl(category.imageUrl);
        setDisplayOrder(category.displayOrder);
        setIsActive(category.isActive);
      } else {
        const nextOrder =
          existingCategories.length > 0
            ? Math.max(...existingCategories.map((c) => c.displayOrder)) + 1
            : 1;
        setName('');
        setSlug('');
        setDescription('');
        setImageUrl(SUGGESTED_IMAGES[0].url);
        setDisplayOrder(nextOrder);
        setIsActive(true);
      }
      setImageError(false);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open, category, existingCategories]);

  // توليد الرابط اللطيف تلقائياً عند كتابة الاسم إذا لم يكن في وضع التعديل
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing || !slug) {
      setSlug(generateSlug(val));
    }
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'اسم التصنيف مطلوب';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'اسم التصنيف يجب أن لا يقل عن حرفين';
    } else {
      // فحص فرادة الاسم (ER-001)
      const isDuplicate = existingCategories.some(
        (c) =>
          c.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
          (!category || c.id !== category.id)
      );
      if (isDuplicate) {
        newErrors.name = 'يوجد تصنيف آخر بنفس هذا الاسم، يرجى اختيار اسم فريد';
      }
    }

    const trimmedSlug = slug.trim();
    if (!trimmedSlug) {
      newErrors.slug = 'المعرف الرابطي (slug) مطلوب';
    } else {
      const isDuplicateSlug = existingCategories.some(
        (c) =>
          c.slug.trim().toLowerCase() === trimmedSlug.toLowerCase() &&
          (!category || c.id !== category.id)
      );
      if (isDuplicateSlug) {
        newErrors.slug = 'المعرف الرابطي مستخدم بالفعل لتصنيف آخر';
      }
    }

    if (!imageUrl.trim()) {
      newErrors.imageUrl = 'رابط صورة التصنيف مطلوب';
    }

    if (displayOrder < 1 || isNaN(displayOrder)) {
      newErrors.displayOrder = 'الترتيب يجب أن يكون رقماً صحيحاً 1 أو أكثر';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: category?.id,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim(),
        displayOrder: Number(displayOrder),
        isActive,
      });
      onOpenChange(false);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        form: err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ التصنيف',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold font-display text-candy-ink">
                {isEditing ? `تعديل تصنيف: ${category?.name}` : 'إضافة تصنيف جديد'}
              </DialogTitle>
              <DialogDescription className="text-xs text-candy-muted font-sans mt-0.5">
                {isEditing
                  ? 'تعديل بيانات التصنيف وصورته وترتيبه في المتجر'
                  : 'أدخل تفاصيل التصنيف الجديد لعرضه في شريط الأقسام وواجهة المتجر'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errors.form && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-sans font-medium"
            >
              {errors.form}
            </div>
          )}

          {/* اسم التصنيف */}
          <div>
            <Input
              id="category-name"
              label="اسم التصنيف *"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="مثال: البقلاوة والحلويات الشرقية"
              error={errors.name}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* المعرف الرابطي (slug) مع زر توليد تلقائي */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="category-slug"
                className="block text-xs font-bold text-candy-ink font-sans"
              >
                المعرف الرابطي (Slug) *
              </label>
              <button
                type="button"
                onClick={() => setSlug(generateSlug(name || 'category'))}
                className="text-[11px] text-candy-berry hover:text-candy-berry-dark hover:underline font-sans flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                توليد من الاسم
              </button>
            </div>
            <Input
              id="category-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                if (errors.slug) setErrors((prev) => ({ ...prev, slug: '' }));
              }}
              placeholder="مثال: baklava-eastern"
              error={errors.slug}
              disabled={isSubmitting}
              dir="ltr"
              className="text-left font-mono text-xs"
            />
            <p className="text-[11px] text-candy-muted font-sans mt-1">
              يُستخدم في رابط التصنيف بالمتجر مثل: /category/{slug || '...'}
            </p>
          </div>

          {/* وصف التصنيف */}
          <div>
            <label
              htmlFor="category-description"
              className="block text-xs font-bold text-candy-ink font-sans mb-1.5"
            >
              وصف التصنيف (اختياري)
            </label>
            <Textarea
              id="category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="نبذة تسويقية تظهر للزبون عند تصفح هذا القسم..."
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          {/* رابط الصورة ومعاينتها */}
          <div>
            <Input
              id="category-image"
              label="رابط صورة التصنيف *"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setImageError(false);
                if (errors.imageUrl) setErrors((prev) => ({ ...prev, imageUrl: '' }));
              }}
              placeholder="https://images.unsplash.com/..."
              error={errors.imageUrl}
              disabled={isSubmitting}
              dir="ltr"
              className="text-left font-mono text-xs"
            />

            {/* معاينة الصورة */}
            <div className="mt-2 p-2.5 rounded-xl bg-candy-soft border border-candy-line flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-candy-line shrink-0 flex items-center justify-center">
                {imageUrl && !imageError ? (
                  <img
                    src={imageUrl}
                    alt={name || 'معاينة التصنيف'}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-candy-muted/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-candy-ink block">معاينة الصورة الحية</span>
                <span className="text-[11px] text-candy-muted block mt-0.5">
                  {imageError
                    ? 'تعذر تحميل الصورة من الرابط، يرجى التأكد من صحته'
                    : 'صورة واضحة وجميلة تعبّر عن محتوى القسم'}
                </span>
              </div>
            </div>

            {/* اقتراحات صور سريعة */}
            <div className="mt-2">
              <span className="text-[11px] text-candy-muted font-sans font-medium block mb-1.5">
                أو اختر صورة جاهزة من التشكيلة:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_IMAGES.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImageUrl(item.url);
                      setImageError(false);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-sans bg-white border border-candy-line hover:border-candy-rose hover:bg-candy-soft transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-candy-strawberry" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* الترتيب والحالة النشطة */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-candy-line/60">
            <div>
              <Input
                id="category-order"
                type="number"
                min="1"
                label="ترتيب الظهور *"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                error={errors.displayOrder}
                disabled={isSubmitting}
                helperText="الأقل رقماً يظهر أولاً في شريط الأقسام"
              />
            </div>

            <div className="flex flex-col justify-center pt-2 sm:pt-0">
              <label
                htmlFor="category-is-active"
                className="text-xs font-bold text-candy-ink font-sans mb-1.5"
              >
                حالة التصنيف
              </label>
              <label
                htmlFor="category-is-active"
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-candy-line bg-white hover:bg-candy-soft cursor-pointer transition-colors"
              >
                <input
                  id="category-is-active"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isSubmitting}
                  className="w-4 h-4 rounded text-candy-berry focus:ring-candy-strawberry border-candy-line"
                />
                <span className="text-xs font-semibold text-candy-ink font-sans">
                  {isActive ? 'مفعّل (يظهر للزبائن في المتجر)' : 'معطّل (مخفي مؤقتاً)'}
                </span>
              </label>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-candy-line/60 gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Check className="w-4 h-4" />}
            >
              {isEditing ? 'حفظ التعديلات' : 'إضافة التصنيف'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CategoryDialog;
