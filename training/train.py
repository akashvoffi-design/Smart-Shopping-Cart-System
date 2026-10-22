"""
SmartCart AI - YOLO26s Model Training Script
Trains a custom grocery detection model fine-tuned from Ultralytics YOLO26s.
Saves the best validation checkpoint and exports it directly to models/best.pt.
"""

import os
import shutil
import argparse
from pathlib import Path
import torch
from ultralytics import YOLO

def train_grocery_model(
    data_yaml: str = "training/dataset.yaml",
    base_weights: str = "models/yolo26s.pt",
    epochs: int = 50,
    batch_size: int = 16,
    img_size: int = 640,
    project_dir: str = "training/runs",
    name: str = "smartcart_yolo26s",
):
    print("=" * 70)
    print("  SmartCart AI — Custom Grocery YOLO26s Model Training")
    print("=" * 70)

    # Check CUDA device availability
    device = "0" if torch.cuda.is_available() else "cpu"
    print(f"[*] Training device: {device} ({'GPU Acceleration' if device != 'cpu' else 'CPU Mode'})")

    project_root = Path(__file__).resolve().parent.parent
    yaml_path = project_root / data_yaml
    if not yaml_path.exists():
        raise FileNotFoundError(f"Dataset config not found at: {yaml_path}")

    # Verify base weights
    weights_path = project_root / base_weights
    if not weights_path.exists():
        print(f"[!] Local checkpoint {base_weights} not found, falling back to yolo26s.pt")
        weights_path = Path("yolo26s.pt")

    print(f"[*] Base Architecture Checkpoint: {weights_path}")
    print(f"[*] Dataset Configuration: {yaml_path}")
    print(f"[*] Target Epochs: {epochs} | Batch: {batch_size} | ImgSz: {img_size}")

    # Load Ultralytics model
    model = YOLO(str(weights_path))

    # Start training
    results = model.train(
        data=str(yaml_path),
        epochs=epochs,
        batch=batch_size,
        imgsz=img_size,
        device=device,
        project=str(project_root / project_dir),
        name=name,
        save=True,
        exist_ok=True,
        pretrained=True,
        optimizer="auto",
        verbose=True,
    )

    print("\n[+] Training Complete!")

    # Locate and copy best.pt to models/best.pt
    run_dir = project_root / project_dir / name
    best_weights = run_dir / "weights" / "best.pt"
    target_models_dir = project_root / "models"
    target_models_dir.mkdir(exist_ok=True)
    destination_weights = target_models_dir / "best.pt"

    if best_weights.exists():
        shutil.copy2(best_weights, destination_weights)
        print(f"[✓] Best validation model saved to: {destination_weights}")
        print(f"[✓] SmartCart AI will now automatically use your custom weights on next camera start!")
    else:
        print(f"[!] Warning: best.pt was not found at expected path: {best_weights}")

    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train custom grocery YOLO26s model for SmartCart AI")
    parser.add_argument("--data", type=str, default="training/dataset.yaml", help="Path to dataset.yaml")
    parser.add_argument("--weights", type=str, default="models/yolo26s.pt", help="Base checkpoint")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--name", type=str, default="smartcart_yolo26s", help="Experiment name")
    args = parser.parse_args()

    train_grocery_model(
        data_yaml=args.data,
        base_weights=args.weights,
        epochs=args.epochs,
        batch_size=args.batch,
        img_size=args.imgsz,
        name=args.name,
    )
