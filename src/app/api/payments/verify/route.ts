import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { paymentSessions } from '@/lib/payment-store';

// ─────────────────────────────────────────────────────────────
// POST /api/payments/verify
// Verifies a demo-simulated or real payment, then atomically
// marks the order as paid in Supabase. Idempotent.
// ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      payment_id,
      correlation_id,
      order_id,           // Supabase UUID of the order
      simulate_test_result,
      order_number,
      grand_total,
      payment_method,
    } = body;

    const key = payment_id || correlation_id || order_id;
    if (!key) {
      return NextResponse.json({ error: 'payment_id or order_id required' }, { status: 400 });
    }

    // ── Retrieve or synthesize payment session ──
    const session = paymentSessions.get(key) || {
      id: payment_id || `pay_${Date.now()}`,
      order_id: order_id || '',
      order_number: order_number || `SC-${Date.now().toString().slice(-6)}`,
      amount: Number(grand_total) || 30.0,
      provider: 'demo' as const,
      status: 'pending' as const,
      correlation_id: correlation_id || `corr_${Date.now()}`,
      upi_uri: '',
      paid_at: null,
      created_at: new Date().toISOString(),
    };

    // ── Guard against double-processing ──
    if (session.status === 'paid') {
      return NextResponse.json({
        verified: true,
        status: 'paid',
        duplicate: true,
        message: 'Payment already confirmed (idempotent).',
        payment: session,
      });
    }

    // ── Determine provider mode ──
    const hasLiveProvider = Boolean(
      process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    );

    // ─────── DEMO MODE ───────
    if (!hasLiveProvider) {
      if (simulate_test_result === 'success') {
        session.status = 'paid';
        session.paid_at = new Date().toISOString();

        // ── Persist confirmation to Supabase atomically ──
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        let currentUserId: string | null = null;
        try {
          const { data } = await supabase.auth.getUser();
          if (data?.user) currentUserId = data.user.id;
        } catch {}

        if (!currentUserId && (body.customer_email || body.email)) {
          const emailToLook = (body.customer_email || body.email).trim().toLowerCase();
          try {
            const { data: cust } = await supabase
              .from('customers')
              .select('id')
              .eq('email', emailToLook)
              .maybeSingle();
            if (cust?.id) currentUserId = cust.id;
          } catch {}
        }

        let supabaseError: string | null = null;

        if (order_id) {
          // Verify the order exists
          let orderQuery = supabase
            .from('orders')
            .select('id, user_id, payment_status')
            .eq('id', order_id);

          if (currentUserId) {
            orderQuery = orderQuery.eq('user_id', currentUserId);
          }

          const { data: existingOrder, error: fetchError } = await orderQuery.maybeSingle();

          if (fetchError) {
            console.error('[PaymentVerify] Order fetch error:', fetchError.message);
            supabaseError = fetchError.message;
          } else if (!existingOrder) {
            console.warn('[PaymentVerify] Order not found or not owned by user:', order_id);
            supabaseError = 'Order not found or access denied';
          } else if (existingOrder.payment_status === 'paid') {
            // Already paid — idempotent
            console.info('[PaymentVerify] Order already marked paid (idempotent):', order_id);
          } else {
            // Call the atomic DB function to mark paid and insert payment record
            const payRef = `DEMO-${order_id.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`;
            const { error: rpcError } = await supabase.rpc('confirm_order_payment', {
              p_order_id: order_id,
              p_payment_reference: payRef,
              p_amount: Number(grand_total) || session.amount,
              p_provider: 'demo',
              p_payment_method: payment_method || 'UPI Demo',
              p_correlation_id: correlation_id || session.correlation_id,
            });

            if (rpcError) {
              console.warn('[PaymentVerify] RPC confirm_order_payment notice (trying direct update):', rpcError.message);
              const { error: directUpdateError } = await supabase
                .from('orders')
                .update({
                  payment_status: 'paid',
                  order_status: 'processing',
                  status: 'paid',
                  payment_reference: payRef,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', order_id);

              if (directUpdateError) {
                console.error('[PaymentVerify] Direct order update error:', directUpdateError.message);
                supabaseError = directUpdateError.message;
              } else {
                console.info(`[PaymentVerify] ✓ Order ${order_number} marked paid via direct update`);
                // Insert payment record
                try {
                  await supabase.from('payments').insert({
                    order_id,
                    provider: 'demo',
                    provider_reference: payRef,
                    amount: Number(grand_total) || session.amount,
                    status: 'paid',
                    correlation_id: correlation_id || session.correlation_id,
                    payment_method: payment_method || 'UPI Demo',
                    paid_at: new Date().toISOString(),
                  });
                } catch {}
              }
            } else {
              console.info(`[PaymentVerify] ✓ Order ${order_number} marked paid in Supabase via RPC`);
            }
          }
        } else if (!currentUserId) {
          // Guest checkout — no Supabase persistence needed
          console.info('[PaymentVerify] Guest payment confirmed (not persisted).');
        } else {
          console.warn('[PaymentVerify] Missing order_id — cannot update Supabase order.');
        }

        return NextResponse.json({
          verified: true,
          status: 'paid',
          mode: 'demo_test',
          supabase_error: supabaseError,
          message: supabaseError
            ? `Payment verified but Supabase update failed: ${supabaseError}`
            : 'DEMO: Simulated payment confirmed and saved to Supabase.',
          payment: session,
          server_timestamp: new Date().toISOString(),
        });

      } else if (simulate_test_result === 'fail') {
        session.status = 'failed';

        // Update order status to failed in Supabase
        try {
          if (order_id) {
            const cookieStore = await cookies();
            const supabase = createClient(cookieStore);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase
                .from('orders')
                .update({
                  payment_status: 'failed',
                  order_status: 'cancelled',
                  status: 'failed',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', order_id)
                .eq('user_id', user.id);
            }
          }
        } catch (updateErr) {
          console.warn('[PaymentVerify] Failed to update order to failed state:', updateErr);
        }

        return NextResponse.json({
          verified: false,
          status: 'failed',
          mode: 'demo_test',
          message: 'DEMO: Simulated payment failure recorded.',
          payment: session,
        });

      } else {
        return NextResponse.json({
          verified: false,
          status: session.status,
          mode: 'demo_test',
          message: 'Awaiting payment confirmation. Use simulate_test_result=success|fail.',
          payment: session,
        });
      }
    }

    // ─────── LIVE PROVIDER (Razorpay, etc.) ───────
    // TODO: Verify Razorpay signature here when keys are provided
    // const isValid = verifyRazorpaySignature(body);
    return NextResponse.json({
      verified: false,
      status: 'pending',
      message: 'Live provider: awaiting verified webhook signature from payment gateway.',
    });

  } catch (err: unknown) {
    console.error('[PaymentVerify] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to verify payment', details: (err as Error).message },
      { status: 500 }
    );
  }
}
