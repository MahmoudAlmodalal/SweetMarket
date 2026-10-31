'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  ArrowRight,
  Sparkles,
  Package,
  Layers,
  Scale,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Lock,
  ChevronLeft,
} from 'lucide-react';
import type { Product, Category, ProductUnit, ProductWeightOption } from '@/types';
import { useAdminAuth } from '@/context/admin-auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { saveAdminProduct, getAdminCategories, type SaveProductInput } from './product-repository';
import { cn } from '@/lib/utils';

export interface ProductFormProps {
  mode: 'create' | 'edit';
  initialProduct?: Product | null;
}

const UNIT_OPTIONS = [
  { value: 'kg', label: 'كيلوغرام (كغم)' },
  { value: 'half_kg', label: 'نصف كيلو (500 جم)' },
  { value: 'piece', label: 'قطعة (حبة)' },
  { value: 'box', label: 'علبة / بوكس فاخر' },
];

// روابط صور مقترحة لتسهيل التجربة السريعة
const PRESET_IMAGES = [
  {
    name: 'بقلاوة ملكية',
    url: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'تورتة شوكولاتة',
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'كنافة نابلسية',
    url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'شوكولاتة بلجيكية',
    url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'بيتيفور وسابليه',
    url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
  },
];

interface FormErrors {
  name?: string;
  nameEn?: string;
  categoryId?: string;
  price?: string;
  salePrice?: string;
  unit?: string;
  imageUrl?: string;
  description?: string;
  weights?: string;
}

