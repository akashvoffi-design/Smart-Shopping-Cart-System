# Graph Report - porject-IoT  (2026-10-24)

## Corpus Check
- 75 files · ~332,133 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 127 file(s) not represented in the graph (top: (none) 121, .ipynb 3, .csv 1)

## Summary
- 560 nodes · 1106 edges · 21 communities (15 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d83a592e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- collect_google_images.py
- GlassIcon
- next
- AutonomousDashboardView.tsx
- vision_service.py
- package.json
- windows-wifi.ts
- names
- compilerOptions
- TestSmartShoppingCart
- CartHistoryModal.tsx
- IoTSimulator
- TestGroceryDetectionAndCart
- TestYOLOVisionIntegration
- README.md
- schema.sql
- data.yaml
- SmartCart AI — Custom Grocery Dataset Training Guide
- ESP32 HX711 Firmware & Hardware Setup (Stage 1)

## God Nodes (most connected - your core abstractions)
1. `next` - 30 edges
2. `GlassIcon()` - 23 edges
3. `lucide-react` - 20 edges
4. `react` - 20 edges
5. `iotSimulator` - 20 edges
6. `getProductByBarcode()` - 16 edges
7. `Product` - 16 edges
8. `IoTTelemetry` - 16 edges
9. `compilerOptions` - 16 edges
10. `createClient()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/cart/history/route.ts → src/utils/supabase/server.ts
- `POST()` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/cart/new/route.ts → src/utils/supabase/server.ts
- `POST()` --calls--> `getProductByBarcode()`  [EXTRACTED]
  src/app/api/cart/validate/route.ts → src/lib/products.ts
- `POST()` --calls--> `checkProductStock()`  [EXTRACTED]
  src/app/api/orders/route.ts → src/lib/products.ts
- `POST()` --calls--> `getProductByBarcode()`  [EXTRACTED]
  src/app/api/orders/route.ts → src/lib/products.ts

## Import Cycles
- None detected.

## Communities (21 total, 6 thin omitted)

### Community 0 - "collect_google_images.py"
Cohesion: 0.05
Nodes (20): clean_category(), clean_price(), parse_quantity_and_weight(), run_pipeline(), post_telemetry(), run_serial(), run_simulation(), collect_images_for_query() (+12 more)

### Community 1 - "GlassIcon"
Cohesion: 0.11
Nodes (27): lucide-react, react, AuthPage(), LoginForm(), LoginPage(), BatteryPopover(), BatteryPopoverProps, CustomerData (+19 more)

### Community 2 - "next"
Cohesion: 0.08
Nodes (24): next, GET(), mapPaymentStatus(), POST(), GET(), POST(), PUT(), latestTelemetry (+16 more)

### Community 3 - "AutonomousDashboardView.tsx"
Cohesion: 0.07
Nodes (61): POST(), POST(), GET(), CheckoutPage(), GroceryDashboard(), AutonomousDashboardView(), AutonomousDashboardViewProps, CameraScanner() (+53 more)

### Community 4 - "vision_service.py"
Cohesion: 0.09
Nodes (13): Base64DetectRequest, BoundingBox, detect_from_file(), detect_from_json(), DetectionItem, DetectionResponse, get_model_classes(), get_service_status() (+5 more)

### Community 5 - "package.json"
Cohesion: 0.07
Nodes (36): dependencies, canvas-confetti@^1.9.4, lucide-react@^1.16.0, next@^15.1.7, pdf-lib@^1.17.1, react@^19.0.0, react-dom@^19.0.0, @supabase/ssr@^0.5.2 (+28 more)

### Community 6 - "windows-wifi.ts"
Cohesion: 0.12
Nodes (19): dynamic, GET(), dynamic, GET(), POST(), BATTERY_STATUS_MAP, cachedBattery, execFileAsync (+11 more)

### Community 7 - "names"
Cohesion: 0.10
Nodes (19): names, 0, 1, 10, 11, 12, 2, 3 (+11 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 10 - "CartHistoryModal.tsx"
Cohesion: 0.31
Nodes (12): GET(), POST(), CartHistoryModal(), CartHistoryModalProps, CartAccountSession, getCartHistoryForCustomer(), generateReceiptPdf(), getUserInfo() (+4 more)

### Community 16 - "README.md"
Cohesion: 0.05
Nodes (39): 1. Install Frontend Dependencies, 2. Run Next.js Development Server, 3. Run Automated Tests, 4. Build Production Bundle, 5. Start Vision Microservice (Optional — for custom YOLO models), 🧠 AI Model Training Pipeline, Bill of Materials (BOM), Calibration (+31 more)

### Community 17 - "schema.sql"
Cohesion: 0.10
Nodes (32): idx_orders_customer_email, public.create_order_with_items(), idx_cart_history_cart_code, idx_cart_history_email, idx_cart_items_cart, idx_carts_session, idx_carts_user, idx_customers_auth_user (+24 more)

### Community 18 - "data.yaml"
Cohesion: 0.17
Nodes (11): names, nc, roboflow, license, project, url, version, workspace (+3 more)

### Community 19 - "SmartCart AI — Custom Grocery Dataset Training Guide"
Cohesion: 0.22
Nodes (8): 1. Directory Structure, 2. Image Collection Guidelines, 3. Annotation and Label Format, 4. Configuring Classes in `dataset.yaml`, 5. Running Model Training, 6. Validating Precision, Recall & mAP, 7. Model Deployment in SmartCart AI, SmartCart AI — Custom Grocery Dataset Training Guide

### Community 20 - "ESP32 HX711 Firmware & Hardware Setup (Stage 1)"
Cohesion: 0.25
Nodes (7): 1. Hardware Bill of Materials (BOM), 2. Wiring Connections, 3. Flashing the ESP32, 4. Running the Serial Bridge, Calibration:, ESP32 HX711 Firmware & Hardware Setup (Stage 1), Simulated Mode (No physical hardware connected):

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `GlassIcon`, `AutonomousDashboardView.tsx`, `package.json`, `windows-wifi.ts`, `CartHistoryModal.tsx`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Should `collect_google_images.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05403508771929825 - nodes in this community are weakly interconnected._
- **Why does `iotSimulator` connect `IoTSimulator` to `GlassIcon`, `AutonomousDashboardView.tsx`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `GlassIcon` be split into smaller, more focused modules?**
  _Cohesion score 0.11219512195121951 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `GlassIcon` to `CartHistoryModal.tsx`, `AutonomousDashboardView.tsx`, `package.json`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.08194905869324474 - nodes in this community are weakly interconnected._
- **Should `AutonomousDashboardView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07314814814814814 - nodes in this community are weakly interconnected._