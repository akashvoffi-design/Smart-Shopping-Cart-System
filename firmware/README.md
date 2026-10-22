# ESP32 HX711 Firmware & Hardware Setup (Stage 1)

This directory contains the firmware sketch for the ESP32 microcontroller, load cell amplifier, and the Python serial bridge that links the physical scale to the Smart Shopping Cart backend.

## 1. Hardware Bill of Materials (BOM)
- **Microcontroller**: ESP32 DevKit V1 (30-pin or 38-pin)
- **Load Cell**: Single-point aluminum strain gauge load cell (rated 5 kg or 10 kg)
- **ADC Amplifier**: HX711 24-bit dual-channel ADC module
- **Indicator LEDs**: 1x Green 5mm LED, 1x Red 5mm LED
- **Resistors**: 2x 220 $\Omega$ current-limiting resistors (for LEDs)
- **Audio Feedback**: 5V Active Buzzer (or 3.3V buzzer driven via 2N2222 NPN transistor)
- **Host**: Laptop connected via Micro-USB / USB-C cable (115200 baud)

---

## 2. Wiring Connections

| Component | Component Pin | ESP32 GPIO | Description / Notes |
| :--- | :--- | :--- | :--- |
| **HX711** | VCC | 3.3V | Power (3.3V ensures safe signal level for ESP32) |
| **HX711** | GND | GND | Common ground |
| **HX711** | DT (Data) | **GPIO 18** | High-speed serialized 24-bit reading |
| **HX711** | SCK (Clock) | **GPIO 19** | Clock output from ESP32 |
| **Green LED** | Anode (+) | **GPIO 21** | Through 220 $\Omega$ resistor (Item Added / Verified) |
| **Red LED** | Anode (+) | **GPIO 22** | Through 220 $\Omega$ resistor (Weight Mismatch / Error) |
| **Buzzer** | Signal (+) | **GPIO 23** | Active buzzer confirmation chirp |
| **Load Cell** | Red Wire | E+ on HX711 | Excitation positive |
| **Load Cell** | Black Wire | E- on HX711 | Excitation negative |
| **Load Cell** | Green Wire | A- on HX711 | Analog signal negative |
| **Load Cell** | White Wire | A+ on HX711 | Analog signal positive |

---

## 3. Flashing the ESP32
1. Open the Arduino IDE.
2. Install the **HX711 by Bogdan Necula** library from Arduino Library Manager.
3. Select Board: **ESP32 Dev Module** and choose your COM port (e.g., `COM3`).
4. Open [`SmartCart_ESP32.ino`](./SmartCart_ESP32.ino).
5. Click **Upload**.

### Calibration:
1. When empty, the ESP32 boots and automatically runs `scale.tare()`.
2. Place a known calibration weight (e.g., a 500g salt pack or 100g weight) on the platform.
3. If the reading differs from actual grams, adjust `calibration_factor` in line 35 of [`SmartCart_ESP32.ino`](./SmartCart_ESP32.ino):
   $$\text{new\_factor} = \text{old\_factor} \times \frac{\text{measured\_weight}}{\text{known\_weight}}$$

---

## 4. Running the Serial Bridge
To bridge physical telemetry from ESP32 to the web dashboard:
```bash
python firmware/serial_bridge.py --port COM3 --baud 115200
```

### Simulated Mode (No physical hardware connected):
If you do not have physical hardware wired up, run:
```bash
python firmware/serial_bridge.py --simulate
```
Alternatively, the web dashboard has a **built-in interactive Hardware Simulator** with real-time tare, noise injection, and synthetic buzzer audio.
