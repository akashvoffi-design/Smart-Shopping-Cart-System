"""
ESP32 USB-Serial to Next.js API Bridge
Reads weight telemetry lines from ESP32, validates schemas, and posts to /api/iot/weight.
Run with:
    python firmware/serial_bridge.py --port COM3 --baud 115200
If no physical ESP32 is plugged in, run with --simulate to stream realistic test packets:
    python firmware/serial_bridge.py --simulate
"""

import sys
import time
import json
import argparse
import urllib.request
import urllib.error

def post_telemetry(api_url, payload):
    try:
        req = urllib.request.Request(
            api_url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            return resp.status == 200
    except Exception as e:
        print(f"[Bridge Error] Failed to POST telemetry: {e}")
        return False

def run_simulation(api_url):
    print("==================================================")
    print("STARTING ESP32 SERIAL BRIDGE [SIMULATION MODE]")
    print(f"Target API: {api_url}")
    print("Press Ctrl+C to stop.")
    print("==================================================")
    
    test_weights = [0.0, 56.0, 126.0, 182.0, 1182.0, 1182.0, 182.0, 0.0]
    idx = 0
    current_w = 0.0

    while True:
        try:
            target_w = test_weights[idx % len(test_weights)]
            delta = target_w - current_w
            current_w = target_w

            packet = {
                "device_id": "ESP32_STAGE1_SIM",
                "weight_g": round(current_w, 1),
                "delta_g": round(delta, 1),
                "stable": True,
                "timestamp": int(time.time() * 1000),
                "correlation_id": f"sim_{int(time.time()*1000)}"
            }

            print(f"[Simulated ESP32] Sending: {packet}")
            post_telemetry(api_url, packet)
            idx += 1
            time.sleep(3.5)
        except KeyboardInterrupt:
            print("\nBridge stopped by user.")
            break

def run_serial(port, baud, api_url):
    try:
        import serial
    except ImportError:
        print("[Error] pyserial is not installed. Run: pip install pyserial")
        print("Falling back to simulation mode...")
        run_simulation(api_url)
        return

    print("==================================================")
    print(f"CONNECTING TO ESP32 ON {port} @ {baud} BAUD")
    print(f"Target API: {api_url}")
    print("==================================================")

    try:
        ser = serial.Serial(port, baud, timeout=1)
        time.sleep(2) # Wait for ESP32 boot
        print(f"[Serial Bridge] Connected to {port} successfully.")

        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if not line or not line.startswith('{'):
                    continue

                try:
                    data = json.loads(line)
                    # Validate required fields
                    if 'weight_g' in data:
                        print(f"[ESP32 -> Server] {data}")
                        post_telemetry(api_url, data)
                except json.JSONDecodeError:
                    print(f"[Serial Warning] Ignored malformed line: {line}")
            time.sleep(0.05)

    except serial.SerialException as e:
        print(f"[Serial Error] Cannot open {port}: {e}")
        print("Starting simulation mode instead so development is not blocked...")
        run_simulation(api_url)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="ESP32 to Next.js Serial Bridge")
    parser.add_argument('--port', default='COM3', help="Serial port (e.g. COM3, COM4, /dev/ttyUSB0)")
    parser.add_argument('--baud', type=int, default=115200, help="Baud rate (default: 115200)")
    parser.add_argument('--api', default='http://localhost:3000/api/iot/weight', help="Next.js Telemetry API")
    parser.add_argument('--simulate', action='store_true', help="Run in mock simulation mode")

    args = parser.parse_args()

    if args.simulate:
        run_simulation(args.api)
    else:
        run_serial(args.port, args.baud, args.api)
