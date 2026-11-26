/**
 * @file search.ts
 * @description محرك ودوال البحث والتنقيح العربي الموحد لمتجر كاندي لوز
 * يطبق قواعد التنقيح العربي (تجريد التشكيل، توحيد الألفات، الياء، التاء المربوطة، والأرقام)
 */

/**
 * خريطة تحويل الأرقام الهندية/المشرقية إلى الأرقام اللاتينية (العربية الأصلية)
 */
const ARABIC_INDIC_DIGITS_MAP: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

/**
 * تنقيح النص العربي وتوحيده للمطابقة المرنة في البحث
 *
 * القواعد المطبقة:
 * 1. إزالة الفراغات من الأطراف (trim) ودمج المسافات المتكررة (collapse whitespace)
 * 2. إزالة التشكيل وحركات الإعراب والتطويل/الكشيدة (strip diacritics & tatweel)
 * 3. توحيد صور حرف الألف (أ، إ، آ، ٱ -> ا)
 * 4. توحيد الياء والألف المقصورة (ى -> ي)
 * 5. توحيد التاء المربوطة (ة -> ه)
 * 6. تحويل الأرقام المشرقية (٠١٢٣٤٥٦٧٨٩ -> 0-9)
 * 7. تحويل الحروف اللاتينية إلى أحرف صغيرة (lowercase)
 *
 * @param text النص المراد تنقيحه
 * @returns النص بعد التنقيح والتوحيد
 */
export function normalizeArabicText(text: string): string {
  if (!text) return "";

  return text
    .trim()
    .replace(/\s+/g, " ")
    // إزالة التشكيل والتنوين وحركات الضبط والهمزات العلوية وحرف التطويل
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    // توحيد صور الألف: أ، إ، آ، ٱ -> ا
    .replace(/[أإآٱ]/g, "ا")
    // توحيد الألف المقصورة إلى ياء: ى -> ي
    .replace(/ى/g, "ي")
    // توحيد التاء المربوطة إلى هاء: ة -> ه
    .replace(/ة/g, "ه")
    // تحويل الأرقام المشرقية إلى الأرقام 0-9
    .replace(/[٠-٩]/g, (digit) => ARABIC_INDIC_DIGITS_MAP[digit] ?? digit)
    // تحويل الأحرف اللاتينية إلى صغيرة
    .toLowerCase();
}

/**
 * الاسم العربي للدالة لمطابقة متطلبات بنية الكود العربي
 */
export const tanqihAlNassAlArabi = normalizeArabicText;

/**
 * واجهة الكائن القابل للبحث
 */
export interface SearchableProduct {
  name: string;
  nameEn?: string;
  description?: string;
}

/**
 * مطابقة منتج مع عبارة البحث بالاسم والوصف بعد تطبيق التنقيح العربي
 *
 * @param product المنتج المراد فحصه
 * @param query عبارة البحث المدخلة
 * @returns true في حال المطابقة، أو في حال كانت عبارة البحث فارغة
 */
export function matchesProductSearch(
  product: SearchableProduct,
  query: string
): boolean {
  const cleanQuery = normalizeArabicText(query);
  if (!cleanQuery) return true;

  const cleanName = normalizeArabicText(product.name || "");
  // يطابق سلوك واجهة /api/v1/products?search= التي تبحث في الاسم الإنجليزي أيضاً
  const cleanNameEn = normalizeArabicText(product.nameEn || "");
  const cleanDescription = normalizeArabicText(product.description || "");

  return (
    cleanName.includes(cleanQuery) ||
    cleanNameEn.includes(cleanQuery) ||
    cleanDescription.includes(cleanQuery)
  );
}
