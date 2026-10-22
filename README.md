<![CDATA[<!-- ───────────────────────────────────────────────────────────── -->
<!-- 🛒  AI-POWERED SMART SHOPPING CART SYSTEM — README          -->
<!-- ───────────────────────────────────────────────────────────── -->

<div align="center">

  <!-- Banner -->
  <img src="Documents/banner.jpg" alt="AI-Powered Smart Shopping Cart System Banner" width="100%"/>

  <br/><br/>

  # 🛒 AI-Powered Smart Shopping Cart System
  ### *Autonomous Grocery Shopping & Checkout with IoT + Computer Vision*

  <br/>

  <!-- Badges -->
  ![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js&logoColor=white)
  ![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
  ![ESP32](https://img.shields.io/badge/ESP32-IoT-E7352C?style=for-the-badge&logo=espressif&logoColor=white)
  ![YOLOv8](https://img.shields.io/badge/YOLO-v11%20|%20v26s-00FFFF?style=for-the-badge&logo=yolo&logoColor=black)
  ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
  ![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
  ![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

  <br/>

  > **A full-stack autonomous grocery shopping system** integrating **Dual-Sensor Fusion** (Camera Vision + HX711 Load Cell), real-time running cart calculation, Supabase backend connectivity, and digital payment workflows — all powered by AI.

</div>

<br/>

---

<br/>

## 📑 Table of Contents

- [✨ Key Features](#-key-features)
- [🏗️ System Architecture & Workflow](#️-system-architecture--workflow)
- [🔧 Tech Stack](#-tech-stack)
- [📐 Hardware Blueprints](#-hardware-blueprints)
- [⚡ Quick Start](#-quick-start)
- [🔌 Hardware Setup & ESP32 Firmware](#-hardware-setup--esp32-firmware)
- [🧠 AI Model Training Pipeline](#-ai-model-training-pipeline)
- [📦 Product Dataset Pipeline](#-product-dataset-pipeline)
- [☁️ Supabase Integration & RLS Setup](#️-supabase-integration--rls-setup)
- [🔐 Sensor Fusion & Payment Rules](#-sensor-fusion--payment-rules)
- [🗂️ Project Structure](#️-project-structure)
- [📸 Screenshots & Blueprints](#-screenshots--blueprints)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

<br/>

---

<br/>

## ✨ Key Features

<table>
  <tr>
    <td width="50%">

  #### 🎯 Dual-Sensor Fusion
  Items are confirmed **only** when **both** camera vision identity **AND** load cell weight delta match within ±20% tolerance — eliminating false positives.

  #### 🤖 AI Computer Vision
  Real-time product recognition using custom-trained YOLO models (YOLOv11n / YOLOv26s) with webcam + barcode scanning via HTML5 BarcodeDetector API.

  #### ⚖️ Precision Weight Sensing
  ESP32 + HX711 24-bit ADC load cell with calibrated tare, stability detection, and newline-terminated JSON serial protocol.

  </td>
  <td width="50%">

  #### 💎 Luxury Glassmorphic UI
  Premium design with glassmorphic surfaces, `backdrop-filter: blur(24px)`, Manrope/Inter typography, pill navigation, and canvas confetti celebrations.

  #### 💳 Smart Payment System
  Server-authoritative price validation, order snapshots, dynamic UPI Autopay / Razorpay QR generation with correlation IDs and audit timestamps.

  #### ☁️ Cloud-First Backend
  Supabase (PostgreSQL + GoTrue Auth + RLS), real-time cart synchronization, and order history with robust audit trails.

  </td>
  </tr>
</table>

<br/>

---

<br/>

## 🏗️ System Architecture & Workflow

### End-to-End Flow

The system follows an **8-step autonomous workflow** from cart pick-up to auto-payment:

<div align="center">
  <img src="Documents/Sample images/1785563558124.jpeg" alt="AI-Powered Smart Cart — End-to-End Workflow Flowchart" width="95%"/>
  <br/>
  <sub><b>Fig 1:</b> Complete End-to-End Workflow — From Cart Pick-up → Item Detection → Sensor Fusion → Checkout</sub>
</div>

<br/>

| Step | Module | Description |
|:---:|:---|:---|
| **1** | 🛒 Cart Pick-Up | Customer picks up smart cart; camera + weight sensors activate |
| **2** | 📸 Item Detection (CV) | Camera captures item; YOLOv8/v11 model identifies the product |
| **3** | ⚖️ Weight Verification | HX711 load cell confirms weight delta; validates pick-up vs. put-back |
| **4** | 🔗 Sensor Fusion Engine | Cross-checks camera ID + weight confirmation to validate event |
| **5** | 📡 Live Cart Transmission | Item added/removed from total, sent live via MQTT / WebSocket |
| **6** | ☁️ Backend Processing | PostgreSQL / Supabase handles inventory & pricing lookup |
| **7** | 💰 Running Total Display | Real-time total shown on cart touch screen |
| **8** | 💳 Checkout & Auto-Payment | Customer exits; payment auto-charged via Razorpay / UPI mandate |

<br/>

### System Architecture Diagram

```
               +────────────────────────────────────────────────────+
               │                SmartCart AI Client                 │
               │   Next.js 15 (App Router) + TypeScript + React 19  │
               │        Luxury Glassmorphic UI (Manrope/Inter)      │
               +─────────────────────────┬──────────────────────────+
                                         │
               +─────────────────────────┴──────────────────────────+
               │                                                    │
     ┌─────────────────────┐                              ┌─────────────────────┐
     │  Dual-Sensor Inputs │                              │   Server & Data     │
     ├─────────────────────┤                              ├─────────────────────┤
     │ 1. USB Camera       │                              │ Supabase Backend    │
     │    • HTML5 Barcode   │                              │ • GoTrue Auth       │
     │    • YOLOv8 Bridge   │                              │ • PostgreSQL + RLS  │
     │                     │                              │ • Order Snapshots   │
     │ 2. ESP32 Scale      │                              │                     │
     │    • HX711 ADC       │                              │ Authoritative API   │
     │    • Strain Gauge    │                              │ • Cart Validation   │
     │    • LEDs / Buzzer   │                              │ • Demo UPI / QR     │
     └──────────┬──────────┘                              └─────────────────────┘
                │
     ┌──────────▼──────────┐
     │   Sensor Fusion     │  Item added ONLY when Vision Identity
     │   Consensus Core    │  AND Load-Cell Weight Delta match ±20%
     └─────────────────────┘
```

<br/>

---

<br/>

## 🔧 Tech Stack

<table>
  <tr>
    <th>Layer</th>
    <th>Technology</th>
    <th>Details</th>
  </tr>
  <tr>
    <td><b>🎨 Frontend</b></td>
    <td>Next.js 15.1 + React 19</td>
    <td>App Router, TypeScript, Lucide Icons, Canvas Confetti</td>
  </tr>
  <tr>
    <td><b>🎭 Design System</b></td>
    <td>Luxury Glassmorphism</td>
    <td>
      <code>backdrop-filter: blur(24px)</code>, Manrope/Inter fonts<br/>
      Color Tokens: Midnight Purple <code>#25105F</code> · Sky Blue <code>#A9D2F0</code> · Deep Blue <code>#527CA7</code> · Warm Gold <code>#DAB77D</code> · Emerald <code>#10B981</code>
    </td>
  </tr>
  <tr>
    <td><b>📊 Data Engine</b></td>
    <td>5,198 Products (DMart)</td>
    <td>Indian grocery catalog with MRP/selling price, multi-pack weight parsing, barcode provenance tracking</td>
  </tr>
  <tr>
    <td><b>👁️ Vision</b></td>
    <td>YOLO v11n / v26s</td>
    <td>Custom-trained grocery detection, HTML5 BarcodeDetector, anti-duplicate debouncing</td>
  </tr>
  <tr>
    <td><b>⚙️ IoT Firmware</b></td>
    <td>ESP32 + HX711</td>
    <td>C++ firmware, JSON serial protocol, LED/Buzzer alerts, Hardware Emulator</td>
  </tr>
  <tr>
    <td><b>🔗 Serial Bridge</b></td>
    <td>Python (pyserial)</td>
    <td>Real-time telemetry bridge: <code>serial_bridge.py</code> with simulation mode</td>
  </tr>
  <tr>
    <td><b>☁️ Backend</b></td>
    <td>Supabase</td>
    <td>PostgreSQL + GoTrue Auth + Row-Level Security (RLS) + Order Snapshots</td>
  </tr>
  <tr>
    <td><b>💳 Payments</b></td>
    <td>Razorpay / UPI</td>
    <td>Server-authoritative validation, dynamic QR, correlation IDs, audit timestamps</td>
  </tr>
  <tr>
    <td><b>🧠 ML Training</b></td>
    <td>Ultralytics YOLO</td>
    <td>Custom training pipeline with <code>train.py</code>, <code>val.py</code>, <code>test_inference.py</code></td>
  </tr>
</table>

<br/>

---

<br/>

## 📐 Hardware Blueprints

<div align="center">

  ### Full Smart Cart Blueprint (Final Design)

  <img src="Documents/Sample images/AI Smart Shopping Cart Blueprint.png" alt="AI Smart Shopping Cart Full Blueprint — Multi-view engineering drawing with IoT wiring diagram" width="95%"/>
  <br/>
  <sub><b>Fig 2:</b> Complete Smart Cart Blueprint — Front, Side, Rear, Top, Isometric views + IoT Component Wiring Diagram</sub>

  <br/><br/>

  ### Stage 1 Blueprint (Laptop + Camera + IoT Components)

  <img src="Documents/Sample images/Stage 1 Smart Cart Blueprint.png" alt="Stage 1 Smart Cart Blueprint — Laptop, Camera, Load Cell, ESP32, Wiring Diagram, Working Flow" width="95%"/>
  <br/>
  <sub><b>Fig 3:</b> Stage 1 Prototype — System Setup, Load Cell, Component Layout, Wiring Diagram & Working Flow</sub>

</div>

<br/>

---

<br/>

## ⚡ Quick Start

### Prerequisites

| Requirement | Tested Version |
|:---|:---|
| **Node.js** | v18+ (tested on v24.19) |
| **Python** | 3.9+ (tested on Python 3.14 with `pandas`) |
| **Arduino IDE** | For ESP32 firmware flashing |

### 1️⃣ Install Frontend Dependencies

```bash
npm install
```

### 2️⃣ Run Next.js Development Server

```bash
npm run dev
```

> 🌐 Open **[http://localhost:3000](http://localhost:3000)** in your browser

### 3️⃣ Run Automated Tests

```bash
python -m unittest tests/test_api.py
```

### 4️⃣ Build Production Bundle

```bash
npm run build
```

### 5️⃣ Start Vision Microservice (Optional — for custom YOLO models)

```bash
python -m uvicorn services.vision_service:app --port 8000
```

<br/>

---

<br/>

## 🔌 Hardware Setup & ESP32 Firmware

### Bill of Materials (BOM)

| Component | Specification |
|:---|:---|
| **Microcontroller** | ESP32 DevKit V1 (30-pin or 38-pin) |
| **Load Cell** | Single-point aluminum strain gauge (5 kg / 10 kg rated) |
| **ADC Amplifier** | HX711 24-bit dual-channel ADC module |
| **Indicator LEDs** | 1× Green 5mm LED, 1× Red 5mm LED |
| **Resistors** | 2× 220 Ω current-limiting resistors (for LEDs) |
| **Audio Feedback** | 5V Active Buzzer (or 3.3V via 2N2222 NPN transistor) |
| **Host Connection** | Laptop via Micro-USB / USB-C (115200 baud) |

### Wiring Connections

| Component | Component Pin | ESP32 GPIO | Description |
|:---|:---|:---:|:---|
| **HX711** | VCC | 3.3V | Power supply |
| **HX711** | GND | GND | Common ground |
| **HX711** | DT (Data) | **GPIO 18** | High-speed serialized 24-bit reading |
| **HX711** | SCK (Clock) | **GPIO 19** | Clock output from ESP32 |
| **Green LED** | Anode (+) | **GPIO 21** | Through 220 Ω resistor → Item Added ✅ |
| **Red LED** | Anode (+) | **GPIO 22** | Through 220 Ω resistor → Mismatch ❌ |
| **Buzzer** | Signal (+) | **GPIO 23** | Active buzzer confirmation chirp 🔊 |
| **Load Cell** | Red Wire | E+ on HX711 | Excitation positive |
| **Load Cell** | Black Wire | E− on HX711 | Excitation negative |
| **Load Cell** | Green Wire | A− on HX711 | Analog signal negative |
| **Load Cell** | White Wire | A+ on HX711 | Analog signal positive |

### Serial Protocol

The ESP32 communicates over **115200 baud**, sending newline-terminated JSON:

```json
// Telemetry Output (ESP32 → Laptop)
{"device_id":"ESP32_STAGE1_CART01", "weight_g":182.4, "delta_g":182.4, "stable":true, "timestamp":123456}

// Inbound Commands (Laptop → ESP32)
{"cmd":"ack_add"}    → Green LED flash + 1 Beep
{"cmd":"alert_err"}  → Red LED flash + 2 Beeps
{"cmd":"tare"}       → Reset scale offset
```

### Flashing the ESP32

1. Open the **Arduino IDE**
2. Install the **HX711 by Bogdan Necula** library from Arduino Library Manager
3. Select Board: **ESP32 Dev Module** → Choose your COM port (e.g., `COM3`)
4. Open [`firmware/SmartCart_ESP32.ino`](firmware/SmartCart_ESP32.ino)
5. Click **Upload** ⬆️

### Calibration

1. On boot, the ESP32 automatically runs `scale.tare()` to zero the scale
2. Place a known calibration weight (e.g., 500g salt packet) on the platform
3. If the reading differs, adjust `calibration_factor` in the firmware:

$$\text{new\_factor} = \text{old\_factor} \times \frac{\text{measured\_weight}}{\text{known\_weight}}$$

### Python Serial Bridge

```bash
# Live Mode (ESP32 plugged in via USB)
python firmware/serial_bridge.py --port COM3 --baud 115200

# Simulated Mode (No physical hardware)
python firmware/serial_bridge.py --simulate
```

> 💡 **Tip:** The web dashboard also includes a **built-in interactive Hardware Emulator** with live tare, weight simulation, noise injection, and Web Audio API buzzer feedback!

<br/>

---

<br/>

## 🧠 AI Model Training Pipeline

### Training Custom Grocery Models

The system supports custom YOLO model training for real-time grocery recognition:

```
training/
├── dataset/
│   ├── images/
│   │   ├── train/          # 70–80% of images
│   │   ├── val/            # 15–20% of images
│   │   └── test/           # (Optional) Unseen test images
│   └── labels/
│       ├── train/          # YOLO-format .txt label files
│       ├── val/
│       └── test/
├── dataset.yaml            # Class definitions
├── train.py                # Training pipeline
├── val.py                  # Validation & mAP evaluation
├── test_inference.py       # Quick prediction test
└── collect_webcam_dataset.py  # Webcam image collection tool
```

### Image Collection Guidelines

| Parameter | Recommendation |
|:---|:---|
| **Quantity** | 50–150 images per product |
| **Lighting** | Bright daylight, indoor fluorescent, low-light angles |
| **Angles** | Front, back, tilted (30°/45°/90°), top-down |
| **Distances** | Close-up (15–20 cm), medium (30–60 cm), in-hand positions |
| **Backgrounds** | Plain desk, white tabletop, real store shelf/cart basket |

### Training Commands

```bash
# Start training
python training/train.py --epochs 50 --batch 16 --imgsz 640

# Validate precision, recall & mAP
python training/val.py --weights models/best.pt
```

### Sample Validation Output

```
============================================================
  SmartCart AI — Validation Metrics Report
============================================================
  Precision (B):   0.9412
  Recall (B):      0.9180
  mAP @ 0.50:      0.9534
  mAP @ 0.50:0.95: 0.8120
============================================================
```

### Model Deployment

1. Place trained checkpoint at: `models/best.pt`
2. Start the vision microservice:
   ```bash
   python -m uvicorn services.vision_service:app --port 8000
   ```
3. Open `http://localhost:3000` — the vision status pill switches to **`Custom Weights Active (best.pt)`** ✨

<br/>

---

<br/>

## 📦 Product Dataset Pipeline

### Overview

The system ships with **5,198 validated Indian grocery products** sourced from the DMart catalog.

```bash
# Re-run or inspect the dataset standardization pipeline
python dataset/prepare_dataset.py
```

| Property | Details |
|:---|:---|
| **Input** | `dataset/DMart.csv/DMart.csv` (5,189 raw items) |
| **Output** | `dataset/products.csv` and `dataset/products.json` (5,198 items) |
| **MRP & Selling Price** | Maintained separately — average savings: **26.3%** |
| **Multi-pack Parsing** | `4×100 gm` → 400g, `5 L` → 5000g |
| **Barcode Provenance** | 10 authentic GS1 verified staple items (Parle-G, Maggi, Amul Butter, Tata Salt, etc.) + 5,188 synthetic demo items flagged as `synthetic_demo` |
| **Sanitization** | Discards corrupted rows (e.g., Row 2980 with missing product name) |

<br/>

---

<br/>

## ☁️ Supabase Integration & RLS Setup

The project includes Supabase helpers in `src/utils/supabase/`:

| File | Purpose |
|:---|:---|
| `client.ts` | Browser client using `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `server.ts` | Server Component client with cookie management |
| `middleware.ts` | Keeps session tokens refreshed across page visits |

### Apply Database Schema

```bash
# Run the SQL script in your Supabase project
supabase/schema.sql
```

> 📖 See [`supabase/schema.sql`](supabase/schema.sql) for full table definitions and Row-Level Security (RLS) policies.

<br/>

---

<br/>

## 🔐 Sensor Fusion & Payment Rules

### Dual-Sensor Consensus

| Rule | Behavior |
|:---|:---|
| 📸 Camera detection **alone** | ❌ Does **not** bill the item |
| ⚖️ Weight change **alone** | ❌ Does **not** bill the item |
| 📸 + ⚖️ **Both agree (±20%)** | ✅ Item **confirmed** and added to cart |

### Put-Back Handling

When an item is decremented or removed from the cart, the expected weight is subtracted from the scale — ensuring accurate running totals.

### Payment Security

| Feature | Implementation |
|:---|:---|
| **Demo Mode** | QR codes and mock checkout clearly labeled as non-live |
| **Client Actions** | Button clicks and uploaded screenshots are **never** considered real proof |
| **Server Verification** | Transitions use **correlation IDs** and **audit timestamps** |

<br/>

---

<br/>

## 🗂️ Project Structure

```
porject-IoT/
├── 📂 src/
│   ├── 📂 app/
│   │   ├── 📂 api/               # API routes
│   │   ├── 📂 auth/              # Authentication pages
│   │   ├── 📂 checkout/          # Checkout flow
│   │   ├── 📄 globals.css        # Design system & global styles
│   │   ├── 📄 layout.tsx         # Root layout
│   │   └── 📄 page.tsx           # Main dashboard page
│   ├── 📂 components/
│   │   ├── 📄 AutonomousDashboardView.tsx   # Main autonomous cart dashboard
│   │   ├── 📄 CameraScanner.tsx             # Camera + barcode scanner
│   │   ├── 📄 CartList.tsx                  # Shopping cart item list
│   │   ├── 📄 CartHistoryModal.tsx          # Order history modal
│   │   ├── 📄 CustomerProfileModal.tsx      # User profile management
│   │   ├── 📄 ProductCatalogModal.tsx       # Product catalog browser
│   │   ├── 📄 HardwareSimulatorPanel.tsx    # IoT hardware emulator
│   │   ├── 📄 LuxuryHeroView.tsx            # Landing hero section
│   │   ├── 📄 LuxuryTopNav.tsx              # Premium top navigation
│   │   ├── 📄 WifiPopover.tsx               # WiFi/connectivity status
│   │   └── 📄 BatteryPopover.tsx            # Battery status indicator
│   ├── 📂 data/                  # Static data files
│   ├── 📂 lib/                   # Utility libraries
│   ├── 📂 types/                 # TypeScript type definitions
│   └── 📂 utils/                 # Supabase & helper utilities
├── 📂 firmware/
│   ├── 📄 SmartCart_ESP32.ino     # ESP32 C++ firmware sketch
│   ├── 📄 serial_bridge.py       # Python serial bridge (USB ↔ Web)
│   └── 📄 README.md              # Hardware setup guide
├── 📂 training/
│   ├── 📄 train.py               # YOLO training pipeline
│   ├── 📄 val.py                 # Model validation & mAP
│   ├── 📄 test_inference.py      # Quick inference test
│   ├── 📄 collect_webcam_dataset.py  # Webcam dataset collector
│   ├── 📄 prepare_dataset.py     # Dataset preparation script
│   └── 📄 dataset.yaml           # YOLO class configuration
├── 📂 dataset/
│   ├── 📄 products.csv           # 5,198 validated products
│   ├── 📄 products.json          # JSON product catalog
│   └── 📄 prepare_dataset.py     # Dataset standardization pipeline
├── 📂 models/
│   ├── 📄 best.pt                # Custom-trained YOLO weights
│   ├── 📄 brand_classifier.pt    # Brand classification model
│   ├── 📄 yolo11n.pt             # YOLOv11 Nano baseline
│   └── 📄 yolo26s.pt             # YOLOv26 Small weights
├── 📂 services/
│   └── 📄 vision_service.py      # FastAPI vision microservice
├── 📂 supabase/
│   ├── 📄 schema.sql             # Database schema + RLS policies
│   └── 📄 migration_fix.sql      # Migration patch
├── 📂 tests/                     # Automated test suite
├── 📂 Documents/                 # Blueprints, flowcharts & docs
│   ├── 📂 Sample images/         # Engineering drawings
│   └── 📄 *.pdf                  # Project documentation PDFs
├── 📄 package.json               # Node.js dependencies
├── 📄 tsconfig.json              # TypeScript configuration
└── 📄 .env.local                 # Environment variables
```

<br/>

---

<br/>

## 📸 Screenshots & Blueprints

<div align="center">

| Blueprint | Description |
|:---:|:---|
| <img src="Documents/Sample images/AI Smart Shopping Cart Blueprint.png" width="400"/> | **Full Cart Design** — Multi-view engineering drawing with IoT wiring diagram, key features, and materials list |
| <img src="Documents/Sample images/Stage 1 Smart Cart Blueprint.png" width="400"/> | **Stage 1 Prototype** — Laptop + Camera + Load Cell setup with component dimensions and working flow |
| <img src="Documents/Sample images/1785563558124.jpeg" width="400"/> | **End-to-End Workflow** — 8-step flowchart from cart pick-up to auto-payment |

</div>

<br/>

---

<br/>

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a **Pull Request**

<br/>

---

<br/>

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

<br/>

---

<div align="center">

  <img src="Documents/icon.jpeg" alt="Smart Cart Logo" width="60"/>

  <br/>

  **Built with ❤️ using Next.js, ESP32 IoT, and AI Computer Vision**

  <br/>

  ⭐ *If you found this project useful, consider giving it a star!* ⭐

</div>
]]>
