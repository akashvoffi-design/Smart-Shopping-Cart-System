'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Eye, ShieldAlert, Sparkles } from 'lucide-react';

interface CameraObstructionOverlayProps {
  isObstructed: boolean;
  isRestored: boolean;
  obstructionDurationMs?: number;
  onDismissRestored?: () => void;
}

export default function CameraObstructionOverlay({
  isObstructed,
  isRestored,
  obstructionDurationMs = 0,
  onDismissRestored,
}: CameraObstructionOverlayProps) {
  return (
    <>
      {/* 1. Full Viewport Obstruction Alert (shown after 2s sustained block) */}
      {isObstructed && (
        <div
          className="camera-obstruction-overlay animate-fadeIn"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(14px) saturate(160%)',
            WebkitBackdropFilter: 'blur(14px) saturate(160%)',
            border: '2.5px solid #ef4444',
            borderRadius: '24px',
            boxShadow: 'inset 0 0 40px rgba(239, 68, 68, 0.35), 0 0 50px rgba(239, 68, 68, 0.45)',
            padding: '24px',
            textAlign: 'center',
            color: '#ffffff',
            overflow: 'hidden',
          }}
        >
          {/* Ambient Warning Radial Glow */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.28) 0%, transparent 70%)',
              pointerEvents: 'none',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />

          {/* Visual Illustration: Hand Covering Webcam Lens with Warning Waves */}
          <div style={{ position: 'relative', marginBottom: '16px', zIndex: 2 }}>
            <svg
              width="140"
              height="100"
              viewBox="0 0 160 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: 'drop-shadow(0 8px 24px rgba(239, 68, 68, 0.45))' }}
            >
              {/* Laptop Screen Bezel */}
              <rect x="25" y="15" width="110" height="75" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="2" />
              {/* Screen Glass Area */}
              <rect x="33" y="24" width="94" height="58" rx="6" fill="#0f172a" />
              
              {/* Warning Radar Pulse Rings around Webcam */}
              <circle cx="80" cy="20" r="16" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="3 3">
                <animate attributeName="r" values="8;20;8" dur="2s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="80" cy="20" r="10" stroke="#f97316" strokeWidth="1.5" strokeOpacity="0.7">
                <animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" />
              </circle>

              {/* Webcam Lens Hardware */}
              <circle cx="80" cy="20" r="5" fill="#090d16" stroke="#ef4444" strokeWidth="2" />
              <circle cx="80" cy="20" r="2" fill="#ef4444">
                <animate attributeName="fill" values="#ef4444;#dc2626;#ef4444" dur="1s" repeatCount="indefinite" />
              </circle>

              {/* Hand Covering Camera Illustration */}
              <g transform="translate(68, 8)">
                {/* Hand Palm & Fingers covering the lens */}
                <path
                  d="M12 28 C8 24 6 18 10 12 C13 8 18 7 21 11 L24 16 L27 10 C30 6 35 6 38 10 C40 13 40 18 38 22 L37 28 C37 36 30 42 22 42 C16 42 12 37 12 28 Z"
                  fill="url(#handGrad)"
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))"
                />
                {/* Finger crease details */}
                <path d="M19 14 L20 22" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M26 13 L27 21" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M33 14 L34 22" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" />

                {/* Hand Movement Warning Motion Waves */}
                <path d="M-6 16 C-8 12 -8 6 -5 2" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3" />
                <path d="M48 16 C50 12 50 6 47 2" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3" />
              </g>

              {/* Caution Cross Hatch Diagonal on screen */}
              <line x1="40" y1="32" x2="120" y2="76" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="4 4" />
              <line x1="120" y1="32" x2="40" y2="76" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="4 4" />

              <defs>
                <linearGradient id="handGrad" x1="10" y1="6" x2="35" y2="42" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="50%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#b91c1c" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Heading */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px', zIndex: 2 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.5)',
              }}
            >
              <AlertTriangle style={{ width: '18px', height: '18px', color: '#ffffff', strokeWidth: 2.6 }} />
            </div>
            <h3
              style={{
                fontSize: '22px',
                fontWeight: 900,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
            >
              ⚠️ Camera Blocked!
            </h3>
          </div>

          {/* User Instruction Message */}
          <p
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#f8fafc',
              maxWidth: '380px',
              margin: '0 0 16px 0',
              lineHeight: 1.5,
              zIndex: 2,
            }}
          >
            Your camera view is obstructed. Please remove your hand or the object covering the camera to continue scanning products.
          </p>

          {/* Status Badges Group */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            {/* Scanning Suspended Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'rgba(239, 68, 68, 0.22)',
                border: '1.5px solid rgba(248, 113, 113, 0.6)',
                color: '#fecaca',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.01em',
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }} />
              <span>Scanning Paused</span>
            </div>

            {/* Instruction Callout */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <span>Remove obstruction to resume</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Camera View Restored Banner Notification (Brief 3s Success Pop) */}
      {isRestored && !isObstructed && (
        <div
          className="camera-restored-banner animate-slideDown"
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 45,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 22px',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '2px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 12px 35px rgba(16, 185, 129, 0.45), 0 4px 12px rgba(0, 0, 0, 0.2)',
            color: '#ffffff',
            pointerEvents: 'auto',
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 style={{ width: '18px', height: '18px', strokeWidth: 3 }} />
          </div>

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              ✓ Camera View Restored
            </div>
            <div style={{ fontSize: '11.5px', fontWeight: 600, opacity: 0.95, lineHeight: 1.2, marginTop: '2px' }}>
              You're all set! Product scanning has resumed.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
