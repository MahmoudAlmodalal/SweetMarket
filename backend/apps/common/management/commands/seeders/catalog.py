"""
T-54: Catalog Categories, 15 Sweets Products & Weight Options Seeder
Seeds initial catalog data for Candy Loz: 5 Categories, 15 Products, and Weight Options.
"""

from decimal import Decimal
from typing import Any, Dict, List, TypedDict
from django.db import transaction


class CatalogSeedCounts(TypedDict):
    categories_created: int
    categories_updated: int
    categories_skipped: int
    categories: int
    products_created: int
    products_updated: int
    products_skipped: int
    products: int
    weight_options_created: int
    weight_options_updated: int
    weight_options_skipped: int
    weight_options: int


CATEGORIES_DATA: List[Dict[str, Any]] = [
    {
        "id": "cat-baklava",
        "slug": "baklava-eastern",
        "name": "البقلاوة والحلويات الشرقية",
        "description": "أفخر أصناف البقلاوة المورقة بالسمن البلدي والفستق الحلبي والكاجو الفاخر",
        "image_url": "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=800&q=80",
        "display_order": 1,
        "is_active": True,
    },
    {
        "id": "cat-cakes",
        "slug": "cakes-tarts",
        "name": "كيك وتورتات المناسبات",
        "description": "تورتات فخمة وكيك للمناسبات الخاصة بأجود خامات الشوكولاتة والكريمة الغنية",
        "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
        "display_order": 2,
        "is_active": True,
    },
    {
        "id": "cat-kunafa",
        "slug": "kunafa-nabulsia",
        "name": "كنافة وحلويات نابلسية",
        "description": "الكنافة النابلسية الساخنة بالجبنة الأصلية والقشطة البلدية والقطر المعطر",
        "image_url": "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80",
        "display_order": 3,
        "is_active": True,
    },
    {
        "id": "cat-chocolate",
        "slug": "chocolate-gifts",
        "name": "شوكولاتة وبوكسات هدايا",
        "description": "تشكيلات شوكولاتة بلجيكية وسويسرية معلبة في بوكسات أنيقة جاهزة للإهداء",
        "image_url": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80",
        "display_order": 4,
        "is_active": True,
    },
    {
        "id": "cat-petit-fours",
        "slug": "petit-fours-sable",
        "name": "بيتيفور ومعمول فاخر",
        "description": "بسكويت هش بالزبدة الفاخرة ومعمول بالتمر والمكسرات محشو ومغطس بأجود المكونات",
        "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
        "display_order": 5,
        "is_active": True,
    },
]


