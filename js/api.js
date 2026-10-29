// js/api.js
// Promise-based mock API. Every function mirrors a future endpoint and enforces the SAME rules the
// real server must enforce (validation, permissions, transitions, concurrency, idempotency).
// Next.js: public/storefront reads -> route handlers (GET) or server components calling lib/db;
//          mutations -> server actions or POST/PATCH route handlers. See README.md for the mapping.
//
// Dev switch (set by the ?dev=1 switcher in ui.js, or manually in the console):
//   window.__simulate = { fail: false, empty: false, loading: false }
//     fail    -> every call rejects with ApiError("NETWORK")
//     empty   -> list calls resolve with []
//     loading -> calls never settle (so the skeleton stays visible)

import { MAX_QTY, TRACK_MAX_ATTEMPTS, FEATURES } from "./config.js";
import * as seed from "./mock-data.js";

/* ------------------------------------------------------------------ */
/* Infrastructure                                                      */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;     // NETWORK | NOT_FOUND | INVALID_INPUT | UNAUTHENTICATED | FORBIDDEN | CONFLICT | ...
    this.details = details;
  }
}

const sim = (window.__simulate = Object.assign({ fail: false, empty: false, loading: false }, window.__simulate));

const DB_KEY = "mock_db_v1";          // so data survives navigating between the separate HTML screens
const SESSION_KEY = "admin_session_v1";
const LOCK_MS = 15 * 60 * 1000;       // lock duration after too many failed attempts (open value)
const MIN_PASSWORD = 8;               // open value
const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const delay = () => 400 + Math.floor(Math.random() * 500);
const nowIso = () => new Date().toISOString();

