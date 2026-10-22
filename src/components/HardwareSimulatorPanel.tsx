
'use client';

import React, { useState, useEffect } from 'react';
import { Scale, RotateCcw, Activity, Volume2, CheckCircle2, AlertCircle } from 'lucide-react';
import { iotSimulator } from '@/lib/iot-simulator';
import { IoTTelemetry } from '@/types';
import GlassIcon from '@/components/GlassIcon';

interface HardwareSimulatorPanelProps {
  telemetry: IoTTelemetry;
  onWeightDelta?: (deltaG: number) => void;
}

export default function HardwareSimulatorPanel({ telemetry, onWeightDelta }: HardwareSimulatorPanelProps) {
  const [feedbackMsg, setFeedbackMsg] = useState<string>('ESP32 HX711 scale calibrated & ready');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'tare'>('success');
  const [greenLedActive, setGreenLedActive] = useState<boolean>(false);
  const [redLedActive, setRedLedActive] = useState<boolean>(false);

  useEffect(() => {
    const unsub = iotSimulator.onFeedback((type, msg) => {
      setFeedbackMsg(msg);
      setFeedbackType(type);

      if (type === 'success' || type === 'tare') {
        setGreenLedActive(true);
        setTimeout(() => setGreenLedActive(false), 600);
      } else {
        setRedLedActive(true);
        setTimeout(() => setRedLedActive(false), 900);
      }
    });

    return () => unsub();
  }, []);

  const handleTare = () => {
    iotSimulator.tare();
  };

  const handleAddWeight = (weightG: number) => {
    iotSimulator.placeWeight(weightG);
    if (onWeightDelta) onWeightDelta(weightG);
  };

  const handleInjectNoise = () => {
    iotSimulator.injectNoise();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header with Virtual LEDs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <GlassIcon icon={Scale} color="purple" size={42} glow />
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#1c1b22' }}>
              ESP32 & HX711 IoT Load-Cell Console
            </h3>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              Protocol: Serial JSON &bull; 115200 Baud &bull; Pin GPIO 18 (DT), 19 (SCK)
            </p>
          </div>
        </div>

        {/* Virtual LEDs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '6px 14px', borderRadius: '100px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: greenLedActive ? '#10b981' : '#cbd5e1',
                boxShadow: greenLedActive ? '0 0 10px #10b981' : 'none',
                transition: 'all 0.2s',
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Green LED</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: redLedActive ? '#ef4444' : '#cbd5e1',
                boxShadow: redLedActive ? '0 0 10px #ef4444' : 'none',
                transition: 'all 0.2s',
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Red LED</span>
          </div>

          <button
            onClick={() => iotSimulator.playBuzzer('success')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', fontSize: '11px', color: '#64748b', cursor: 'pointer', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0' }}
            title="Test synthetic buzzer chime"
          >
            <Volume2 style={{ width: '13px', height: '13px' }} />
            <span>Chirp</span>
          </button>
        </div>
      </div>

      {/* Main Metric & Tare Row */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Metric Card */}
        <div style={{ flex: '1 1 200px', background: '#f8fafc', padding: '16px 20px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Current Scale Net</span>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#25105f', fontFamily: 'monospace' }}>
              {telemetry.weight_g.toFixed(1)} <span style={{ fontSize: '16px', color: '#64748b' }}>g</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button
              onClick={handleTare}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '100px',
                border: '1px solid #d1d5db',
                background: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                color: '#25105f',
                cursor: 'pointer',
              }}
            >
              <RotateCcw style={{ width: '13px', height: '13px' }} />
              <span>Tare Scale</span>
            </button>
            <div style={{ marginTop: '6px' }}>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '100px', background: telemetry.stable ? '#dcfce7' : '#fef3c7', color: telemetry.stable ? '#166534' : '#92400e', fontWeight: 700 }}>
                {telemetry.stable ? 'Stable' : 'Settling...'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Placement Weights */}
        <div style={{ flex: '2 1 360px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', width: '100%' }}>Simulate Placing Item:</span>

          <button onClick={() => handleAddWeight(56.0)} style={{ padding: '6px 12px', borderRadius: '100px', border: '1px solid #d1d5db', background: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
            +56g (Parle-G)
          </button>
          <button onClick={() => handleAddWeight(70.0)} style={{ padding: '6px 12px', borderRadius: '100px', border: '1px solid #d1d5db', background: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
            +70g (Maggi)
          </button>
          <button onClick={() => handleAddWeight(100.0)} style={{ padding: '6px 12px', borderRadius: '100px', border: '1px solid #d1d5db', background: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
            +100g (Amul Butter)
          </button>
          <button onClick={() => handleAddWeight(180.0)} style={{ padding: '6px 12px', borderRadius: '100px', border: '1px solid #d1d5db', background: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
            +180g (Apple)
          </button>
          <button onClick={() => handleAddWeight(1000.0)} style={{ padding: '6px 12px', borderRadius: '100px', border: '1px solid #d1d5db', background: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
            +1000g (Tata Salt)
          </button>
          <button onClick={handleInjectNoise} style={{ padding: '6px 12px', borderRadius: '100px', border: '1px solid #fed7aa', background: '#fff7ed', color: '#c2410c', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
            <Activity style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
            Vibrate
          </button>
        </div>
      </div>

      {/* Real-time Hardware Console Message */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f1f5f9', borderRadius: '12px', fontSize: '11px', color: '#475569' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {feedbackType === 'success' || feedbackType === 'tare' ? (
            <CheckCircle2 style={{ width: '14px', height: '14px', color: '#10b981' }} />
          ) : (
            <AlertCircle style={{ width: '14px', height: '14px', color: '#ef4444' }} />
          )}
          <span style={{ fontFamily: 'monospace' }}>{feedbackMsg}</span>
        </div>
        <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
          Delta: {telemetry.delta_g >= 0 ? `+${telemetry.delta_g.toFixed(1)}` : telemetry.delta_g.toFixed(1)}g
        </span>
      </div>
    </div>
  );
}
