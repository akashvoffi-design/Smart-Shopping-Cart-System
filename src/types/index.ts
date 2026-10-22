export type BarcodeType = 'authentic_ean13' | 'synthetic_demo';

export interface Product {
  barcode: string;
  barcode_type: BarcodeType;
  barcode_provenance: string;
  product_name: string;
  brand: string;
  mrp: number;
  selling_price: number;
  discount_pct: number;
  weight_g: number;
  unit_type: 'weight' | 'volume' | 'count' | 'unit' | 'unknown';
  raw_quantity: string;
  category: string;
  subcategory?: string;
  image_url?: string;
  stock_quantity?: number;
}

export interface CartItem {
  id: string;
  barcode: string;
  product: Product;
  quantity: number;
  unit_price: number;
  mrp: number;
  line_total: number;
  weight_g: number;
  total_weight_g: number;
  added_at: string;
  correlation_id?: string;
}

export interface CartSummary {
  items: CartItem[];
  item_count: number;
  subtotal_mrp: number;
  discount_total: number;
  grand_total: number;
  total_weight_g: number;
  savings_pct: number;
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export interface Order {
  id: string;
  order_number: string;
  user_id?: string | null;
  items: CartItem[];
  subtotal_mrp: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  item_count: number;
  total_weight_g: number;
  status: OrderStatus;
  correlation_id: string;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface PaymentDetails {
  id: string;
  order_id: string;
  order_number: string;
  amount: number;
  provider: 'demo' | 'razorpay' | 'upi';
  status: PaymentStatus;
  correlation_id: string;
  upi_uri: string;
  paid_at?: string | null;
  created_at: string;
}

export interface IoTTelemetry {
  device_id: string;
  weight_g: number;
  delta_g: number;
  stable: boolean;
  status: 'online' | 'offline' | 'simulated';
  timestamp: number;
  correlation_id?: string;
}

export interface VisionDetection {
  label: string;
  confidence: number;
  matched_product?: Product | null;
  timestamp: number;
  barcode?: string;
}
