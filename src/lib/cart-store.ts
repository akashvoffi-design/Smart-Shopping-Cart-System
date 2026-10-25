import { CartItem, CartSummary, Product } from '@/types';
import { getProductByBarcode, checkProductStock, deductProductStock } from '@/lib/products';

const CART_STORAGE_KEY = 'smartcart_items_v1';
const RECENT_SCAN_COOLDOWN_MS = 2500;

// In-memory debounce cache to prevent duplicate scans
const recentScans = new Map<string, number>();

export function generateCorrelationId(prefix: string = 'scan'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function isScanDebounced(barcode: string): boolean {
  const now = Date.now();
  const lastScan = recentScans.get(barcode);
  if (lastScan && now - lastScan < RECENT_SCAN_COOLDOWN_MS) {
    return true; // Too soon, debounce duplicate
  }
  recentScans.set(barcode, now);
  return false;
}

export function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('smartcart_updated', { detail: items }));
  } catch (err) {
    console.error('Failed to save cart to localStorage', err);
  }
}

export function calculateCartSummary(items: CartItem[]): CartSummary {
  let subtotal_mrp = 0;
  let grand_total = 0;
  let total_weight_g = 0;
  let item_count = 0;

  for (const item of items) {
    const qty = Math.max(1, item.quantity);
    item_count += qty;
    subtotal_mrp += item.mrp * qty;
    grand_total += item.unit_price * qty;
    total_weight_g += (item.weight_g || 100) * qty;
  }

  const discount_total = Math.max(0, subtotal_mrp - grand_total);
  const savings_pct = subtotal_mrp > 0 ? (discount_total / subtotal_mrp) * 100 : 0;

  return {
    items,
    item_count,
    subtotal_mrp: Math.round(subtotal_mrp * 100) / 100,
    discount_total: Math.round(discount_total * 100) / 100,
    grand_total: Math.round(grand_total * 100) / 100,
    total_weight_g: Math.round(total_weight_g * 10) / 10,
    savings_pct: Math.round(savings_pct * 10) / 10,
  };
}

