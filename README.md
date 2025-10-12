# Recipes

A minimal static recipe book powered by HTML + Alpine.js. Recipes are JSON files under `docs/recipes/`, and a generated `docs/index.json` provides the homepage listing and filtering.

## Quick start

```bash
# Start the development server
./dev.sh
# Then open http://localhost:8000
```

## Add a new recipe

1. Create a new JSON file under `docs/recipes/`, e.g. `docs/recipes/tortilla.json`.
2. Use the structure below. `title`, `description`, `ingredients`, and `instructions` can be:
   - a plain string/list (single-language), or
   - an object keyed by language codes (`en`, `es`, `cat`).
3. Add one or more categories using existing keys in translations: see `docs/translations/*` under `cat.*`.
4. Set `image` to a URL or a path under `docs/`.
5. Run `./sync.sh` to generate images and refresh `docs/index.json`, or run individually:
   - `./generate_images.py` - Generate optimized images
   - `./generate_index.py` - Update the recipe index
6. Commit both your recipe file and the updated `docs/index.json`.

### Complete JSON Schema

Here's the complete schema with all possible properties:

```json
{
  // REQUIRED FIELDS
  "title": { "en": "Recipe Name", "es": "Nombre de la Receta", "cat": "Nom de la Recepta" },
  "categories": ["mains", "desserts"],
  "image": "/images/recipe/main.webp",
  "description": {
    "en": "Recipe description in English.",
    "es": "Descripción de la receta en español.",
    "cat": "Descripció de la recepta en català."
  },
  "ingredients": [
    {
      "ingredient": "ingredient_key",
      "value": 250,
      "unit": "g",
      "text": { "en": "additional info", "es": "información adicional", "cat": "informació addicional" },
      "onlyForVariation": "variant_key"
    }
  ],
  "instructions": [
    {
      "text": {
        "en": "Instruction text in English.",
        "es": "Texto de instrucción en español.",
        "cat": "Text d'instrucció en català."
      },
      "onlyForVariation": "variant_key",
      "image": "/images/steps/step_image.jpg"
    }
  ],

  // OPTIONAL FIELDS
  "author": "Author Name",
  "servings": {
    "value": 4,
    "unit": "servings"
  },
  "diameter": {
    "value": 15,
    "unit": "cm"
  },
  "variants": [
    {
      "key": "variant_key",
      "name": {
        "en": "Variant Name",
        "es": "Nombre de Variante",
        "cat": "Nom de Variant"
      }
    }
  ]
}
```

### Field Descriptions

#### Required Fields

- **`title`** (object): Recipe name in multiple languages. Must include `en` key.
- **`categories`** (array): Recipe categories. Must use keys from `docs/translations/*` under `cat.*`.
- **`image`** (string): Image path relative to `docs/` or full URL.
- **`description`** (object): Recipe description in multiple languages.
- **`ingredients`** (array): List of ingredient objects (see below).
- **`instructions`** (array): List of instruction objects (see below).

#### Optional Fields

- **`author`** (string): Recipe author name.
- **`servings`** (object): Recipe serving size with value and unit.
- **`diameter`** (object): Recipe diameter for circular dishes (e.g., cakes) with value and unit.
- **`variants`** (array): Recipe variations with key and localized names.

#### Ingredient Object Properties

- **`ingredient`** (string, required): Ingredient key from translations.
- **`value`** (number, required): Quantity (use 0 for "as needed").
- **`unit`** (string, optional): Unit key from translations (`g`, `kg`, `ml`, `l`, `servings`, `cm`, `as_needed`, `to_taste`).
- **`text`** (object, optional): Additional ingredient information in multiple languages.
- **`onlyForVariation`** (string|array, optional): Show ingredient only for specific variant(s).

#### Instruction Object Properties

- **`text`** (object, required): Instruction text in multiple languages.
- **`onlyForVariation`** (string|array, optional): Show instruction only for specific variant(s).
- **`image`** (string, optional): Step image path relative to `docs/` or full URL.

#### Multilingual Fields

Fields that support multiple languages use this structure:
```json
{
  "en": "English text",
  "es": "Spanish text", 
  "cat": "Catalan text"
}
```

#### Units

Available units (defined in `docs/translations/*` under `units.*`):
- `g` - grams
- `kg` - kilograms  
- `ml` - milliliters
- `l` - liters
- `servings` - servings
- `cm` - centimeters
- `as_needed` - as needed
- `to_taste` - to taste

#### Categories

Available categories (defined in `docs/translations/*` under `cat.*`):
- `mains` - Main dishes
- `desserts` - Desserts

### Important Notes

- **`generate_index.py`** reads the English `title` for `docs/index.json`. If `title` is an object, ensure it has an `en` key.
- **Categories** must exist in translations under `cat.*` (see `docs/translations/en.json`, `es.json`, `cat.json`).
- **Ingredient keys** must be defined in translation files under `ingredients.*`.
- **Variants** are optional. When present, the UI shows a dropdown selector.
- **`onlyForVariation`** can be a string or array of strings to show content for specific variants.
- **Multilingual fields** fall back to English if the current language is not available.

## Available Scripts

### Development Scripts

- **`./dev.sh`** - Start the development server on port 8000
- **`./setup.sh`** - Set up the development environment (Python virtual environment, dependencies, pre-commit hooks)
- **`./sync.sh`** - Generate images and update the index (runs both `generate_images.py` and `generate_index.py`)

### Python Scripts

- **`./generate_index.py`** - Regenerate the recipe index
- **`./generate_images.py`** - Generate optimized images for recipes

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

## Development Setup

### First-time setup

Run the setup script to configure your development environment:

```bash
./setup.sh
```

This script will:
- Install the required Python version (3.13.1) using pyenv
- Create a virtual environment in `.venv/`
- Install dependencies from `requirements.txt`
- Install and configure pre-commit hooks

### Manual setup (alternative)

If you prefer to set up manually:

```bash
# Install dependencies
pip install -r requirements.txt

# Install pre-commit hooks
pip install pre-commit
pre-commit install
```

## Pre-commit hook

This repo includes a pre-commit hook that runs the generator and blocks commits if `docs/index.json` changes but is not staged.

The setup script automatically installs pre-commit hooks, or you can install them manually:

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
