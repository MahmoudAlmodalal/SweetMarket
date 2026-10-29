// js/ui.js
// Shared UI helpers. Pure "component" functions return HTML strings (escape user data with escapeHtml!).
// Next.js: each helper becomes a shared component or hook:
//   toast -> <ToastProvider/> + useToast(); openModal -> <Modal/> (or <dialog>); renderStateBox -> <StateBox/>;
//   skeleton* -> <Skeleton/>; renderStatusBadge -> <StatusBadge/>; format* -> lib/format.ts;
//   setLiveRegion -> <LiveRegion/>; initDevSwitcher -> delete (dev only).

import { CURRENCY } from "./config.js";
import { STATUS } from "./api.js";

/* ------------------------------------------------------------------ */
/* Text & formatting                                                   */
/* ------------------------------------------------------------------ */

export function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Plain-text price, Western digits, always 2 decimals: "85.00 ر.س" (open: Q-11 currency/tax). */
export function formatPrice(n) {
  const num = Number(n) || 0;
  const text = num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${text} ${CURRENCY}`;
}

/** HTML price: the number is LTR-isolated, the currency stays in the RTL flow. */
export function formatPriceHtml(n) {
  const num = Number(n) || 0;
  const text = num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `<span class="price-value"><span dir="ltr">${text}</span> ${escapeHtml(CURRENCY)}</span>`;
}

/** Phone / order numbers must read left-to-right inside RTL text. */
export function formatPhoneLtr(phone, { link = false } = {}) {
  const p = escapeHtml(phone);
  return link
    ? `<a href="tel:${p}" dir="ltr" class="ltr">${p}</a>`
    : `<span dir="ltr" class="ltr">${p}</span>`;
}

export function formatDateTime(iso) {
  try {
    return new Intl.DateTimeFormat("ar-u-nu-latn", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

const STATUS_BADGE_CLASS = {
  [STATUS.NEW]: "badge--status-new",
  [STATUS.ACCEPTED]: "badge--status-accepted",
  [STATUS.PREPARING]: "badge--status-preparing",
  [STATUS.OUT]: "badge--status-out",
  [STATUS.DELIVERED]: "badge--status-delivered",
  [STATUS.FAILED]: "badge--status-failed",
  [STATUS.CANCELLED]: "badge--status-cancelled",
};

/** Order status badge — always shows the status as text. */
export function renderStatusBadge(status) {
  return `<span class="badge ${STATUS_BADGE_CLASS[status] || ""}">${escapeHtml(status)}</span>`;
}

/** Availability badge (text, never color alone). */
export function renderAvailabilityBadge(available) {
  return available
    ? `<span class="badge badge--success">متاح</span>`
    : `<span class="badge badge--muted">غير متاح</span>`;
}

export function uuid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/* ------------------------------------------------------------------ */
/* Skeleton helpers (return HTML strings; wrap the region with aria-busy="true" while loading) */
/* ------------------------------------------------------------------ */

export function skeletonText(lines = 3) {
  return Array.from({ length: lines }, (_, i) =>
    `<span class="skeleton skeleton--text" style="inline-size:${i === lines - 1 ? 60 : 100}%" aria-hidden="true"></span>`
  ).join("");
}
export function skeletonBlock() {
  return `<span class="skeleton skeleton--block" aria-hidden="true"></span>`;
}
export function skeletonCards(count = 6) {
  return Array.from({ length: count }, () => `<div class="skeleton skeleton--card" aria-hidden="true"></div>`).join("");
}
export function skeletonRows(count = 5) {
  return Array.from({ length: count }, () => `<div class="skeleton skeleton--row" aria-hidden="true"></div>`).join("");
}

/* ------------------------------------------------------------------ */
/* State box (empty / error)                                           */
/* ------------------------------------------------------------------ */

/**
 * renderStateBox({ type: "empty"|"error", icon, title, text, actions:[{label, action, variant, href}] })
 * Buttons get data-action so the screen can wire them with one delegated listener.
 */
export function renderStateBox({ type = "empty", icon, title, text = "", actions = [] }) {
  const defaultIcon = type === "error" ? "⚠️" : "🍰";
  const buttons = actions.map((a) => {
    const cls = `btn btn--${a.variant || "primary"}`;
    return a.href
      ? `<a class="${cls}" href="${escapeHtml(a.href)}">${escapeHtml(a.label)}</a>`
      : `<button type="button" class="${cls}" data-action="${escapeHtml(a.action || "")}">${escapeHtml(a.label)}</button>`;
  }).join("");
  return `
<!-- component: StateBox -->
<div class="state-box state-box--${type}" ${type === "error" ? 'role="alert"' : ""}>
  <div class="state-box__icon" aria-hidden="true">${icon || defaultIcon}</div>
  <h2 class="state-box__title">${escapeHtml(title)}</h2>
  ${text ? `<p class="state-box__text">${escapeHtml(text)}</p>` : ""}
  ${buttons ? `<div class="state-box__actions">${buttons}</div>` : ""}
</div>
<!-- /component -->`;
}

/* ------------------------------------------------------------------ */
/* Live region                                                         */
/* ------------------------------------------------------------------ */

let liveEl;
/** Announce a message to screen readers (aria-live="polite"; assertive for urgent). */
export function setLiveRegion(message, { assertive = false } = {}) {
  if (!liveEl) {
    liveEl = document.createElement("div");
    liveEl.className = "visually-hidden";
    liveEl.id = "live-region";
    liveEl.setAttribute("aria-live", "polite");
    liveEl.setAttribute("aria-atomic", "true");
    document.body.appendChild(liveEl);
  }
  liveEl.setAttribute("aria-live", assertive ? "assertive" : "polite");
  liveEl.textContent = "";
  setTimeout(() => { liveEl.textContent = message; }, 50); // re-announce even if the text is identical
}

/* ------------------------------------------------------------------ */
/* Toast                                                               */
/* ------------------------------------------------------------------ */

let toastRegion;
/** toast("تمت الإضافة", { type: "success"|"error"|"info", duration: 4000 }) */
export function toast(message, { type = "info", duration = 4000 } = {}) {
  if (!toastRegion) {
    toastRegion = document.createElement("div");
    toastRegion.className = "toast-region";
    toastRegion.setAttribute("aria-live", "polite");
    document.body.appendChild(toastRegion);
  }
  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.setAttribute("role", type === "error" ? "alert" : "status");
  el.innerHTML = `<span class="toast__message">${escapeHtml(message)}</span>
    <button type="button" class="toast__close" aria-label="إغلاق التنبيه">✕</button>`;
  const remove = () => {
    el.classList.add("is-leaving");
    setTimeout(() => el.remove(), 260);
  };
  el.querySelector(".toast__close").addEventListener("click", remove);
  toastRegion.appendChild(el);
  if (duration > 0) setTimeout(remove, duration);
  return { close: remove };
}

/* ------------------------------------------------------------------ */
/* Modal (focus trap, Esc to close, focus restore)                     */
/* ------------------------------------------------------------------ */

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * openModal({
 *   title, body (HTML string or Node),
 *   actions: [{ label, variant, value, onClick(ctx) }]   // onClick may return false to keep the modal open (validation)
 *   dismissible = true, initialFocus (selector)
 * }) -> { el, close(value), result: Promise<value | undefined> }
 */
export function openModal({ title, body = "", actions = [], dismissible = true, initialFocus } = {}) {
  const previouslyFocused = document.activeElement;
  const titleId = `modal-title-${uuid().slice(0, 8)}`;
  const overlay = document.createElement("div");
  overlay.className = "modal";
  overlay.innerHTML = `
<!-- component: Modal -->
<div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="${titleId}" tabindex="-1">
  <h2 class="modal__title" id="${titleId}">${escapeHtml(title)}</h2>
  <div class="modal__body"></div>
  <div class="modal__actions">
    ${actions.map((a, i) => `<button type="button" class="btn btn--${a.variant || "outline"}" data-modal-action="${i}">${escapeHtml(a.label)}</button>`).join("")}
  </div>
</div>
<!-- /component -->`;
  const dialog = overlay.querySelector(".modal__dialog");
  const bodyEl = overlay.querySelector(".modal__body");
  if (body instanceof Node) bodyEl.appendChild(body);
  else bodyEl.innerHTML = body;

  let resolveResult;
  const result = new Promise((res) => { resolveResult = res; });
  let closed = false;

  function close(value) {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKeydown, true);
    overlay.remove();
    document.body.classList.remove("is-modal-open");
    if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    resolveResult(value);
  }

  function onKeydown(e) {
    if (e.key === "Escape" && dismissible) {
      e.stopPropagation();
      close(undefined);
      return;
    }
    if (e.key !== "Tab") return;
    const items = [...dialog.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
    if (!items.length) { e.preventDefault(); dialog.focus(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  const ctx = { el: dialog, close };
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay && dismissible) close(undefined);
    const btn = e.target.closest("[data-modal-action]");
    if (!btn) return;
    const action = actions[Number(btn.dataset.modalAction)];
    if (action.onClick && action.onClick(ctx) === false) return;
    close(action.value);
  });

  document.body.appendChild(overlay);
  document.body.classList.add("is-modal-open");
  document.addEventListener("keydown", onKeydown, true);
  const target = (initialFocus && dialog.querySelector(initialFocus)) || dialog.querySelector(FOCUSABLE) || dialog;
  target.focus();

  return { el: dialog, close, result };
}

/** Convenience: yes/no confirmation. Resolves true / false. */
export async function confirmModal({ title, text, confirmLabel = "تأكيد", cancelLabel = "إلغاء", danger = false }) {
  const { result } = openModal({
    title,
    body: `<p>${escapeHtml(text)}</p>`,
    actions: [
      { label: cancelLabel, variant: "outline", value: false },
      { label: confirmLabel, variant: danger ? "danger" : "primary", value: true },
    ],
  });
  return (await result) === true;
}

/* ------------------------------------------------------------------ */
/* Buttons & forms                                                     */
/* ------------------------------------------------------------------ */

/** Disable + spinner while a request is pending (prevents double submit). */
export function setButtonPending(button, pending, pendingLabel) {
  if (!button) return;
  if (pending) {
    if (button.classList.contains("is-pending")) return;
    button.dataset.label = button.innerHTML;
    button.disabled = true;
    button.classList.add("is-pending");
    button.setAttribute("aria-busy", "true");
    button.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${escapeHtml(pendingLabel || "جارٍ المعالجة…")}</span>`;
  } else {
    button.disabled = false;
    button.classList.remove("is-pending");
    button.removeAttribute("aria-busy");
    if (button.dataset.label !== undefined) button.innerHTML = button.dataset.label;
  }
}