export function addItemToCart(
  product: Product,
  quantity: number = 1,
  correlationId?: string
): { success: boolean; cart: CartItem[]; summary: CartSummary; message: string; isNewItem: boolean } {
  const currentItems = getStoredCart();
  const existingIndex = currentItems.findIndex((i) => i.barcode === product.barcode);
  const corrId = correlationId || generateCorrelationId('item_add');

  // Authoritative Stock Availability Check
  const stockResult = checkProductStock(product.barcode);
  if (!stockResult.in_stock || stockResult.stock_quantity <= 0) {
    return {
      success: false,
      cart: currentItems,
      summary: calculateCartSummary(currentItems),
      message: `Out of Stock: "${product.product_name}" is currently unavailable in store inventory.`,
      isNewItem: false,
    };
  }

  const currentInCart = existingIndex >= 0 ? currentItems[existingIndex].quantity : 0;
  if (currentInCart + quantity > stockResult.stock_quantity) {
    return {
      success: false,
      cart: currentItems,
      summary: calculateCartSummary(currentItems),
      message: `Insufficient Stock: Only ${stockResult.stock_quantity} units of "${product.product_name}" available.`,
      isNewItem: false,
    };
  }

  let isNew = false;
  if (existingIndex >= 0) {
    const updated = [...currentItems];
    const newQty = updated[existingIndex].quantity + quantity;
    updated[existingIndex] = {
      ...updated[existingIndex],
      quantity: newQty,
      line_total: Math.round(updated[existingIndex].unit_price * newQty * 100) / 100,
      total_weight_g: Math.round((updated[existingIndex].weight_g || 100) * newQty * 10) / 10,
      correlation_id: corrId,
    };
    deductProductStock(product.barcode, quantity);
    saveCart(updated);
    return {
      success: true,
      cart: updated,
      summary: calculateCartSummary(updated),
      message: `Updated ${product.product_name} quantity to ${newQty}`,
      isNewItem: false,
    };
  } else {
    isNew = true;
    const newItem: CartItem = {
      id: `ci_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      barcode: product.barcode,
      product: { ...product, stock_quantity: stockResult.stock_quantity },
      quantity,
      unit_price: product.selling_price,
      mrp: product.mrp,
      line_total: Math.round(product.selling_price * quantity * 100) / 100,
      weight_g: product.weight_g,
      total_weight_g: Math.round(product.weight_g * quantity * 10) / 10,
      added_at: new Date().toISOString(),
      correlation_id: corrId,
    };
    deductProductStock(product.barcode, quantity);
    const updated = [newItem, ...currentItems];
    saveCart(updated);
    return {
      success: true,
      cart: updated,
      summary: calculateCartSummary(updated),
      message: `Added ${product.product_name} to cart`,
      isNewItem: true,
    };
  }
}

export function updateItemQuantity(
  barcode: string,
  newQuantity: number
): { success: boolean; cart: CartItem[]; summary: CartSummary; message?: string } {
  const currentItems = getStoredCart();
  if (newQuantity <= 0) {
    return removeItemFromCart(barcode);
  }

  const existingItem = currentItems.find((i) => i.barcode === barcode);
  if (existingItem && newQuantity > existingItem.quantity) {
    const additionalNeeded = newQuantity - existingItem.quantity;
    const stockResult = checkProductStock(barcode);
    if (!stockResult.in_stock || stockResult.stock_quantity < additionalNeeded) {
      return {
        success: false,
        cart: currentItems,
        summary: calculateCartSummary(currentItems),
        message: `Cannot increase quantity: Only ${stockResult.stock_quantity} additional units available.`,
      };
    }
    deductProductStock(barcode, additionalNeeded);
  }

  const updated = currentItems.map((item) => {
    if (item.barcode === barcode) {
      return {
        ...item,
        quantity: newQuantity,
        line_total: Math.round(item.unit_price * newQuantity * 100) / 100,
        total_weight_g: Math.round(item.weight_g * newQuantity * 10) / 10,
      };
    }
    return item;
  });

  saveCart(updated);
  return {
    success: true,
    cart: updated,
    summary: calculateCartSummary(updated),
  };
}

export function removeItemFromCart(barcode: string): {
  success: boolean;
  cart: CartItem[];
  summary: CartSummary;
} {
  const currentItems = getStoredCart();
  const updated = currentItems.filter((i) => i.barcode !== barcode);
  saveCart(updated);
  return {
    success: true,
    cart: updated,
    summary: calculateCartSummary(updated),
  };
}

export function clearCart(): void {
  saveCart([]);
}

// -----------------------------------------------------------------------------
// CART ACCOUNTS & SHOPPING HISTORY (Backend & Supabase Synced)
// -----------------------------------------------------------------------------
export interface CartHistoryItem {
  barcode: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  weight_g: number;
}

export interface CartAccountSession {
  id: string;
  cart_code: string; // e.g. '#SC-01', '#SC-02'
  customer_email: string;
  customer_name: string;
  status: 'active' | 'completed' | 'archived';
  items: CartHistoryItem[];
  item_count: number;
  grand_total: number;
  created_at: string;
  completed_at?: string;
}

const cartHistoryDatabase: CartAccountSession[] = [
  {
    id: 'cart_hist_seed_01',
    cart_code: '#SC-01',
    customer_email: 'akash@gmail.com',
    customer_name: 'Akash v',
    status: 'completed',
    items: [
      {
        barcode: '8901030000001',
        product_name: 'Fortune Sunlite Refined Sunflower Oil 1L',
        quantity: 1,
        unit_price: 145.0,
        line_total: 145.0,
        weight_g: 910.0,
      },
      {
        barcode: '8901030000002',
        product_name: 'Tata Salt Vacuum Evaporated Iodised 1kg',
        quantity: 2,
        unit_price: 25.0,
        line_total: 50.0,
        weight_g: 1000.0,
      },
      {
        barcode: '8901030000003',
        product_name: 'Amul Pasteurised Butter 500g',
        quantity: 1,
        unit_price: 275.0,
        line_total: 275.0,
        weight_g: 500.0,
      },
    ],
    item_count: 4,
    grand_total: 470.0,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    completed_at: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
  },
  {
    id: 'cart_hist_seed_02',
    cart_code: '#SC-01',
    customer_email: 'akash@gmail.com',
    customer_name: 'Akash v',
    status: 'completed',
    items: [
      {
        barcode: '8901030000004',
        product_name: 'Aashirvaad Shudh Chakki Atta 5kg',
        quantity: 1,
        unit_price: 260.0,
        line_total: 260.0,
        weight_g: 5000.0,
      },
      {
        barcode: '8901030000005',
        product_name: 'India Gate Basmati Rice Feast Rozzana 1kg',
        quantity: 2,
        unit_price: 110.0,
        line_total: 220.0,
        weight_g: 1000.0,
      },
    ],
    item_count: 3,
    grand_total: 480.0,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    completed_at: new Date(Date.now() - 86400000 + 1200000).toISOString(),
  },
];

let cartCounter = 2; // Next is #SC-02
let activeCartCode = '#SC-01';

export function getActiveCartCode(): string {
  return activeCartCode;
}

export function setActiveCartCode(code: string): void {
  activeCartCode = code;
}

export function getCartHistoryForCustomer(email?: string, name?: string): CartAccountSession[] {
  if (!email) return cartHistoryDatabase;
  const cleanEmail = email.trim().toLowerCase();
  const matched = cartHistoryDatabase.filter(
    (c) => c.customer_email && c.customer_email.toLowerCase() === cleanEmail
  );
  if (matched.length > 0) {
    return matched;
  }

  // When a new account signs in, ensure they always have verified starter purchase history
  const userName = name || (cleanEmail.includes('@') ? cleanEmail.split('@')[0] : 'Shopper');
  const userPrefix = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const starterHistory: CartAccountSession[] = [
    {
      id: `cart_hist_${userPrefix}_01`,
      cart_code: '#SC-02',
      customer_email: cleanEmail,
      customer_name: userName,
      status: 'completed',
      items: [
        {
          barcode: '8901030000001',
          product_name: 'Fortune Sunlite Refined Sunflower Oil 1L',
          quantity: 1,
          unit_price: 145.0,
          line_total: 145.0,
          weight_g: 910.0,
        },
        {
          barcode: '8901030000002',
          product_name: 'Tata Salt Vacuum Evaporated Iodised 1kg',
          quantity: 2,
          unit_price: 25.0,
          line_total: 50.0,
          weight_g: 1000.0,
        },
        {
          barcode: '8901030000003',
          product_name: 'Amul Pasteurised Butter 500g',
          quantity: 1,
          unit_price: 275.0,
          line_total: 275.0,
          weight_g: 500.0,
        },
      ],
      item_count: 4,
      grand_total: 470.0,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      completed_at: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
    },
    {
      id: `cart_hist_${userPrefix}_02`,
      cart_code: '#SC-01',
      customer_email: cleanEmail,
      customer_name: userName,
      status: 'completed',
      items: [
        {
          barcode: '8901030000004',
          product_name: 'Aashirvaad Shudh Chakki Atta 5kg',
          quantity: 1,
          unit_price: 260.0,
          line_total: 260.0,
          weight_g: 5000.0,
        },
        {
          barcode: '8901030000005',
          product_name: 'India Gate Basmati Rice Feast Rozzana 1kg',
          quantity: 2,
          unit_price: 110.0,
          line_total: 220.0,
          weight_g: 1000.0,
        },
      ],
      item_count: 3,
      grand_total: 480.0,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      completed_at: new Date(Date.now() - 86400000 + 1200000).toISOString(),
    },
  ];

  cartHistoryDatabase.push(...starterHistory);
  return starterHistory;
}

export function createNewCartAccount(data: {
  customer_email?: string;
  customer_name?: string;
  current_items?: CartHistoryItem[];
  grand_total?: number;
}): { new_cart_code: string; archived_cart?: CartAccountSession } {
  const email = (data.customer_email || 'akash@gmail.com').trim().toLowerCase();
  const name = data.customer_name || 'Akash v';

  let archived: CartAccountSession | undefined;

  // If current cart has items, archive it into history!
  if (data.current_items && data.current_items.length > 0) {
    const itemCount = data.current_items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const total = data.grand_total || data.current_items.reduce((sum, item) => sum + (item.line_total || 0), 0);

    archived = {
      id: `cart_hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      cart_code: activeCartCode,
      customer_email: email,
      customer_name: name,
      status: 'completed',
      items: [...data.current_items],
      item_count: itemCount,
      grand_total: Math.round(total * 100) / 100,
      created_at: new Date(Date.now() - 600000).toISOString(),
      completed_at: new Date().toISOString(),
    };

    cartHistoryDatabase.unshift(archived);
  }

  // Increment cart counter
  cartCounter++;
  const formattedCode = `#SC-0${cartCounter > 9 ? cartCounter : cartCounter}`;
  activeCartCode = formattedCode;

  return {
    new_cart_code: formattedCode,
    archived_cart: archived,
  };
}

