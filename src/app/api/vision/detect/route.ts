import { NextRequest, NextResponse } from 'next/server';

const VISION_SERVICE_URL = process.env.VISION_SERVICE_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.image_base64) {
      return NextResponse.json(
        { success: false, error: 'Missing image_base64 in request payload.' },
        { status: 400 }
      );
    }

    // Forward to local Python FastAPI YOLO microservice
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for inference

    const response = await fetch(`${VISION_SERVICE_URL}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: body.image_base64,
        confidence_threshold: body.confidence_threshold || 0.40,
        iou_threshold: body.iou_threshold || 0.45,
      }),
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { success: false, error: `Inference service returned ${response.status}: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const errorObj = err as Error;
    const isConnRefused =
      errorObj.message?.includes('fetch failed') ||
      errorObj.message?.includes('ECONNREFUSED') ||
      errorObj.name === 'AbortError';

    return NextResponse.json(
      {
        success: false,
        error: isConnRefused
          ? 'Vision service is offline. Start the service with: python -m uvicorn services.vision_service:app --port 8000'
          : errorObj.message || 'Vision inference failed.',
        service_offline: isConnRefused,
      },
      { status: 503 }
    );
  }
}