/**
 * Show field errors + an error summary and move focus to the first invalid field.
 * Markup contract (per field):  <div class="field">
 *     <label class="field__label" for="phone">…</label>
 *     <input class="field__input" id="phone" name="phone">
 *     <p class="field__error" id="phone-error"></p>   </div>
 * and one <div data-error-summary></div> near the top of the form.
 * errors: { fieldName: "message" }
 */
export function showFormErrors(form, errors) {
  clearFormErrors(form);
  const entries = Object.entries(errors).filter(([, msg]) => msg);
  const summary = form.querySelector("[data-error-summary]");
  let firstInput = null;
  const items = [];
  for (const [name, message] of entries) {
    const input = form.elements[name];
    const errEl = form.querySelector(`#${CSS.escape(name)}-error`);
    if (input && errEl) {
      errEl.textContent = message;
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", errEl.id);
      input.closest(".field")?.classList.add("field--invalid");
      firstInput = firstInput || input;
      items.push(`<li><a href="#${escapeHtml(input.id)}">${escapeHtml(message)}</a></li>`);
    } else {
      items.push(`<li>${escapeHtml(message)}</li>`);
    }
  }
  if (summary && items.length) {
    summary.innerHTML = `<div class="error-summary" role="alert" tabindex="-1">
      <p class="error-summary__title">يرجى تصحيح ${items.length > 1 ? "الأخطاء التالية" : "الخطأ التالي"}:</p>
      <ul class="error-summary__list">${items.join("")}</ul></div>`;
    summary.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", (e) => { e.preventDefault(); form.querySelector(a.getAttribute("href"))?.focus(); })
    );
  }
  (firstInput || summary?.querySelector(".error-summary"))?.focus();
}

