import { NextRequest, NextResponse } from 'next/server';
import { getProductByBarcode } from '@/lib/products';
import { CartItem, CartSummary } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawItems: Array<{ barcode: string; quantity: number }> = body.items || [];
    const correlationId = body.correlation_id || `val_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const validatedItems: CartItem[] = [];
    let subtotal_mrp = 0;
    let grand_total = 0;
    let total_weight_g = 0;
    let item_count = 0;
    const errors: string[] = [];

    for (const item of rawItems) {
      const product = getProductByBarcode(item.barcode);
      if (!product) {
        errors.push(`Barcode ${item.barcode} not found in product catalogue`);
        continue;
      }

      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const line_total = Math.round(product.selling_price * qty * 100) / 100;
      const line_weight = Math.round((product.weight_g || 100) * qty * 10) / 10;

      item_count += qty;
      subtotal_mrp += product.mrp * qty;
      grand_total += line_total;
      total_weight_g += line_weight;

      validatedItems.push({
        id: `ci_${product.barcode}`,
        barcode: product.barcode,
        product,
        quantity: qty,
        unit_price: product.selling_price,
        mrp: product.mrp,
        line_total,
        weight_g: product.weight_g,
        total_weight_g: line_weight,
        added_at: new Date().toISOString(),
        correlation_id: correlationId,
      });
    }

    const discount_total = Math.max(0, subtotal_mrp - grand_total);
    const savings_pct = subtotal_mrp > 0 ? (discount_total / subtotal_mrp) * 100 : 0;

    const summary: CartSummary = {
      items: validatedItems,
      item_count,
      subtotal_mrp: Math.round(subtotal_mrp * 100) / 100,
      discount_total: Math.round(discount_total * 100) / 100,
      grand_total: Math.round(grand_total * 100) / 100,
      total_weight_g: Math.round(total_weight_g * 10) / 10,
      savings_pct: Math.round(savings_pct * 10) / 10,
    };

    return NextResponse.json({
      valid: errors.length === 0,
      server_timestamp: new Date().toISOString(),
      correlation_id: correlationId,
      summary,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Failed to validate cart', details: (err as Error).message },
      { status: 500 }
    );
  }
}
