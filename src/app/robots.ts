import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL && /^https?:\/\//i.test(process.env.NEXT_PUBLIC_APP_URL)
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '')
      : 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/category/', '/product/', '/contact', '/track'],
        disallow: ['/admin/', '/dev/', '/api/', '/cart', '/checkout', '/account'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
