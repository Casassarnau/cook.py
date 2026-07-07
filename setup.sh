#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(pwd)"

echo "🔍 Checking for Hermit installation..."
if ! command -v hermit &>/dev/null; then
  echo "❌ Hermit is not installed. Please install it first:"
  echo "   curl -fsSL https://github.com/cashapp/hermit/releases/download/stable/install.sh | /bin/bash"
  exit 1
fi

# === Initialize Hermit environment ===
echo "🐚 Initializing Hermit environment..."
hermit init "$PROJECT_ROOT"

# === Install uv and pre-commit via Hermit ===
echo "📦 Installing uv and pre-commit via Hermit..."
. "$PROJECT_ROOT/bin/activate-hermit"
hermit install uv pre-commit

# === Sync Python dependencies with uv ===
echo "🐍 Syncing Python dependencies with uv..."
./bin/uv sync

# === Install pre-commit hooks ===
echo "🔧 Installing pre-commit hooks..."
./bin/pre-commit install

# === Finalize ===
echo ""
echo "✅ Setup complete!"
echo "💡 All tools are managed by Hermit (./bin/) and uv (.venv/)."
echo "💡 Use './bin/uv run python <script>' to run Python scripts."
