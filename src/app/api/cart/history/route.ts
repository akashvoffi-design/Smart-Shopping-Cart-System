import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { CartAccountSession, CartHistoryItem } from '@/lib/cart-store';

// ─────────────────────────────────────────────────────────────
// GET /api/cart/history
// Returns the authenticated user's orders from Supabase.
// Falls back to an empty array for guests.
// ─────────────────────────────────────────────────────────────
export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const searchParams = _request.nextUrl.searchParams;
    const queryEmail = searchParams.get('email')?.trim().toLowerCase() || null;

    // 1. Try to get authenticated user from Supabase session
    let authUser: { id: string; email?: string; user_metadata?: Record<string, any> } | null = null;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        authUser = data.user;
      }
    } catch {
      // Not logged into Supabase auth session
    }

    let targetUserId: string | null = authUser?.id ?? null;
    let customerEmail: string = authUser?.email ?? queryEmail ?? '';
    let customerName: string = authUser?.user_metadata?.full_name ?? authUser?.email ?? 'Customer';

    // 2. If no auth session, try to locate customer profile by email
    if (!targetUserId && queryEmail) {
      try {
        const { data: cust } = await supabase
          .from('customers')
          .select('id, email, full_name')
          .eq('email', queryEmail)
          .maybeSingle();

        if (cust?.id) {
          targetUserId = cust.id;
          if (cust.full_name) customerName = cust.full_name;
          if (cust.email) customerEmail = cust.email;
        }
      } catch (custErr) {
        console.warn('[CartHistory GET] Customer lookup notice:', custErr);
      }
    }

    // 3. If neither auth session nor customer record exists, return clean unauthenticated state
    if (!targetUserId) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        history: [],
        message: 'Sign in to view your account purchase history.',
      });
    }

    // 4. Fetch confirmed orders from Supabase for this user (by user_id or customer_email)
    let ordersQuery = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        user_id,
        payment_status,
        order_status,
        status,
        subtotal,
        discount_total,
        tax_total,
        grand_total,
        item_count,
        total_weight_g,
        payment_reference,
        correlation_id,
        created_at,
        updated_at,
        order_items (
          id,
          barcode,
          product_name,
          brand,
          quantity,
          unit_price,
          mrp,
          line_total,
          weight_g
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (targetUserId && customerEmail) {
      ordersQuery = ordersQuery.or(`user_id.eq.${targetUserId},customer_email.eq.${customerEmail}`);
    } else if (targetUserId) {
      ordersQuery = ordersQuery.eq('user_id', targetUserId);
    } else if (customerEmail) {
      ordersQuery = ordersQuery.eq('customer_email', customerEmail);
    }

    let { data: orders, error: ordersError } = await ordersQuery;

    // Graceful fallback if customer_email column does not exist yet
    if (ordersError && (ordersError.message.includes('customer_email') || ordersError.code === '42703')) {
      console.warn('[CartHistory GET] Falling back to user_id query:', ordersError.message);
      let fallbackQuery = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          user_id,
          payment_status,
          order_status,
          status,
          subtotal,
          discount_total,
          tax_total,
          grand_total,
          item_count,
          total_weight_g,
          payment_reference,
          correlation_id,
          created_at,
          updated_at,
          order_items (
            id,
            barcode,
            product_name,
            brand,
            quantity,
            unit_price,
            mrp,
            line_total,
            weight_g
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (targetUserId) {
        fallbackQuery = fallbackQuery.eq('user_id', targetUserId);
      }
      const fallbackRes = await fallbackQuery;
      orders = fallbackRes.data;
      ordersError = fallbackRes.error;
    }

    if (ordersError) {
      console.warn('[CartHistory GET] Supabase query notice (returning empty history):', ordersError.message);
      return NextResponse.json({
        success: true,
        authenticated: true,
        user_id: targetUserId,
        history: [],
      });
    }

    // ── Transform Supabase rows → CartAccountSession format ──
    const history: CartAccountSession[] = (orders ?? []).map((order) => {
      const items: CartHistoryItem[] = (order.order_items ?? []).map((oi: any) => ({
        barcode: oi.barcode ?? '',
        product_name: oi.product_name ?? 'Item',
        quantity: Number(oi.quantity) || 1,
        unit_price: Number(oi.unit_price) || 0,
        line_total: Number(oi.line_total) || 0,
        weight_g: Number(oi.weight_g) || 0,
      }));

      return {
        id: order.id,
        cart_code: order.order_number ?? `#${order.id.slice(0, 8)}`,
        customer_email: customerEmail,
        customer_name: customerName,
        status: mapPaymentStatus(order.payment_status || order.status),
        items,
        item_count: Number(order.item_count) || items.length,
        grand_total: Number(order.grand_total) || 0,
        subtotal_mrp: Number(order.subtotal) || 0,
        discount_total: Number(order.discount_total) || 0,
        tax_total: Number(order.tax_total) || 0,
        payment_status: order.payment_status || order.status,
        order_status: order.order_status,
        payment_reference: order.payment_reference,
        created_at: order.created_at,
        completed_at: order.updated_at ?? order.created_at,
      };
    });

    console.info(`[CartHistory GET] Returned ${history.length} orders for account ${customerEmail || targetUserId}`);

    return NextResponse.json({
      success: true,
      authenticated: true,
      user_id: targetUserId,
      history,
    });
  } catch (err: unknown) {
    console.error('[CartHistory GET] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message || 'Failed to fetch purchase history' },
      { status: 500 }
    );
  }
}

