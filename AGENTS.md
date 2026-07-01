# cook.py

Static recipe book: HTML + Alpine.js in `docs/`, JSON recipes in `docs/recipes/`, Python generator scripts at repo root. No build step, no tests, no lint/typecheck suite.

## Toolchain
- **Hermit** manages `uv` and `pre-commit` via self-bootstrapping symlinks in `bin/` (committed). Prereq: install Hermit once (`curl -fsSL https://github.com/cashapp/hermit/releases/download/stable/install.sh | /bin/bash`).
- **uv** manages Python (version pinned in `.python-version` → `3.13`, auto-downloaded) and Python deps (`pyproject.toml` + `uv.lock`). Run `./bin/uv sync` to install deps into `.venv/`.
- **`./bin/uv run python`** is the canonical way to run any Python script. It auto-syncs the venv — no manual activation needed.
- No `requirements.txt` — deps live in `pyproject.toml`. To add a dep: `./bin/uv add <package>` (updates `pyproject.toml` + `uv.lock`).

## Commands
- Setup: `./setup.sh` (Hermit init + install uv/pre-commit + `uv sync` + pre-commit install).
- Dev server: `./dev.sh` → http://localhost:8000 (serves `docs/`).
- Regenerate all artifacts: `./sync.sh` (runs `docs_formatter.py` → `generate_images.py` → `generate_index.py`, all via `./bin/uv run python`).
- Single generator: `./bin/uv run python generate_index.py` / `generate_images.py` / `docs_formatter.py`.
- No test/lint/typecheck. Verification = run `./sync.sh` or let pre-commit run the generators.

## Pre-commit hook (non-obvious)
- `.pre-commit-config.yaml` runs `.git-hooks/generate_index_and_check.sh` on every commit.
- It auto-formats docs, regenerates images + index, and **auto-stages** changed `docs/**/*.{json,html,js,css,webp}` and `docs/index.json`. Expect commits to include files you didn't stage.
- Fails if `bin/uv` is missing (run `./setup.sh` first).

## Recipes (high-signal gotchas)
- **4 languages, not 3**: `en`, `es`, `cat`, `sv` (Swedish). `prompt.md` and `docs/translations/*.json` are the source of truth.
- `prompt.md` is the recipe-to-JSON conversion prompt and the authoritative dictionary of valid `ingredient`, `unit`, and `category` keys.
- Every category/unit/ingredient key must exist in all four `docs/translations/{en,es,cat,sv}.json` (`cat.*`, `units.*`, `ingredients.*`).
- Manual categories: `desserts, mains, snacks, drinks, baking`. **Never set `thermomix` manually** — `generate_index.py` auto-adds/removes it based on Thermomix instructions.
- `docs/index.json` is generated (sorted by English title) — never hand-edit.
- `generate_images.py` converts sources to `.webp` + `_lower.webp`, deletes originals, rewrites `.jpg/.png` → `.webp` refs across json/md/html/js/ts/tsx/py. Don't restore old extensions.
- `recipe_example.json` uses the legacy `servings` field; new recipes should use the `portion` object (see `prompt.md`).

## Frontend
- `docs/index.html` boots Alpine.js (`x-data="recipeApp()"`); `docs/app.js` composes the app from `docs/js/*` feature modules via `Object.assign` of `recipeX()` factories. `docs/components/` holds HTML partials. Production path prefix is `/cook.py` (set in `app.js`).
