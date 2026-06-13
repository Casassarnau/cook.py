#!/usr/bin/env python3
"""Backward-compatible entry point for docs_formatter."""

from docs_formatter import format_docs

if __name__ == "__main__":
    raise SystemExit(format_docs())
