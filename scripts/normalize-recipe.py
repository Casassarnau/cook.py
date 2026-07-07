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

Usage:
    uv run python scripts/normalize-recipe.py docs/recipes/*.json
"""

import json
import sys
from pathlib import Path


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
                group_name = ing.get("group", {}).get("en", "")
                items = ing.get("items", [])
                first_id = items[0].get("id", "") if items else ""
                return (group_name, first_id, "")
            return ("", ing.get("id", ""), "")

        recipe["ingredients"].sort(key=ingredient_sort_key)

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
    if "onlyForVariation" in ing:
        ing["onlyForVariation"] = _normalize_scoping(ing["onlyForVariation"])


def _normalize_scoping(value):
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return sorted(value)
    return value


def format_json(obj):
    return json.dumps(obj, indent=2, ensure_ascii=False) + "\n"


def main():
    paths = sys.argv[1:]
    if not paths:
        print("Usage: normalize-recipe.py <recipe.json> [...]")
        sys.exit(1)

    for pattern in paths:
        for p in Path().glob(pattern) if "*" in pattern else [Path(pattern)]:
            if not p.exists():
                print(f"  \u2716 {p}: not found")
                continue

            original = p.read_text()
            recipe = json.loads(original)
            normalize(recipe)
            normalized = format_json(recipe)

            if original == normalized:
                print(f"  \u2713 {p.name}: already normalized")
            else:
                p.write_text(normalized)
                print(f"  \u270e {p.name}: normalized")


if __name__ == "__main__":
    main()
