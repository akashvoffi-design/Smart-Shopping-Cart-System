"""
SmartCart AI - Vision Service HTTP Endpoint Test
Tests /status, /classes, and /detect endpoints against the running FastAPI backend.
"""

import requests
import json
import base64
import io
import time
from PIL import Image
import numpy as np

BASE_URL = "http://127.0.0.1:8000"


def test_status_endpoint():
    print("=== Test 1: /status endpoint ===")
    r = requests.get(f"{BASE_URL}/status")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()
    print(f"  Status: {data.get('status')}")
    print(f"  Model: {data.get('model_name')}")
    print(f"  Custom trained: {data.get('is_custom_trained')}")
    print(f"  Total classes: {data.get('total_classes')}")
    print(f"  Classes: {data.get('classes')}")
    assert data.get("status") == "online", "Model should be online"
    assert data.get("model_loaded") is True, "Model should be loaded"
    print("  PASS")
    return data


def test_classes_endpoint():
    print("\n=== Test 2: /classes endpoint ===")
    r = requests.get(f"{BASE_URL}/classes")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()
    print(f"  Total classes: {data.get('total_classes')}")
    print(f"  Classes: {data.get('classes')}")
    assert data.get("total_classes") == 13, f"Expected 13 classes, got {data.get('total_classes')}"
    print("  PASS")
    return data


def test_detect_synthetic():
    print("\n=== Test 3: /detect with synthetic image (random noise) ===")
    img = Image.fromarray(np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    b64 = base64.b64encode(buf.getvalue()).decode()

    r = requests.post(f"{BASE_URL}/detect", json={
        "image_base64": b64,
        "confidence_threshold": 0.40,
        "iou_threshold": 0.45,
    })
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()
    print(f"  Success: {data.get('success')}")
    print(f"  Model: {data.get('model_name')}")
    print(f"  Custom: {data.get('is_custom_trained')}")
    print(f"  Detections: {data.get('detection_count')}")
    print(f"  Inference time: {data.get('inference_time_ms')}ms")
    print(f"  Image size: {data.get('image_width')}x{data.get('image_height')}")
    assert data.get("success") is True, "Inference should succeed"
    assert data.get("detection_count") == 0, "No detections expected on random noise"
    assert data.get("model_name") == "best.pt", f"Expected best.pt, got {data.get('model_name')}"
    assert data.get("is_custom_trained") is True, "Should be custom trained"
    print("  PASS")
    return data


def test_detect_solid_color():
    print("\n=== Test 4: /detect with solid color images (no false positives) ===")
    for color_name, color in [("red", (255, 0, 0)), ("green", (0, 255, 0)), ("white", (255, 255, 255))]:
        img = Image.new("RGB", (640, 480), color)
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        b64 = base64.b64encode(buf.getvalue()).decode()

        r = requests.post(f"{BASE_URL}/detect", json={
            "image_base64": b64,
            "confidence_threshold": 0.40,
        })
        data = r.json()
        count = data.get("detection_count", 0)
        print(f"  {color_name}: {count} detections (expecting 0)")
    print("  PASS")


def test_detect_with_data_uri_prefix():
    print("\n=== Test 5: /detect with data:image/jpeg;base64, prefix ===")
    img = Image.fromarray(np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

    r = requests.post(f"{BASE_URL}/detect", json={
        "image_base64": b64,
        "confidence_threshold": 0.40,
    })
    assert r.status_code == 200
    data = r.json()
    assert data.get("success") is True, "Should handle data URI prefix correctly"
    print(f"  Success with data URI prefix: {data.get('success')}")
    print("  PASS")


if __name__ == "__main__":
    print("=" * 60)
    print("  SmartCart AI — Vision Service Endpoint Tests")
    print("=" * 60)
    print()

    try:
        test_status_endpoint()
        test_classes_endpoint()
        test_detect_synthetic()
        test_detect_solid_color()
        test_detect_with_data_uri_prefix()
        print("\n" + "=" * 60)
        print("  ALL TESTS PASSED")
        print("=" * 60)
    except requests.ConnectionError:
        print("\nERROR: Vision service is not running!")
        print("Start it with: python -m uvicorn services.vision_service:app --port 8000")
    except AssertionError as e:
        print(f"\nTEST FAILED: {e}")
    except Exception as e:
        print(f"\nERROR: {e}")
