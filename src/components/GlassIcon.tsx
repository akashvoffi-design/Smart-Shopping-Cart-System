'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export type GlassColor = 'blue' | 'green' | 'purple' | 'red' | 'pink' | 'amber' | 'cyan' | 'orange' | 'slate';
export type GlassSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
export type GlassShape = 'squircle' | 'circle' | 'inline';

export interface GlassIconProps {
  icon: LucideIcon | React.ComponentType<{ size?: number | string; className?: string; style?: React.CSSProperties; strokeWidth?: number }>;
  color?: GlassColor;
  size?: GlassSize;
  shape?: GlassShape;
  strokeWidth?: number;
  glow?: boolean;
  active?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const COLOR_CONFIG: Record<
  GlassColor,
  {
    bgGradient: string;
    iconColor: string;
    border: string;
    boxShadow: string;
    activeBg?: string;
    glowShadow: string;
  }
> = {
  blue: {
    bgGradient: 'linear-gradient(135deg, rgba(239, 246, 255, 0.88) 0%, rgba(219, 234, 254, 0.65) 100%)',
    iconColor: '#2563eb',
    border: '1.5px solid rgba(255, 255, 255, 0.95)',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.14), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
    activeBg: 'linear-gradient(135deg, rgba(219, 234, 254, 0.95) 0%, rgba(191, 219, 254, 0.85) 100%)',
    glowShadow: '0 6px 20px rgba(37, 99, 235, 0.28), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
  },
  green: {
    bgGradient: 'linear-gradient(135deg, rgba(236, 253, 245, 0.88) 0%, rgba(209, 250, 229, 0.65) 100%)',
    iconColor: '#10b981',
    border: '1.5px solid rgba(255, 255, 255, 0.95)',
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
    activeBg: 'linear-gradient(135deg, rgba(209, 250, 229, 0.95) 0%, rgba(167, 243, 208, 0.85) 100%)',
    glowShadow: '0 6px 20px rgba(16, 185, 129, 0.28), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
  },
  purple: {
    bgGradient: 'linear-gradient(135deg, rgba(245, 243, 255, 0.88) 0%, rgba(233, 213, 255, 0.65) 100%)',
    iconColor: '#8b5cf6',
    border: '1.5px solid rgba(255, 255, 255, 0.95)',
    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
    activeBg: 'linear-gradient(135deg, rgba(233, 213, 255, 0.95) 0%, rgba(216, 180, 254, 0.85) 100%)',
    glowShadow: '0 6px 20px rgba(139, 92, 246, 0.28), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
  },
  red: {
    bgGradient: 'linear-gradient(135deg, rgba(254, 242, 242, 0.88) 0%, rgba(254, 202, 202, 0.65) 100%)',
    iconColor: '#ef4444',
    border: '1.5px solid rgba(255, 255, 255, 0.95)',
    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
    activeBg: 'linear-gradient(135deg, rgba(254, 202, 202, 0.95) 0%, rgba(252, 165, 165, 0.85) 100%)',
    glowShadow: '0 6px 20px rgba(239, 68, 68, 0.28), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
  },
  pink: {
    bgGradient: 'linear-gradient(135deg, rgba(253, 242, 248, 0.88) 0%, rgba(251, 207, 232, 0.65) 100%)',
    iconColor: '#ec4899',
    border: '1.5px solid rgba(255, 255, 255, 0.95)',
    boxShadow: '0 4px 14px rgba(236, 72, 153, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
    activeBg: 'linear-gradient(135deg, rgba(251, 207, 232, 0.95) 0%, rgba(244, 114, 182, 0.85) 100%)',
    glowShadow: '0 6px 20px rgba(236, 72, 153, 0.28), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
  },
  amber: {
    bgGradient: 'linear-gradient(135deg, rgba(255, 251, 235, 0.88) 0%, rgba(254, 243, 199, 0.65) 100%)',
    iconColor: '#f59e0b',
    border: '1.5px solid rgba(255, 255, 255, 0.95)',
    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
    activeBg: 'linear-gradient(135deg, rgba(254, 243, 199, 0.95) 0%, rgba(253, 230, 138, 0.85) 100%)',
    glowShadow: '0 6px 20px rgba(245, 158, 11, 0.28), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
  },
  cyan: {
    bgGradient: 'linear-gradient(135deg, rgba(240, 253, 250, 0.88) 0%, rgba(204, 251, 241, 0.65) 100%)',
    iconColor: '#06b6d4',
    border: '1.5px solid rgba(255, 255, 255, 0.95)',
    boxShadow: '0 4px 14px rgba(6, 182, 212, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
    activeBg: 'linear-gradient(135deg, rgba(204, 251, 241, 0.95) 0%, rgba(153, 246, 228, 0.85) 100%)',
    glowShadow: '0 6px 20px rgba(6, 182, 212, 0.28), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
  },
  orange: {
    bgGradient: 'linear-gradient(135deg, rgba(255, 247, 237, 0.88) 0%, rgba(254, 215, 170, 0.65) 100%)',
    iconColor: '#f97316',
    border: '1.5px solid rgba(255, 255, 255, 0.95)',
    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
    activeBg: 'linear-gradient(135deg, rgba(254, 215, 170, 0.95) 0%, rgba(253, 186, 116, 0.85) 100%)',
    glowShadow: '0 6px 20px rgba(249, 115, 22, 0.28), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
  },
  slate: {
    bgGradient: 'linear-gradient(135deg, rgba(248, 250, 252, 0.88) 0%, rgba(226, 232, 240, 0.65) 100%)',
    iconColor: '#64748b',
    border: '1.5px solid rgba(255, 255, 255, 0.95)',
    boxShadow: '0 4px 14px rgba(100, 116, 139, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
    activeBg: 'linear-gradient(135deg, rgba(226, 232, 240, 0.95) 0%, rgba(203, 213, 225, 0.85) 100%)',
    glowShadow: '0 6px 20px rgba(100, 116, 139, 0.22), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
  },
};

