'use client';

import React from 'react';
import { House, Plus, History } from 'lucide-react';
import GlassIcon from '@/components/GlassIcon';

interface LuxurySideNavProps {
  activeView: string;
  itemCount: number;
  onOpenScanner: () => void;
  onOpenCatalogue: () => void;
  onOpenCart: () => void;
  onOpenHardwareConsole: () => void;
  onNewCartAccount?: () => void;
  onOpenHistory?: () => void;
}

export default function LuxurySideNav({
  activeView,
  itemCount,
  onOpenScanner,
  onOpenCatalogue,
  onOpenCart,
  onOpenHardwareConsole,
  onNewCartAccount,
  onOpenHistory,
}: LuxurySideNavProps) {
  return (
    <aside className="left-dock-container">
      {/* Top Vertical Pill */}
      <div className="vertical-pill">
        {/* 1. Home Dashboard button (House icon in glassmorphism blue tile) */}
        <button
          onClick={() => {}}
          className={`circle-nav-btn ${activeView === 'home' ? 'active' : ''}`}
          title="Home Autonomous Dashboard"
          style={{ padding: 0, border: 'none', background: 'transparent' }}
        >
          <GlassIcon
            icon={House}
            color="blue"
            size={38}
            active={activeView === 'home'}
            glow={activeView === 'home'}
          />
        </button>

        {/* 2. Add Grocery Items (+) button - Green glass button matching reference */}
        <button
          onClick={onOpenCatalogue}
          className="circle-nav-btn"
          title="Add Grocery Items (+)"
          style={{ padding: 0, border: 'none', background: 'transparent' }}
        >
          <GlassIcon
            icon={Plus}
            color="green"
            shape="circle"
            size={38}
            strokeWidth={3}
            glow
          />
        </button>

        {/* 3. Cart & Orders History button - Purple glass tile matching reference */}
        <button
          onClick={onOpenHistory}
          className={`circle-nav-btn ${activeView === 'history' ? 'active' : ''}`}
          title="Cart & Order History (Backend)"
          style={{ padding: 0, border: 'none', background: 'transparent' }}
        >
          <GlassIcon
            icon={History}
            color="purple"
            size={38}
            active={activeView === 'history'}
            glow={activeView === 'history'}
          />
        </button>
      </div>
    </aside>
  );
}
