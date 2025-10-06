#!/usr/bin/env bash
set -euo pipefail

# === Configuration ===
PYTHON_VERSION="3.13.1"
VENV_DIR=".venv"
PROJECT_ROOT="$(pwd)"

echo "🔍 Checking for pyenv installation..."
if ! command -v pyenv &>/dev/null; then
  echo "❌ pyenv is not installed. Please install pyenv first:"
  echo "   https://github.com/pyenv/pyenv"
  exit 1
fi

# === Initialize pyenv for this shell ===
export PYENV_ROOT="${HOME}/.pyenv"
export PATH="${PYENV_ROOT}/bin:${PATH}"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"

# === Ensure Python version is installed ===
if ! pyenv versions --bare | grep -qx "${PYTHON_VERSION}"; then
  echo "📦 Installing Python ${PYTHON_VERSION}..."
  pyenv install "${PYTHON_VERSION}"
else
  echo "✅ Python ${PYTHON_VERSION} already installed."
fi

# === Remove old .venv if it exists ===
if [ -d "${PROJECT_ROOT}/${VENV_DIR}" ]; then
  echo "♻️ Removing old virtual environment at ${VENV_DIR}..."
  rm -rf "${PROJECT_ROOT:?}/${VENV_DIR}"
fi

# === Create new pyenv virtualenv in .venv ===
echo "🐍 Creating new virtual environment in ${VENV_DIR}..."
mkdir -p "${PROJECT_ROOT}/${VENV_DIR}"
pyenv shell "${PYTHON_VERSION}"
python -m venv "${PROJECT_ROOT}/${VENV_DIR}"

# === Activate .venv ===
echo "🔧 Activating virtual environment..."
# shellcheck disable=SC1091
source "${PROJECT_ROOT}/${VENV_DIR}/bin/activate"

# === Upgrade pip ===
pip install --upgrade pip setuptools wheel

# === Install project dependencies ===
if [ -f "requirements.txt" ]; then
  echo "📦 Installing dependencies from requirements.txt..."
  pip install -r requirements.txt
else
  echo "⚠️ No requirements.txt found. Skipping dependency installation."
fi

# === Install and configure pre-commit hooks ===
if ! command -v pre-commit &>/dev/null; then
  echo "📦 Installing pre-commit..."
  pip install pre-commit
fi

if [ -f ".pre-commit-config.yaml" ]; then
  echo "🔧 Installing pre-commit hooks..."
  pre-commit install
else
  echo "⚠️ No .pre-commit-config.yaml found. Skipping hook installation."
fi

# === Finalize ===
echo "✅ Setup complete!"
echo "💡 To activate your environment manually, run:"
echo ""
echo "    source ${VENV_DIR}/bin/activate"
echo ""
