'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Camera,
  CameraOff,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Power,
  ShoppingBag,
  Scale,
  IndianRupee,
  ReceiptText,
  Percent,
  ArrowRight,
  Apple,
  Cookie,
  Milk,
  Package,
  Leaf,
  SprayCan,
  House,
  ShoppingCart,
  ShieldCheck,
  RefreshCw,
  Video,
  Settings2,
  Sliders,
  AlertCircle,
  Sparkles,
  Undo2,
  Tag,
} from 'lucide-react';
import GlassIcon, { GlassColor } from '@/components/GlassIcon';
import { Product, CartSummary, CartItem, IoTTelemetry } from '@/types';
import { STAPLE_CATALOG_ITEMS, StapleItem, getProductByBarcode, checkProductStock } from '@/lib/products';
import { updateItemQuantity, removeItemFromCart, clearCart, isScanDebounced } from '@/lib/cart-store';
import { iotSimulator } from '@/lib/iot-simulator';
import { detectBarcodeInVideoFrame } from '@/lib/vision';
import { mapVisionClassToProduct } from '@/lib/vision-catalog-mapper';

interface AutonomousDashboardViewProps {
  summary: CartSummary;
  telemetry: IoTTelemetry;
  onAddItem: (product: Product, quantity?: number) => void;
  onOpenCatalogueModal?: () => void;
  autoStartWebcamTrigger?: number;
}

