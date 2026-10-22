"""
SmartCart AI - Real-Time Webcam Grocery Dataset Collector
Collects labeled training and validation images using your laptop webcam.
Automatically generates YOLO-format annotations (.txt) with bounding boxes.

Usage:
    python training/collect_webcam_dataset.py --camera 0
    python training/collect_webcam_dataset.py --class-id 10  # Start with chips_packet
"""

import os
import sys
import time
import argparse
from pathlib import Path
import cv2
import yaml

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATASET_DIR = PROJECT_ROOT / "training" / "dataset"
IMAGES_TRAIN = DATASET_DIR / "images" / "train"
IMAGES_VAL = DATASET_DIR / "images" / "val"
LABELS_TRAIN = DATASET_DIR / "labels" / "train"
LABELS_VAL = DATASET_DIR / "labels" / "val"

# Ensure directory structure exists
for p in [IMAGES_TRAIN, IMAGES_VAL, LABELS_TRAIN, LABELS_VAL]:
    p.mkdir(parents=True, exist_ok=True)

# Load classes from dataset.yaml
YAML_PATH = PROJECT_ROOT / "training" / "dataset.yaml"
with open(YAML_PATH, "r") as f:
    data_cfg = yaml.safe_load(f)
CLASSES = data_cfg.get("names", {})
# Ensure integer keys
CLASSES = {int(k): str(v) for k, v in CLASSES.items()}