function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    categories: clone(seed.categories),
    products: clone(seed.products),
    zones: clone(seed.zones),
    orders: clone(seed.orders),
    adminUsers: clone(seed.adminUsers),
    idempotency: {},                         // idempotencyKey -> order summary
    trackAttempts: { count: 0, lockedUntil: 0 },
    loginAttempts: {},                       // email -> { count, lockedUntil }
  };
}
let db = loadDb();
function save() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch { /* ignore */ }
}
/** Dev helper: wipe all mock changes and go back to the seed. */
export function resetMockDb() {
  try { localStorage.removeItem(DB_KEY); sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  db = loadDb();
}

/**
 * Wrap a handler: simulated latency + failure/empty/loading switches.
 * `emptyValue` is returned when window.__simulate.empty is on (list endpoints only).
 */
function call(handler, emptyValue) {
  return new Promise((resolve, reject) => {
    if (sim.loading) return; // never settles on purpose
    setTimeout(() => {
      try {
        if (sim.fail) throw new ApiError("NETWORK", "تعذّر الاتصال بالخادم. تأكد من اتصالك وحاول مرة أخرى.");
        if (sim.empty && emptyValue !== undefined) return resolve(clone(emptyValue));
        resolve(clone(handler()));
      } catch (e) {
        reject(e);
      }
    }, delay());
  });
}

/* ------------------------------------------------------------------ */
/* Order status model (shared by UI and API)                           */
/* ------------------------------------------------------------------ */

export const STATUS = {
  NEW: "جديد",
  ACCEPTED: "مقبول",
  PREPARING: "قيد التجهيز",
  OUT: "خرج للتوصيل",
  DELIVERED: "تم التسليم",
  FAILED: "تعذّر التسليم",
  CANCELLED: "ملغي",
};
export const STATUS_LIST = Object.values(STATUS);
export const FINAL_STATUSES = [STATUS.DELIVERED, STATUS.CANCELLED];

const TRANSITIONS = {
  [STATUS.NEW]: [STATUS.ACCEPTED, STATUS.CANCELLED],
  [STATUS.ACCEPTED]: [STATUS.PREPARING, STATUS.CANCELLED],
  [STATUS.PREPARING]: [STATUS.OUT, STATUS.CANCELLED],
  [STATUS.OUT]: [STATUS.DELIVERED, STATUS.FAILED],
  [STATUS.FAILED]: [STATUS.DELIVERED, STATUS.CANCELLED], // manager only
  [STATUS.DELIVERED]: [],
  [STATUS.CANCELLED]: [],
};

/** Cancel = manager only. Anything leaving تعذّر التسليم = manager only. */
function roleMayTransition(from, to, role) {
  if (role === "manager") return true;
  if (to === STATUS.CANCELLED) return false;
  if (from === STATUS.FAILED) return false;
  return true;
}

/** Pure helper for the UI: which buttons to render for this status + role. */
export function getAllowedTransitions(status, role) {
  return (TRANSITIONS[status] || []).filter((to) => roleMayTransition(status, to, role));
}

const isActiveStatus = (s) => !FINAL_STATUSES.includes(s);

/* ------------------------------------------------------------------ */
/* Validation helpers                                                  */
/* ------------------------------------------------------------------ */

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
export function normalizeDigits(str = "") {
  return String(str)
    .replace(/[٠-٩]/g, (d) => AR_DIGITS.indexOf(d))
    .replace(/[۰-۹]/g, (d) => FA_DIGITS.indexOf(d));
}
/** Loose phone check (country still open, Q-13): 9–15 digits, optional leading +. */
export function normalizePhone(phone = "") {
  return normalizeDigits(phone).replace(/[\s\-()]/g, "");
}
export function isValidPhone(phone) {
  return /^\+?\d{9,15}$/.test(normalizePhone(phone));
}
const ORDER_NO_RE = /^SW-\d{3,}$/;
const normalizeOrderNo = (s = "") => normalizeDigits(s).trim().toUpperCase();

function invalid(fields, message = "يرجى تصحيح الحقول المحددة.") {
  return new ApiError("INVALID_INPUT", message, { fields });
}
const isMoney = (n) => typeof n === "number" && Number.isFinite(n);
const round2 = (n) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ */
/* Auth helpers                                                        */
/* ------------------------------------------------------------------ */

const publicUser = ({ password, ...u }) => u;

/** Sync: current admin session user (or null). Used by admin pages for guards + nav. */
export function getAdminSession() {
  try {
    const id = sessionStorage.getItem(SESSION_KEY);
    const u = id && db.adminUsers.find((x) => x.id === id && x.active);
    return u ? publicUser(u) : null;
  } catch {
    return null;
  }
}
function requireUser(role) {
  const u = getAdminSession();
  if (!u) throw new ApiError("UNAUTHENTICATED", "انتهت جلستك، يرجى تسجيل الدخول.");
  if (role === "manager" && u.role !== "manager") {
    throw new ApiError("FORBIDDEN", "هذا الإجراء غير متاح لحسابك.");
  }
  return u;
}
function tempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/* ================================================================== */
/* STOREFRONT                                                          */
/* ================================================================== */

export function getCategories() {
  return call(() => [...db.categories].sort((a, b) => a.order - b.order), []);
}

/** Storefront list: never returns archived products; unavailable ones are returned flagged (shown with a badge). */
export function getProducts({ categorySlug, q } = {}) {
  return call(() => {
    let list = db.products.filter((p) => !p.archived);
    if (categorySlug) {
      const cat = db.categories.find((c) => c.slug === categorySlug);
      if (!cat) throw new ApiError("NOT_FOUND", "التصنيف غير موجود.");
      list = list.filter((p) => p.categoryId === cat.id);
    }
    const term = (q || "").trim().toLowerCase();
    if (term) list = list.filter((p) => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
    const catName = Object.fromEntries(db.categories.map((c) => [c.id, c.name]));
    return list.map((p) => ({ ...p, categoryName: catName[p.categoryId] }));
  }, []);
}

export function getProduct(slug) {
  return call(() => {
    const p = db.products.find((x) => x.slug === slug && !x.archived);
    if (!p) throw new ApiError("NOT_FOUND", "المنتج غير موجود.");
    const cat = db.categories.find((c) => c.id === p.categoryId);
    return { ...p, categoryName: cat?.name, categorySlug: cat?.slug };
  });
}

/** Resolve cart lines against the current catalog. Pure (no delay) so createOrder can reuse it. */
function checkLines(lines) {
  const unavailable = [];
  const priceChanges = [];
  const items = [];
  for (const line of lines) {
    const p = db.products.find((x) => x.id === line.productId);
    if (!p || p.archived || !p.available) {
      unavailable.push(line.productId);
      continue;
    }
    if (isMoney(line.price) && round2(line.price) !== round2(p.price)) {
      priceChanges.push({ productId: p.id, name: p.name, oldPrice: line.price, newPrice: p.price });
    }
    items.push({ productId: p.id, name: p.name, price: p.price, qty: line.qty, emoji: p.emoji, imageAlt: p.imageAlt, slug: p.slug });
  }
  return { unavailable, priceChanges, items };
}

/** EC-01 / EC-02: called when opening the cart and before checkout. lines: [{productId, qty, price}] */
export function validateCart(lines = []) {
  return call(() => {
    const { unavailable, priceChanges, items } = checkLines(lines);
    return { ok: !unavailable.length && !priceChanges.length, unavailable, priceChanges, items };
  });
}

/** Enabled zones only (what the customer can choose). */
export function getZones() {
  return call(() => db.zones.filter((z) => z.enabled).map((z) => ({ id: z.id, name: z.name, fee: z.fee, minOrder: FEATURES.minOrder ? z.minOrder : null })), []);
}

/**
 * payload: { idempotencyKey, customer:{name,phone,address}, zoneId, lines:[{productId,qty,price}] }
 * Idempotent: the same key always returns the same order (EC-03 / AC-007).
 */
export function createOrder(payload = {}) {
  return call(() => {
    const { idempotencyKey, customer = {}, zoneId, lines = [] } = payload;
    if (!idempotencyKey) throw new ApiError("INVALID_INPUT", "طلب غير صالح.", { fields: {} });
    if (db.idempotency[idempotencyKey]) return db.idempotency[idempotencyKey];

    // ER-001: field validation (messages match UI_UX_REQUIREMENTS §7)
    const fields = {};
    const name = (customer.name || "").trim();
    if (name.length < 2 || name.length > 80) fields.name = "الرجاء إدخال الاسم الكامل";
    if (!isValidPhone(customer.phone)) fields.phone = "رقم الهاتف غير صحيح";
    if ((customer.address || "").trim().length < 10) fields.address = "الرجاء إدخال العنوان التفصيلي";
    if (!zoneId) fields.zoneId = "اختر منطقة التوصيل";
    if (Object.keys(fields).length) throw invalid(fields);

    if (!Array.isArray(lines) || !lines.length) throw new ApiError("EMPTY_CART", "سلتك فارغة حالياً.");
    for (const l of lines) {
      if (!Number.isInteger(l.qty) || l.qty < 1 || l.qty > MAX_QTY) {
        throw new ApiError("INVALID_INPUT", `الكمية يجب أن تكون بين 1 و ${MAX_QTY}.`, { fields: {} });
      }
    }

    // BR-006 / ER-004
    const zone = db.zones.find((z) => z.id === zoneId && z.enabled);
    if (!zone) {
      throw new ApiError("OUT_OF_ZONE", "عذراً، لا نوصل إلى هذه المنطقة", {
        availableZones: db.zones.filter((z) => z.enabled).map((z) => z.name),
      });
    }

    // EC-01 / EC-02 at submit time: server is the source of truth
    const { unavailable, priceChanges, items } = checkLines(lines);
    if (unavailable.length) throw new ApiError("UNAVAILABLE_ITEMS", "بعض الأصناف لم تعد متاحة.", { unavailable });
    if (priceChanges.length) throw new ApiError("PRICE_CHANGED", "تغيّرت أسعار بعض الأصناف.", { priceChanges });

    const subtotal = round2(items.reduce((s, i) => s + i.price * i.qty, 0));
    if (FEATURES.minOrder && zone.minOrder && subtotal < zone.minOrder) {
      throw new ApiError("BELOW_MIN", "الطلب أقل من الحد الأدنى للمنطقة.", { minOrder: zone.minOrder, missing: round2(zone.minOrder - subtotal) });
    }

    const nextNum = db.orders.reduce((m, o) => Math.max(m, parseInt(o.orderNo.split("-")[1], 10) || 0), 1000) + 1;
    const ts = nowIso();
    const order = {
      id: `o${db.orders.length + 1}-${Date.now().toString(36)}`,
      orderNo: `SW-${nextNum}`,
      status: STATUS.NEW,
      version: 1,
      customer: { name, phone: normalizePhone(customer.phone), address: customer.address.trim() },
      zoneId: zone.id,
      zoneName: zone.name,
      items: items.map(({ productId, name: n, price, qty }) => ({ productId, name: n, price, qty })), // price snapshot (AC-006)
      subtotal,
      deliveryFee: zone.fee,
      total: round2(subtotal + zone.fee),
      paymentMethod: "cod",
      paymentStatus: "unpaid",
      cancelReason: null,
      failReason: null,
      createdAt: ts,
      updatedAt: ts,
      statusLog: [{ from: null, to: STATUS.NEW, at: ts, by: "الزبون", reason: null }],
    };
    db.orders.unshift(order);
    const summary = {
      orderNo: order.orderNo,
      itemCount: order.items.reduce((s, i) => s + i.qty, 0),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      zoneName: order.zoneName,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
    };
    db.idempotency[idempotencyKey] = summary;
    save();
    return summary;
  });
}

/**
 * BR-010 / AC-010: orderNo + phone must both match. Mismatch -> ONE generic error (ER-005).
 * After TRACK_MAX_ATTEMPTS failures the lookup is locked for a while (NFR-015).
 */
export function trackOrder(orderNo, phone) {
  return call(() => {
    const no = normalizeOrderNo(orderNo);
    const fields = {};
    if (!ORDER_NO_RE.test(no)) fields.orderNo = "رقم الطلب غير صحيح";
    if (!isValidPhone(phone)) fields.phone = "رقم الهاتف غير صحيح";
    if (Object.keys(fields).length) throw invalid(fields);

    const t = db.trackAttempts;
    if (t.lockedUntil > Date.now()) {
      throw new ApiError("LOCKED", "تجاوزت عدد المحاولات المسموح. حاول لاحقاً أو تواصل معنا.", { until: t.lockedUntil });
    }
    if (t.lockedUntil && t.lockedUntil <= Date.now()) { t.count = 0; t.lockedUntil = 0; }

    const order = db.orders.find((o) => o.orderNo === no && normalizePhone(o.customer.phone) === normalizePhone(phone));
    if (!order) {
      t.count += 1;
      if (t.count >= TRACK_MAX_ATTEMPTS) {
        t.lockedUntil = Date.now() + LOCK_MS;
        save();
        throw new ApiError("LOCKED", "تجاوزت عدد المحاولات المسموح. حاول لاحقاً أو تواصل معنا.", { until: t.lockedUntil });
      }
      save();
      throw new ApiError("NOT_FOUND", "لم نعثر على طلب مطابق للبيانات المدخلة");
    }
    t.count = 0; t.lockedUntil = 0; save();
    // current status only + summary: no name / phone / address (BR-010)
    return {
      orderNo: order.orderNo,
      status: order.status,
      updatedAt: order.updatedAt,
      total: order.total,
      items: order.items.map(({ name, qty }) => ({ name, qty })),
    };
  });
}

/* ================================================================== */
/* ADMIN — auth                                                        */
/* ================================================================== */

export function adminLogin({ email, password } = {}) {
  return call(() => {
    const key = (email || "").trim().toLowerCase();
    if (!key || !password) throw invalid({ email: !key ? "أدخل البريد الإلكتروني" : undefined, password: !password ? "أدخل كلمة المرور" : undefined });
    const att = (db.loginAttempts[key] ||= { count: 0, lockedUntil: 0 });
    if (att.lockedUntil > Date.now()) throw new ApiError("LOCKED", "محاولات كثيرة. حاول لاحقاً.", { until: att.lockedUntil });
    const user = db.adminUsers.find((u) => u.email.toLowerCase() === key && u.password === password && u.active);
    if (!user) {
      att.count += 1;
      if (att.count >= 5) { att.lockedUntil = Date.now() + LOCK_MS; att.count = 0; }
      save();
      throw new ApiError("INVALID_CREDENTIALS", "البيانات غير صحيحة"); // generic: never reveal which part was wrong
    }
    att.count = 0; att.lockedUntil = 0; save();
    try { sessionStorage.setItem(SESSION_KEY, user.id); } catch { /* ignore */ }
    return { user: publicUser(user) };
  });
}

export function adminLogout() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  return call(() => ({ ok: true }));
}

export function changePassword({ current, next } = {}) {
  return call(() => {
    const u = requireUser();
    const rec = db.adminUsers.find((x) => x.id === u.id);
    const fields = {};
    if (rec.password !== current) fields.current = "كلمة المرور الحالية غير صحيحة";
    if (!next || next.length < MIN_PASSWORD) fields.next = `كلمة المرور يجب ألا تقل عن ${MIN_PASSWORD} أحرف`;
    if (Object.keys(fields).length) throw invalid(fields);
    rec.password = next; save();
    return { ok: true };
  });
}

/* ================================================================== */
/* ADMIN — orders                                                      */
/* ================================================================== */

/** List rows deliberately omit phone/address (shown only in getOrder). status: a STATUS value or "all". */
export function getOrders({ status } = {}) {
  return call(() => {
    requireUser();
    let list = [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (status && status !== "all") list = list.filter((o) => o.status === status);
    return list.map((o) => ({
      id: o.id, orderNo: o.orderNo, customerName: o.customer.name, zoneName: o.zoneName,
      total: o.total, status: o.status, createdAt: o.createdAt, updatedAt: o.updatedAt, version: o.version,
      itemCount: o.items.reduce((s, i) => s + i.qty, 0),
    }));
  }, []);
}

export function getOrder(id) {
  return call(() => {
    const u = requireUser();
    const o = db.orders.find((x) => x.id === id);
    if (!o) throw new ApiError("NOT_FOUND", "الطلب غير موجود.");
    return { ...o, allowedNext: getAllowedTransitions(o.status, u.role) };
  });
}

/**
 * Enforces, in this order: session -> exists -> version (concurrency, EC-10/AC-009)
 * -> transition table (BR-004) -> role (cancel = manager) -> reason rules.
 */
export function changeOrderStatus(id, { to, reason, version } = {}) {
  return call(() => {
    const u = requireUser();
    const o = db.orders.find((x) => x.id === id);
    if (!o) throw new ApiError("NOT_FOUND", "الطلب غير موجود.");

    if (version !== o.version) {
      throw new ApiError("CONFLICT", "تغيّر الطلب منذ فتحته", { order: { ...o, allowedNext: getAllowedTransitions(o.status, u.role) } });
    }
    if (!(TRANSITIONS[o.status] || []).includes(to)) {
      throw new ApiError("INVALID_TRANSITION", `لا يمكن الانتقال من «${o.status}» إلى «${to}».`);
    }
    if (!roleMayTransition(o.status, to, u.role)) {
      throw new ApiError("FORBIDDEN", "هذا الإجراء غير متاح لحسابك.");
    }
    const text = (reason || "").trim();
    if (to === STATUS.CANCELLED && text.length < 5) throw invalid({ reason: "يلزم كتابة سبب الإلغاء (5 أحرف على الأقل)" });
    if (to === STATUS.FAILED && text.length < 5) throw invalid({ reason: "يلزم كتابة سبب تعذّر التسليم (5 أحرف على الأقل)" });

    const ts = nowIso();
    o.statusLog.push({ from: o.status, to, at: ts, by: u.name, reason: text || null });
    o.status = to;
    o.version += 1;
    o.updatedAt = ts;
    if (to === STATUS.CANCELLED) o.cancelReason = text;
    if (to === STATUS.FAILED) o.failReason = text;
    save();
    return { ...o, allowedNext: getAllowedTransitions(o.status, u.role) };
  });
}

/* ================================================================== */
/* ADMIN — products                                                    */
/* ================================================================== */

/** filters: { categoryId, availability: all|available|unavailable, archived: active|archived|all } */
export function getProductsAdmin({ categoryId, availability = "all", archived = "active" } = {}) {
  return call(() => {
    requireUser();
    const catName = Object.fromEntries(db.categories.map((c) => [c.id, c.name]));
    return db.products
      .filter((p) => (archived === "all" ? true : archived === "archived" ? p.archived : !p.archived))
      .filter((p) => (categoryId ? p.categoryId === categoryId : true))
      .filter((p) => (availability === "available" ? p.available : availability === "unavailable" ? !p.available : true))
      .map((p) => ({ ...p, categoryName: catName[p.categoryId] }));
  }, []);
}

export function getProductAdmin(id) {
  return call(() => {
    requireUser("manager");
    const p = db.products.find((x) => x.id === id);
    if (!p) throw new ApiError("NOT_FOUND", "المنتج غير موجود.");
    return p;
  });
}

/** Staff + manager (FR-022). */
export function toggleAvailability(id, available) {
  return call(() => {
    requireUser();
    const p = db.products.find((x) => x.id === id);
    if (!p || p.archived) throw new ApiError("NOT_FOUND", "المنتج غير موجود.");
    p.available = !!available;
    save();
    return { id: p.id, available: p.available };
  });
}

/** Manager only. data: {id?, name, description, price, categoryId, available, imageAlt, emoji} */
export function saveProduct(data = {}) {
  return call(() => {
    requireUser("manager");
    const fields = {};
    const name = (data.name || "").trim();
    const price = typeof data.price === "string" ? Number(normalizeDigits(data.price)) : data.price;
    if (!name) fields.name = "الرجاء إدخال اسم المنتج";
    if (!isMoney(price) || price <= 0) fields.price = "السعر يجب أن يكون رقماً أكبر من صفر";
    if (!db.categories.some((c) => c.id === data.categoryId)) fields.categoryId = "اختر التصنيف";
    if (!(data.imageAlt || "").trim()) fields.imageAlt = "الوصف البديل للصورة مطلوب";
    if (Object.keys(fields).length) throw invalid(fields);

    const patch = {
      name,
      description: (data.description || "").trim(),
      price: round2(price),
      categoryId: data.categoryId,
      available: data.available !== false,
      imageAlt: data.imageAlt.trim(),
      emoji: data.emoji || "🍰",
    };
    if (data.id) {
      const p = db.products.find((x) => x.id === data.id);
      if (!p) throw new ApiError("NOT_FOUND", "المنتج غير موجود.");
      Object.assign(p, patch); // old orders keep their own price snapshot (AC-006)
      save();
      return p;
    }
    const n = db.products.reduce((m, p) => Math.max(m, parseInt(String(p.id).slice(1), 10) || 0), 0) + 1;
    const p = { id: `p${n}`, slug: `product-${n}`, archived: false, ...patch };
    db.products.push(p);
    save();
    return p;
  });
}

/** BR-009: product that appears in any order is archived, never hard-deleted. */
export function archiveOrDeleteProduct(id) {
  return call(() => {
    requireUser("manager");
    const idx = db.products.findIndex((x) => x.id === id);
    if (idx < 0) throw new ApiError("NOT_FOUND", "المنتج غير موجود.");
    const used = db.orders.some((o) => o.items.some((i) => i.productId === id));
    if (used) {
      db.products[idx].archived = true;
      db.products[idx].available = false;
      save();
      return { result: "archived" };
    }
    db.products.splice(idx, 1);
    save();
    return { result: "deleted" };
  });
}

export function restoreProduct(id) {
  return call(() => {
    requireUser("manager");
    const p = db.products.find((x) => x.id === id);
    if (!p) throw new ApiError("NOT_FOUND", "المنتج غير موجود.");
    p.archived = false;
    save();
    return p;
  });
}

/* ================================================================== */
/* ADMIN — categories (manager)                                        */
/* ================================================================== */

export function getCategoriesAdmin() {
  return call(() => {
    requireUser("manager");
    return [...db.categories]
      .sort((a, b) => a.order - b.order)
      .map((c) => ({ ...c, productCount: db.products.filter((p) => p.categoryId === c.id && !p.archived).length }));
  }, []);
}

export function saveCategory({ id, name } = {}) {
  return call(() => {
    requireUser("manager");
    const n = (name || "").trim();
    if (!n) throw invalid({ name: "الرجاء إدخال اسم التصنيف" });
    if (db.categories.some((c) => c.name === n && c.id !== id)) throw invalid({ name: "اسم التصنيف مستخدم من قبل" });
    if (id) {
      const c = db.categories.find((x) => x.id === id);
      if (!c) throw new ApiError("NOT_FOUND", "التصنيف غير موجود.");
      c.name = n; save();
      return c;
    }
    const num = db.categories.reduce((m, c) => Math.max(m, parseInt(String(c.id).slice(1), 10) || 0), 0) + 1;
    const c = { id: `c${num}`, slug: `category-${num}`, name: n, order: db.categories.reduce((m, x) => Math.max(m, x.order), 0) + 1 };
    db.categories.push(c); save();
    return c;
  });
}

/** direction: "up" | "down" (buttons, not drag-and-drop — easier for keyboard/touch). */
export function reorderCategory(id, direction) {
  return call(() => {
    requireUser("manager");
    const sorted = [...db.categories].sort((a, b) => a.order - b.order);
    const i = sorted.findIndex((c) => c.id === id);
    if (i < 0) throw new ApiError("NOT_FOUND", "التصنيف غير موجود.");
    const j = direction === "up" ? i - 1 : i + 1;
    if (j >= 0 && j < sorted.length) {
      const a = db.categories.find((c) => c.id === sorted[i].id);
      const b = db.categories.find((c) => c.id === sorted[j].id);
      [a.order, b.order] = [b.order, a.order];
      save();
    }
    return [...db.categories].sort((a, b) => a.order - b.order);
  });
}

export function deleteCategory(id) {
  return call(() => {
    requireUser("manager");
    if (db.products.some((p) => p.categoryId === id)) {
      throw new ApiError("HAS_PRODUCTS", "لا يمكن حذف تصنيف يحتوي على منتجات. انقل المنتجات أولاً.");
    }
    const idx = db.categories.findIndex((c) => c.id === id);
    if (idx < 0) throw new ApiError("NOT_FOUND", "التصنيف غير موجود.");
    db.categories.splice(idx, 1); save();
    return { ok: true };
  });
}

/* ================================================================== */
/* ADMIN — delivery zones (manager)                                    */
/* ================================================================== */

export function getZonesAdmin() {
  return call(() => {
    requireUser("manager");
    return db.zones.map((z) => ({ ...z, activeOrders: db.orders.filter((o) => o.zoneId === z.id && isActiveStatus(o.status)).length }));
  }, []);
}

export function saveZone(data = {}) {
  return call(() => {
    requireUser("manager");
    const fields = {};
    const name = (data.name || "").trim();
    const fee = typeof data.fee === "string" ? Number(normalizeDigits(data.fee)) : data.fee;
    const minRaw = data.minOrder === "" || data.minOrder == null ? null : (typeof data.minOrder === "string" ? Number(normalizeDigits(data.minOrder)) : data.minOrder);
    if (!name) fields.name = "الرجاء إدخال اسم المنطقة";
    else if (db.zones.some((z) => z.name === name && z.id !== data.id)) fields.name = "اسم المنطقة مستخدم من قبل";
    if (!isMoney(fee) || fee < 0) fields.fee = "الرسوم يجب أن تكون رقماً غير سالب";
    if (minRaw !== null && (!isMoney(minRaw) || minRaw < 0)) fields.minOrder = "الحد الأدنى يجب أن يكون رقماً غير سالب";
    if (Object.keys(fields).length) throw invalid(fields);

    const patch = { name, fee: round2(fee), minOrder: minRaw === null ? 0 : round2(minRaw), enabled: data.enabled !== false };
    if (data.id) {
      const z = db.zones.find((x) => x.id === data.id);
      if (!z) throw new ApiError("NOT_FOUND", "المنطقة غير موجودة.");
      Object.assign(z, patch); save();
      return z;
    }
    const n = db.zones.reduce((m, z) => Math.max(m, parseInt(String(z.id).slice(1), 10) || 0), 0) + 1;
    const z = { id: `z${n}`, ...patch };
    db.zones.push(z); save();
    return z;
  });
}

/** EC-09: a zone with active (non-final) orders can't be deleted — disable it instead. */
export function deleteZone(id) {
  return call(() => {
    requireUser("manager");
    const idx = db.zones.findIndex((z) => z.id === id);
    if (idx < 0) throw new ApiError("NOT_FOUND", "المنطقة غير موجودة.");
    const active = db.orders.filter((o) => o.zoneId === id && isActiveStatus(o.status)).length;
    if (active) {
      throw new ApiError("HAS_ACTIVE_ORDERS", "لا يمكن حذف منطقة فيها طلبات نشطة. يمكنك تعطيلها بدلاً من ذلك.", { activeOrders: active, canDisable: true });
    }
    db.zones.splice(idx, 1); save();
    return { ok: true };
  });
}

/* ================================================================== */
/* ADMIN — users (manager)                                             */
/* ================================================================== */

const activeManagers = () => db.adminUsers.filter((u) => u.role === "manager" && u.active);

export function getUsers() {
  return call(() => {
    requireUser("manager");
    return db.adminUsers.map(publicUser);
  }, []);
}

/** Returns the temporary password ONCE (show it in a modal, never store it client-side). */
export function createUser({ name, email, role } = {}) {
  return call(() => {
    requireUser("manager");
    const fields = {};
    const e = (email || "").trim().toLowerCase();
    if (!(name || "").trim()) fields.name = "الرجاء إدخال الاسم";
    if (!/^\S+@\S+\.\S+$/.test(e)) fields.email = "البريد الإلكتروني غير صحيح";
    else if (db.adminUsers.some((u) => u.email.toLowerCase() === e)) fields.email = "البريد مستخدم من قبل";
    if (!["manager", "staff"].includes(role)) fields.role = "اختر الدور";
    if (Object.keys(fields).length) throw invalid(fields);
    const n = db.adminUsers.reduce((m, u) => Math.max(m, parseInt(String(u.id).slice(1), 10) || 0), 0) + 1;
    const pw = tempPassword();
    const u = { id: `u${n}`, name: name.trim(), email: e, role, active: true, password: pw };
    db.adminUsers.push(u); save();
    return { user: publicUser(u), tempPassword: pw };
  });
}

export function updateUser(id, { name, role } = {}) {
  return call(() => {
    requireUser("manager");
    const u = db.adminUsers.find((x) => x.id === id);
    if (!u) throw new ApiError("NOT_FOUND", "المستخدم غير موجود.");
    if (role && role !== "manager" && u.role === "manager" && u.active && activeManagers().length <= 1) {
      throw new ApiError("LAST_MANAGER", "لا يمكن تغيير دور آخر مدير نشط.");
    }
    if (name !== undefined) {
      if (!name.trim()) throw invalid({ name: "الرجاء إدخال الاسم" });
      u.name = name.trim();
    }
    if (role) u.role = role;
    save();
    return publicUser(u);
  });
}

export function setUserActive(id, active) {
  return call(() => {
    requireUser("manager");
    const u = db.adminUsers.find((x) => x.id === id);
    if (!u) throw new ApiError("NOT_FOUND", "المستخدم غير موجود.");
    if (!active && u.role === "manager" && u.active && activeManagers().length <= 1) {
      throw new ApiError("LAST_MANAGER", "لا يمكن إيقاف آخر مدير نشط.");
    }
    u.active = !!active; save(); // a real server also revokes this user's sessions here
    return publicUser(u);
  });
}

export function resetUserPassword(id) {
  return call(() => {
    requireUser("manager");
    const u = db.adminUsers.find((x) => x.id === id);
    if (!u) throw new ApiError("NOT_FOUND", "المستخدم غير موجود.");
    const pw = tempPassword();
    u.password = pw; save();
    return { tempPassword: pw };
  });
}

export function deleteUser(id) {
  return call(() => {
    const me = requireUser("manager");
    const idx = db.adminUsers.findIndex((x) => x.id === id);
    if (idx < 0) throw new ApiError("NOT_FOUND", "المستخدم غير موجود.");
    const u = db.adminUsers[idx];
    if (u.id === me.id) throw new ApiError("FORBIDDEN", "لا يمكنك حذف حسابك الحالي.");
    if (u.role === "manager" && u.active && activeManagers().length <= 1) {
      throw new ApiError("LAST_MANAGER", "لا يمكن حذف آخر مدير نشط.");
    }
    db.adminUsers.splice(idx, 1); save();
    return { ok: true };
  });
}
