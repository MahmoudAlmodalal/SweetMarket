// js/mock-data.js
// Seed data ONLY. Screens never import this directly — they go through js/api.js.
// Next.js: becomes the database seed (prisma/seed.ts or similar). Delete once a real DB exists.
// Passwords below are DEV-ONLY mock credentials.

export const categories = [
  { id: "c1", slug: "cakes",     name: "كيك",            order: 1 },
  { id: "c2", slug: "oriental",  name: "حلويات شرقية",   order: 2 },
  { id: "c3", slug: "pastries",  name: "معجنات",         order: 3 },
  { id: "c4", slug: "chocolate", name: "شوكولاتة",       order: 4 },
];

export const products = [
  // ---- كيك ----
  { id: "p1",  slug: "chocolate-fudge-cake",  name: "كيكة الشوكولاتة الفاخرة", description: "طبقات من الكيك الطري مع كريمة الشوكولاتة الداكنة وغاناش لامع.", price: 85, categoryId: "c1", available: true,  archived: false, imageAlt: "قطعة كيك شوكولاتة مغطاة بالغاناش على طبق", emoji: "🍰" },
  { id: "p2",  slug: "berry-cheesecake",      name: "تشيز كيك التوت",          description: "تشيز كيك كريمي على قاعدة البسكويت مع صلصة التوت الطازج.",      price: 75, categoryId: "c1", available: true,  archived: false, imageAlt: "تشيز كيك مغطى بصلصة التوت الأحمر", emoji: "🍰" },
  { id: "p3",  slug: "vanilla-cream-cake",    name: "كيكة الفانيلا بالكريمة",  description: "كيكة إسفنجية خفيفة بالفانيلا مع كريمة الزبدة وحبات الفراولة.", price: 68, categoryId: "c1", available: true,  archived: false, imageAlt: "كيكة فانيلا بيضاء مزينة بالفراولة", emoji: "🎂" },
  { id: "p4",  slug: "carrot-walnut-cake",    name: "كيكة الجزر بالجوز",       description: "كيكة رطبة بالجزر والقرفة والجوز مع كريمة الجبن.",              price: 62, categoryId: "c1", available: true,  archived: false, imageAlt: "قطعة كيك جزر مع طبقة كريمة الجبن", emoji: "🧁" },
  // ---- حلويات شرقية ----
  { id: "p5",  slug: "kunafa-cheese",         name: "كنافة بالجبن",            description: "كنافة ناعمة مقرمشة محشوة بالجبن ومسقية بالقطر.",              price: 45, categoryId: "c2", available: true,  archived: false, imageAlt: "صينية كنافة ذهبية بالجبن", emoji: "🍯" },
  { id: "p6",  slug: "baklava-assorted",      name: "بقلاوة مشكلة",            description: "علبة بقلاوة بالفستق والجوز بطبقات رقيقة مقرمشة.",              price: 55, categoryId: "c2", available: true,  archived: false, imageAlt: "علبة بقلاوة مشكلة بالفستق", emoji: "🥮" },
  { id: "p7",  slug: "basbousa-qashta",       name: "بسبوسة بالقشطة",          description: "بسبوسة طرية بالسميد مع طبقة قشطة طازجة.",                      price: 30, categoryId: "c2", available: true,  archived: false, imageAlt: "مربعات بسبوسة مع القشطة", emoji: "🍮" },
  { id: "p8",  slug: "maamoul-dates",         name: "معمول بالتمر (علبة)",     description: "علبة معمول بالتمر المصنوع بالسمن البلدي.",                     price: 40, categoryId: "c2", available: false, archived: false, imageAlt: "علبة معمول بالتمر مرصوص بعناية", emoji: "🍪" },
  // ---- معجنات ----
  { id: "p9",  slug: "butter-croissant",      name: "كرواسون بالزبدة",         description: "كرواسون مقرمش من الخارج وهش من الداخل، يُخبز يومياً.",         price: 12, categoryId: "c3", available: true,  archived: false, imageAlt: "كرواسون ذهبي بالزبدة", emoji: "🥐" },
  { id: "p10", slug: "sugar-donut",           name: "دونات بالسكر",            description: "دونات طرية مغطاة بالسكر الناعم.",                              price: 10, categoryId: "c3", available: true,  archived: false, imageAlt: "حبة دونات مغطاة بالسكر", emoji: "🍩" },
  { id: "p11", slug: "blueberry-muffin",      name: "مافن التوت الأزرق",       description: "مافن غني بحبات التوت الأزرق وقمة مقرمشة.",                     price: 14, categoryId: "c3", available: true,  archived: false, imageAlt: "مافن بالتوت الأزرق", emoji: "🧁" },
  // ---- شوكولاتة ----
  { id: "p12", slug: "dark-truffles-box",     name: "ترافل شوكولاتة داكنة",    description: "علبة 12 قطعة ترافل بالشوكولاتة الداكنة والكاكاو.",              price: 60, categoryId: "c4", available: true,  archived: false, imageAlt: "علبة ترافل شوكولاتة داكنة", emoji: "🍫" },
  { id: "p13", slug: "hazelnut-bar",          name: "لوح شوكولاتة بالبندق",    description: "لوح شوكولاتة بالحليب مع قطع البندق المحمص.",                   price: 22, categoryId: "c4", available: false, archived: false, imageAlt: "لوح شوكولاتة بالبندق", emoji: "🍫" },
  { id: "p14", slug: "limited-festive-box",   name: "علبة المناسبات المحدودة", description: "علبة شوكولاتة موسمية (مؤرشفة).",                               price: 95, categoryId: "c4", available: false, archived: true,  imageAlt: "علبة شوكولاتة موسمية", emoji: "🎁" },
];

