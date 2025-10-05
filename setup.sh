#!/usr/bin/env bash
set -e

# === Configuration ===
PYTHON_VERSION="3.13.1"
VENV_NAME="cook-env"

echo "🔍 Checking for pyenv installation..."
if ! command -v pyenv &> /dev/null; then
  echo "❌ pyenv is not installed. Please install pyenv first: https://github.com/pyenv/pyenv"
  exit 1
fi

# Initialize pyenv in this shell
export PATH="$HOME/.pyenv/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"

# === Ensure the desired Python version is installed ===
if ! pyenv versions --bare | grep -q "^${PYTHON_VERSION}$"; then
  echo "📦 Installing Python ${PYTHON_VERSION}..."
  pyenv install "${PYTHON_VERSION}"
else
  echo "✅ Python ${PYTHON_VERSION} already installed."
fi

# === Remove existing virtual environment if it exists ===
if pyenv virtualenvs --bare | grep -q "^${VENV_NAME}$"; then
  echo "♻️ Removing existing virtual environment: ${VENV_NAME}"
  pyenv uninstall -f "${VENV_NAME}"
fi

# === Create new virtual environment ===
echo "🐍 Creating new virtual environment: ${VENV_NAME}"
pyenv virtualenv "${PYTHON_VERSION}" "${VENV_NAME}"

# === Activate the environment ===
echo "🔧 Activating virtual environment..."
pyenv activate "${VENV_NAME}"

# === Install project dependencies ===
if [ -f "requirements.txt" ]; then
  echo "📦 Installing dependencies from requirements.txt..."
  pip install -r requirements.txt
else
  echo "⚠️ No requirements.txt found. Skipping dependency installation."
fi

# === Install and configure pre-commit hooks ===
if ! command -v pre-commit &> /dev/null; then
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
echo "✅ Setup complete! Environment '${VENV_NAME}' is ready to use."
echo "💡 To activate it in a new terminal: pyenv activate ${VENV_NAME}"
