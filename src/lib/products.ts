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
    stock_quantity: 25,
  },
  {
    barcode: 'CAT_FRESH_BROCCOLI',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Fresh Broccoli',
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
    stock_quantity: 0, // Demonstrates authentic Out of Stock handling
  },
  {
    barcode: 'CAT_OOTY_CARROT',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Ooty Carrot',
    brand: 'Fresh Produce',
    mrp: 12.00,
    selling_price: 12.00,
    discount_pct: 0,
    weight_g: 80,
    unit_type: 'weight',
    raw_quantity: '80 g',
    category: 'Fresh Vegetables',
    subcategory: 'Root Vegetables',
    emoji: '🥕',
    stock_quantity: 18,
  },
  {
    barcode: 'CAT_BISLERI_1L',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Bisleri Water 1L',
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
    stock_quantity: 50,
  },
  {
    barcode: 'CAT_AMUL_DAHI',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Amul Masti Dahi Cup',
    brand: 'Amul',
    mrp: 23.00,
    selling_price: 23.00,
    discount_pct: 0,
    weight_g: 200,
    unit_type: 'weight',
    raw_quantity: '200 g',
    category: 'Dairy',
    subcategory: 'Curd & Yogurt',
    emoji: '🥛',
    stock_quantity: 15,
  },
  {
    barcode: 'CAT_BRITANNIA_BREAD',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Britannia Bread',
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
    stock_quantity: 20,
  },
  {
    barcode: 'CAT_GLAZED_DONUT',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Glazed Donut',
    brand: 'Daily Bake',
    mrp: 40.00,
    selling_price: 40.00,
    discount_pct: 0,
    weight_g: 70,
    unit_type: 'weight',
    raw_quantity: '70 g',
    category: 'Bakery',
    subcategory: 'Pastries',
    emoji: '🍩',
    stock_quantity: 12,
  },
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
    stock_quantity: 10,
  },
  {
    barcode: 'CAT_LAYS_CHIPS',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: "Lay's Classic Chips",
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
    stock_quantity: 35,
  },
  {
    barcode: 'CAT_PARLE_G',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Parle-G Biscuits',
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
    stock_quantity: 60,
  },
  {
    barcode: 'CAT_BUTTON_MUSHROOM',
    barcode_type: 'authentic_ean13',
    barcode_provenance: 'quick_catalog',
    product_name: 'Button Mushroom (Kaalan)',
    brand: 'Fresh Produce',
    mrp: 82.00,
    selling_price: 67.00,
    discount_pct: 18,
    weight_g: 180,
    unit_type: 'weight',
    raw_quantity: '180 g',
    category: 'Fresh Vegetables',
    subcategory: 'Mushrooms',
    emoji: '🍄',
    stock_quantity: 25,
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
