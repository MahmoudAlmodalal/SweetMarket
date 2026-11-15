import type { Category } from '@/types';

/**
 * التصنيفات المعتمدة لمتجر كاندي لوز
 * مطابقة لتصاميم Stitch وشاشات SCR-01 و SCR-02
 */
export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-baklava',
    slug: 'baklava-eastern',
    name: 'البقلاوة والحلويات الشرقية',
    description: 'أفخر أصناف البقلاوة المورقة بالسمن البلدي والفستق الحلبي والكاجو الفاخر',
    imageUrl: '/categories/baklava-eastern.svg',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'cat-cakes',
    slug: 'cakes-tarts',
    name: 'كيك وتورتات المناسبات',
    description: 'تورتات فخمة وكيك للمناسبات الخاصة بأجود خامات الشوكولاتة والكريمة الغنية',
    imageUrl: '/categories/cakes-tarts.svg',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'cat-kunafa',
    slug: 'kunafa-nabulsia',
    name: 'كنافة وحلويات نابلسية',
    description: 'الكنافة النابلسية الساخنة بالجبنة الأصلية والقشطة البلدية والقطر المعطر',
    imageUrl: '/categories/kunafa-nabulsia.svg',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'cat-chocolate',
    slug: 'chocolate-gifts',
    name: 'شوكولاتة وبوكسات هدايا',
    description: 'تشكيلات شوكولاتة بلجيكية وسويسرية معلبة في بوكسات أنيقة جاهزة للإهداء',
    imageUrl: '/categories/chocolate-gifts.svg',
    displayOrder: 4,
    isActive: true,
  },
  {
    id: 'cat-petit-fours',
    slug: 'petit-fours-sable',
    name: 'بيتيفور وسابليه فاخر',
    description: 'بسكويت هش بالزبدة الفاخرة محشو بالمربى والشوكولاتة ومغطس بالمكسرات',
    imageUrl: '/categories/petit-fours-sable.svg',
    displayOrder: 5,
    isActive: true,
  },
];
