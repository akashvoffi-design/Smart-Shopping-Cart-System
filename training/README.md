# SmartCart AI — Custom Grocery Dataset Training Guide

This guide explains how to prepare, annotate, train, validate, and deploy custom YOLO models for real-time grocery object recognition in SmartCart AI.

---

## 1. Directory Structure

Place your labeled grocery dataset inside the `training/dataset/` directory following standard YOLO format:

```
training/
├── dataset/
│   ├── images/
│   │   ├── train/     # 70% to 80% of images for training
│   │   ├── val/       # 15% to 20% of images for validation
│   │   └── test/      # (Optional) Unseen test images
│   └── labels/
│       ├── train/     # Corresponding .txt label files for train
│       ├── val/       # Corresponding .txt label files for val
│       └── test/
├── dataset.yaml       # Defines class counts and names
├── train.py           # Training pipeline script
├── val.py             # Validation & mAP evaluation script
└── test_inference.py  # Quick prediction test script
```

---

## 2. Image Collection Guidelines

For high-accuracy real-time recognition under laptop webcam conditions:
1. **Quantity:** Collect 50–150 images per grocery product.
2. **Lighting Conditions:**
   - Bright natural daylight
   - Standard indoor fluorescent grocery store lighting
   - Low-light or back-lit angles to teach the model invariance.
3. **Angles & Orientations:**
   - Front packaging (brand logo, product title)
   - Back packaging (nutrition facts, barcode area)
   - Tilted angles (30°, 45°, 90°)
   - Top-down view when held flat.
4. **Distances:**
   - Close-up (15–20 cm from webcam)
   - Medium distance (30–60 cm)
   - In-hand holding positions with partial finger occlusion.
5. **Backgrounds:**
   - Plain desk / wooden surface
   - White tabletop
   - Real store shelf or cart basket background.

---

## 3. Annotation and Label Format

Use free annotation tools such as:
- **[Roboflow](https://roboflow.com)** (Recommended: free web-based auto-export in YOLO format)
- **[LabelImg](https://github.com/HumanSignal/labelImg)** (`pip install labelImg`)
- **[CVAT](https://www.cvat.ai/)**

Each image `img_001.jpg` must have a corresponding label file `img_001.txt` with normalized bounding box lines:
```
<class_id> <x_center> <y_center> <width> <height>
```
All coordinates are normalized floats between `0.0` and `1.0`.

Example `training/dataset/labels/train/apple_01.txt`:
```
0 0.512 0.485 0.320 0.365
```

---

## 4. Configuring Classes in `dataset.yaml`

Update `training/dataset.yaml` with your custom classes:

```yaml
path: ./training/dataset
train: images/train
val: images/val

nc: 4
names:
  0: shimla_apple
  1: robusta_banana
  2: nagpur_orange
  3: parle_g_biscuit
```

---

## 5. Running Model Training

Start training using our optimized script:

```powershell
python training/train.py --epochs 50 --batch 16 --imgsz 640
```

- Uses Ultralytics `YOLO11n` as the lightweight nano backbone.
- Automatically leverages NVIDIA CUDA GPU if installed, otherwise trains in multi-core CPU mode.
- When training completes, **`train.py` automatically copies the best checkpoint to `models/best.pt`**.

---

## 6. Validating Precision, Recall & mAP

Run the validation script to view precision, recall, and mAP metrics:

```powershell
python training/val.py --weights models/best.pt
```

Sample output:
```
============================================================
  SmartCart AI — Validation Metrics Report
============================================================
  Precision (B):   0.9412
  Recall (B):      0.9180
  mAP @ 0.50:      0.9534
  mAP @ 0.50:0.95: 0.8120
============================================================
```

---

## 7. Model Deployment in SmartCart AI

1. Place your trained checkpoint at:
   `c:\main file\my work\Smart Shopping Cart System\porject-IoT\models\best.pt`
2. Start the vision microservice:
   ```powershell
   python -m uvicorn services.vision_service:app --port 8000
   ```
3. Open `http://localhost:3000`. The vision status pill will immediately switch from `Development fallback (yolo11n.pt)` to **`Custom Weights Active (best.pt)`**!
