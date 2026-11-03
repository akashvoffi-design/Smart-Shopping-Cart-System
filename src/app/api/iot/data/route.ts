import { NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${FASTAPI_URL}/data`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'Backend returned error', status: res.status },
      { status: res.status }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'FastAPI backend unreachable at ' + FASTAPI_URL,
        message: err.message,
      },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${FASTAPI_URL}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to forward to FastAPI', message: err.message },
      { status: 503 }
    );
  }
}