export function clearFormErrors(form) {
  form.querySelectorAll(".field__error").forEach((n) => { n.textContent = ""; });
  form.querySelectorAll("[aria-invalid]").forEach((n) => { n.removeAttribute("aria-invalid"); n.removeAttribute("aria-describedby"); });
  form.querySelectorAll(".field--invalid").forEach((n) => n.classList.remove("field--invalid"));
  const summary = form.querySelector("[data-error-summary]");
  if (summary) summary.innerHTML = "";
}

/* ------------------------------------------------------------------ */
/* dev-only: state switcher (?dev=1)                                   */
/* ------------------------------------------------------------------ */
/* dev-only */
const DEV_STATES = [
  { key: "loading", label: "تحميل" },
  { key: "empty",   label: "فارغ" },
  { key: "error",   label: "خطأ" },
  { key: "normal",  label: "عادي" },
];

function applyDevState(key) {
  const s = (window.__simulate = window.__simulate || {});
  s.loading = key === "loading";
  s.empty = key === "empty";
  s.fail = key === "error";
}

/**
 * Call once per screen BEFORE the first fetch. onChange(stateKey) should re-run the screen's load().
 * Does nothing unless the URL contains ?dev=1. Returns the active state key.
 */
export function initDevSwitcher({ onChange } = {}) {
  if (new URLSearchParams(location.search).get("dev") !== "1") return "normal";
  let current = "normal";
  try { current = sessionStorage.getItem("dev_state") || "normal"; } catch { /* ignore */ }
  applyDevState(current);

  const box = document.createElement("div");
  box.className = "dev-switcher";
  box.setAttribute("role", "group");
  box.setAttribute("aria-label", "محاكاة حالات الشاشة (للتطوير فقط)");
  box.innerHTML = DEV_STATES.map((s) =>
    `<button type="button" class="dev-switcher__btn" data-dev-state="${s.key}" aria-pressed="${s.key === current}">${s.label}</button>`
  ).join("");
  box.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-dev-state]");
    if (!btn) return;
    current = btn.dataset.devState;
    try { sessionStorage.setItem("dev_state", current); } catch { /* ignore */ }
    applyDevState(current);
    box.querySelectorAll("[data-dev-state]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    if (onChange) onChange(current);
  });
  document.body.appendChild(box);
  return current;
}
/* /dev-only */
