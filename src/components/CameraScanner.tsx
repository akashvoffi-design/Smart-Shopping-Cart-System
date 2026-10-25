'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Scan, Sparkles, Check, AlertTriangle, Cpu, Layers, Power, ShieldAlert } from 'lucide-react';
import { Product, IoTTelemetry } from '@/types';
import { getProductByBarcode } from '@/lib/products';
import { isScanDebounced } from '@/lib/cart-store';
import { iotSimulator } from '@/lib/iot-simulator';
import { checkVisionModelStatus, VisionModelStatus, detectBarcodeInVideoFrame } from '@/lib/vision';
import CameraObstructionOverlay from '@/components/CameraObstructionOverlay';
import { analyzeVideoFrameForObstruction } from '@/lib/obstruction-detector';

interface CameraScannerProps {
  telemetry: IoTTelemetry;
  onItemValidated: (product: Product, quantity?: number) => void;
}

export default function CameraScanner({ telemetry, onItemValidated }: CameraScannerProps) {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState<VisionModelStatus | null>(null);
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const [fusionStatus, setFusionStatus] = useState<{
    status: 'idle' | 'matching' | 'confirmed' | 'mismatch';
    message: string;
    expectedG?: number;
    measuredG?: number;
  }>({ status: 'idle', message: 'Ready to scan items' });

  // Camera Obstruction Detection States & Refs
  const [isCameraObstructed, setIsCameraObstructed] = useState<boolean>(false);
  const [isCameraRestored, setIsCameraRestored] = useState<boolean>(false);
  const obstructionStartTimeRef = useRef<number | null>(null);
  const lastObstructionCheckTimeRef = useRef<number>(0);
  const consecutiveClearFramesRef = useRef<number>(0);
  const wasPreviouslyObstructedRef = useRef<boolean>(false);
  const restoredTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sampleObstructionCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [videoResolution, setVideoResolution] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    checkVisionModelStatus().then((status) => setModelStatus(status));
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment.');
      }
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            frameRate: { ideal: 30, max: 30 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        });
      }

      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as Record<string, unknown>;
        if (capabilities.focusMode && Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes('continuous')) {
          try {
            await (videoTrack as any).applyConstraints({
              advanced: [{ focusMode: 'continuous' }],
            });
          } catch {}
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            setVideoResolution({
              width: videoRef.current.videoWidth || 1920,
              height: videoRef.current.videoHeight || 1080,
            });
            videoRef.current.play().catch(() => {});
          }
        };
      }
      setCameraActive(true);
    } catch (err: unknown) {
      const errorObj = err as Error;
      let userFriendlyMsg = errorObj.message || 'Unable to access camera.';
      if (errorObj.name === 'NotAllowedError' || errorObj.name === 'PermissionDeniedError') {
        userFriendlyMsg = 'Camera permission denied. Please allow camera access in browser settings.';
      } else if (errorObj.name === 'NotFoundError' || errorObj.name === 'DevicesNotFoundError') {
        userFriendlyMsg = 'No camera device detected on this laptop.';
      } else if (errorObj.name === 'NotReadableError' || errorObj.name === 'TrackStartError') {
        userFriendlyMsg = 'Camera is currently in use by another application (e.g. Teams, Zoom).';
      }
      setCameraError(userFriendlyMsg);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setVideoResolution(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraObstructed(false);
    setIsCameraRestored(false);
    obstructionStartTimeRef.current = null;
    wasPreviouslyObstructedRef.current = false;
    if (restoredTimeoutRef.current) clearTimeout(restoredTimeoutRef.current);
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Real-time video frame barcode scanning loop with 2-second obstruction detector
  useEffect(() => {
    if (!cameraActive) return;
    let isScanning = true;
    let lastScanTime = 0;

    const intervalId = setInterval(async () => {
      if (!isScanning) return;
      const now = performance.now();

      // 1. Continuous obstruction detection every 100ms
      let isCurrentlyBlocked = isCameraObstructed;
      if (now - lastObstructionCheckTimeRef.current >= 100) {
        lastObstructionCheckTimeRef.current = now;
        if (videoRef.current && videoRef.current.readyState >= 2) {
          const analysis = analyzeVideoFrameForObstruction(videoRef.current, sampleObstructionCanvasRef.current || undefined);
          if (analysis.isObstructed) {
            consecutiveClearFramesRef.current = 0;
            if (obstructionStartTimeRef.current === null) {
              obstructionStartTimeRef.current = now;
            } else {
              const elapsed = now - obstructionStartTimeRef.current;
              // If obstruction remains for 2 continuous seconds, show warning overlay!
              if (elapsed >= 2000) {
                isCurrentlyBlocked = true;
                if (!isCameraObstructed) {
                  setIsCameraObstructed(true);
                  wasPreviouslyObstructedRef.current = true;
                }
              }
            }
          } else {
            consecutiveClearFramesRef.current++;
            // Require 3 consecutive clear frames to confirm view is restored
            if (consecutiveClearFramesRef.current >= 3) {
              obstructionStartTimeRef.current = null;
              if (wasPreviouslyObstructedRef.current) {
                isCurrentlyBlocked = false;
                setIsCameraObstructed(false);
                wasPreviouslyObstructedRef.current = false;
                setIsCameraRestored(true);
                if (restoredTimeoutRef.current) clearTimeout(restoredTimeoutRef.current);
                restoredTimeoutRef.current = setTimeout(() => {
                  setIsCameraRestored(false);
                }, 3500);
              }
            }
          }
        }
      }

      // If camera view is obstructed, suspend barcode recognition
      if (isCurrentlyBlocked) {
        return;
      }

      if (now - lastScanTime >= 160) {
        lastScanTime = now;
        if (videoRef.current && videoRef.current.readyState >= 2) {
          try {
            const barcode = await detectBarcodeInVideoFrame(videoRef.current);
            if (barcode && !isScanDebounced(barcode)) {
              handleBarcodeDetected(barcode);
            }
          } catch {}
        }
      }
    }, 100);

    return () => {
      isScanning = false;
      clearInterval(intervalId);
    };
  }, [cameraActive, telemetry.weight_g, isCameraObstructed]);

  const handleBarcodeDetected = (barcode: string) => {
    if (isScanDebounced(barcode)) return;

    const product = getProductByBarcode(barcode);
    if (!product) {
      iotSimulator.playBuzzer('error');
      setFusionStatus({
        status: 'mismatch',
        message: `Unknown barcode: ${barcode}. Not registered in store catalogue.`,
      });
      return;
    }

    setLastScannedProduct(product);
    const expectedWeight = product.weight_g || 100;
    const currentScaleWeight = telemetry.weight_g;

    const weightDiff = Math.abs(currentScaleWeight - expectedWeight);
    const tolerance = Math.max(25.0, expectedWeight * 0.2);

    const isWeightMatching = currentScaleWeight > 5 && weightDiff <= tolerance;

    if (isWeightMatching) {
      iotSimulator.playBuzzer('success');
      setFusionStatus({
        status: 'confirmed',
        message: `Consensus Verified: Camera recognized "${product.product_name}" and scale confirmed +${currentScaleWeight.toFixed(0)}g (Expected: ${expectedWeight}g).`,
        expectedG: expectedWeight,
        measuredG: currentScaleWeight,
      });
      onItemValidated(product, 1);
    } else {
      iotSimulator.playBuzzer('error');
      setFusionStatus({
        status: 'mismatch',
        message: `Sensor Mismatch: Scanned "${product.product_name}" (Expected ${expectedWeight}g), but scale currently reads ${currentScaleWeight.toFixed(1)}g. Place item onto the scale platform to validate!`,
        expectedG: expectedWeight,
        measuredG: currentScaleWeight,
      });
    }
  };

  const handlePlaceAndConfirm = () => {
    if (!lastScannedProduct) return;
    const expected = lastScannedProduct.weight_g || 100;

    iotSimulator.placeWeight(expected);

    setTimeout(() => {
      iotSimulator.playBuzzer('success');
      setFusionStatus({
        status: 'confirmed',
        message: `Confirmed: Placed ${expected}g on scale. Consensus validated for "${lastScannedProduct.product_name}".`,
        expectedG: expected,
        measuredG: expected,
      });
      onItemValidated(lastScannedProduct, 1);
    }, 450);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25105f' }}>
            <Scan style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#1c1b22' }}>
              Dual-Sensor Vision & Barcode Scanner
            </h3>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              Cross-validates visual item identity with live HX711 weight delta
            </p>
          </div>
        </div>

        <div>
          {cameraActive ? (
            <button
              onClick={stopCamera}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#fee2e2',
                color: '#991b1b',
                border: '1px solid #fca5a5',
                borderRadius: '100px',
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <CameraOff style={{ width: '15px', height: '15px' }} />
              Stop Camera
            </button>
          ) : (
            <button
              onClick={startCamera}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#25105f',
                color: '#ffffff',
                border: 'none',
                borderRadius: '100px',
                padding: '8px 20px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 16, 95, 0.25)',
              }}
            >
              <Camera style={{ width: '15px', height: '15px' }} />
              Activate Camera
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Viewfinder on Left, Status & Quick Scan on Right */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Left Column: Camera Viewfinder */}
        <div style={{ flex: '1 1 400px', minWidth: '300px' }}>
          <div
            className="camera-viewfinder-screen"
            style={{
              minHeight: '340px',
              aspectRatio: '16 / 10',
            }}
          >
            {/* Luminous Glow Frame Highlights */}
            <div className="viewfinder-glow-rim" />

            {/* 4 Corner Bubbles & L-Brackets */}
            <div className="viewfinder-corner-decor corner-top-left">
              <div className="corner-bubble" />
              <div className="corner-bracket" />
            </div>
            <div className="viewfinder-corner-decor corner-top-right">
              <div className="corner-bubble" />
              <div className="corner-bracket" />
            </div>
            <div className="viewfinder-corner-decor corner-bottom-left">
              <div className="corner-bubble" />
              <div className="corner-bracket" />
            </div>
            <div className="viewfinder-corner-decor corner-bottom-right">
              <div className="corner-bubble" />
              <div className="corner-bracket" />
            </div>

            {cameraActive ? (
              <div className="camera-active-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video-feed"
                />

                {/* Real-Time Camera Obstruction Warning Overlay */}
                <CameraObstructionOverlay
                  isObstructed={isCameraObstructed}
                  isRestored={isCameraRestored}
                />

                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div className="scanner-ring" style={{ width: '180px', height: '180px', border: '2px solid #10b981', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '150px', height: '2px', background: 'rgba(16, 185, 129, 0.9)' }} />
                  </div>
                </div>

                {/* Top Status Indicators (Camera Resolution + Live Scanning / Obstruction Status) */}
                <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', padding: '5px 14px', borderRadius: '100px', fontSize: '11px', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.9)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                    LIVE CAMERA • {videoResolution ? `${videoResolution.width} × ${videoResolution.height}` : 'FHD 1080p'}
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 13px',
                      borderRadius: '100px',
                      background: isCameraObstructed ? 'rgba(254, 242, 242, 0.95)' : 'rgba(236, 253, 245, 0.95)',
                      border: isCameraObstructed ? '1.5px solid rgba(239, 68, 68, 0.6)' : '1.5px solid rgba(16, 185, 129, 0.6)',
                      color: isCameraObstructed ? '#dc2626' : '#059669',
                      fontSize: '11px',
                      fontWeight: 700,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: isCameraObstructed ? '#ef4444' : '#10b981',
                        boxShadow: isCameraObstructed ? '0 0 8px #ef4444' : '0 0 8px #10b981',
                      }}
                    />
                    <span>{isCameraObstructed ? 'Camera Blocked' : 'Scanning Products...'}</span>
                  </div>
                </div>

                {/* Floating Bottom Action Controls */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '18px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 35,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(15, 23, 42, 0.72)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(255, 255, 255, 0.3)',
                    padding: '6px 12px',
                    borderRadius: '100px',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (isCameraObstructed) {
                        setIsCameraObstructed(false);
                        setIsCameraRestored(true);
                        setTimeout(() => setIsCameraRestored(false), 3500);
                      } else {
                        setIsCameraObstructed(true);
                      }
                    }}
                    style={{
                      background: isCameraObstructed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.14)',
                      border: isCameraObstructed ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(255, 255, 255, 0.3)',
                      color: '#ffffff',
                      borderRadius: '100px',
                      padding: '7px 16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                    title="Toggle simulated obstruction test"
                  >
                    <ShieldAlert style={{ width: '14px', height: '14px', color: '#f59e0b' }} />
                    <span>{isCameraObstructed ? 'Clear Obstruction' : 'Test Blocked Alert'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      border: '1.5px solid rgba(255, 255, 255, 0.45)',
                      color: '#ffffff',
                      borderRadius: '100px',
                      padding: '7px 18px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.45)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <CameraOff style={{ width: '14px', height: '14px' }} />
                    <span>Stop Camera</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="camera-inactive-container">
                <div className="camera-center-action-wrapper">
                  <div className="camera-glass-orb">
                    <div className="orb-satellite-top-left" />
                    <div className="orb-satellite-bottom-right" />
                    <svg
                      width="42"
                      height="42"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ position: 'relative', zIndex: 3 }}
                    >
                      <defs>
                        <linearGradient id="modalCamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#2563eb" />
                          <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
                        stroke="url(#modalCamGrad)"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="13"
                        r="3.2"
                        stroke="url(#modalCamGrad)"
                        strokeWidth="2.2"
                      />
                    </svg>
                  </div>
                  <button onClick={startCamera} className="camera-toggle-pill-btn">
                    <Power style={{ width: '15px', height: '15px', strokeWidth: 2.5 }} />
                    <span>Turn on camera</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Model Status Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', padding: '8px 14px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu style={{ width: '14px', height: '14px', color: '#527ca7' }} />
              <span style={{ fontWeight: 600, color: '#334155' }}>Model Engine:</span>
              <span style={{ background: '#e2e8f0', color: '#1e293b', padding: '2px 8px', borderRadius: '100px', fontWeight: 600 }}>
                HTML5 Barcode + PyTorch Ready
              </span>
            </div>
            <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>Debounce: 2500ms</span>
          </div>
        </div>

        {/* Right Column: Consensus Status & Quick Reference Items */}
        <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Fusion Status Box */}
          <div
            style={{
              padding: '16px',
              borderRadius: '20px',
              border: `1px solid ${
                fusionStatus.status === 'confirmed'
                  ? '#a7f3d0'
                  : fusionStatus.status === 'mismatch'
                  ? '#fecdd3'
                  : '#e2e8f0'
              }`,
              background:
                fusionStatus.status === 'confirmed'
                  ? '#ecfdf5'
                  : fusionStatus.status === 'mismatch'
                  ? '#fff1f2'
                  : '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {fusionStatus.status === 'confirmed' ? (
                <Check style={{ width: '20px', height: '20px', color: '#059669', flexShrink: 0, marginTop: '2px' }} />
              ) : fusionStatus.status === 'mismatch' ? (
                <AlertTriangle style={{ width: '20px', height: '20px', color: '#e11d48', flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <Layers style={{ width: '20px', height: '20px', color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
              )}
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: fusionStatus.status === 'confirmed' ? '#065f46' : fusionStatus.status === 'mismatch' ? '#9f1239' : '#1e293b' }}>
                  {fusionStatus.status === 'confirmed'
                    ? 'Dual-Sensor Consensus: Confirmed'
                    : fusionStatus.status === 'mismatch'
                    ? 'Sensor Mismatch / Action Required'
                    : 'Dual-Sensor Fusion Idle'}
                </h4>
                <p style={{ fontSize: '12px', marginTop: '4px', lineHeight: 1.5, color: '#374151' }}>
                  {fusionStatus.message}
                </p>

                {fusionStatus.status === 'mismatch' && lastScannedProduct && (
                  <button
                    onClick={handlePlaceAndConfirm}
                    style={{
                      marginTop: '10px',
                      background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '100px',
                      padding: '8px 16px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(5,150,105,0.25)',
                    }}
                  >
                    Place {lastScannedProduct.weight_g}g on Scale & Validate
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Authentic GS1 Reference Staples Box */}
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1c1b22', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles style={{ width: '15px', height: '15px', color: '#f59e0b' }} />
                GS1 Verified Staples (One-Click Scan)
              </span>
              <span style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'monospace' }}>Authentic EAN-13</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {[
                { code: '8901063012480', name: 'Parle-G Biscuits', weight: '56g', price: 10 },
                { code: '8901058852336', name: 'Maggi Noodles', weight: '70g', price: 14 },
                { code: '8901262010011', name: 'Amul Butter', weight: '100g', price: 56 },
                { code: '8901725181222', name: 'Tata Salt (1kg)', weight: '1000g', price: 25 },
                { code: '8901233024854', name: 'Fuji Apple', weight: '180g', price: 30 },
                { code: '8901233024861', name: 'Good Day Cookies', weight: '100g', price: 20 },
              ].map((item) => (
                <button
                  key={item.code}
                  onClick={() => handleBarcodeDetected(item.code)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3e8ff';
                    e.currentTarget.style.borderColor = '#c084fc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px', fontSize: '10px', color: '#64748b' }}>
                    <span style={{ fontWeight: 700, color: '#25105f' }}>₹{item.price}</span>
                    <span style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: '4px' }}>{item.weight}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
