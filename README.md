<!-- 🛒 AI-POWERED SMART SHOPPING CART SYSTEM — README -->

<div align="center">

<img src="Documents/banner.jpg" alt="AI-Powered Smart Shopping Cart System Banner" width="100%"/>

<br/>

<h1>🛒 AI-Powered Smart Shopping Cart System</h1>
<h3><i>Autonomous Grocery Shopping & Checkout with IoT + Computer Vision</i></h3>

<br/>

![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![ESP32](https://img.shields.io/badge/ESP32-IoT-E7352C?style=for-the-badge&logo=espressif&logoColor=white)
![YOLO](https://img.shields.io/badge/YOLO-v11%20%7C%20v26s-00FFFF?style=for-the-badge&logo=yolo&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

<br/>

**A full-stack autonomous grocery shopping system** integrating **Dual-Sensor Fusion** (Camera Vision + HX711 Load Cell), real-time running cart calculation, Supabase backend connectivity, and digital payment workflows — all powered by AI.

</div>

<br/>

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [System Architecture & Workflow](#-system-architecture--workflow)
- [Tech Stack](#-tech-stack)
- [Hardware Blueprints](#-hardware-blueprints)
- [Quick Start](#-quick-start)
- [Hardware Setup & ESP32 Firmware](#-hardware-setup--esp32-firmware)
- [AI Model Training Pipeline](#-ai-model-training-pipeline)
- [Product Dataset Pipeline](#-product-dataset-pipeline)
- [Supabase Integration & RLS Setup](#-supabase-integration--rls-setup)
- [Sensor Fusion & Payment Rules](#-sensor-fusion--payment-rules)
- [Project Structure](#-project-structure)
- [Screenshots & Blueprints](#-screenshots--blueprints)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Key Features

🎯 **Dual-Sensor Fusion** — Items are confirmed **only** when **both** camera vision identity **AND** load cell weight delta match within ±20% tolerance — eliminating false positives.

🤖 **AI Computer Vision** — Real-time product recognition using custom-trained YOLO models (YOLOv11n / YOLOv26s) with webcam + barcode scanning via HTML5 BarcodeDetector API.

⚖️ **Precision Weight Sensing** — ESP32 + HX711 24-bit ADC load cell with calibrated tare, stability detection, and newline-terminated JSON serial protocol.

💎 **Luxury Glassmorphic UI** — Premium design with glassmorphic surfaces, `backdrop-filter: blur(24px)`, Manrope/Inter typography, pill navigation, and canvas confetti celebrations.

💳 **Smart Payment System** — Server-authoritative price validation, order snapshots, dynamic UPI Autopay / Razorpay QR generation with correlation IDs and audit timestamps.

☁️ **Cloud-First Backend** — Supabase (PostgreSQL + GoTrue Auth + RLS), real-time cart synchronization, and order history with robust audit trails.

---

## 🏗️ System Architecture & Workflow

### End-to-End Flow

The system follows an **8-step autonomous workflow** from cart pick-up to auto-payment:

<div align="center">
<img src="Documents/Sample images/1785563558124.jpeg" alt="AI-Powered Smart Cart End-to-End Workflow Flowchart" width="95%"/>
<br/>
<b>Fig 1:</b> Complete End-to-End Workflow — From Cart Pick-up to Item Detection to Sensor Fusion to Checkout
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

### System Architecture Diagram

```
                +---------------------------------------------------+
                |               SmartCart AI Client                  |
                |  Next.js 15 (App Router) + TypeScript + React 19  |
                |       Luxury Glassmorphic UI (Manrope/Inter)      |
                +------------------------+--------------------------+
                                         |
                +------------------------+--------------------------+
                |                                                   |
      [Dual-Sensor Inputs]                                 [Server & Data]
      +--------------------+                              +--------------------+
      | 1. USB Camera      |                              | Supabase Backend   |
      |    - HTML5 Barcode  |                              | - GoTrue Auth      |
      |    - YOLOv8 Bridge  |                              | - PostgreSQL + RLS |
      +--------+-----------+                              | - Order Snapshots  |
               |                                          +--------+-----------+
      +--------+-----------+                                       |
      | 2. ESP32 Scale     |                              +--------+-----------+
      |    - HX711 ADC      |                              | Authoritative API  |
      |    - Strain Gauge   |                              | - Cart Validation  |
      |    - LEDs / Buzzer  |                              | - Demo UPI / QR    |
      +--------+-----------+                              +--------------------+
               |
      +--------v-----------+
      |   Sensor Fusion    |  Item added ONLY when Vision Identity
      |   Consensus Core   |  AND Load-Cell Weight Delta match +/-20%
      +--------------------+
```

---

## 🔧 Tech Stack

| Layer | Technology | Details |
|:---|:---|:---|
| **🎨 Frontend** | Next.js 15.1 + React 19 | App Router, TypeScript, Lucide Icons, Canvas Confetti |
| **🎭 Design System** | Luxury Glassmorphism | `backdrop-filter: blur(24px)`, Manrope/Inter fonts. Color Tokens: Midnight Purple `#25105F`, Sky Blue `#A9D2F0`, Deep Blue `#527CA7`, Warm Gold `#DAB77D`, Emerald `#10B981` |
| **📊 Data Engine** | 5,198 Products (DMart) | Indian grocery catalog with MRP/selling price, multi-pack weight parsing, barcode provenance tracking |
| **👁️ Vision** | YOLO v11n / v26s | Custom-trained grocery detection, HTML5 BarcodeDetector, anti-duplicate debouncing |
| **⚙️ IoT Firmware** | ESP32 + HX711 | C++ firmware, JSON serial protocol, LED/Buzzer alerts, Hardware Emulator |
| **🔗 Serial Bridge** | Python (pyserial) | Real-time telemetry bridge: `serial_bridge.py` with simulation mode |
| **☁️ Backend** | Supabase | PostgreSQL + GoTrue Auth + Row-Level Security (RLS) + Order Snapshots |
| **💳 Payments** | Razorpay / UPI | Server-authoritative validation, dynamic QR, correlation IDs, audit timestamps |
| **🧠 ML Training** | Ultralytics YOLO | Custom training pipeline with `train.py`, `val.py`, `test_inference.py` |

---

## 📐 Hardware Blueprints

### Full Smart Cart Blueprint (Final Design)

<div align="center">
<img src="Documents/Sample images/AI Smart Shopping Cart Blueprint.png" alt="AI Smart Shopping Cart Full Blueprint" width="95%"/>
<br/>
<b>Fig 2:</b> Complete Smart Cart Blueprint — Front, Side, Rear, Top, Isometric views + IoT Component Wiring Diagram
</div>

<br/>

### Stage 1 Blueprint (Laptop + Camera + IoT Components)

<div align="center">
<img src="Documents/Sample images/Stage 1 Smart Cart Blueprint.png" alt="Stage 1 Smart Cart Blueprint" width="95%"/>
<br/>
<b>Fig 3:</b> Stage 1 Prototype — System Setup, Load Cell, Component Layout, Wiring Diagram & Working Flow
</div>

---

## ⚡ Quick Start

### Prerequisites

| Requirement | Tested Version |
|:---|:---|
| **Node.js** | v18+ (tested on v24.19) |
| **Python** | 3.9+ (tested on Python 3.14 with `pandas`) |
| **Arduino IDE** | For ESP32 firmware flashing |

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Run Next.js Development Server

```bash
npm run dev
```

> 🌐 Open **[http://localhost:3000](http://localhost:3000)** in your browser

### 3. Run Automated Tests

```bash
python -m unittest tests/test_api.py
```

### 4. Build Production Bundle

```bash
npm run build
```

### 5. Start Vision Microservice (Optional — for custom YOLO models)

```bash
python -m uvicorn services.vision_service:app --port 8000
```

---

## 🔌 Hardware Setup & ESP32 Firmware

### Bill of Materials (BOM)

| Component | Specification |
|:---|:---|
| **Microcontroller** | ESP32 DevKit V1 (30-pin or 38-pin) |
| **Load Cell** | Single-point aluminum strain gauge (5 kg / 10 kg rated) |
| **ADC Amplifier** | HX711 24-bit dual-channel ADC module |
| **Indicator LEDs** | 1x Green 5mm LED, 1x Red 5mm LED |
| **Resistors** | 2x 220 Ohm current-limiting resistors (for LEDs) |
| **Audio Feedback** | 5V Active Buzzer (or 3.3V via 2N2222 NPN transistor) |
| **Host Connection** | Laptop via Micro-USB / USB-C (115200 baud) |

### Wiring Connections

| Component | Component Pin | ESP32 GPIO | Description |
|:---|:---|:---:|:---|
| **HX711** | VCC | 3.3V | Power supply |
| **HX711** | GND | GND | Common ground |
| **HX711** | DT (Data) | **GPIO 18** | High-speed serialized 24-bit reading |
| **HX711** | SCK (Clock) | **GPIO 19** | Clock output from ESP32 |
| **Green LED** | Anode (+) | **GPIO 21** | Through 220 Ohm resistor - Item Added |
| **Red LED** | Anode (+) | **GPIO 22** | Through 220 Ohm resistor - Mismatch |
| **Buzzer** | Signal (+) | **GPIO 23** | Active buzzer confirmation chirp |
| **Load Cell** | Red Wire | E+ on HX711 | Excitation positive |
| **Load Cell** | Black Wire | E- on HX711 | Excitation negative |
| **Load Cell** | Green Wire | A- on HX711 | Analog signal negative |
| **Load Cell** | White Wire | A+ on HX711 | Analog signal positive |

### Serial Protocol

The ESP32 communicates over **115200 baud**, sending newline-terminated JSON:

```json
{"device_id":"ESP32_STAGE1_CART01", "weight_g":182.4, "delta_g":182.4, "stable":true, "timestamp":123456}
```

**Inbound Commands (Laptop to ESP32):**

| Command | Action |
|:---|:---|
| `{"cmd":"ack_add"}` | Green LED flash + 1 Beep |
| `{"cmd":"alert_err"}` | Red LED flash + 2 Beeps |
| `{"cmd":"tare"}` | Reset scale offset |

### Flashing the ESP32

1. Open the **Arduino IDE**
2. Install the **HX711 by Bogdan Necula** library from Arduino Library Manager
3. Select Board: **ESP32 Dev Module** and choose your COM port (e.g., `COM3`)
4. Open [`firmware/SmartCart_ESP32.ino`](firmware/SmartCart_ESP32.ino)
5. Click **Upload**

### Calibration

1. On boot, the ESP32 automatically runs `scale.tare()` to zero the scale
2. Place a known calibration weight (e.g., 500g salt packet) on the platform
3. If the reading differs, adjust `calibration_factor` in the firmware:
   - `new_factor = old_factor * (measured_weight / known_weight)`

### Python Serial Bridge

```bash
# Live Mode (ESP32 plugged in via USB)
python firmware/serial_bridge.py --port COM3 --baud 115200

# Simulated Mode (No physical hardware)
python firmware/serial_bridge.py --simulate
```

> 💡 **Tip:** The web dashboard also includes a **built-in interactive Hardware Emulator** with live tare, weight simulation, noise injection, and Web Audio API buzzer feedback!

---

## 🧠 AI Model Training Pipeline

### Training Custom Grocery Models

The system supports custom YOLO model training for real-time grocery recognition:

```
training/
├── dataset/
│   ├── images/
│   │   ├── train/          # 70-80% of images
│   │   ├── val/            # 15-20% of images
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
| **Quantity** | 50-150 images per product |
| **Lighting** | Bright daylight, indoor fluorescent, low-light angles |
| **Angles** | Front, back, tilted (30/45/90 degrees), top-down |
| **Distances** | Close-up (15-20 cm), medium (30-60 cm), in-hand positions |
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
  SmartCart AI - Validation Metrics Report
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
3. Open `http://localhost:3000` — the vision status pill switches to **Custom Weights Active (best.pt)**

---

## 📦 Product Dataset Pipeline

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
| **Multi-pack Parsing** | `4x100 gm` = 400g, `5 L` = 5000g |
| **Barcode Provenance** | 10 authentic GS1 verified staple items (Parle-G, Maggi, Amul Butter, Tata Salt, etc.) + 5,188 synthetic demo items flagged as `synthetic_demo` |
| **Sanitization** | Discards corrupted rows (e.g., Row 2980 with missing product name) |

---

## ☁️ Supabase Integration & RLS Setup

The project includes Supabase helpers in `src/utils/supabase/`:

| File | Purpose |
|:---|:---|
| `client.ts` | Browser client using `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `server.ts` | Server Component client with cookie management |
| `middleware.ts` | Keeps session tokens refreshed across page visits |

To apply database tables and Row-Level Security (RLS) policies to your Supabase project, run the SQL script:

```bash
# Apply to your Supabase project
supabase/schema.sql
```

> See [`supabase/schema.sql`](supabase/schema.sql) for full table definitions and RLS policies.

---

## 🔐 Sensor Fusion & Payment Rules

### Dual-Sensor Consensus

| Scenario | Result |
|:---|:---|
| Camera detection **alone** | Does **NOT** bill the item |
| Weight change **alone** | Does **NOT** bill the item |
| Camera + Weight **both agree (within 20%)** | Item **CONFIRMED** and added to cart |

### Put-Back Handling

When an item is decremented or removed from the cart, the expected weight is subtracted from the scale — ensuring accurate running totals.

### Payment Security

| Feature | Implementation |
|:---|:---|
| **Demo Mode** | QR codes and mock checkout clearly labeled as non-live |
| **Client Actions** | Button clicks and uploaded screenshots are **never** considered real proof |
| **Server Verification** | Transitions use **correlation IDs** and **audit timestamps** |

---

## 🗂️ Project Structure

```
porject-IoT/
├── src/
│   ├── app/
│   │   ├── api/                  # API routes
│   │   ├── auth/                 # Authentication pages
│   │   ├── checkout/             # Checkout flow
│   │   ├── globals.css           # Design system & global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Main dashboard page
│   ├── components/
│   │   ├── AutonomousDashboardView.tsx   # Main autonomous cart dashboard
│   │   ├── CameraScanner.tsx             # Camera + barcode scanner
│   │   ├── CartList.tsx                  # Shopping cart item list
│   │   ├── CartHistoryModal.tsx          # Order history modal
│   │   ├── CustomerProfileModal.tsx      # User profile management
│   │   ├── ProductCatalogModal.tsx       # Product catalog browser
│   │   ├── HardwareSimulatorPanel.tsx    # IoT hardware emulator
│   │   ├── LuxuryHeroView.tsx            # Landing hero section
│   │   ├── LuxuryTopNav.tsx              # Premium top navigation
│   │   ├── WifiPopover.tsx               # WiFi/connectivity status
│   │   └── BatteryPopover.tsx            # Battery status indicator
│   ├── data/                     # Static data files
│   ├── lib/                      # Utility libraries
│   ├── types/                    # TypeScript type definitions
│   └── utils/                    # Supabase & helper utilities
├── firmware/
│   ├── SmartCart_ESP32.ino        # ESP32 C++ firmware sketch
│   ├── serial_bridge.py          # Python serial bridge (USB to Web)
│   └── README.md                 # Hardware setup guide
├── training/
│   ├── train.py                  # YOLO training pipeline
│   ├── val.py                    # Model validation & mAP
│   ├── test_inference.py         # Quick inference test
│   ├── collect_webcam_dataset.py # Webcam dataset collector
│   ├── prepare_dataset.py        # Dataset preparation script
│   └── dataset.yaml              # YOLO class configuration
├── dataset/
│   ├── products.csv              # 5,198 validated products
│   ├── products.json             # JSON product catalog
│   └── prepare_dataset.py        # Dataset standardization pipeline
├── models/
│   ├── best.pt                   # Custom-trained YOLO weights
│   ├── brand_classifier.pt       # Brand classification model
│   ├── yolo11n.pt                # YOLOv11 Nano baseline
│   └── yolo26s.pt                # YOLOv26 Small weights
├── services/
│   └── vision_service.py         # FastAPI vision microservice
├── supabase/
│   ├── schema.sql                # Database schema + RLS policies
│   └── migration_fix.sql         # Migration patch
├── tests/                        # Automated test suite
├── Documents/                    # Blueprints, flowcharts & docs
│   ├── Sample images/            # Engineering drawings
│   └── *.pdf                     # Project documentation PDFs
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
└── .env.local                    # Environment variables
```

---

## 📸 Screenshots & Blueprints

<div align="center">

<img src="Documents/Sample images/AI Smart Shopping Cart Blueprint.png" alt="Full Cart Blueprint" width="90%"/>

**Full Cart Design** — Multi-view engineering drawing with IoT wiring diagram, key features, and materials list

<br/><br/>

<img src="Documents/Sample images/Stage 1 Smart Cart Blueprint.png" alt="Stage 1 Prototype Blueprint" width="90%"/>

**Stage 1 Prototype** — Laptop + Camera + Load Cell setup with component dimensions and working flow

<br/><br/>

<img src="Documents/Sample images/1785563558124.jpeg" alt="End-to-End Workflow" width="90%"/>

**End-to-End Workflow** — 8-step flowchart from cart pick-up to auto-payment

</div>

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a **Pull Request**

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

<img src="Documents/icon.jpeg" alt="Smart Cart Logo" width="60"/>

**Built with ❤️ using Next.js, ESP32 IoT, and AI Computer Vision**

⭐ *If you found this project useful, consider giving it a star!* ⭐

</div>
