"use client";

import * as React from "react";
import {
  ZoomIn,
  ZoomOut,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/storefront/catalog/product-image";

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
    return list.length > 0 ? list : [""];
  }, [images]);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isZoomOpen, setIsZoomOpen] = React.useState(false);
  const [zoomScale, setZoomScale] = React.useState<number>(1);
  const [failedImages, setFailedImages] = React.useState<Record<number, boolean>>({});

  // Touch tracking for mobile swipe navigation
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);
  const [touchDeltaX, setTouchDeltaX] = React.useState<number>(0);
  const [isSwiping, setIsSwiping] = React.useState<boolean>(false);

  // Reset active index and errors if images list changes
  React.useEffect(() => {
    setActiveIndex(0);
    setFailedImages({});
    setZoomScale(1);
  }, [images]);

  // Lock body scroll when zoom lightbox is active
  React.useEffect(() => {
    if (isZoomOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isZoomOpen]);

  // Keyboard navigation for lightbox
  React.useEffect(() => {
    if (!isZoomOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsZoomOpen(false);
        setZoomScale(1);
      } else if (e.key === "ArrowLeft") {
        // Next image in RTL
        setActiveIndex((prev) => (prev < galleryList.length - 1 ? prev + 1 : 0));
        setZoomScale(1);
      } else if (e.key === "ArrowRight") {
        // Previous image in RTL
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : galleryList.length - 1));
        setZoomScale(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomOpen, galleryList.length]);

  const handleImageError = (index: number) => {
    setFailedImages((prev) => ({ ...prev, [index]: true }));
  };

  const handleNext = React.useCallback(() => {
    setActiveIndex((prev) => (prev < galleryList.length - 1 ? prev + 1 : 0));
    setZoomScale(1);
  }, [galleryList.length]);

  const handlePrev = React.useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : galleryList.length - 1));
    setZoomScale(1);
  }, [galleryList.length]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    setIsSwiping(true);
    setTouchDeltaX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Only engage if horizontal swipe exceeds vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setTouchDeltaX(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current) return;
    const minSwipeDistance = 45;

    // In RTL Arabic layout:
    // Swiping left (deltaX < -minSwipeDistance) advances to next image
    // Swiping right (deltaX > minSwipeDistance) goes to previous image
    if (touchDeltaX < -minSwipeDistance) {
      handleNext();
    } else if (touchDeltaX > minSwipeDistance) {
      handlePrev();
    }

    touchStartRef.current = null;
    setTouchDeltaX(0);
    setIsSwiping(false);
  };

  const currentImage = galleryList[activeIndex] || galleryList[0];

  return (
    <section
      aria-label="معرض صور المنتج"
      className={cn(
        "relative w-full rounded-candy-card bg-candy-soft p-3 sm:p-4 shadow-candy-1 border border-candy-line/80 overflow-hidden select-none transition-shadow duration-300 hover:shadow-candy-2",
        className
      )}
    >
      {/* Decorative Badges Overlay (Top Right in RTL) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-start pointer-events-none">
        {/* Freshly Handmade Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-candy-pill bg-white/95 backdrop-blur-md text-candy-berry font-sans font-bold text-xs shadow-candy-1 border border-candy-line/80 animate-in fade-in duration-300">
          <Sparkles className="w-3.5 h-3.5 text-candy-strawberry animate-pulse" />
          <span>صنع يدوي طازج</span>
        </div>

        {/* Discount Badge if available */}
        {discountAmount !== undefined && discountAmount > 0 && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-candy-pill bg-candy-strawberry text-white font-sans font-bold text-xs shadow-candy-cta animate-in zoom-in-95 duration-200">
            <span>وفر {discountAmount} ₪</span>
          </div>
        )}

        {/* Out of Stock Badge */}
        {!isAvailable && (
          <div className="inline-flex items-center px-3 py-1 rounded-candy-pill bg-stone-900/90 text-white font-sans font-bold text-xs shadow-md backdrop-blur-sm">
            <span>نفد من المخزون</span>
          </div>
        )}
      </div>

      {/* Image Counter Badge (Top Left in RTL) */}
      {galleryList.length > 1 && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="px-2.5 py-1 rounded-candy-pill bg-black/50 backdrop-blur-md text-white font-sans text-xs font-semibold tracking-wide">
            {activeIndex + 1} / {galleryList.length}
          </div>
        </div>
      )}

      {/* Main Hero Visual Cradle with Swipeable Mobile Support */}
      <div
        className="relative w-full aspect-[4/3] rounded-card overflow-hidden bg-white shadow-sm flex items-center justify-center group cursor-pointer"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => setIsZoomOpen(true)}
      >
        <div
          className={cn(
            "w-full h-full relative transition-transform duration-300 ease-out",
            isSwiping && "transition-none"
          )}
          style={{
            transform: isSwiping ? `translateX(${touchDeltaX * 0.35}px)` : "none",
          }}
        >
          <ProductImage
            src={currentImage}
            alt={`${productName} - صورة ${activeIndex + 1}`}
            fill
            priority={activeIndex === 0}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            onError={() => handleImageError(activeIndex)}
          />
        </div>

        {/* Desktop Navigation Floating Arrows (Shown on hover when > 1 image) */}
        {galleryList.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="الصورة السابقة"
              className="hidden md:flex absolute right-3 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-candy-berry items-center justify-center backdrop-blur-md shadow-candy-1 border border-candy-line/60 opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="الصورة التالية"
              className="hidden md:flex absolute left-3 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-candy-berry items-center justify-center backdrop-blur-md shadow-candy-1 border border-candy-line/60 opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Mobile Swipe Navigation Dots Indicator */}
        {galleryList.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center items-center gap-1.5 z-10 pointer-events-none md:hidden">
            <div className="px-2 py-1 rounded-full bg-black/35 backdrop-blur-md flex items-center gap-1.5">
              {galleryList.map((_, idx) => (
                <span
                  key={`dot-${idx}`}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    idx === activeIndex
                      ? "w-4 h-1.5 bg-candy-strawberry"
                      : "w-1.5 h-1.5 bg-white/60"
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Zoom Trigger Button (Bottom Left in RTL) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomOpen(true);
          }}
          aria-label="تكبير صورة المنتج"
          className="absolute bottom-3 left-3 px-3 py-1.5 rounded-candy-pill bg-candy-ink/80 hover:bg-candy-ink text-white font-sans text-xs font-medium backdrop-blur-md flex items-center gap-1.5 shadow-sm transition-all duration-200 active:scale-95 z-10"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span>تكبير الصورة</span>
        </button>
      </div>

      {/* Gallery Thumbnails Strip / Carousel */}
      {galleryList.length > 1 && (
        <div
          role="tablist"
          aria-label="مصغرات صور المنتج"
          className="relative flex items-center gap-2 sm:gap-2.5 mt-3 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1 px-0.5"
        >
          {galleryList.map((thumbUrl, idx) => {
            const isActive = idx === activeIndex;

            return (
              <button
                key={`thumb-${idx}-${thumbUrl}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`عرض الصورة رقم ${idx + 1}`}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "relative aspect-square w-16 sm:w-20 rounded-input overflow-hidden bg-white shrink-0 snap-start transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-candy-strawberry",
                  isActive
                    ? "ring-2 ring-candy-strawberry ring-offset-2 ring-offset-candy-soft shadow-candy-1 opacity-100 scale-105"
                    : "opacity-60 hover:opacity-100 border border-candy-line hover:border-candy-rose/60 hover:scale-[1.02]"
                )}
              >
                <ProductImage
                  src={thumbUrl}
                  alt={`${productName} مصغر ${idx + 1}`}
                  fill
                  sizes="(max-width: 640px) 20vw, 80px"
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(idx)}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Zoom / Lightbox Modal with Touch Support */}
      {isZoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`عرض مكبر: ${productName}`}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-200"
          onClick={() => {
            setIsZoomOpen(false);
            setZoomScale(1);
          }}
        >
          {/* Top Controls Bar */}
          <div
            className="absolute top-4 inset-x-4 sm:inset-x-8 z-30 flex items-center justify-between pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image counter */}
            <div className="px-3 py-1.5 rounded-candy-pill bg-white/15 backdrop-blur-md text-white font-sans text-xs font-semibold">
              الصورة {activeIndex + 1} من {galleryList.length}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Toggle Zoom Scale Button */}
              <button
                type="button"
                onClick={() => setZoomScale((prev) => (prev === 1 ? 1.75 : 1))}
                aria-label={zoomScale === 1 ? "تكبير مضاعف" : "إعادة الحجم الطبيعي"}
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md transition-colors active:scale-95"
              >
                {zoomScale === 1 ? (
                  <ZoomIn className="w-5 h-5" />
                ) : (
                  <ZoomOut className="w-5 h-5" />
                )}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setIsZoomOpen(false);
                  setZoomScale(1);
                }}
                aria-label="إغلاق التكبير"
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md transition-colors active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Arrows if more than 1 image */}
          {galleryList.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                aria-label="الصورة السابقة"
                className="absolute right-3 sm:right-8 z-30 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-transform active:scale-95"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="الصورة التالية"
                className="absolute left-3 sm:left-8 z-30 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-transform active:scale-95"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
            </>
          )}

          {/* Large Image Container with Touch & Zoom */}
          <div
            className="relative max-w-4xl max-h-[80vh] w-full min-h-[300px] flex items-center justify-center overflow-hidden"
            onClick={(e) => {
              e.stopPropagation();
              setZoomScale((prev) => (prev === 1 ? 1.75 : 1));
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className={cn(
                "relative transition-transform duration-300 ease-out flex items-center justify-center cursor-zoom-in",
                zoomScale > 1 && "cursor-zoom-out"
              )}
              style={{
                transform: `scale(${zoomScale}) ${
                  isSwiping && zoomScale === 1
                    ? `translateX(${touchDeltaX * 0.4}px)`
                    : ""
                }`,
              }}
            >
              <ProductImage
                src={currentImage}
                alt={`${productName} مكبر`}
                width={900}
                height={675}
                sizes="(max-width: 1024px) 95vw, 900px"
                className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-card shadow-2xl select-none"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
