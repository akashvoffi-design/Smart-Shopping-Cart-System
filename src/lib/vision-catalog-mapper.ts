import { Product } from '@/types';
import { getProductByBarcode, searchProducts, STAPLE_CATALOG_ITEMS } from '@/lib/products';

/**
 * Mapping table from YOLO model class labels (both pre-trained COCO classes and custom grocery labels)
 * to authoritative product IDs / barcodes in the SmartCart database catalog.
 */
const CLASS_TO_BARCODE_MAP: Record<string, string> = {
  // Fresh Produce
  apple: 'CAT_SHIMLA_APPLE',
  shimla_apple: 'CAT_SHIMLA_APPLE',
  green_apple: 'CAT_SHIMLA_APPLE',
  red_apple: 'CAT_SHIMLA_APPLE',

  banana: 'CAT_ROBUSTA_BANANA',
  robusta_banana: 'CAT_ROBUSTA_BANANA',
  yellow_banana: 'CAT_ROBUSTA_BANANA',

  orange: 'CAT_NAGPUR_ORANGE',
  nagpur_orange: 'CAT_NAGPUR_ORANGE',
  citrus: 'CAT_NAGPUR_ORANGE',

  broccoli: 'CAT_FRESH_BROCCOLI',
  fresh_broccoli: 'CAT_FRESH_BROCCOLI',

  carrot: 'CAT_OOTY_CARROT',
  ooty_carrot: 'CAT_OOTY_CARROT',

  // Mushrooms
  mushroom: 'CAT_BUTTON_MUSHROOM',
  button_mushroom: 'CAT_BUTTON_MUSHROOM',
  kaalan: 'CAT_BUTTON_MUSHROOM',

  // Beverages & Dairy
  bottle: 'CAT_BISLERI_1L',
  water_bottle: 'CAT_BISLERI_1L',
  bisleri: 'CAT_BISLERI_1L',
  mineral_water: 'CAT_BISLERI_1L',

  cup: 'CAT_AMUL_DAHI',
  dahi: 'CAT_AMUL_DAHI',
  dahi_cup: 'CAT_AMUL_DAHI',
  amul_dahi: 'CAT_AMUL_DAHI',
  curd: 'CAT_AMUL_DAHI',
  yogurt: 'CAT_AMUL_DAHI',

  // Bakery & Confectionery
  bread: 'CAT_BRITANNIA_BREAD',
  sandwich: 'CAT_BRITANNIA_BREAD',
  loaf: 'CAT_BRITANNIA_BREAD',
  britannia_bread: 'CAT_BRITANNIA_BREAD',

  donut: 'CAT_GLAZED_DONUT',
  doughnut: 'CAT_GLAZED_DONUT',
  glazed_donut: 'CAT_GLAZED_DONUT',

  cake: 'CAT_FRUIT_CAKE',
  fruit_cake: 'CAT_FRUIT_CAKE',
  britannia_cake: 'CAT_FRUIT_CAKE',

  // Packaged Snacks
  chips: 'CAT_LAYS_CHIPS',
  chips_packet: 'CAT_LAYS_CHIPS',
  lays: 'CAT_LAYS_CHIPS',
  lays_chips: 'CAT_LAYS_CHIPS',
  potato_chips: 'CAT_LAYS_CHIPS',

  biscuit: 'CAT_PARLE_G',
  biscuit_packet: 'CAT_PARLE_G',
  biscuits: 'CAT_PARLE_G',
  cookie: 'CAT_PARLE_G',
  cookies: 'CAT_PARLE_G',
  parle_g: 'CAT_PARLE_G',
};

export interface MappedGroceryDetection {
  className: string;
  confidence: number;
  product: Product | null;
  isCatalogMatch: boolean;
  matchReason?: string;
}

/**
 * Authoritatively resolves a detected YOLO class name to an actual Product in the catalog.
 * Strict rules:
 * 1. Checks if class name is an exact barcode.
 * 2. Checks predefined canonical mapping table.
 * 3. Attempts search in 5,198-item D-Mart store catalogue for custom trained classes.
 * 4. If no legitimate match is found, returns null (never invents prices or selects random items).
 */
export function mapVisionClassToProduct(className: string, confidence: number): MappedGroceryDetection {
  if (!className || typeof className !== 'string') {
    return {
      className: 'unknown',
      confidence,
      product: null,
      isCatalogMatch: false,
      matchReason: 'Empty or invalid class name',
    };
  }

  const cleanClass = className.trim().toLowerCase().replace(/[\s-]+/g, '_');

  // 1. Direct barcode match
  const directProduct = getProductByBarcode(className.trim());
  if (directProduct) {
    return {
      className,
      confidence,
      product: directProduct,
      isCatalogMatch: true,
      matchReason: 'Direct barcode match in database',
    };
  }

  // 2. Canonical mapping lookup
  const targetBarcode = CLASS_TO_BARCODE_MAP[cleanClass];
  if (targetBarcode) {
    const product = getProductByBarcode(targetBarcode);
    if (product) {
      return {
        className,
        confidence,
        product,
        isCatalogMatch: true,
        matchReason: `Mapped from class "${className}" to catalog item ${product.product_name}`,
      };
    }
  }

  // 3. Search in catalogue for custom classes (e.g. 'maggi', 'surf_excel', 'colgate')
  const searchQuery = cleanClass.replace(/_/g, ' ');
  const searchResults = searchProducts(searchQuery, 'all', 5, 0);

  if (searchResults.items && searchResults.items.length > 0) {
    // Find the closest product that contains the class query
    const matched = searchResults.items[0];
    return {
      className,
      confidence,
      product: matched,
      isCatalogMatch: true,
      matchReason: `Catalogue text search match for "${searchQuery}"`,
    };
  }

  // 4. No product match found
  return {
    className,
    confidence,
    product: null,
    isCatalogMatch: false,
    matchReason: `Class "${className}" is not registered in the store catalogue`,
  };
}
