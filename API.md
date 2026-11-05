# وثيقة العقد البرمجي للواجهات (Candy Loz API Contract v1.0)

**المشروع:** متجر حلويات كاندي لوز (Candy Loz E-Commerce)  
**المرجعية:** وثيقة المتطلبات `PRD_v0.2.md` و `docs/SPEC.md`  
**الإصدار:** 1.0.0  
**تاريخ الاعتماد:** نوفمبر 2026  

---

## 1. القواعد العامة (Global Standards)

- **Base URL:** `/api/v1`
- **Content-Type:** `application/json; charset=utf-8`
- **التاريخ والوقت:** ISO-8601 UTC (`YYYY-MM-DDTHH:mm:ssZ`)
- **العملة:** الشيكل الفلسطيني (`ILS` / ₪)
- **المصادقة للوحة التحكم:** `Authorization: Bearer <TOKEN>` (المتجر عام بدون مصادقة)

### 1.1 هيكل الاستجابة الناجحة الموحد
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

### 1.2 هيكل استجابة الأخطاء الموحد
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "بيانات الطلب غير صالحة، يرجى مراجعة الحقول",
    "details": [
      {
        "field": "customer.phone",
        "message": "يجب أن يبدأ رقم الهاتف بـ 059 أو 056 ويتكون من 10 أرقام"
      }
    ]
  }
}
```

### 1.3 رموز الحالة (HTTP Status Codes)
| الرمز | المعنى | الحالات البرمجية |
|---|---|---|
| `200 OK` | نجاح العملية | جلب بيانات أو تحديث ناجح |
| `201 Created` | تم إنشاء المورد | إنشاء طلب، إضافة منتج أو مستخدم |
| `400 Bad Request` | خطأ في المدخلات | فشل التحقق من الحقول (Validation Error) أو انتقال حالة غير مسموح |
| `401 Unauthorized` | غير مصرح | غياب أو انتهاء صلاحية رمز الدخول (Token) |
| `403 Forbidden` | ممنوع الصلاحية | محاولة موظف تنفيذ إجراء مخصص للمدير |
| `404 Not Found` | غير موجود | المنتج أو الطلب غير موجود |
| `409 Conflict` | تعارض بيانات | تكرار الـ Slug أو اسم المستخدم |
| `422 Unprocessable Entity` | تعذر المعالجة منطقياً | المنتج غير متاح في المخزون أو إجمالي الطلب دون الحد الأدنى |
| `429 Too Many Requests` | تجاوز حد الطلبات | تجاوز حد محاولات التتبع لحماية الخصوصية |
| `500 Internal Error` | خطأ غير متوقع | خطأ داخلي في الخادم |

---

## 2. جدول مطابقة قصص المستخدم مع الواجهات (Traceability Matrix)

| كود القصة | متطلب PRD | الوصف | Endpoint | Method | الصلاحية |
|---|---|---|---|---|---|
| US-001 | FR-001 | استعراض التصنيفات | `/api/v1/categories` | `GET` | Public |
| US-001, US-002 | FR-001..003 | تصفح وبحث المنتجات | `/api/v1/products` | `GET` | Public |
| US-002 | FR-002 | تفاصيل الصنف والأوزان | `/api/v1/products/{slugOrId}` | `GET` | Public |
| US-005, US-010 | FR-013, 014 | مناطق ورسوم التوصيل | `/api/v1/delivery-zones` | `GET` | Public |
| US-004, US-005 | FR-007..012, 026 | إنشاء طلب زائر (COD) | `/api/v1/orders` | `POST` | Public |
| US-006 | FR-020, BR-010 | استعلام وتتبع الطلب | `/api/v1/orders/track` | `POST` | Public (Rate Limited) |
| -- | FR-024 | تسجيل دخول الإدارة | `/api/v1/admin/auth/login` | `POST` | Public |
| -- | FR-024 | التحقق من جلسة الإدارة | `/api/v1/admin/auth/me` | `GET` | Staff / Manager |
| -- | FR-024 | تسجيل الخروج | `/api/v1/admin/auth/logout` | `POST` | Staff / Manager |
| US-007 | FR-016 | جلب طلبات المتجر | `/api/v1/admin/orders` | `GET` | Staff / Manager |
| US-007 | FR-019 | تفاصيل طلب كامل | `/api/v1/admin/orders/{id}` | `GET` | Staff / Manager |
| US-008, US-011 | FR-017, 018 | تحديث حالة الطلب | `/api/v1/admin/orders/{id}/status` | `PATCH` | Staff / Manager |
| US-009 | FR-022 | تبديل إتاحة المنتج سريعاً | `/api/v1/admin/products/{id}/availability` | `PATCH` | Staff / Manager |
| US-009 | FR-021 | إضافة منتج جديد | `/api/v1/admin/products` | `POST` | Manager |
| US-009 | FR-021 | تعديل منتج | `/api/v1/admin/products/{id}` | `PUT` | Manager |
| US-009 | FR-021, BR-009 | أرشفة منتج | `/api/v1/admin/products/{id}` | `DELETE` | Manager |
| US-010 | FR-013..015 | إدارة مناطق التوصيل | `/api/v1/admin/delivery-zones` | `GET, POST, PUT` | Manager |
| -- | FR-025, 031 | إدارة المشرفين | `/api/v1/admin/users` | `GET, POST, PATCH` | Manager |

---

## 3. مواصفات واجهات المتجر العامة (Storefront Public Endpoints)

### 3.1 جلب التصنيفات
- **Endpoint:** `GET /api/v1/categories`
- **الغرض:** عرض شرائح التصنيفات النشطة للزبون.
- **Query Params:** لا يوجد.
- **Status Codes:** `200 OK`
- **Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat_oriental",
      "slug": "oriental-sweets",
      "name": "حلويات شرقية",
      "description": "تشكيلة البقلاوة والمعمول الفاخر بالسمن البلدي",
      "imageUrl": "/images/categories/oriental.jpg",
      "displayOrder": 1,
      "isActive": true
    }
  ]
}
```