export default function AutonomousDashboardView({
  summary,
  telemetry,
  onAddItem,
  autoStartWebcamTrigger,
}: AutonomousDashboardViewProps) {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(
    'No item detected yet. Try an apple, banana, orange, bottle or cup.'
  );
  const [isSuccessFeedback, setIsSuccessFeedback] = useState<boolean>(false);

  // Real-time camera resolution & measured FPS states
  const [videoResolution, setVideoResolution] = useState<{ width: number; height: number } | null>(null);
  const [measuredFPS, setMeasuredFPS] = useState<number>(0);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [hasAutofocus, setHasAutofocus] = useState<boolean>(false);

  // YOLO Vision Model & Detection States
  const [modelStatus, setModelStatus] = useState<{
    loaded: boolean;
    isCustom: boolean;
    modelName: string | null;
    serviceOnline: boolean;
    notes?: string;
  }>({
    loaded: false,
    isCustom: false,
    modelName: null,
    serviceOnline: false,
  });

  const [lockedBarcode, setLockedBarcode] = useState<string | null>(null);
  const [lockedProductName, setLockedProductName] = useState<string | null>(null);
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraCardRef = useRef<HTMLDivElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // FPS tracking refs
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(0);
  const lastInferenceTimeRef = useRef<number>(0);
  const lastYoloInferenceTimeRef = useRef<number>(0);
  const isInferenceInFlightRef = useRef<boolean>(false);

  // Multi-item stability and lock tracker ref
  const multiItemTrackerRef = useRef<{
    stabilityMap: Map<string, { count: number; lastSeen: number }>;
    lockedBarcodes: Set<string>;
    lastDetectionTime: number;
  }>({
    stabilityMap: new Map(),
    lockedBarcodes: new Set(),
    lastDetectionTime: 0,
  });

  // Enumerate connected video input devices
  const refreshDevices = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch {
      // Enumeration error
    }
  };

  useEffect(() => {
    refreshDevices();
  }, []);

  // Toggle real webcam with best supported resolution negotiation
  const startCamera = async (deviceIdToUse?: string) => {
    setCameraError(null);
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment.');
      }

      // Stop previous tracks if switching cameras
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const activeDevId = deviceIdToUse || selectedDeviceId;

      // Tier 1 constraints: Request ideal 1920x1080 @ 30 FPS
      const constraintsTier1: MediaStreamConstraints = {
        audio: false,
        video: {
          deviceId: activeDevId ? { exact: activeDevId } : undefined,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, max: 30 },
          // Allow desktop/laptop webcams without forcing 'environment'
          facingMode: activeDevId ? undefined : { ideal: 'user' },
        },
      };

      let stream: MediaStream | null = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraintsTier1);
      } catch (tier1Err) {
        console.warn('1080p camera constraint unavailable, falling back to 720p/balanced stream:', tier1Err);
        // Tier 2 fallback: 1280x720 balanced resolution
        const constraintsTier2: MediaStreamConstraints = {
          audio: false,
          video: {
            deviceId: activeDevId ? { exact: activeDevId } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        };
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraintsTier2);
        } catch (tier2Err) {
          console.warn('720p constraint unavailable, falling back to basic video feed:', tier2Err);
          // Tier 3 fallback: basic video stream
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: activeDevId ? { deviceId: { exact: activeDevId } } : true,
          });
        }
      }

      if (!stream) {
        throw new Error('Unable to start camera stream.');
      }

      streamRef.current = stream;

      // Check capabilities (autofocus & exposure)
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as Record<string, unknown>;
        if (capabilities.focusMode && Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes('continuous')) {
          setHasAutofocus(true);
          try {
            await (videoTrack as any).applyConstraints({
              advanced: [{ focusMode: 'continuous' }],
            });
          } catch {
            // Advanced constraint not applied, continuing safely
          }
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
      setStatusMessage('FHD Vision sensor active. Point grocery items or barcodes to scan.');
      refreshDevices();
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
      setStatusMessage(`Camera offline: ${userFriendlyMsg}`);
    }
  };

  // Check vision service status periodically
  const checkVisionStatus = async () => {
    try {
      const res = await fetch('/api/vision/status');
      if (res.ok) {
        const data = await res.json();
        setModelStatus({
          loaded: !!data.model_loaded,
          isCustom: !!data.is_custom_trained,
          modelName: data.model_name || (data.is_custom_trained ? 'best.pt' : 'yolo26s.pt'),
          serviceOnline: !!data.python_service_online,
          notes: data.notes,
        });
      }
    } catch {
      setModelStatus((prev) => ({ ...prev, serviceOnline: false }));
    }
  };

  useEffect(() => {
    checkVisionStatus();
    const interval = setInterval(checkVisionStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  const clearCanvas = () => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const drawDetections = (
    detections: Array<{
      class_name: string;
      confidence: number;
      box_normalized: { x_min: number; y_min: number; width: number; height: number };
    }>,
    lockedBarcodes: Set<string>
  ) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = (canvas.width = video.videoWidth || video.clientWidth || 640);
    const h = (canvas.height = video.videoHeight || video.clientHeight || 480);
    ctx.clearRect(0, 0, w, h);

    if (!detections || detections.length === 0) return;

    detections.forEach((det) => {
      // Snug bounding box with subtle padding around perimeter
      const padX = det.box_normalized.width * w * 0.04;
      const padY = det.box_normalized.height * h * 0.04;
      // Invert X coordinate so overlay matches the horizontally mirrored webcam view (selfie/mirror mode)
      const mirroredX = w - (det.box_normalized.x_min + det.box_normalized.width) * w;
      const x = Math.max(2, mirroredX - padX);
      const y = Math.max(2, det.box_normalized.y_min * h - padY);
      const bw = Math.min(w - x - 2, det.box_normalized.width * w + padX * 2);
      const bh = Math.min(h - y - 2, det.box_normalized.height * h + padY * 2);

      // Map detection to product and check live inventory stock
      const mapped = mapVisionClassToProduct(det.class_name, det.confidence);
      const stockStatus = mapped.product ? checkProductStock(mapped.product.barcode) : null;
      const isItemLocked = mapped.product ? lockedBarcodes.has(mapped.product.barcode) : false;
      const isOutOfStock = stockStatus ? (!stockStatus.in_stock || stockStatus.stock_quantity <= 0) : false;

      // 4 Distinct Visual Color & Glowing Profiles:
      // 1. Red (#ef4444): Out of Stock
      // 2. Emerald (#10b981): Confirmed in Cart (Locked)
      // 3. Sky Blue (#38bdf8): Available in Stock (Scanning / Targeting)
      // 4. Amber (#f59e0b): Unregistered product class
      let boxStroke = '#38bdf8';
      let boxShadow = 'rgba(56, 189, 248, 0.75)';
      let bracketStroke = '#0284c7';
      let pillBg = 'rgba(15, 23, 42, 0.90)';
      let pillBorder = '#38bdf8';
      let confText = `${mapped.product ? mapped.product.product_name : det.class_name} ${(det.confidence * 100).toFixed(0)}%`;

      if (isOutOfStock) {
        boxStroke = '#ef4444';
        boxShadow = 'rgba(239, 68, 68, 0.85)';
        bracketStroke = '#f87171';
        pillBg = 'rgba(127, 29, 29, 0.94)';
        pillBorder = '#ef4444';
        confText = `⚠️ ${mapped.product?.product_name || det.class_name} - Out of Stock`;
      } else if (isItemLocked) {
        boxStroke = '#10b981';
        boxShadow = 'rgba(16, 185, 129, 0.85)';
        bracketStroke = '#34d399';
        pillBg = 'rgba(6, 78, 59, 0.94)';
        pillBorder = '#34d399';
        confText = `✓ ${mapped.product?.product_name || det.class_name} ${(det.confidence * 100).toFixed(0)}% (In Cart)`;
      } else if (mapped.product && stockStatus && stockStatus.in_stock) {
        boxStroke = '#38bdf8';
        boxShadow = 'rgba(56, 189, 248, 0.85)';
        bracketStroke = '#0284c7';
        pillBg = 'rgba(15, 23, 42, 0.90)';
        pillBorder = '#38bdf8';
        confText = `${mapped.product.product_name} ${(det.confidence * 100).toFixed(0)}% (${stockStatus.stock_quantity} left)`;
      } else {
        boxStroke = '#f59e0b';
        boxShadow = 'rgba(245, 158, 11, 0.80)';
        bracketStroke = '#fbbf24';
        pillBg = 'rgba(120, 53, 15, 0.92)';
        pillBorder = '#f59e0b';
        confText = `Product not recognized (${(det.confidence * 100).toFixed(0)}%)`;
      }

      // Glowing bounding box
      ctx.save();
      ctx.strokeStyle = boxStroke;
      ctx.lineWidth = 3;
      ctx.shadowColor = boxShadow;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, bw, bh, 14);
      } else {
        ctx.rect(x, y, bw, bh);
      }
      ctx.stroke();

      // Corner brackets
      const bracketLen = Math.min(22, bw * 0.3, bh * 0.3);
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = bracketStroke;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(x, y + bracketLen);
      ctx.lineTo(x, y);
      ctx.lineTo(x + bracketLen, y);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(x + bw - bracketLen, y);
      ctx.lineTo(x + bw, y);
      ctx.lineTo(x + bw, y + bracketLen);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(x, y + bh - bracketLen);
      ctx.lineTo(x, y + bh);
      ctx.lineTo(x + bracketLen, y + bh);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(x + bw - bracketLen, y + bh);
      ctx.lineTo(x + bw, y + bh);
      ctx.lineTo(x + bw, y + bh - bracketLen);
      ctx.stroke();

      ctx.restore();

      // Label Pill
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const textMetrics = ctx.measureText(confText);
      const pillW = textMetrics.width + 24;
      const pillH = 26;
      const pillX = Math.max(8, Math.min(x, w - pillW - 8));
      const pillY = Math.max(8, y - pillH - 6);

      // Pill glass background
      ctx.save();
      ctx.fillStyle = pillBg;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(pillX, pillY, pillW, pillH, 8);
      } else {
        ctx.rect(pillX, pillY, pillW, pillH);
      }
      ctx.fill();

      ctx.strokeStyle = pillBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(confText, pillX + 12, pillY + 18);
      ctx.restore();
    });
  };

  const captureFrameForInference = (video: HTMLVideoElement): string | null => {
    if (!video || video.readyState < 2) return null;
    if (!hiddenCanvasRef.current) {
      hiddenCanvasRef.current = document.createElement('canvas');
    }
    const canvas = hiddenCanvasRef.current;
    const targetW = 640;
    const targetH = Math.round((640 * (video.videoHeight || 480)) / (video.videoWidth || 640));
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, targetW, targetH);
    return canvas.toDataURL('image/jpeg', 0.82);
  };

  const handleScanNextItem = () => {
    multiItemTrackerRef.current.lockedBarcodes.clear();
    multiItemTrackerRef.current.stabilityMap.clear();
    setLockedBarcode(null);
    setLockedProductName(null);
    setIsSuccessFeedback(false);
    setStatusMessage('Ready for next item. Hold product in front of camera.');
    clearCanvas();
  };

  const handleUndo = () => {
    if (lastAddedProduct) {
      handleRemove(lastAddedProduct.barcode);
      multiItemTrackerRef.current.lockedBarcodes.delete(lastAddedProduct.barcode);
      multiItemTrackerRef.current.stabilityMap.delete(lastAddedProduct.barcode);
      setLockedBarcode(null);
      setLockedProductName(null);
      const removedName = lastAddedProduct.product_name;
      setLastAddedProduct(null);
      setIsSuccessFeedback(false);
      setStatusMessage(`Removed "${removedName}" from cart.`);
      clearCanvas();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    clearCanvas();
    multiItemTrackerRef.current.lockedBarcodes.clear();
    multiItemTrackerRef.current.stabilityMap.clear();
    setLockedBarcode(null);
    setLockedProductName(null);
    setCameraActive(false);
    setVideoResolution(null);
    setMeasuredFPS(0);
    setStatusMessage('No item detected yet. Try an apple, banana, orange, bottle or cup.');
  };

  // Re-connect video stream if element mounts while camera is active
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          setVideoResolution({
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight,
          });
        }
      };
    }
  }, [cameraActive]);

  // Handle auto-start trigger when redirected from catalogue modal Scan Item action
  useEffect(() => {
    if (autoStartWebcamTrigger && autoStartWebcamTrigger > 0) {
      startCamera();
      if (cameraCardRef.current) {
        cameraCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setStatusMessage('🎥 Laptop webcam active! Hold grocery items or barcodes to camera to scan.');
    }
  }, [autoStartWebcamTrigger]);

  // High-performance barcode scanning & YOLO object detection loop
  useEffect(() => {
    if (!cameraActive) return;
    let animId: number;
    let isScanning = true;
    frameCountRef.current = 0;
    lastFpsTimeRef.current = performance.now();
    lastInferenceTimeRef.current = 0;
    lastYoloInferenceTimeRef.current = 0;

    const scanLoop = async (now: number) => {
      if (!isScanning) return;

      // 1. Measure real rendered FPS every 1000ms
      frameCountRef.current++;
      const elapsed = now - lastFpsTimeRef.current;
      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setMeasuredFPS(currentFps);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;

        // Also check if video resolution updated
        if (videoRef.current && videoRef.current.videoWidth > 0) {
          const vw = videoRef.current.videoWidth;
          const vh = videoRef.current.videoHeight;
          setVideoResolution((prev) => (prev?.width === vw && prev?.height === vh ? prev : { width: vw, height: vh }));
        }
      }

      // 2. Run barcode detection at 140ms interval
      if (now - lastInferenceTimeRef.current >= 140) {
        lastInferenceTimeRef.current = now;
        if (videoRef.current && videoRef.current.readyState >= 2) {
          try {
            const barcode = await detectBarcodeInVideoFrame(videoRef.current);
            if (barcode && !isScanDebounced(barcode)) {
              const product = getProductByBarcode(barcode);
              if (product) {
                onAddItem(product, 1);
                iotSimulator.placeWeight(product.weight_g || 100);
                iotSimulator.playBuzzer('success');
                setIsSuccessFeedback(true);
                setLastAddedProduct(product);
                setStatusMessage(`✓ Verified Barcode: Scanned "${product.product_name}" (+${product.weight_g || 100}g)`);
                setTimeout(() => {
                  setIsSuccessFeedback(false);
                }, 3200);
              }
            }
          } catch {}
        }
      }

      // 3. Run real-time YOLO object detection at 300ms interval for stable, reliable detection
      if (now - lastYoloInferenceTimeRef.current >= 300 && !isInferenceInFlightRef.current) {
        lastYoloInferenceTimeRef.current = now;
        if (videoRef.current && videoRef.current.readyState >= 2) {
          const frameBase64 = captureFrameForInference(videoRef.current);
          if (frameBase64) {
            isInferenceInFlightRef.current = true;
            fetch('/api/vision/detect', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image_base64: frameBase64,
                confidence_threshold: 0.40,
                iou_threshold: 0.45,
              }),
            })
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => {
                isInferenceInFlightRef.current = false;
                if (!isScanning) return;

                if (data && data.success && Array.isArray(data.detections)) {
                  // Filter out ambient background classes like person / chair
                  const groceryDets = data.detections.filter(
                    (d: any) => !['person', 'chair', 'couch', 'tv', 'laptop'].includes(d.class_name.toLowerCase())
                  );

                  // Render ALL visible grocery items with their distinct state (in-stock, out-of-stock, confirmed, unregistered)
                  drawDetections(groceryDets, multiItemTrackerRef.current.lockedBarcodes);

                  if (groceryDets.length > 0) {
                    multiItemTrackerRef.current.lastDetectionTime = Date.now();
                    const seenInFrame = new Set<string>();
                    const itemsSummaryList: string[] = [];
                    let addedAnyThisFrame = false;

                    // Evaluate every visible grocery item in frame
                    for (const det of groceryDets) {
                      const mapped = mapVisionClassToProduct(det.class_name, det.confidence);

                      if (!mapped.product) {
                        itemsSummaryList.push(`${det.class_name} (${(det.confidence * 100).toFixed(0)}%)`);
                        continue;
                      }

                      const product = mapped.product;
                      const barcode = product.barcode;
                      seenInFrame.add(barcode);

                      // Check inventory stock in database
                      const stockResult = checkProductStock(barcode);

                      if (!stockResult.in_stock || stockResult.stock_quantity <= 0) {
                        itemsSummaryList.push(`⚠️ ${product.product_name} (Out of Stock)`);
                        continue; // Strictly block addition for Out-of-Stock items
                      }

                      const isAlreadyLocked = multiItemTrackerRef.current.lockedBarcodes.has(barcode);
                      if (isAlreadyLocked) {
                        itemsSummaryList.push(`✓ ${product.product_name} (In Cart)`);
                        continue; // Already added and holding in front of camera
                      }

                      itemsSummaryList.push(`${product.product_name} (${(det.confidence * 100).toFixed(0)}%)`);

                      // Stability check: require 3 consistent frames before auto-adding to cart
                      if (det.confidence >= 0.40) {
                        const existing = multiItemTrackerRef.current.stabilityMap.get(barcode) || { count: 0, lastSeen: 0 };
                        existing.count += 1;
                        existing.lastSeen = Date.now();
                        multiItemTrackerRef.current.stabilityMap.set(barcode, existing);

                        if (existing.count >= 3 && !addedAnyThisFrame) {
                          // AUTOMATIC CART ADDITION EVENT!
                          const liveStock = checkProductStock(barcode);
                          if (liveStock.in_stock && liveStock.stock_quantity > 0) {
                            onAddItem(product, 1);
                            iotSimulator.placeWeight(product.weight_g || 100);
                            iotSimulator.playBuzzer('success');

                            multiItemTrackerRef.current.lockedBarcodes.add(barcode);
                            setLockedBarcode(barcode);
                            setLockedProductName(product.product_name);
                            setLastAddedProduct(product);
                            setIsSuccessFeedback(true);
                            setStatusMessage(
                              `✓ Confirmed AI Vision: Added "${product.product_name}" (₹${product.selling_price.toFixed(2)}) to cart (+${product.weight_g || 100}g)`
                            );
                            addedAnyThisFrame = true;
                            setTimeout(() => {
                              setIsSuccessFeedback(false);
                            }, 3200);
                          }
                        }
                      }
                    }

                    // Update live banner with detected products
                    if (!addedAnyThisFrame && !isSuccessFeedback) {
                      const outOfStockItems = groceryDets
                        .map((d: any) => mapVisionClassToProduct(d.class_name, d.confidence))
                        .filter((m: any) => m.product && !checkProductStock(m.product.barcode).in_stock);

                      if (outOfStockItems.length > 0 && groceryDets.length === outOfStockItems.length) {
                        setStatusMessage(
                          `⚠️ "${outOfStockItems[0].product!.product_name}" is Out of Stock. Cannot add to cart.`
                        );
                      } else if (groceryDets.length > 1) {
                        setStatusMessage(`AI Vision detecting ${groceryDets.length} items: ${itemsSummaryList.join(' • ')}`);
                      } else if (groceryDets.length === 1) {
                        const singleMapped = mapVisionClassToProduct(groceryDets[0].class_name, groceryDets[0].confidence);
                        if (singleMapped.product) {
                          if (multiItemTrackerRef.current.lockedBarcodes.has(singleMapped.product.barcode)) {
                            setStatusMessage(
                              `Holding "${singleMapped.product.product_name}" in view. Click "Scan Next Item" to add another.`
                            );
                          } else {
                            const stab = multiItemTrackerRef.current.stabilityMap.get(singleMapped.product.barcode);
                            const c = stab ? stab.count : 1;
                            setStatusMessage(
                              `Targeting "${singleMapped.product.product_name}" (${(groceryDets[0].confidence * 100).toFixed(0)}%)... Hold steady (${Math.min(c, 3)}/3)`
                            );
                          }
                        } else {
                          setStatusMessage(
                            `⚠️ Product not recognized (${(groceryDets[0].confidence * 100).toFixed(0)}%) — Item not in catalog.`
                          );
                        }
                      }
                    }

                    // Clean up tracking for items removed from camera view
                    for (const [bCode, data] of multiItemTrackerRef.current.stabilityMap.entries()) {
                      if (!seenInFrame.has(bCode) && Date.now() - data.lastSeen > 2000) {
                        multiItemTrackerRef.current.stabilityMap.delete(bCode);
                      }
                    }
                    for (const bCode of Array.from(multiItemTrackerRef.current.lockedBarcodes)) {
                      if (!seenInFrame.has(bCode)) {
                        const stab = multiItemTrackerRef.current.stabilityMap.get(bCode);
                        if (!stab || Date.now() - stab.lastSeen > 2500) {
                          multiItemTrackerRef.current.lockedBarcodes.delete(bCode);
                          if (lockedBarcode === bCode) {
                            setLockedBarcode(null);
                            setLockedProductName(null);
                          }
                        }
                      }
                    }
                  } else {
                    // No grocery items in frame
                    clearCanvas();
                    if (Date.now() - multiItemTrackerRef.current.lastDetectionTime > 2000) {
                      multiItemTrackerRef.current.stabilityMap.clear();
                      if (multiItemTrackerRef.current.lockedBarcodes.size > 0) {
                        multiItemTrackerRef.current.lockedBarcodes.clear();
                        setLockedBarcode(null);
                        setLockedProductName(null);
                        setStatusMessage('Ready for next item. Hold product in front of camera.');
                      }
                    }
                  }
                }
              })
              .catch(() => {
                isInferenceInFlightRef.current = false;
              });
          }
        }
      }

      animId = requestAnimationFrame(scanLoop);
    };

    animId = requestAnimationFrame(scanLoop);

    return () => {
      isScanning = false;
      cancelAnimationFrame(animId);
      clearCanvas();
    };
  }, [cameraActive, onAddItem]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleQuickAdd = (item: StapleItem) => {
    // 1. Add to cart
    onAddItem(item, 1);
    
    // 2. Play simulated load-cell scale placement & buzzer
    iotSimulator.placeWeight(item.weight_g);
    iotSimulator.playBuzzer('success');

    // 3. Show instant status feedback
    setIsSuccessFeedback(true);
    setStatusMessage(`✓ Verified: Added ${item.product_name} (+${item.weight_g}g load-cell consensus confirmed).`);

    setTimeout(() => {
      setIsSuccessFeedback(false);
      setStatusMessage('No item detected yet. Try an apple, banana, orange, bottle or cup.');
    }, 3200);
  };

  const handleQuantityChange = (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    updateItemQuantity(item.barcode, newQty);
    if (delta > 0) {
      iotSimulator.placeWeight(item.weight_g);
    } else {
      iotSimulator.removeWeight(item.weight_g);
    }
    iotSimulator.playBuzzer('success');
  };

  const handleRemove = (barcode: string) => {
    const item = summary.items.find((i) => i.barcode === barcode);
    if (item) {
      iotSimulator.removeWeight(item.total_weight_g);
    }
    removeItemFromCart(barcode);
    iotSimulator.playBuzzer('success');
  };

  const handleClear = () => {
    clearCart();
    iotSimulator.tare();
  };

  const getItemGlassConfig = (item: CartItem): { icon: any; color: GlassColor } => {
    const nameLower = (item.product?.product_name || '').toLowerCase();
    const catLower = (item.product?.category || '').toLowerCase();
    const subLower = (item.product?.subcategory || '').toLowerCase();

    if (nameLower.includes('apple') || nameLower.includes('banana') || nameLower.includes('fruit') || catLower.includes('produce')) {
      return { icon: Apple, color: 'green' };
    }
    if (nameLower.includes('biscuit') || nameLower.includes('cookie') || subLower.includes('biscuit') || nameLower.includes('parle')) {
      return { icon: Cookie, color: 'amber' };
    }
    if (nameLower.includes('milk') || nameLower.includes('dahi') || nameLower.includes('curd') || nameLower.includes('butter') || catLower.includes('dairy')) {
      return { icon: Milk, color: 'blue' };
    }
    if (nameLower.includes('dettol') || nameLower.includes('colgate') || nameLower.includes('soap') || catLower.includes('personal')) {
      return { icon: SprayCan, color: 'pink' };
    }
    if (nameLower.includes('surf') || nameLower.includes('detergent') || catLower.includes('household')) {
      return { icon: House, color: 'purple' };
    }
    if (nameLower.includes('maggi') || nameLower.includes('noodle') || catLower.includes('packaged')) {
      return { icon: Package, color: 'orange' };
    }
    if (nameLower.includes('salt') || catLower.includes('grocery') || catLower.includes('staple')) {
      return { icon: ShoppingCart, color: 'blue' };
    }
    return { icon: ShoppingBag, color: 'blue' };
  };

  const formattedWeight =
    summary.total_weight_g >= 1000
      ? `${(summary.total_weight_g / 1000).toFixed(2)} kg`
      : `${(summary.total_weight_g / 1000).toFixed(2)} kg`;

  return (
    <div className="dashboard-content-grid">
      {/* =========================================================================
          LEFT COLUMN: Vision Camera Scanner + Catalog Quick-Add Grid
          ========================================================================= */}
      <div className="dashboard-left-column">
        {/* 1. Camera Viewport Box */}
        <div className="vision-camera-card" ref={cameraCardRef}>
          {/* Top Status Pill: Camera off / Camera active (Glassmorphic icon badge with measured resolution & FPS) */}
          <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 10, display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div className="camera-status-badge" style={{ position: 'static' }}>
              <GlassIcon
                icon={cameraActive ? Camera : CameraOff}
                color={cameraActive ? 'blue' : 'red'}
                size={22}
              />
              <span>
                {cameraActive
                  ? `Camera live • ${videoResolution ? `${videoResolution.width} × ${videoResolution.height}` : 'FHD'} • ${measuredFPS > 0 ? measuredFPS : 30} FPS`
                  : 'Camera off'}
              </span>
            </div>

            {/* Live Model Status Pill */}
            <div
              className={`model-status-pill ${
                modelStatus.isCustom
                  ? 'model-status-custom'
                  : modelStatus.serviceOnline
                  ? 'model-status-fallback'
                  : 'model-status-offline'
              }`}
              title={modelStatus.notes || (modelStatus.isCustom ? 'Custom grocery weights active' : 'Pretrained development fallback active')}
            >
              <Sparkles style={{ width: '13px', height: '13px' }} />
              <span>
                {modelStatus.isCustom
                  ? 'Custom YOLO26s (best.pt)'
                  : modelStatus.serviceOnline
                  ? 'YOLO26s (Pretrained)'
                  : 'YOLO26s Offline'}
              </span>
            </div>
          </div>

          {/* Camera device selector & settings (Glassmorphic pill on right) */}
          {availableDevices.length > 1 && (
            <div className="camera-controls-wrapper">
              <select
                className="camera-device-select"
                value={selectedDeviceId}
                onChange={(e) => {
                  const newDevId = e.target.value;
                  setSelectedDeviceId(newDevId);
                  if (cameraActive) {
                    startCamera(newDevId);
                  }
                }}
                title="Select Camera Device"
              >
                {availableDevices.map((dev, idx) => (
                  <option key={dev.deviceId || idx} value={dev.deviceId}>
                    {dev.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Viewfinder Area with Glowing Neon Border & Corner Bubbles */}
          <div className="camera-viewfinder-screen">
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

                {/* Real-time YOLO Bounding Boxes Canvas Overlay */}
                <canvas
                  ref={overlayCanvasRef}
                  className="detection-overlay-canvas"
                />



                {/* Floating Turn Off Camera Action */}
                <button onClick={stopCamera} className="camera-toggle-pill-btn camera-off-pill-btn">
                  <CameraOff style={{ width: '15px', height: '15px' }} />
                  Turn off camera
                </button>
              </div>
            ) : (
              <div className="camera-inactive-container">
                {/* Centered 3D Frosted Glass Bubble Orb with Gradient Camera & Power Button */}
                <div className="camera-center-action-wrapper">
                  <div className="camera-glass-orb">
                    {/* Satellite Orbit Bubbles */}
                    <div className="orb-satellite-top-left" />
                    <div className="orb-satellite-bottom-right" />

                    {/* Gradient Camera Outline Icon */}
                    <svg
                      width="42"
                      height="42"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ position: 'relative', zIndex: 3 }}
                    >
                      <defs>
                        <linearGradient id="camGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#2563eb" />
                          <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
                        stroke="url(#camGrad)"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="13"
                        r="3.2"
                        stroke="url(#camGrad)"
                        strokeWidth="2.2"
                      />
                    </svg>
                  </div>

                  {/* Glowing 3D Pill Button */}
                  <button onClick={() => startCamera()} className="camera-toggle-pill-btn">
                    <Camera style={{ width: '15px', height: '15px', strokeWidth: 2.5 }} />
                    <span>Turn on camera</span>
                  </button>

                  {cameraError && (
                    <div style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      background: 'rgba(254, 226, 226, 0.9)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#991b1b',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      maxWidth: '340px',
                      textAlign: 'center',
                      backdropFilter: 'blur(8px)',
                    }}>
                      <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                      <span>{cameraError}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Detection Status Strip */}
        <div
          className={`detection-status-strip ${
            isSuccessFeedback ? 'status-strip-success' : 'status-strip-default'
          }`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto', minWidth: '220px' }}>
            {isSuccessFeedback ? (
              <CheckCircle2 style={{ width: '18px', height: '18px', color: '#059669', flexShrink: 0 }} />
            ) : (
              <Tag style={{ width: '16px', height: '16px', color: '#0284c7', flexShrink: 0 }} />
            )}
            <span style={{ fontWeight: 600 }}>{statusMessage}</span>
          </div>

          {/* Interactive Controls: Scan Next Item and Undo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {lockedBarcode && (
              <button
                onClick={handleScanNextItem}
                className="scan-next-btn"
                title="Reset lock and scan another unit or product"
              >
                <RefreshCw style={{ width: '13px', height: '13px' }} />
                <span>Scan Next Item</span>
              </button>
            )}
            {lastAddedProduct && (
              <button
                onClick={handleUndo}
                className="undo-add-btn"
                title="Undo and remove last added item"
              >
                <Undo2 style={{ width: '12px', height: '12px' }} />
                <span>Undo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN: "Your cart" Panel (Cart Items List + Billing Summary)
          ========================================================================= */}
      <div className="dashboard-right-column">
        <div className="your-cart-card">
          {/* Subsurface ambient bubbles */}
          <div className="cart-card-bubble bubble-top-left" />
          <div className="cart-card-bubble bubble-bottom-right" />

          {/* Cart Header */}
          <div className="your-cart-header">
            <h2 className="your-cart-title">Your cart</h2>
            {summary.items.length > 0 && (
              <button onClick={handleClear} className="cart-clear-all-btn">
                Clear all
              </button>
            )}
          </div>

          {/* Cart Content: Empty State OR Scrollable Items */}
          {summary.items.length === 0 ? (
            <div className="cart-empty-placeholder">
              {/* 3D Frosted Glass Sphere Orb with Blue Shopping Cart */}
              <div className="cart-glass-orb-wrapper">
                <div className="cart-glass-orb">
                  {/* Orbital satellite bubbles */}
                  <div className="cart-satellite-top-left" />
                  <div className="cart-satellite-bottom-right" />

                  {/* 3D Shopping Cart with Mesh Grid */}
                  <svg
                    width="46"
                    height="46"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ position: 'relative', zIndex: 3 }}
                  >
                    <defs>
                      <linearGradient id="cartMeshGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="60%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M1.5 2h3.5l2.4 12.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22.5 6.5H6"
                      stroke="url(#cartMeshGrad)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Mesh grid lines inside basket */}
                    <path d="M7 9.5h14" stroke="url(#cartMeshGrad)" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M8.2 12.8h12" stroke="url(#cartMeshGrad)" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M10.5 6.5v6.5" stroke="url(#cartMeshGrad)" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M14.5 6.5v6.5" stroke="url(#cartMeshGrad)" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M18.5 6.5v6.5" stroke="url(#cartMeshGrad)" strokeWidth="1.4" strokeLinecap="round" />
                    {/* Wheels */}
                    <circle cx="9" cy="19" r="1.8" fill="url(#cartMeshGrad)" />
                    <circle cx="18" cy="19" r="1.8" fill="url(#cartMeshGrad)" />
                  </svg>
                </div>
              </div>

              <div className="cart-empty-text">Your cart is empty</div>
              <div className="cart-empty-sub">
                Turn on the camera scanner or click any item in the catalog to add items.
              </div>
            </div>
          ) : (
            <div className="cart-items-scroll-area">
              {summary.items.map((item) => {
                const discount = item.mrp > item.unit_price ? Math.round(((item.mrp - item.unit_price) / item.mrp) * 100) : 0;
                const glassConfig = getItemGlassConfig(item);
                return (
                  <div key={item.id} className="cart-item-row">
                    <div style={{ flexShrink: 0 }}>
                      <GlassIcon icon={glassConfig.icon} color={glassConfig.color} size={36} />
                    </div>
                    <div className="cart-item-info">
                      <div className="cart-item-title">{item.product.product_name}</div>
                      <div className="cart-item-meta">
                        {item.weight_g} g · ₹{item.unit_price.toFixed(2)}
                        {discount > 0 && (
                          <span className="cart-item-discount-tag"> ({discount}% off)</span>
                        )}
                      </div>
                    </div>
                    <div className="cart-item-actions">
                      <div className="cart-stepper-control">
                        <button
                          onClick={() => handleQuantityChange(item, -1)}
                          className="stepper-btn"
                          title="Decrease quantity"
                          style={{ background: 'transparent', border: 'none', padding: 0 }}
                        >
                          <GlassIcon icon={Minus} color="pink" shape="circle" size={22} strokeWidth={3} />
                        </button>
                        <span className="stepper-count">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item, 1)}
                          className="stepper-btn"
                          title="Increase quantity"
                          style={{ background: 'transparent', border: 'none', padding: 0 }}
                        >
                          <GlassIcon icon={Plus} color="cyan" shape="circle" size={22} strokeWidth={3} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemove(item.barcode)}
                        className="cart-trash-btn"
                        title="Remove item"
                        style={{ background: 'transparent', border: 'none', padding: 0 }}
                      >
                        <GlassIcon icon={Trash2} color="red" size={28} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Inset Frosted Glass Billing Pod with Raised Blue Icon Badges */}
          <div className="cart-billing-pod">
            {/* Total items */}
            <div className="billing-pod-row">
              <div className="billing-pod-left">
                <GlassIcon icon={ShoppingBag} color="blue" size={30} />
                <span className="billing-pod-label">Total items</span>
              </div>
              <span className="billing-pod-value">{summary.item_count}</span>
            </div>

            {/* Total weight */}
            <div className="billing-pod-row">
              <div className="billing-pod-left">
                <GlassIcon icon={Scale} color="blue" size={30} />
                <span className="billing-pod-label">Total weight</span>
              </div>
              <span className="billing-pod-value">{formattedWeight}</span>
            </div>

            {/* MRP */}
            <div className="billing-pod-row">
              <div className="billing-pod-left">
                <GlassIcon icon={ReceiptText} color="blue" size={30} />
                <span className="billing-pod-label">MRP</span>
              </div>
              <span className="billing-pod-value">₹{summary.subtotal_mrp.toFixed(2)}</span>
            </div>

            {/* Discount */}
            <div className="billing-pod-row">
              <div className="billing-pod-left">
                <GlassIcon icon={Percent} color="purple" size={30} />
                <span className="billing-pod-label">Discount</span>
              </div>
              <span className="billing-pod-value discount-green">
                - ₹{summary.discount_total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* To Pay Row */}
          <div className="to-pay-container">
            <span className="to-pay-text">To pay</span>
            <span className="to-pay-price">₹{summary.grand_total.toFixed(2)}</span>
          </div>

          {/* Proceed to Payment 3D Glass Pill Action Button */}
          <Link href="/checkout" className="proceed-to-payment-btn">
            {/* 3D Glass Pill End Highlight Orbs */}
            <div className="pill-orb-highlight-left" />
            <div className="pill-orb-highlight-right" />
            <span style={{ position: 'relative', zIndex: 2 }}>Proceed to payment</span>
            <ArrowRight style={{ width: '17px', height: '17px', position: 'relative', zIndex: 2 }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
