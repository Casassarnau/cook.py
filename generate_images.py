from PIL import Image
import os

# Root folder containing the images (with subfolders)
image_root = "docs/images"

# Supported formats
SUPPORTED_FORMATS = (".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".gif")

# Compression settings
QUALITY = 85
LOWRES_QUALITY = 60
LOWRES_SCALE = 0.5

for root, _, files in os.walk(image_root):
    for filename in files:
        if filename.lower().endswith(SUPPORTED_FORMATS):
            input_path = os.path.join(root, filename)
            base_name = os.path.splitext(filename)[0]

            # Skip files already in WebP format
            if filename.lower().endswith(".webp"):
                continue

            try:
                with Image.open(input_path) as img:
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")

                    # Output paths in the same folder
                    webp_path = os.path.join(root, f"{base_name}.webp")
                    lowres_path = os.path.join(root, f"{base_name}_lower.webp")

                    # Save main WebP
                    img.save(webp_path, "webp", quality=QUALITY, method=6)

                    # Create and save low-res WebP
                    width, height = img.size
                    new_size = (int(width * LOWRES_SCALE), int(height * LOWRES_SCALE))
                    img_lowres = img.resize(new_size, Image.Resampling.LANCZOS)
                    img_lowres.save(lowres_path, "webp", quality=LOWRES_QUALITY, method=6)

                    print(f"✅ Converted {input_path} → {webp_path} and {lowres_path}")

            except Exception as e:
                print(f"⚠️ Error processing {input_path}: {e}")

print("🎉 All images converted (including subfolders)!")
