import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'كاندي لوز | Candy Loz — حلويات شرقية وغربية فاخرة',
    short_name: 'كاندي لوز',
    description:
      'متجر حلويات كاندي لوز - تشكيلة راقية من البقلاوة والكنافة النابلسية والكيك والشوكولاتة البلجيكية الفاخرة',
    start_url: '/',
    display: 'standalone',
    dir: 'rtl',
    lang: 'ar',
    background_color: '#FAF6F3',
    theme_color: '#12382A',
    icons: [
      {
        src: '/logo/logo-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