---

### 3.2 استعراض وتصفية المنتجات
- **Endpoint:** `GET /api/v1/products`
- **الغرض:** تصفح المنتجات في المتجر مع الفلترة والبحث.
- **Query Params:**
  - `category` (string, optional): معرف التصنيف أو الـ slug.
  - `search` (string, optional): البحث في الاسم والوصف.
  - `featured` (boolean, optional): المنتجات الأكثر طلباً.
  - `page` (integer, default: 1, min: 1).
  - `limit` (integer, default: 20, min: 1, max: 50).
- **Status Codes:** `200 OK`
- **Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_baklava_mix",
      "slug": "mixed-baklava-luxury",
      "name": "مشكل بقلاوة ملكي فاخر",
      "description": "طبقات رقائق هشة محشوة بالفستق الحلبي الفاخر وسمن بلدي أصلي",
      "categoryId": "cat_oriental",
      "categoryName": "حلويات شرقية",
      "price": 85.0,
      "salePrice": null,
      "unit": "kg",
      "imageUrl": "/images/products/baklava.jpg",
      "galleryImages": ["/images/products/baklava-1.jpg"],
      "isAvailable": true,
      "isFeatured": true,
      "availableWeights": [
        { "label": "نصف كيلو", "multiplier": 0.5, "price": 45.0 },
        { "label": "كيلو كامل", "multiplier": 1.0, "price": 85.0 }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 18,
    "totalPages": 1
  }
}
```

---

### 3.3 تفاصيل منتج محدد
- **Endpoint:** `GET /api/v1/products/{slugOrId}`
- **الغرض:** عرض تفاصيل صنف محدد وخيارات الأوزان وسعره المحدث.
- **Status Codes:** `200 OK`, `404 Not Found`
- **404 Error Example:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "عذراً، هذا الصنف غير متوفر حالياً في قائمة المتجر"
  }
}
```

---

