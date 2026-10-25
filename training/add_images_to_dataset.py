import os
import shutil
import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO

base_dir = os.path.dirname(os.path.abspath(__file__))
dataset_dir = os.path.join(base_dir, "SmartCart-AI.v1i.yolov11")
train_img_dir = os.path.join(dataset_dir, "train", "images")
train_lbl_dir = os.path.join(dataset_dir, "train", "labels")
valid_img_dir = os.path.join(dataset_dir, "valid", "images")
valid_lbl_dir = os.path.join(dataset_dir, "valid", "labels")
source_img_dir = os.path.join(base_dir, "image data images")

model = YOLO(os.path.join(base_dir, "models", "best.pt"))

manual_classes = {
    'Amul-masti1.jpeg': 1,
    'Amul-masti2.jpeg': 1,
    'Amul-masti3.jpeg': 1,
    'Bisleri-water1.jpeg': 4,
    'Bisleri-water2.png': 4,
    'Bisleri-water3.jpeg': 4,
    'Britannaia chaeese spreadz1.jpeg': 5,
    'Britannaia chaeese spreadz2.jpeg': 5,
    'Britannaia cheese garlic.jpeg': 6,
    'Britannaia cheese garlic2.jpeg': 6,
    'Britannaia fruit cake1.jpeg': 7,
    'Britannaia fruit cake2.jpeg': 7,
    'Britannaia fruitBread1.jpeg': 8,
    'Britannaia fruitBread2.jpeg': 8,
    'cocaco1.jpeg': 18,
    'cocaco2.jpeg': 18,
    'doughunut1.jpeg': 19,
    'doughunut2.jpeg': 19,
    'kurkure.jpeg': 21,
    'kurkure2.jpeg': 21,
    'maggi1.jpeg': 24,
    'maggi2.jpeg': 24,
}

# Put some in valid to evaluate generalization
valid_candidates = {'Amul-masti3.jpeg', 'Bisleri-water3.jpeg', 'Britannaia fruit cake2.jpeg', 'cocaco2.jpeg', 'maggi2.jpeg'}

added_count = 0
for fname, cls_id in sorted(manual_classes.items()):
    src_path = os.path.join(source_img_dir, fname)
    if not os.path.exists(src_path):
        continue

    # Clean destination name
    clean_name = fname.replace(" ", "_")
    if clean_name.lower().endswith(".png"):
        clean_name = clean_name[:-4] + ".jpg"

    is_valid = fname in valid_candidates
    dst_img_dir = valid_img_dir if is_valid else train_img_dir
    dst_lbl_dir = valid_lbl_dir if is_valid else train_lbl_dir

    dst_img_path = os.path.join(dst_img_dir, "userdata_" + clean_name)
    dst_lbl_path = os.path.join(dst_lbl_dir, "userdata_" + os.path.splitext(clean_name)[0] + ".txt")

    # Load and ensure RGB
    pil_im = Image.open(src_path)
    if pil_im.mode != "RGB":
        pil_im = pil_im.convert("RGB")
    pil_im.save(dst_img_path, format="JPEG", quality=95)

    w, h = pil_im.size

    # Get bounding boxes
    labels = []
    if "doughunut" in fname:
        # Multi-donut image: predict all donut boxes
        res = model.predict(dst_img_path, conf=0.12, verbose=False)
        boxes = res[0].boxes
        for b in boxes:
            x1, y1, x2, y2 = b.xyxy[0].tolist()
            xc = round((x1 + x2) / (2.0 * w), 6)
            yc = round((y1 + y2) / (2.0 * h), 6)
            bw = round((x2 - x1) / float(w), 6)
            bh = round((y2 - y1) / float(h), 6)
            labels.append(f"{cls_id} {xc} {yc} {bw} {bh}")
    else:
        # Single product pack shot
        res = model.predict(dst_img_path, conf=0.10, verbose=False)
        boxes = res[0].boxes
        if len(boxes) > 0:
            # Pick largest box or union of boxes
            best_box = max(boxes, key=lambda b: (b.xyxy[0][2] - b.xyxy[0][0]) * (b.xyxy[0][3] - b.xyxy[0][1]))
            x1, y1, x2, y2 = best_box.xyxy[0].tolist()
            xc = round((x1 + x2) / (2.0 * w), 6)
            yc = round((y1 + y2) / (2.0 * h), 6)
            bw = round((x2 - x1) / float(w), 6)
            bh = round((y2 - y1) / float(h), 6)
            labels.append(f"{cls_id} {xc} {yc} {bw} {bh}")
        else:
            # Fallback foreground bounding box
            labels.append(f"{cls_id} 0.5 0.5 0.85 0.85")

    with open(dst_lbl_path, "w", encoding="utf-8") as lf:
        for lbl in labels:
            lf.write(lbl + "\n")

    print(f"Added: {fname} -> {dst_img_path} ({len(labels)} boxes for class {cls_id})")
    added_count += 1

print(f"\nSuccessfully added {added_count} images with labels to the dataset!")