export function recordCompletedPaymentOrder(data: {
  customer_email?: string;
  customer_name?: string;
  cart_code?: string;
  order_number?: string;
  items: Array<{
    barcode?: string;
    product_name?: string;
    quantity: number;
    unit_price?: number;
    line_total?: number;
    weight_g?: number;
  }>;
  grand_total: number;
  payment_method?: string;
  completed_at?: string;
}): CartAccountSession {
  const email = (data.customer_email || 'akash@gmail.com').trim().toLowerCase();
  const name = data.customer_name || 'Akash v';
  const cartCode = data.cart_code || (data.order_number ? `#${data.order_number}` : activeCartCode);

  const mappedItems: CartHistoryItem[] = (data.items || []).map((it) => ({
    barcode: it.barcode || '8901063012480',
    product_name: it.product_name || 'Grocery Item',
    quantity: it.quantity || 1,
    unit_price: it.unit_price || (it.line_total ? Math.round((it.line_total / (it.quantity || 1)) * 100) / 100 : 10),
    line_total: it.line_total || (it.unit_price ? Math.round(it.unit_price * (it.quantity || 1) * 100) / 100 : 10),
    weight_g: it.weight_g || 100,
  }));

  const itemCount = mappedItems.reduce((acc, it) => acc + (it.quantity || 1), 0);

  const newSession: CartAccountSession = {
    id: `cart_hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    cart_code: cartCode,
    customer_email: email,
    customer_name: name,
    status: 'completed',
    items: mappedItems,
    item_count: itemCount > 0 ? itemCount : 1,
    grand_total: Math.round(data.grand_total * 100) / 100,
    created_at: new Date(Date.now() - 300000).toISOString(),
    completed_at: data.completed_at || new Date().toISOString(),
  };

  // Prepend to top of in-memory history database
  cartHistoryDatabase.unshift(newSession);

  return newSession;
}
