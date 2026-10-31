# خريطة المسارات والهيكل الشجري (Routes Map): Next.js App Router

**المشروع:** متجر حلويات كاندي لوز (Candy Loz E-Commerce)  
**الإطار:** Next.js (App Router), TypeScript, Tailwind CSS  
**اللغة والاتجاه:** Arabic (`ar`), Right-to-Left (`dir="rtl"`)  
**المرجع:** `SCREEN_INVENTORY.md` (SCR-01 إلى SCR-20)، `UX_BLUEPRINT.md`، و `docs/STITCH_SCREEN_REFERENCES.md`

---

## 1. شجرة المسارات الكاملة (Next.js App Router)

```text
src/app/
├── layout.tsx                                  # الجذر العام: الخطوط، dir="rtl"، مُزوّد الإشعارات (Toaster)
├── not-found.tsx                               # SCR-09: صفحة 404 العامة للزبائن
├── error.tsx                                   # SCR-10: معالج الخطأ العام وشاشة انقطاع الاتصال
│
├── (storefront)/                               # مجموعة مسارات واجهة الزبائن (المتجر)
│   ├── layout.tsx                              # إطار المتجر: الترويسة، السلة العائمة، والشريط السفلي للهاتف
│   ├── page.tsx                                # SCR-01: الصفحة الرئيسية (Home / Hero / Best Sellers)
│   ├── category/
│   │   └── [slug]/
│   │       ├── page.tsx                        # SCR-02: قائمة منتجات التصنيف مع الفلاتر والترتيب
│   │       └── loading.tsx                     # هيكل تحميل بطاقات المنتجات (Skeleton)
│   ├── product/
│   │   └── [slug]/
│   │       ├── page.tsx                        # SCR-03: تفاصيل المنتج، اختيار الوزن/الكمية، إضافة للسلة
│   │       └── loading.tsx                     # هيكل تحميل صفحة تفاصيل المنتج
│   ├── cart/
│   │   └── page.tsx                            # SCR-04: سلة المشتريات وتعديل الكميات وحساب الإجمالي
│   ├── checkout/
│   │   ├── page.tsx                            # SCR-05: إتمام الطلب كزائر (العنوان، الهاتف، المنطقة)
│   │   └── success/
│   │       └── [orderNumber]/
│   │           └── page.tsx                    # SCR-06: تأكيد استلام الطلب وتفريغ السلة ورقم التتبع
│   ├── track/
│   │   └── page.tsx                            # SCR-07: تتبع حالة الطلب (رقم الطلب + الهاتف)
│   └── contact/
│       └── page.tsx                            # SCR-08: صفحة من نحن والتواصل وساعات العمل ورابط واتساب
│
└── admin/                                      # مجموعة مسارات لوحة التحكم والإدارة
    ├── layout.tsx                              # إطار لوحة الإدارة الأساسي ومزود المصادقة الوهمية
    ├── login/
    │   └── page.tsx                            # SCR-11: تسجيل دخول الموظفين والإدارة
    ├── forbidden/
    │   └── page.tsx                            # SCR-20: صفحة 403 غير مصرح / انتهاء صلاحية الجلسة
    └── (dashboard)/                            # المسارات المحمية للموظف والمدير
        ├── layout.tsx                          # القالب الداخلي: القائمة الجانبية، الشريط العلوي، ومعلومات المستخدم
        ├── account/
        │   └── password/
        │       └── page.tsx                    # SCR-12: تغيير كلمة المرور للمستخدم الحالي
        ├── orders/
        │   ├── page.tsx                        # SCR-13: قائمة الطلبات والفلترة بحسب الحالة والبحث
        │   └── [id]/
        │       └── page.tsx                    # SCR-14: تفاصيل الطلب، تغيير الحالة، الإلغاء وتدوين السبب
        ├── products/
        │   ├── page.tsx                        # SCR-15: قائمة المنتجات وتبديل حالة التوفر الفوري
        │   ├── new/
        │   │   └── page.tsx                    # SCR-16: إضافة منتج جديد
        │   └── [id]/
        │       └── edit/
        │           └── page.tsx                # SCR-16: تعديل بيانات المنتج الحالي
        ├── categories/
        │   └── page.tsx                        # SCR-17: إدارة التصنيفات وإعادة الترتيب
        ├── zones/
        │   └── page.tsx                        # SCR-18: إدارة مناطق التوصيل، الرسوم، والحدود الدنيا
        └── users/
            └── page.tsx                        # SCR-19: إدارة مستخدمي لوحة التحكم والأدوار (المدير فقط)
```

---

## 2. جدول مطابقة الشاشات (MVP Screen Inventory Mapping)

