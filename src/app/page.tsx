import { Sparkles, ShoppingBag, Heart, ArrowLeft } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12">
      <div className="max-w-3xl w-full mx-auto text-center space-y-8">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-candy-pill bg-candy-blush text-candy-berry font-medium text-sm shadow-candy-1">
          <Sparkles className="w-4 h-4 text-candy-strawberry" />
          <span>مرحباً بكم في متجر كاندي لوز</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-candy-berry tracking-tight leading-tight">
          عالم من الحلاوة والبهجة الفاخرة
        </h1>

        {/* Hero Description */}
        <p className="font-sans text-lg md:text-xl text-candy-muted max-w-xl mx-auto leading-relaxed">
          نقدم لكم تشكيلة استثنائية من أفخر الحلويات الحرفية والنكهات المبتكرة لتشاركوا أحلى اللحظات والمناسبات السعيدة.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-candy-pill bg-candy-strawberry text-white font-semibold shadow-candy-cta hover:bg-candy-berry-dark hover:-translate-y-0.5 transition duration-200"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>استكشف التشكيلة</span>
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-candy-pill bg-white border border-candy-blush text-candy-strawberry font-semibold hover:bg-candy-pastel-1 transition duration-200"
          >
            <Heart className="w-5 h-5 text-candy-rose" />
            <span>المفضلة</span>
          </button>
        </div>

        {/* Feature Cards Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-10 text-right">
          <div className="p-6 rounded-candy-card bg-candy-soft border border-candy-line shadow-candy-1 space-y-2">
            <div className="text-2xl">🍫</div>
            <h3 className="font-display font-semibold text-lg text-candy-berry">شوكولاتة بلجيكية</h3>
            <p className="text-sm text-candy-muted">حبوب كاكاو منتقاة بعناية ونكهات غنية تأسر الحواس.</p>
          </div>

          <div className="p-6 rounded-candy-card bg-candy-soft border border-candy-line shadow-candy-1 space-y-2">
            <div className="text-2xl">🧁</div>
            <h3 className="font-display font-semibold text-lg text-candy-berry">حلويات وبونبون</h3>
            <p className="text-sm text-candy-muted">تشكيلات ملونة بمذاق لا يُقاوم لكل الأوقات السعيدة.</p>
          </div>

          <div className="p-6 rounded-candy-card bg-candy-soft border border-candy-line shadow-candy-1 space-y-2">
            <div className="text-2xl">🎁</div>
            <h3 className="font-display font-semibold text-lg text-candy-berry">علب هدايا فاخرة</h3>
            <p className="text-sm text-candy-muted">تغليف أنيق ومميز مصمم ليعبر عن ذوقك الرفيع.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