export const zones = [
  { id: "z1", name: "وسط المدينة",         fee: 10, minOrder: 50,  enabled: true  },
  { id: "z2", name: "حي الروضة",           fee: 0,  minOrder: 100, enabled: true  }, // free delivery
  { id: "z3", name: "حي النخيل",           fee: 15, minOrder: 60,  enabled: true  },
  { id: "z4", name: "الضواحي الشمالية",    fee: 25, minOrder: 120, enabled: true  },
  { id: "z5", name: "المنطقة الصناعية",    fee: 30, minOrder: 150, enabled: false },
];

// 6 orders: جديد، مقبول، قيد التجهيز، خرج للتوصيل، تعذّر التسليم، ملغي
// (تم التسليم is reachable live: خرج للتوصيل → تم التسليم / تعذّر التسليم → تم التسليم)
export const orders = [
  {
    id: "o1", orderNo: "SW-1006", status: "جديد", version: 1,
    customer: { name: "سارة العتيبي", phone: "0501234567", address: "حي الياسمين، شارع الأمير سلطان، عمارة 12، شقة 4" },
    zoneId: "z1", zoneName: "وسط المدينة",
    items: [
      { productId: "p1", name: "كيكة الشوكولاتة الفاخرة", price: 85, qty: 1 },
      { productId: "p9", name: "كرواسون بالزبدة",         price: 12, qty: 4 },
    ],
    subtotal: 133, deliveryFee: 10, total: 143,
    paymentMethod: "cod", paymentStatus: "unpaid",
    cancelReason: null, failReason: null,
    createdAt: "2026-10-29T06:40:00Z", updatedAt: "2026-10-29T06:40:00Z",
    statusLog: [
      { from: null, to: "جديد", at: "2026-10-29T06:40:00Z", by: "الزبون", reason: null },
    ],
  },
  {
    id: "o2", orderNo: "SW-1005", status: "مقبول", version: 2,
    customer: { name: "محمد القحطاني", phone: "0559876543", address: "حي النخيل، شارع 15، فيلا رقم 7" },
    zoneId: "z3", zoneName: "حي النخيل",
    items: [
      { productId: "p5", name: "كنافة بالجبن",   price: 45, qty: 1 },
      { productId: "p7", name: "بسبوسة بالقشطة", price: 30, qty: 2 },
    ],
    subtotal: 105, deliveryFee: 15, total: 120,
    paymentMethod: "cod", paymentStatus: "unpaid",
    cancelReason: null, failReason: null,
    createdAt: "2026-10-29T05:55:00Z", updatedAt: "2026-10-29T06:10:00Z",
    statusLog: [
      { from: null,  to: "جديد",  at: "2026-10-29T05:55:00Z", by: "الزبون",       reason: null },
      { from: "جديد", to: "مقبول", at: "2026-10-29T06:10:00Z", by: "أبو محمد",     reason: null },
    ],
  },
  {
    id: "o3", orderNo: "SW-1004", status: "قيد التجهيز", version: 3,
    customer: { name: "ريم الدوسري", phone: "0541112233", address: "حي الروضة، بجوار المسجد الكبير، منزل 3" },
    zoneId: "z2", zoneName: "حي الروضة",
    items: [
      { productId: "p6",  name: "بقلاوة مشكلة",         price: 55, qty: 2 },
      { productId: "p12", name: "ترافل شوكولاتة داكنة", price: 60, qty: 1 },
    ],
    subtotal: 170, deliveryFee: 0, total: 170,
    paymentMethod: "cod", paymentStatus: "unpaid",
    cancelReason: null, failReason: null,
    createdAt: "2026-10-29T05:10:00Z", updatedAt: "2026-10-29T06:25:00Z",
    statusLog: [
      { from: null,     to: "جديد",        at: "2026-10-29T05:10:00Z", by: "الزبون",   reason: null },
      { from: "جديد",    to: "مقبول",       at: "2026-10-29T05:20:00Z", by: "أبو محمد", reason: null },
      { from: "مقبول",   to: "قيد التجهيز", at: "2026-10-29T06:25:00Z", by: "خالد",     reason: null },
    ],
  },
  {
    id: "o4", orderNo: "SW-1003", status: "خرج للتوصيل", version: 4,
    customer: { name: "عبدالله الحربي", phone: "0567778899", address: "وسط المدينة، شارع الملك فهد، برج الأعمال، الدور 5" },
    zoneId: "z1", zoneName: "وسط المدينة",
    items: [
      { productId: "p2",  name: "تشيز كيك التوت", price: 75, qty: 1 },
      { productId: "p10", name: "دونات بالسكر",   price: 10, qty: 6 },
    ],
    subtotal: 135, deliveryFee: 10, total: 145,
    paymentMethod: "cod", paymentStatus: "unpaid",
    cancelReason: null, failReason: null,
    createdAt: "2026-10-28T16:30:00Z", updatedAt: "2026-10-28T18:05:00Z",
    statusLog: [
      { from: null,          to: "جديد",        at: "2026-10-28T16:30:00Z", by: "الزبون",   reason: null },
      { from: "جديد",         to: "مقبول",       at: "2026-10-28T16:40:00Z", by: "أبو محمد", reason: null },
      { from: "مقبول",        to: "قيد التجهيز", at: "2026-10-28T17:00:00Z", by: "نورة",     reason: null },
      { from: "قيد التجهيز",  to: "خرج للتوصيل", at: "2026-10-28T18:05:00Z", by: "نورة",     reason: null },
    ],
  },
  {
    id: "o5", orderNo: "SW-1002", status: "تعذّر التسليم", version: 5,
    customer: { name: "هند الشمري", phone: "0533344556", address: "الضواحي الشمالية، حي الأمل، شارع 9، منزل 21" },
    zoneId: "z4", zoneName: "الضواحي الشمالية",
    items: [
      { productId: "p3", name: "كيكة الفانيلا بالكريمة", price: 68, qty: 2 },
    ],
    subtotal: 136, deliveryFee: 25, total: 161,
    paymentMethod: "cod", paymentStatus: "unpaid",
    cancelReason: null, failReason: "الزبون لا يرد على الهاتف عند وصول السائق",
    createdAt: "2026-10-28T12:00:00Z", updatedAt: "2026-10-28T15:20:00Z",
    statusLog: [
      { from: null,           to: "جديد",          at: "2026-10-28T12:00:00Z", by: "الزبون",   reason: null },
      { from: "جديد",          to: "مقبول",         at: "2026-10-28T12:10:00Z", by: "أبو محمد", reason: null },
      { from: "مقبول",         to: "قيد التجهيز",   at: "2026-10-28T12:40:00Z", by: "خالد",     reason: null },
      { from: "قيد التجهيز",   to: "خرج للتوصيل",   at: "2026-10-28T14:30:00Z", by: "خالد",     reason: null },
      { from: "خرج للتوصيل",   to: "تعذّر التسليم", at: "2026-10-28T15:20:00Z", by: "خالد",     reason: "الزبون لا يرد على الهاتف عند وصول السائق" },
    ],
  },
  {
    id: "o6", orderNo: "SW-1001", status: "ملغي", version: 3,
    customer: { name: "فهد المطيري", phone: "0580011223", address: "حي النخيل، شارع 22، عمارة الزهور، شقة 8" },
    zoneId: "z3", zoneName: "حي النخيل",
    items: [
      { productId: "p4",  name: "كيكة الجزر بالجوز", price: 62, qty: 1 },
      { productId: "p11", name: "مافن التوت الأزرق", price: 14, qty: 3 },
    ],
    subtotal: 104, deliveryFee: 15, total: 119,
    paymentMethod: "cod", paymentStatus: "unpaid",
    cancelReason: "تعذّر التواصل مع الزبون لتأكيد العنوان", failReason: null,
    createdAt: "2026-10-27T10:15:00Z", updatedAt: "2026-10-27T11:00:00Z",
    statusLog: [
      { from: null,    to: "جديد",  at: "2026-10-27T10:15:00Z", by: "الزبون",   reason: null },
      { from: "جديد",   to: "مقبول", at: "2026-10-27T10:25:00Z", by: "أبو محمد", reason: null },
      { from: "مقبول",  to: "ملغي",  at: "2026-10-27T11:00:00Z", by: "أبو محمد", reason: "تعذّر التواصل مع الزبون لتأكيد العنوان" },
    ],
  },
];

export const adminUsers = [
  { id: "u1", name: "أبو محمد", email: "manager@sweets.test", role: "manager", active: true, password: "Manager#123" },
  { id: "u2", name: "خالد",     email: "staff1@sweets.test",  role: "staff",   active: true, password: "Staff#123" },
  { id: "u3", name: "نورة",     email: "staff2@sweets.test",  role: "staff",   active: true, password: "Staff#123" },
];
