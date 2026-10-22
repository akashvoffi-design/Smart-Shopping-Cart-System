"""
SmartCart AI -- Image Collector (Bing + DuckDuckGo fallback)
=============================================================
Uses icrawler's BingImageCrawler (Google's parser breaks frequently).
Falls back to DuckDuckGo image search via requests if Bing also fails.

Usage:
    python collect_google_images.py --out raw_images --per-query 5
    python collect_google_images.py --out raw_images --per-query 10 --classes parle_g lays_classic
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from pathlib import Path
import argparse
import shutil
import time
import requests
import re
import json
import urllib.parse

from icrawler.builtin import BingImageCrawler

# ─── 20 product classes with targeted search queries ──────────────────────────
CLASSES = {
    "amul_masti_dahi":      "Amul Masti Dahi yogurt cup India",
    "bisleri_water":        "Bisleri packaged drinking water bottle India",
    "britannia_bread":      "Britannia bread packet India",
    "britannia_fruit_cake": "Britannia fruit cake packet India",
    "fresh_apple":          "fresh apple fruit",
    "fresh_banana":         "fresh banana bunch",
    "fresh_broccoli":       "fresh broccoli vegetable",
    "fresh_carrot":         "fresh carrot vegetable",
    "fresh_mushroom":       "fresh button mushroom vegetable",
    "fresh_orange":         "fresh orange fruit",
    "glazed_donut":         "glazed ring donut",
    "lays_classic":         "Lay's Classic chips packet India",
    "parle_g":              "Parle-G glucose biscuits packet India",
    "fresh_tomato":         "fresh tomato vegetable",
    "fresh_potato":         "fresh potato vegetable",
    "fresh_onion":          "fresh onion vegetable",
    "maggi_noodles":        "Maggi 2 minute noodles packet India",
    "kurkure":              "Kurkure snack packet India",
    "amul_butter":          "Amul butter packet India",
    "pepsi_can":            "Pepsi cola can India",
}

# ─── Condition modifiers to get diverse, robust training images ───────────────
CONDITIONS = {
    "angles":         "front back side top view tilted",
    "distances":      "close up medium distance far view",
    "lighting":       "daylight indoor fluorescent dim light",
    "backgrounds":    "white background supermarket shelf shopping cart",
    "occlusion":      "partially occluded partially hidden",
    "multiple_items": "multiple same products mixed grocery",
}

VALID_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def safe_ext(path: Path) -> str:
    ext = path.suffix.lower()
    return ext if ext in VALID_EXTS else ".jpg"


# ─── DuckDuckGo fallback downloader ───────────────────────────────────────────
def duckduckgo_download(query: str, dest: Path, max_num: int) -> int:
    """Download images from DuckDuckGo when Bing fails."""
    dest.mkdir(parents=True, exist_ok=True)
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    # DuckDuckGo image search token (vqd)
    try:
        init_url = f"https://duckduckgo.com/?q={urllib.parse.quote(query)}&iax=images&ia=images"
        r = requests.get(init_url, headers=headers, timeout=10)
        vqd_match = re.search(r'vqd=([^&"]+)', r.text)
        if not vqd_match:
            return 0
        vqd = vqd_match.group(1)

        search_url = (
            f"https://duckduckgo.com/i.js"
            f"?l=us-en&o=json&q={urllib.parse.quote(query)}&vqd={vqd}&f=,,,,,&p=1"
        )
        r2 = requests.get(search_url, headers=headers, timeout=10)
        data = r2.json()
        results = data.get("results", [])[:max_num]
    except Exception as e:
        print(f"    [DDG] Token fetch failed: {e}")
        return 0

    saved = 0
    for idx, item in enumerate(results, start=1):
        img_url = item.get("image", "")
        if not img_url:
            continue
        try:
            img_r = requests.get(img_url, headers=headers, timeout=10, stream=True)
            if img_r.status_code == 200:
                ext = ".jpg"
                ct = img_r.headers.get("Content-Type", "")
                if "png" in ct:
                    ext = ".png"
                elif "webp" in ct:
                    ext = ".webp"
                fname = dest / f"ddg_{idx:03d}{ext}"
                with open(fname, "wb") as f:
                    for chunk in img_r.iter_content(8192):
                        f.write(chunk)
                saved += 1
        except Exception:
            pass
        time.sleep(0.3)
    return saved


# ─── Bing crawler with DuckDuckGo fallback ────────────────────────────────────
def collect_images_for_query(query: str, dest: Path, max_num: int) -> int:
    """Try Bing first, fall back to DuckDuckGo."""
    temp = dest / "_tmp_bing"
    temp.mkdir(parents=True, exist_ok=True)
    bing_saved = 0

    try:
        crawler = BingImageCrawler(
            storage={"root_dir": str(temp)},
            feeder_threads=1,
            parser_threads=1,
            downloader_threads=4,
        )
        crawler.crawl(
            keyword=query,
            max_num=max_num,
            file_idx_offset=0,
            filters={"size": "medium"},
        )
        candidates = [p for p in temp.iterdir() if p.is_file() and p.suffix.lower() in VALID_EXTS]
        bing_saved = len(candidates)
        for idx, src in enumerate(sorted(candidates), start=1):
            target = dest / f"bing_{idx:03d}{safe_ext(src)}"
            if not target.exists():
                shutil.move(str(src), str(target))
    except Exception as exc:
        print(f"    [Bing] Crawler error: {exc}")
    finally:
        shutil.rmtree(temp, ignore_errors=True)

    if bing_saved == 0:
        print(f"    [Bing] 0 images — trying DuckDuckGo fallback...")
        bing_saved = duckduckgo_download(query, dest, max_num)
        if bing_saved > 0:
            print(f"    [DDG] ✓ Saved {bing_saved} images via DuckDuckGo")
        else:
            print(f"    [DDG] 0 images — both sources failed for this query.")

    return bing_saved


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Collect candidate training images for SmartCart AI (Bing + DDG fallback)."
    )
    parser.add_argument("--out",       default="raw_images", help="Output root folder (default: raw_images)")
    parser.add_argument("--per-query", type=int, default=5,  help="Max images per query (default: 5)")
    parser.add_argument("--classes",   nargs="*",            help="Optional subset of class names to collect")
    args = parser.parse_args()

    out = Path(args.out)
    selected = args.classes if args.classes else list(CLASSES.keys())

    unknown = set(selected) - set(CLASSES)
    if unknown:
        raise SystemExit(f"[ERROR] Unknown class names: {', '.join(sorted(unknown))}")

    print("=" * 65)
    print("  SmartCart AI - Image Collection Pipeline")
    print(f"  Classes: {len(selected)}  |  Images per query: {args.per_query}")
    print(f"  Output folder: {out.resolve()}")
    print("=" * 65)

    total_saved = 0
    summary = {}

    for cls in selected:
        base_query = CLASSES[cls]
        class_total = 0
        print(f"\n{'-'*60}")
        print(f"  CLASS: {cls}")
        print(f"  Base query: \"{base_query}\"")

        for condition, condition_terms in CONDITIONS.items():
            dest = out / cls / condition
            dest.mkdir(parents=True, exist_ok=True)
            query = f"{base_query} {condition_terms}"

            print(f"\n  [{condition}]")
            print(f"    Query: {query[:80]}...")

            saved = collect_images_for_query(query, dest, args.per_query)
            class_total += saved
            total_saved += saved
            print(f"    → {saved} image(s) saved to {dest}")
            time.sleep(1.0)   # polite delay between queries

        summary[cls] = class_total
        print(f"\n  [OK] {cls}: {class_total} images collected")

    # Summary Report
    print("\n" + "=" * 65)
    print("  COLLECTION COMPLETE - SUMMARY REPORT")
    print("=" * 65)
    for cls, count in summary.items():
        status = "[OK] " if count >= args.per_query * 2 else "[--] " if count > 0 else "[!!] "
        print(f"  {status}{cls:<28} {count:>4} images")
    print(f"\n  Total images collected: {total_saved}")
    print("=" * 65)
    print("\nNEXT STEPS:")
    print("  1. Review images in raw_images/ - delete irrelevant or blurry ones")
    print("  2. Annotate with bounding boxes at https://roboflow.com (free)")
    print("  3. Export as YOLOv8 format, place in training/dataset/")
    print("  4. Run: python training/train.py --epochs 50")
    print("=" * 65)


if __name__ == "__main__":
    main()
