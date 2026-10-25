# Graph Report - porject-IoT  (2026-10-24)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 451 nodes · 966 edges · 16 communities (10 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d83a592e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- collect_google_images.py
- cart-store.ts
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

## God Nodes (most connected - your core abstractions)
1. `next` - 29 edges
2. `GlassIcon()` - 23 edges
3. `IoTSimulator` - 20 edges
4. `lucide-react` - 19 edges
5. `react` - 19 edges
6. `IoTTelemetry` - 16 edges
7. `Product` - 16 edges
8. `getProductByBarcode()` - 16 edges
9. `compilerOptions` - 16 edges
10. `createClient()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `CartListProps` --references--> `CartSummary`  [EXTRACTED]
  src/components/CartList.tsx → src/types/index.ts
- `HardwareSimulatorPanelProps` --references--> `IoTTelemetry`  [EXTRACTED]
  src/components/HardwareSimulatorPanel.tsx → src/types/index.ts
- `ProductCatalogModalProps` --references--> `Product`  [EXTRACTED]
  src/components/ProductCatalogModal.tsx → src/types/index.ts
- `LuxuryTopNavProps` --references--> `IoTTelemetry`  [EXTRACTED]
  src/components/LuxuryTopNav.tsx → src/types/index.ts
- `NavbarProps` --references--> `IoTTelemetry`  [EXTRACTED]
  src/components/Navbar.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (16 total, 6 thin omitted)

### Community 0 - "collect_google_images.py"
Cohesion: 0.05
Nodes (20): clean_category(), clean_price(), parse_quantity_and_weight(), run_pipeline(), post_telemetry(), run_serial(), run_simulation(), collect_images_for_query() (+12 more)

### Community 1 - "cart-store.ts"
Cohesion: 0.09
Nodes (50): lucide-react, react, AuthPage(), CheckoutPage(), GroceryDashboard(), AutonomousDashboardView(), BatteryPopover(), BatteryPopoverProps (+42 more)

### Community 2 - "next"
Cohesion: 0.07
Nodes (31): @supabase/ssr@^0.5.2, next, @supabase/ssr, GET(), mapPaymentStatus(), POST(), POST(), GET() (+23 more)

### Community 3 - "AutonomousDashboardView.tsx"
Cohesion: 0.10
Nodes (35): POST(), GET(), AutonomousDashboardViewProps, CameraScanner(), CameraScannerProps, LuxuryHeroViewProps, NavbarProps, isScanDebounced() (+27 more)

### Community 4 - "vision_service.py"
Cohesion: 0.09
Nodes (13): Base64DetectRequest, BoundingBox, detect_from_file(), detect_from_json(), DetectionItem, DetectionResponse, get_model_classes(), get_service_status() (+5 more)

### Community 5 - "package.json"
Cohesion: 0.08
Nodes (31): dependencies, canvas-confetti@^1.9.4, lucide-react@^1.16.0, next@^15.1.7, pdf-lib@^1.17.1, react@^19.0.0, react-dom@^19.0.0, @supabase/supabase-js@^2.48.1 (+23 more)

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
Cohesion: 0.33
Nodes (11): GET(), POST(), CartHistoryModalProps, CartAccountSession, getCartHistoryForCustomer(), generateReceiptPdf(), getUserInfo(), openPrintDialog() (+3 more)

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `cart-store.ts`, `AutonomousDashboardView.tsx`, `package.json`, `windows-wifi.ts`, `CartHistoryModal.tsx`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Should `collect_google_images.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05403508771929825 - nodes in this community are weakly interconnected._
- **Why does `IoTSimulator` connect `IoTSimulator` to `cart-store.ts`, `AutonomousDashboardView.tsx`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `cart-store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08811188811188811 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `cart-store.ts` to `CartHistoryModal.tsx`, `AutonomousDashboardView.tsx`, `package.json`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.0660377358490566 - nodes in this community are weakly interconnected._
- **Should `AutonomousDashboardView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0963265306122449 - nodes in this community are weakly interconnected._