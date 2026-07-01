# Contributing

## Add a new recipe

1. Create a new JSON file under `docs/recipes/`, e.g. `docs/recipes/tortilla.json`.
2. Use the structure described in [SCHEMA.md](SCHEMA.md). `title`, `description`, `ingredients`, and `instructions` must be objects keyed by language codes (`en`, `es`, `cat`, `sv`).
3. Add one or more categories using existing keys in translations: see `docs/translations/*` under `cat.*`.
4. Set `image` to a URL or a path under `docs/`.
5. Run `./sync.sh` to generate images and refresh `docs/index.json`, or run individually:
   - `./bin/uv run python generate_images.py` - Generate optimized images
   - `./bin/uv run python generate_index.py` - Update the recipe index
6. Commit both your recipe file and the updated `docs/index.json`.

For the full recipe-to-JSON conversion rules and the authoritative dictionary of valid `ingredient`, `unit`, and `category` keys, see `prompt.md`.

## Development Setup

### Prerequisites

Install [Hermit](https://cashapp.github.io/hermit/) once on your machine:

```bash
curl -fsSL https://github.com/cashapp/hermit/releases/download/stable/install.sh | /bin/bash
```

### First-time setup

Run the setup script to configure your development environment:

```bash
./setup.sh
```

This script will:
- Initialize a Hermit environment in `bin/` (manages `uv` and `pre-commit`)
- Sync Python dependencies with `uv` (reads `.python-version` for the Python version, `pyproject.toml` for deps)
- Install pre-commit hooks

### Manual setup (alternative)

```bash
# Initialize Hermit and install tools
hermit init .
. ./bin/activate-hermit
hermit install uv pre-commit

# Sync Python dependencies
./bin/uv sync

# Install pre-commit hooks
./bin/pre-commit install
```

## Available Scripts

### Development Scripts

- **`./dev.sh`** - Start the development server on port 8000
- **`./setup.sh`** - Set up the development environment (Hermit tools, Python dependencies, pre-commit hooks)
- **`./sync.sh`** - Generate images and update the index (runs `docs_formatter.py`, `generate_images.py`, and `generate_index.py`)

### Python Scripts

Run any Python script via `./bin/uv run python`:

- **`./bin/uv run python generate_index.py`** - Regenerate the recipe index
- **`./bin/uv run python generate_images.py`** - Generate optimized images for recipes
- **`./bin/uv run python docs_formatter.py`** - Format JSON/HTML/JS/CSS under `docs/`

## Index generator

Regenerate the index after adding or changing recipes:

```bash
./bin/uv run python generate_index.py
```

This updates `docs/index.json` with:
- `title` (English)
- `categories`
- `path` (relative to `docs/`)
- `image`

## Pre-commit hook

This repo includes a pre-commit hook that runs the generator and blocks commits if `docs/index.json` changes but is not staged.

The setup script automatically installs pre-commit hooks, or you can install them manually:

```bash
./bin/pre-commit install
```

Behavior on commit:
- Runs `docs_formatter.py`, `generate_images.py`, and `generate_index.py` via `./bin/uv run python`.
- Auto-stages changed `docs/**/*.{json,html,js,css,webp}` and `docs/index.json`.
- If `docs/index.json` changes and is not staged, the commit fails with a message to run `git add docs/index.json`.

Hook files:
- `.pre-commit-config.yaml`
- `.git-hooks/generate_index_and_check.sh`

## Translations

UI strings and category names live in:
- `docs/translations/en.json`
- `docs/translations/es.json`
- `docs/translations/cat.json`
- `docs/translations/sv.json`

Add recipe categories using keys present under `cat.*` across all four files. Every category/unit/ingredient key must exist in all four translation files.
