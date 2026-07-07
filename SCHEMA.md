# Recipe JSON Schema

Complete reference for recipe JSON files under `docs/recipes/`. For the conversion prompt and authoritative dictionary of valid keys, see `prompt.md`.

## Complete Schema

```json
{
  // REQUIRED FIELDS
  "title": { "en": "Recipe Name", "es": "Nombre de la Receta", "cat": "Nom de la Recepta", "sv": "Receptnamn" },
  "categories": ["mains", "desserts"],
  "image": "/images/recipe/main.webp",
  "description": {
    "en": "Recipe description in English.",
    "es": "Descripción de la receta en español.",
    "cat": "Descripció de la recepta en català.",
    "sv": "Receptbeskrivning på svenska."
  },
  "ingredients": [
    {
      "id": "unique_ingredient_id",
      "ingredient": "ingredient_key",
      "value": 250,
      "unit": "g",
      "text": { "en": "additional info", "es": "información adicional", "cat": "informació addicional", "sv": "ytterligare info" },
      "onlyForVariation": "variant_key"
    }
  ],
  // OR grouped ingredients:
  "ingredients": [
    {
      "group": {
        "en": "Group Name",
        "es": "Nombre del Grupo",
        "cat": "Nom del Grup",
        "sv": "Gruppnamn"
      },
      "items": [
        {
          "id": "unique_ingredient_id",
          "ingredient": "ingredient_key",
          "value": 250,
          "unit": "g",
          "text": { "en": "additional info", "es": "información adicional", "cat": "informació addicional", "sv": "ytterligare info" },
          "onlyForVariation": "variant_key"
        }
      ]
    }
  ],
  "instructions": [
    {
      "text": {
        "en": "Instruction text in English.",
        "es": "Texto de instrucción en español.",
        "cat": "Text d'instrucció en català.",
        "sv": "Instruktionstext på svenska."
      },
      "ingredients": ["unique_ingredient_id"],
      "onlyForVariation": "variant_key",
      "onlyForMode": "classic",
      "image": "/images/steps/step_image.webp",
      "thermomix": {
        "text": {
          "en": "Thermomix instruction text in English.",
          "es": "Texto Thermomix en español.",
          "cat": "Text Thermomix en català.",
          "sv": "Thermomix-instruktion på svenska."
        },
        "settings": {
          "temperature": 90,
          "time": 180,
          "speed": 2,
          "rotation": "reverse"
        }
      },
      "settings": {
        "temperature": 90,
        "time": 180,
        "speed": 2
      }
    }
  ],
  "instructionsThermomix": [
    {
      "text": {
        "en": "Optional full Thermomix-only instruction list.",
        "es": "Lista opcional completa de instrucciones Thermomix.",
        "cat": "Llista opcional completa d'instruccions Thermomix.",
        "sv": "Valfri komplett lista med Thermomix-instruktioner."
      },
      "settings": {
        "temperature": 90,
        "time": 180,
        "speed": 2
      }
    }
  ],

  // OPTIONAL FIELDS
  "author": "Author Name",
  "development": true,
  "portion": {
    "type": "servings",
    "value": 4,
    "unit": "servings"
  },
  // OR for area-based recipes:
  "portion": {
    "type": "area",
    "shape": "circular",
    "dimensions": {
      "diameter": 15,
      "unit": "cm"
    }
  },
  // OR for rectangular/square pans:
  "portion": {
    "type": "area",
    "shape": "rectangular",
    "dimensions": {
      "width": 20,
      "height": 20,
      "unit": "cm"
    }
  },
  "variants": [
    {
      "key": "variant_key",
      "name": {
        "en": "Variant Name",
        "es": "Nombre de Variante",
        "cat": "Nom de Variant",
        "sv": "Variantnamn"
      }
    }
  ]
}
```

## Field Descriptions

### Required Fields

- **`title`** (object): Recipe name in multiple languages. Must include `en` key.
- **`categories`** (array): Recipe categories. Must use keys from `docs/translations/*` under `cat.*`.
- **`image`** (string): Image path relative to `docs/` or full URL.
- **`description`** (object): Recipe description in multiple languages.
- **`ingredients`** (array): List of ingredient objects (see below).
- **`instructions`** (array): List of instruction objects (see below).

### Optional Fields

- **`author`** (string): Recipe author name.
- **`development`** (boolean): Set to `true` to mark a recipe as under development (being tested and modified). When set, a visual indicator will be displayed on the recipe.
- **`portion`** (object): Recipe yield information with type and configuration.
  - **`type`**: One of `"servings"`, `"units"`, `"diameter"`, or `"area"`
  - **`value`**: The numeric value (for servings, units, diameter types)
  - **`unit`**: The unit key (e.g., `"servings"`, `"cm"`, `"pizza"`, `"pan"`)
  - **`shape`**: For `type: "area"` - either `"circular"` or `"rectangular"` (or `"square"`)
  - **`dimensions`**: For `type: "area"` - object containing:
    - For circular: `{"diameter": 15, "unit": "cm"}`
    - For rectangular: `{"width": 20, "height": 20, "unit": "cm"}`
  - **`text`** (object, optional): Additional localized text (e.g., pan size)
- **`variants`** (array): Recipe variations with key and localized names.

### Ingredient Object Properties

- **`id`** (string, required): Unique identifier within the recipe. Referenced by instruction steps for cook mode.
- **`ingredient`** (string, required): Ingredient key from translations.
- **`value`** (number, required): Quantity (use 0 for "as needed").
- **`unit`** (string, optional): Unit key from translations (`g`, `kg`, `ml`, `l`, `servings`, `cm`, `as_needed`, `to_taste`).
- **`text`** (object, optional): Additional ingredient information in multiple languages.
- **`onlyForVariation`** (string|array, optional): Show ingredient only for specific variant(s).

