# Recipes

A minimal static recipe book powered by HTML + Alpine.js. Recipes are JSON files under `docs/recipes/`, and a generated `docs/index.json` provides the homepage listing and filtering.

## Quick start

```bash
# Serve the static site (any static server works)
# Example with Python 3:
python3 -m http.server -d docs 5173
# Then open http://localhost:5173
```

## Add a new recipe

1. Create a new JSON file under `docs/recipes/`, e.g. `docs/recipes/tortilla.json`.
2. Use the structure below. `title`, `description`, `ingredients`, and `instructions` can be:
   - a plain string/list (single-language), or
   - an object keyed by language codes (`en`, `es`, `cat`).
3. Optionally add named ingredient variations via `ingredientVariations` (see advanced schema below).
4. Add one or more categories using existing keys in translations: see `docs/translations/*` under `cat.*`.
5. Set `image` to a URL or a path under `docs/`.
6. Run `./generate_index.py` to refresh `docs/index.json`.
7. Commit both your recipe file and the updated `docs/index.json`.

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
  "ingredientVariations": [
    {
      "key": "classic",                       // stable id used for conditionals
      "name": { "en": "Classic", "es": "Clásica", "cat": "Clàssica" },
      "ingredients": {
        "en": ["4 eggs", "3 potatoes", "olive oil", "salt"],
        "es": ["4 huevos", "3 patatas", "aceite de oliva", "sal"],
        "cat": ["4 ous", "3 patates", "oli d'oliva", "sal"]
      }
    },
    {
      "key": "onion",
      "name": { "en": "With onion", "es": "Con cebolla", "cat": "Amb ceba" },
      "ingredients": {
        "en": ["4 eggs", "3 potatoes", "1 onion", "olive oil", "salt"],
        "es": ["4 huevos", "3 patatas", "1 cebolla", "aceite de oliva", "sal"],
        "cat": ["4 ous", "3 patates", "1 ceba", "oli d'oliva", "sal"]
      }
    }
  ],
  "instructions": {
    "en": [
      "Slice potatoes",
      { "text": "Slice the onion and cook it gently with the potatoes.", "onlyForVariation": "onion" },
      "Fry in oil",
      "Add beaten eggs",
      "Cook both sides"
    ],
    "es": [
      "Corta las patatas",
      { "text": "Corta la cebolla y cocínala suavemente con las patatas.", "onlyForVariation": "onion" },
      "Fríe en aceite",
      "Añade huevos batidos",
      "Cocina por ambos lados"
    ],
    "cat": [
      "Talla les patates",
      { "text": "Talla la ceba i cuina-la suaument amb les patates.", "onlyForVariation": "onion" },
      "Fregix en oli",
      "Afegeix ous batuts",
      "Cuina pels dos costats"
    ]
  }
}
```

Notes:
- `generate_index.py` reads the English `title` for `docs/index.json`. If `title` is an object, ensure it has an `en` key.
- Categories must exist in translations under `cat.*` (see `docs/translations/en.json`, `es.json`, `cat.json`).
- `ingredientVariations` is optional. When present, the UI shows a selector and uses the chosen variation's localized `ingredients`. Each variation must have:
  - `key`: a stable string identifier (e.g., `classic`, `blue`)
  - `name`: localized display name
  - `ingredients`: localized list of strings
- `instructions` entries can be either plain strings or objects:
  - `{ "text": <string|localized object>, "onlyForVariation": <string | string[]> }`
  - `onlyForVariation` filters that step to the active variation `key`. Omit it to show the step for all variations.
 - Backwards compatibility: If `ingredientVariations` is omitted, the app falls back to top-level `ingredients`.

## Index generator

Regenerate the index after adding or changing recipes:

```bash
./generate_index.py
```

This updates `docs/index.json` with:
- `title` (English)
- `categories`
- `path` (relative to `docs/`)
- `image`

## Pre-commit hook

This repo includes a pre-commit hook that runs the generator and blocks commits if `docs/index.json` changes but is not staged.

Enable it once:

```bash
pip install pre-commit
pre-commit install
```

Behavior on commit:
- Runs `./generate_index.py`.
- If `docs/index.json` changes and is not staged, the commit fails with a message to run `git add docs/index.json`.

Hook files:
- `.pre-commit-config.yaml`
- `.git-hooks/generate_index_and_check.sh`

## Translations

UI strings and category names live in:
- `docs/translations/en.json`
- `docs/translations/es.json`
- `docs/translations/cat.json`

Add recipe categories using keys present under `cat.*` across these files.

## Example

See `recipe_example.json` at the repository root for a ready-to-copy template.