### 3.4 استعراض مناطق ورسوم التوصيل
- **Endpoint:** `GET /api/v1/delivery-zones`
- **الغرض:** جلب قائمة مناطق التوصيل المتاحة مع الرسوم والحد الأدنى للطلب لاحتسابها في السلة.
- **Status Codes:** `200 OK`
- **Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "zone_gaza_central",
      "name": "مدينة غزة - الرمال والنصر والمركز",
      "deliveryFee": 10.0,
      "minOrderAmount": 30.0,
      "estimatedTimeMin": 30,
      "estimatedTimeMax": 60,
      "isActive": true
    }
  ]
}
```

---

### 3.5 إنشاء وإتمام الطلب (Guest Checkout)
- **Endpoint:** `POST /api/v1/orders`
- **الغرض:** تحويل السلة إلى طلب شراء مسجل كزائر دون إنشاء حساب مسبق.
- **Headers:**
  - `Idempotency-Key` (string UUID, optional): حماية ضد تكرار الطلب عند النقر المزدوج (BR-004).
- **Validation Rules (Zod / JSON Schema):**
  - `customer.fullName`: string, min: 3, max: 100.
  - `customer.phone`: string, regex: `/^(059|056)\d{7}$/`.
  - `customer.zoneId`: string (معرف منطقة سارية وموجودة).
  - `customer.streetAddress`: string, min: 5, max: 200.
  - `customer.buildingOrApt`: string, optional, max: 100.
  - `customer.notes`: string, optional, max: 200.
  - `items`: array, minItems: 1.
    - `items[].productId`: string (منتج موجود و `isAvailable: true`).
    - `items[].quantity`: integer, min: 1, max: 50.
    - `items[].weightMultiplier`: number, optional, positive.
  - `paymentMethod`: literal `"cash_on_delivery"`.
- **Request Example:**
```json
{
  "customer": {
    "fullName": "محمود أحمد",
    "phone": "0599123456",
    "zoneId": "zone_gaza_central",
    "streetAddress": "شارع النصر - بجوار مدرسة فلسطين",
    "buildingOrApt": "عمارة الأمل - الطابق الثاني",
    "notes": "الرجاء الاتصال قبل الوصول بـ 10 دقائق"
  },
  "items": [
    {
      "productId": "prod_baklava_mix",
      "quantity": 2,
      "weightMultiplier": 0.5
    }
  ],
  "paymentMethod": "cash_on_delivery"
}
```
- **Status Codes:**
  - `201 Created`: تم إنشاء الطلب بنجاح.
  - `400 Bad Request`: خطأ تحقق بالمدخلات (مثل رقم هاتف غير صحيح).
  - `422 Unprocessable Entity`: أحد الأصناف نفد أو إجمالي الطلب أقل من الحد الأدنى للمنطقة.
- **201 Response Example:**
```json
{
  "success": true,
  "data": {
    "orderNumber": "CL-2026-1042",
    "id": "ord_9f8d1c",
    "status": "new",
    "createdAt": "2026-11-05T12:30:00Z",
    "customer": {
      "fullName": "محمود أحمد",
      "phone": "0599123456",
      "zoneName": "مدينة غزة - الرمال والنصر والمركز",
      "streetAddress": "شارع النصر - بجوار مدرسة فلسطين"
    },
    "subtotal": 90.0,
    "deliveryFee": 10.0,
    "total": 100.0,
    "paymentMethod": "cash_on_delivery",
    "estimatedDeliveryTime": "30-60 دقيقة"
  }
}
```

---

### 3.6 استعلام تتبع حالة الطلب (Order Tracking)
- **Endpoint:** `POST /api/v1/orders/track`
- **الغرض:** تتبع العميل لحالة تجهيز وتسليم طلبه برقم الطلب ورقم الهاتف مع حماية الخصوصية (BR-010).
- **Validation Rules:**
  - `orderNumber`: string, min: 4, trim.
  - `phone`: string, regex: `/^(059|056)\d{7}$/`.
- **Rate Limit:** أقصى حد 5 محاولات فاشلة خلال 15 دقيقة لكل عنوان IP.
- **Request Example:**
```json
{
  "orderNumber": "CL-2026-1042",
  "phone": "0599123456"
}
```
- **Status Codes:**
  - `200 OK`: بيانات الحالة والخط الزمني.
  - `404 Not Found`: الطلب غير موجود أو رقم الهاتف لا يطابق الطلب.
  - `429 Too Many Requests`: تجاوز عدد المحاولات المسموح بها.
- **200 Response Example:**
```json
{
  "success": true,
  "data": {
    "orderNumber": "CL-2026-1042",
    "status": "in_preparation",
    "statusLabel": "قيد التجهيز",
    "createdAt": "2026-11-05T12:30:00Z",
    "total": 100.0,
    "itemsCount": 2,
    "timeline": [
      { "status": "new", "label": "تم استلام الطلب", "timestamp": "2026-11-05T12:30:00Z" },
      { "status": "accepted", "label": "تم قبول الطلب", "timestamp": "2026-11-05T12:35:00Z" },
      { "status": "in_preparation", "label": "جاري تجهيز الحلويات طازجة بالمطبخ", "timestamp": "2026-11-05T12:40:00Z" }
    ]
  }
}
```

---

## 4. مواصفات واجهات لوحة تحكم الإدارة (Admin / Staff Endpoints)

جميع الطلبات تتطلب ترويسة:  
`Authorization: Bearer <TOKEN>`

---

### 4.1 مصادقة الإدارة (Admin Authentication)

#### `POST /api/v1/admin/auth/login`
- **الصلاحية:** Public
- **Request:**
```json
{
  "username": "staff_nour",
  "password": "SecurePassword123!"
}
```
- **Responses:**
  - `200 OK`:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "usr_101",
        "username": "staff_nour",
        "fullName": "نور الهدى",
        "role": "staff"
      }
    }
  }
  ```
  - `401 Unauthorized`: اسم المستخدم أو كلمة المرور غير صحيحة.

