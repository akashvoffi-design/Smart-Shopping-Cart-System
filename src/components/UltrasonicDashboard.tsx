'use client';

import React from 'react';
import {
  Activity,
  Radio,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Hash,
  Maximize2,
  Gauge,
  Box,
  Layers,
  ArrowRight,
  RefreshCw,
  Cpu,
  X,
} from 'lucide-react';
import { useUltrasonicSensor } from '@/hooks/useUltrasonicSensor';
import GlassIcon from '@/components/GlassIcon';

interface UltrasonicDashboardProps {
  onClose?: () => void;
  compact?: boolean;
}

export default function UltrasonicDashboard({ onClose, compact = false }: UltrasonicDashboardProps) {
  const sensor = useUltrasonicSensor({ pollingIntervalMs: 750 });

  // Format display string for distance
  let distanceDisplay: string;
  let distanceSubtext: string;
  let isNullEcho = false;

  if (sensor.distance === undefined) {
    distanceDisplay = '--';
    distanceSubtext = 'Waiting for ESP32 telemetry...';
  } else if (sensor.distance === null) {
    distanceDisplay = 'No valid echo';
    isNullEcho = true;
    distanceSubtext = 'Out of detection range or sensor blocked (> 400cm / < 2cm)';
  } else {
    distanceDisplay = sensor.distance.toFixed(1);
    distanceSubtext = sensor.distance < 30 ? 'Object in Cart Range (< 30cm)' : 'Field Clear';
  }

  // Calculate percentage of range (2cm to 400cm)
  const rangePercent =
    typeof sensor.distance === 'number'
      ? Math.min(100, Math.max(0, ((sensor.distance - 2) / (400 - 2)) * 100))
      : 0;

  // Status visual badge config
  const getStatusBadge = () => {
    switch (sensor.status) {
      case 'connected':
        return {
          label: 'Live Streaming',
          color: '#10b981',
          bg: 'rgba(236, 253, 245, 0.9)',
          border: 'rgba(16, 185, 129, 0.4)',
          icon: Wifi,
          pulse: true,
        };
      case 'stale':
        return {
          label: 'Stale (Idle)',
          color: '#f59e0b',
          bg: 'rgba(254, 243, 199, 0.9)',
          border: 'rgba(245, 158, 11, 0.4)',
          icon: AlertTriangle,
          pulse: false,
        };
      case 'disconnected':
        return {
          label: 'Backend Offline',
          color: '#ef4444',
          bg: 'rgba(254, 242, 242, 0.9)',
          border: 'rgba(239, 68, 68, 0.4)',
          icon: WifiOff,
          pulse: false,
        };
      case 'connecting':
      default:
        return {
          label: 'Connecting...',
          color: '#3b82f6',
          bg: 'rgba(239, 246, 255, 0.9)',
          border: 'rgba(59, 130, 246, 0.4)',
          icon: RefreshCw,
          pulse: true,
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div
      style={{
        width: '100%',
        maxWidth: compact ? '100%' : '840px',
        margin: '0 auto',
        padding: compact ? '16px' : '28px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        borderRadius: '32px',
        border: '2px solid rgba(255, 255, 255, 0.95)',
        boxShadow: '0 25px 60px rgba(56, 189, 248, 0.16), 0 4px 16px rgba(0, 0, 0, 0.05)',
        fontFamily: 'var(--font-heading), -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative ambient blurred orb */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '22px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <GlassIcon icon={Radio} color="cyan" size={38} glow />
          <div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: 0,
              }}
            >
              Ultrasonic Distance Monitor
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background: 'rgba(56, 189, 248, 0.14)',
                  color: '#0284c7',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                ESP32 IoT
              </span>
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
              Real-time Wi-Fi telemetry stream via FastAPI backend
            </p>
          </div>
        </div>

        {/* Top Right Actions: Connection status pill + Clean Close Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 16px',
              borderRadius: '999px',
              background: statusBadge.bg,
              border: `1.5px solid ${statusBadge.border}`,
              color: statusBadge.color,
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: statusBadge.color,
                boxShadow: statusBadge.pulse ? `0 0 10px ${statusBadge.color}` : 'none',
                animation: statusBadge.pulse ? 'pulse-dot 1.2s infinite' : 'none',
              }}
            />
            <statusBadge.icon style={{ width: '15px', height: '15px' }} />
            <span>{statusBadge.label}</span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1.5px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Close Monitor"
            >
              <X style={{ width: '18px', height: '18px', strokeWidth: 2.4 }} />
            </button>
          )}
        </div>
      </div>

      {/* Hero Distance Card (Requirement 1: Largest & Most Prominent) */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.85) 100%)',
          borderRadius: '26px',
          border: '2px solid rgba(255, 255, 255, 1)',
          padding: compact ? '20px' : '32px',
          boxShadow: '0 12px 30px rgba(56, 189, 248, 0.12), inset 0 2px 4px #ffffff',
          position: 'relative',
          marginBottom: '20px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: '#64748b',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}
        >
          <Activity style={{ width: '15px', height: '15px', color: '#0ea5e9' }} />
          <span>Current Measured Distance</span>
        </div>

        {/* The Huge Metric Value */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: isNullEcho ? '0px' : '10px',
            margin: '8px 0',
          }}
        >
          <span
            style={{
              fontSize: isNullEcho ? (compact ? '36px' : '44px') : compact ? '64px' : '82px',
              fontWeight: 800,
              fontFamily: 'var(--font-heading), monospace',
              letterSpacing: '-0.03em',
              background: isNullEcho
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : sensor.status === 'disconnected'
                ? '#94a3b8'
                : 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 10px 24px rgba(2, 132, 199, 0.15)',
              transition: 'all 0.3s ease',
            }}
          >
            {distanceDisplay}
          </span>
          {!isNullEcho && sensor.distance !== undefined && (
            <span
              style={{
                fontSize: compact ? '26px' : '34px',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '-0.02em',
              }}
            >
              cm
            </span>
          )}
        </div>

        {/* Dynamic Contextual Subtext */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 14px',
            borderRadius: '999px',
            background: isNullEcho
              ? 'rgba(254, 243, 199, 0.8)'
              : sensor.isObjectPresent
              ? 'rgba(236, 253, 245, 0.9)'
              : 'rgba(241, 245, 249, 0.9)',
            border: isNullEcho
              ? '1px solid rgba(245, 158, 11, 0.3)'
              : sensor.isObjectPresent
              ? '1px solid rgba(16, 185, 129, 0.3)'
              : '1px solid rgba(203, 213, 225, 0.5)',
            color: isNullEcho ? '#b45309' : sensor.isObjectPresent ? '#059669' : '#475569',
            fontSize: '12.5px',
            fontWeight: 700,
          }}
        >
          {sensor.isObjectPresent ? (
            <Box style={{ width: '14px', height: '14px', color: '#10b981' }} />
          ) : (
            <Radio style={{ width: '14px', height: '14px', color: '#0ea5e9' }} />
          )}
          <span>{distanceSubtext}</span>
        </div>

        {/* Range Progress Bar (2 to 400 cm) */}
        <div style={{ marginTop: '24px', padding: '0 8px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontWeight: 700,
              color: '#94a3b8',
              marginBottom: '6px',
            }}
          >
            <span>Min: 2 cm</span>
            <span>Range: 2–400 cm</span>
            <span>Max: 400 cm</span>
          </div>

          <div
            style={{
              width: '100%',
              height: '10px',
              borderRadius: '999px',
              background: '#e2e8f0',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                width: `${rangePercent}%`,
                height: '100%',
                background:
                  rangePercent < 15
                    ? 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)'
                    : 'linear-gradient(90deg, #38bdf8 0%, #3b82f6 50%, #6366f1 100%)',
                borderRadius: '999px',
                transition: 'width 0.4s ease',
                boxShadow: '0 0 8px rgba(56, 189, 248, 0.5)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid: Sensor Information & Connection Diagnostics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'repeat(2, 1fr)',
          gap: '14px',
        }}
      >
        {/* Card 1: Sensor Information (Requirement 3) */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.75)',
            borderRadius: '20px',
            border: '1.5px solid rgba(255, 255, 255, 0.9)',
            padding: '16px 20px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 800,
              color: '#334155',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <Cpu style={{ width: '15px', height: '15px', color: '#6366f1' }} />
            <span>Sensor Information</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Sensor Model:</span>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>HC-SR04 Ultrasonic</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Operating Range:</span>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>2–400 cm</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Packet Counter:</span>
              <span
                style={{
                  color: '#2563eb',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  background: 'rgba(37, 99, 235, 0.08)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                #{sensor.counter !== null ? sensor.counter : '--'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Echo Validity:</span>
              <span
                style={{
                  color: sensor.lastEchoValid ? '#10b981' : isNullEcho ? '#f59e0b' : '#64748b',
                  fontWeight: 700,
                }}
              >
                {sensor.lastEchoValid ? 'Valid Echo' : isNullEcho ? 'No Echo (Null)' : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Connection Status & Timers (Requirement 2 & 4) */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.75)',
            borderRadius: '20px',
            border: '1.5px solid rgba(255, 255, 255, 0.9)',
            padding: '16px 20px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 800,
              color: '#334155',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <Wifi style={{ width: '15px', height: '15px', color: '#10b981' }} />
            <span>Connection & Pipeline</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>FastAPI Host:</span>
              <span style={{ color: '#0f172a', fontWeight: 700, fontFamily: 'monospace' }}>
                localhost:8000
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Last Received:</span>
              <span style={{ color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock style={{ width: '13px', height: '13px', color: '#64748b' }} />
                {sensor.lastUpdateTime ? sensor.lastUpdateTime.toLocaleTimeString() : '--:--:--'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Polling Interval:</span>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>750 ms (0.75s)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Latency:</span>
              <span style={{ color: sensor.latencyMs > 200 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                {sensor.latencyMs} ms
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Network Error Toast if disconnected */}
      {sensor.errorMessage && (
        <div
          style={{
            marginTop: '16px',
            padding: '10px 16px',
            borderRadius: '14px',
            background: 'rgba(254, 242, 242, 0.95)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#b91c1c',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle style={{ width: '15px', height: '15px', flexShrink: 0 }} />
          <span>{sensor.errorMessage}. Ensure `receiver.py` is running on port 8000.</span>
        </div>
      )}
    </div>
  );
}
