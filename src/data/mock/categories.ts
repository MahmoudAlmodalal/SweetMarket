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
    imageUrl: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=800&q=80',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'cat-cakes',
    slug: 'cakes-tarts',
    name: 'كيك وتورتات المناسبات',
    description: 'تورتات فخمة وكيك للمناسبات الخاصة بأجود خامات الشوكولاتة والكريمة الغنية',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'cat-kunafa',
    slug: 'kunafa-nabulsia',
    name: 'كنافة وحلويات نابلسية',
    description: 'الكنافة النابلسية الساخنة بالجبنة الأصلية والقشطة البلدية والقطر المعطر',
    imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'cat-chocolate',
    slug: 'chocolate-gifts',
    name: 'شوكولاتة وبوكسات هدايا',
    description: 'تشكيلات شوكولاتة بلجيكية وسويسرية معلبة في بوكسات أنيقة جاهزة للإهداء',
    imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80',
    displayOrder: 4,
    isActive: true,
  },
  {
    id: 'cat-petit-fours',
    slug: 'petit-fours-sable',
    name: 'بيتيفور وسابليه فاخر',
    description: 'بسكويت هش بالزبدة الفاخرة محشو بالمربى والشوكولاتة ومغطس بالمكسرات',
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
    displayOrder: 5,
    isActive: true,
  },
];
