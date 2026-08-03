#!/usr/bin/env python3
"""Add the local Qwen entry to Codex's bundled model catalog."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    entry_path = root / "config" / "model-catalog-entry.json"
    output_path = root / "config" / "merged-model-catalog.json"

    result = subprocess.run(
        ["codex", "debug", "models", "--bundled"],
        check=True,
        capture_output=True,
        text=True,
    )
    catalog = json.loads(result.stdout)
    entry = json.loads(entry_path.read_text(encoding="utf-8"))
    models = catalog.setdefault("models", [])
    catalog["models"] = [
        model for model in models if model.get("slug") != entry["slug"]
    ]
    catalog["models"].append(entry)
    output_path.write_text(
        json.dumps(catalog, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {output_path} with {len(catalog['models'])} models.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, subprocess.CalledProcessError, json.JSONDecodeError) as error:
        print(f"Could not build the model catalog: {error}", file=sys.stderr)
        raise SystemExit(1) from error
