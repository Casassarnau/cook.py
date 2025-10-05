#!/usr/bin/env python3
import os, json, sys

BASE_DIR = os.path.join("docs", "recipes")
INDEX_FILE = os.path.join("docs", "index.json")

if not os.path.exists(BASE_DIR):
    print(f"❌ Error: {BASE_DIR} folder not found.")
    sys.exit(1)

index = []

for file in os.listdir(BASE_DIR):
    if file.endswith(".json"):
        path = os.path.join(BASE_DIR, file)
        with open(path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except Exception as e:
                print(f"⚠️ Skipping {file}: invalid JSON ({e})")
                continue

        title = data["title"]["en"] if isinstance(data["title"], dict) else data["title"]
        categories = data.get("categories", [])
        image = data.get("image", "")
        author = data.get("author", "")
        index.append({
            "title": title,
            "categories": categories,
            # paths in index.json should be relative to `docs/`
            "path": f"recipes/{file}",
            "image": image,
            "author": author
        })

index.sort(key=lambda x: x["title"].lower())

with open(INDEX_FILE, "w", encoding="utf-8") as f:
    json.dump(index, f, ensure_ascii=False, indent=2)

print(f"✅ Generated {INDEX_FILE} with {len(index)} recipes.")
