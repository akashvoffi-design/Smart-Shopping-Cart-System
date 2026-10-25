"""
SmartCart AI - Real-Time YOLO Grocery Detection Microservice
FastAPI backend for Ultralytics YOLO11n inference on live video frames.
Supports custom-trained weights (models/best.pt / best.pt) and official pretrained checkpoint (models/yolo11n.pt).
"""

import os
import io
import time
import base64
from typing import List, Optional, Dict, Any
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import numpy as np

# Ultralytics YOLO11
from ultralytics import YOLO

app = FastAPI(
    title="SmartCart AI YOLO11n Vision Microservice",
    description="Real-time grocery object detection service powered by Ultralytics YOLO11n.",
    version="1.1.0",
)

# Enable CORS for Next.js app running at localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model management state
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
CUSTOM_MODEL_PATH = MODELS_DIR / "best.pt"
ROOT_MODEL_PATH = PROJECT_ROOT / "best.pt"
FALLBACK_MODEL_PATH = MODELS_DIR / "yolo11n.pt"

current_model: Optional[YOLO] = None
current_model_path: Optional[Path] = None
is_custom_model: bool = False
model_classes: Dict[int, str] = {}


def load_detection_model(preferred_path: Optional[str] = None):
    """
    Loads YOLO detection model:
    1. Custom path if provided / env YOLO_MODEL_PATH
    2. models/best.pt (Custom trained weights fine-tuned with YOLO11n)
    3. best.pt (in project root)
    4. models/yolo11n.pt (Official Ultralytics YOLO11n pretrained checkpoint)
    """
    global current_model, current_model_path, is_custom_model, model_classes

    target_path: Optional[Path] = None
    custom_flag = False

    # 1. Check override
    env_path = os.getenv("YOLO_MODEL_PATH")
    if preferred_path and Path(preferred_path).exists():
        target_path = Path(preferred_path)
        custom_flag = "best" in target_path.name.lower() or "custom" in target_path.name.lower()
    elif env_path and Path(env_path).exists():
        target_path = Path(env_path)
        custom_flag = True
    elif CUSTOM_MODEL_PATH.exists():
        target_path = CUSTOM_MODEL_PATH
        custom_flag = True
    elif ROOT_MODEL_PATH.exists():
        target_path = ROOT_MODEL_PATH
        custom_flag = True
    elif FALLBACK_MODEL_PATH.exists():
        target_path = FALLBACK_MODEL_PATH
        custom_flag = False
    else:
        # Download or load yolo11n directly
        target_path = FALLBACK_MODEL_PATH
        custom_flag = False

    print(f"[Vision Service] Loading YOLO11n model from: {target_path} (is_custom={custom_flag})")
    try:
        model = YOLO(str(target_path))
        current_model = model
        current_model_path = target_path
        is_custom_model = custom_flag
        model_classes = {int(k): str(v) for k, v in model.names.items()}
        print(f"[Vision Service] Successfully loaded '{target_path.name}' with {len(model_classes)} classes: {list(model_classes.values())[:8]}...")
        return True
    except Exception as e:
        print(f"[Vision Service] Error loading model from {target_path}: {e}")
        # Final emergency fallback to yolo11n.pt via ultralytics auto-download
        try:
            print("[Vision Service] Falling back to default yolo11n.pt...")
            model = YOLO("yolo11n.pt")
            current_model = model
            current_model_path = Path("yolo11n.pt")
            is_custom_model = False
            model_classes = {int(k): str(v) for k, v in model.names.items()}
            return True
        except Exception as e2:
            print(f"[Vision Service] Critical: Unable to initialize any YOLO model: {e2}")
            return False


# Initialize model on startup
@app.on_event("startup")
async def startup_event():
    load_detection_model()


class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    width: float
    height: float


class NormalizedBoundingBox(BaseModel):
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    width: float
    height: float


class DetectionItem(BaseModel):
    class_id: int
    class_name: str
    confidence: float
    box: BoundingBox
    box_normalized: NormalizedBoundingBox


class DetectionResponse(BaseModel):
    success: bool
    detections: List[DetectionItem]
    detection_count: int
    model_name: str
    is_custom_trained: bool
    inference_time_ms: float
    image_width: int
    image_height: int


class Base64DetectRequest(BaseModel):
    image_base64: str
    confidence_threshold: Optional[float] = 0.35
    iou_threshold: Optional[float] = 0.45


