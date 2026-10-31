"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, Home, Sparkles, ShieldCheck } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to console
    console.error("Global Error Boundary caught an exception:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden bg-candy-cream">
      {/* Decorative ambient background glows */}
      <div
        className="absolute top-1/4 -right-20 w-72 h-72 rounded-full bg-candy-pastel-1/50 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 -left-20 w-72 h-72 rounded-full bg-candy-pastel-3/40 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-lg w-full mx-auto text-center space-y-8">
        {/* Motif Badge */}
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative">
            {/* Outer soft glowing ring */}
            <div
              className="absolute -inset-3 rounded-full bg-candy-blush/60 blur-md animate-pulse"
              aria-hidden="true"
            />
            {/* Center icon container */}
            <div className="relative w-28 h-28 rounded-full bg-white border-2 border-candy-blush shadow-candy-2 flex items-center justify-center text-candy-berry group transition-transform duration-300 hover:scale-105">
              <RotateCcw className="w-12 h-12 text-candy-berry transition-transform duration-500 group-hover:rotate-180" />
              <Sparkles
                className="absolute top-2 right-2 w-5 h-5 text-candy-strawberry animate-bounce"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Reassurance Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-candy-pill bg-candy-mint-soft border border-candy-mint/30 shadow-sm text-candy-mint-text">
            <ShieldCheck className="w-4 h-4 text-candy-mint-text" aria-hidden="true" />
            <span className="text-xs font-sans font-semibold">
              سلتك ومسودة طلبك في أمان تام
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-candy-berry tracking-tight leading-tight">
            عذراً، حدث خطأ ما
          </h1>
          <p className="font-sans text-base sm:text-lg text-candy-muted max-w-md mx-auto leading-relaxed">
            حدث خطأ غير متوقع، لا تقلق تم حفظ بياناتك
          </p>
        </div>

        {/* Flourish Divider */}
        <div className="flex items-center justify-center gap-3 py-1" aria-hidden="true">
          <span className="h-px w-14 bg-candy-rose/30" />
          <span className="text-candy-rose text-xs">✨</span>
          <span className="h-px w-14 bg-candy-rose/30" />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Retry Action */}
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2.5 h-13 min-h-[52px] px-8 text-base font-sans font-semibold rounded-candy-pill bg-candy-berry text-white hover:bg-candy-berry-dark shadow-candy-1 hover:shadow-candy-cta active:translate-y-[1px] transition-all duration-200 w-full sm:w-auto"
          >
            <RotateCcw className="w-5 h-5" aria-hidden="true" />
            <span>إعادة المحاولة</span>
          </button>

          {/* Return Home Action */}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2.5 h-13 min-h-[52px] px-8 text-base font-sans font-semibold rounded-candy-pill bg-white border-2 border-candy-blush text-candy-berry hover:bg-candy-soft hover:border-candy-rose active:translate-y-[1px] shadow-sm transition-all duration-200 w-full sm:w-auto"
          >
            <Home className="w-5 h-5" aria-hidden="true" />
            <span>العودة للرئيسية</span>
          </Link>
        </div>

        {/* Diagnostic info if available */}
        {error?.digest && (
          <p className="pt-4 text-xs font-mono text-candy-muted/60" dir="ltr">
            Digest Ref: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
