import { Product } from '@/types';
import { getProductByBarcode, searchProducts, STAPLE_CATALOG_ITEMS } from '@/lib/products';

/**
 * Mapping table from YOLO model class labels (including all 34 custom YOLO11n grocery classes
 * and pre-trained classes) to authoritative product barcodes in the SmartCart database catalog.
 */
const CLASS_TO_BARCODE_MAP: Record<string, string> = {
  // 1. Amul Butter
  amul_butter: 'CAT_AMUL_BUTTER',
  'amul-butter': 'CAT_AMUL_BUTTER',
  butter: 'CAT_AMUL_BUTTER',

  // 2. Amul Masti Dahi
  amul_masti: 'CAT_AMUL_DAHI',
  'amul-masti': 'CAT_AMUL_DAHI',
  amul_dahi: 'CAT_AMUL_DAHI',
  dahi: 'CAT_AMUL_DAHI',
  dahi_cup: 'CAT_AMUL_DAHI',
  curd: 'CAT_AMUL_DAHI',
  cup: 'CAT_AMUL_DAHI',

  // 3. Apple
  apple: 'CAT_SHIMLA_APPLE',
  shimla_apple: 'CAT_SHIMLA_APPLE',
  red_apple: 'CAT_SHIMLA_APPLE',

  // 4. Banana
  banana: 'CAT_ROBUSTA_BANANA',
  robusta_banana: 'CAT_ROBUSTA_BANANA',
  yellow_banana: 'CAT_ROBUSTA_BANANA',

  // 5. Bisleri Water
  bisleri_water: 'CAT_BISLERI_1L',
  'bisleri-water': 'CAT_BISLERI_1L',
  bisleri: 'CAT_BISLERI_1L',
  water_bottle: 'CAT_BISLERI_1L',
  bottle: 'CAT_BISLERI_1L',
  mineral_water: 'CAT_BISLERI_1L',

  // 6. Britannia Cheese Spreadz
  britannaia_chaeese_spreadz: 'CAT_BRITANNIA_CHEESE_SPREADZ',
  britannia_cheese_spreadz: 'CAT_BRITANNIA_CHEESE_SPREADZ',
  cheese_spreadz: 'CAT_BRITANNIA_CHEESE_SPREADZ',

  // 7. Britannia Cheese Garlic
  britannaia_cheese_garlic: 'CAT_BRITANNIA_CHEESE_GARLIC',
  britannia_cheese_garlic: 'CAT_BRITANNIA_CHEESE_GARLIC',
  cheese_garlic: 'CAT_BRITANNIA_CHEESE_GARLIC',

  // 8. Britannia Fruit Cake
  britannaia_fruit_cake: 'CAT_FRUIT_CAKE',
  britannia_fruit_cake: 'CAT_FRUIT_CAKE',
  fruit_cake: 'CAT_FRUIT_CAKE',
  cake: 'CAT_FRUIT_CAKE',

  // 9. Britannia Fruit Bread
  britannaia_fruitbread: 'CAT_BRITANNIA_FRUIT_BREAD',
  britannia_fruitbread: 'CAT_BRITANNIA_FRUIT_BREAD',
  fruitbread: 'CAT_BRITANNIA_FRUIT_BREAD',
  fruit_bread: 'CAT_BRITANNIA_FRUIT_BREAD',

  // 10. Britannia Whole Wheat Bread
  britannaia_whole_wheatbread: 'CAT_BRITANNIA_WHEAT_BREAD',
  britannia_whole_wheatbread: 'CAT_BRITANNIA_WHEAT_BREAD',
  wheatbread: 'CAT_BRITANNIA_WHEAT_BREAD',
  whole_wheat_bread: 'CAT_BRITANNIA_WHEAT_BREAD',

  // 11. Britannia Sandwich Bread
  britannaia_sandwich_bread: 'CAT_BRITANNIA_BREAD',
  'britannaia-sandwich-bread': 'CAT_BRITANNIA_BREAD',
  britannia_sandwich_bread: 'CAT_BRITANNIA_BREAD',
  britannia_bread: 'CAT_BRITANNIA_BREAD',
  bread: 'CAT_BRITANNIA_BREAD',
  sandwich: 'CAT_BRITANNIA_BREAD',
  loaf: 'CAT_BRITANNIA_BREAD',

  // 12. Britannia Treat / Biscuits
  'britannia_': 'CAT_BRITANNIA_TREAT',
  britannia: 'CAT_BRITANNIA_TREAT',
  britannia_treat: 'CAT_BRITANNIA_TREAT',

  // 13 & 14. Black Pepper / Back Pepper
  back_pepper: 'CAT_BLACK_PEPPER',
  black_pepper: 'CAT_BLACK_PEPPER',
  kali_mirch: 'CAT_BLACK_PEPPER',
  pepper: 'CAT_BLACK_PEPPER',

  // 15. Britannia Gobbles Eggless Fruit Cake
  britannia_gobbles_egg_less_fruit_cake: 'CAT_BRITANNIA_GOBBLES_CAKE',
  gobbles_cake: 'CAT_BRITANNIA_GOBBLES_CAKE',
  eggless_fruit_cake: 'CAT_BRITANNIA_GOBBLES_CAKE',

  // 16. Broccoli
  broccoli: 'CAT_FRESH_BROCCOLI',
  fresh_broccoli: 'CAT_FRESH_BROCCOLI',

  // 17. Cabbage
  cabbage: 'CAT_FRESH_CABBAGE',
  fresh_cabbage: 'CAT_FRESH_CABBAGE',

  // 18. Carrot
  carrot: 'CAT_OOTY_CARROT',
  ooty_carrot: 'CAT_OOTY_CARROT',

  // 19. Cocaco (Coca-Cola)
  cocaco: 'CAT_COCA_COLA',
  coca_cola: 'CAT_COCA_COLA',
  coke: 'CAT_COCA_COLA',
  coke_can: 'CAT_COCA_COLA',

  // 20. Doughnut / Donut
  doughunut: 'CAT_GLAZED_DONUT',
  doughnut: 'CAT_GLAZED_DONUT',
  donut: 'CAT_GLAZED_DONUT',
  glazed_donut: 'CAT_GLAZED_DONUT',

  // 21. Green Apple
  green_apple: 'CAT_GREEN_APPLE',
  apple_green: 'CAT_GREEN_APPLE',

  // 22. Kurkure
  kurkure: 'CAT_KURKURE_MUNCH',
  kurkure_munch: 'CAT_KURKURE_MUNCH',
  kurkure_masala: 'CAT_KURKURE_MUNCH',

  // 23. Lay's
  lays: 'CAT_LAYS_CHIPS',
  lays_chips: 'CAT_LAYS_CHIPS',
  potato_chips: 'CAT_LAYS_CHIPS',
  chips: 'CAT_LAYS_CHIPS',
  chips_packet: 'CAT_LAYS_CHIPS',

  // 24. Light Bulb
  light: 'CAT_LED_LIGHT_BULB',
  bulb: 'CAT_LED_LIGHT_BULB',
  light_bulb: 'CAT_LED_LIGHT_BULB',
  led_bulb: 'CAT_LED_LIGHT_BULB',

  // 25. Maggi
  maggi: 'CAT_MAGGI_NOODLES',
  maggi_noodles: 'CAT_MAGGI_NOODLES',
  noodles: 'CAT_MAGGI_NOODLES',

  // 26. Milk Mushroom (Button Mushroom)
  milk_mushroom: 'CAT_BUTTON_MUSHROOM',
  mushroom: 'CAT_BUTTON_MUSHROOM',
  button_mushroom: 'CAT_BUTTON_MUSHROOM',
  kaalan: 'CAT_BUTTON_MUSHROOM',

  // 27. Onion
  onion: 'CAT_FRESH_ONION',
  fresh_onion: 'CAT_FRESH_ONION',
  red_onion: 'CAT_FRESH_ONION',

  // 28. Onion Stem
  onion_stem: 'CAT_SPRING_ONION_STEM',
  spring_onion: 'CAT_SPRING_ONION_STEM',
  onion_leaf: 'CAT_SPRING_ONION_STEM',

  // 29. Orange
  orange: 'CAT_NAGPUR_ORANGE',
  nagpur_orange: 'CAT_NAGPUR_ORANGE',
  citrus: 'CAT_NAGPUR_ORANGE',

  // 30. Parle-G
  'parle-g': 'CAT_PARLE_G',
  parle_g: 'CAT_PARLE_G',
  biscuit: 'CAT_PARLE_G',
  biscuit_packet: 'CAT_PARLE_G',
  biscuits: 'CAT_PARLE_G',
  cookie: 'CAT_PARLE_G',

  // 31. Pepsi
  pepsi: 'CAT_PEPSI_CAN',
  pepsi_can: 'CAT_PEPSI_CAN',

  // 32. Potato
  potato: 'CAT_FRESH_POTATO',
  fresh_potato: 'CAT_FRESH_POTATO',

  // 33. Sprite
  sprite: 'CAT_SPRITE_CAN',
  sprite_can: 'CAT_SPRITE_CAN',

  // 34. Tomato
  tomato: 'CAT_FRESH_TOMATO',
  fresh_tomato: 'CAT_FRESH_TOMATO',
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
