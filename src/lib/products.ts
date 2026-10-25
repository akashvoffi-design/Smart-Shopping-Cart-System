import { Product } from '@/types';
import rawProducts from '@/data/products.json';

// In-memory typed cache of all 5,198 items
const productsCatalogue: Product[] = (rawProducts as Product[]).map((p) => ({
  ...p,
  mrp: Number(p.mrp),
  selling_price: Number(p.selling_price),
  discount_pct: Number(p.discount_pct),
  weight_g: Number(p.weight_g)
}));

// Quick hash index by barcode
const barcodeIndex = new Map<string, Product>();
for (const prod of productsCatalogue) {
  barcodeIndex.set(prod.barcode, prod);
}

export interface StapleItem extends Product {
  emoji: string;
}

export const STAPLE_CATALOG_ITEMS: StapleItem[] = [
  // 1. Amul-Butter
  {
    barcode: 'CAT_AMUL_BUTTER',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Amul Pasteurised Butter',
    brand: 'Amul',
    mrp: 58.00,
    selling_price: 56.00,
    discount_pct: 3,
    weight_g: 100,
    unit_type: 'weight',
    raw_quantity: '100 g',
    category: 'Dairy',
    subcategory: 'Butter & Spreads',
    emoji: '🧈',
    image_url: '/images/amul_butter.jpg',
    stock_quantity: 40,
  },
  // 2. Amul-masti
  {
    barcode: 'CAT_AMUL_DAHI',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Amul Masti Dahi Cup',
    brand: 'Amul',
    mrp: 25.00,
    selling_price: 24.00,
    discount_pct: 4,
    weight_g: 200,
    unit_type: 'weight',
    raw_quantity: '200 g',
    category: 'Dairy',
    subcategory: 'Curd & Yogurt',
    emoji: '🥛',
    image_url: '/images/products/amul_masti.jpg',
    stock_quantity: 35,
  },
  // 3. Apple
  {
    barcode: 'CAT_SHIMLA_APPLE',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Shimla Apple',
    brand: 'Fresh Produce',
    mrp: 30.00,
    selling_price: 27.00,
    discount_pct: 10,
    weight_g: 180,
    unit_type: 'weight',
    raw_quantity: '180 g',
    category: 'Fresh Fruits',
    subcategory: 'Apples',
    emoji: '🍎',
    stock_quantity: 45,
  },
  // 4. Banana
  {
    barcode: 'CAT_ROBUSTA_BANANA',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Robusta Banana',
    brand: 'Fresh Produce',
    mrp: 8.00,
    selling_price: 8.00,
    discount_pct: 0,
    weight_g: 120,
    unit_type: 'weight',
    raw_quantity: '120 g',
    category: 'Fresh Fruits',
    subcategory: 'Bananas',
    emoji: '🍌',
    stock_quantity: 30,
  },
  // 5. Bisleri-water
  {
    barcode: 'CAT_BISLERI_1L',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Bisleri Mineral Water 1L',
    brand: 'Bisleri',
    mrp: 20.00,
    selling_price: 20.00,
    discount_pct: 0,
    weight_g: 1030,
    unit_type: 'volume',
    raw_quantity: '1030 g',
    category: 'Beverages',
    subcategory: 'Mineral Water',
    emoji: '💧',
    image_url: '/images/products/bisleri_water.jpg',
    stock_quantity: 50,
  },
  // 6. Britannaia chaeese spreadz
  {
    barcode: 'CAT_BRITANNIA_CHEESE_SPREADZ',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Britannia Cheese Spreadz Classic',
    brand: 'Britannia',
    mrp: 110.00,
    selling_price: 104.50,
    discount_pct: 5,
    weight_g: 180,
    unit_type: 'weight',
    raw_quantity: '180 g',
    category: 'Dairy',
    subcategory: 'Cheese',
    emoji: '🧀',
    image_url: '/images/products/britannia_cheese_spreadz.jpg',
    stock_quantity: 25,
  },
  // 7. Britannaia cheese garlic
  {
    barcode: 'CAT_BRITANNIA_CHEESE_GARLIC',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Britannia Roasted Garlic Cheese Spread',
    brand: 'Britannia',
    mrp: 115.00,
    selling_price: 109.25,
    discount_pct: 5,
    weight_g: 180,
    unit_type: 'weight',
    raw_quantity: '180 g',
    category: 'Dairy',
    subcategory: 'Cheese',
    emoji: '🧄',
    image_url: '/images/products/britannia_cheese_garlic.jpg',
    stock_quantity: 20,
  },
  // 8. Britannaia fruit cake
  {
    barcode: 'CAT_FRUIT_CAKE',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Britannia Fruit Cake',
    brand: 'Britannia',
    mrp: 35.00,
    selling_price: 31.50,
    discount_pct: 10,
    weight_g: 130,
    unit_type: 'weight',
    raw_quantity: '130 g',
    category: 'Bakery',
    subcategory: 'Cakes',
    emoji: '🍰',
    image_url: '/images/products/britannia_fruit_cake.jpg',
    stock_quantity: 20,
  },
  // 9. Britannaia fruitBread
  {
    barcode: 'CAT_BRITANNIA_FRUIT_BREAD',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Britannia Sweet Fruit Bread',
    brand: 'Britannia',
    mrp: 45.00,
    selling_price: 42.50,
    discount_pct: 6,
    weight_g: 350,
    unit_type: 'weight',
    raw_quantity: '350 g',
    category: 'Bakery',
    subcategory: 'Bread',
    emoji: '🍞',
    image_url: '/images/products/britannia_fruitbread.jpg',
    stock_quantity: 20,
  },
  // 10. Britannaia whole wheatBread
  {
    barcode: 'CAT_BRITANNIA_WHEAT_BREAD',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Britannia 100% Whole Wheat Bread',
    brand: 'Britannia',
    mrp: 50.00,
    selling_price: 47.50,
    discount_pct: 5,
    weight_g: 400,
    unit_type: 'weight',
    raw_quantity: '400 g',
    category: 'Bakery',
    subcategory: 'Bread',
    emoji: '🍞',
    stock_quantity: 25,
  },
  // 11. Britannaia-Sandwich-Bread
  {
    barcode: 'CAT_BRITANNIA_BREAD',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Britannia White Sandwich Bread',
    brand: 'Britannia',
    mrp: 45.00,
    selling_price: 42.75,
    discount_pct: 5,
    weight_g: 400,
    unit_type: 'weight',
    raw_quantity: '400 g',
    category: 'Bakery',
    subcategory: 'Bread',
    emoji: '🍞',
    stock_quantity: 30,
  },
  // 12. Britannia-
  {
    barcode: 'CAT_BRITANNIA_TREAT',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Britannia Treat Biscuits',
    brand: 'Britannia',
    mrp: 30.00,
    selling_price: 28.50,
    discount_pct: 5,
    weight_g: 100,
    unit_type: 'weight',
    raw_quantity: '100 g',
    category: 'Snacks',
    subcategory: 'Biscuits',
    emoji: '🍪',
    stock_quantity: 30,
  },
  // 13 & 14. back pepper / black pepper
  {
    barcode: 'CAT_BLACK_PEPPER',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Whole Black Pepper (Kali Mirch)',
    brand: 'Spice Garden',
    mrp: 65.00,
    selling_price: 58.50,
    discount_pct: 10,
    weight_g: 50,
    unit_type: 'weight',
    raw_quantity: '50 g',
    category: 'Spices',
    subcategory: 'Whole Spices',
    emoji: '🧂',
    stock_quantity: 35,
  },
  // 15. britannia gobbles egg less fruit cake
  {
    barcode: 'CAT_BRITANNIA_GOBBLES_CAKE',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Britannia Gobbles Eggless Fruit Cake',
    brand: 'Britannia',
    mrp: 35.00,
    selling_price: 33.00,
    discount_pct: 6,
    weight_g: 120,
    unit_type: 'weight',
    raw_quantity: '120 g',
    category: 'Bakery',
    subcategory: 'Cakes',
    emoji: '🧁',
    stock_quantity: 25,
  },
  // 16. broccoli
  {
    barcode: 'CAT_FRESH_BROCCOLI',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Fresh Green Broccoli',
    brand: 'Fresh Produce',
    mrp: 60.00,
    selling_price: 51.00,
    discount_pct: 15,
    weight_g: 300,
    unit_type: 'weight',
    raw_quantity: '300 g',
    category: 'Fresh Vegetables',
    subcategory: 'Exotic Greens',
    emoji: '🥦',
    stock_quantity: 20,
  },
  // 17. cabbage
  {
    barcode: 'CAT_FRESH_CABBAGE',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Fresh Green Cabbage',
    brand: 'Fresh Produce',
    mrp: 25.00,
    selling_price: 22.50,
    discount_pct: 10,
    weight_g: 500,
    unit_type: 'weight',
    raw_quantity: '500 g',
    category: 'Fresh Vegetables',
    subcategory: 'Leafy & Head',
    emoji: '🥬',
    stock_quantity: 30,
  },
  // 18. carrot
  {
    barcode: 'CAT_OOTY_CARROT',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Fresh Ooty Carrot',
    brand: 'Fresh Produce',
    mrp: 15.00,
    selling_price: 14.00,
    discount_pct: 7,
    weight_g: 100,
    unit_type: 'weight',
    raw_quantity: '100 g',
    category: 'Fresh Vegetables',
    subcategory: 'Root Vegetables',
    emoji: '🥕',
    stock_quantity: 35,
  },
  // 19. cocaco (Coca Cola)
  {
    barcode: 'CAT_COCA_COLA',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Coca-Cola Classic Can 330ml',
    brand: 'Coca-Cola',
    mrp: 40.00,
    selling_price: 40.00,
    discount_pct: 0,
    weight_g: 330,
    unit_type: 'volume',
    raw_quantity: '330 ml',
    category: 'Beverages',
    subcategory: 'Soft Drinks',
    emoji: '🥤',
    image_url: '/images/products/coca_cola.jpg',
    stock_quantity: 45,
  },
  // 20. doughunut
  {
    barcode: 'CAT_GLAZED_DONUT',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Glazed Sweet Donut',
    brand: 'Daily Bake',
    mrp: 40.00,
    selling_price: 38.00,
    discount_pct: 5,
    weight_g: 75,
    unit_type: 'weight',
    raw_quantity: '75 g',
    category: 'Bakery',
    subcategory: 'Pastries',
    emoji: '🍩',
    image_url: '/images/products/glazed_donut.jpg',
    stock_quantity: 25,
  },
  // 21. green apple
  {
    barcode: 'CAT_GREEN_APPLE',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Granny Smith Green Apple',
    brand: 'Fresh Produce',
    mrp: 45.00,
    selling_price: 40.00,
    discount_pct: 11,
    weight_g: 180,
    unit_type: 'weight',
    raw_quantity: '180 g',
    category: 'Fresh Fruits',
    subcategory: 'Apples',
    emoji: '🍏',
    stock_quantity: 30,
  },
  // 22. kurkure
  {
    barcode: 'CAT_KURKURE_MUNCH',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Kurkure Masala Munch',
    brand: 'Kurkure',
    mrp: 20.00,
    selling_price: 20.00,
    discount_pct: 0,
    weight_g: 78,
    unit_type: 'weight',
    raw_quantity: '78 g',
    category: 'Snacks',
    subcategory: 'Extruded Snacks',
    emoji: '🌶️',
    image_url: '/images/products/kurkure.jpg',
    stock_quantity: 50,
  },
  // 23. lays
  {
    barcode: 'CAT_LAYS_CHIPS',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: "Lay's Classic Salted Potato Chips",
    brand: "Lay's",
    mrp: 20.00,
    selling_price: 20.00,
    discount_pct: 0,
    weight_g: 52,
    unit_type: 'weight',
    raw_quantity: '52 g',
    category: 'Snacks',
    subcategory: 'Chips',
    emoji: '🥔',
    stock_quantity: 45,
  },
  // 24. light
  {
    barcode: 'CAT_LED_LIGHT_BULB',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Philips / Eveready LED Light Bulb 9W',
    brand: 'Philips',
    mrp: 99.00,
    selling_price: 85.00,
    discount_pct: 14,
    weight_g: 65,
    unit_type: 'weight',
    raw_quantity: '65 g',
    category: 'Home Utilities',
    subcategory: 'Lighting',
    emoji: '💡',
    stock_quantity: 30,
  },
  // 25. maggi
  {
    barcode: 'CAT_MAGGI_NOODLES',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Maggi 2-Minute Masala Instant Noodles',
    brand: 'Nestlé',
    mrp: 14.00,
    selling_price: 14.00,
    discount_pct: 0,
    weight_g: 70,
    unit_type: 'weight',
    raw_quantity: '70 g',
    category: 'Instant Food',
    subcategory: 'Noodles',
    emoji: '🍜',
    image_url: '/images/maggi_noodles.jpg',
    stock_quantity: 60,
  },
  // 26. milk mushroom
  {
    barcode: 'CAT_BUTTON_MUSHROOM',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Milky White Button Mushroom (Kaalan)',
    brand: 'Fresh Produce',
    mrp: 85.00,
    selling_price: 75.00,
    discount_pct: 12,
    weight_g: 200,
    unit_type: 'weight',
    raw_quantity: '200 g',
    category: 'Fresh Vegetables',
    subcategory: 'Mushrooms',
    image_url: '/images/button_mushroom.jpg',
    emoji: '🍄',
    stock_quantity: 30,
  },
  // 27. onion
  {
    barcode: 'CAT_FRESH_ONION',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Fresh Red Onion',
    brand: 'Fresh Produce',
    mrp: 35.00,
    selling_price: 32.00,
    discount_pct: 9,
    weight_g: 150,
    unit_type: 'weight',
    raw_quantity: '150 g',
    category: 'Fresh Vegetables',
    subcategory: 'Alliums',
    emoji: '🧅',
    stock_quantity: 40,
  },
  // 28. onion stem
  {
    barcode: 'CAT_SPRING_ONION_STEM',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Fresh Spring Onion with Stems',
    brand: 'Fresh Produce',
    mrp: 20.00,
    selling_price: 18.00,
    discount_pct: 10,
    weight_g: 100,
    unit_type: 'weight',
    raw_quantity: '100 g',
    category: 'Fresh Vegetables',
    subcategory: 'Greens',
    emoji: '🌿',
    stock_quantity: 25,
  },
  // 29. orange
  {
    barcode: 'CAT_NAGPUR_ORANGE',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Nagpur Orange',
    brand: 'Fresh Produce',
    mrp: 15.00,
    selling_price: 14.25,
    discount_pct: 5,
    weight_g: 150,
    unit_type: 'weight',
    raw_quantity: '150 g',
    category: 'Fresh Fruits',
    subcategory: 'Citrus',
    emoji: '🍊',
    stock_quantity: 35,
  },
  // 30. parle-G
  {
    barcode: 'CAT_PARLE_G',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Parle-G Gold Biscuits',
    brand: 'Parle',
    mrp: 10.00,
    selling_price: 10.00,
    discount_pct: 0,
    weight_g: 56,
    unit_type: 'weight',
    raw_quantity: '56 g',
    category: 'Snacks',
    subcategory: 'Biscuits',
    emoji: '🍪',
    image_url: '/images/parle_g.jpg',
    stock_quantity: 60,
  },
  // 31. pepsi
  {
    barcode: 'CAT_PEPSI_CAN',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Pepsi Can 330ml',
    brand: 'PepsiCo',
    mrp: 40.00,
    selling_price: 40.00,
    discount_pct: 0,
    weight_g: 330,
    unit_type: 'volume',
    raw_quantity: '330 ml',
    category: 'Beverages',
    subcategory: 'Soft Drinks',
    emoji: '🥤',
    stock_quantity: 45,
  },
  // 32. potato
  {
    barcode: 'CAT_FRESH_POTATO',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Fresh Jyoti Potato',
    brand: 'Fresh Produce',
    mrp: 25.00,
    selling_price: 22.00,
    discount_pct: 12,
    weight_g: 150,
    unit_type: 'weight',
    raw_quantity: '150 g',
    category: 'Fresh Vegetables',
    subcategory: 'Tubers',
    emoji: '🥔',
    stock_quantity: 50,
  },
  // 33. sprite
  {
    barcode: 'CAT_SPRITE_CAN',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Sprite Can 330ml',
    brand: 'The Coca-Cola Company',
    mrp: 40.00,
    selling_price: 40.00,
    discount_pct: 0,
    weight_g: 330,
    unit_type: 'volume',
    raw_quantity: '330 ml',
    category: 'Beverages',
    subcategory: 'Lemon-Lime Soda',
    emoji: '🍋',
    stock_quantity: 45,
  },
  // 34. tomato
  {
    barcode: 'CAT_FRESH_TOMATO',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Fresh Hybrid Tomato',
    brand: 'Fresh Produce',
    mrp: 25.00,
    selling_price: 22.50,
    discount_pct: 10,
    weight_g: 120,
    unit_type: 'weight',
    raw_quantity: '120 g',
    category: 'Fresh Vegetables',
    subcategory: 'Vine Produce',
    emoji: '🍅',
    stock_quantity: 45,
  },
];