@app.get("/health")
@app.get("/status")
def get_service_status():
    """Returns vision service and model loading status."""
    return {
        "status": "online" if current_model is not None else "degraded",
        "service": "SmartCart AI YOLO11n Vision Service",
        "model_loaded": current_model is not None,
        "model_name": current_model_path.name if current_model_path else "yolo11n.pt",
        "model_path": str(current_model_path) if current_model_path else None,
        "is_custom_trained": is_custom_model,
        "model_architecture": "YOLO11n (Ultralytics 8.4+)",
        "pretrained_checkpoint": "yolo11n.pt",
        "total_classes": len(model_classes),
        "classes": list(model_classes.values()),
        "custom_weights_available": CUSTOM_MODEL_PATH.exists() or ROOT_MODEL_PATH.exists(),
        "custom_weights_path": str(CUSTOM_MODEL_PATH if CUSTOM_MODEL_PATH.exists() else ROOT_MODEL_PATH),
        "notes": (
            f"Custom YOLO11n weights ({current_model_path.name if current_model_path else 'best.pt'}) active with {len(model_classes)} grocery classes."
            if is_custom_model
            else "Pretrained YOLO11n checkpoint (yolo11n.pt) active."
        ),
    }


@app.post("/reload")
def reload_model(path: Optional[str] = None):
    """Reloads model weights, useful after saving a newly trained best.pt."""
    success = load_detection_model(path)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to reload YOLO model.")
    return {
        "success": True,
        "message": f"Successfully loaded {current_model_path.name}",
        "is_custom_trained": is_custom_model,
    }


def run_inference_on_pil_image(image: Image.Image, conf: float, iou: float) -> DetectionResponse:
    if current_model is None:
        raise HTTPException(status_code=503, detail="YOLO model is not initialized.")

    orig_w, orig_h = image.size
    t0 = time.perf_counter()

    # Convert to RGB (in case of RGBA/alpha channel)
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Run inference with ultralytics
    results = current_model.predict(
        source=image,
        conf=conf,
        iou=iou,
        imgsz=640,
        verbose=False,
    )

    inference_ms = (time.perf_counter() - t0) * 1000.0

    detections: List[DetectionItem] = []
    if results and len(results) > 0:
        r = results[0]
        boxes = r.boxes
        if boxes is not None and len(boxes) > 0:
            for box in boxes:
                coords = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                confidence = float(box.conf[0].item())
                class_id = int(box.cls[0].item())
                class_name = model_classes.get(class_id, f"class_{class_id}")

                x1, y1, x2, y2 = coords
                box_w = max(0.0, x2 - x1)
                box_h = max(0.0, y2 - y1)

                # Normalized coords [0, 1] for responsive canvas overlay
                norm_box = NormalizedBoundingBox(
                    x_min=round(x1 / orig_w, 4),
                    y_min=round(y1 / orig_h, 4),
                    x_max=round(x2 / orig_w, 4),
                    y_max=round(y2 / orig_h, 4),
                    width=round(box_w / orig_w, 4),
                    height=round(box_h / orig_h, 4),
                )

                detections.append(
                    DetectionItem(
                        class_id=class_id,
                        class_name=class_name,
                        confidence=round(confidence, 4),
                        box=BoundingBox(
                            x1=round(x1, 1),
                            y1=round(y1, 1),
                            x2=round(x2, 1),
                            y2=round(y2, 1),
                            width=round(box_w, 1),
                            height=round(box_h, 1),
                        ),
                        box_normalized=norm_box,
                    )
                )

    return DetectionResponse(
        success=True,
        detections=detections,
        detection_count=len(detections),
        model_name=current_model_path.name if current_model_path else "yolo26s.pt",
        is_custom_trained=is_custom_model,
        inference_time_ms=round(inference_ms, 1),
        image_width=orig_w,
        image_height=orig_h,
    )


@app.post("/detect", response_model=DetectionResponse)
async def detect_from_json(req: Base64DetectRequest):
    """
    Detect objects from a base64 encoded image frame.
    Recommended for fast client-side webcam streaming without multipart overhead.
    """
    raw_b64 = req.image_base64
    if "," in raw_b64:
        raw_b64 = raw_b64.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(raw_b64)
        image = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {e}")

    conf = req.confidence_threshold or 0.40
    iou = req.iou_threshold or 0.45
    return run_inference_on_pil_image(image, conf=conf, iou=iou)


@app.get("/classes")
def get_model_classes():
    """Returns the list of class names the loaded model can detect."""
    return {
        "model_name": current_model_path.name if current_model_path else None,
        "is_custom_trained": is_custom_model,
        "total_classes": len(model_classes),
        "classes": model_classes,
    }


@app.post("/detect/file", response_model=DetectionResponse)
async def detect_from_file(
    file: UploadFile = File(...),
    confidence: float = Query(0.50, ge=0.01, le=1.0),
    iou: float = Query(0.45, ge=0.01, le=1.0),
):
    """Detect objects from an uploaded image file."""
    try:
        content = await file.read()
        image = Image.open(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image file: {e}")

    return run_inference_on_pil_image(image, conf=confidence, iou=iou)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("vision_service:app", host="127.0.0.1", port=8000, reload=False)
