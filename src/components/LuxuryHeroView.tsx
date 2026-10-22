'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  MapPin,
  Heart,
  Bookmark,
  Share2,
  Scale,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import { CartSummary, IoTTelemetry } from '@/types';

interface LuxuryHeroViewProps {
  summary: CartSummary;
  telemetry: IoTTelemetry;
  onOpenScanner: () => void;
  onOpenCart: () => void;
  onOpenCatalogue: () => void;
  onOpenHardwareConsole: () => void;
}

export default function LuxuryHeroView({
  summary,
  telemetry,
  onOpenScanner,
  onOpenCart,
  onOpenCatalogue,
  onOpenHardwareConsole,
}: LuxuryHeroViewProps) {
  const featuredItem = summary.items.length > 0 ? summary.items[0] : null;

  return (
    <>
      {/* 1. Giant Typography Headline & Paragraph (Center-Left) */}
      <div className="hero-content-box">
        <h1 className="hero-main-title">
          New Way Of<br />
          Shopping
        </h1>

        <p className="hero-sub-paragraph">
          Discover extraordinary grocery checkout powered by dual-sensor recognition.
          Whether picking up daily staples or fresh produce, our computer vision and
          precision weight fusion verifies every item instantly without queues.
        </p>
      </div>

      {/* 2. Bottom-Left Card (Exact replica of "Find The Perfect Place / 10K+") */}
      <div className="bottom-left-card">
        <div>
          <h3 className="card-title-lg">Dual-Sensor Precision</h3>
          <p className="card-desc-sm">
            Our platform syncs 5,198 verified grocery items with load-cell strain gauges.
            Cross-checked weight consensus guarantees zero billing errors.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
          <div>
            <div className="card-metric-num">5.2K+</div>
            <span style={{ fontSize: '11px', color: '#888', fontWeight: 600, display: 'block', marginTop: '2px' }}>
              Catalogue Items
            </span>
          </div>

          {/* Overlapping Product Avatars + Circular Action Arrow Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', marginLeft: '6px' }}>
              {/* Parle-G */}
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#fef3c7',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#92400e',
                  marginLeft: '-8px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                }}
                title="Parle-G (56g)"
              >
                PG
              </div>
              {/* Maggi */}
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#fef08a',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#854d0e',
                  marginLeft: '-8px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                }}
                title="Maggi Noodles (70g)"
              >
                MN
              </div>
              {/* Amul Butter */}
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#dbeafe',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#1e40af',
                  marginLeft: '-8px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                }}
                title="Amul Butter (100g)"
              >
                AB
              </div>
              {/* Tata Salt */}
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#f3e8ff',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#6b21a8',
                  marginLeft: '-8px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                }}
                title="Tata Salt (1000g)"
              >
                TS
              </div>
            </div>

            {/* Circular Arrow Action Button */}
            <button
              onClick={onOpenCatalogue}
              className="circle-action-arrow-btn"
              title="Open Product Catalogue"
            >
              <ArrowUpRight style={{ width: '18px', height: '18px', color: '#1c1b22' }} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Bottom-Right Card (Exact replica of "Lunar Oasis Villa / Featured Card") */}
      <div className="bottom-right-card">
        {/* Title Row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h3 className="card-title-lg" style={{ fontSize: '19px' }}>
              {featuredItem ? featuredItem.product.product_name : 'Smart Cart Active Bill'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#666', marginTop: '4px' }}>
              <MapPin style={{ width: '13px', height: '13px', color: '#888' }} />
              <span>
                {featuredItem
                  ? `${featuredItem.product.category} • #${featuredItem.barcode}`
                  : 'Aisle 3 • Fresh Groceries • Cart #SC-01'}
              </span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="circle-action-arrow-btn"
            title="Proceed to Payment Dashboard"
          >
            <ArrowUpRight style={{ width: '18px', height: '18px', color: '#1c1b22' }} />
          </Link>
        </div>

        {/* Description */}
        <p className="card-desc-sm" style={{ marginTop: '10px' }}>
          {featuredItem
            ? `Verified by load-cell strain gauge. Selling price ₹${featuredItem.unit_price.toFixed(2)} with MRP ₹${featuredItem.mrp.toFixed(2)}.`
            : 'Autonomous shopping cart active. Cross-checked with real-time weight delta for instant checkout.'}
        </p>

        {/* Metrics Row (matching 695m², 126m² yard, 3 bedrooms, 2 baths) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            fontSize: '11px',
            color: '#444',
            fontWeight: 600,
            marginTop: '14px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Scale style={{ width: '14px', height: '14px', color: '#527ca7' }} />
            {summary.total_weight_g.toFixed(1)}g net
          </span>
          <span style={{ color: '#ccc' }}>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShoppingBag style={{ width: '14px', height: '14px', color: '#25105f' }} />
            {summary.item_count} items
          </span>
          <span style={{ color: '#ccc' }}>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Tag style={{ width: '14px', height: '14px', color: '#10b981' }} />
            ₹{summary.grand_total.toFixed(2)} total
          </span>
          {summary.discount_total > 0 && (
            <>
              <span style={{ color: '#ccc' }}>•</span>
              <span style={{ color: '#065f46', fontWeight: 700 }}>
                Saved ₹{summary.discount_total.toFixed(2)}
              </span>
            </>
          )}
        </div>

        {/* Bottom Action Row: Signature Monogram Circle & Circular Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.65)',
          }}
        >
          {/* Signature Midnight Purple Circle with Monogram "U" */}
          <div
            className="signature-monogram-circle"
            onClick={onOpenScanner}
            title="Scan item with camera"
          >
            {/* Exact stylized "U" monogram from screenshot */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 4v9a6 6 0 0 0 12 0V4" />
            </svg>
          </div>

          {/* Circular Action Icons: Heart, Bookmark, Share */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Heart with count 4.4K */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => {}}
                className="circle-action-arrow-btn"
                style={{ width: '42px', height: '42px' }}
                title="Favorite"
              >
                <Heart style={{ width: '16px', height: '16px', color: '#444' }} />
              </button>
              <span style={{ fontSize: '10px', color: '#777', display: 'block', marginTop: '3px', fontWeight: 500 }}>
                4.4K
              </span>
            </div>

            {/* Bookmark / Cart toggle with item count */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={onOpenCart}
                className="circle-action-arrow-btn"
                style={{ width: '42px', height: '42px' }}
                title="View Itemized Cart"
              >
                <img src="/icons/cart.png" alt="Cart" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
              </button>
              <span style={{ fontSize: '10px', color: '#777', display: 'block', marginTop: '3px', fontWeight: 600 }}>
                {summary.item_count || '0'}
              </span>
            </div>

            {/* Share / Pay Link with 3D Wallet Icon */}
            <div style={{ textAlign: 'center' }}>
              <Link
                href="/checkout"
                className="circle-action-arrow-btn"
                style={{ width: '42px', height: '42px' }}
                title="Proceed to Payment"
              >
                <img src="/icons/wallet.png" alt="Wallet" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
              </Link>
              <span style={{ fontSize: '10px', color: '#777', display: 'block', marginTop: '3px', fontWeight: 600 }}>
                Pay
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
