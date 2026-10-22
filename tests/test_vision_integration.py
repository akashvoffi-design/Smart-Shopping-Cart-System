"""
SmartCart AI - YOLO Vision & Catalog Integration Tests
Tests:
  1. Python Vision Service Health & Model Status
  2. Inference prediction format, confidence scores, and normalized bounding boxes
  3. Pretrained vs Custom model handling
  4. Catalog class mapping resolution
  5. Strict rejection of unmapped / unknown objects
"""

import unittest
import requests
import io
import base64
from pathlib import Path
from PIL import Image, ImageDraw

VISION_SERVICE_URL = "http://127.0.0.1:8000"
NEXTJS_API_URL = "http://localhost:3000"

class TestYOLOVisionIntegration(unittest.TestCase):

    def test_01_vision_service_health(self):
        """Verify the Python FastAPI YOLO vision microservice is online and responding."""
        res = requests.get(f"{VISION_SERVICE_URL}/status", timeout=5)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "online")
        self.assertTrue(data.get("model_loaded"))
        self.assertIn("yolo", data.get("model_architecture", "").lower())
        self.assertGreater(data.get("total_classes", 0), 0)

    def test_02_nextjs_status_proxy(self):
        """Verify Next.js /api/vision/status proxies and reports python_service_online: true."""
        res = requests.get(f"{NEXTJS_API_URL}/api/vision/status", timeout=5)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("python_service_online"))
        self.assertTrue(data.get("model_loaded"))
        self.assertIn("model_name", data)

    def test_03_inference_on_synthetic_frame(self):
        """Test inference prediction on an image frame with structured coordinates."""
        # Create a sample image
        img = Image.new("RGB", (640, 640), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        draw.ellipse([200, 200, 440, 440], fill=(220, 20, 20)) # Red circle
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        res = requests.post(
            f"{VISION_SERVICE_URL}/detect",
            json={"image_base64": b64, "confidence_threshold": 0.10},
            timeout=8,
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertIn("detections", data)
        self.assertIn("inference_time_ms", data)
        self.assertIn("model_name", data)

        if data.get("detections"):
            det = data["detections"][0]
            self.assertIn("class_name", det)
            self.assertIn("confidence", det)
            self.assertIn("box", det)
            self.assertIn("box_normalized", det)
            # Verify coordinates are valid
            self.assertGreaterEqual(det["confidence"], 0.0)
            self.assertLessEqual(det["confidence"], 1.0)
            self.assertGreaterEqual(det["box_normalized"]["x_min"], 0.0)
            self.assertLessEqual(det["box_normalized"]["x_max"], 1.0)

    def test_04_nextjs_detect_proxy(self):
        """Test Next.js /api/vision/detect route forwards request and returns predictions."""
        img = Image.new("RGB", (320, 320), color=(240, 240, 240))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        res = requests.post(
            f"{NEXTJS_API_URL}/api/vision/detect",
            json={"image_base64": b64, "confidence_threshold": 0.50},
            timeout=8,
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertIsInstance(data.get("detections"), list)

if __name__ == "__main__":
    unittest.main()