def run_collector(camera_idx: int = 0, initial_class_id: int = 0):
    print("=" * 70)
    print("  SmartCart AI — Laptop Webcam Grocery Dataset Collector")
    print("=" * 70)
    print(f"[*] Available Classes ({len(CLASSES)}):")
    for cid, cname in sorted(CLASSES.items()):
        print(f"    [{cid:2d}] {cname}")
    print("\n[*] Controls:")
    print("    [SPACE]       : Capture 1 image + auto-annotation")
    print("    [C]           : Toggle continuous burst mode (captures every 350ms)")
    print("    [N]           : Next grocery class")
    print("    [P]           : Previous grocery class")
    print("    [0-9]         : Select class ID directly")
    print("    [+ / -]       : Increase / decrease guide box size")
    print("    [Q / ESC]     : Save and Quit")
    print("=" * 70)

    cap = cv2.VideoCapture(camera_idx, cv2.CAP_DSHOW if sys.platform == "win32" else cv2.CAP_ANY)
    if not cap.isOpened():
        cap = cv2.VideoCapture(camera_idx)
    if not cap.isOpened():
        print(f"[!] Error: Unable to open webcam at index {camera_idx}.")
        return

    # Attempt HD resolution
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    current_class_id = initial_class_id if initial_class_id in CLASSES else 0
    box_scale = 0.50  # Box width relative to frame
    continuous_mode = False
    last_burst_time = 0
    captured_count = 0

    val_split_modulo = 5  # Every 5th capture goes to validation (80% train / 20% val)

    window_name = "SmartCart AI - Webcam Dataset Collector (Press SPACE to capture, Q to quit)"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, 1024, 600)

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[!] Failed to grab webcam frame.")
            break

        h, w, _ = frame.shape
        display = frame.copy()

        # Compute guide bounding box in center of frame
        bw = int(w * box_scale)
        bh = int(h * box_scale)
        x1 = (w - bw) // 2
        y1 = (h - bh) // 2
        x2 = x1 + bw
        y2 = y1 + bh

        # Normalized coordinates for YOLO format [x_center, y_center, width, height]
        norm_xc = (x1 + x2) / (2.0 * w)
        norm_yc = (y1 + y2) / (2.0 * h)
        norm_w = bw / float(w)
        norm_h = bh / float(h)

        # Draw futuristic guide HUD
        current_name = CLASSES.get(current_class_id, "unknown")
        hud_color = (0, 255, 128) if continuous_mode else (255, 200, 0)
        cv2.rectangle(display, (x1, y1), (x2, y2), hud_color, 2)

        # Corner brackets
        corner_len = min(30, bw // 4, bh // 4)
        # Top-left
        cv2.line(display, (x1, y1), (x1 + corner_len, y1), (0, 255, 255), 4)
        cv2.line(display, (x1, y1), (x1, y1 + corner_len), (0, 255, 255), 4)
        # Top-right
        cv2.line(display, (x2, y1), (x2 - corner_len, y1), (0, 255, 255), 4)
        cv2.line(display, (x2, y1), (x2, y1 + corner_len), (0, 255, 255), 4)
        # Bottom-left
        cv2.line(display, (x1, y2), (x1 + corner_len, y2), (0, 255, 255), 4)
        cv2.line(display, (x1, y2), (x1, y2 - corner_len), (0, 255, 255), 4)
        # Bottom-right
        cv2.line(display, (x2, y2), (x2 - corner_len, y2), (0, 255, 255), 4)
        cv2.line(display, (x2, y2), (x2, y2 - corner_len), (0, 255, 255), 4)

        # Top banner
        overlay = display.copy()
        cv2.rectangle(overlay, (0, 0), (w, 54), (20, 20, 20), -1)
        cv2.addWeighted(overlay, 0.75, display, 0.25, 0, display)

        title_text = f"TARGET: [{current_class_id}] {current_name.upper()} | Captures: {captured_count}"
        if continuous_mode:
            title_text += " | [BURST MODE ACTIVE]"
        cv2.putText(display, title_text, (18, 36), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2, cv2.LINE_AA)

        # Bottom help banner
        cv2.putText(
            display,
            "SPACE: Capture | C: Burst | N/P: Next/Prev Class | +/-: Box Size | Q: Quit",
            (18, h - 18),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (200, 200, 200),
            1,
            cv2.LINE_AA,
        )

        cv2.imshow(window_name, display)

        now = time.time()
        do_capture = False

        if continuous_mode and (now - last_burst_time >= 0.35):
            do_capture = True
            last_burst_time = now

        key = cv2.waitKey(20) & 0xFF
        if key in [ord("q"), 27]:  # Q or ESC
            break
        elif key == 32:  # SPACE
            do_capture = True
        elif key in [ord("c"), ord("C")]:
            continuous_mode = not continuous_mode
            last_burst_time = now
            print(f"[*] Burst Mode: {'ON' if continuous_mode else 'OFF'}")
        elif key in [ord("n"), ord("N")]:
            current_class_id = (current_class_id + 1) % len(CLASSES)
            print(f"[*] Selected class: [{current_class_id}] {CLASSES[current_class_id]}")
        elif key in [ord("p"), ord("P")]:
            current_class_id = (current_class_id - 1 + len(CLASSES)) % len(CLASSES)
            print(f"[*] Selected class: [{current_class_id}] {CLASSES[current_class_id]}")
        elif ord("0") <= key <= ord("9"):
            cid = key - ord("0")
            if cid in CLASSES:
                current_class_id = cid
                print(f"[*] Selected class: [{current_class_id}] {CLASSES[current_class_id]}")
        elif key in [ord("+"), ord("=")]:
            box_scale = min(0.85, box_scale + 0.05)
        elif key in [ord("-"), ord("_")]:
            box_scale = max(0.20, box_scale - 0.05)

        if do_capture:
            # Save raw clean frame (without HUD overlays)
            captured_count += 1
            is_val = (captured_count % val_split_modulo == 0)
            target_img_dir = IMAGES_VAL if is_val else IMAGES_TRAIN
            target_lbl_dir = LABELS_VAL if is_val else LABELS_TRAIN

            timestamp = int(time.time() * 1000)
            img_filename = f"{current_name}_{timestamp}.jpg"
            lbl_filename = f"{current_name}_{timestamp}.txt"

            img_path = target_img_dir / img_filename
            lbl_path = target_lbl_dir / lbl_filename

            cv2.imwrite(str(img_path), frame)

            # Write standard YOLO annotation line: class_id x_center y_center width height
            annotation_line = f"{current_class_id} {norm_xc:.6f} {norm_yc:.6f} {norm_w:.6f} {norm_h:.6f}\n"
            with open(lbl_path, "w") as lf:
                lf.write(annotation_line)

            split_name = "VAL" if is_val else "TRAIN"
            print(f"[+] Saved #{captured_count} ({split_name}): {img_path.name} -> Class [{current_class_id}] {current_name}")

            # Flash feedback
            flash = display.copy()
            cv2.rectangle(flash, (0, 0), (w, h), (0, 255, 0), 12)
            cv2.imshow(window_name, flash)
            cv2.waitKey(40)

    cap.release()
    cv2.destroyAllWindows()
    print("\n" + "=" * 70)
    print(f"[*] Data collection session ended.")
    print(f"[*] Total captured images: {captured_count}")
    print(f"[*] Train images: {len(list(IMAGES_TRAIN.glob('*.jpg')))}")
    print(f"[*] Val images:   {len(list(IMAGES_VAL.glob('*.jpg')))}")
    print("=" * 70)
    print("To train your model with this dataset, run:")
    print("    python training/train.py --epochs 30")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SmartCart AI Webcam Grocery Dataset Collector")
    parser.add_argument("--camera", type=int, default=0, help="Camera index (default: 0)")
    parser.add_argument("--class-id", type=int, default=0, help="Initial class ID (default: 0)")
    args = parser.parse_args()

    run_collector(camera_idx=args.camera, initial_class_id=args.class_id)
