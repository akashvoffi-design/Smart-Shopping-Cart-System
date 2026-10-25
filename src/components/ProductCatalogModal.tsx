'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBasket,
  SprayCan,
  Package,
  House,
  ShoppingCart,
  Milk,
  Apple,
  Cookie,
  HeartPulse,
  Camera,
  Heart,
  ChevronRight,
  Plus,
  Minus,
  X,
  Check,
  CheckCircle2,
  Search,
  ShieldCheck,
} from 'lucide-react';
import GlassIcon, { GlassColor } from '@/components/GlassIcon';
import { Product } from '@/types';
import { getAllProducts, getCategories } from '@/lib/products';
import { iotSimulator } from '@/lib/iot-simulator';
import { getStoredCart, updateItemQuantity, removeItemFromCart } from '@/lib/cart-store';

interface ProductCatalogModalProps {
  onProductSelected: (product: Product, quantity?: number) => void;
  onClose?: () => void;
  onOpenScanner?: () => void;
  onScanRedirectToWebcam?: () => void;
}

// Comprehensive category & keyword based image repository for grocery catalogue with verified white-background packshots
const GROCERY_IMAGE_MAP: Record<string, string> = {
  // Attached image item: Button Mushroom Kaalan (Authentic White-Background Packshot)
  button_mushroom: 'https://www.bbassets.com/media/uploads/p/l/10000273_16-fresho-mushrooms-button.jpg',
  mushroom: 'https://www.bbassets.com/media/uploads/p/l/10000273_16-fresho-mushrooms-button.jpg',
  kaalan: 'https://www.bbassets.com/media/uploads/p/l/10000273_16-fresho-mushrooms-button.jpg',

  // Indian Verified Fast-Moving Packshots
  parle_g: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/26ac5f6a-2b93-4633-8e6d-1d50904c11d3.png',
  maggi: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/rc-upload-1777953701494-15256.png',
  noodles: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/rc-upload-1777953701494-15256.png',
  amul_butter: 'https://cdn.grofers.com/da/cms-assets/cms/product/rc-upload-1781155438653-138.png',
  butter: 'https://cdn.grofers.com/da/cms-assets/cms/product/rc-upload-1781155438653-138.png',
  tata_salt: 'https://cdn.grofers.com/da/cms-assets/cms/product/6091d225-9c49-43a7-adb4-d9b236eb5cd4.jpg',
  salt: 'https://cdn.grofers.com/da/cms-assets/cms/product/6091d225-9c49-43a7-adb4-d9b236eb5cd4.jpg',
  good_day: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/eb109f6f-1791-4131-9e4a-a24251aa449a.png',
  colgate: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/fc0186d2-f73b-4ba4-b2b9-df8c188060ac.jpg',
  toothpaste: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/fc0186d2-f73b-4ba4-b2b9-df8c188060ac.jpg',
  dettol: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/aa08dedd-7ce2-4188-bce3-aa2f33abf82e.png',
  handwash: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/aa08dedd-7ce2-4188-bce3-aa2f33abf82e.png',
  surf_excel: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/e2196bf7-ceac-4774-b213-a155bbfd101f.png',
  detergent: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/e2196bf7-ceac-4774-b213-a155bbfd101f.png',
  fortune_oil: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/ea946490-dcf9-4cbe-be78-ef95a82f1140.png',
  sunflower_oil: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/ea946490-dcf9-4cbe-be78-ef95a82f1140.png',

  // 12 YOLO Grocery Classes (All Crisp White-Background Packshots)
  apple: 'https://cdn.grofers.com/da/cms-assets/cms/product/3f9218be-777e-4014-a1cd-b3dfb4d1ad2b.png',
  banana: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/642b528b-1ec7-40bb-a0df-4892331790d0.png',
  orange: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/a9edf195-8f9b-4bd7-b499-acf78f393102.jpg',
  broccoli: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/df6a8c66-ade9-4f50-b3bd-364e3dc36789.png',
  carrot: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/rc-upload-1780989835137-192.png',
  water_bottle: 'https://cdn.grofers.com/da/cms-assets/cms/product/84ba0e86-2197-436b-870e-78029ad232e1.jpg',
  bisleri: 'https://cdn.grofers.com/da/cms-assets/cms/product/84ba0e86-2197-436b-870e-78029ad232e1.jpg',
  dahi: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/e47341cd-d920-4c0a-a9f2-20d663976cd0.png',
  curd: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/e47341cd-d920-4c0a-a9f2-20d663976cd0.png',
  bread: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/723dd6b9-34ba-4d18-a592-e3f9b8940ab5.png',
  donut: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?fm=jpg&q=80&w=600&auto=format&fit=crop',
  cake: 'https://cdn.grofers.com/da/cms-assets/cms/product/f6dde54c-3596-4df2-a9ff-bc65c200965f.jpg',
  chips: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/e8d04045-4efc-4dbb-bbd1-784b08183d54.png',
  lays: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/e8d04045-4efc-4dbb-bbd1-784b08183d54.png',
  biscuit: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/26ac5f6a-2b93-4633-8e6d-1d50904c11d3.png',

  // Dry Fruits & Staples (White-Background Authentic Packshots)
  almond: 'https://www.bbassets.com/media/uploads/p/l/10000518_14-bb-popular-almondbadam-californian-giri.jpg',
  almonds: 'https://www.bbassets.com/media/uploads/p/l/10000518_14-bb-popular-almondbadam-californian-giri.jpg',
  badam: 'https://www.bbassets.com/media/uploads/p/l/10000518_14-bb-popular-almondbadam-californian-giri.jpg',
  cashew: 'https://www.bbassets.com/media/uploads/p/l/10000551_12-bb-popular-cashewkaju-whole.jpg',
  cashews: 'https://www.bbassets.com/media/uploads/p/l/10000551_12-bb-popular-cashewkaju-whole.jpg',
  kaju: 'https://www.bbassets.com/media/uploads/p/l/10000551_12-bb-popular-cashewkaju-whole.jpg',
  raisins: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80',
  kishmish: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80',

  // Common D-Mart & Indian Grocery Staples
  rice: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/875ffd87-6efe-4b2d-9619-63f596ea7837.png',
  basmati: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/875ffd87-6efe-4b2d-9619-63f596ea7837.png',
  atta: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/a79ec60d-7acb-4cbf-bee2-12c135542d7b.png',
  flour: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/a79ec60d-7acb-4cbf-bee2-12c135542d7b.png',
  wheat: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/a79ec60d-7acb-4cbf-bee2-12c135542d7b.png',
  dal: 'https://images.unsplash.com/photo-1585994112836-583d735047b8?fm=jpg&q=80&w=600&auto=format&fit=crop',
  oil: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/ea946490-dcf9-4cbe-be78-ef95a82f1140.png',
  chocolate: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/c58ed8bf-5277-4631-b85f-919c4f8b1102.png',
  potato: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/fae86fa5-5a00-4118-9563-34e16ae9c157.png',
  onion: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/f53c1ea1-cfa0-438b-a14c-b4f5ebeed7dd.png',
  kurkure: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/rc-upload-1780634830965-687.png',
  redbull: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/479f9dd9-a526-4302-9cad-20bbc9cef037.png',
};

