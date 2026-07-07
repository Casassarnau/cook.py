# Recipes

A minimal static recipe book powered by HTML + Alpine.js. Recipes are JSON files under `docs/recipes/`, and a generated `docs/index.json` provides the homepage listing and filtering.

## Quick start

```bash
./setup.sh        # first time: installs tools + deps + hooks
./dev.sh          # then open http://localhost:8000
```

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) — How to add a recipe, development setup, scripts, and pre-commit hooks.
- [SCHEMA.md](SCHEMA.md) — Complete recipe JSON schema, field descriptions, units, categories, and portion types.
- [AGENTS.md](AGENTS.md) — Compact guide for AI agents working in this repo.
- `prompt.md` — Recipe-to-JSON conversion prompt; authoritative dictionary of valid `ingredient`, `unit`, and `category` keys.

## Example

See `recipe_example.json` at the repository root for a ready-to-copy template. Note: it uses the legacy `servings` field; new recipes should use the `portion` object (see [SCHEMA.md](SCHEMA.md)).
