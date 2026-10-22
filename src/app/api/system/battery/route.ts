import { NextResponse } from 'next/server';
import { getWindowsBattery } from '@/lib/windows-battery';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const batteryInfo = await getWindowsBattery();
    return NextResponse.json(batteryInfo);
  } catch (err: any) {
    return NextResponse.json(
      {
        supported: false,
        error: err.message || 'Failed to read battery status',
        percent: null,
        isCharging: false,
        source: 'unavailable',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