| Screen ID | اسم الشاشة | نوع الشاشة | مسار Next.js | الصلاحيات (RBAC) | المرجع التصميمي (Stitch / Blueprint) |
|---|---|---|---|---|---|
| **SCR-01** | الرئيسية | Core | `/(storefront)` | زائر / عام | Stitch #1 (`1b23fd77d1684f05831fd30e6115ed1b`) |
| **SCR-02** | قائمة التصنيف | Core | `/(storefront)/category/[slug]` | زائر / عام | Stitch #2 & #3 (`1d51a1cbd63c...`, `44c6a237b678...`) |
| **SCR-03** | تفاصيل المنتج | Core | `/(storefront)/product/[slug]` | زائر / عام | Stitch #4 (`3fdd24d1988546b1a0bd97969ea3d51f`) |
| **SCR-04** | سلة المشتريات | Core | `/(storefront)/cart` | زائر / عام | Stitch #5 (`34bc34a158334298ba044a7e5428ab37`) |
| **SCR-05** | إتمام الطلب | Core | `/(storefront)/checkout` | زائر / عام | Stitch #6 (`a3b0c210a5a04aa392e3c42a476043da`) |
| **SCR-06** | تأكيد الطلب | Core | `/(storefront)/checkout/success/[orderNumber]` | زائر / عام | Stitch #7 (`40a46ae67e034043824cf64cfc7b4a4c`) |
| **SCR-07** | تتبع الطلب | Supporting | `/(storefront)/track` | زائر / عام | Stitch #7 + Blueprint J2 |
| **SCR-08** | من نحن والتواصل | Supporting | `/(storefront)/contact` | زائر / عام | Blueprint SCR-08 |
| **SCR-09** | صفحة غير موجودة | Core | `/not-found` (Fallback) | عام | Blueprint SCR-09 (404) |
| **SCR-10** | خطأ عام / انقطاع | Core | `/error` | عام | Blueprint SCR-10 (ErrorBoundary) |
| **SCR-11** | تسجيل دخول الإدارة | Core | `/admin/login` | غير مسجل | Blueprint SCR-11 |
| **SCR-12** | تغيير كلمة المرور | Supporting | `/admin/(dashboard)/account/password` | موظف + مدير | Blueprint SCR-12 |
| **SCR-13** | قائمة الطلبات | Core | `/admin/(dashboard)/orders` | موظف + مدير | Blueprint SCR-13 |
| **SCR-14** | تفاصيل الطلب ومعالجته | Core | `/admin/(dashboard)/orders/[id]` | موظف (عرض/تحديث) + مدير (إلغاء) | Blueprint SCR-14 |
| **SCR-15** | قائمة المنتجات | Core | `/admin/(dashboard)/products` | موظف (توفر) + مدير (كامل) | Blueprint SCR-15 |
| **SCR-16** | نموذج إضافة/تعديل منتج | Core | `/admin/(dashboard)/products/new` و `[id]/edit` | مدير فقط | Blueprint SCR-16 |
| **SCR-17** | إدارة التصنيفات | Core | `/admin/(dashboard)/categories` | مدير فقط | Blueprint SCR-17 |
| **SCR-18** | مناطق التوصيل والرسوم | Core | `/admin/(dashboard)/zones` | مدير فقط | Blueprint SCR-18 |
| **SCR-19** | مستخدمو لوحة التحكم | Core | `/admin/(dashboard)/users` | مدير فقط | Blueprint SCR-19 |
| **SCR-20** | غير مسموح / انتهاء الجلسة | Core | `/admin/forbidden` | عام عند الرفض | Blueprint SCR-20 (403) |

---

## 3. مواصفات التخطيطات وقواعد الوصول (Layouts & Guards)

### أ. تخطيط المتجر الرئيسي `src/app/(storefront)/layout.tsx`
- **العناصر الثابتة:**
  - **Header:** شعار كاندي لوز، شريط البحث السريع، زر السلة مع عداد العناصر المباشر (`badge`).
  - **Mobile Bottom Navigation Dock:** مثبت أسفل الشاشة للهواتف (الرئيسية، التصنيفات، السلة، التتبع).
  - **Footer:** روابط الصفحات القانونية، ساعات العمل، وسائل التواصل، وحقوق المتجر.
- **إدارة الحالة:** الاستماع لـ `CartContext` لتحديث شارات العداد فوراً مع رسوم متحركة خفيفة عند إضافة عنصر.

### ب. تخطيط لوحة الإدارة `src/app/admin/(dashboard)/layout.tsx`
- **التحقق من الصلاحيات (Client Guard):**
  - فحص حالة الجلسة من `AdminAuthContext`.
  - إذا لم يكن المستخدم مسجلاً، يتم التحويل فوراً إلى `/admin/login?redirect=...`.
  - التحقق من دور المستخدم (`staff` مقابل `manager`). في حال محاولة موظف فتح صفحات SCR-16, 17, 18, 19 يتم توجيهه إلى `/admin/forbidden`.
- **العناصر الثابتة:**
  - **Sidebar:** تنقل سريع بين (الطلبات، المنتجات، التصنيفات، مناطق التوصيل، المستخدمين).
  - **Admin Header:** مؤشر حالة الاتصال، اسم المستخدم ودوره، وزر تسجيل الخروج.
