"""
SmartCart AI - Grocery Dataset Preparation & Synthesizer
Generates an initial calibrated, multi-class labeled dataset for all 12 grocery products:
  0: apple
  1: banana
  2: orange
  3: broccoli
  4: carrot
  5: water_bottle
  6: dahi_cup
  7: bread
  8: donut
  9: fruit_cake
  10: chips_packet
  11: biscuit_packet

Applies realistic geometric transformations, aspect ratios, packaging colors, brands,
textures, lighting variations, and generates exact YOLO annotations (.txt).
"""

import os
import random
import math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import yaml

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATASET_DIR = PROJECT_ROOT / "training" / "dataset"
IMAGES_TRAIN = DATASET_DIR / "images" / "train"
IMAGES_VAL = DATASET_DIR / "images" / "val"
LABELS_TRAIN = DATASET_DIR / "labels" / "train"
LABELS_VAL = DATASET_DIR / "labels" / "val"

for p in [IMAGES_TRAIN, IMAGES_VAL, LABELS_TRAIN, LABELS_VAL]:
    p.mkdir(parents=True, exist_ok=True)

YAML_PATH = PROJECT_ROOT / "training" / "dataset.yaml"
with open(YAML_PATH, "r") as f:
    cfg = yaml.safe_load(f)
CLASSES = {int(k): str(v) for k, v in cfg.get("names", {}).items()}

# Visual styling definitions for grocery categories
CLASS_SPECS = {
    0: {"name": "apple", "color": (195, 30, 30), "secondary": (220, 60, 40), "shape": "circle", "aspect": 1.0, "size": (150, 150)},
    1: {"name": "banana", "color": (240, 200, 30), "secondary": (210, 170, 20), "shape": "banana", "aspect": 0.45, "size": (90, 200)},
    2: {"name": "orange", "color": (245, 130, 20), "secondary": (255, 160, 40), "shape": "circle", "aspect": 1.0, "size": (160, 160)},
    3: {"name": "broccoli", "color": (34, 139, 34), "secondary": (46, 170, 50), "shape": "tree", "aspect": 0.85, "size": (170, 200)},
    4: {"name": "carrot", "color": (235, 100, 15), "secondary": (255, 130, 30), "shape": "triangle", "aspect": 0.35, "size": (80, 220)},
    5: {"name": "water_bottle", "color": (40, 120, 210), "secondary": (210, 235, 255), "shape": "bottle", "aspect": 0.38, "size": (95, 250), "text": "Bisleri 1L"},
    6: {"name": "dahi_cup", "color": (230, 235, 245), "secondary": (20, 80, 180), "shape": "cup", "aspect": 1.0, "size": (160, 160), "text": "Amul Dahi"},
    7: {"name": "bread", "color": (190, 135, 75), "secondary": (240, 180, 120), "shape": "loaf", "aspect": 0.65, "size": (150, 230), "text": "Britannia"},
    8: {"name": "donut", "color": (175, 115, 60), "secondary": (235, 90, 140), "shape": "donut", "aspect": 1.0, "size": (150, 150)},
    9: {"name": "fruit_cake", "color": (150, 85, 45), "secondary": (220, 140, 70), "shape": "rect", "aspect": 0.70, "size": (140, 200), "text": "Fruit Cake"},
    10: {"name": "chips_packet", "color": (225, 180, 10), "secondary": (190, 20, 20), "shape": "packet", "aspect": 0.70, "size": (160, 230), "text": "Lay's"},
    11: {"name": "biscuit_packet", "color": (220, 160, 40), "secondary": (160, 25, 25), "shape": "packet", "aspect": 1.45, "size": (230, 150), "text": "Parle-G"},
    12: {"name": "mushroom", "color": (245, 240, 230), "secondary": (210, 195, 175), "shape": "mushroom", "aspect": 1.0, "size": (160, 160), "text": "Button Mushroom"},
}

