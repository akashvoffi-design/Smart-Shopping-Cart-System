"""
SmartCart AI - YOLO Validation & Metrics Evaluation Script
Computes Precision, Recall, mAP50, and mAP50-95 on the validation split.
"""

import argparse
from pathlib import Path
from ultralytics import YOLO

def validate_model(
    weights: str = "models/best.pt",
    data_yaml: str = "training/dataset.yaml",
    img_size: int = 640,
    batch_size: int = 16,
):
    project_root = Path(__file__).resolve().parent.parent
    weights_path = project_root / weights
    yaml_path = project_root / data_yaml

    if not weights_path.exists():
        print(f"[!] Custom weights {weights_path} not found. Testing pretrained models/yolo26s.pt instead.")
        weights_path = project_root / "models/yolo26s.pt"

    print(f"[*] Validating Model: {weights_path}")
    print(f"[*] Dataset: {yaml_path}")

    model = YOLO(str(weights_path))
    metrics = model.val(
        data=str(yaml_path),
        imgsz=img_size,
        batch=batch_size,
        save_json=False,
        verbose=True,
    )

    print("\n" + "=" * 60)
    print("  SmartCart AI — Validation Metrics Report")
    print("=" * 60)
    print(f"  Precision (B):   {metrics.box.p.mean():.4f}")
    print(f"  Recall (B):      {metrics.box.r.mean():.4f}")
    print(f"  mAP @ 0.50:      {metrics.box.map50:.4f}")
    print(f"  mAP @ 0.50:0.95: {metrics.box.map:.4f}")
    print("=" * 60)

    return metrics

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate grocery YOLO model")
    parser.add_argument("--weights", type=str, default="models/best.pt", help="Path to weights file")
    parser.add_argument("--data", type=str, default="training/dataset.yaml", help="Path to dataset.yaml")
    args = parser.parse_args()

    validate_model(weights=args.weights, data_yaml=args.data)
