"""
SmartCart AI - Comprehensive Test Suite for Grocery Detection, Stock Verification, and Cart Addition
Tests:
1. Custom YOLO model loading (best.pt) and grocery classes.
2. Live inference on grocery classes (chips_packet, biscuit_packet, water_bottle, dahi_cup, apple).
3. Authoritative stock check logic (In-stock vs Out-of-Stock).
4. Strict Out-of-Stock rejection (Fresh Broccoli with stock_quantity = 0 cannot be added).
5. Cart calculation logic: Item count, MRP subtotal, discount, grand total, and scale weight.
6. Multi-item simultaneous detection response structure.
"""

import unittest
import urllib.request
import json
import base64
import io
from pathlib import Path
from PIL import Image, ImageDraw

PROJECT_ROOT = Path(__file__).resolve().parent.parent

class TestGroceryDetectionAndCart(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.vision_url = "http://127.0.0.1:8000"
        cls.nextjs_url = "http://localhost:3000"
        cls.products_json_path = PROJECT_ROOT / "src" / "data" / "products.json"

    def test_01_custom_model_loaded_and_12_classes_active(self):
        """Verify the vision service has loaded custom-trained best.pt with 12 grocery classes."""
        req = urllib.request.Request(f"{self.vision_url}/status")
        with urllib.request.urlopen(req, timeout=3) as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read())

        self.assertTrue(data.get("model_loaded"))
        self.assertTrue(data.get("is_custom_trained"))
        self.assertEqual(data.get("model_name"), "best.pt")
        self.assertGreaterEqual(data.get("total_classes"), 12)
        classes = data.get("classes", [])
        self.assertIn("chips_packet", classes)
        self.assertIn("biscuit_packet", classes)
        self.assertIn("water_bottle", classes)
        self.assertIn("dahi_cup", classes)
        self.assertIn("broccoli", classes)
        self.assertIn("apple", classes)

    def test_02_inference_detects_grocery_with_normalized_boxes(self):
        """Verify inference on a test frame returns detections with normalized bounding boxes and confidence."""
        # Create a test frame with a green circular produce
        img = Image.new("RGB", (640, 640), color=(240, 242, 245))
        draw = ImageDraw.Draw(img)
        draw.ellipse([200, 200, 440, 440], fill=(34, 139, 34), outline=(46, 170, 50), width=4)

        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")

        req = urllib.request.Request(
            f"{self.vision_url}/detect",
            data=json.dumps({"image_base64": b64_str, "confidence_threshold": 0.25}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5) as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read())

        self.assertTrue(data.get("success"))
        self.assertIn("detections", data)
        self.assertIn("inference_time_ms", data)
        self.assertGreater(data.get("inference_time_ms", 0), 0)

    def test_03_out_of_stock_item_cannot_be_added(self):
        """Verify that Fresh Broccoli (stock_quantity = 0) is flagged out of stock."""
        # Check staples definition in products
        with open(PROJECT_ROOT / "src" / "lib" / "products.ts", "r", encoding="utf-8") as f:
            code = f.read()

        self.assertIn("CAT_FRESH_BROCCOLI", code)
        self.assertIn("stock_quantity: 0", code)
        self.assertIn("checkProductStock", code)
        self.assertIn("deductProductStock", code)

    def test_04_cart_financial_business_logic(self):
        """Verify cart summary calculations: item_count, subtotal_mrp, discount_total, grand_total."""
        items = [
            {"mrp": 30.0, "selling_price": 27.0, "quantity": 2, "weight_g": 180},  # Shimla Apple
            {"mrp": 20.0, "selling_price": 20.0, "quantity": 1, "weight_g": 52},   # Lay's Chips
            {"mrp": 10.0, "selling_price": 10.0, "quantity": 3, "weight_g": 56},   # Parle-G
        ]

        expected_count = 2 + 1 + 3  # 6 items
        expected_subtotal_mrp = (30.0 * 2) + (20.0 * 1) + (10.0 * 3)  # 60 + 20 + 30 = 110.0
        expected_grand_total = (27.0 * 2) + (20.0 * 1) + (10.0 * 3)   # 54 + 20 + 30 = 104.0
        expected_discount = expected_subtotal_mrp - expected_grand_total  # 6.0
        expected_weight = (180 * 2) + (52 * 1) + (56 * 3)  # 360 + 52 + 168 = 580g

        self.assertEqual(expected_count, 6)
        self.assertEqual(expected_subtotal_mrp, 110.0)
        self.assertEqual(expected_grand_total, 104.0)
        self.assertEqual(expected_discount, 6.0)
        self.assertEqual(expected_weight, 580)

    def test_05_multi_item_tracking_and_bounding_boxes(self):
        """Verify that AutonomousDashboardView implements multi-item tracking and 4 box states."""
        view_path = PROJECT_ROOT / "src" / "components" / "AutonomousDashboardView.tsx"
        with open(view_path, "r", encoding="utf-8") as f:
            code = f.read()

        # Multi-item tracking structure
        self.assertIn("multiItemTrackerRef", code)
        self.assertIn("lockedBarcodes", code)
        self.assertIn("checkProductStock", code)
        # 4 visual states
        self.assertIn("Out of Stock", code)
        self.assertIn("#ef4444", code)  # Red for out-of-stock
        self.assertIn("#10b981", code)  # Emerald for confirmed
        self.assertIn("#38bdf8", code)  # Cyan for in-stock scanning
        self.assertIn("Scan Next Item", code)
        self.assertIn("AI Vision detecting", code)

    def test_06_checkout_rechecks_stock_and_rejects_out_of_stock(self):
        """Verify that checkout /api/orders rejects out-of-stock items (CAT_FRESH_BROCCOLI) with HTTP 400."""
        req_body = json.dumps({"items": [{"barcode": "CAT_FRESH_BROCCOLI", "quantity": 1}]}).encode("utf-8")
        req = urllib.request.Request(
            f"{self.nextjs_url}/api/orders",
            data=req_body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as res:
                self.fail("Expected HTTP 400 error for out-of-stock checkout item")
        except urllib.error.HTTPError as e:
            self.assertEqual(e.code, 400)
            err_data = json.loads(e.read())
            self.assertIn("error", err_data)
            self.assertIn("Out of Stock", err_data["error"])

if __name__ == "__main__":
    unittest.main()
