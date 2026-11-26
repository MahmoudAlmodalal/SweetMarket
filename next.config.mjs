/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // منع تضمين المتجر ولوحة الإدارة داخل إطارات خارجية (clickjacking)
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // سياسة أمن المحتوى: تمنع الإضافات وخطف النماذج والتضمين الخارجي.
          // script-src غير مقيّد عن قصد: تقييده بنونس يتطلب توليداً ديناميكياً لكل الصفحات
          // (Next لا يطبّق النونس على الصفحات المولّدة مسبقاً)، وذلك قرار منفصل.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // يسمح بسكربتات Next المضمّنة (لا حماية XSS إضافية للسكربتات — يتطلب نونس + توليد ديناميكي)
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              // images.unsplash.com يطابق remotePatterns في next.config (صور مقترحة للوحة الإدارة)
              "img-src 'self' blob: data: https://images.unsplash.com",
              "font-src 'self'",
              "connect-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;
