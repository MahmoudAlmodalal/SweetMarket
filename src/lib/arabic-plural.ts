/**
 * Arabic count labels with correct plural agreement.
 * 1 → the singular form ("عنصر واحد"), 2 → the dual form ("عنصران"),
 * 3–10 → "N" + few form ("3 عناصر"), 11+ → "N" + many form ("11 عنصراً").
 */
export interface ArabicCountForms {
  one: string;
  two: string;
  few: string;
  many: string;
}

export function arabicCountLabel(count: number, forms: ArabicCountForms): string {
  if (count === 1) return forms.one;
  if (count === 2) return forms.two;
  if (count >= 3 && count <= 10) return `${count} ${forms.few}`;
  return `${count} ${forms.many}`;
}

/** Generic item counter used by the storefront badges. */
export const ITEM_COUNT_FORMS: ArabicCountForms = {
  one: 'عنصر واحد',
  two: 'عنصران',
  few: 'عناصر',
  many: 'عنصراً',
};