def draw_grocery_item(draw: ImageDraw.ImageDraw, class_id: int, bbox):
    """Draws a stylized grocery item with realistic textures, labels, and features."""
    x1, y1, x2, y2 = bbox
    spec = CLASS_SPECS.get(class_id, CLASS_SPECS[0])
    color = spec["color"]
    sec = spec["secondary"]
    shape = spec["shape"]

    if shape == "circle":
        draw.ellipse([x1, y1, x2, y2], fill=color, outline=sec, width=3)
        # Highlight reflection
        draw.ellipse([x1 + 15, y1 + 15, x1 + (x2 - x1) * 0.4, y1 + (y2 - y1) * 0.35], fill=(255, 255, 255, 120))
        # Stem if apple
        if class_id == 0:
            draw.line([(x1 + x2) // 2, y1, (x1 + x2) // 2 - 8, y1 - 18], fill=(90, 50, 20), width=4)
            draw.ellipse([(x1 + x2) // 2 - 18, y1 - 22, (x1 + x2) // 2 - 4, y1 - 10], fill=(50, 160, 40))

    elif shape == "banana":
        # Curved banana shape
        cx = (x1 + x2) // 2
        draw.polygon([(x1, y1 + 30), (cx + 25, y1), (x2, y1 + 50), (cx + 10, y2), (x1 + 10, y2 - 40)], fill=color)
        draw.line([(cx + 25, y1), (cx + 30, y1 - 15)], fill=(60, 80, 20), width=6)
        draw.line([(x1 + 10, y2 - 40), (x1 + 5, y2)], fill=(60, 40, 10), width=5)

    elif shape == "tree":
        # Broccoli head + stem
        mid_y = y1 + int((y2 - y1) * 0.55)
        # Thick stalk
        draw.rectangle([x1 + int((x2 - x1) * 0.35), mid_y - 10, x1 + int((x2 - x1) * 0.65), y2], fill=(120, 190, 100))
        # Fluffy florets
        draw.ellipse([x1, y1, x2, mid_y + 10], fill=color)
        for _ in range(8):
            fx = random.randint(x1 + 10, x2 - 25)
            fy = random.randint(y1 + 10, mid_y)
            draw.ellipse([fx, fy, fx + 25, fy + 25], fill=sec)

    elif shape == "triangle":
        # Carrot
        draw.polygon([(x1, y1 + 20), (x2, y1 + 20), ((x1 + x2) // 2, y2)], fill=color)
        # Green leafy top
        top_x = (x1 + x2) // 2
        draw.polygon([(top_x - 12, y1 + 20), (top_x - 22, y1 - 10), (top_x - 5, y1 + 10)], fill=(34, 139, 34))
        draw.polygon([(top_x - 4, y1 + 20), (top_x, y1 - 16), (top_x + 6, y1 + 10)], fill=(46, 170, 50))
        draw.polygon([(top_x + 2, y1 + 20), (top_x + 18, y1 - 8), (top_x + 10, y1 + 15)], fill=(34, 139, 34))

    elif shape == "bottle":
        # Water bottle with cap and label
        cap_h = int((y2 - y1) * 0.12)
        neck_h = int((y2 - y1) * 0.15)
        # Cap
        cx = (x1 + x2) // 2
        draw.rectangle([cx - 14, y1, cx + 14, y1 + cap_h], fill=(10, 80, 200))
        # Bottle body
        draw.rounded_rectangle([x1, y1 + neck_h, x2, y2], radius=16, fill=sec, outline=(30, 100, 190), width=3)
        # Bisleri Green label band
        label_y1 = y1 + int((y2 - y1) * 0.40)
        label_y2 = y1 + int((y2 - y1) * 0.68)
        draw.rectangle([x1 + 3, label_y1, x2 - 3, label_y2], fill=(0, 150, 110))
        draw.text((x1 + 14, label_y1 + 12), "Bisleri", fill=(255, 255, 255))

    elif shape == "cup":
        # Dahi cup (trapezoid)
        draw.polygon([(x1 + 15, y1 + 15), (x2 - 15, y1 + 15), (x2 - 30, y2), (x1 + 30, y2)], fill=color, outline=sec)
        # Foil seal lid
        draw.ellipse([x1 + 5, y1, x2 - 5, y1 + 30], fill=(220, 20, 60), outline=(180, 10, 40))
        draw.text((x1 + 30, y1 + 55), "Amul Dahi", fill=(10, 40, 140))

    elif shape == "loaf":
        # Bread loaf
        draw.rounded_rectangle([x1, y1, x2, y2], radius=18, fill=color, outline=(130, 80, 30), width=3)
        # Polka-dot bread bag wrapper
        wrap_y = y1 + int((y2 - y1) * 0.35)
        draw.rectangle([x1 + 3, wrap_y, x2 - 3, y2 - 3], fill=(245, 230, 180))
        draw.text((x1 + 20, wrap_y + 15), "Britannia", fill=(180, 20, 20))
        draw.text((x1 + 24, wrap_y + 40), "White Bread", fill=(50, 50, 50))

    elif shape == "donut":
        # Donut with hole and sprinkles
        draw.ellipse([x1, y1, x2, y2], fill=color, outline=(130, 80, 30), width=3)
        # Pink strawberry glaze
        draw.ellipse([x1 + 12, y1 + 12, x2 - 12, y2 - 12], fill=sec)
        # Hole
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
        hr = int((x2 - x1) * 0.22)
        draw.ellipse([cx - hr, cy - hr, cx + hr, cy + hr], fill=(235, 240, 248))
        # Sprinkles
        for _ in range(12):
            sx = random.randint(x1 + 25, x2 - 25)
            sy = random.randint(y1 + 25, y2 - 25)
            draw.line([(sx, sy), (sx + 8, sy + 4)], fill=random.choice([(255, 255, 255), (0, 180, 255), (255, 220, 0)]), width=2)

    elif shape == "packet":
        # Packaged snack (chips or biscuits)
        draw.rounded_rectangle([x1, y1, x2, y2], radius=10, fill=color, outline=sec, width=3)
        # Top and bottom crimp seals
        draw.line([x1, y1 + 8, x2, y1 + 8], fill=sec, width=3)
        draw.line([x1, y2 - 8, x2, y2 - 8], fill=sec, width=3)

        brand_text = spec.get("text", "Snack")
        # Center brand badge
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
        draw.ellipse([cx - 48, cy - 26, cx + 48, cy + 26], fill=sec)
        draw.text((cx - 30, cy - 10), brand_text, fill=(255, 255, 255))

    elif shape == "mushroom":
        # Realistic White Button Mushroom (Kaalan)
        # 1. Thick off-white stalk/stem
        stem_w = int((x2 - x1) * 0.36)
        stem_h = int((y2 - y1) * 0.45)
        cx = (x1 + x2) // 2
        draw.rounded_rectangle([cx - stem_w // 2, y2 - stem_h, cx + stem_w // 2, y2], radius=10, fill=(235, 230, 220), outline=sec, width=2)
        # 2. Smooth umbrella cap
        cap_h = int((y2 - y1) * 0.65)
        draw.ellipse([x1, y1, x2, y1 + cap_h], fill=color, outline=sec, width=3)
        # 3. Soft rounded cap underside & gill shading
        draw.ellipse([x1 + 4, y1 + cap_h - 16, x2 - 4, y1 + cap_h + 4], fill=(225, 215, 200))
        # 4. Subtle top specular highlight
        draw.ellipse([cx - 24, y1 + 10, cx + 24, y1 + 26], fill=(255, 255, 255, 180))

    else:
        # Default rect
        draw.rounded_rectangle([x1, y1, x2, y2], radius=12, fill=color, outline=sec, width=3)
        if spec.get("text"):
            draw.text((x1 + 20, (y1 + y2) // 2 - 10), spec["text"], fill=(255, 255, 255))

def generate_dataset(samples_per_class: int = 15, img_w: int = 640, img_h: int = 640):
    print("=" * 70)
    print("  SmartCart AI — Synthesizing Custom Grocery YOLO Dataset")
    print("=" * 70)
    print(f"[*] Classes: {len(CLASSES)}")
    print(f"[*] Samples per class: {samples_per_class} (Total: {samples_per_class * len(CLASSES)})")

    random.seed(42)
    np.random.seed(42)

    total_generated = 0
    bg_colors = [
        (240, 242, 245),  # Clean light desk
        (230, 235, 240),  # Checkout scanner counter
        (220, 225, 230),  # Steel checkout tray
        (248, 249, 250),  # White countertop
        (215, 220, 228),  # Office desk
        (35, 38, 45),     # Dark ambient desk
    ]

    for class_id, class_name in sorted(CLASSES.items()):
        spec = CLASS_SPECS.get(class_id, CLASS_SPECS[0])
        base_w, base_h = spec["size"]

        for sample_idx in range(samples_per_class):
            # Create background canvas
            bg_col = random.choice(bg_colors)
            img = Image.new("RGB", (img_w, img_h), color=bg_col)
            draw = ImageDraw.Draw(img)

            # Randomize scale (0.8x to 1.35x) and position
            scale = random.uniform(0.85, 1.30)
            item_w = int(base_w * scale)
            item_h = int(base_h * scale)

            # Randomize center with margins
            margin = 30
            max_x = img_w - item_w - margin
            max_y = img_h - item_h - margin
            if max_x <= margin:
                x1 = (img_w - item_w) // 2
            else:
                x1 = random.randint(margin, max_x)
            if max_y <= margin:
                y1 = (img_h - item_h) // 2
            else:
                y1 = random.randint(margin, max_y)

            x2 = x1 + item_w
            y2 = y1 + item_h

            # Draw simulated shelf / table shadow
            shadow_bbox = [x1 + 10, y2 - 12, x2 + 10, y2 + 15]
            draw.ellipse(shadow_bbox, fill=(0, 0, 0, 40) if len(bg_col) > 3 else (180, 185, 190))

            # Draw grocery product
            draw_grocery_item(draw, class_id, (x1, y1, x2, y2))

            # Apply slight lighting / blur augmentation
            if random.random() > 0.4:
                enhancer = ImageEnhance.Brightness(img)
                img = enhancer.enhance(random.uniform(0.90, 1.12))

            # Split: 80% train / 20% val
            is_val = (sample_idx % 5 == 0)
            target_img_dir = IMAGES_VAL if is_val else IMAGES_TRAIN
            target_lbl_dir = LABELS_VAL if is_val else LABELS_TRAIN

            filename_stem = f"{class_name}_{sample_idx+1:03d}"
            img_path = target_img_dir / f"{filename_stem}.jpg"
            lbl_path = target_lbl_dir / f"{filename_stem}.txt"

            img.save(str(img_path), "JPEG", quality=92)

            # Normalized YOLO coordinates: class_id x_center y_center width height
            norm_xc = (x1 + x2) / (2.0 * img_w)
            norm_yc = (y1 + y2) / (2.0 * img_h)
            norm_w = (x2 - x1) / float(img_w)
            norm_h = (y2 - y1) / float(img_h)

            with open(lbl_path, "w") as lf:
                lf.write(f"{class_id} {norm_xc:.6f} {norm_yc:.6f} {norm_w:.6f} {norm_h:.6f}\n")

            total_generated += 1

    train_imgs = list(IMAGES_TRAIN.glob("*.jpg"))
    val_imgs = list(IMAGES_VAL.glob("*.jpg"))

    print("\n[+] Dataset Synthesis Complete!")
    print(f"    Total Images Generated: {total_generated}")
    print(f"    Train Images:           {len(train_imgs)}")
    print(f"    Validation Images:      {len(val_imgs)}")
    print("=" * 70)

if __name__ == "__main__":
    generate_dataset(samples_per_class=15)
