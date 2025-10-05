# Recipes

A minimal static recipe book powered by HTML + Alpine.js. Recipes are JSON files under `public/recipes/`, and a generated `public/index.json` provides the homepage listing and filtering.

## Quick start

```bash
# Serve the static site (any static server works)
# Example with Python 3:
python3 -m http.server -d public 5173
# Then open http://localhost:5173
```

## Add a new recipe

1. Create a new JSON file under `public/recipes/`, e.g. `public/recipes/tortilla.json`.
2. Use the structure below. `title`, `description`, `ingredients`, and `instructions` can be:
   - a plain string/list (single-language), or
   - an object keyed by language codes (`en`, `es`, `cat`).
3. Add one or more categories using existing keys in translations: see `public/translations/*` under `cat.*`.
4. Set `image` to a URL or a path under `public/`.
5. Run `./generate_index.py` to refresh `public/index.json`.
6. Commit both your recipe file and the updated `public/index.json`.

### JSON schema (example)

```json
{
  "title": { "en": "Spanish Omelette", "es": "Tortilla de patatas", "cat": "Truita de patates" },
  "categories": ["desserts"],
  "image": "https://example.com/omelette.jpg",
  "description": {
    "en": "A classic omelette with potatoes and eggs.",
    "es": "Una tortilla clásica con patatas y huevos.",
    "cat": "Una truita clàssica amb patates i ous."
  },
  "ingredients": {
    "en": ["4 eggs", "3 potatoes", "olive oil", "salt"],
    "es": ["4 huevos", "3 patatas", "aceite de oliva", "sal"],
    "cat": ["4 ous", "3 patates", "oli d'oliva", "sal"]
  },
  "instructions": {
    "en": ["Slice potatoes", "Fry in oil", "Add beaten eggs", "Cook both sides"],
    "es": ["Corta las patatas", "Fríe en aceite", "Añade huevos batidos", "Cocina por ambos lados"],
    "cat": ["Talla les patates", "Fregix en oli", "Afegeix ous batuts", "Cuina pels dos costats"]
  }
}
```

Notes:
- `generate_index.py` reads the English `title` for `public/index.json`. If `title` is an object, ensure it has an `en` key.
- Categories must exist in translations under `cat.*` (see `public/translations/en.json`, `es.json`, `cat.json`).

## Index generator

Regenerate the index after adding or changing recipes:

```bash
./generate_index.py
```

This updates `public/index.json` with:
- `title` (English)
- `categories`
- `path` (relative to `public/`)
- `image`

## Pre-commit hook

This repo includes a pre-commit hook that runs the generator and blocks commits if `public/index.json` changes but is not staged.

Enable it once:

```bash
pip install pre-commit
pre-commit install
```

Behavior on commit:
- Runs `./generate_index.py`.
- If `public/index.json` changes and is not staged, the commit fails with a message to run `git add public/index.json`.

Hook files:
- `.pre-commit-config.yaml`
- `.git-hooks/generate_index_and_check.sh`

## Translations

UI strings and category names live in:
- `public/translations/en.json`
- `public/translations/es.json`
- `public/translations/cat.json`

Add recipe categories using keys present under `cat.*` across these files.

## Example

See `recipe_example.json` at the repository root for a ready-to-copy template.
