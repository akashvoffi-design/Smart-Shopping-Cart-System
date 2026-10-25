import os
import time
from ultralytics import YOLO

base_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(base_dir, "models", "best.pt")
data_yaml = os.path.join(base_dir, "SmartCart-AI.v1i.yolov11", "data.yaml")

print(f"[Training] Loading current YOLO11n weights from: {model_path}")
model = YOLO(model_path)

print("[Training] Starting YOLO11n fine-tuning with newly added dataset images...")
t0 = time.time()

results = model.train(
    data=data_yaml,
    epochs=5,
    imgsz=416,
    batch=16,
    device="cpu",
    project=os.path.join(base_dir, "runs", "train"),
    name="yolo11n_finetune",
    freeze=10,        # Freeze backbone to train fast on CPU and avoid catastrophic forgetting
    lr0=0.001,        # Gentle learning rate for fine-tuning
    lrf=0.01,
    patience=5,
    save=True,
    verbose=True,
)

elapsed = time.time() - t0
print(f"[Training] Fine-tuning completed in {elapsed:.1f}s!")

# Check saved weights
save_dir = str(results.save_dir) if hasattr(results, "save_dir") else os.path.join(base_dir, "runs", "train", "yolo11n_finetune")
trained_best = os.path.join(save_dir, "weights", "best.pt")
trained_last = os.path.join(save_dir, "weights", "last.pt")

active_trained = trained_best if os.path.exists(trained_best) else (trained_last if os.path.exists(trained_last) else None)

if active_trained:
    import shutil
    target_models_best = os.path.join(base_dir, "models", "best.pt")
    target_root_best = os.path.join(base_dir, "best.pt")
    shutil.copy2(active_trained, target_models_best)
    shutil.copy2(active_trained, target_root_best)
    print(f"[Training] Updated {target_models_best} and {target_root_best} with fine-tuned weights!")
else:
    print("[Training] Note: Best weights location:", save_dir)