// Helper to resolve packaging packshots
export function getPackagingImage(product?: { barcode?: string; product_name?: string; image_url?: string; category?: string }): string {
  if (!product) return '/icons/cart.png';

  const name = (product.product_name || '').toLowerCase();
  const barcode = product.barcode || '';
  const category = (product.category || '').toLowerCase();

  // 1. Direct Barcode & Key Product Mapping (Authentic Packshots with White Background)
  if (barcode === 'CAT_BUTTON_MUSHROOM' || name.includes('mushroom') || name.includes('kaalan')) {
    return 'https://www.bbassets.com/media/uploads/p/l/10000273_16-fresho-mushrooms-button.jpg';
  }
  if (name.includes('badam') || name.includes('almond')) {
    return 'https://www.bbassets.com/media/uploads/p/l/10000518_14-bb-popular-almondbadam-californian-giri.jpg';
  }
  if (name.includes('kaju') || name.includes('cashew')) {
    return 'https://www.bbassets.com/media/uploads/p/l/10000551_12-bb-popular-cashewkaju-whole.jpg';
  }
  if (barcode === '8901063012480' || barcode === 'CAT_PARLE_G' || name.includes('parle-g') || (name.includes('parle') && name.includes('biscuit'))) {
    return 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/26ac5f6a-2b93-4633-8e6d-1d50904c11d3.png';
  }
  if (barcode === '8901058852336' || name.includes('maggi')) {
    return 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/rc-upload-1777953701494-15256.png';
  }
  if (barcode === '8901262010011' || (name.includes('amul') && name.includes('butter'))) {
    return 'https://cdn.grofers.com/da/cms-assets/cms/product/rc-upload-1781155438653-138.png';
  }
  if (barcode === '8901725181222' || name.includes('tata salt') || (name.includes('tata') && name.includes('salt'))) {
    return 'https://cdn.grofers.com/da/cms-assets/cms/product/6091d225-9c49-43a7-adb4-d9b236eb5cd4.jpg';
  }
  if (barcode === '8901233024854' || barcode === 'CAT_SHIMLA_APPLE' || name.includes('apple')) {
    return 'https://cdn.grofers.com/da/cms-assets/cms/product/3f9218be-777e-4014-a1cd-b3dfb4d1ad2b.png';
  }
  if (barcode === '8901233024861' || name.includes('good day')) {
    return 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/eb109f6f-1791-4131-9e4a-a24251aa449a.png';
  }
  if (barcode === '8901030953280' || name.includes('colgate')) {
    return 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/fc0186d2-f73b-4ba4-b2b9-df8c188060ac.jpg';
  }
  if (barcode === '8901499026131' || name.includes('dettol')) {
    return 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/aa08dedd-7ce2-4188-bce3-aa2f33abf82e.png';
  }
  if (barcode === '8901030825273' || name.includes('surf excel')) {
    return 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/e2196bf7-ceac-4774-b213-a155bbfd101f.png';
  }
  if (barcode === '8906002480012' || name.includes('fortune') || (name.includes('sunflower') && name.includes('oil'))) {
    return 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=1080/da/cms-assets/cms/product/ea946490-dcf9-4cbe-be78-ef95a82f1140.png';
  }

  // 2. If item already has a direct valid CDN image URL, use it
  if (product.image_url && product.image_url.startsWith('http')) {
    return product.image_url;
  }

  // 3. Check specific staple barcodes
  if (barcode === 'CAT_ROBUSTA_BANANA' || name.includes('banana')) return GROCERY_IMAGE_MAP.banana;
  if (barcode === 'CAT_NAGPUR_ORANGE' || name.includes('orange') || name.includes('citrus')) return GROCERY_IMAGE_MAP.orange;
  if (barcode === 'CAT_FRESH_BROCCOLI' || name.includes('broccoli')) return GROCERY_IMAGE_MAP.broccoli;
  if (barcode === 'CAT_OOTY_CARROT' || name.includes('carrot')) return GROCERY_IMAGE_MAP.carrot;
  if (barcode === 'CAT_BISLERI_1L' || name.includes('bisleri') || name.includes('water')) return GROCERY_IMAGE_MAP.water_bottle;
  if (barcode === 'CAT_AMUL_DAHI' || name.includes('dahi') || name.includes('curd') || name.includes('yogurt')) return GROCERY_IMAGE_MAP.dahi;
  if (barcode === 'CAT_BRITANNIA_BREAD' || name.includes('bread') || name.includes('loaf')) return GROCERY_IMAGE_MAP.bread;
  if (barcode === 'CAT_GLAZED_DONUT' || name.includes('donut') || name.includes('doughnut')) return GROCERY_IMAGE_MAP.donut;
  if (barcode === 'CAT_FRUIT_CAKE' || name.includes('cake') || name.includes('pastry')) return GROCERY_IMAGE_MAP.cake;
  if (barcode === 'CAT_LAYS_CHIPS' || name.includes('lays') || name.includes('chips') || name.includes('wafer')) return GROCERY_IMAGE_MAP.chips;

  // 4. Keyword match across 5,198 catalogue items
  for (const [key, url] of Object.entries(GROCERY_IMAGE_MAP)) {
    if (name.includes(key)) return url;
  }

  // 5. Category fallbacks
  if (category.includes('fruit')) return GROCERY_IMAGE_MAP.apple;
  if (category.includes('vegetable')) return GROCERY_IMAGE_MAP.carrot;
  if (category.includes('dairy')) return GROCERY_IMAGE_MAP.dahi;
  if (category.includes('beverage')) return GROCERY_IMAGE_MAP.water_bottle;
  if (category.includes('snack') || category.includes('biscuit')) return GROCERY_IMAGE_MAP.chips;
  if (category.includes('personal') || category.includes('care')) return GROCERY_IMAGE_MAP.colgate;
  if (category.includes('staple') || category.includes('grocery')) return GROCERY_IMAGE_MAP.rice;

  return product.image_url || GROCERY_IMAGE_MAP.button_mushroom;
}

