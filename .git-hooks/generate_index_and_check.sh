#!/usr/bin/env bash
set -euo pipefail

# Ensure we're at repo root
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# Run the generator
./generate_index.py

# Fail if index.json has unstaged changes
if ! git diff --quiet -- public/index.json; then
  echo "public/index.json was modified by generate_index.py. Please stage it:" >&2
  echo "  git add public/index.json" >&2
  exit 1
fi

# Also fail if index.json has staged but uncommitted changes differing from HEAD
if ! git diff --cached --quiet -- public/index.json; then
  echo "public/index.json has staged changes. Ensure it is included in this commit." >&2
  # Do not exit non-zero here; allowing commit proceeds if staged. Comment out to enforce stricter policy.
fi
