// js/store.js
// Cart state: localStorage key "cart_v1", expires 24h after the last change, all access in try/catch.
// Next.js: becomes a client-side store (Zustand with `persist` middleware, or a React Context provider)
//          mounted in app/(storefront)/layout.tsx. Server never sees the cart until createOrder.

import { MAX_QTY } from "./config.js";

const KEY = "cart_v1";
const TTL_MS = 24 * 60 * 60 * 1000;

/** Line shape: { productId, slug, name, price, qty, emoji, imageAlt }  (price = price when added) */
let lines = load();
const listeners = new Set();

function isValidLine(l) {
  return l && typeof l.productId === "string" && Number.isInteger(l.qty) && l.qty >= 1 && typeof l.price === "number";
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.lines) || Date.now() - data.savedAt > TTL_MS) {
      localStorage.removeItem(KEY);
      return [];
    }
    return data.lines.filter(isValidLine);
  } catch {
    return [];
  }
}

function persist() {
  try {
    if (!lines.length) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), lines }));
  } catch { /* storage unavailable/full: cart still works in memory */ }
}

function notify() {
  const snapshot = getCart();
  listeners.forEach((fn) => {
    try { fn(snapshot, getTotals()); } catch (e) { console.error(e); }
  });
}

function commit() {
  persist();
  notify();
}

/* ---------------- reads ---------------- */

export function getCart() {
  return lines.map((l) => ({ ...l }));
}

export function getTotals() {
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = Math.round(lines.reduce((s, l) => s + l.price * l.qty, 0) * 100) / 100;
  return { count, lineCount: lines.length, subtotal };
}

/** fn(cartLines, totals) is called after every change (and when another tab changes the cart). Returns unsubscribe. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* ---------------- writes ---------------- */

/**
 * Add a product (as returned by api.getProduct / getProducts). BR-001: unavailable products are refused.
 * Returns { ok, reason?, clamped? }
 */
export function addItem(product, qty = 1) {
  if (!product || product.available === false || product.archived) return { ok: false, reason: "unavailable" };
  const q = Math.max(1, Math.floor(qty));
  const existing = lines.find((l) => l.productId === product.id);
  if (existing) {
    const next = existing.qty + q;
    existing.qty = Math.min(next, MAX_QTY);
    commit();
    return { ok: true, clamped: next > MAX_QTY };
  }
  lines.push({
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    qty: Math.min(q, MAX_QTY),
    emoji: product.emoji,
    imageAlt: product.imageAlt,
  });
  commit();
  return { ok: true, clamped: q > MAX_QTY };
}

/** Set an exact quantity (clamped to 1..MAX_QTY). Use removeItem to delete. */
export function updateQty(productId, qty) {
  const line = lines.find((l) => l.productId === productId);
  if (!line) return;
  line.qty = Math.min(Math.max(1, Math.floor(qty) || 1), MAX_QTY);
  commit();
}

export function removeItem(productId) {
  lines = lines.filter((l) => l.productId !== productId);
  commit();
}

/** Remove several lines at once (e.g. all ids returned in validateCart().unavailable). */
export function removeItems(productIds) {
  const ids = new Set(productIds);
  lines = lines.filter((l) => !ids.has(l.productId));
  commit();
}

/** Customer accepted the new prices (EC-02): changes = validateCart().priceChanges */
export function applyPriceChanges(changes) {
  changes.forEach((c) => {
    const line = lines.find((l) => l.productId === c.productId);
    if (line) line.price = c.newPrice;
  });
  commit();
}

export function clear() {
  lines = [];
  commit();
}

/* keep several open tabs in sync */
window.addEventListener("storage", (e) => {
  if (e.key === KEY || e.key === null) {
    lines = load();
    notify();
  }
});
