'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * خصائص مكوّن صورة المنتج الموحّد لمتجر كاندي لوز
 */
export interface ProductImageProps {
  /** رابط الصورة (محلي أو بعيد) */
  src?: string | null;
  /** النص البديل المعبّر لتقنيات الوصول (مطلوب) */
  alt: string;
  /** ملء الحاوية الأب (يتطلب حاوية relative) */
  fill?: boolean;
  /** العرض بالبكسل إذا لم يتم استخدام fill */
  width?: number;
  /** الارتفاع بالبكسل إذا لم يتم استخدام fill */
  height?: number;
  /** خاصية sizes لتحسين تحميل الصور المتجاوبة */
  sizes?: string;
  /** أولوية التحميل (LCP / صور البانر الرئيسية) */
  priority?: boolean;
  /** فئات التنسيق المطبقة على الصورة والحاوية البديلة */
  className?: string;
  /** فئات تنسيق إضافية خاصة بحالة العرض البديل (Fallback) */
  fallbackClassName?: string;
  /** تعطيل معالجة Next.js للصور (مفيد لملفات SVG المحلية) */
  unoptimized?: boolean;
  /** استراتيجية التحميل */
  loading?: 'lazy' | 'eager';
  /** جودة الصورة */
  quality?: number;
  /** رد نداء عند نجاح تحميل الصورة */
  onLoad?: () => void;
  /** رد نداء عند حدوث خطأ أثناء تحميل الصورة */
  onError?: () => void;
}

/**
 * مكوّن صورة المنتج الموحّد (ProductImage)
 *
 * يعرض صور المنتجات عبر Next/Image مع دعم تلقائي للصور المتجهية SVG،
 * ويوفر عرضاً بديلاً أنيقاً بهوية "كاندي لوز" عند غياب الصورة أو تعذر تحميلها.
 * العرض البديل مصمم ليكون ملائماً لتقنيات الوصول (Accessible) دون عرض النص البديل
 * الخام كنص بصري مشوه للواجهة.
 */
export function ProductImage({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  priority = false,
  className,
  fallbackClassName,
  unoptimized,
  loading,
  quality,
  onLoad,
  onError,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  // إعادة ضبط حالة الخطأ عند تغيّر رابط الصورة
  useEffect(() => {
    setHasError(false);
  }, [src]);

  // التحقق من صلاحية مسار الصورة
  const trimmedSrc = typeof src === 'string' ? src.trim() : '';
  const isSvg = trimmedSrc.endsWith('.svg') || trimmedSrc.includes('.svg?');
  const shouldUnoptimize = unoptimized ?? isSvg;

  // إذا لم يتم تحديد fill صراحة، يتم افتراضه عند غياب الأبعاد الثابتة (width/height)
  const isFill = fill ?? (!width && !height);

  // حالة الخطأ أو غياب الصورة -> عرض البديل الموسوم بهوية كاندي لوز
  if (!trimmedSrc || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex flex-col items-center justify-center select-none overflow-hidden text-candy-berry p-2 text-center',
          'bg-gradient-to-br from-[#FFF5F8] via-[#FED7E7]/40 to-[#FDF2F4] border border-candy-line/40',
          isFill ? 'absolute inset-0 w-full h-full' : 'w-full h-full',
          fallbackClassName,
          className
        )}
        style={!isFill && width && height ? { width, height } : undefined}
      >
        {/* نص بديل مقروء فقط لقارئات الشاشة لضمان الوصولية دون تشويه الواجهة البصرية */}
        <span className="sr-only">{alt}</span>

        {/* أيقونة شارة كاندي لوز الأنيقة */}
        <div className="relative flex flex-col items-center justify-center pointer-events-none max-w-full">
          <svg
            viewBox="0 0 100 100"
            className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-xs text-candy-berry shrink-0"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#FED7E7" strokeWidth="2" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#FBECC8"
              strokeWidth="1.5"
              strokeDasharray="3 2"
            />
            {/* لمعات برّاقة ذهبية */}
            <path
              d="M28,26 Q28,21 24,21 Q28,21 28,16 Q28,21 32,21 Q28,21 28,26 Z"
              fill="#E8A33D"
            />
            <path
              d="M74,28 Q74,24 70,24 Q74,24 74,20 Q74,24 78,24 Q74,24 74,28 Z"
              fill="#E8A33D"
            />
            {/* حبة حلوى بونبون كاندي لوز */}
            <g transform="translate(50, 48) rotate(-26)">
              <path
                d="M-18,0 L-32,-11 C-36,-8 -34,-5 -35,0 C-34,5 -36,8 -32,11 Z"
                fill="#E8A33D"
              />
              <path
                d="M18,0 L32,-11 C36,-8 34,-5 35,0 C34,5 36,8 32,11 Z"
                fill="#E8A33D"
              />
              <ellipse
                cx="0"
                cy="0"
                rx="22"
                ry="16"
                fill="#A31D56"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <ellipse cx="0" cy="0" rx="14" ry="10" fill="#FED7E7" opacity="0.3" />
            </g>
          </svg>

          {/* الشعار النصي لمتجر كاندي لوز */}
          <span className="font-display font-bold text-[11px] sm:text-xs text-candy-berry/80 mt-1.5 tracking-wide leading-none select-none">
            كاندي لوز
          </span>
        </div>
      </div>
    );
  }

  // في الحالة الطبيعية: العرض عبر Next/Image مع دعم unoptimized لـ SVG
  return isFill ? (
    <Image
      src={trimmedSrc}
      alt={alt}
      fill
      sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
      priority={priority}
      unoptimized={shouldUnoptimize}
      loading={priority ? undefined : loading}
      quality={quality}
      className={className}
      onLoad={onLoad}
      onError={() => {
        setHasError(true);
        onError?.();
      }}
    />
  ) : (
    <Image
      src={trimmedSrc}
      alt={alt}
      width={width ?? 300}
      height={height ?? 300}
      sizes={sizes}
      priority={priority}
      unoptimized={shouldUnoptimize}
      loading={priority ? undefined : loading}
      quality={quality}
      className={className}
      onLoad={onLoad}
      onError={() => {
        setHasError(true);
        onError?.();
      }}
    />
  );
}
