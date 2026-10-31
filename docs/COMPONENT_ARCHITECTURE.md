# بنية المكونات وهندسة الواجهات (Component Architecture)

**المشروع:** متجر حلويات كاندي لوز (Candy Loz E-Commerce)  
**التقنيات:** Next.js App Router, React 18/19, Tailwind CSS, TypeScript, Lucide Icons  
**نهج التصميم:** Layered Architecture / Design System Tokens (`DESIGN.md` & `tokens.css`)

---

## 1. الهيكل الشجري للمكونات (Directory Structure)

```text
src/components/
├── ui/                                         # المكونات الأساسية الأولية (UI Primitives)
│   ├── button.tsx                              # أزرار المتجر الأساسية (Primary Berry, Secondary Outline, Ghost)
│   ├── input.tsx                               # حقول الإدخال النصية مع دعم RTL والتسميات التوضيحية
│   ├── textarea.tsx                            # حقل ملاحظات الطلب والعنوان
│   ├── badge.tsx                               # شارات الحالة (جديد، قيد التجهيز، متاح، نفد)
│   ├── dialog.tsx                              # النوافذ المنبثقة التفاعلية (Modals)
│   ├── drawer.tsx                              # القوائم المنزلقة من الأسفل/الجانب (Bottom Sheet / Cart Drawer)
│   ├── card.tsx                                # حاويات البطاقات بنصف قطر candy-card (22px)
│   ├── select.tsx                              # القوائم المنسدلة (اختيار المنطقة، الفلاتر)
│   ├── skeleton.tsx                            # هياكل التحميل التفاعلية أثناء جلب البيانات
│   ├── toast.tsx                               # تنبيهات الإشعار المؤقتة (تمت الإضافة للسلة، فشل، إلخ)
│   └── tabs.tsx                                # تبويبات التصنيفات وفلاتر حالات الطلبات
│
├── layout/                                     # مكونات الهيكل العام والتنقل
│   ├── storefront-header.tsx                   # ترويسة المتجر مع الشعار وشريط البحث ورابط السلة
│   ├── storefront-footer.tsx                   # تذييل المتجر ومعلومات التواصل وساعات العمل
│   ├── mobile-dock.tsx                         # شريط التنقل السفلي الثابت لشاشات الهواتف المحمولة
│   ├── admin-sidebar.tsx                       # القائمة الجانبية للوحة التحكم
│   ├── admin-navbar.tsx                        # الشريط العلوي للإدارة مع بيانات الجلسة وزر الخروج
│   └── page-container.tsx                      # حاوي الصفحة المتجاوب مع الهوامش القياسية
│
├── storefront/                                 # وحدات ومكونات واجهة الزبائن
│   ├── home/
│   │   ├── hero-banner.tsx                     # البانر الرئيسي الترويجي مع عبارات الحث على الشراء
│   │   ├── category-strip.tsx                  # شريط التصنيفات الدائري/الأفقي السريع
│   │   └── featured-products.tsx               # شبكة المنتجات الأكثر طلباً والمختارة
│   ├── catalog/
│   │   ├── product-card.tsx                    # بطاقة المنتج التفاعلية (صورة، اسم، وزن، سعر، زر إضافة)
│   │   ├── category-filter-chips.tsx           # رقائق الفلترة والترتيب بحسب السعر والأحدث
│   │   └── product-grid.tsx                    # شبكة عرض بطاقات المنتجات مع مؤشرات نفاد المخزون
│   ├── product-detail/
│   │   ├── image-gallery.tsx                   # عارض صور المنتج مع التكبير والمعاينة
│   │   ├── weight-selector.tsx                 # محدد الوزن (نصف كيلو، كيلو، صينية عائلية)
│   │   ├── quantity-stepper.tsx                # عداد زيادة ونقصان الكمية
│   │   └── add-to-cart-bar.tsx                 # الشريط العائم السفلي للإضافة السريعة للسلة
│   ├── cart/
│   │   ├── cart-item-row.tsx                   # سطر عنصر السلة مع التعديل والحذف وتنبيه تغير السعر
│   │   ├── cart-summary.tsx                    # ملخص مالي (المجموع الفرعي، التوصيل، الإجمالي)
│   │   └── empty-cart.tsx                      # حالة السلة الفارغة وزر استكشاف المنتجات
│   ├── checkout/
│   │   ├── guest-info-form.tsx                 # نموذج بيانات الزبون (الاسم الكامل، رقم الهاتف)
│   │   ├── delivery-address-form.tsx           # اختيار المنطقة وحقل تفاصيل العنوان
│   │   ├── payment-method-card.tsx             # اختيار وسيلة الدفع (الدفع نقداً عند الاستلام COD)
│   │   └── order-review-summary.tsx            # مراجعة الطلب قبل النقر النهائي على "تأكيد الطلب"
│   ├── order/
│   │   ├── order-success-card.tsx              # كرت نجاح الطلب مع رقم الطلب وزر الحفظ والمشاركة
│   │   ├── status-timeline.tsx                 # خط زمني بياني لحالة الطلب وتحديثاته
│   │   └── track-order-form.tsx                # نموذج الاستعلام برقم الطلب والهاتف
│   └── contact/
│       ├── store-info-card.tsx                 # أوقات العمل، الموقع الجغرافي، سياسة التوصيل
│       └── whatsapp-direct-button.tsx          # زر مباشر للدردشة والمساعدة الفورية عبر واتساب
│
└── admin/                                      # وحدات ومكونات لوحة الإدارة والتحكم
    ├── auth/
    │   └── admin-login-form.tsx                # نموذج الدخول مع التحقق من الهوية وعرض رسائل الخطأ
    ├── orders/
    │   ├── orders-data-table.tsx               # جدول الطلبات مع الفلترة والترتيب والبحث
    │   ├── order-status-badge.tsx              # شارة حالة الطلب الملونة
    │   ├── order-status-stepper.tsx            # أزرار انتقال حالة الطلب خطوة بخطوة (BR-004)
    │   ├── order-items-list.tsx                # قائمة أصناف الطلب وأسعارها وكمياتها
    │   ├── customer-details-card.tsx           # تفاصيل الزبون والعنوان مع زر الاتصال
    │   └── cancel-order-dialog.tsx             # نافذة إلغاء الطلب الإلزامية لتدوين سبب الإلغاء (FR-018)
    ├── products/
    │   ├── products-table.tsx                  # جدول المنتجات مع مفتاح التبديل الفوري للتوفر
    │   ├── product-form.tsx                    # نموذج إضافة وتعديل المنتج (الاسم، التصنيف، السعر، الأوزان)
    │   └── availability-toggle.tsx             # مفتاح تبديل التوفر السريع (FR-022)
    ├── categories/
    │   ├── category-list.tsx                   # قائمة التصنيفات الحالية وإعادة الترتيب
    │   └── category-dialog.tsx                 # نافذة إنشاء/تعديل اسم التصنيف وصورته
    ├── zones/
    │   ├── zones-table.tsx                     # جدول مناطق التوصيل ورسوم كل منطقة
    │   └── zone-edit-dialog.tsx                # تعديل رسوم التوصيل والحد الأدنى للطلب
    └── users/
        ├── admin-users-table.tsx               # جدول الموظفين والمديرين
        └── user-role-dialog.tsx                # تعيين دور الموظف (موظف / مدير) وتعيين كلمة المرور
```

