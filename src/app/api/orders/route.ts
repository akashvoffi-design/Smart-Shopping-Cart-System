import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getProductByBarcode, checkProductStock, deductProductStock } from '@/lib/products';
import { CartItem } from '@/types';

// ─────────────────────────────────────────────────────────────
// POST /api/orders  — Create a verified order snapshot in Supabase
// ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawItems: Array<{ barcode: string; quantity: number }> = body.items || [];
    const idempotencyKey: string | undefined = body.idempotency_key;
    const correlationId = body.correlation_id ||
      `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!rawItems || rawItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty. Cannot create order.' }, { status: 400 });
    }

    // ── Get authenticated user from Supabase session or customer email ──
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    let userId: string | null = null;
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) userId = data.user.id;
    } catch {}

    if (!userId && body.customer_email) {
      try {
        const { data: cust } = await supabase
          .from('customers')
          .select('id')
          .eq('email', body.customer_email.trim().toLowerCase())
          .maybeSingle();
        if (cust?.id) userId = cust.id;
      } catch {}
    }

    // ── Authoritative stock recheck & re-price all line items ──
    const lineItems: CartItem[] = [];
    let subtotal_mrp = 0;
    let grand_total = 0;
    let total_weight_g = 0;
    let item_count = 0;

    for (const item of rawItems) {
      const product = getProductByBarcode(item.barcode);
      if (!product) {
        return NextResponse.json(
          { error: `Product with barcode ${item.barcode} is not in store database.` },
          { status: 400 }
        );
      }

      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const stockResult = checkProductStock(item.barcode);
      if (!stockResult.in_stock || stockResult.stock_quantity <= 0) {
        return NextResponse.json(
          { error: `"${product.product_name}" is Out of Stock.`, barcode: item.barcode },
          { status: 400 }
        );
      }
      if (qty > stockResult.stock_quantity) {
        return NextResponse.json(
          {
            error: `Only ${stockResult.stock_quantity} units of "${product.product_name}" available (requested ${qty}).`,
            barcode: item.barcode,
          },
          { status: 400 }
        );
      }

      const line_total = Math.round(product.selling_price * qty * 100) / 100;
      const line_weight = Math.round((product.weight_g || 100) * qty * 10) / 10;

      item_count += qty;
      subtotal_mrp += product.mrp * qty;
      grand_total += line_total;
      total_weight_g += line_weight;

      deductProductStock(item.barcode, qty);

      lineItems.push({
        id: `li_${product.barcode}_${qty}`,
        barcode: product.barcode,
        product,
        quantity: qty,
        unit_price: product.selling_price,
        mrp: product.mrp,
        line_total,
        weight_g: product.weight_g,
        total_weight_g: line_weight,
        added_at: new Date().toISOString(),
      });
    }

    const discount_total = Math.round(Math.max(0, subtotal_mrp - grand_total) * 100) / 100;
    const tax_total = Math.round(grand_total * 0.05 * 100) / 100;
    const orderNumber = `SC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // ── Build the order object returned to the client ──
    const order = {
      id: `ord_${Date.now()}`,
      order_number: orderNumber,
      user_id: userId,
      idempotency_key: idempotencyKey,
      items: lineItems,
      subtotal_mrp: Math.round(subtotal_mrp * 100) / 100,
      discount_total,
      tax_total,
      grand_total: Math.round(grand_total * 100) / 100,
      item_count,
      total_weight_g: Math.round(total_weight_g * 10) / 10,
      status: 'pending' as const,
      correlation_id: correlationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // ── Persist to Supabase when user or customer email is present ──
    const customerEmail = (body.customer_email || '').trim().toLowerCase() || null;
    const customerName = (body.customer_name || '').trim() || 'Customer';
    let supabaseOrderId: string | null = null;

    if (userId || customerEmail) {
      try {
        const itemsPayload = lineItems.map((li) => ({
          barcode: li.barcode,
          product_name: li.product?.product_name ?? 'Item',
          brand: li.product?.brand ?? '',
          quantity: li.quantity,
          unit_price: li.unit_price,
          mrp: li.mrp,
          line_total: li.line_total,
          weight_g: li.weight_g,
          product_id: null,
        }));

        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          'create_order_with_items',
          {
            p_order_number: orderNumber,
            p_user_id: userId,
            p_idempotency_key: idempotencyKey ?? null,
            p_subtotal: Math.round(subtotal_mrp * 100) / 100,
            p_discount_total: discount_total,
            p_tax_total: tax_total,
            p_grand_total: Math.round(grand_total * 100) / 100,
            p_item_count: item_count,
            p_total_weight_g: Math.round(total_weight_g * 10) / 10,
            p_correlation_id: correlationId,
            p_items: JSON.stringify(itemsPayload),
            p_customer_email: customerEmail,
            p_customer_name: customerName,
          }
        );

        if (rpcError) {
          console.warn('[Orders API] Supabase RPC notice (trying direct insert fallback):', rpcError.message);
          
          // Direct insert fallback
          const orderInsertData: Record<string, any> = {
            order_number: orderNumber,
            subtotal: Math.round(subtotal_mrp * 100) / 100,
            discount_total,
            tax_total,
            grand_total: Math.round(grand_total * 100) / 100,
            item_count,
            total_weight_g: Math.round(total_weight_g * 10) / 10,
            status: 'pending',
            payment_status: 'pending',
            correlation_id: correlationId,
            idempotency_key: idempotencyKey ?? null,
          };
          if (customerEmail) orderInsertData.customer_email = customerEmail;
          if (customerName) orderInsertData.customer_name = customerName;

          const { data: directOrder, error: directError } = await supabase
            .from('orders')
            .insert(orderInsertData)
            .select('id')
            .single();

          if (!directError && directOrder?.id) {
            supabaseOrderId = directOrder.id;
            order.id = directOrder.id;
            const itemsRows = lineItems.map((li) => ({
              order_id: directOrder.id,
              barcode: li.barcode,
              product_name: li.product?.product_name ?? 'Item',
              brand: li.product?.brand ?? '',
              quantity: li.quantity,
              unit_price: li.unit_price,
              mrp: li.mrp,
              line_total: li.line_total,
              weight_g: li.weight_g,
            }));
            await supabase.from('order_items').insert(itemsRows);
            console.info(`[Orders API] Order ${orderNumber} saved via direct insert → id: ${supabaseOrderId}`);
          } else if (directError) {
            console.error('[Orders API] Direct order insert error:', directError.message);
          }
        } else {
          supabaseOrderId = (rpcResult as any)?.order_id ?? null;
          if (supabaseOrderId) {
            order.id = supabaseOrderId;
          }
          console.info(`[Orders API] Order ${orderNumber} saved → Supabase id: ${supabaseOrderId}`);
        }
      } catch (dbErr) {
        console.error('[Orders API] Unexpected Supabase error:', dbErr);
      }
    } else {
      console.info('[Orders API] Guest checkout — order not persisted (no authenticated user or email).');
    }

    return NextResponse.json({
      success: true,
      order,
      supabase_order_id: supabaseOrderId,
      server_timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[Orders API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to create order', details: (err as Error).message },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/orders?id=<id>&order_number=<num>
// ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const orderNumber = searchParams.get('order_number');

  if (!id && !orderNumber) {
    return NextResponse.json({ error: 'Order ID or order_number required' }, { status: 400 });
  }

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id);

    if (id) {
      query = query.eq('id', id);
    } else if (orderNumber) {
      query = query.eq('order_number', orderNumber);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order: data });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Failed to fetch order', details: (err as Error).message },
      { status: 500 }
    );
  }
}
