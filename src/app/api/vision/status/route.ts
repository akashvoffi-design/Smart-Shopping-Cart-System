import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const VISION_SERVICE_URL = process.env.VISION_SERVICE_URL || 'http://127.0.0.1:8000';

export async function GET() {
  const modelsDir = path.join(process.cwd(), 'models');
  const customWeightsPath = path.join(modelsDir, 'best.pt');
  const fallbackWeightsPath = path.join(modelsDir, 'yolo26s.pt');

  const hasCustomWeights = fs.existsSync(customWeightsPath);
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
    service: 'SmartCart AI YOLO26s Vision Service',
    model_loaded: false,
    model_name: hasCustomWeights ? 'best.pt' : hasFallbackWeights ? 'yolo26s.pt' : null,
    is_custom_trained: hasCustomWeights,
    model_architecture: 'YOLO26-Small (Ultralytics)',
    custom_weights_available: hasCustomWeights,
    custom_weights_path: customWeightsPath,
    endpoint_url: VISION_SERVICE_URL,
    notes: hasCustomWeights
      ? 'Custom weights best.pt (fine-tuned from YOLO26s) found in models/. Start Python service: python -m uvicorn services.vision_service:app --port 8000'
      : 'Official pretrained weights (yolo26s.pt) ready. Start Python service: python -m uvicorn services.vision_service:app --port 8000',
    help: 'Run `python -m uvicorn services.vision_service:app --port 8000` to start real-time YOLO26s inference.',
  });
}
