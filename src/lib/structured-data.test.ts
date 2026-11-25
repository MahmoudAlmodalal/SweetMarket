import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  getBaseUrl,
  effectivePrice,
  getProductJsonLd,
  jsonLdScriptContent,
} from "@/lib/structured-data";
import type { Product } from "@/types";

const sampleProduct: Product = {
  id: "prod-1",
  slug: "mixed-baklava",
  name: "صينية مشكل بقلاوة",
  description: "تشكيلة بقلاوة فاخرة",
  categoryId: "cat-1",
  price: 65,
  salePrice: 59,
  unit: "kg",
  imageUrl: "/images/catalog/baklava.jpg",
  galleryImages: ["/images/catalog/baklava-2.jpg"],
  isAvailable: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("getBaseUrl", () => {
  it("falls back to localhost when the env var is missing or invalid", () => {
    const original = process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    assert.equal(getBaseUrl(), "http://localhost:3000");
    process.env.NEXT_PUBLIC_APP_URL = "not-a-url";
    assert.equal(getBaseUrl(), "http://localhost:3000");
    if (original === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it("uses the configured URL and strips trailing slashes", () => {
    const original = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://candyloz.example/";
    assert.equal(getBaseUrl(), "https://candyloz.example");
    if (original === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = original;
  });
});

describe("effectivePrice", () => {
  it("prefers a positive sale price below the list price", () => {
    assert.equal(effectivePrice({ price: 65, salePrice: 59 }), 59);
  });

  it("ignores missing, zero, or non-discounted sale prices", () => {
    assert.equal(effectivePrice({ price: 65 }), 65);
    assert.equal(effectivePrice({ price: 65, salePrice: 0 }), 65);
    assert.equal(effectivePrice({ price: 65, salePrice: 70 }), 65);
  });
});

describe("getProductJsonLd", () => {
  it("builds a schema.org Product with absolute URLs and ILS offer", () => {
    const ld = getProductJsonLd(sampleProduct, { id: "cat-1", slug: "baklava", name: "بقلاوة", imageUrl: "/images/cat.jpg", displayOrder: 1, isActive: true }, "https://candyloz.example");
    assert.equal(ld["@type"], "Product");
    assert.equal(ld.name, sampleProduct.name);
    assert.equal(ld.category, "بقلاوة");
    assert.equal(ld.url, "https://candyloz.example/product/mixed-baklava");
    assert.deepEqual(ld.image, [
      "https://candyloz.example/images/catalog/baklava.jpg",
      "https://candyloz.example/images/catalog/baklava-2.jpg",
    ]);
    assert.equal(ld.offers.price, "59.00");
    assert.equal(ld.offers.priceCurrency, "ILS");
    assert.equal(ld.offers.availability, "https://schema.org/InStock");
  });

  it("marks unavailable products as OutOfStock and omits category when absent", () => {
    const ld = getProductJsonLd({ ...sampleProduct, isAvailable: false }, null, "https://candyloz.example");
    assert.equal(ld.offers.availability, "https://schema.org/OutOfStock");
    assert.equal("category" in ld, false);
  });
});

describe("jsonLdScriptContent", () => {
  it("escapes angle brackets so embedded text cannot break the script tag", () => {
    const content = jsonLdScriptContent({ name: "a</script><script>b" });
    assert.equal(content.includes("</script>"), false);
    assert.equal(JSON.parse(content).name, "a</script><script>b");
  });
});