PRODUCTS_DATA: List[Dict[str, Any]] = [
    # --- 1. البقلاوة والحلويات الشرقية (cat-baklava) ---
    {
        "id": "prod-baklava-mixed",
        "slug": "mixed-baklava-extra-pistachio",
        "name": "صينية مشكل بقلاوة إكسترا فستق",
        "name_en": "Mixed Baklava Extra Pistachio Tray",
        "description": "تشكيلة ملكية فاخرة من أصابع البقلاوة والوربات والكولاج المحشوة بالفستق الحلبي الإكسترا ومورقة بالسمن البلدي الصافي المعطر بماء الزهر.",
        "category_slug": "baklava-eastern",
        "price": Decimal("65.00"),
        "sale_price": Decimal("59.00"),
        "unit": "kg",
        "image_url": "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=800&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1597692493630-f2228dca617c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
        ],
        "is_available": True,
        "is_featured": True,
        "weight_options": [
            {"label": "نصف كيلو (500 جم)", "multiplier": Decimal("0.50"), "price": Decimal("35.00"), "display_order": 1},
            {"label": "كيلو كامل (1000 جم)", "multiplier": Decimal("1.00"), "price": Decimal("65.00"), "display_order": 2},
            {"label": "صينية عائلية (2 كجم)", "multiplier": Decimal("2.00"), "price": Decimal("125.00"), "display_order": 3},
        ],
    },
    {
        "id": "prod-baklava-fingers",
        "slug": "cashew-baklava-fingers",
        "name": "أصابع بقلاوة مقرمشة بالكاجو",
        "name_en": "Crispy Cashew Baklava Fingers",
        "description": "أصابع جلاش ذهبية مقرمشة محشوة بحبات الكاجو المحمص والقطر الخفيف المتوازن، خفيفة ومناسبة للضيافة.",
        "category_slug": "baklava-eastern",
        "price": Decimal("50.00"),
        "sale_price": None,
        "unit": "kg",
        "image_url": "https://images.unsplash.com/photo-1597692493630-f2228dca617c?auto=format&fit=crop&w=800&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1597692493630-f2228dca617c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=800&q=80",
        ],
        "is_available": True,
        "is_featured": False,
        "weight_options": [
            {"label": "نصف كيلو (500 جم)", "multiplier": Decimal("0.50"), "price": Decimal("28.00"), "display_order": 1},
            {"label": "كيلو كامل (1000 جم)", "multiplier": Decimal("1.00"), "price": Decimal("50.00"), "display_order": 2},
        ],
    },
    {
        "id": "prod-baklava-mabrouma",
        "slug": "royal-pistachio-mabrouma",
        "name": "مبرومة بالفستق الحلبي الملكي",
        "name_en": "Royal Pistachio Mabrouma",
        "description": "شعيرية كنافة ناعمة مبرومة بعناية ومحشوة بكثافة بأفخر حبات الفستق الحلبي الأخضر المحمص ومحلاة بقطر العسل.",
        "category_slug": "baklava-eastern",
        "price": Decimal("85.00"),
        "sale_price": None,
        "unit": "kg",
        "image_url": "https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=800&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=800&q=80",
        ],
        "is_available": True,
        "is_featured": True,
        "weight_options": [
            {"label": "نصف كيلو (500 جم)", "multiplier": Decimal("0.50"), "price": Decimal("45.00"), "display_order": 1},
            {"label": "كيلو كامل (1000 جم)", "multiplier": Decimal("1.00"), "price": Decimal("85.00"), "display_order": 2},
            {"label": "صينية فاخرة (2 كجم)", "multiplier": Decimal("2.00"), "price": Decimal("165.00"), "display_order": 3},
        ],
    },

    # --- 2. كيك وتورتات المناسبات (cat-cakes) ---
    {
        "id": "prod-cake-fudge",
        "slug": "belgian-fudge-chocolate-cake",
        "name": "تورتة فادج شوكولاتة بلجيكية",
        "name_en": "Belgian Chocolate Fudge Cake",
        "description": "طبقات كيك الشوكولاتة الداكنة الرطبة محشوة بجناش الشوكولاتة البلجيكية 70% الغنية ومغطاة برقائق البندق المقرمش.",
        "category_slug": "cakes-tarts",
        "price": Decimal("95.00"),
        "sale_price": Decimal("85.00"),
        "unit": "piece",
        "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=800&q=80",
        ],
        "is_available": True,
        "is_featured": True,
        "weight_options": [
            {"label": "حجم وسط (6-8 أفراد)", "multiplier": Decimal("1.00"), "price": Decimal("95.00"), "display_order": 1},
            {"label": "حجم كبير (10-12 فرد)", "multiplier": Decimal("1.50"), "price": Decimal("140.00"), "display_order": 2},
        ],
    },
    {
        "id": "prod-cake-berry",
        "slug": "candy-loz-berry-cheesecake",
        "name": "تشيز كيك التوت البري (بيري لوز)",
        "name_en": "Candy Loz Berry Cheesecake",
        "description": "تشيز كيك مخبوز بالفرن على الطريقة الأمريكية بقاعدة بسكويت دايجستف الزبدية، مغطى بصوص التوت البري الطازج والفراولة.",
        "category_slug": "cakes-tarts",
        "price": Decimal("80.00"),
        "sale_price": None,
        "unit": "piece",
        "image_url": "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80",
        ],
        "is_available": True,
        "is_featured": True,
        "weight_options": [
            {"label": "قطعة فردية", "multiplier": Decimal("0.25"), "price": Decimal("22.00"), "display_order": 1},
            {"label": "قالب كامل (8 قطع)", "multiplier": Decimal("1.00"), "price": Decimal("80.00"), "display_order": 2},
        ],
    },
    {
        "id": "prod-cake-red-velvet",
        "slug": "classic-red-velvet-cake",
        "name": "كيك ريد فيلفيت كلاسيك بالجبنة الكريمة",
        "name_en": "Classic Red Velvet Cake",
        "description": "كيكة المخمل الأحمر الكلاسيكية بطبقات ناعمة ومفروكة ومغطاة بكريمة الجبن اللذيذة ورشة من فتات الكيك المخملي.",
        "category_slug": "cakes-tarts",
        "price": Decimal("75.00"),
        "sale_price": None,
        "unit": "piece",
        "image_url": "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=800&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=800&q=80",
        ],
        "is_available": False,  # منتج غير متوفر لاختبار حالات نفاد المخزون
        "is_featured": False,
        "weight_options": [
            {"label": "حجم وسط (6 أفراد)", "multiplier": Decimal("1.00"), "price": Decimal("75.00"), "display_order": 1},
            {"label": "حجم عائلي (10 أفراد)", "multiplier": Decimal("1.50"), "price": Decimal("110.00"), "display_order": 2},
        ],
    },

    # --- 3. كنافة وحلويات نابلسية (cat-kunafa) ---
    {
        "id": "prod-kunafa-nabulsia",
        "slug": "nabulsia-rough-kunafa-cheese",
        "name": "كنافة نابلسية خشنة بالجبنة البلدية",
        "name_en": "Rough Nabulsia Kunafa with Sweet Cheese",
        "description": "كنافة نابلسية خشنة باللون الذهبي المحمر محشوة بالجبنة الحلوة الممطوطة على أصولها، تسقى بالقطر الساخن وترش بالفستق.",
        "category_slug": "kunafa-nabulsia",
        "price": Decimal("45.00"),
        "sale_price": None,
        "unit": "kg",
        "image_url": "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80",
        ],
        "is_available": True,
        "is_featured": True,
        "weight_options": [
            {"label": "صحن صغير (نصف كيلو)", "multiplier": Decimal("0.50"), "price": Decimal("25.00"), "display_order": 1},
            {"label": "سدر وسط (كيلو)", "multiplier": Decimal("1.00"), "price": Decimal("45.00"), "display_order": 2},
            {"label": "سدر عائلي (2 كجم)", "multiplier": Decimal("2.00"), "price": Decimal("85.00"), "display_order": 3},
        ],
    },
    {
        "id": "prod-kunafa-cream",
        "slug": "bain-nareen-cream-kunafa",
        "name": "كنافة بين نارين بالقشطة والمكسرات",
        "name_en": "Bain Nareen Cream Kunafa with Nuts",
        "description": "طبقتان مقرمشتان من شعيرية الكنافة الذهبية تحضنان طبقة سميكة من القشطة البلدية الطازجة وتتوجان باللوز والفستق الحلبي.",
        "category_slug": "kunafa-nabulsia",
        "price": Decimal("40.00"),
        "sale_price": None,
        "unit": "kg",
        "image_url": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80",
        ],
        "is_available": True,
        "is_featured": False,
        "weight_options": [
            {"label": "نصف كيلو (500 جم)", "multiplier": Decimal("0.50"), "price": Decimal("22.00"), "display_order": 1},
            {"label": "كيلو كامل (1000 جم)", "multiplier": Decimal("1.00"), "price": Decimal("40.00"), "display_order": 2},
            {"label": "سدر ضيافة (2 كجم)", "multiplier": Decimal("2.00"), "price": Decimal("75.00"), "display_order": 3},
        ],
    },
    {
        "id": "prod-kunafa-soft",
        "slug": "soft-nabulsia-kunafa-cheese",
        "name": "كنافة نابلسية ناعمة بالجبنة والقطر",
        "name_en": "Soft Nabulsia Kunafa with Cheese",
        "description": "كنافة ناعمة محضرة من فرك الكنافة الطري بالسمن البلدي محشوة بالجبنة النابلسية الساخنة وتزين برشة فستق حلبي فاخر.",
        "category_slug": "kunafa-nabulsia",
        "price": Decimal("45.00"),
        "sale_price": Decimal("39.00"),
        "unit": "kg",
        "image_url": "https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=800&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=800&q=80",
        ],
        "is_available": True,
        "is_featured": True,
        "weight_options": [
            {"label": "نصف كيلو (500 جم)", "multiplier": Decimal("0.50"), "price": Decimal("24.00"), "display_order": 1},
            {"label": "سدر كيلو (1000 جم)", "multiplier": Decimal("1.00"), "price": Decimal("45.00"), "display_order": 2},
            {"label": "سدر مناسبات (2.5 كجم)", "multiplier": Decimal("2.50"), "price": Decimal("100.00"), "display_order": 3},
        ],
    },

    # --- 4. شوكولاتة وبوكسات هدايا (cat-chocolate) ---
    {
        "id": "prod-chocolate-royal-box",
        "slug": "royal-candy-loz-gift-box",
        "name": "صندوق هدايا كاندي لوز الملكي",
        "name_en": "Royal Candy Loz Gift Box",
        "description": "صندوق مخملي توتي فاخر يحتوي على 36 قطعة من الشوكولاتة البلجيكية والترافل المحشو بنكهات الكراميل المملح، الفستق، والبندق.",
        "category_slug": "chocolate-gifts",
        "price": Decimal("120.00"),
        "sale_price": Decimal("105.00"),
        "unit": "box",
        "image_url": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?auto=format&fit=crop&w=800&q=80",
        ],
        "is_available": True,
        "is_featured": True,
        "weight_options": [
            {"label": "بوكس صغير (18 قطعة)", "multiplier": Decimal("0.50"), "price": Decimal("65.00"), "display_order": 1},
            {"label": "بوكس ملكي كامل (36 قطعة)", "multiplier": Decimal("1.00"), "price": Decimal("120.00"), "display_order": 2},
            {"label": "بوكس VIP فاخر (50 قطعة)", "multiplier": Decimal("1.50"), "price": Decimal("175.00"), "display_order": 3},
        ],
    },
    {
        "id": "prod-chocolate-praline",
        "slug": "mixed-praline-chocolate-box",
        "name": "علبة شوكولاتة برالين مشكلة",
        "name_en": "Assorted Praline Chocolate Box",
        "description": "تشكيلة راقية من قطع الشوكولاتة بالحليب والشوكولاتة البيضاء مع حشوات الكريمة المقرمشة والبرالين الفرنسي.",
        "category_slug": "chocolate-gifts",
        "price": Decimal("65.00"),
        "sale_price": None,
        "unit": "box",
        "image_url": "https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?auto=format&fit=crop&w=800&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?auto=format&fit=crop&w=800&q=80",
        ],
        "is_available": True,
        "is_featured": False,
        "weight_options": [
            {"label": "علبة عادية (250 جم)", "multiplier": Decimal("0.50"), "price": Decimal("35.00"), "display_order": 1},
            {"label": "علبة دبل (500 جم)", "multiplier": Decimal("1.00"), "price": Decimal("65.00"), "display_order": 2},
        ],
    },
    {
        "id": "prod-chocolate-truffles",
        "slug": "dark-cocoa-truffles-box",
        "name": "بوكس ترافل الشوكولاتة الداكنة الفاخر",
        "name_en": "Luxury Dark Cocoa Truffles Box",
        "description": "كرات الترافل البلجيكي الفاخر المصنوعة يدوياً من الشوكولاتة الداكنة ومغمورة في بودرة الكاكاو الهولندي النقي.",
        "category_slug": "chocolate-gifts",
        "price": Decimal("75.00"),
        "sale_price": None,
        "unit": "box",
        "image_url": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80",
        ],
        "is_available": True,
        "is_featured": False,
        "weight_options": [
            {"label": "علبة صغيرة (12 حبة)", "multiplier": Decimal("0.50"), "price": Decimal("40.00"), "display_order": 1},
            {"label": "علبة وسط (24 حبة)", "multiplier": Decimal("1.00"), "price": Decimal("75.00"), "display_order": 2},
        ],
    },

    # --- 5. بيتيفور ومعمول فاخر (cat-petit-fours) ---
    {
        "id": "prod-petit-fours-mix",
        "slug": "butter-petit-fours-sable-mix",
        "name": "مشكل بيتيفور زبدة وسابليه شوكولاتة",
        "name_en": "Butter Petit Fours & Chocolate Sablé Mix",
        "description": "تشكيلة ناعمة تذوب بالفم من بسكويت البيتيفور بالزبدة الطبيعية وسابليه الشوكولاتة محشوة بمربى المشمش وجناش الشوكولاتة.",
        "category_slug": "petit-fours-sable",
        "price": Decimal("55.00"),
        "sale_price": None,
        "unit": "kg",
        "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
        ],
        "is_available": True,
        "is_featured": True,
        "weight_options": [
            {"label": "علبة نصف كيلو (500 جم)", "multiplier": Decimal("0.50"), "price": Decimal("30.00"), "display_order": 1},
            {"label": "علبة كيلو كامل (1000 جم)", "multiplier": Decimal("1.00"), "price": Decimal("55.00"), "display_order": 2},
            {"label": "صندوق ضيافة (2 كجم)", "multiplier": Decimal("2.00"), "price": Decimal("100.00"), "display_order": 3},
        ],
    },
    {
        "id": "prod-ghraybeh-pistachio",
        "slug": "damascene-ghraybeh-pistachio",
        "name": "غريبة شامية بالفستق الحلبي",
        "name_en": "Damascene Ghraybeh with Pistachio",
        "description": "حبات غريبة ناصعة البياض هشة وناعمة بالسمن الحيواني الفاخر حبة بحبة، متوجة بحبة فستق حلبي أخضر كاملة.",
        "category_slug": "petit-fours-sable",
        "price": Decimal("50.00"),
        "sale_price": None,
        "unit": "kg",
        "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
        ],
        "is_available": True,
        "is_featured": False,
        "weight_options": [
            {"label": "نصف كيلو (500 جم)", "multiplier": Decimal("0.50"), "price": Decimal("28.00"), "display_order": 1},
            {"label": "كيلو كامل (1000 جم)", "multiplier": Decimal("1.00"), "price": Decimal("50.00"), "display_order": 2},
        ],
    },
    {
        "id": "prod-maamoul-dates",
        "slug": "luxury-dates-pistachio-maamoul",
        "name": "معمول فاخر مشكل بالعجوة والفستق",
        "name_en": "Luxury Mixed Date & Pistachio Maamoul",
        "description": "معمول هش بالسمن البلقاوي الأصيل معجون بأفخر تمور المدينة ومحشو بالفستق الحلبي مع رشة سكر ناعم.",
        "category_slug": "petit-fours-sable",
        "price": Decimal("60.00"),
        "sale_price": Decimal("52.00"),
        "unit": "half_kg",
        "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
        "gallery_images": [
            "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
        ],
        "is_available": True,
        "is_featured": False,
        "weight_options": [
            {"label": "علبة نصف كيلو (500 جم)", "multiplier": Decimal("1.00"), "price": Decimal("60.00"), "display_order": 1},
            {"label": "علبة كيلو (1000 جم)", "multiplier": Decimal("2.00"), "price": Decimal("110.00"), "display_order": 2},
        ],
    },
]


