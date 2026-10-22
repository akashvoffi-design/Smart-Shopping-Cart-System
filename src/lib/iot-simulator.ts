import { IoTTelemetry } from '@/types';

type IoTListener = (telemetry: IoTTelemetry) => void;
type FeedbackListener = (type: 'success' | 'error' | 'tare', message: string) => void;

class IoTSimulator {
  private currentWeightG: number = 0;
  private tareOffsetG: number = 0;
  private isStable: boolean = true;
  private deviceId: string = 'ESP32_DEV_CART01';
  private status: 'online' | 'offline' | 'simulated' = 'simulated';
  private listeners: Set<IoTListener> = new Set();
  private feedbackListeners: Set<FeedbackListener> = new Set();
  private audioCtx: AudioContext | null = null;

  constructor() {
    // Browser environment audio init
    if (typeof window !== 'undefined') {
      window.addEventListener('click', () => this.ensureAudioContext(), { once: true });
    }
  }

  private ensureAudioContext() {
    if (typeof window !== 'undefined' && !this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
  }

  public subscribe(listener: IoTListener): () => void {
    this.listeners.add(listener);
    // Send immediate initial state
    listener(this.getTelemetry());
    return () => this.listeners.delete(listener);
  }

  public onFeedback(listener: FeedbackListener): () => void {
    this.feedbackListeners.add(listener);
    return () => this.feedbackListeners.delete(listener);
  }

  public getTelemetry(deltaG: number = 0): IoTTelemetry {
    const netWeight = Math.max(0, this.currentWeightG - this.tareOffsetG);
    return {
      device_id: this.deviceId,
      weight_g: Math.round(netWeight * 10) / 10,
      delta_g: Math.round(deltaG * 10) / 10,
      stable: this.isStable,
      status: this.status,
      timestamp: Date.now(),
      correlation_id: `iot_${Date.now()}`
    };
  }

  private notify(deltaG: number = 0) {
    const telemetry = this.getTelemetry(deltaG);
    for (const listener of this.listeners) {
      try {
        listener(telemetry);
      } catch (err) {
        console.error('Error notifying IoT listener', err);
      }
    }
  }

  // Plays synthetic ESP32 buzzer beeps using Web Audio API
  public playBuzzer(type: 'success' | 'error') {
    try {
      this.ensureAudioContext();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'success') {
        // High crisp beep: 880Hz, 120ms
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.12);
        this.emitFeedback('success', 'ESP32: Green LED Pulse + Single Beep (Verified)');
      } else {
        // Error double tone: 440Hz -> 330Hz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
        osc.frequency.setValueAtTime(330, this.audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.25);
        this.emitFeedback('error', 'ESP32: Red LED Blink + Alert Beeps (Weight Mismatch)');
      }
    } catch {
      // Audio not permitted or unavailable
    }
  }

  private emitFeedback(type: 'success' | 'error' | 'tare', message: string) {
    for (const fl of this.feedbackListeners) {
      try {
        fl(type, message);
      } catch {}
    }
  }

  // Tares the scale to 0.0g
  public tare() {
    this.tareOffsetG = this.currentWeightG;
    this.playBuzzer('success');
    this.emitFeedback('tare', `Scale tared to 0.0 g (offset: ${Math.round(this.tareOffsetG)}g)`);
    this.notify(0);
  }

  // Simulates placing an item onto the load cell platform with realistic settling fluctuation
  public placeWeight(weightG: number) {
    const delta = weightG;
    this.isStable = false;
    this.currentWeightG += delta;
    this.notify(delta);

    // Simulate HX711 settle time (~400ms)
    setTimeout(() => {
      this.isStable = true;
      this.notify(delta);
    }, 450);
  }

  // Simulates removing an item from the basket
  public removeWeight(weightG: number) {
    const delta = -Math.min(this.currentWeightG - this.tareOffsetG, weightG);
    this.isStable = false;
    this.currentWeightG = Math.max(0, this.currentWeightG + delta);
    this.notify(delta);

    setTimeout(() => {
      this.isStable = true;
      this.notify(delta);
    }, 450);
  }

  // Simulates random sensor noise / mechanical cart vibrations
  public injectNoise() {
    const jitter = (Math.random() - 0.5) * 8.0;
    this.isStable = false;
    this.currentWeightG = Math.max(0, this.currentWeightG + jitter);
    this.notify(jitter);

    setTimeout(() => {
      this.isStable = true;
      this.currentWeightG = Math.round(this.currentWeightG);
      this.notify(0);
    }, 600);
  }

  public setHardwareTelemetry(weightG: number, isStable: boolean = true) {
    const prev = this.currentWeightG;
    this.status = 'online';
    this.currentWeightG = weightG;
    this.isStable = isStable;
    this.notify(weightG - prev);
  }
}

// Singleton simulator instance
export const iotSimulator = new IoTSimulator();