const SIZE_MAP: Record<
  string,
  { boxSize: number; iconSize: number; radius: number }
> = {
  xs: { boxSize: 24, iconSize: 13, radius: 8 },
  sm: { boxSize: 32, iconSize: 16, radius: 11 },
  md: { boxSize: 42, iconSize: 20, radius: 14 },
  lg: { boxSize: 52, iconSize: 25, radius: 17 },
  xl: { boxSize: 64, iconSize: 32, radius: 22 },
};

export default function GlassIcon({
  icon: IconComponent,
  color = 'blue',
  size = 'md',
  shape = 'squircle',
  strokeWidth = 2.2,
  glow = false,
  active = false,
  className = '',
  style = {},
  title,
  onClick,
}: GlassIconProps) {
  const cfg = COLOR_CONFIG[color] || COLOR_CONFIG.blue;

  let boxSize = 42;
  let iconSize = 20;
  let radius = 14;

  if (typeof size === 'number') {
    boxSize = size;
    iconSize = Math.round(size * 0.48);
    radius = Math.round(size * 0.33);
  } else if (SIZE_MAP[size]) {
    boxSize = SIZE_MAP[size].boxSize;
    iconSize = SIZE_MAP[size].iconSize;
    radius = SIZE_MAP[size].radius;
  }

  if (shape === 'circle') {
    radius = 9999;
  }

  if (shape === 'inline') {
    return (
      <IconComponent
        size={iconSize}
        strokeWidth={strokeWidth}
        style={{
          color: cfg.iconColor,
          filter: `drop-shadow(0 2px 4px ${cfg.iconColor}33)`,
          ...style,
        }}
        className={className}
      />
    );
  }

  const computedBg = active && cfg.activeBg ? cfg.activeBg : cfg.bgGradient;
  const computedShadow = glow || active ? cfg.glowShadow : cfg.boxShadow;

  return (
    <div
      onClick={onClick}
      title={title}
      className={`glass-icon-tile ${className}`}
      style={{
        width: `${boxSize}px`,
        height: `${boxSize}px`,
        borderRadius: `${radius}px`,
        background: computedBg,
        border: cfg.border,
        boxShadow: computedShadow,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Specular highlight bubble (glass reflection) */}
      <div
        style={{
          position: 'absolute',
          top: '2px',
          left: '2px',
          right: '2px',
          height: '45%',
          borderRadius: `${Math.max(radius - 2, 4)}px ${Math.max(radius - 2, 4)}px 50% 50%`,
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0) 100%)',
          pointerEvents: 'none',
        }}
      />

      <IconComponent
        size={iconSize}
        strokeWidth={strokeWidth}
        style={{
          color: cfg.iconColor,
          position: 'relative',
          zIndex: 2,
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.08))',
        }}
      />
    </div>
  );
}
