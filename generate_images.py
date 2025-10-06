#!/usr/bin/env python3
from PIL import Image
import os
from pathlib import Path
import subprocess
import re
import json

# === Config ===
IMAGE_ROOT = Path("docs/images")
PROJECT_ROOT = Path("docs/")  # search for references starting from repo root
SUPPORTED_FORMATS = (".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".gif")

QUALITY = 80
LOWRES_QUALITY = 50
LOWRES_SCALE = 0.5
DELETE_ORIGINAL = True
UPDATE_REFERENCES = True

# File extensions where we’ll replace .jpg/.png → .webp
REF_FILE_TYPES = (".json", ".md", ".html", ".js", ".ts", ".tsx", ".py")

# === Image conversion ===
def convert_to_webp(img_path: Path):
    """Convert image to .webp and _lower.webp"""
    base = img_path.stem
    webp_path = img_path.with_name(f"{base}.webp")
    lowres_path = img_path.with_name(f"{base}_lower.webp")

    # Skip if already exists
    if webp_path.exists() and lowres_path.exists():
        print(f"⏭️ Skipping {img_path} (already converted)")
        return

    with Image.open(img_path) as img:
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        img.save(webp_path, "webp", quality=QUALITY, method=6)

        w, h = img.size
        new_size = (int(w * LOWRES_SCALE), int(h * LOWRES_SCALE))
        img_low = img.resize(new_size, Image.Resampling.LANCZOS)
        img_low.save(lowres_path, "webp", quality=LOWRES_QUALITY, method=6)

    print(f"✅ {img_path} → {webp_path}, {lowres_path}")


def remove_original(img_path: Path):
    """Delete or untrack original image."""
    try:
        subprocess.run(["git", "rm", "-q", str(img_path)], check=False)
    except Exception:
        pass
    if DELETE_ORIGINAL:
        img_path.unlink(missing_ok=True)
        print(f"🗑️  Deleted {img_path}")


# === Reference update ===
def update_references():
    """Replace image extensions (.jpg, .png, etc.) → .webp in JSON files."""
    print("🔍 Updating .jpg/.png references → .webp in JSON files...")
    for path in PROJECT_ROOT.rglob("*.json"):
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue  # skip unreadable files

        new_text = text
        for ext in SUPPORTED_FORMATS:
            # Replace extension if followed by a quote, space, comma, curly brace, or end of string
            new_text = re.sub(
                rf"{re.escape(ext)}(?=(?:['\"\s,}}]|$))",
                ".webp",
                new_text,
                flags=re.IGNORECASE,
            )

        if new_text != text:
            path.write_text(new_text, encoding="utf-8")
            print(f"✏️  Updated image refs in {path}")


def main():
    print(f"🚀 Scanning {IMAGE_ROOT} for images...")
    converted = 0
    for root, _, files in os.walk(IMAGE_ROOT):
        for file in files:
            path = Path(root) / file
            if path.suffix.lower() in SUPPORTED_FORMATS:
                try:
                    convert_to_webp(path)
                    remove_original(path)
                    converted += 1
                except Exception as e:
                    print(f"⚠️ Error processing {path}: {e}")

    if UPDATE_REFERENCES:
        update_references()

    print(f"🎉 Conversion complete. {converted} images processed.")


if __name__ == "__main__":
    main()
