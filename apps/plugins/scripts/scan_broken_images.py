#!/usr/bin/env python3
"""Scan plugin trees for string-literal image paths that do not resolve to files."""

from __future__ import annotations

import re
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PLUGINS_DIR = SCRIPT_DIR.parent

PLUGIN_ROOTS = (
    PLUGINS_DIR / "magento",
    PLUGINS_DIR / "prestashop",
    PLUGINS_DIR / "woo",
)

SKIP_DIRS = {
    "node_modules",
    "dist",
    "build",
    "vendor",
    ".git",
    "languages",
}

IMAGE_REF = re.compile(
    r"""['"](?:[^'"]*/)?([^'"/]+\.(?:webp|svg|png|jpe?g|gif))['"]""",
    re.IGNORECASE,
)

# Known dynamic slugs assembled at runtime (Magento CheckoutBranding).
DYNAMIC_SLUGS = {
    "pay-with-lomi",
    "wave",
    "mtn",
    "apple-pay",
    "google-pay",
    "spi",
    "secured-by-lomi",
}


def iter_source_files(root: Path):
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.suffix.lower() not in {".php", ".js", ".jsx", ".ts", ".tsx", ".css", ".html", ".tpl", ".phtml"}:
            continue
        yield path


def candidate_paths(plugin_root: Path, filename: str) -> list[Path]:
    name = filename.lower()
    hits: list[Path] = []
    for sub in (
        "view/frontend/web/images",
        "views/img",
        "views/images",
        "assets/images",
        "assets",
        "images",
    ):
        candidate = plugin_root / sub / Path(filename).name
        if candidate.is_file():
            hits.append(candidate)
    for found in plugin_root.rglob(Path(filename).name):
        if found.is_file() and "node_modules" not in found.parts:
            hits.append(found)
    return hits


def scan_plugin(plugin_root: Path) -> list[str]:
    errors: list[str] = []
    if not plugin_root.is_dir():
        return [f"missing plugin directory: {plugin_root}"]

    for source in iter_source_files(plugin_root):
        try:
            text = source.read_text(encoding="utf-8", errors="ignore")
        except OSError as exc:
            errors.append(f"unreadable {source}: {exc}")
            continue

        for match in IMAGE_REF.finditer(text):
            filename = match.group(1)
            if filename.startswith("}") or "{" in filename:
                continue
            stem = Path(filename).stem
            if stem in DYNAMIC_SLUGS:
                continue
            if not candidate_paths(plugin_root, filename):
                errors.append(f"{source}: missing image asset for {filename!r}")

    return errors


def main() -> int:
    all_errors: list[str] = []
    for root in PLUGIN_ROOTS:
        label = root.name
        errors = scan_plugin(root)
        if errors:
            all_errors.extend([f"[{label}] {err}" for err in errors])
        else:
            print(f"PASS: {label} image references resolve")

    if all_errors:
        print("FAIL: broken image references detected:", file=sys.stderr)
        for err in all_errors:
            print(err, file=sys.stderr)
        return 1

    print("PASS: all plugin image references resolve")
    return 0


if __name__ == "__main__":
    sys.exit(main())
