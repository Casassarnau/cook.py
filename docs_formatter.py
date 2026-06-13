#!/usr/bin/env python3
"""Format JSON, HTML, JavaScript, and CSS under docs/."""

from __future__ import annotations

import json
import sys
from collections.abc import Callable
from pathlib import Path

import cssbeautifier
import jsbeautifier
from djhtml.modes import DjHTML, MaxLineLengthExceeded

INDENT = 2
DOCS_DIR = Path("docs")


def _js_options() -> jsbeautifier.BeautifierOptions:
    opts = jsbeautifier.default_options()
    opts.indent_size = INDENT
    opts.end_with_newline = True
    return opts


def _css_options() -> cssbeautifier.BeautifierOptions:
    opts = cssbeautifier.default_options()
    opts.indent_size = INDENT
    opts.end_with_newline = True
    return opts


def _write_if_changed(path: Path, formatted: str) -> bool:
    original = path.read_text(encoding="utf-8")
    if formatted == original:
        return False
    path.write_text(formatted, encoding="utf-8")
    return True


def format_json_file(path: Path) -> tuple[bool, str | None]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return False, f"line {exc.lineno}, col {exc.colno}: {exc.msg}"

    formatted = json.dumps(data, indent=INDENT, ensure_ascii=False)
    if not formatted.endswith("\n"):
        formatted += "\n"
    changed = _write_if_changed(path, formatted)
    return changed, None


def format_js_file(path: Path) -> tuple[bool, str | None]:
    formatted = jsbeautifier.beautify(path.read_text(encoding="utf-8"), _js_options())
    return _write_if_changed(path, formatted), None


def format_css_file(path: Path) -> tuple[bool, str | None]:
    formatted = cssbeautifier.beautify(path.read_text(encoding="utf-8"), _css_options())
    return _write_if_changed(path, formatted), None


def format_html_file(path: Path) -> tuple[bool, str | None]:
    source = path.read_text(encoding="utf-8")
    try:
        formatted = DjHTML(source).indent(INDENT)
    except MaxLineLengthExceeded:
        return False, "maximum line length exceeded"
    except Exception as exc:
        return False, str(exc)

    return _write_if_changed(path, formatted), None


def _collect_files(root: Path, pattern: str) -> list[Path]:
    if not root.exists():
        return []
    return sorted(root.glob(pattern))


def _format_files(
    label: str,
    files: list[Path],
    formatter: Callable[[Path], tuple[bool, str | None]],
) -> tuple[int, int, int]:
    if not files:
        print(f"🤷 No {label} files found.")
        return 0, 0, 0

    print(f"🔍 Found {len(files)} {label} file(s). Starting format...\n")

    changed_count = 0
    unchanged_count = 0
    fail_count = 0

    for file_path in files:
        try:
            changed, error = formatter(file_path)
        except Exception as exc:
            print(f"❌ Unexpected error with {file_path}: {exc}")
            fail_count += 1
            continue

        if error:
            print(f"❌ Failed to format: {file_path}")
            print(f"   ↳ {error}")
            fail_count += 1
            continue

        if changed:
            print(f"✨ Formatted: {file_path}")
            changed_count += 1
        else:
            unchanged_count += 1

    return changed_count, unchanged_count, fail_count


def format_docs() -> int:
    totals = {"changed": 0, "unchanged": 0, "failed": 0}

    targets: list[tuple[str, list[Path], Callable[[Path], tuple[bool, str | None]]]] = [
        ("JSON", _collect_files(DOCS_DIR / "recipes", "*.json"), format_json_file),
        ("JSON", _collect_files(DOCS_DIR / "translations", "*.json"), format_json_file),
        ("JavaScript", _collect_files(DOCS_DIR, "**/*.js"), format_js_file),
        ("CSS", _collect_files(DOCS_DIR, "**/*.css"), format_css_file),
        ("HTML", _collect_files(DOCS_DIR, "**/*.html"), format_html_file),
    ]

    for label, files, formatter in targets:
        if not files:
            continue
        changed, unchanged, failed = _format_files(label, files, formatter)
        totals["changed"] += changed
        totals["unchanged"] += unchanged
        totals["failed"] += failed
        if changed or failed:
            print()

    print("--- Summary ---")
    print(f"✅ Formatted: {totals['changed']} file(s)")
    if totals["unchanged"]:
        print(f"👍 Already formatted: {totals['unchanged']} file(s)")
    if totals["failed"]:
        print(f"⚠️ Failed: {totals['failed']} file(s)")

    return 1 if totals["failed"] else 0


if __name__ == "__main__":
    sys.exit(format_docs())
