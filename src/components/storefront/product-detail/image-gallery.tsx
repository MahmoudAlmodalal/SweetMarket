"use client";

import * as React from "react";
import { ZoomIn, X, ChevronLeft, ChevronRight, Sparkles, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageGalleryProps {
  images: string[];
  productName: string;
  isAvailable?: boolean;
  discountAmount?: number;
  className?: string;
}

export function ImageGallery({
  images = [],
  productName,
  isAvailable = true,
  discountAmount,
  className,
}: ImageGalleryProps) {
  // Ensure we have at least one fallback image entry
  const galleryList = React.useMemo(() => {
    const list = images.filter((img) => Boolean(img && img.trim().length > 0));
    return list.length > 0 ? list : ["/images/placeholder-sweet.jpg"];
  }, [images]);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isZoomOpen, setIsZoomOpen] = React.useState(false);
  const [failedImages, setFailedImages] = React.useState<Record<number, boolean>>({});

  // Reset active index if images change
  React.useEffect(() => {
    setActiveIndex(0);
    setFailedImages({});
  }, [images]);

  // Handle keyboard navigation in zoom modal
  React.useEffect(() => {
    if (!isZoomOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsZoomOpen(false);
      } else if (e.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev < galleryList.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowRight") {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : galleryList.length - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomOpen, galleryList.length]);

  const handleImageError = (index: number) => {
    setFailedImages((prev) => ({ ...prev, [index]: true }));
  };

  const currentImage = galleryList[activeIndex] || galleryList[0];
  const isCurrentFailed = failedImages[activeIndex];

  return (
    <section
      aria-label="معرض صور المنتج"
      className={cn(
        "relative w-full rounded-candy-card bg-candy-soft p-3 sm:p-4 shadow-candy-1 border border-candy-line/70 overflow-hidden",
        className
      )}
    >
      {/* Decorative Badges Overlay (Top Right in RTL) */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-start pointer-events-none">
        {/* Freshly Handmade Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-candy-pill bg-white/95 backdrop-blur-md text-candy-berry font-sans font-bold text-xs shadow-candy-1 border border-candy-line">
          <Sparkles className="w-3.5 h-3.5 text-candy-strawberry animate-pulse" />
          <span>صنع يدوي طازج ✨</span>
        </div>

        {/* Discount Badge if available */}
        {discountAmount !== undefined && discountAmount > 0 && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-candy-pill bg-candy-strawberry text-white font-sans font-bold text-xs shadow-candy-cta">
            <span>وفر {discountAmount} ر.س</span>
          </div>
        )}

        {/* Out of Stock Badge */}
        {!isAvailable && (
          <div className="inline-flex items-center px-3 py-1 rounded-candy-pill bg-stone-800 text-white font-sans font-bold text-xs shadow-md">
            <span>نفد من المخزون</span>
          </div>
        )}
      </div>

      {/* Main Hero Visual Cradle */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white shadow-sm flex items-center justify-center group">
        {!isCurrentFailed ? (
          <img
            src={currentImage}
            alt={`${productName} - صورة ${activeIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={() => handleImageError(activeIndex)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-candy-soft/60 text-candy-muted p-6 text-center">
            <ImageOff className="w-12 h-12 text-candy-rose/60 mb-2" />
            <span className="font-sans text-xs font-semibold text-candy-ink/70">
              {productName}
            </span>
          </div>
        )}

        {/* Zoom Trigger Button (Bottom Left in RTL) */}
        <button
          type="button"
          onClick={() => setIsZoomOpen(true)}
          aria-label="تكبير صورة المنتج"
          className="absolute bottom-3 left-3 px-3 py-1.5 rounded-candy-pill bg-candy-ink/80 hover:bg-candy-ink text-white font-sans text-xs font-medium backdrop-blur-md flex items-center gap-1.5 shadow-sm transition-all duration-200 active:scale-95"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span>تكبير الصورة</span>
        </button>
      </div>

      {/* Gallery Thumbnails Strip */}
      {galleryList.length > 1 && (
        <div
          role="tablist"
          aria-label="مصغرات صور المنتج"
          className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-2.5 mt-3"
        >
          {galleryList.map((thumbUrl, idx) => {
            const isActive = idx === activeIndex;
            const isFailed = failedImages[idx];

            return (
              <button
                key={`thumb-${idx}-${thumbUrl}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`عرض الصورة رقم ${idx + 1}`}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden bg-white transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-strawberry",
                  isActive
                    ? "ring-2 ring-candy-strawberry shadow-candy-1 opacity-100 scale-[1.02]"
                    : "opacity-65 hover:opacity-100 border border-candy-line hover:border-candy-rose/50"
                )}
              >
                {!isFailed ? (
                  <img
                    src={thumbUrl}
                    alt={`${productName} مصغر ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(idx)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-candy-soft text-candy-muted">
                    <ImageOff className="w-4 h-4 text-candy-rose/50" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {isZoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`عرض مكبر: ${productName}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            aria-label="إغلاق التكبير"
            className="absolute top-5 left-5 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Arrows if more than 1 image */}
          {galleryList.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) => (prev > 0 ? prev - 1 : galleryList.length - 1));
                }}
                aria-label="الصورة السابقة"
                className="absolute right-4 sm:right-8 z-20 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-transform active:scale-95"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) => (prev < galleryList.length - 1 ? prev + 1 : 0));
                }}
                aria-label="الصورة التالية"
                className="absolute left-4 sm:left-8 z-20 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-transform active:scale-95"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
            </>
          )}

          {/* Large image container */}
          <div
            className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {!isCurrentFailed ? (
              <img
                src={currentImage}
                alt={`${productName} مكبر`}
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              />
            ) : (
              <div className="bg-candy-soft p-12 rounded-2xl flex flex-col items-center justify-center text-candy-muted">
                <ImageOff className="w-16 h-16 text-candy-rose mb-3" />
                <p className="font-sans text-sm text-candy-ink font-semibold">
                  تعذر تحميل الصورة بدقة عالية
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