function mapPaymentStatus(status: string | null): 'active' | 'completed' | 'archived' {
  if (status === 'paid') return 'completed';
  if (status === 'failed') return 'archived';
  return 'active';
}

// ─────────────────────────────────────────────────────────────
// POST /api/cart/history  — Manual save endpoint (legacy support)
// For the demo flow, payment verification is the canonical save path.
// This endpoint provides a secondary save for edge cases.
// ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_number, items, grand_total, payment_method, idempotency_key } = body;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to save purchase history.' },
        { status: 401 }
      );
    }

    const orderNum = order_number || `SC-${Date.now().toString().slice(-6)}`;

    // ── Insert order ──
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('order_number', orderNum)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingOrder?.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: 'Order already recorded.',
      });
    }

    const amount = Number(grand_total) || 0;
    const itemCount = (items ?? []).reduce((acc: number, it: any) => acc + (it.quantity || 1), 0);

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .upsert(
        {
          order_number: orderNum,
          user_id: user.id,
          idempotency_key: idempotency_key ?? null,
          payment_status: 'paid',
          order_status: 'completed',
          status: 'paid',
          subtotal: amount,
          discount_total: 0,
          tax_total: Math.round(amount * 0.05 * 100) / 100,
          grand_total: amount,
          item_count: itemCount,
          total_weight_g: 0,
          correlation_id: idempotency_key ?? `manual_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'order_number' }
      )
      .select()
      .single();

    if (orderError) {
      console.error('[CartHistory POST] Order upsert error:', orderError.message);
      return NextResponse.json(
        { success: false, error: orderError.message },
        { status: 500 }
      );
    }

    // ── Insert order items ──
    if (orderData && items && items.length > 0) {
      const itemsPayload = items.map((it: any) => ({
        order_id: orderData.id,
        barcode: it.barcode ?? '',
        product_name: it.product_name ?? 'Item',
        brand: it.brand ?? '',
        quantity: it.quantity || 1,
        unit_price: Number(it.unit_price) || 0,
        mrp: Number(it.mrp ?? it.unit_price) || 0,
        line_total: Number(it.line_total) || 0,
        weight_g: Number(it.weight_g) || 0,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsPayload);

      if (itemsError) {
        console.error('[CartHistory POST] Order items insert error:', itemsError.message);
      }

      // Record payment entry
      await supabase.from('payments').upsert(
        {
          order_id: orderData.id,
          provider: 'demo',
          amount,
          status: 'paid',
          correlation_id: idempotency_key ?? `manual_pay_${Date.now()}`,
          payment_method: payment_method ?? 'UPI Demo',
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        { onConflict: 'correlation_id' }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Purchase history saved to Supabase.',
      order_id: orderData?.id,
    });
  } catch (err: unknown) {
    console.error('[CartHistory POST] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message || 'Failed to save purchase history' },
      { status: 500 }
    );
  }
}