---

## 2. مصفوفة حالات المكونات (UI States & Interactions)

| المكون | الحالة الافتراضية (Default) | حالة التحميل (Loading) | حالة الخطأ / التحقق (Error) | حالة الفراغ (Empty) |
|---|---|---|---|---|
| **ProductCard** | عرض الصورة، الاسم، السعر، زر الإضافة | Skeleton بارتفاع 280px | صورة بديلة (Fallback Placeholder) | شارة "نفد من المخزون" وتعطيل الزر |
| **CartTable** | عرض سطور المنتجات والإجماليات | تظليل خفيف أثناء تحديث الكميات | تنبيه "تغير السعر" أو "المنتج غير متوفر" | مكون `EmptyCart` مع زر تسوق |
| **CheckoutForm** | حقول فارغة أو مسترجعة من الذاكرة | تعطيل الزر الرئيسي ومؤشر دوران (Spinner) | نصوص حمراء تحت الحقول غير المكتملة | إخفاء خيارات الدفع حتى اختيار المنطقة |
| **OrdersTable** | قائمة الطلبات مرتبة تنازلياً | هيكل عظمي لصفوف الجدول | رسالة تعذر تحميل البيانات مع زر إعادة المحاولة | "لا توجد طلبات تطابق هذا التصنيف" |
| **CancelDialog** | حقل نصي لاختيار/كتابة سبب الإلغاء | جاري حفظ الإلغاء بالسجل | لا يمكن الحفظ إلا إذا كُتب السبب (FR-018) | - |

---

## 3. عقود الخصائص للمكونات الحيوية (Component Props Contracts)

### `ProductCardProps`
```typescript
interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  price: number;
  salePrice?: number;
  imageUrl: string;
  unit: 'piece' | 'kg' | 'half_kg' | 'box';
  isAvailable: boolean;
  onAddToCart?: (productId: string) => void;
}
```

### `OrderStatusStepperProps`
```typescript
interface OrderStatusStepperProps {
  currentStatus: OrderStatus;
  allowedTransitions: OrderStatus[];
  onTransition: (nextStatus: OrderStatus) => Promise<void>;
  onRequestCancel: () => void;
  userRole: 'staff' | 'manager';
  isMutating?: boolean;
}
```
