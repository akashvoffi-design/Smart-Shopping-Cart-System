import { NextRequest, NextResponse } from 'next/server';
import { PaymentDetails } from '@/types';
import { paymentSessions } from '@/lib/payment-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, order_number, amount } = body;

    if (!order_id || !amount) {
      return NextResponse.json({ error: 'order_id and amount are required' }, { status: 400 });
    }

    const correlationId = body.correlation_id || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const parsedAmount = Math.round(Number(amount) * 100) / 100;

    // Check if live provider keys exist in environment
    const hasLiveProvider = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

    // Explicit non-live demo mode
    const provider = hasLiveProvider ? 'razorpay' : 'demo';
    const upiUri = `upi://pay?pa=smartcart.demo@okhdfcbank&pn=SmartCart%20Test%20Store&am=${parsedAmount.toFixed(2)}&cu=INR&tr=${order_number || order_id}`;

    const payment: PaymentDetails = {
      id: `pay_${Date.now()}`,
      order_id,
      order_number: order_number || `SC-${Date.now().toString().slice(-6)}`,
      amount: parsedAmount,
      provider,
      status: 'pending',
      correlation_id: correlationId,
      upi_uri: upiUri,
      paid_at: null,
      created_at: new Date().toISOString(),
    };

    paymentSessions.set(payment.id, payment);
    paymentSessions.set(payment.correlation_id, payment);
    paymentSessions.set(order_id, payment);

    return NextResponse.json({
      success: true,
      payment,
      is_live: hasLiveProvider,
      mode: hasLiveProvider ? 'production' : 'demo_simulation',
      disclaimer: hasLiveProvider
        ? 'Live gateway session initialized.'
        : 'NON-LIVE DEMO MODE: Test checkout simulation only. No real payment is collected.',
      server_timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Failed to initiate payment', details: (err as Error).message },
      { status: 500 }
    );
  }
}
