'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, ShoppingCart, ArrowRight, Scale, Tag } from 'lucide-react';
import { CartItem, CartSummary } from '@/types';
import { updateItemQuantity, removeItemFromCart } from '@/lib/cart-store';
import { iotSimulator } from '@/lib/iot-simulator';
import GlassIcon from '@/components/GlassIcon';

interface CartListProps {
  summary: CartSummary;
  onCartChanged: (summary: CartSummary) => void;
}

export default function CartList({ summary, onCartChanged }: CartListProps) {
  const handleIncrease = (item: CartItem) => {
    const res = updateItemQuantity(item.barcode, item.quantity + 1);
    iotSimulator.placeWeight(item.weight_g || 100);
    iotSimulator.playBuzzer('success');
    onCartChanged(res.summary);
  };

  const handleDecrease = (item: CartItem) => {
    if (item.quantity <= 1) {
      handleRemove(item);
    } else {
      const res = updateItemQuantity(item.barcode, item.quantity - 1);
      iotSimulator.removeWeight(item.weight_g || 100);
      iotSimulator.playBuzzer('success');
      onCartChanged(res.summary);
    }
  };

  const handleRemove = (item: CartItem) => {
    const totalItemWeight = (item.weight_g || 100) * item.quantity;
    const res = removeItemFromCart(item.barcode);
    iotSimulator.removeWeight(totalItemWeight);
    iotSimulator.playBuzzer('success');
    onCartChanged(res.summary);
  };

  if (!summary.items || summary.items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <GlassIcon icon={ShoppingCart} color="blue" size={64} glow style={{ margin: '0 auto 14px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#1c1b22' }}>
          Your Smart Cart is Empty
        </h3>
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', maxWidth: '320px', margin: '4px auto 0' }}>
          Scan items using the camera or select verified staples from the catalogue.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid #e5e7eb' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#1c1b22' }}>
            Current Cart Items ({summary.item_count})
          </h3>
          <p style={{ fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <Scale style={{ width: '13px', height: '13px', color: '#527ca7' }} />
            <span>Authoritative Weight: <strong>{summary.total_weight_g.toFixed(1)}g</strong></span>
          </p>
        </div>

        {summary.savings_pct > 0 && (
          <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '100px', fontWeight: 700 }}>
            Saving {summary.savings_pct.toFixed(0)}% Overall
          </span>
        )}
      </div>

      {/* Items List */}
      <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
        {summary.items.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderRadius: '16px',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              fontSize: '12px',
            }}
          >
            <div style={{ flex: 1, minWidth: '160px' }}>
              <h4 style={{ fontWeight: 700, color: '#111827' }}>{item.product.product_name}</h4>
              <p style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px' }}>
                {item.product.brand} &bull; {(item.weight_g * item.quantity).toFixed(0)}g &bull; #{item.barcode}
              </p>
            </div>

            <div style={{ textAlign: 'right', marginRight: '14px' }}>
              <span style={{ fontWeight: 800, color: '#25105f', fontSize: '13px' }}>
                ₹{item.line_total.toFixed(2)}
              </span>
              {item.mrp > item.unit_price && (
                <p style={{ fontSize: '10px', color: '#9ca3af', textDecoration: 'line-through' }}>
                  ₹{(item.mrp * item.quantity).toFixed(2)}
                </p>
              )}
            </div>

            {/* Stepper with GlassIcon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '100px', padding: '2px 4px' }}>
                <button
                  onClick={() => handleDecrease(item)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                  title="Decrease quantity"
                >
                  <GlassIcon icon={Minus} color="pink" shape="circle" size={22} strokeWidth={3} />
                </button>
                <span style={{ width: '24px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}>
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleIncrease(item)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                  title="Increase quantity"
                >
                  <GlassIcon icon={Plus} color="cyan" shape="circle" size={22} strokeWidth={3} />
                </button>
              </div>

              <button
                onClick={() => handleRemove(item)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                title="Remove item"
              >
                <GlassIcon icon={Trash2} color="red" size={28} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bill Footer & Checkout Button */}
      <div style={{ background: '#f3e8ff', padding: '16px 20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '11px', color: '#6b21a8', fontWeight: 600, display: 'block' }}>Authoritative Total:</span>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#25105f', fontFamily: 'monospace' }}>
            ₹{summary.grand_total.toFixed(2)}
          </span>
        </div>

        <Link
          href="/checkout"
          style={{
            background: '#25105f',
            color: '#ffffff',
            borderRadius: '100px',
            padding: '10px 24px',
            fontSize: '12px',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(37, 16, 95, 0.3)',
          }}
        >
          <span>Pay & Checkout</span>
          <ArrowRight style={{ width: '14px', height: '14px' }} />
        </Link>
      </div>
    </div>
  );
}
