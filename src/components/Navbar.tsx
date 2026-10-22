'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, BatteryCharging, Wifi, ShieldCheck, User } from 'lucide-react';
import { IoTTelemetry } from '@/types';

interface NavbarProps {
  telemetry: IoTTelemetry;
  itemCount: number;
  grandTotal: number;
}

export default function Navbar({ telemetry, itemCount, grandTotal }: NavbarProps) {
  return (
    <header className="sticky top-4 z-40 px-4 md:px-8 mb-6">
      <div className="max-w-7xl mx-auto glass-panel px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Cart ID */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#25105f] to-[#527ca7] flex items-center justify-center text-white font-bold shadow-md">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-[#1c1b22]">SmartCart AI</span>
              <span className="pill-badge pill-badge-purple text-[10px] py-0.5 px-2">Stage 1</span>
            </div>
            <p className="text-xs text-gray-500 font-mono">Cart #SC-01 &bull; ESP32 Bridge</p>
          </div>
        </div>

        {/* Live Status Indicators (Telemetry & Weight) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Weight Telemetry */}
          <div className="pill-badge bg-white/90 shadow-sm border border-gray-200">
            <span className={`w-2 h-2 rounded-full ${telemetry.stable ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-xs font-semibold text-gray-700">Scale:</span>
            <span className="text-xs font-bold text-[#25105f] font-mono">{telemetry.weight_g.toFixed(1)} g</span>
            {telemetry.stable ? (
              <span className="text-[10px] text-emerald-600 font-medium">(Stable)</span>
            ) : (
              <span className="text-[10px] text-amber-600 font-medium">(Settling...)</span>
            )}
          </div>

          {/* IoT Link Status */}
          <div className="pill-badge pill-badge-emerald">
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs">IoT Online</span>
          </div>

          {/* Cart Battery Simulator */}
          <div className="pill-badge bg-white/80">
            <BatteryCharging className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-medium">94%</span>
          </div>
        </div>

        {/* Right Actions: Cart summary pill & Auth */}
        <div className="flex items-center gap-3">
          <Link
            href="/checkout"
            className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>₹{grandTotal.toFixed(2)}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-mono">
              {itemCount}
            </span>
          </Link>

          <Link
            href="/auth"
            className="btn-icon-circle shadow-sm"
            title="User Profile & Settings"
          >
            <User className="w-4 h-4 text-gray-700" />
          </Link>
        </div>
      </div>
    </header>
  );
}