### Ingredient Grouping

Ingredients can be organized into groups for better readability:

- **`group`** (object, optional): Group name in multiple languages. When present, ingredients are displayed in groups.
- **`items`** (array, required when using groups): Array of ingredient objects within the group.

**Legacy Support**: Recipes without groups continue to work as before. The system automatically detects whether ingredients are grouped or flat.

### Instruction Object Properties

- **`text`** (object, required): Instruction text in multiple languages.
- **`ingredients`** (array, optional): List of ingredient `id` values used in this step. In cook mode, only these ingredients are shown for the current step. Omit or leave empty when no ingredients are needed.
- **`onlyForVariation`** (string|array, optional): Show instruction only for specific variant(s).
- **`onlyForMode`** (string|array, optional): Show instruction only for `"classic"` or `"thermomix"`. Omit to show in both modes.
- **`image`** (string, optional): Step image path relative to `docs/` or full URL.
- **`thermomix`** (object, optional): Inline Thermomix override on a classic step. When the Thermomix toggle is on, `thermomix.text` replaces `text` and `thermomix.settings` are shown as badges. Steps without this block stay visible in both modes.
- **`settings`** (object, optional): Thermomix machine settings shown as badges when Thermomix mode is active. Used on steps inside `instructionsThermomix`, or on classic steps that only exist in Thermomix mode.
  - **`temperature`** (number): Temperature in °C.
  - **`time`** (number): Duration in seconds.
  - **`speed`** (number): Speed level.
  - **`rotation`** (string, optional): `"normal"` or `"reverse"`.

### Thermomix Instructions

Thermomix mode is optional and appears as a toggle next to the Instructions heading when a recipe provides Thermomix content. Classic recipes need no changes.

**Option A — inline override (best when most steps are shared):** add a `thermomix` block to individual steps in `instructions`:

```json
{
  "text": { "en": "Heat the milk in a separate pan." },
  "thermomix": {
    "text": { "en": "Heat milk 90°C / 3 min / speed 2." },
    "settings": { "temperature": 90, "time": 180, "speed": 2 }
  }
}
```

**Option B — separate list (best when the Thermomix flow is very different):** copy `instructions` to `instructionsThermomix` and edit the copy:

```json
"instructions": [ ... ],
"instructionsThermomix": [ ... ]
```

When `instructionsThermomix` exists, enabling Thermomix replaces the whole instruction list with that array. Otherwise the app uses inline `thermomix` overrides on the classic steps.

### Multilingual Fields

All text fields must be translated into 4 languages: English (`en`), Spanish (`es`), Catalan (`cat`), and Swedish (`sv`).

```json
{
  "en": "English text",
  "es": "Spanish text",
  "cat": "Catalan text",
  "sv": "Swedish text"
}
```

### Units

Available units (defined in `docs/translations/*` under `units.*`):
- `g` - grams
- `kg` - kilograms
- `ml` - milliliters
- `l` - liters
- `servings` - servings
- `cm` - centimeters (for diameter)
- `pizza` - pizzas
- `pan` - pans/baking dishes
- `as_needed` - as needed
- `to_taste` - to taste
- `tsp` - teaspoon
- `tbsp` - tablespoon

### Categories

Available categories (defined in `docs/translations/*` under `cat.*`):
- `mains` - Main dishes
- `desserts` - Desserts
- `snacks` - Snacks
- `drinks` - Drinks
- `baking` - Baking

**Never set `thermomix` manually** — `generate_index.py` auto-adds/removes it based on Thermomix instructions.

## Portion Types

The `portion` field describes how much the recipe yields:

1. **`type: "servings"`**: For recipes that serve multiple people
   - Example: `{"type": "servings", "value": 4, "unit": "servings"}`
   - User can adjust number of servings
   - Ingredients scale linearly with servings

2. **`type: "area"`**: For items with specific pan/baking dish dimensions
   - **`shape: "circular"`**: For round cakes and pies
     - Example: `{"type": "area", "shape": "circular", "dimensions": {"diameter": 15, "unit": "cm"}}`
     - User can adjust diameter (ingredients scale by area: π×radius²)
     - Display shows ø symbol and 🍰 emoji
   - **`shape: "rectangular"`** or **`"square"`**: For rectangular/square baking dishes
     - Example: `{"type": "area", "shape": "rectangular", "dimensions": {"width": 20, "height": 20, "unit": "cm"}}`
     - User can adjust dimensions (ingredients scale by area: width×height)
     - Display shows dimensions as "20×20 cm 📐"
   - Both area types scale ingredients proportionally to the baking dish area

3. **`type: "units"`**: For countable items like pizzas or batches
   - Example: `{"type": "units", "value": 1, "unit": "pizza"}`
   - User can adjust number of units
   - Ingredients scale linearly with units

4. **`type: "diameter"`**: Legacy format for circular items (still supported)
   - Example: `{"type": "diameter", "value": 15, "unit": "cm"}`
   - Use `type: "area"` with `shape: "circular"` for new recipes

## Important Notes

- **`generate_index.py`** reads the English `title` for `docs/index.json`. If `title` is an object, ensure it has an `en` key.
- **Categories** must exist in translations under `cat.*` (see `docs/translations/{en,es,cat,sv}.json`).
- **Ingredient keys** must be defined in translation files under `ingredients.*`.
- **Variants** are optional. When present, the UI shows a dropdown selector.
- **`onlyForVariation`** can be a string or array of strings to show content for specific variants.
- **Multilingual fields** fall back to English if the current language is not available.
- **Legacy support**: Old recipes using `servings`, `units`, and `diameter` (without `type`) still work for backwards compatibility.