// Add staples into the index
for (const staple of STAPLE_CATALOG_ITEMS) {
  barcodeIndex.set(staple.barcode, staple);
}

// Combined catalogue including custom YOLO grocery staple products and Button Mushroom
const allProductsCatalogue: Product[] = [
  ...STAPLE_CATALOG_ITEMS,
  ...productsCatalogue.filter((p) => !barcodeIndex.has(p.barcode) || !p.barcode.startsWith('CAT_')),
];

export function getAllProducts(): Product[] {
  return allProductsCatalogue;
}

export function getProductByBarcode(barcode: string): Product | null {
  if (!barcode) return null;
  const cleanCode = barcode.trim();
  return barcodeIndex.get(cleanCode) || null;
}

export interface StockCheckResult {
  barcode: string;
  in_stock: boolean;
  stock_quantity: number;
  product: Product | null;
  message: string;
}

export function checkProductStock(barcode: string): StockCheckResult {
  const product = getProductByBarcode(barcode);
  if (!product) {
    return {
      barcode,
      in_stock: false,
      stock_quantity: 0,
      product: null,
      message: 'Product not registered in store catalog',
    };
  }
  const stock = typeof product.stock_quantity === 'number' ? product.stock_quantity : 25;
  return {
    barcode,
    in_stock: stock > 0,
    stock_quantity: stock,
    product: { ...product, stock_quantity: stock },
    message: stock > 0 ? `${stock} units available in stock` : 'Out of Stock',
  };
}

export function deductProductStock(barcode: string, quantity: number = 1): boolean {
  const product = barcodeIndex.get(barcode);
  if (!product) return false;
  const currentStock = typeof product.stock_quantity === 'number' ? product.stock_quantity : 25;
  if (currentStock < quantity) return false;
  product.stock_quantity = currentStock - quantity;
  barcodeIndex.set(barcode, product);
  return true;
}

export function searchProducts(
  query: string = '',
  category: string = 'all',
  limit: number = 24,
  offset: number = 0
): { items: Product[]; total: number } {
  let filtered = allProductsCatalogue;

  if (category && category !== 'all') {
    filtered = filtered.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.product_name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q))
    );
  }

  const total = filtered.length;
  const items = filtered.slice(offset, offset + limit);

  return { items, total };
}

export function getCategories(): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const prod of productsCatalogue) {
    counts.set(prod.category, (counts.get(prod.category) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAuthenticReferenceItems(): Product[] {
  return productsCatalogue.filter((p) => p.barcode_type === 'authentic_ean13');
}