export function ProductForm({ mode, initialProduct }: ProductFormProps) {
  const router = useRouter();
  const { isManager, isStaff } = useAdminAuth();

  // بيانات التصنيفات
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // حقول النموذج
  const [name, setName] = useState(initialProduct?.name || '');
  const [nameEn, setNameEn] = useState(initialProduct?.nameEn || '');
  const [categoryId, setCategoryId] = useState(initialProduct?.categoryId || '');
  const [price, setPrice] = useState<string>(initialProduct?.price ? String(initialProduct.price) : '');
  const [salePrice, setSalePrice] = useState<string>(
    initialProduct?.salePrice ? String(initialProduct.salePrice) : ''
  );
  const [unit, setUnit] = useState<ProductUnit>(initialProduct?.unit || 'kg');
  const [imageUrl, setImageUrl] = useState(
    initialProduct?.imageUrl || PRESET_IMAGES[0].url
  );
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [isAvailable, setIsAvailable] = useState<boolean>(
    initialProduct !== undefined && initialProduct !== null ? initialProduct.isAvailable : true
  );
  const [isFeatured, setIsFeatured] = useState<boolean>(initialProduct?.isFeatured || false);

  // خيارات الأوزان المتعددة
  const [weights, setWeights] = useState<ProductWeightOption[]>(
    initialProduct?.availableWeights && initialProduct.availableWeights.length > 0
      ? initialProduct.availableWeights
      : []
  );

  // حالة الخطأ والإرسال
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  // تحميل التصنيفات
  useEffect(() => {
    async function fetchCats() {
      try {
        const cats = await getAdminCategories();
        setCategories(cats);
        if (!categoryId && cats.length > 0) {
          setCategoryId(cats[0].id);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setIsLoadingCategories(false);
      }
    }
    fetchCats();
  }, [categoryId]);

  // تحديث القيم عند تغير initialProduct
  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setNameEn(initialProduct.nameEn || '');
      setCategoryId(initialProduct.categoryId);
      setPrice(String(initialProduct.price));
      setSalePrice(initialProduct.salePrice ? String(initialProduct.salePrice) : '');
      setUnit(initialProduct.unit);
      setImageUrl(initialProduct.imageUrl);
      setDescription(initialProduct.description);
      setIsAvailable(initialProduct.isAvailable);
      setIsFeatured(Boolean(initialProduct.isFeatured));
      setWeights(initialProduct.availableWeights || []);
    }
  }, [initialProduct]);

  // التحقق من صحة النموذج (Validation Rules - ER-001, ER-008)
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. الاسم بالعربية مطلوب ولا يقل عن 3 أحرف
    if (!name.trim()) {
      newErrors.name = 'يرجى إدخال اسم المنتج باللغة العربية';
    } else if (name.trim().length < 3) {
      newErrors.name = 'اسم المنتج يجب ألا يقل عن 3 أحرف';
    }

    // 2. التصنيف مطلوب
    if (!categoryId) {
      newErrors.categoryId = 'يرجى اختيار التصنيف الذي ينتمي إليه المنتج';
    }

    // 3. السعر الأساسي موجب وأكبر من صفر
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice)) {
      newErrors.price = 'يرجى تحديد سعر المنتج الأساسي';
    } else if (parsedPrice <= 0) {
      newErrors.price = 'السعر الأساسي يجب أن يكون رقماً موجباً أكبر من صفر';
    }

    // 4. سعر العرض إن وجد يجب أن يكون أقل من السعر الأساسي وموجباً
    if (salePrice.trim()) {
      const parsedSalePrice = parseFloat(salePrice);
      if (isNaN(parsedSalePrice) || parsedSalePrice <= 0) {
        newErrors.salePrice = 'سعر العرض يجب أن يكون رقماً موجباً';
      } else if (!isNaN(parsedPrice) && parsedSalePrice >= parsedPrice) {
        newErrors.salePrice = 'سعر العرض يجب أن يكون أقل من السعر الأساسي';
      }
    }

    // 5. رابط الصورة مطلوب وصحيح
    if (!imageUrl.trim()) {
      newErrors.imageUrl = 'يرجى وضع رابط صورة صالح للمنتج';
    } else if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('/')) {
      newErrors.imageUrl = 'رابط الصورة يجب أن يبدأ بـ http:// أو https://';
    }

    // 6. الوصف مطلوب
    if (!description.trim()) {
      newErrors.description = 'يرجى كتابة وصف تعريفي للمنتج ومكوناته';
    } else if (description.trim().length < 10) {
      newErrors.description = 'الوصف التعريفي قصير جداً، يرجى كتابة 10 أحرف على الأقل';
    }

    // 7. التحقق من الأوزان إن وُجدت
    for (let i = 0; i < weights.length; i++) {
      const w = weights[i];
      if (!w.label.trim() || w.price <= 0 || w.multiplier <= 0) {
        newErrors.weights = 'يرجى التأكد من ملء جميع تفاصيل الأوزان بأسعار ومعاملات صحيحة';
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // إدارة خيارات الوزن
  const handleAddWeight = () => {
    const currentBasePrice = parseFloat(price) || 50;
    const nextMultiplier = weights.length === 0 ? 0.5 : weights.length === 1 ? 1 : 2;
    const defaultLabel =
      nextMultiplier === 0.5
        ? 'نصف كيلو (500 جم)'
        : nextMultiplier === 1
        ? 'كيلو كامل (1000 جم)'
        : `حجم عائلي (${nextMultiplier} كجم)`;

    const newWeight: ProductWeightOption = {
      label: defaultLabel,
      multiplier: nextMultiplier,
      price: Math.round(currentBasePrice * nextMultiplier),
    };

    setWeights([...weights, newWeight]);
  };

  const handleUpdateWeight = (index: number, field: keyof ProductWeightOption, value: any) => {
    setWeights((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveWeight = (index: number) => {
    setWeights((prev) => prev.filter((_, i) => i !== index));
  };

  // حفظ المنتج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('بيانات غير مكتملة', 'يرجى تصحيح الأخطاء الموضحة في النموذج أدناه');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: SaveProductInput = {
        id: initialProduct?.id,
        name: name.trim(),
        nameEn: nameEn.trim() || undefined,
        categoryId,
        price: parseFloat(price),
        salePrice: salePrice.trim() ? parseFloat(salePrice) : undefined,
        unit,
        imageUrl: imageUrl.trim(),
        description: description.trim(),
        isAvailable,
        isFeatured,
        availableWeights: weights.length > 0 ? weights : undefined,
      };

      const saved = await saveAdminProduct(payload);

      toast.success(
        mode === 'create' ? 'تم إضافة المنتج بنجاح' : 'تم تحديث بيانات المنتج',
        `تم حفظ "${saved.name}" وأصبح مسجلاً في كتالوج المتجر.`
      );

      // العودة لصفحة المنتجات بعد الحفظ
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      console.error('[ProductForm] Save error:', err);
      toast.error(
        'تعذر حفظ المنتج',
        err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء الحفظ'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // فحص الصلاحيات (RBAC): نموذج الإضافة والتعديل مخصص للمدير فقط
  if (!isManager) {
    return (
      <div className="bg-white p-8 rounded-candy-card border border-rose-200 text-center space-y-4 shadow-candy-1 max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold font-display text-candy-ink">
          غير مسموح لك بهذا الإجراء (SCR-20)
        </h3>
        <p className="text-sm font-sans text-candy-muted leading-relaxed">
          عذراً، إضافة المنتجات وتعديل أسعارها ومواصفاتها مقتصر على <strong>مدير المتجر (Manager)</strong>. يمكنك كـ <strong>موظف تشغيل</strong> تبديل حالة توفر المنتج الفورية من قائمة الكتالوج.
        </p>
        <div className="pt-2">
          <Link href="/admin/products">
            <Button variant="primary" size="md">
              العودة إلى قائمة المنتجات
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto" dir="rtl">
      {/* 1. المعلومات الأساسية والاسم */}
      <Card elevation="sm">
        <CardHeader>
          <div className="flex items-center gap-2.5 text-candy-berry font-bold text-base">
            <Package className="w-5 h-5" />
            <span>بيانات المنتج الأساسية</span>
          </div>
          <CardDescription>
            أدخل اسم المنتج باللغتين العربية والإنجليزية والتصنيف التابع له
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="اسم المنتج بالعربية *"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={errors.name}
              placeholder="مثال: صينية مشكل بقلاوة إكسترا فستق"
            />

            <Input
              label="اسم المنتج بالإنجليزية (اختياري)"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Mixed Baklava Extra Tray"
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select
                label="التصنيف الرئيسي *"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  if (errors.categoryId) setErrors((prev) => ({ ...prev, categoryId: undefined }));
                }}
                error={errors.categoryId}
                options={categoryOptions}
                disabled={isLoadingCategories}
              />
              {isLoadingCategories && (
                <p className="text-[11px] text-candy-muted mt-1 font-sans">جاري تحميل التصنيفات...</p>
              )}
            </div>

            <Select
              label="وحدة البيع والقياس *"
              value={unit}
              onChange={(e) => setUnit(e.target.value as ProductUnit)}
              options={UNIT_OPTIONS}
            />
          </div>

          <Textarea
            label="الوصف التعريفي والمكونات *"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
            }}
            error={errors.description}
            placeholder="اكتب وصفاً شهياً يوضح مكونات الصنف، الحشوة، السمن المستخدم، وتفاصيل الطعم..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* 2. التسعير والعروض */}
      <Card elevation="sm">
        <CardHeader>
          <div className="flex items-center gap-2.5 text-candy-berry font-bold text-base">
            <span className="text-xl">₪</span>
            <span>الأسعار والعروض الترويجية</span>
          </div>
          <CardDescription>
            حدد السعر الأساسي وسعر العرض التخفيضي إن وُجد (بالشيكل ₪)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="السعر الأساسي (شيكل ₪) *"
              type="number"
              min="0.1"
              step="0.5"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                if (errors.price) setErrors((prev) => ({ ...prev, price: undefined }));
              }}
              error={errors.price}
              placeholder="مثال: 65"
              iconSuffix={<span className="text-xs text-candy-muted font-bold font-sans">₪</span>}
            />

            <Input
              label="سعر العرض / التخفيض (شيكل ₪ - اختياري)"
              type="number"
              min="0.1"
              step="0.5"
              value={salePrice}
              onChange={(e) => {
                setSalePrice(e.target.value);
                if (errors.salePrice) setErrors((prev) => ({ ...prev, salePrice: undefined }));
              }}
              error={errors.salePrice}
              helperText="اتركه فارغاً إذا لم يكن هناك خصم حالي على المنتج"
              placeholder="مثال: 59"
              iconSuffix={<span className="text-xs text-candy-muted font-bold font-sans">₪</span>}
            />
          </div>

          {/* معاينة شارة الخصم المحسوبة */}
          {parseFloat(price) > 0 && parseFloat(salePrice) > 0 && parseFloat(salePrice) < parseFloat(price) && (
            <div className="p-3 bg-candy-blush/40 border border-candy-line-dark rounded-2xl flex items-center justify-between text-xs font-sans">
              <span className="text-candy-ink">
                نسبة التوفير للزبون:
              </span>
              <span className="font-bold text-candy-strawberry px-3 py-1 rounded-candy-pill bg-white shadow-sm">
                توفير {Math.round(((parseFloat(price) - parseFloat(salePrice)) / parseFloat(price)) * 100)}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. خيارات الأوزان والأحجام (Weight Options) */}
      <Card elevation="sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-candy-berry font-bold text-base">
              <Scale className="w-5 h-5" />
              <span>خيارات الأوزان المتعددة (اختياري)</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddWeight}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              إضافة خيار وزن
            </Button>
          </div>
          <CardDescription>
            يتيح للزبون في صفحة المنتج اختيار الوزن المطلوب (مثل: نصف كيلو، 1 كغم، صينية عائلية)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {weights.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-candy-line rounded-2xl text-candy-muted text-xs font-sans space-y-2">
              <p>لم يتم تحديد خيارات وزن مخصصة لهذا المنتج بعد.</p>
              <p className="text-[11px]">سيتم احتساب السعر الأساسي للوحدة المحددة أعلاه تلقائياً.</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddWeight}
                className="text-candy-berry font-bold text-xs"
              >
                + إضافة خيار وزن أولي
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {weights.map((w, index) => (
                <div
                  key={index}
                  className="p-3 bg-candy-cream/60 rounded-2xl border border-candy-line grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                >
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-bold text-candy-muted mb-1">تسمية الخيار:</label>
                    <input
                      type="text"
                      value={w.label}
                      onChange={(e) => handleUpdateWeight(index, 'label', e.target.value)}
                      placeholder="مثال: نصف كيلو (500 جم)"
                      className="w-full px-3 py-1.5 text-xs font-sans rounded-candy-pill border border-candy-line bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-candy-muted mb-1">المعامل (Multiplier):</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={w.multiplier}
                      onChange={(e) => handleUpdateWeight(index, 'multiplier', parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 text-xs font-sans rounded-candy-pill border border-candy-line bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-candy-muted mb-1">السعر (شيكل ₪):</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={w.price}
                      onChange={(e) => handleUpdateWeight(index, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs font-sans rounded-candy-pill border border-candy-line bg-white"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end items-end sm:pt-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveWeight(index)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-full transition-colors"
                      title="حذف هذا الخيار"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {errors.weights && (
                <p className="text-xs text-rose-600 font-sans">{errors.weights}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. الصورة والمعاينة */}
      <Card elevation="sm">
        <CardHeader>
          <div className="flex items-center gap-2.5 text-candy-berry font-bold text-base">
            <ImageIcon className="w-5 h-5" />
            <span>صورة المنتج الرئيسية (ER-008)</span>
          </div>
          <CardDescription>
            ضع رابط صورة عالية الدقة للمنتج، أو اختر من الصور الجاهزة بالأسفل
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="رابط الصورة (Image URL) *"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              setImageLoadError(false);
              if (errors.imageUrl) setErrors((prev) => ({ ...prev, imageUrl: undefined }));
            }}
            error={errors.imageUrl}
            placeholder="https://images.unsplash.com/photo-..."
            dir="ltr"
            className="text-left font-mono text-xs"
          />

          {/* روابط سريعة جاهزة */}
          <div>
            <label className="block text-xs font-bold text-candy-muted mb-1.5 font-sans">
              صور حلويات مقترحة جاهزة للاستخدام السريع:
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setImageUrl(preset.url);
                    setImageLoadError(false);
                    if (errors.imageUrl) setErrors((prev) => ({ ...prev, imageUrl: undefined }));
                  }}
                  className={cn(
                    'px-3 py-1 text-xs rounded-candy-pill font-sans border transition-all',
                    imageUrl === preset.url
                      ? 'bg-candy-berry text-white border-candy-berry shadow-sm'
                      : 'bg-white text-candy-ink border-candy-line hover:bg-candy-soft'
                  )}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* معاينة الصورة */}
          <div className="p-4 bg-candy-soft/60 rounded-2xl border border-candy-line flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-candy-line bg-white flex-shrink-0 shadow-sm">
              {imageUrl && !imageLoadError ? (
                <img
                  src={imageUrl}
                  alt={name || 'معاينة المنتج'}
                  className="w-full h-full object-cover"
                  onError={() => setImageLoadError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-candy-muted text-center">
                  <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                  <span className="text-[10px]">الصورة غير صالحة</span>
                </div>
              )}
            </div>
            <div className="space-y-1 text-center sm:text-right">
              <p className="text-xs font-bold text-candy-ink font-sans">معاينة عرض الصورة</p>
              <p className="text-[11px] text-candy-muted font-sans leading-relaxed">
                ستظهر هذه الصورة للزبائن في بطاقات الكتالوج وشاشة تفاصيل الصنف وعربة التسوق.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. حالة التوفر والتمييز الترويجي */}
      <Card elevation="sm">
        <CardHeader>
          <div className="flex items-center gap-2.5 text-candy-berry font-bold text-base">
            <Sparkles className="w-5 h-5" />
            <span>حالة العرض والتوفر الفوري (FR-022)</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* مفتاح التوفر */}
          <div className="p-4 rounded-2xl bg-white border border-candy-line flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-candy-ink font-sans">
                حالة توفر المنتج للطلب الفوري
              </p>
              <p className="text-xs text-candy-muted font-sans mt-0.5">
                {isAvailable
                  ? 'المنتج متاح ويمكن للزبائن إضافته إلى السلة وإتمام الطلب.'
                  : 'المنتج موسوم كـ "نفد من المخزون" وسيظهر كغير متاح للطلب.'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isAvailable}
              onClick={() => setIsAvailable((prev) => !prev)}
              className={cn(
                'relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry',
                isAvailable ? 'bg-emerald-500' : 'bg-slate-300'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out top-0.5',
                  isAvailable ? 'translate-x-[-1.85rem]' : 'translate-x-[-0.2rem]'
                )}
              />
            </button>
          </div>

          {/* مفتاح التمييز */}
          <div className="p-4 rounded-2xl bg-white border border-candy-line flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-candy-ink font-sans">
                تمييز المنتج في الصفحة الرئيسية (Featured)
              </p>
              <p className="text-xs text-candy-muted font-sans mt-0.5">
                إظهار هذا المنتج في شريط "الأكثر طلباً ومميز" بالصفحة الرئيسية للمتجر.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isFeatured}
              onClick={() => setIsFeatured((prev) => !prev)}
              className={cn(
                'relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-berry',
                isFeatured ? 'bg-amber-500' : 'bg-slate-300'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out top-0.5',
                  isFeatured ? 'translate-x-[-1.85rem]' : 'translate-x-[-0.2rem]'
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* أزرار الإجراءات السفلية */}
      <div className="sticky bottom-4 z-10 bg-white/95 backdrop-blur-md p-4 rounded-candy-card border border-candy-line shadow-candy-2 flex items-center justify-between gap-3">
        <Link href="/admin/products">
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={isSubmitting}
            className="font-sans"
          >
            إلغاء والعودة
          </Button>
        </Link>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          leftIcon={<Save className="w-4 h-4" />}
          className="font-sans font-bold px-8"
        >
          {mode === 'create' ? 'إضافة المنتج إلى الكتالوج' : 'حفظ التعديلات'}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;
