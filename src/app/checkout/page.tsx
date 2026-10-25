'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Receipt,
  ReceiptText,
  Scale,
  Percent,
  Wallet,
  Clock,
  Clock3,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  XCircle,
  CircleX,
  Zap,
  CheckCircle2,
  RefreshCw,
  QrCode,
  ArrowUpLeft,
  History,
} from 'lucide-react';
import GlassIcon from '@/components/GlassIcon';
import { CartItem, Order, PaymentDetails, Product } from '@/types';
import { getStoredCart, clearCart } from '@/lib/cart-store';
import QRCode from 'qrcode';

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingOrder, setLoadingOrder] = useState<boolean>(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [verificationLoading, setVerificationLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [linkedUpiId, setLinkedUpiId] = useState<string>('akash@okhdfcbank');
  const [showConfirmationPop, setShowConfirmationPop] = useState<boolean>(false);
  const [showFailurePop, setShowFailurePop] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const [merchantUpiId, setMerchantUpiId] = useState<string>(
    process.env.NEXT_PUBLIC_MERCHANT_UPI_VPA || 'kash78532@okhdfcbank'
  );

  // Generate genuine scannable UPI QR code (YouPI-PG ISO Vector format)
  const [qrSvgHtml, setQrSvgHtml] = useState<string | null>(null);

  useEffect(() => {
    const rawUri =
      payment?.upi_uri ||
      `upi://pay?pa=kash78532@okhdfcbank&pn=SmartCart%20AI%20Store&am=${(order?.grand_total || 30.0).toFixed(2)}&cu=INR&tn=Order%20${order?.order_number || 'SC-30'}&tr=${order?.order_number || 'SC-30'}`;
    
    QRCode.toString(rawUri, {
      type: 'svg',
      width: 140,
      margin: 1,
      color: {
        dark: '#ffffff',
        light: '#00000000',
      },
      errorCorrectionLevel: 'M',
    })
      .then((svgString) => {
        setQrSvgHtml(svgString);
      })
      .catch((err) => {
        console.error('Failed to generate vector UPI QR:', err);
      });
  }, [payment?.upi_uri, order?.grand_total, order?.order_number]);

  // Auto-dismiss confirmation pop after 3 seconds
  useEffect(() => {
    if (showConfirmationPop) {
      const timer = setTimeout(() => {
        setShowConfirmationPop(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfirmationPop]);

  // Auto-dismiss failure pop after 3 seconds
  useEffect(() => {
    if (showFailurePop) {
      const timer = setTimeout(() => {
        setShowFailurePop(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showFailurePop]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const upi = localStorage.getItem('smartcart_user_upi');
      if (upi) setLinkedUpiId(upi);
    }

    const stored = getStoredCart();
    setCartItems(stored);

    const initOrderAndPayment = async () => {
      try {
        setLoadingOrder(true);

        // Generate or retrieve stable checkout idempotency key
        let idempotencyKey: string | null = null;
        if (typeof window !== 'undefined') {
          idempotencyKey = sessionStorage.getItem('smartcart_checkout_key');
          if (!idempotencyKey) {
            idempotencyKey = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            sessionStorage.setItem('smartcart_checkout_key', idempotencyKey);
          }
        }

        const userEmail = typeof window !== 'undefined'
          ? localStorage.getItem('smartcart_user_email') || ''
          : '';
        const userName = typeof window !== 'undefined'
          ? localStorage.getItem('smartcart_user_name') || ''
          : '';

        // If cart has items, create real order snapshot
        if (stored.length > 0) {
          const orderRes = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: stored,
              idempotency_key: idempotencyKey,
              customer_email: userEmail,
              customer_name: userName,
            }),
          });

          const orderData = await orderRes.json();
          if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order snapshot');
          setOrder(orderData.order);

          const payRes = await fetch('/api/payments/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: orderData.order.id,
              order_number: orderData.order.order_number,
              amount: orderData.order.grand_total,
              correlation_id: orderData.order.correlation_id,
            }),
          });

          const payData = await payRes.json();
          if (!payRes.ok) throw new Error(payData.error || 'Failed to initialize payment session');
          setPayment(payData.payment);
        } else {
          // If cart was empty, provide default demo receipt matching reference image
          const mockOrderNumber = `SC-${Math.floor(100000 + Math.random() * 900000)}-${Math.floor(100 + Math.random() * 900)}`;
          const mockProduct: Product = {
            barcode: '8901063012480',
            barcode_type: 'authentic_ean13',
            barcode_provenance: 'gs1_retail_verified',
            product_name: 'Parle-G Gluco Biscuits',
            brand: 'Parle',
            mrp: 10.0,
            selling_price: 10.0,
            weight_g: 56.0,
            unit_type: 'weight',
            raw_quantity: '56 gm',
            category: 'Packaged Food',
            subcategory: 'Biscuits & Cookies',
            image_url: '/images/parle_g.jpg',
            discount_pct: 0.0,
          };

          const mockCartItem: CartItem = {
            id: 'mock-item-1',
            barcode: '8901063012480',
            product: mockProduct,
            quantity: 3,
            unit_price: 10.0,
            mrp: 10.0,
            line_total: 30.0,
            weight_g: 56.0,
            total_weight_g: 168.0,
            added_at: new Date().toISOString(),
          };

          const mockOrder: Order = {
            id: 'mock-order-id',
            order_number: mockOrderNumber,
            item_count: 3,
            subtotal_mrp: 30.0,
            discount_total: 0.0,
            tax_total: 1.5,
            total_weight_g: 168.0,
            grand_total: 30.0,
            items: [mockCartItem],
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            correlation_id: `corr-${Date.now()}`,
          };
          setOrder(mockOrder);

          setPayment({
            id: 'mock-payment-id',
            order_id: mockOrder.id,
            order_number: mockOrderNumber,
            correlation_id: mockOrder.correlation_id,
            amount: 30.0,
            provider: 'upi',
            status: 'pending',
            upi_uri: `upi://pay?pa=kash78532@okhdfcbank&pn=SmartCart%20AI%20Store&am=30.00&cu=INR&tn=Order%20${mockOrderNumber}&tr=${mockOrderNumber}`,
            created_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        setErrorMsg((err as Error).message);
      } finally {
        setLoadingOrder(false);
      }
    };

    initOrderAndPayment();
  }, []);

  const handleSimulatePayment = async (simResult: 'success' | 'fail') => {
    setErrorMsg(null);
    setVerificationLoading(true);

    try {
      const userEmail = typeof window !== 'undefined'
        ? localStorage.getItem('smartcart_user_email') || 'akash@gmail.com'
        : 'akash@gmail.com';
      const userName = typeof window !== 'undefined'
        ? localStorage.getItem('smartcart_user_name') || 'Akash v'
        : 'Akash v';

      const orderPayload = {
        customer_email: userEmail,
        customer_name: userName,
        order_number: order?.order_number || `SC-${Date.now().toString().slice(-6)}`,
        grand_total: order?.grand_total || 30.0,
        payment_method: `UPI AutoPay (${linkedUpiId})`,
        items: (order?.items || []).map((it) => ({
          barcode: it.barcode,
          product_name: it.product?.product_name || 'Item',
          quantity: it.quantity,
          unit_price: it.unit_price,
          line_total: it.line_total,
          weight_g: it.weight_g,
        })),
      };

      if (simResult === 'success') {
        // Await verification and persistence
        if (payment && payment.id !== 'mock-payment-id') {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payment_id: payment.id,
              order_id: payment.order_id,
              correlation_id: payment.correlation_id,
              simulate_test_result: 'success',
              ...orderPayload,
            }),
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            throw new Error(verifyData.error || 'Payment verification failed on server');
          }
        }

        // Secondary history record sync (legacy compatibility)
        fetch('/api/cart/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload),
        }).catch(() => {});

        // Clear cart and state on verified success
        clearCart();
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('smartcart_checkout_key');
          window.dispatchEvent(new Event('smartcart_updated'));
        }
        setPayment((prev) => (prev ? { ...prev, status: 'paid' } : null));
        setShowConfirmationPop(true);
      } else {
        // Payment failed simulation
        if (payment && payment.id !== 'mock-payment-id') {
          await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payment_id: payment.id,
              order_id: payment.order_id,
              correlation_id: payment.correlation_id,
              simulate_test_result: 'fail',
              ...orderPayload,
            }),
          }).catch(() => {});
        }
        setPayment((prev) => (prev ? { ...prev, status: 'failed' } : null));
        setShowFailurePop(true);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Payment simulation failed');
      setShowFailurePop(true);
    } finally {
      setVerificationLoading(false);
    }
  };

  const formattedTime = order?.created_at
    ? new Date(order.created_at).toLocaleTimeString()
    : '5:31:48 PM';

  return (
    <div className="luxury-container checkout-dashboard-canvas">
      {/* Background Architectural Layer & Gradient Overlay */}
      <div className="hero-bg-layer" />
      <div className="hero-overlay-layer" />

      {/* Top Header Return Bar */}
      <header
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '22px 36px 12px',
          position: 'relative',
          zIndex: 30,
          flexShrink: 0,
        }}
      >
        <Link
          href="/"
          prefetch={true}
          title="Return to Dashboard"
          aria-label="Return to Dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '2px solid rgba(255, 255, 255, 0.98)',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.22), 0 2px 6px rgba(0, 0, 0, 0.06)',
            textDecoration: 'none',
            transition: 'all 0.15s ease',
            padding: 0,
            cursor: 'pointer',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.94)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <GlassIcon icon={ArrowLeft} color="green" size={38} shape="circle" glow style={{ pointerEvents: 'none' }} />
        </Link>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(14px)',
            padding: '7px 18px',
            borderRadius: '9999px',
            border: '1.5px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.08)',
            fontSize: '12.5px',
            fontWeight: 700,
            color: '#1e293b',
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span>Autonomous Checkout Gateway</span>
        </div>
      </header>

      {/* Main Two-Box Grid Container Matching Reference Image */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          padding: '0 36px 24px',
          position: 'relative',
          zIndex: 20,
          display: 'flex',
          alignItems: 'stretch',
          overflow: 'hidden',
          overflowX: 'hidden',
        }}
      >
        {loadingOrder ? (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(30px)',
              borderRadius: '40px',
              padding: '48px',
              textAlign: 'center',
              maxWidth: '440px',
              margin: 'auto',
              border: '2px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 25px 60px rgba(59, 130, 246, 0.18)',
            }}
          >
            <RefreshCw style={{ width: '38px', height: '38px', color: '#3b82f6', margin: '0 auto 16px' }} className="animate-spin" />
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Generating Invoice...
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
              Authoritative catalogue prices and weight verification
            </p>
          </div>
        ) : (
          <div className="checkout-dashboard-grid">
            {/* =========================================================================
                BOX 1: ITEMIZE BILL SUMMARY (RECEIPT)
                ========================================================================= */}
            <div
              style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.74)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                borderRadius: '38px',
                border: '2px solid rgba(255, 255, 255, 0.98)',
                boxShadow: '0 30px 80px -15px rgba(59, 130, 246, 0.22), inset 0 2px 4px #ffffff',
                padding: '26px 28px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                height: '100%',
              }}
            >
              {/* Subsurface ambient corner bubbles */}
              <div
                style={{
                  position: 'absolute',
                  top: '-25px',
                  left: '-25px',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.95), rgba(219, 234, 254, 0.45) 65%, transparent 100%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '80px',
                  right: '-25px',
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.9), rgba(224, 238, 255, 0.4) 65%, transparent 100%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Header: Raised Icon Badge, Title, Order #, and Items Pill */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  position: 'relative',
                  zIndex: 2,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Raised Glassmorphic squircle badge */}
                  <GlassIcon icon={FileText} color="blue" size={46} glow />
                  <div>
                    <h2
                      style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        color: '#0f172a',
                        letterSpacing: '-0.02em',
                        margin: 0,
                      }}
                    >
                      Itemized Bill Summary
                    </h2>
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        fontWeight: 500,
                        margin: '2px 0 0 0',
                      }}
                    >
                      Order #{order?.order_number || 'SC-568934-538'} &bull; {formattedTime}
                    </p>
                  </div>
                </div>

                {/* Lavender Pill Badge: N items */}
                <span
                  style={{
                    background: '#ede9fe',
                    color: '#6d28d9',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    padding: '4px 13px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(221, 214, 254, 0.8)',
                    boxShadow: '0 2px 6px rgba(109, 40, 217, 0.08)',
                  }}
                >
                  {order?.item_count || 3} items
                </span>
              </div>

              {/* Itemized Items List: Expanded to fill available space so many more items are visible */}
              <div
                className="no-scrollbar"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  paddingRight: '6px',
                  marginBottom: '14px',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {order?.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      borderRadius: '16px',
                      border: '1.5px solid rgba(226, 238, 255, 0.95)',
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Product Thumbnail / Squircle Box */}
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          overflow: 'hidden',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                        }}
                      >
                        <img
                          src={
                            item.product?.barcode === '8901063012480' ||
                            item.product?.product_name?.toLowerCase().includes('parle')
                              ? '/images/parle_g.jpg'
                              : item.product?.image_url || '/icons/cart.png'
                          }
                          alt={item.product?.product_name || 'Item'}
                          style={{ width: '34px', height: '34px', objectFit: 'contain' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/parle_g.jpg';
                          }}
                        />
                      </div>
                      <div>
                        <h4
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 700,
                            color: '#0f172a',
                            margin: 0,
                          }}
                        >
                          {item.product?.product_name || 'Item'}
                        </h4>
                        <p
                          style={{
                            fontSize: '11.5px',
                            color: '#64748b',
                            fontWeight: 600,
                            margin: '2px 0 0 0',
                          }}
                        >
                          Qty: {item.quantity} &times; ₹{item.unit_price.toFixed(2)} &bull;{' '}
                          {(item.weight_g * item.quantity).toFixed(0)}g
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                        ₹{item.line_total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Inset Pods: Billing Breakdown & Total Payable docked together with clean gap */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  flexShrink: 0,
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {/* Middle Inset Billing Pod with Raised Icon Badges */}
                <div
                  style={{
                    background: 'rgba(238, 245, 255, 0.65)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '22px',
                    border: '1.5px solid rgba(255, 255, 255, 0.95)',
                    padding: '12px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.9), 0 4px 14px rgba(59, 130, 246, 0.05)',
                  }}
                >
                  {/* Subtotal (MRP) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <GlassIcon icon={ReceiptText} color="blue" size={28} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                        Subtotal (MRP):
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                      ₹{(order?.subtotal_mrp || 30.0).toFixed(2)}
                    </span>
                  </div>

                  {/* GST (5% Included) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <GlassIcon icon={Percent} color="blue" size={28} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                        GST (5% Included):
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                      ₹{(order?.tax_total || 1.5).toFixed(2)}
                    </span>
                  </div>

                  {/* Verified Weight */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <GlassIcon icon={Scale} color="blue" size={28} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                        Verified Weight:
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                      {(order?.total_weight_g || 168.0).toFixed(1)} g
                    </span>
                  </div>
                </div>

                {/* Bottom Inset Pod: Total Payable */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.88)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '22px',
                    border: '1.5px solid rgba(226, 238, 255, 0.95)',
                    padding: '12px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <GlassIcon icon={Wallet} color="blue" size={38} glow />
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                      Total Payable:
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '30px',
                      fontWeight: 900,
                      color: '#2563eb',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    ₹{(order?.grand_total || 30.0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

          {/* =========================================================================
              BOX 2: PAYMENT SCANNER & UPI ACTIONS
              ========================================================================= */}
            <div
              className="no-scrollbar"
              style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.74)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                borderRadius: '38px',
                border: '2px solid rgba(255, 255, 255, 0.98)',
                boxShadow: '0 30px 80px -15px rgba(59, 130, 246, 0.22), inset 0 2px 4px #ffffff',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textAlign: 'center',
                overflow: 'hidden',
                overflowX: 'hidden',
                height: '100%',
              }}
            >
            {/* Subsurface ambient bubbles */}
            <div
              style={{
                position: 'absolute',
                top: '-25px',
                right: '-25px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.95), rgba(219, 234, 254, 0.45) 65%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '100px',
                left: '-25px',
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.9), rgba(224, 238, 255, 0.4) 65%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />

            <div>
              {/* Centered Status Badge with GlassIcon: AWAITING CONFIRMATION / SETTLED / DECLINED */}
              <div style={{ marginBottom: '16px', position: 'relative', zIndex: 2 }}>
                {payment?.status === 'paid' ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 18px',
                      borderRadius: '9999px',
                      background: 'rgba(236, 253, 245, 0.95)',
                      border: '1.5px solid rgba(134, 239, 172, 0.85)',
                      color: '#15803d',
                      fontSize: '12px',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)',
                    }}
                  >
                    <GlassIcon icon={ShieldCheck} color="green" size={20} shape="circle" />
                    <span>VERIFIED &amp; SETTLED</span>
                  </div>
                ) : payment?.status === 'failed' ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 18px',
                      borderRadius: '9999px',
                      background: 'rgba(254, 242, 242, 0.95)',
                      border: '1.5px solid rgba(252, 165, 165, 0.85)',
                      color: '#b91c1c',
                      fontSize: '12px',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                    }}
                  >
                    <GlassIcon icon={CircleX} color="red" size={20} shape="circle" />
                    <span>PAYMENT DECLINED</span>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 20px',
                      borderRadius: '9999px',
                      background: 'rgba(254, 243, 199, 0.92)',
                      border: '1.5px solid rgba(253, 230, 138, 0.95)',
                      color: '#b45309',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      letterSpacing: '0.6px',
                      boxShadow: '0 4px 12px rgba(217, 119, 6, 0.12)',
                    }}
                  >
                    <GlassIcon icon={Clock3} color="amber" size={20} shape="circle" />
                    <span>AWAITING CONFIRMATION</span>
                  </div>
                )}
              </div>

              {/* Non-Live Demo Warning Card */}
              <div
                style={{
                  background: 'rgba(254, 243, 199, 0.55)',
                  border: '1.5px solid rgba(251, 191, 36, 0.45)',
                  borderRadius: '18px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left',
                  marginBottom: '20px',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <GlassIcon icon={ShieldAlert} color="amber" size={32} />
                <div>
                  <h5 style={{ fontSize: '12px', fontWeight: 800, color: '#92400e', margin: 0 }}>
                    NON-LIVE DEMO CHECKOUT
                  </h5>
                  <p style={{ fontSize: '11.5px', color: '#b45309', margin: '2px 0 0 0', lineHeight: 1.35 }}>
                    Simulated testing mode. No live funds are transferred.
                  </p>
                </div>
              </div>

              {/* White Frosted Box Containing QR Viewfinder */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.92)',
                  borderRadius: '28px',
                  border: '1.5px solid rgba(226, 238, 255, 0.95)',
                  padding: '20px 22px 14px',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 8px 24px rgba(59, 130, 246, 0.08)',
                  position: 'relative',
                  zIndex: 2,
                  marginBottom: '16px',
                }}
              >
                {/* Dark QR Viewfinder with Glowing Cyan Corner Brackets */}
                <div
                  style={{
                    position: 'relative',
                    width: '200px',
                    height: '200px',
                    borderRadius: '24px',
                    background: '#070b19',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(56, 189, 248, 0.08)',
                  }}
                >
                  {/* Cyan Corner Brackets */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      width: '28px',
                      height: '28px',
                      borderTop: '3.5px solid #38bdf8',
                      borderLeft: '3.5px solid #38bdf8',
                      borderTopLeftRadius: '12px',
                      filter: 'drop-shadow(0 0 6px #38bdf8)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '28px',
                      height: '28px',
                      borderTop: '3.5px solid #38bdf8',
                      borderRight: '3.5px solid #38bdf8',
                      borderTopRightRadius: '12px',
                      filter: 'drop-shadow(0 0 6px #38bdf8)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '12px',
                      width: '28px',
                      height: '28px',
                      borderBottom: '3.5px solid #38bdf8',
                      borderLeft: '3.5px solid #38bdf8',
                      borderBottomLeftRadius: '12px',
                      filter: 'drop-shadow(0 0 6px #38bdf8)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      width: '28px',
                      height: '28px',
                      borderBottom: '3.5px solid #38bdf8',
                      borderRight: '3.5px solid #38bdf8',
                      borderBottomRightRadius: '12px',
                      filter: 'drop-shadow(0 0 6px #38bdf8)',
                    }}
                  />

                  {/* Glowing Horizontal Cyan Laser Line */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '12px',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      height: '3px',
                      background: 'linear-gradient(90deg, transparent 0%, #00f0ff 40%, #ffffff 50%, #00f0ff 60%, transparent 100%)',
                      boxShadow: '0 0 14px #00f0ff, 0 0 6px #ffffff',
                      pointerEvents: 'none',
                      zIndex: 3,
                    }}
                  />

                  {/* Dynamic Scannable Vector QR Code or Stylized Fallback */}
                  {qrSvgHtml ? (
                    <a
                      href={
                        payment?.upi_uri ||
                        `upi://pay?pa=kash78532@okhdfcbank&pn=SmartCart%20AI%20Store&am=${(order?.grand_total || 30.0).toFixed(2)}&cu=INR&tn=Order%20${order?.order_number || 'SC-30'}&tr=${order?.order_number || 'SC-30'}`
                      }
                      title="Click or scan to pay with any UPI app"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        width: '136px',
                        height: '136px',
                      }}
                      dangerouslySetInnerHTML={{ __html: qrSvgHtml }}
                    />
                  ) : (
                    /* Stylized QR Code fallback matching the reference design */
                    <svg
                      width="106"
                      height="106"
                      viewBox="0 0 106 106"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ zIndex: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                    >
                      {/* Top Left Marker */}
                      <rect x="6" y="6" width="36" height="36" rx="10" stroke="#ffffff" strokeWidth="7" fill="none" />
                      <circle cx="24" cy="24" r="6.5" fill="#ffffff" />

                      {/* Top Right Marker */}
                      <rect x="64" y="6" width="36" height="36" rx="10" stroke="#ffffff" strokeWidth="7" fill="none" />
                      <circle cx="82" cy="24" r="6.5" fill="#ffffff" />

                      {/* Bottom Left Marker */}
                      <rect x="6" y="64" width="36" height="36" rx="10" stroke="#ffffff" strokeWidth="7" fill="none" />
                      <circle cx="24" cy="82" r="6.5" fill="#ffffff" />

                      {/* Bottom Right Distinctive Curved Glyph */}
                      <path
                        d="M 64 64 H 82 A 16 16 0 0 1 98 80 V 98"
                        stroke="#ffffff"
                        strokeWidth="7"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <circle cx="82" cy="82" r="6.5" fill="#ffffff" />

                      {/* Center dots */}
                      <circle cx="53" cy="38" r="4" fill="#ffffff" />
                      <circle cx="53" cy="68" r="4" fill="#ffffff" />
                      <circle cx="38" cy="53" r="3.5" fill="#ffffff" />
                      <circle cx="68" cy="53" r="3.5" fill="#ffffff" />
                    </svg>
                  )}

                  {/* Order & Price Info at bottom of QR */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      fontSize: '9.5px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: '#94a3b8',
                      letterSpacing: '0.5px',
                      zIndex: 2,
                    }}
                  >
                    ₹{(order?.grand_total || 30.0).toFixed(2)} &bull; {order?.order_number || 'SC-568934-538'}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '8px' }}>
                  <a
                    href={
                      payment?.upi_uri ||
                      `upi://pay?pa=kash78532@okhdfcbank&pn=SmartCart%20AI%20Store&am=${(order?.grand_total || 30.0).toFixed(2)}&cu=INR&tn=Order%20${order?.order_number || 'SC-30'}&tr=${order?.order_number || 'SC-30'}`
                    }
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#2563eb',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>Scan or Tap to Pay via UPI</span>
                    <span style={{ fontSize: '11px' }}>↗</span>
                  </a>
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    GPay &bull; PhonePe &bull; Paytm &bull; CRED
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: Linked UPI AutoPay, Success & Failure Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 2 }}>
              {/* Linked UPI AutoPay VPA Row */}
              <div
                style={{
                  background: 'rgba(238, 245, 255, 0.7)',
                  borderRadius: '22px',
                  border: '1.5px solid rgba(224, 236, 255, 0.95)',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <GlassIcon icon={Zap} color="purple" size={34} glow />
                  <div style={{ textAlign: 'left' }}>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        color: '#2563eb',
                        letterSpacing: '0.5px',
                        display: 'block',
                      }}
                    >
                      LINKED UPI AUTOPAY VPA
                    </span>
                    <span
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 800,
                        color: '#0f172a',
                        display: 'block',
                      }}
                    >
                      {linkedUpiId}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={verificationLoading || payment?.status === 'paid'}
                  onClick={() => handleSimulatePayment('success')}
                  style={{
                    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    borderRadius: '9999px',
                    padding: '9px 18px',
                    fontWeight: 700,
                    fontSize: '13px',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  1-Click Pay ₹{(order?.grand_total || 30.0).toFixed(0)}
                </button>
              </div>

              {/* Primary Green Pill: Simulate Verified Payment (Success) */}
              <button
                type="button"
                disabled={payment?.status === 'paid'}
                onClick={() => handleSimulatePayment('success')}
                style={{
                  width: '100%',
                  height: '52px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 50%, #047857 100%)',
                  border: '1.5px solid rgba(255, 255, 255, 0.45)',
                  boxShadow:
                    '0 10px 25px rgba(16, 185, 129, 0.42), inset 0 1.5px 2px rgba(255, 255, 255, 0.65)',
                  color: '#ffffff',
                  fontSize: '14.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'transform 0.1s ease, filter 0.1s ease',
                  userSelect: 'none',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <GlassIcon icon={ShieldCheck} color="green" size={24} shape="circle" strokeWidth={2.5} style={{ pointerEvents: 'none' }} />
                <span style={{ pointerEvents: 'none' }}>Simulate Verified Payment (Success)</span>
                <ChevronRight style={{ width: '18px', height: '18px', pointerEvents: 'none' }} />
              </button>

              {/* Secondary Red Pill: Simulate Payment Failure */}
              <button
                type="button"
                onClick={() => handleSimulatePayment('fail')}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '9999px',
                  background: 'rgba(254, 242, 242, 0.85)',
                  backdropFilter: 'blur(10px)',
                  border: '1.5px solid rgba(239, 68, 68, 0.45)',
                  color: '#dc2626',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'transform 0.1s ease, filter 0.1s ease',
                  userSelect: 'none',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <GlassIcon icon={CircleX} color="red" size={24} shape="circle" strokeWidth={2.5} style={{ pointerEvents: 'none' }} />
                <span style={{ pointerEvents: 'none' }}>Simulate Payment Failure</span>
              </button>


            </div>
          </div>
        </div>
      )}
      </main>

      {/* 3-Second Confirmation Tick Pop Modal */}
      {showConfirmationPop && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.42)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '20px',
          }}
          onClick={() => setShowConfirmationPop(false)}
        >
          <div
            className="payment-pop-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(30px) saturate(180%)',
              WebkitBackdropFilter: 'blur(30px) saturate(180%)',
              borderRadius: '32px',
              border: '2px solid rgba(255, 255, 255, 0.98)',
              boxShadow:
                '0 25px 60px -10px rgba(15, 23, 42, 0.25), 0 0 50px rgba(16, 185, 129, 0.25), inset 0 2px 4px #ffffff',
              padding: '36px 32px 28px',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Emerald Radial Glow */}
            <div
              style={{
                position: 'absolute',
                top: '-30px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Glowing Confirmation Tick Badge with Pop & Stroke Animation */}
            <div
              style={{
                position: 'relative',
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow:
                  '0 12px 30px rgba(16, 185, 129, 0.45), 0 0 0 8px rgba(16, 185, 129, 0.12), inset 0 2px 4px rgba(255, 255, 255, 0.6)',
                border: '3px solid rgba(255, 255, 255, 0.95)',
              }}
            >
              <svg
                width="46"
                height="46"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
              >
                <polyline points="20 6 9 17 4 12" className="payment-tick-check" />
              </svg>
            </div>

            <h3
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#0f172a',
                margin: '0 0 6px 0',
                letterSpacing: '-0.02em',
              }}
            >
              Payment Confirmed!
            </h3>
            <p
              style={{
                fontSize: '13.5px',
                color: '#64748b',
                fontWeight: 600,
                margin: '0 0 16px 0',
              }}
            >
              Order successfully placed and verified
            </p>

            {/* Amount Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '9999px',
                background: 'rgba(236, 253, 245, 0.95)',
                border: '1.5px solid rgba(134, 239, 172, 0.9)',
                color: '#15803d',
                fontSize: '14px',
                fontWeight: 800,
                marginBottom: '0',
              }}
            >
              <span>₹{(order?.grand_total || 30.0).toFixed(2)} Paid</span>
              <span style={{ color: '#86efac' }}>&bull;</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>UPI Autopay</span>
            </div>
          </div>
        </div>
      )}

      {/* 3-Second Failure Pop Modal (Identical Structure & Luxury Feel to Success Modal) */}
      {showFailurePop && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.42)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '20px',
          }}
          onClick={() => setShowFailurePop(false)}
        >
          <div
            className="payment-pop-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(30px) saturate(180%)',
              WebkitBackdropFilter: 'blur(30px) saturate(180%)',
              borderRadius: '32px',
              border: '2px solid rgba(255, 255, 255, 0.98)',
              boxShadow:
                '0 25px 60px -10px rgba(15, 23, 42, 0.25), 0 0 50px rgba(239, 68, 68, 0.25), inset 0 2px 4px #ffffff',
              padding: '36px 32px 28px',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Ruby/Red Radial Glow */}
            <div
              style={{
                position: 'absolute',
                top: '-30px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Glowing Failure Cross Badge with Pop & Stroke Animation */}
            <div
              style={{
                position: 'relative',
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow:
                  '0 12px 30px rgba(239, 68, 68, 0.45), 0 0 0 8px rgba(239, 68, 68, 0.12), inset 0 2px 4px rgba(255, 255, 255, 0.6)',
                border: '3px solid rgba(255, 255, 255, 0.95)',
              }}
            >
              <svg
                width="42"
                height="42"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
              >
                <line x1="18" y1="6" x2="6" y2="18" className="payment-tick-check" />
                <line x1="6" y1="6" x2="18" y2="18" className="payment-tick-check" />
              </svg>
            </div>

            <h3
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#0f172a',
                margin: '0 0 6px 0',
                letterSpacing: '-0.02em',
              }}
            >
              Payment Failed!
            </h3>
            <p
              style={{
                fontSize: '13.5px',
                color: '#64748b',
                fontWeight: 600,
                margin: '0 0 16px 0',
              }}
            >
              {errorMsg || 'Transaction declined by bank or user'}
            </p>

            {/* Amount Pill for Failed Transaction */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '9999px',
                background: 'rgba(254, 242, 242, 0.95)',
                border: '1.5px solid rgba(252, 165, 165, 0.9)',
                color: '#b91c1c',
                fontSize: '14px',
                fontWeight: 800,
                marginBottom: '0',
              }}
            >
              <span>₹{(order?.grand_total || 30.0).toFixed(2)} Declined</span>
              <span style={{ color: '#fca5a5' }}>&bull;</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>Retry Available</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

