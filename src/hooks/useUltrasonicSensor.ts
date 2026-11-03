'use client';

import { useState, useEffect, useRef } from 'react';

export interface UltrasonicData {
  distance: number | null | undefined;
  counter: number | null;
  status: 'connected' | 'disconnected' | 'stale' | 'connecting';
  lastUpdateTime: Date | null;
  lastEchoValid: boolean;
  errorMessage: string | null;
  isObjectPresent: boolean;
  latencyMs: number;
}

export interface UltrasonicSensorHookOptions {
  pollingIntervalMs?: number;
  backendUrl?: string;
  staleThresholdMs?: number;
  objectThresholdCm?: number;
}

export function useUltrasonicSensor({
  pollingIntervalMs = 750,
  backendUrl = 'http://localhost:8000/data',
  staleThresholdMs = 3500,
  objectThresholdCm = 35,
}: UltrasonicSensorHookOptions = {}) {
  const [data, setData] = useState<UltrasonicData>({
    distance: undefined, // undefined means initial state "--"
    counter: null,
    status: 'connecting',
    lastUpdateTime: null,
    lastEchoValid: false,
    errorMessage: null,
    isObjectPresent: false,
    latencyMs: 0,
  });

  const lastCounterRef = useRef<number | null>(null);
  const lastPacketTimeRef = useRef<number>(0);
  const consecutiveErrorsRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;
    let abortController: AbortController | null = null;

    const fetchSensorData = async () => {
      const startTime = performance.now();
      try {
        abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController?.abort(), 1200);

        // Try direct FastAPI endpoint first; if network fails (e.g. CORS), fallback to Next.js proxy route
        let res: Response | null = null;
        try {
          res = await fetch(backendUrl, {
            signal: abortController.signal,
            cache: 'no-store',
            headers: {
              'Accept': 'application/json',
            },
          });
        } catch {
          // Direct fetch failed (e.g. CORS or browser restriction) -> try Next.js proxy route
          try {
            res = await fetch('/api/iot/data', {
              signal: abortController.signal,
              cache: 'no-store',
            });
          } catch {
            // Both failed
          }
        }

        clearTimeout(timeoutId);
        const latency = Math.round(performance.now() - startTime);

        if (!isMounted) return;

        if (res && res.ok) {
          const json = await res.json();
          consecutiveErrorsRef.current = 0;

          const now = Date.now();
          const rawDist = json.distance;
          const rawCounter = typeof json.counter === 'number' ? json.counter : null;

          // Check if distance is null or a valid number
          const parsedDist = typeof rawDist === 'number' ? Number(rawDist.toFixed(2)) : null;
          const echoValid = parsedDist !== null && parsedDist >= 2 && parsedDist <= 400;

          // Detect if readings are stale (ESP32 stopped sending counter increments)
          let currentStatus: 'connected' | 'stale' = 'connected';
          if (rawCounter !== null) {
            if (rawCounter !== lastCounterRef.current) {
              lastCounterRef.current = rawCounter;
              lastPacketTimeRef.current = now;
            } else if (lastPacketTimeRef.current > 0 && now - lastPacketTimeRef.current > staleThresholdMs) {
              currentStatus = 'stale';
            }
          }

          // Object presence detection (e.g. item detected in cart detection zone)
          const isPresent = echoValid && parsedDist !== null && parsedDist <= objectThresholdCm;

          setData({
            distance: parsedDist,
            counter: rawCounter,
            status: currentStatus,
            lastUpdateTime: new Date(),
            lastEchoValid: echoValid,
            errorMessage: null,
            isObjectPresent: isPresent,
            latencyMs: latency,
          });
        } else {
          consecutiveErrorsRef.current += 1;
          if (consecutiveErrorsRef.current >= 2) {
            setData((prev) => ({
              ...prev,
              status: 'disconnected',
              errorMessage: `FastAPI responded with status: ${res ? res.status : 'Offline'}`,
            }));
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        consecutiveErrorsRef.current += 1;
        if (consecutiveErrorsRef.current >= 2) {
          setData((prev) => ({
            ...prev,
            status: 'disconnected',
            errorMessage: err.name === 'AbortError' ? 'Connection timed out' : 'Cannot reach http://localhost:8000',
          }));
        }
      }
    };

    // Initial fetch
    fetchSensorData();

    // Recurring polling timer (500 - 1000ms)
    const intervalId = setInterval(fetchSensorData, pollingIntervalMs);

    // Clean up timers & abort in-flight requests on unmount
    return () => {
      isMounted = false;
      clearInterval(intervalId);
      if (abortController) {
        abortController.abort();
      }
    };
  }, [pollingIntervalMs, backendUrl, staleThresholdMs, objectThresholdCm]);

  return data;
}