def seed_categories() -> Dict[str, int]:
    """
    Seed 5 categories idempotently by slug.
    """
    from apps.catalog.models import Category

    created = 0
    updated = 0

    for cat_data in CATEGORIES_DATA:
        slug = cat_data["slug"]
        defaults = {
            "name": cat_data["name"],
            "description": cat_data.get("description", ""),
            "image_url": cat_data["image_url"],
            "display_order": cat_data["display_order"],
            "is_active": cat_data.get("is_active", True),
        }

        category = Category.objects.filter(slug=slug).first()
        if category:
            for key, val in defaults.items():
                setattr(category, key, val)
            category.save()
            updated += 1
        else:
            Category.objects.create(
                id=cat_data["id"],
                slug=slug,
                **defaults
            )
            created += 1

    return {
        "categories_created": created,
        "categories_updated": updated,
        "categories_skipped": updated,
        "categories": created + updated,
    }


def seed_products_and_weight_options() -> Dict[str, int]:
    """
    Seed 15 sweets products and their 2-3 weight options idempotently by slug.
    """
    from apps.catalog.models import Category, Product, ProductWeightOption

    products_created = 0
    products_updated = 0
    weight_options_created = 0
    weight_options_updated = 0

    for prod_data in PRODUCTS_DATA:
        category = Category.objects.get(slug=prod_data["category_slug"])
        slug = prod_data["slug"]

        defaults = {
            "name": prod_data["name"],
            "name_en": prod_data.get("name_en"),
            "description": prod_data["description"],
            "category": category,
            "price": prod_data["price"],
            "sale_price": prod_data.get("sale_price"),
            "unit": prod_data["unit"],
            "image_url": prod_data["image_url"],
            "gallery_images": prod_data.get("gallery_images", []),
            "is_available": prod_data.get("is_available", True),
            "is_featured": prod_data.get("is_featured", False),
            "is_archived": False,
        }

        product = Product.objects.filter(slug=slug).first()
        if product:
            for key, val in defaults.items():
                setattr(product, key, val)
            product.save()
            products_updated += 1
        else:
            product = Product.objects.create(
                id=prod_data["id"],
                slug=slug,
                **defaults
            )
            products_created += 1

        # Seed weight options for this product
        weight_options = prod_data.get("weight_options", [])
        for opt in weight_options:
            pwo = ProductWeightOption.objects.filter(product=product, label=opt["label"]).first()
            if pwo:
                pwo.multiplier = opt["multiplier"]
                pwo.price = opt["price"]
                pwo.display_order = opt["display_order"]
                pwo.save()
                weight_options_updated += 1
            else:
                ProductWeightOption.objects.create(
                    product=product,
                    label=opt["label"],
                    multiplier=opt["multiplier"],
                    price=opt["price"],
                    display_order=opt["display_order"],
                )
                weight_options_created += 1

    return {
        "products_created": products_created,
        "products_updated": products_updated,
        "products_skipped": products_updated,
        "products": products_created + products_updated,
        "weight_options_created": weight_options_created,
        "weight_options_updated": weight_options_updated,
        "weight_options_skipped": weight_options_updated,
        "weight_options": weight_options_created + weight_options_updated,
    }


def seed_catalog() -> CatalogSeedCounts:
    """
    Combined catalog seeder: creates 5 categories, 15 products and weight options.
    Wraps execution in a transaction savepoint if already inside transaction.atomic().
    """
    cat_counts = seed_categories()
    prod_counts = seed_products_and_weight_options()

    return {
        "categories_created": cat_counts["categories_created"],
        "categories_updated": cat_counts["categories_updated"],
        "categories_skipped": cat_counts["categories_skipped"],
        "categories": cat_counts["categories"],
        "products_created": prod_counts["products_created"],
        "products_updated": prod_counts["products_updated"],
        "products_skipped": prod_counts["products_skipped"],
        "products": prod_counts["products"],
        "weight_options_created": prod_counts["weight_options_created"],
        "weight_options_updated": prod_counts["weight_options_updated"],
        "weight_options_skipped": prod_counts["weight_options_skipped"],
        "weight_options": prod_counts["weight_options"],
    }
