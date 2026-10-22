'use client';

import React, { useEffect, useRef } from 'react';
import {
  Battery,
  BatteryCharging,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  Zap,
  Plug,
  X,
  Laptop,
  Activity,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import GlassIcon, { GlassColor } from '@/components/GlassIcon';

export interface BatteryPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  percent: number | null;
  isCharging: boolean;
  isFullyCharged: boolean;
  powerOnline: boolean;
  batteryStatusText: string;
  source: 'browser_api' | 'windows_native' | 'unavailable';
  batteryName?: string | null;
}

export default function BatteryPopover({
  isOpen,
  onClose,
  percent,
  isCharging,
  isFullyCharged,
  powerOnline,
  batteryStatusText,
  source,
  batteryName,
}: BatteryPopoverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape or Outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validPercent = typeof percent === 'number' && !isNaN(percent) ? percent : null;
  const isLow = validPercent !== null && validPercent <= 20;
  const isMedium = validPercent !== null && validPercent > 20 && validPercent <= 50;

  const themeColor: GlassColor = isLow ? 'red' : isMedium ? 'amber' : 'green';
  const progressBg = isLow
    ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
    : isMedium
    ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
    : 'linear-gradient(90deg, #10b981 0%, #059669 100%)';

  const statusLabel = isFullyCharged
    ? '100% · Fully Charged'
    : isCharging
    ? `${validPercent ?? '--'}% · Charging`
    : `${validPercent ?? '--'}% · On Battery`;

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 14px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '320px',
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(30px) saturate(190%)',
        WebkitBackdropFilter: 'blur(30px) saturate(190%)',
        borderRadius: '26px',
        border: '2px solid rgba(255, 255, 255, 0.98)',
        boxShadow:
          '0 20px 50px rgba(15, 23, 42, 0.18), 0 0 25px rgba(16, 185, 129, 0.15), inset 0 2px 4px #ffffff',
        padding: '20px 22px 18px',
        zIndex: 100,
        color: '#0f172a',
        animation: 'paymentPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Laptop Battery Status"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GlassIcon
            icon={isCharging ? BatteryCharging : isLow ? BatteryLow : Battery}
            color={themeColor}
            size={28}
          />
          <div>
            <h4
              style={{
                fontSize: '13.5px',
                fontWeight: 800,
                color: '#0f172a',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Laptop Power
            </h4>
            <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#64748b' }}>
              {batteryName || 'Hardware Battery Monitor'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          type="button"
          aria-label="Close battery details"
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <X style={{ width: '14px', height: '14px', strokeWidth: 2.5 }} />
        </button>
      </div>

      {/* Percentage Display & Radial Aura */}
      <div
        style={{
          background: 'rgba(241, 245, 249, 0.65)',
          borderRadius: '18px',
          padding: '14px 16px',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          boxShadow: 'inset 0 1px 3px rgba(148, 163, 184, 0.12)',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 900,
                fontFamily: 'monospace',
                color: isLow ? '#ef4444' : isMedium ? '#d97706' : '#10b981',
                lineHeight: 1,
              }}
            >
              {validPercent !== null ? `${validPercent}%` : '--'}
            </span>
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: isCharging
                ? '#dcfce7'
                : isLow
                ? '#fee2e2'
                : 'rgba(255, 255, 255, 0.9)',
              color: isCharging ? '#15803d' : isLow ? '#b91c1c' : '#475569',
              fontSize: '11px',
              fontWeight: 700,
              border: `1px solid ${
                isCharging
                  ? 'rgba(134, 239, 172, 0.7)'
                  : isLow
                  ? 'rgba(252, 165, 165, 0.7)'
                  : 'rgba(226, 232, 240, 0.8)'
              }`,
            }}
          >
            {isCharging ? (
              <Zap style={{ width: '12px', height: '12px', fill: '#15803d', color: '#15803d' }} />
            ) : (
              <Laptop style={{ width: '12px', height: '12px' }} />
            )}
            <span>{isCharging ? 'Charging' : 'On Battery'}</span>
          </span>
        </div>

        {/* Progress Fill Bar */}
        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'rgba(203, 213, 225, 0.45)',
            borderRadius: '9999px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${validPercent ?? 0}%`,
              height: '100%',
              background: progressBg,
              borderRadius: '9999px',
              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
      </div>

      {/* Detail Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
          }}
        >
          <span style={{ color: '#64748b', fontWeight: 600 }}>Power Line:</span>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>
            {powerOnline || isCharging ? 'AC Adapter Connected' : 'Battery (Disconnected)'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
          }}
        >
          <span style={{ color: '#64748b', fontWeight: 600 }}>Status:</span>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>{batteryStatusText}</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            paddingTop: '6px',
            borderTop: '1px solid rgba(226, 232, 240, 0.8)',
          }}
        >
          <span style={{ color: '#94a3b8', fontWeight: 500 }}>Telemetry Source:</span>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              color: source === 'unavailable' ? '#dc2626' : '#2563eb',
            }}
          >
            {source === 'windows_native'
              ? 'Windows OS Service'
              : source === 'browser_api'
              ? 'Browser Battery API'
              : 'Unavailable'}
          </span>
        </div>
      </div>
    </div>
  );
}