export default function ProductCatalogModal({
  onProductSelected,
  onClose,
  onOpenScanner,
  onScanRedirectToWebcam,
}: ProductCatalogModalProps) {
  const [allProductsList, setAllProductsList] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});

  // Configurator Sheet (for custom quantity/grams)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [configQuantity, setConfigQuantity] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [addedBarcode, setAddedBarcode] = useState<string | null>(null);

  // Sync cart quantities from localStorage and listen to updates
  useEffect(() => {
    const refreshCartQuantities = () => {
      const items = getStoredCart();
      const map: Record<string, number> = {};
      for (const item of items) {
        map[item.barcode] = item.quantity;
      }
      setCartQuantities(map);
    };

    refreshCartQuantities();
    window.addEventListener('smartcart_updated', refreshCartQuantities);
    return () => window.removeEventListener('smartcart_updated', refreshCartQuantities);
  }, []);

  useEffect(() => {
    const prods = getAllProducts();
    setAllProductsList(prods);
  }, []);

  // Left Sidebar Category Definitions matching reference image
  const sidebarCategories: { id: string; label: string; icon: any; count: number; color: GlassColor }[] = [
    { id: 'all', label: 'All Items', icon: ShoppingBasket, count: 5198, color: 'blue' },
    { id: 'Personal Care', label: 'Personal Care', icon: SprayCan, count: 1282, color: 'pink' },
    { id: 'Packaged Food', label: 'Packaged Food', icon: Package, count: 1128, color: 'orange' },
    { id: 'Household & Kitchen', label: 'Household & Kitchen', icon: House, count: 931, color: 'purple' },
    { id: 'Grocery & Staples', label: 'Grocery & Staples', icon: ShoppingCart, count: 873, color: 'blue' },
    { id: 'Dairy & Beverages', label: 'Dairy & Beverages', icon: Milk, count: 430, color: 'cyan' },
    { id: 'Fruits & Vegetables', label: 'Fruits & Vegetables', icon: Apple, count: 215, color: 'green' },
    { id: 'Snacks & Biscuits', label: 'Snacks & Biscuits', icon: Cookie, count: 450, color: 'amber' },
    { id: 'Health & Wellness', label: 'Health & Wellness', icon: HeartPulse, count: 180, color: 'pink' },
  ];

  // Filter & Search Logic (searches all items or filters by left sidebar category)
  const filteredProducts = useMemo(() => {
    let result = [...allProductsList];

    // 1. Search Query filter (searches across all items, brands, barcodes, subcategories)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.product_name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q))
      );
    } else if (selectedCategory !== 'all') {
      // 2. Category filter from left sidebar
      const catLower = selectedCategory.toLowerCase();
      result = result.filter((p) => {
        const pCat = (p.category || '').toLowerCase();
        const pSub = (p.subcategory || '').toLowerCase();
        if (catLower === 'fruits & vegetables') {
          return pCat.includes('produce') || pCat.includes('fruit') || pCat.includes('vegetable');
        }
        if (catLower === 'snacks & biscuits') {
          return pCat.includes('snack') || pSub.includes('biscuit') || pSub.includes('cookie');
        }
        if (catLower === 'health & wellness') {
          return pCat.includes('health') || pCat.includes('personal');
        }
        return pCat === catLower || pCat.includes(catLower);
      });
    }

    // Popularity default: prioritize the exact reference items and attached mushroom at the top
    const referenceBarcodes = [
      'CAT_BUTTON_MUSHROOM', // 0. Button Mushroom (Kaalan) - from user attachment
      '8901063012480',       // 1. Parle-G Gluco Biscuits
      '8901058852336',       // 2. Maggi 2-Minute Masala Instant Noodles
      '8901262010011',       // 3. Amul Pasteurised Butter
      '8901725181222',       // 4. Tata Salt Vacuum Evaporated
      '8901233024861',       // 5. Britannia Good Day Rich Butter Cookies
      '8901030953280',       // 6. Colgate Strong Teeth Dental Cream Toothpaste
      '8901499026131',       // 7. Dettol Original Liquid Handwash Refill
      '8901030825273',       // 8. Surf Excel Easy Wash Detergent Powder
    ];

    result.sort((a, b) => {
      const aIdx = referenceBarcodes.indexOf(a.barcode);
      const bIdx = referenceBarcodes.indexOf(b.barcode);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return (b.discount_pct || 0) - (a.discount_pct || 0);
    });

    return result;
  }, [allProductsList, selectedCategory, searchQuery]);

  // Wishlist toggle
  const toggleWishlist = (e: React.MouseEvent, barcode: string) => {
    e.stopPropagation();
    setWishlist((prev) => ({
      ...prev,
      [barcode]: !prev[barcode],
    }));
  };

  // Quick 1-click Add to Cart
  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const currentQty = cartQuantities[product.barcode] || 0;
    const newQty = currentQty + 1;
    const addedWeight = (product.weight_g || 100);

    iotSimulator.placeWeight(addedWeight);
    iotSimulator.playBuzzer('success');

    setAddedBarcode(product.barcode);
    setToastMessage(`✓ Added "${product.product_name}" to cart`);

    onProductSelected(product, 1);

    setTimeout(() => {
      setAddedBarcode(null);
      setToastMessage(null);
    }, 2400);
  };

  // Quantity decrement from product card stepper
  const handleQuantityDecrement = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const currentQty = cartQuantities[product.barcode] || 0;
    if (currentQty <= 1) {
      removeItemFromCart(product.barcode);
      iotSimulator.removeWeight(product.weight_g || 100);
      iotSimulator.playBuzzer('success');
      setToastMessage(`Removed "${product.product_name}" from cart`);
    } else {
      updateItemQuantity(product.barcode, currentQty - 1);
      iotSimulator.removeWeight(product.weight_g || 100);
      iotSimulator.playBuzzer('success');
      setToastMessage(`Updated "${product.product_name}" quantity to ${currentQty - 1}`);
    }
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Open item configurator sheet
  const handleCardClick = (product: Product) => {
    setSelectedProduct(product);
    setConfigQuantity(cartQuantities[product.barcode] || 1);
  };

  // Add configured quantity directly to cart
  const handleConfiguredAdd = () => {
    if (!selectedProduct) return;
    const qty = Math.max(1, configQuantity);
    const addedWeight = (selectedProduct.weight_g || 100) * qty;

    iotSimulator.placeWeight(addedWeight);
    iotSimulator.playBuzzer('success');

    onProductSelected(selectedProduct, qty);

    setToastMessage(`✓ Added ${qty}x "${selectedProduct.product_name}" (${addedWeight}g total) directly to cart!`);
    setSelectedProduct(null);

    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        minHeight: '750px',
        maxHeight: '880px',
        background: 'radial-gradient(circle at 10% 10%, #e8f2fe 0%, #edf5ff 40%, #e2eeff 100%)',
        borderRadius: '36px',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '80px',
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Close Button in top right (Perfect positioning, bigger 44px, Vibrant Red Theme) */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '20px',
            zIndex: 100,
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            border: '2px solid rgba(255, 255, 255, 0.95)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.42), 0 2px 6px rgba(0, 0, 0, 0.1), inset 0 1.5px 2px rgba(255, 255, 255, 0.65)',
            transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          title="Close Catalogue"
          aria-label="Close Catalogue"
        >
          <X style={{ width: '22px', height: '22px', strokeWidth: 2.8, pointerEvents: 'none' }} />
        </button>
      )}

      {/* =========================================================================
          LEFT SIDEBAR: CATEGORY NAVIGATION & SCAN ACTION
          ========================================================================= */}
      <aside
        style={{
          width: '230px',
          minWidth: '230px',
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(30px)',
          borderRight: '1.5px solid rgba(255, 255, 255, 0.85)',
          padding: '24px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sidebarCategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '9px 12px',
                  borderRadius: '16px',
                  border: isActive ? '1.5px solid rgba(255, 255, 255, 0.6)' : '1px solid transparent',
                  background: isActive
                    ? 'linear-gradient(90deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)'
                    : 'transparent',
                  color: isActive ? '#ffffff' : '#475569',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: isActive ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                <GlassIcon
                  icon={Icon}
                  color={isActive ? 'blue' : cat.color}
                  size={30}
                  active={isActive}
                />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Left: Scan Item Card (Redirects to Laptop Webcam on Dashboard) */}
        <div
          onClick={() => {
            if (onScanRedirectToWebcam) {
              onScanRedirectToWebcam();
            } else if (onOpenScanner) {
              onOpenScanner();
            }
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            borderRadius: '24px',
            border: '1.5px solid rgba(255, 255, 255, 0.95)',
            padding: '16px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.12)',
            transition: 'all 0.2s ease',
          }}
        >
          {/* Glassmorphic Cyan Camera Icon */}
          <GlassIcon icon={Camera} color="cyan" size={44} glow />

          <div style={{ flex: 1, minWidth: 0 }}>
            <h5 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Scan Item
            </h5>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0', lineHeight: 1.25 }}>
              Use camera to add items quickly
            </p>
          </div>

          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'rgba(241, 245, 249, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6',
              flexShrink: 0,
            }}
          >
            <ChevronRight style={{ width: '16px', height: '16px' }} />
          </div>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT MAIN CONTENT AREA
          ========================================================================= */}
      <main
        className="catalog-scroll-clean"
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <style jsx>{`
          .catalog-scroll-clean::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
        `}</style>
        {/* 1. TOP HERO BANNER (Official Panoramic Artwork) */}
        <div
          style={{
            position: 'relative',
            borderRadius: '28px',
            border: '2px solid rgba(255, 255, 255, 0.98)',
            boxShadow: '0 14px 38px rgba(59, 130, 246, 0.22), inset 0 2px 4px #ffffff',
            backgroundImage: 'url(/images/grocery_banner_official.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            padding: '24px 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            overflow: 'hidden',
            minHeight: '190px',
            flexShrink: 0,
          }}
        >
          {/* Subtle Left Light Wash Overlay for optimal text and search contrast */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(235, 244, 255, 0.75) 0%, rgba(219, 234, 254, 0.35) 45%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Left Text & Search Block */}
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '480px' }}>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 900,
                color: '#0f172a',
                lineHeight: 1.15,
                margin: 0,
                letterSpacing: '-0.025em',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.85)',
              }}
            >
              Fresh Groceries<br />at Your Fingertips
            </h1>
            <p
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#334155',
                margin: '8px 0 18px',
                letterSpacing: '0.2px',
              }}
            >
              Scan &bull; Browse &bull; Add &bull; Checkout
            </p>

            {/* Search Bar for searching items in All items section */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 18px 8px 12px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(16px)',
                border: '1.5px solid #ffffff',
                boxShadow: '0 6px 20px rgba(37, 99, 235, 0.22)',
                width: '380px',
                maxWidth: '100%',
                transition: 'all 0.2s ease',
              }}
            >
              <GlassIcon icon={Search} color="blue" size={26} shape="circle" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items, Parle-G, Maggi, Amul..."
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#0f172a',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'rgba(241, 245, 249, 0.9)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: 0,
                    flexShrink: 0,
                  }}
                  title="Clear search"
                >
                  <X style={{ width: '12px', height: '12px' }} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. PRODUCTS GRID (4 COLUMNS) */}
        {filteredProducts.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(16px)',
              borderRadius: '24px',
              border: '1.5px solid rgba(255, 255, 255, 0.95)',
              margin: '10px 0',
            }}
          >
            <p style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              No grocery items found for &ldquo;{searchQuery}&rdquo;
            </p>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Try searching with another keyword or select a category from the left sidebar.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              paddingBottom: '20px',
            }}
          >
          {filteredProducts.slice(0, 24).map((product) => {
            const isWishlisted = Boolean(wishlist[product.barcode]);
            const isJustAdded = addedBarcode === product.barcode;
            const packagingImg = getPackagingImage(product);
            const hasDiscount = Boolean(product.discount_pct && product.discount_pct > 0);
            const currentQtyInCart = cartQuantities[product.barcode] || 0;

            return (
              <div
                key={product.barcode}
                onClick={() => handleCardClick(product)}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: isJustAdded ? '2px solid #2e7d32' : '1px solid rgba(226, 232, 240, 0.95)',
                  padding: '10px 10px 12px 10px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                }}
              >
                {/* 1. Top Image Container with Blue Ribbon & Wishlist */}
                <div
                  style={{
                    width: '100%',
                    height: '140px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative',
                    background: '#ffffff',
                    border: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    marginBottom: '8px',
                  }}
                >
                  {/* Top-Left Blue Ribbon Badge (Matches 18% OFF badge from user image) */}
                  {hasDiscount && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: '8px',
                        zIndex: 4,
                        background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
                        color: '#ffffff',
                        padding: '4px 6px 6px 6px',
                        fontSize: '10px',
                        fontWeight: 900,
                        textAlign: 'center',
                        lineHeight: 1.1,
                        letterSpacing: '0.02em',
                        borderBottomLeftRadius: '3px',
                        borderBottomRightRadius: '3px',
                        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.4)',
                      }}
                    >
                      <span style={{ display: 'block' }}>{product.discount_pct.toFixed(0)}%</span>
                      <span style={{ fontSize: '8px', opacity: 0.95 }}>OFF</span>
                    </div>
                  )}

                  {/* Top-Right Subtle Wishlist Heart */}
                  <button
                    type="button"
                    onClick={(e) => toggleWishlist(e, product.barcode)}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      zIndex: 4,
                      background: 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(8px)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                    }}
                    title="Add to Wishlist"
                  >
                    <Heart
                      style={{
                        width: '14px',
                        height: '14px',
                        color: isWishlisted ? '#ef4444' : '#64748b',
                        fill: isWishlisted ? '#ef4444' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    />
                  </button>

                  {/* Product Packaging Image */}
                  <img
                    src={packagingImg}
                    alt={product.product_name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      transition: 'transform 0.25s ease',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/button_mushroom.jpg';
                    }}
                  />
                </div>

                {/* 2. Product Name (Matches 2-line bold dark typography from attached image) */}
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: '0 0 3px 0',
                    lineHeight: 1.3,
                    minHeight: '34px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                  title={product.product_name}
                >
                  {product.product_name}
                </h4>

                {/* 4. Weight / Quantity Text */}
                <p
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#64748b',
                    margin: '0 0 10px 0',
                  }}
                >
                  {product.raw_quantity || `${product.weight_g || 100} g`}
                </p>

                {/* 5. Bottom Row: Price and Vivid Green Pill Stepper Button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                      ₹{product.selling_price.toFixed(0)}
                    </div>
                    {hasDiscount && product.mrp > product.selling_price && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#94a3b8',
                          textDecoration: 'line-through',
                          fontWeight: 600,
                          marginTop: '2px',
                        }}
                      >
                        ₹{product.mrp.toFixed(0)}
                      </div>
                    )}
                  </div>

                  {/* Quantity Action: Green Pill Stepper Button (Matches attached design: [ - 1 + ]) */}
                  {currentQtyInCart > 0 ? (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#2e7d32',
                        borderRadius: '8px',
                        padding: '2px 4px',
                        width: '80px',
                        height: '32px',
                        boxShadow: '0 2px 8px rgba(46, 125, 50, 0.35)',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleQuantityDecrement(e, product)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ffffff',
                          cursor: 'pointer',
                          padding: '0 6px',
                          fontSize: '16px',
                          fontWeight: 900,
                          lineHeight: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Decrease"
                      >
                        &minus;
                      </button>
                      <span
                        style={{
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 800,
                          minWidth: '16px',
                          textAlign: 'center',
                        }}
                      >
                        {currentQtyInCart}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(e, product)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ffffff',
                          cursor: 'pointer',
                          padding: '0 6px',
                          fontSize: '16px',
                          fontWeight: 900,
                          lineHeight: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Increase"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, product)}
                      style={{
                        background: '#2e7d32',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 16px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(46, 125, 50, 0.35)',
                        transition: 'transform 0.15s ease, background 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#256629';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#2e7d32';
                      }}
                      title="Add to cart"
                    >
                      <span>ADD</span>
                      <span style={{ fontSize: '13px', fontWeight: 900 }}>+</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </main>

      {/* =========================================================================
          INTERACTIVE GRAMS & QUANTITY CONFIGURATOR SHEET
          ========================================================================= */}
      {selectedProduct && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 90,
            background: 'rgba(15, 23, 42, 0.35)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '32px',
              border: '2px solid rgba(255, 255, 255, 0.98)',
              boxShadow: '0 25px 60px rgba(59, 130, 246, 0.25)',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {/* Header: Title and Close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={getPackagingImage(selectedProduct)}
                  alt={selectedProduct.product_name}
                  style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {selectedProduct.product_name}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    {selectedProduct.brand} &bull; {selectedProduct.raw_quantity || `${selectedProduct.weight_g} g`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: '1.5px solid rgba(255, 255, 255, 0.95)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                  transition: 'all 0.15s ease',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                title="Close"
              >
                <X style={{ width: '18px', height: '18px', strokeWidth: 2.8, pointerEvents: 'none' }} />
              </button>
            </div>

            {/* Stepper Controls */}
            <div
              style={{
                background: 'rgba(238, 245, 255, 0.7)',
                borderRadius: '20px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', display: 'block' }}>
                  SELECT QUANTITY
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                  Total Weight: {(selectedProduct.weight_g || 100) * configQuantity}g
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  type="button"
                  onClick={() => setConfigQuantity((q) => Math.max(1, q - 1))}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                  title="Decrease quantity"
                >
                  <GlassIcon icon={Minus} color="pink" shape="circle" size={32} strokeWidth={3} />
                </button>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', minWidth: '24px', textAlign: 'center' }}>
                  {configQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setConfigQuantity((q) => q + 1)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                  title="Increase quantity"
                >
                  <GlassIcon icon={Plus} color="cyan" shape="circle" size={32} strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Total Price & Add to Cart button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
              <div>
                <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, display: 'block' }}>
                  Total Price:
                </span>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#2563eb' }}>
                  ₹{(selectedProduct.selling_price * configQuantity).toFixed(0)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleConfiguredAdd}
                style={{
                  background: 'linear-gradient(90deg, #0ea5e9 0%, #2563eb 100%)',
                  color: '#ffffff',
                  borderRadius: '9999px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
                }}
              >
                Add to Cart ({configQuantity})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
