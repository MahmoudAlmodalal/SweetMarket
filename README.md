# متجر الحلويات — الأساس المشترك (Shared Foundation)

مرجع ثابت (HTML/CSS/JS) سيُحوَّل لاحقاً إلى Next.js (App Router). هذه الحزمة تحتوي الأساس فقط، بدون شاشات.

## الملفات وما يقابلها في Next.js

| الملف | الوظيفة | المقابل في Next.js |
|---|---|---|
| `css/tokens.css` | كل المتغيرات (ألوان، مسافات، زوايا، ظلال، خطوط). **الملف الوحيد المسموح فيه بقيم hex.** | `app/tokens.css` يُستورد في `app/layout.tsx`. الخطوط عبر `next/font/google` (نفس الخطين والوزنين 400/700). |
| `css/base.css` | reset، طباعة، تركيز، `.container`، `.btn`، `.field`، `.badge`، `.skeleton`، `.toast`، `.modal`، `.state-box`، `.spinner`، وكتلة `dev-switcher` (للحذف). | `app/globals.css` + مكونات مشتركة: `Button`، `Field`، `Badge`، `Skeleton`، `Toast`، `Modal`، `StateBox`، `Spinner`. |
| `js/config.js` | `CURRENCY`، `FEATURES`، `MAX_QTY`، `TRACK_MAX_ATTEMPTS`. | `lib/config.ts` (يمكن لاحقاً قراءة `FEATURES` من متغيرات البيئة أو جدول إعدادات). |
| `js/mock-data.js` | بيانات أولية: 4 تصنيفات، 14 منتجاً، 5 مناطق، 6 طلبات، 3 مستخدمين. | `prisma/seed.ts` (أو ما يعادله). يُحذف بعد وجود قاعدة بيانات حقيقية. |
| `js/api.js` | واجهة برمجية وهمية تعتمد Promises (تأخير 400–900ms، مفتاح `window.__simulate`) وتطبق **نفس قواعد الخادم**: التحقق، الصلاحيات، جدول الانتقالات، التزامن بالإصدار، idempotency، قفل التتبع. | قراءات المتجر العامة → Server Components تستدعي `lib/db` أو Route Handlers (`GET`). التعديلات → Server Actions أو Route Handlers (`POST/PATCH/DELETE`). التفاصيل في الجدول أدناه. |
| `js/store.js` | سلة في `localStorage` بالمفتاح `cart_v1`، تنتهي بعد 24 ساعة من آخر تعديل، مع `subscribe/notify`. | Zustand مع middleware `persist` (أو React Context) داخل Client Component يُركَّب في layout المتجر. |
| `js/ui.js` | `toast`، `openModal` (حصر التركيز وEsc)، `formatPrice`، `formatPhoneLtr`، هياكل التحميل، `setLiveRegion`، `showFormErrors`، `renderStateBox`، `initDevSwitcher`. | مكونات مشتركة: `ToastProvider/useToast`، `Modal`، `StateBox`، `Skeleton`، `LiveRegion`، `lib/format.ts`. `initDevSwitcher` يُحذف. |

## تحويل `api.js` إلى Next.js

| الدالة | يصبح |
|---|---|
| `getCategories`, `getProducts`, `getProduct`, `getZones` | Server Components (قراءة مباشرة) أو `GET /api/...` |
| `validateCart` | Route Handler `POST /api/cart/validate` (يُستدعى من Client Component) |
| `createOrder` | Server Action `createOrder` (يتحقق من كل شيء من جديد، ويدعم `idempotencyKey`) |
| `trackOrder` | Server Action أو `POST /api/track` (مع rate limit حقيقي بحسب IP) |
| `adminLogin` / `adminLogout` / `getAdminSession` | Auth.js (أو ما يعادله) + كوكي HttpOnly + `middleware.ts` لحماية `/admin` |
| `getOrders`, `getOrder` | Server Components داخل `/admin/orders` |
| `changeOrderStatus` | Server Action (يفحص الإصدار والانتقال والدور على الخادم، ويكتب سجل الحالات) |
| `toggleAvailability`, `saveProduct`, `archiveOrDeleteProduct`, `restoreProduct` | Server Actions (`revalidatePath` للمتجر بعد كل تعديل) |
| التصنيفات / المناطق / المستخدمون (CRUD) | Server Actions، وكلها للمدير فقط (فحص الدور داخل الـ action وليس في الواجهة) |
| `getAllowedTransitions`, `STATUS`, `normalizePhone`, `isValidPhone` | `lib/order-status.ts` و`lib/validation.ts` مشتركة بين العميل والخادم |

## ملاحظات التشغيل

- **الوحدات ES Modules:** افتح الصفحات عبر خادم محلي (مثلاً `npx serve .`)، فالتحميل من `file://` لا يعمل مع `type="module"`.
- **حفظ بيانات المحاكاة:** لأن كل شاشة ملف HTML مستقل، يحفظ `api.js` قاعدة البيانات الوهمية في `localStorage` بالمفتاح `mock_db_v1`، وجلسة الإدارة في `sessionStorage` بالمفتاح `admin_session_v1`. لإعادة الضبط: `resetMockDb()` من الـ console.
- **محاكاة الحالات:** أضف `?dev=1` للرابط لإظهار مبدّل (تحميل / فارغ / خطأ / عادي). كل شاشة تستدعي `initDevSwitcher({ onChange: load })` قبل أول جلب. لحذفه: احذف كتلة `/* dev-only */` في `ui.js` وكتلة `dev-switcher` في `base.css`.
- **حسابات الاختبار (للتطوير فقط):** `manager@sweets.test` / `Manager#123`، و`staff1@sweets.test` و`staff2@sweets.test` / `Staff#123`.
- **أسعار الطلبات:** كل طلب يحفظ نسخة من السعر وقت الطلب، فتعديل سعر المنتج لا يغيّر الطلبات القديمة (AC-006).

## قرارات تحتاج تأكيدك

1. **تعذّر التسليم يتطلب سبباً (5 أحرف على الأقل)** مثل الإلغاء، تطبيقاً لـ FR-035. الطلب الأصلي لم يحدد ذلك صراحة.
2. **مدة قفل التتبع وتسجيل الدخول 15 دقيقة** (`LOCK_MS` في `api.js`)، وأقل طول لكلمة المرور 8 (`MIN_PASSWORD`). كلها قيم مقترحة.
3. **الطلبات الستة الأولية** تغطي: جديد، مقبول، قيد التجهيز، خرج للتوصيل، تعذّر التسليم، ملغي. حالة «تم التسليم» تُجرَّب حيّاً بنقل طلب «خرج للتوصيل».
4. **الحد الأدنى للطلب** مخزّن في بيانات المناطق لكنه يُفحص ويُعرض فقط عند تفعيل `FEATURES.minOrder`.
5. **الهاتف:** تحقق مرن (9 إلى 15 رقماً) إلى أن يُحسم السؤال Q-13 (الدولة).
6. **أضفت قيماً مشتقة في `tokens.css`** بجانب القائمة المطلوبة: `--color-on-primary` (نص أبيض على الأزرار)، `--color-overlay`، `--fs-h3`، ومتغيرات المسافات والحالات، حتى لا تظهر قيم hex خارج هذا الملف.
