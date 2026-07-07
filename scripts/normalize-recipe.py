#!/usr/bin/env python3
"""
Normalize a cook.py recipe JSON: sort fields where order doesn't matter.

What gets sorted:
  - categories          alphabetically
  - variants            by key
  - ingredients         by id (or group + id for grouped)
  - onlyForVariation    arrays within ingredients
  - ingredient refs     arrays within instruction steps

What is NOT touched:
  - instructions        order matters (steps are sequential)
  - text fields         keep as-authored
  - top-level field order (style preference, not enforced here)

Usage:
    uv run python scripts/normalize-recipe.py docs/recipes/*.json
    uv run python scripts/normalize-recipe.py docs/recipes/gazpacho.json
"""

import json
import sys
from pathlib import Path


def sort_key(obj):
    """Return a stable sort key for any JSON value."""
    if isinstance(obj, dict):
        return sorted((k, sort_key(v)) for k, v in obj.items())
    if isinstance(obj, list):
        return [sort_key(x) for x in obj]
    return obj


def normalize(recipe):
    """Normalize a recipe dict in-place."""

    # 1. Categories - sort alphabetically
    if "categories" in recipe and isinstance(recipe["categories"], list):
        recipe["categories"].sort()

    # 2. Variants - sort by key alphabetically
    if "variants" in recipe and isinstance(recipe["variants"], list):
        recipe["variants"].sort(key=lambda v: v.get("key", ""))

    # 3. Ingredients - sort by id
    if "ingredients" in recipe and isinstance(recipe["ingredients"], list):
        def ingredient_sort_key(ing):
            if "group" in ing:
                # Grouped ingredients: sort by group name, then by items' ids
                group_name = ing.get("group", {}).get("en", "")
                items = ing.get("items", [])
                first_id = items[0].get("id", "") if items else ""
                return (group_name, first_id, "")
            return ("", ing.get("id", ""), "")

        recipe["ingredients"].sort(key=ingredient_sort_key)

        # Normalize within each ingredient
        for ing in recipe["ingredients"]:
            _normalize_ingredient(ing)
            if "group" in ing and "items" in ing:
                ing["items"].sort(key=lambda i: i.get("id", ""))
                for item in ing["items"]:
                    _normalize_ingredient(item)

    # 4. Instruction ingredient refs - sort alphabetically
    if "instructions" in recipe and isinstance(recipe["instructions"], list):
        for step in recipe["instructions"]:
            if "ingredients" in step and isinstance(step["ingredients"], list):
                step["ingredients"].sort()
            if "onlyForVariation" in step:
                step["onlyForVariation"] = _normalize_scoping(step["onlyForVariation"])

    return recipe


def _normalize_ingredient(ing):
    """Sort within an ingredient object where order doesn't matter."""
    if "onlyForVariation" in ing:
        ing["onlyForVariation"] = _normalize_scoping(ing["onlyForVariation"])


def _normalize_scoping(value):
    """Normalize onlyForVariation to a sorted array."""
    if isinstance(value, str):
        return value  # single string is fine
    if isinstance(value, list):
        return sorted(value)
    return value


def format_json(obj):
    """Format JSON with 2-space indent, trailing newline, and consistent key order."""
    return json.dumps(obj, indent=2, ensure_ascii=False) + "\n"


def main():
    paths = sys.argv[1:]
    if not paths:
        print("Usage: normalize-recipe.py <recipe.json> [...]")
        sys.exit(1)

    for pattern in paths:
        for p in Path().glob(pattern) if "*" in pattern else [Path(pattern)]:
            if not p.exists():
                print(f"❌ {p}: not found")
                continue

            original = p.read_text()
            recipe = json.loads(original)
            normalize(recipe)
            normalized = format_json(recipe)

            if original == normalized:
                print(f"  ✓ {p.name}: already normalized")
            else:
                p.write_text(normalized)
                print(f"  ✎ {p.name}: normalized")


if __name__ == "__main__":
    main()