#### `GET /api/v1/admin/auth/me`
- **الصلاحية:** Staff / Manager
- **Response:** بيانات الموظف المسجل حالياً وصلاحياته.

#### `POST /api/v1/admin/auth/logout`
- **الصلاحية:** Staff / Manager
- **Response:** `200 OK` وإبطال الرمز.

---

### 4.2 إدارة الطلبات (Orders Management)

#### `GET /api/v1/admin/orders`
- **الصلاحية:** Staff / Manager
- **Query Params:**
  - `status`: تصفية حسب الحالة (`new`, `accepted`, `in_preparation`, `out_for_delivery`, `delivered`, `undelivered`, `cancelled`).
  - `zoneId`: تصفية حسب المنطقة.
  - `search`: بحث برقم الطلب أو اسم العميل أو الهاتف.
  - `page`: default 1.
  - `limit`: default 25.
- **Status Codes:** `200 OK`

#### `GET /api/v1/admin/orders/{id}`
- **الصلاحية:** Staff / Manager
- **الغرض:** عرض تفاصيل الطلب الكاملة، بنود الأصناف، سجل التعديلات (Timeline)، والعنوان التفصيلي.
- **Status Codes:** `200 OK`, `404 Not Found`

#### `PATCH /api/v1/admin/orders/{id}/status`
- **الصلاحية:**
  - الترقية التشغيلية (`accepted`, `in_preparation`, `out_for_delivery`, `delivered`): متاحة للـ `staff` و `manager`.
  - الإلغاء (`cancelled`) أو معالجة تعذر التسليم (`undelivered`): مقيدة للـ `manager` فقط مع اشتراط كتابة السبب.
- **مصفوفة الانتقالات المعتمدة (BR-004 State Machine):**
  - `new` ⬅️ `accepted`, `cancelled`
  - `accepted` ⬅️ `in_preparation`, `cancelled`
  - `in_preparation` ⬅️ `out_for_delivery`
  - `out_for_delivery` ⬅️ `delivered`, `undelivered`
  - `undelivered` ⬅️ `out_for_delivery`, `cancelled`
  - `delivered` / `cancelled`: حالات نهائية مغلقة لا يسمح بأي تعديل عليها إطلاقاً.
- **Validation Rules:**
  - `status`: enum إلزامي من الحالات السبع المعتمدة.
  - `reason`: string إلزامي في حالتي `cancelled` أو `undelivered` (لا يقل عن 5 أحرف وفق FR-018 و FR-035).
- **Request Example:**
```json
{
  "status": "cancelled",
  "reason": "العميل طلب إلغاء الطلب هاتفياً قبل بدء التجهيز",
  "notes": "تم إشعار مسؤولة المطبخ"
}
```
- **Status Codes:**
  - `200 OK`: نجاح التحديث وتسجيل الحدث في السجل مع معرف الموظف القائم بالإجراء.
  - `400 Bad Request`: انتقال غير صالح لحالة الطلب أو غياب سبب الإلغاء.
  - `403 Forbidden`: نقص الصلاحية (مثلاً موظف عادي يحاول الإلغاء).

---

### 4.3 إدارة المنتجات والتصنيفات (Products & Categories)

#### `PATCH /api/v1/admin/products/{id}/availability`
- **الصلاحية:** Staff / Manager (FR-022)
- **الغرض:** تبديل حالة توفر المنتج بضغطة زر عند نفاد الكمية في المطبخ.
- **Request:**
```json
{
  "isAvailable": false
}
```
- **Status Codes:** `200 OK`, `404 Not Found`

