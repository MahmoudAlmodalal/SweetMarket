# شعارات متجر كاندي لوز للحلويات الفاخرة | Candy Loz Store Logos

تم تصميم وتطوير 5 نماذج شعارات متباينة وهوية متكاملة لمتجر **كاندي لوز**، معتمدة بالكامل على رموز التصميم المعرفة في [`tokens.css`](file:///home/mahmoud/Desktop/متجر%20حلويات/src/app/tokens.css) و [`globals.css`](file:///home/mahmoud/Desktop/متجر%20حلويات/src/app/globals.css).

---

## 🎨 مطابقة رموز الألوان ونظام التصميم (Design Tokens Mapping)

| عنصر التصميم | متغير CSS (`tokens.css`) | كود اللون HEX | الاستخدام في الشعارات |
|---|---|---|---|
| **لون البراند الأساسي** | `--color-primary` | `#A31D56` | لون التوت الملكي، الخطوط الرئيسية، الشارات |
| **الدرجة الداكنة** | `--color-primary-hover` | `#851645` | الظلال، التدرجات الفاخرة للرموز |
| **اللون التأكيدي الذهبي** | `--color-accent` | `#E8A33D` | حبة اللوز الذهبية، التيجان، بريق الحلويات |
| **الوردي الفاتح** | `--color-blush` | `#FED7E7` | أقراص الخلفية، أغلفة السكاكر |
| **السطح الناعم** | `--color-soft` | `#FFF5F8` | هالات الإضاءة والبطاقات |
| **لون الخلفية الكريمي** | `--color-bg` | `#FFFAF8` | أرضية الشعار وتوازن البياض السكري |
| **لون النص الداكن** | `--color-text` | `#2B1A10` | لون الكاكاو الداكن للنصوص الإنجليزية والعربية |
| **النص الثانوي** | `--color-text-muted` | `#6B5D55` | التوصيفات الثانوية والتواريخ |
| **حدود الزخرفة** | `--color-border` | `#E6DED8` | الخطوط الفاصلة والإطارات الدائرية |

---

## 📂 قائمة ملفات الشعارات (`logo/` & `public/logo/`)

1. **[logo-1-royal-crest.svg](file:///home/mahmoud/Desktop/متجر%20حلويات/logo/logo-1-royal-crest.svg)**:
   - **النمط**: الشارة الملكية ونواة اللوز المتوجة (Royal Crest & Almond Emblem).
   - **الاستخدام الموصى به**: صناديق الهدايا الملكية، الأشرطة المخملية، ترويسة الموقع الرئيسية، أكياس المشتريات الفاخرة.
2. **[logo-2-modern-monogram.svg](file:///home/mahmoud/Desktop/متجر%20حلويات/logo/logo-2-modern-monogram.svg)**:
   - **النمط**: مونوغرام عصري مينيمال (Modern Monogram Sweet Drop).
   - **الاستخدام الموصى به**: أيقونة التطبيق (App Icon)، الأيقونة المفضلة (Favicon)، شريط التنقل العلوي في الهواتف، حسابات التواصل الاجتماعي.
3. **[logo-3-artisan-cloche.svg](file:///home/mahmoud/Desktop/متجر%20حلويات/logo/logo-3-artisan-cloche.svg)**:
   - **النمط**: غطاء الضيافة الملكي والباتيسري (Artisan Cloche & Pastry).
   - **الاستخدام الموصى به**: قوائم الحلويات (Menus)، سيارات التوصيل المبردة، واجهة المحل، بطاقات الضيافة والمناسبات.
4. **[logo-4-calligraphic-flourish.svg](file:///home/mahmoud/Desktop/متجر%20حلويات/logo/logo-4-calligraphic-flourish.svg)**:
   - **النمط**: الختم والخط العربي التراثي (Calligraphic Diwani & Almond).
   - **الاستخدام الموصى به**: الحلويات الشرقية (البقلاوة والكنافة)، علب مواسم الأعياد ورمضان، الطباعة بالورق الذهبي (Gold Foil / Embossing).
5. **[logo-5-joyful-candy.svg](file:///home/mahmoud/Desktop/متجر%20حلويات/logo/logo-5-joyful-candy.svg)**:
   - **النمط**: قطعة الحلوى المبهجة والسكاكر الملونة (Joyful Candy Twist & Confection).
   - **الاستخدام الموصى به**: قسم السكاكر والشوكولاتة، حفلات الأطفال وأعياد الميلاد، ملصقات التغليف المرحة.

---

## 💻 طريقة الاستخدام في React / Next.js

الملفات متوفرة أيضاً داخل مجلد `public/logo/` مما يسمح باستدعائها مباشرة في أي مكون:

```tsx
import Image from 'next/image';

// مثال 1: الشعار الملكي
export function HeaderLogo() {
  return (
    <Image
      src="/logo/logo-1-royal-crest.svg"
      alt="متجر كاندي لوز للحلويات"
      width={240}
      height={80}
      priority
    />
  );
}

// مثال 2: المونوغرام العصري
export function MobileLogo() {
  return (
    <Image
      src="/logo/logo-2-modern-monogram.svg"
      alt="كاندي لوز"
      width={180}
      height={60}
    />
  );
}
```

---

## 🌐 صفحة المعاينة التفاعلية

تم إنشاء صفحة ويب تفاعلية لمعاينة واختبار جميع الشعارات الـ 5 مع إمكانية تبديل الخلفيات (كريمي، أبيض، كاكاو داكن، شفاف):
- يمكنك فتح الملف محلياً في المتصفح: [`logo/index.html`](file:///home/mahmoud/Desktop/متجر%20حلويات/logo/index.html)
