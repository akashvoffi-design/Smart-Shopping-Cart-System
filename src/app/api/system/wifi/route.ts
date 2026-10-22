import { NextRequest, NextResponse } from 'next/server';
import {
  getWifiInterfaceStatus,
  scanWifiNetworks,
  connectToWifiNetwork,
  disconnectWifi,
} from '@/lib/windows-wifi';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doScan = searchParams.get('scan') === 'true';

    const ifaceStatus = await getWifiInterfaceStatus();
    const networks = doScan ? await scanWifiNetworks() : [];

    return NextResponse.json({
      success: true,
      ...ifaceStatus,
      networks,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to retrieve Wi-Fi status',
        hasAdapter: false,
        state: 'unavailable',
        networks: [],
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ssid, password } = body;

    if (action === 'disconnect') {
      const result = await disconnectWifi();
      return NextResponse.json(result);
    }

    if (action === 'connect') {
      if (!ssid || typeof ssid !== 'string') {
        return NextResponse.json(
          { success: false, message: 'Valid SSID required.' },
          { status: 400 }
        );
      }

      const result = await connectToWifiNetwork(ssid, password);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, message: `Unsupported action: "${action}"` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Operation failed.' },
      { status: 500 }
    );
  }
}