#### `POST /api/v1/admin/products`
- **الصلاحية:** Manager فقط (FR-021)
- **Validation Rules:**
  - `name`: string, min: 3, max: 100.
  - `slug`: string, regex: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, unique.
  - `description`: string, min: 10.
  - `categoryId`: string (تصنيف قائم).
  - `price`: number, positive (> 0).
  - `salePrice`: number, optional, positive.
  - `unit`: enum `["kg", "half_kg", "piece", "box"]`.
  - `imageUrl`: string URL.
  - `isAvailable`: boolean (default: true).
  - `availableWeights`: array of `{ label: string, multiplier: number, price: number }`.
- **Status Codes:** `201 Created`, `400 Bad Request`, `409 Conflict (Duplicate Slug)`.

#### `PUT /api/v1/admin/products/{id}`
- **الصلاحية:** Manager فقط (FR-021)
- **الغرض:** تعديل بيانات منتج موجود.
- **Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`.

#### `DELETE /api/v1/admin/products/{id}`
- **الصلاحية:** Manager فقط (BR-009)
- **القاعدة الإلزامية:** إذا كان المنتج مسجلاً في أي طلب تاريخي، يتم تحويله إلى أرشفة (`isArchived: true` و `isAvailable: false`) ولا يتم حذفه فيزيائياً من قاعدة البيانات.
- **Status Codes:** `200 OK`, `404 Not Found`.

---

### 4.4 إدارة مناطق التوصيل (Delivery Zones)

#### `GET /api/v1/admin/delivery-zones`
- **الصلاحية:** Staff / Manager
- **Response:** قائمة المناطق بما فيها المناطق غير النشطة.

#### `POST /api/v1/admin/delivery-zones` & `PUT /api/v1/admin/delivery-zones/{id}`
- **الصلاحية:** Manager فقط (FR-013, FR-015)
- **Validation Rules:**
  - `name`: string, min: 3.
  - `deliveryFee`: number, min: 0.
  - `minOrderAmount`: number, min: 0.
  - `estimatedTimeMin`: integer, min: 5.
  - `estimatedTimeMax`: integer, max: 240.
  - `isActive`: boolean.
- **Status Codes:** `201 Created` / `200 OK`, `400 Bad Request`.

---

### 4.5 إدارة المشرفين والمستخدمين (Admin Users Management)

#### `GET /api/v1/admin/users`
- **الصلاحية:** Manager فقط (FR-025, FR-031)
- **Response:** قائمة حسابات الموظفين والمديرين وحالة نشاطها.

#### `POST /api/v1/admin/users`
- **الصلاحية:** Manager فقط
- **Validation Rules:**
  - `username`: string, min: 3, unique.
  - `fullName`: string, min: 3.
  - `email`: string email, unique.
  - `password`: string, min: 8.
  - `role`: enum `["staff", "manager"]`.
- **Status Codes:** `201 Created`, `400 Bad Request`, `409 Conflict`.

#### `PATCH /api/v1/admin/users/{id}`
- **الصلاحية:** Manager فقط
- **الغرض:** تفعيل أو تجميد حساب موظف (`isActive`) أو تعديل دوره أو إعادة تعيين كلمة المرور (FR-031, FR-032).
- **Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`.

---

## 5. حدود النطاق الصارمة (Out-of-Scope Boundaries)

تأكيداً لقواعد وثيقة `PRD_v0.2.md` (القسم 9):
1. **لا توجد واجهات مصادقة زبائن:** لا يسمح بإنشاء `POST /api/v1/auth/register` أو `POST /api/v1/auth/customer-login` (الطلب كزائر فقط).
2. **لا توجد بوابات دفع إلكتروني:** لا يسمح بإنشاء `POST /api/v1/payments/stripe` أو بوابات بنكية (الدفع نقداً COD فقط).
3. **لا يوجد تتبع GPS حي للمناديب:** لا يسمح بإنشاء مسارات WebSockets أو مواقع إحداثيات خريطة حية في مرحلة MVP.
4. **لا توجد كوبونات أو خصومات ترويجية:** لا يسمح بإنشاء واجهات للتحقق من كوبونات أو برامج ولاء.
5. **لا توجد واجهات لطلبات كيك مخصصة:** ميزة F-9 غير معتمدة في MVP.
