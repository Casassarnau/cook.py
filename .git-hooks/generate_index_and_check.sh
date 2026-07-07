#!/usr/bin/env bash
set -euo pipefail

# === Ensure we're at the repo root ===
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

UV="${REPO_ROOT}/bin/uv"
if [ ! -x "$UV" ]; then
  echo "❌ Hermit environment not found. Run ./setup.sh first." >&2
  exit 1
fi

# === Step 0: Auto-format docs (JSON, HTML, JS, CSS) ===
echo "🧹 Auto-formatting docs (JSON, HTML, JS, CSS)..."
"$UV" run python docs_formatter.py

# === Step 1: Generate images ===
echo "🖼️  Running image generation..."
"$UV" run python generate_images.py

# Stage image and JSON files only if they changed
if ! git diff --quiet -- docs/images || ! git diff --cached --quiet -- docs/images; then
  echo "📦 Staging new or modified image files..."
  git add docs/images/**/*.webp || true
fi

if ! git diff --quiet -- docs || ! git diff --cached --quiet -- docs; then
  echo "📦 Staging updated docs files..."
  git add docs/**/*.json docs/**/*.html docs/**/*.js docs/**/*.css || true
fi

# === Step 2: Generate index ===
echo "📚 Running index generation..."
"$UV" run python generate_index.py

# === Step 3: Handle index.json changes ===
if ! git diff --quiet -- docs/index.json; then
  echo "📝 docs/index.json was modified by generate_index.py. Staging it..."
  git add docs/index.json
fi

# === Step 4: Optional warning if staged but uncommitted ===
if ! git diff --cached --quiet -- docs/index.json; then
  echo "⚠️  docs/index.json has staged changes. Ensure it's included in this commit." >&2
  # Uncomment next line to make it fail instead of warn
  # exit 1
fi

echo "✅ Pre-commit tasks complete!"
