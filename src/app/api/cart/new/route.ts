import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { createNewCartAccount } from '@/lib/cart-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_email, customer_name, current_items, grand_total } = body;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Create new cart account in backend authoritative store
    const result = createNewCartAccount({
      customer_email,
      customer_name,
      current_items,
      grand_total,
    });

    // 2. Synchronize archived cart into Supabase orders & carts if present
    if (result.archived_cart) {
      try {
        const orderNumber = `SC-${Date.now().toString().slice(-6)}`;
        await supabase.from('orders').insert({
          order_number: orderNumber,
          status: 'completed',
          subtotal: result.archived_cart.grand_total,
          grand_total: result.archived_cart.grand_total,
          item_count: result.archived_cart.item_count,
          created_at: result.archived_cart.completed_at || new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn('Supabase order insert note:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `New Cart Account ${result.new_cart_code} generated successfully!`,
      new_cart_code: result.new_cart_code,
      archived_cart: result.archived_cart || null,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || 'Failed to generate new cart account' },
      { status: 500 }
    );
  }
}
