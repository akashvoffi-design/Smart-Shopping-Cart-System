import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const VISION_SERVICE_URL = process.env.VISION_SERVICE_URL || 'http://127.0.0.1:8000';

export async function GET() {
  const modelsDir = path.join(process.cwd(), 'models');
  const customWeightsPath = path.join(modelsDir, 'best.pt');
  const rootWeightsPath = path.join(process.cwd(), 'best.pt');
  const fallbackWeightsPath = path.join(modelsDir, 'yolo11n.pt');

  const hasCustomWeights = fs.existsSync(customWeightsPath) || fs.existsSync(rootWeightsPath);
  const activeWeightsPath = fs.existsSync(customWeightsPath) ? customWeightsPath : rootWeightsPath;
  const hasFallbackWeights = fs.existsSync(fallbackWeightsPath);

  // Attempt to check live Python FastAPI vision service
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${VISION_SERVICE_URL}/status`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        ...data,
        python_service_online: true,
        endpoint_url: VISION_SERVICE_URL,
      });
    }
  } catch {
    // Python service is currently not running or unreachable
  }

  // Fallback offline status report
  return NextResponse.json({
    status: 'offline_or_starting',
    python_service_online: false,
    service: 'SmartCart AI YOLO11n Vision Service',
    model_loaded: false,
    model_name: hasCustomWeights ? 'best.pt' : hasFallbackWeights ? 'yolo11n.pt' : null,
    is_custom_trained: hasCustomWeights,
    model_architecture: 'YOLO11n (Ultralytics)',
    custom_weights_available: hasCustomWeights,
    custom_weights_path: activeWeightsPath,
    endpoint_url: VISION_SERVICE_URL,
    notes: hasCustomWeights
      ? 'Custom trained weights best.pt (YOLO11n, 34 grocery classes) ready. Start Python service: python -m uvicorn services.vision_service:app --port 8000'
      : 'Official pretrained weights (yolo11n.pt) ready. Start Python service: python -m uvicorn services.vision_service:app --port 8000',
    help: 'Run `python -m uvicorn services.vision_service:app --port 8000` to start real-time YOLO11n inference.',
  });
}
