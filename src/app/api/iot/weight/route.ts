import { NextRequest, NextResponse } from 'next/server';

let latestTelemetry = {
  device_id: 'ESP32_STAGE1_CART01',
  weight_g: 0.0,
  delta_g: 0.0,
  stable: true,
  status: 'online',
  timestamp: Date.now(),
  correlation_id: 'initial',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { device_id, weight_g, delta_g, stable, correlation_id } = body;

    if (weight_g === undefined) {
      return NextResponse.json({ error: 'weight_g is required' }, { status: 400 });
    }

    latestTelemetry = {
      device_id: device_id || 'ESP32_STAGE1_CART01',
      weight_g: Number(weight_g),
      delta_g: Number(delta_g || 0),
      stable: stable !== undefined ? Boolean(stable) : true,
      status: 'online',
      timestamp: Date.now(),
      correlation_id: correlation_id || `tel_${Date.now()}`,
    };

    return NextResponse.json({
      success: true,
      telemetry: latestTelemetry,
      ack: 'received',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Invalid telemetry payload', details: (err as Error).message },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    telemetry: latestTelemetry,
    server_timestamp: Date.now(),
  });
}
