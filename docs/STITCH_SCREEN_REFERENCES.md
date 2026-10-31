# Stitch Screen References: Candy Loz E-Commerce Mobile

**Project Name:** `Candy Loz E-Commerce Mobile`  
**Project ID:** `projects/2139790167707204435`  
**Device Target:** Mobile / Responsive  
**Origin:** STITCH  

---

## Screen Inventory & Asset References

| # | Screen / Asset Title | Screen Identifier / Resource Name | Viewport / Canvas | Visibility | Links & Downloads |
|---|---|---|---|---|---|
| 1 | **الرئيسية - كاندي لوز** (Home) | `projects/2139790167707204435/screens/1b23fd77d1684f05831fd30e6115ed1b` | 390x1796 (Rendered: 780x3636) | Active | • [HTML Source](https://stitch.googleapis.com/v1/projects/2139790167707204435/files/1b23fd77d1684f05831fd30e6115ed1b:download)<br>• [Screenshot PNG](https://stitch.googleapis.com/v1/projects/2139790167707204435/files/screenshot_00065ed192c5cad5044f672e12132adc:download) |
| 2 | **قائمة التصنيف - البقلاوة والحلويات الشرقية** (Baklava & Eastern Sweets Category) | `projects/2139790167707204435/screens/1d51a1cbd63c46299076728dfeaff20c` | 390x2007 (Rendered: 780x4066) | Active | • [HTML Source](https://stitch.googleapis.com/v1/projects/2139790167707204435/files/1d51a1cbd63c46299076728dfeaff20c:download)<br>• [Screenshot PNG](https://stitch.googleapis.com/v1/projects/2139790167707204435/files/screenshot_00065ef97e8237f5023bee61ed1107c5:download) |
| 3 | **قائمة التصنيف - كيك وتورتات** (Cakes & Tarts Category) | `projects/2139790167707204435/screens/44c6a237b6784cf99295b853ed6389c7` | 390x1765 (Rendered: 780x3530) | Hidden / Variant | • [HTML Source](https://stitch.googleapis.com/v1/projects/2139790167707204435/files/44c6a237b6784cf99295b853ed6389c7:download)<br>• [Screenshot PNG](https://stitch.googleapis.com/v1/projects/2139790167707204435/files/screenshot_00065ed1b9bf828a044f672e12132adc:download) |
| 4 | **تفاصيل المنتج - صينية مشكل بقلاوة إكسترا فستق** (Product Detail - Mixed Baklava) | `projects/2139790167707204435/screens/3fdd24d1988546b1a0bd97969ea3d51f` | 390x2882 (Rendered: 780x5764) | Active | • [HTML Source](https://stitch.googleapis.com/v1/projects/2139790167707204435/files/3fdd24d1988546b1a0bd97969ea3d51f:download)<br>• [Screenshot PNG](https://stitch.googleapis.com/v1/projects/2139790167707204435/files/screenshot_00065ef9a2b8a6c4023bee6ffe0d376f:download) |
| 5 | **سلة المشتريات - كاندي لوز** (Shopping Cart) | `projects/2139790167707204435/screens/34bc34a158334298ba044a7e5428ab37` | 390x1698 (Rendered: 780x3396) | Active | • [HTML Source](https://stitch.googleapis.com/v1/projects/2139790167707204435/files/10237781555125460745:download)<br>• [Screenshot JPEG](https://stitch.googleapis.com/v1/projects/2139790167707204435/files/4483860252787066853:download) |
| 6 | **إتمام الطلب والدفع - كاندي لوز** (Checkout & Payment) | `projects/2139790167707204435/screens/a3b0c210a5a04aa392e3c42a476043da` | 390x2553 (Rendered: 780x5106) | Active | • [HTML Source](https://stitch.googleapis.com/v1/projects/2139790167707204435/files/8701942080610916712:download)<br>• [Screenshot JPEG](https://stitch.googleapis.com/v1/projects/2139790167707204435/files/1460135101909625241:download) |
| 7 | **تتبع الطلب والنجاح - كاندي لوز** (Order Tracking & Success) | `projects/2139790167707204435/screens/40a46ae67e034043824cf64cfc7b4a4c` | 390x2133 (Rendered: 780x4266) | Active | • [HTML Source](https://stitch.googleapis.com/v1/projects/2139790167707204435/files/40a46ae67e034043824cf64cfc7b4a4c:download)<br>• [Screenshot PNG](https://stitch.googleapis.com/v1/projects/2139790167707204435/files/screenshot_00065ef9c474246b023bee61ed1107c5:download) |
| 8 | **Design System Asset Instance** | `assets/72bdf89f5e63450e92e69616acee5c14` | 960x540 | Embedded System | Instance ID: `assets_72bdf89f5e63450e92e69616acee5c14` |

---

## Inaccessible & Unreachable Properties Report

1. **Authentication Tokens & CDN Expiry:**
   - The `downloadUrl` endpoints (`stitch.googleapis.com/v1/...`) rely on active session / IAM bearer tokens. Direct unauthenticated curl/browser access without the appropriate OAuth token returns 401/403.
2. **Hidden Screen Listing Discrepancy:**
   - Screen `44c6a237b6784cf99295b853ed6389c7` ("قائمة التصنيف - كيك وتورتات") is marked `"hidden": true` in the canvas instances hierarchy, causing it to be omitted from the standard `list_screens` RPC output unless addressed explicitly via `get_screen`.
3. **Internal Raw Figma / Vector Node Hierarchy:**
   - Stitch provides rendered HTML/CSS and composite PNG/JPEG screenshots. Underlying Figma vectors, layer constraints, and vector paths remain encapsulated within Stitch's internal synthesis engine.
