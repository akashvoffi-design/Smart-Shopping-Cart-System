"""
SmartCart AI - Quick Inference Test Script
Runs inference on an image, directory of images, or live webcam.
"""

import argparse
from pathlib import Path
from ultralytics import YOLO

def run_test_inference(
    source: str = "0",
    weights: str = "models/best.pt",
    conf: float = 0.50,
):
    project_root = Path(__file__).resolve().parent.parent
    weights_path = project_root / weights

    if not weights_path.exists():
        print(f"[!] Custom weights {weights_path} not found. Using pretrained models/yolo26s.pt.")
        weights_path = project_root / "models/yolo26s.pt"

    print(f"[*] Running test inference using: {weights_path}")
    print(f"[*] Source: {source} | Confidence threshold: {conf}")

    model = YOLO(str(weights_path))
    results = model.predict(source=source, conf=conf, show=True, save=True)

    for i, r in enumerate(results):
        print(f"\n--- Frame / Image {i+1} ---")
        for box in r.boxes:
            cls_name = model.names[int(box.cls[0].item())]
            score = float(box.conf[0].item())
            print(f"  Detected: {cls_name} ({score * 100:.1f}%)")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test grocery YOLO inference")
    parser.add_argument("--source", type=str, default="0", help="Image path or 0 for webcam")
    parser.add_argument("--weights", type=str, default="models/best.pt", help="Path to weights file")
    parser.add_argument("--conf", type=float, default=0.50, help="Confidence threshold")
    args = parser.parse_args()

    run_test_inference(source=args.source, weights=args.weights, conf=args.conf)
