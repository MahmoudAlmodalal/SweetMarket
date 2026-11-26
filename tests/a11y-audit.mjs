/**
 * فحص وصولية سريع وقابل للتكرار: يجول الصفحات الرئيسية ويتحقق من تسلسل
 * العناوين (h1 واحد بلا قفزات) عبر متصفح حقيقي.
 * التشغيل: شغّل الخادم ثم `node tests/a11y-audit.mjs` (أو BASE_URL=... node tests/a11y-audit.mjs)
 */
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://localhost:3000';
const pages = ['/', '/category/all', '/product/mixed-baklava-extra-pistachio', '/cart', '/track', '/contact', '/favorites', '/checkout', '/admin/login'];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
let total = 0;
for (const path of pages) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const result = await page.evaluate(() => {
    const issues = [];
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => +h.tagName[1]);
    for (let i = 1; i < headings.length; i++) {
      if (headings[i] > headings[i - 1] + 1) { issues.push(`skip h${headings[i-1]}->h${headings[i]}`); break; }
    }
    return { h1: document.querySelectorAll('h1').length, issues };
  });
  total += result.issues.length;
  console.log(`${path}: h1=${result.h1} issues=${result.issues.length}`, result.issues.join(';'));
}
console.log('TOTAL:', total);
await browser.close();
