import type { Order } from '@/types';

/**
 * الطلبات الافتراضية الأولية لمحاكاة دورة العمل والتتبع والإدارة
 * تغطي الحالات: new, accepted, in_preparation, out_for_delivery, delivered, cancelled
 */
export const MOCK_ORDERS: Order[] = [
  // 1. طلب جديد ينتظر مراجعة المتجر
  {
    id: 'ord-1001',
    orderNumber: 'CL-2026-1001',
    status: 'new',
    createdAt: '2026-10-31T12:30:00Z',
    updatedAt: '2026-10-31T12:30:00Z',
    customer: {
      fullName: 'أحمد محمود السقا',
      phone: '0599123456',
      zoneId: 'zone-gaza',
      streetAddress: 'شارع عمر المختار - بجوار بنك فلسطين',
      buildingOrApt: 'عمارة السقا - الطابق الثالث - شقة 6',
      notes: 'يرجى التوصيل ساخناً قبل صلاة العصر إن أمكن',
    },
    items: [
      {
        id: 'item-1001-1',
        productId: 'prod-baklava-mixed',
        productName: 'صينية مشكل بقلاوة إكسترا فستق',
        productSlug: 'mixed-baklava-extra-pistachio',
        imageUrl: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=800&q=80',
        unitPrice: 65,
        unit: 'kg',
        selectedWeightMultiplier: 1,
        selectedWeightLabel: 'كيلو كامل (1000 جم)',
        quantity: 1,
        lineTotal: 65,
      },
      {
        id: 'item-1001-2',
        productId: 'prod-kunafa-nabulsia',
        productName: 'كنافة نابلسية خشنة بالجبنة البلدية',
        productSlug: 'nabulsia-rough-kunafa-cheese',
        imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
        unitPrice: 25,
        unit: 'kg',
        selectedWeightMultiplier: 0.5,
        selectedWeightLabel: 'صحن صغير (نصف كيلو)',
        quantity: 2,
        lineTotal: 50,
      },
    ],
    subtotal: 115,
    deliveryFee: 10,
    total: 125,
    paymentMethod: 'cash_on_delivery',
    timeline: [
      {
        status: 'new',
        timestamp: '2026-10-31T12:30:00Z',
        note: 'تم استلام الطلب من الزبون بنجاح كطلب كاش عند الاستلام',
      },
    ],
  },

  // 2. طلب تم قبوله وجاري تنسيق تحضيره
  {
    id: 'ord-1002',
    orderNumber: 'CL-2026-1002',
    status: 'accepted',
    createdAt: '2026-10-31T11:45:00Z',
    updatedAt: '2026-10-31T11:55:00Z',
    customer: {
      fullName: 'ريم كمال الأغا',
      phone: '0568987654',
      zoneId: 'zone-khan-younis',
      streetAddress: 'خان يونس - شارع جلال - بالقرب من مفترق القلعة',
      buildingOrApt: 'منزل عائلة الأغا',
      notes: 'تغليف خاص بمناسبة نجاح جامعي',
    },
    items: [
      {
        id: 'item-1002-1',
        productId: 'prod-cake-fudge',
        productName: 'تورتة فادج شوكولاتة بلجيكية',
        productSlug: 'belgian-fudge-chocolate-cake',
        imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
        unitPrice: 85,
        unit: 'piece',
        quantity: 1,
        lineTotal: 85,
      },
      {
        id: 'item-1002-2',
        productId: 'prod-chocolate-royal-box',
        productName: 'صندوق هدايا كاندي لوز الملكي',
        productSlug: 'royal-candy-loz-gift-box',
        imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80',
        unitPrice: 105,
        unit: 'box',
        quantity: 1,
        lineTotal: 105,
      },
    ],
    subtotal: 190,
    deliveryFee: 15,
    total: 205,
    paymentMethod: 'cash_on_delivery',
    timeline: [
      {
        status: 'new',
        timestamp: '2026-10-31T11:45:00Z',
        note: 'تم إنشاء الطلب',
      },
      {
        status: 'accepted',
        timestamp: '2026-10-31T11:55:00Z',
        note: 'تم مراجعة الطلب والموافقة عليه وتحويله لخط الإنتاج',
        performedBy: {
          id: 'user-staff-01',
          name: 'نور أحمد',
          role: 'staff',
        },
      },
    ],
  },

  // 3. طلب قيد التجهيز داخل المطبخ
  {
    id: 'ord-1003',
    orderNumber: 'CL-2026-1003',
    status: 'in_preparation',
    createdAt: '2026-10-31T11:00:00Z',
    updatedAt: '2026-10-31T11:20:00Z',
    customer: {
      fullName: 'خالد يوسف صيام',
      phone: '0592345678',
      zoneId: 'zone-gaza',
      streetAddress: 'حي الرمال الجنوبي - شارع الشهداء - مقابل حديقة الجندي المجهول',
      buildingOrApt: 'برج الأندلس - الطابق الثاني',
      notes: 'زيادة قطر على الكنافة لو سمحتم',
    },
    items: [
      {
        id: 'item-1003-1',
        productId: 'prod-kunafa-nabulsia',
        productName: 'كنافة نابلسية خشنة بالجبنة البلدية',
        productSlug: 'nabulsia-rough-kunafa-cheese',
        imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
        unitPrice: 45,
        unit: 'kg',
        selectedWeightMultiplier: 1,
        selectedWeightLabel: 'سدر وسط (كيلو)',
        quantity: 1,
        lineTotal: 45,
      },
      {
        id: 'item-1003-2',
        productId: 'prod-baklava-mabrouma',
        productName: 'مبرومة بالفستق الحلبي الملكي',
        productSlug: 'royal-pistachio-mabrouma',
        imageUrl: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=800&q=80',
        unitPrice: 45,
        unit: 'kg',
        selectedWeightMultiplier: 0.5,
        selectedWeightLabel: 'نصف كيلو (500 جم)',
        quantity: 1,
        lineTotal: 45,
      },
    ],
    subtotal: 90,
    deliveryFee: 10,
    total: 100,
    paymentMethod: 'cash_on_delivery',
    timeline: [
      {
        status: 'new',
        timestamp: '2026-10-31T11:00:00Z',
        note: 'تم استلام الطلب',
      },
      {
        status: 'accepted',
        timestamp: '2026-10-31T11:10:00Z',
        note: 'تم قبول الطلب',
        performedBy: {
          id: 'user-staff-01',
          name: 'نور أحمد',
          role: 'staff',
        },
      },
      {
        status: 'in_preparation',
        timestamp: '2026-10-31T11:20:00Z',
        note: 'جاري تسخين وتحضير الصواني وتجهيز علبة التغليف الفاخرة',
        performedBy: {
          id: 'user-staff-01',
          name: 'نور أحمد',
          role: 'staff',
        },
      },
    ],
  },

  // 4. طلب خرج للتوصيل مع السائق
  {
    id: 'ord-1004',
    orderNumber: 'CL-2026-1004',
    status: 'out_for_delivery',
    createdAt: '2026-10-31T10:15:00Z',
    updatedAt: '2026-10-31T11:30:00Z',
    customer: {
      fullName: 'ميساء فؤاد عاشور',
      phone: '0597112233',
      zoneId: 'zone-middle',
      streetAddress: 'دير البلح - شارع النخيل - بالقرب من المستشفى',
      buildingOrApt: 'فيلا عاشور',
    },
    items: [
      {
        id: 'item-1004-1',
        productId: 'prod-cake-berry',
        productName: 'تشيز كيك التوت البري (بيري لوز)',
        productSlug: 'candy-loz-berry-cheesecake',
        imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
        unitPrice: 80,
        unit: 'piece',
        quantity: 1,
        lineTotal: 80,
      },
    ],
    subtotal: 80,
    deliveryFee: 12,
    total: 92,
    paymentMethod: 'cash_on_delivery',
    timeline: [
      {
        status: 'new',
        timestamp: '2026-10-31T10:15:00Z',
      },
      {
        status: 'accepted',
        timestamp: '2026-10-31T10:25:00Z',
        performedBy: {
          id: 'user-staff-01',
          name: 'نور أحمد',
          role: 'staff',
        },
      },
      {
        status: 'in_preparation',
        timestamp: '2026-10-31T10:45:00Z',
        performedBy: {
          id: 'user-staff-01',
          name: 'نور أحمد',
          role: 'staff',
        },
      },
      {
        status: 'out_for_delivery',
        timestamp: '2026-10-31T11:30:00Z',
        note: 'تم تسليم الطلب لكابتن التوصيل وفي طريقه لعنوان الزبون',
        performedBy: {
          id: 'user-staff-01',
          name: 'نور أحمد',
          role: 'staff',
        },
      },
    ],
  },

  // 5. طلب مكتمل وتم تسليمه بنجاح
  {
    id: 'ord-1005',
    orderNumber: 'CL-2026-1005',
    status: 'delivered',
    createdAt: '2026-10-30T16:00:00Z',
    updatedAt: '2026-10-30T17:40:00Z',
    customer: {
      fullName: 'بلال نبيل حسونة',
      phone: '0569445566',
      zoneId: 'zone-gaza',
      streetAddress: 'غزة - شارع الجلاء - عمارة الوطن',
      buildingOrApt: 'شقة 12',
    },
    items: [
      {
        id: 'item-1005-1',
        productId: 'prod-petit-fours-mix',
        productName: 'مشكل بيتيفور زبدة وسابليه شوكولاتة',
        productSlug: 'butter-petit-fours-sable-mix',
        imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
        unitPrice: 55,
        unit: 'kg',
        selectedWeightMultiplier: 1,
        selectedWeightLabel: 'علبة كيلو كامل (1000 جم)',
        quantity: 1,
        lineTotal: 55,
      },
    ],
    subtotal: 55,
    deliveryFee: 10,
    total: 65,
    paymentMethod: 'cash_on_delivery',
    timeline: [
      {
        status: 'new',
        timestamp: '2026-10-30T16:00:00Z',
      },
      {
        status: 'accepted',
        timestamp: '2026-10-30T16:15:00Z',
      },
      {
        status: 'in_preparation',
        timestamp: '2026-10-30T16:30:00Z',
      },
      {
        status: 'out_for_delivery',
        timestamp: '2026-10-30T17:05:00Z',
      },
      {
        status: 'delivered',
        timestamp: '2026-10-30T17:40:00Z',
        note: 'تم تسليم الطلب للزبون باليد واستلام مبلغ 65 شيكل نقداً',
        performedBy: {
          id: 'user-staff-01',
          name: 'نور أحمد',
          role: 'staff',
        },
      },
    ],
  },

  // 6. طلب ملغي بواسطة الإدارة لسبب محدد
  {
    id: 'ord-1006',
    orderNumber: 'CL-2026-1006',
    status: 'cancelled',
    createdAt: '2026-10-30T14:10:00Z',
    updatedAt: '2026-10-30T14:40:00Z',
    customer: {
      fullName: 'محمود عبد الرحيم عودة',
      phone: '0598776655',
      zoneId: 'zone-north',
      streetAddress: 'جباليا النزلة - بجوار المسجد العمري',
      notes: 'إلغاء الطلب بناء على رغبة الزبون',
    },
    items: [
      {
        id: 'item-1006-1',
        productId: 'prod-baklava-fingers',
        productName: 'أصابع بقلاوة مقرمشة بالكاجو',
        productSlug: 'cashew-baklava-fingers',
        imageUrl: 'https://images.unsplash.com/photo-1597692493630-f2228dca617c?auto=format&fit=crop&w=800&q=80',
        unitPrice: 50,
        unit: 'kg',
        selectedWeightMultiplier: 1,
        selectedWeightLabel: 'كيلو كامل (1000 جم)',
        quantity: 1,
        lineTotal: 50,
      },
    ],
    subtotal: 50,
    deliveryFee: 15,
    total: 65,
    paymentMethod: 'cash_on_delivery',
    cancelReason: 'اعتذر الزبون هاتفياً لعدم تواجده في المنزل وقت التوصيل وطلب إلغاء الطلب',
    timeline: [
      {
        status: 'new',
        timestamp: '2026-10-30T14:10:00Z',
      },
      {
        status: 'cancelled',
        timestamp: '2026-10-30T14:40:00Z',
        note: 'تم إلغاء الطلب: اعتذر الزبون هاتفياً لعدم تواجده في المنزل وقت التوصيل وطلب إلغاء الطلب',
        performedBy: {
          id: 'user-manager-01',
          name: 'طارق رضوان',
          role: 'manager',
        },
      },
    ],
  },
];
