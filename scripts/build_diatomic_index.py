"""Build the diatomic index JSON file from diatomic curve files.

Scans data/physicality/diatomics/curves/{model}/{pair}.json and builds
a reverse index mapping element pairs -> list of models.

Output: data/physicality/diatomics/diatomic_index.json
"""

from __future__ import annotations

import json
from pathlib import Path


def build_index(curves_dir: Path) -> dict[str, list[str]]:
    """Build pair -> [model1, model2, ...] index from curves directory.

    Args:
        curves_dir: Path to data/physicality/diatomics/curves/

    Returns:
        Dict mapping element pair string (e.g. 'H-H') to sorted list of model ids.
    """
    index: dict[str, list[str]] = {}

    if not curves_dir.exists():
        print(f"ERROR: curves directory not found: {curves_dir}")
        return index

    model_dirs = sorted(d for d in curves_dir.iterdir() if d.is_dir())
    print(f"Found {len(model_dirs)} model directories")

    for model_dir in model_dirs:
        model_id = model_dir.name
        pair_files = list(model_dir.glob("*.json"))
        for pair_file in pair_files:
            pair = pair_file.stem  # e.g. "H-H" from "H-H.json"
            if pair not in index:
                index[pair] = []
            index[pair].append(model_id)

    # Sort model lists for deterministic output
    for pair in index:
        index[pair].sort()

    return index


def main() -> None:
    """Main entry point: build index and write to output file."""
    project_root = Path(__file__).parent.parent
    curves_dir = project_root / "data" / "physicality" / "diatomics" / "curves"
    output_file = project_root / "data" / "physicality" / "diatomics" / "diatomic_index.json"

    print(f"Scanning: {curves_dir}")
    index = build_index(curves_dir)

    if not index:
        print("No pairs found — exiting without writing output.")
        return

    output_file.write_text(json.dumps(index, sort_keys=True, indent=None))

    # Summary
    total_pairs = len(index)
    max_models = max(len(v) for v in index.values())
    min_models = min(len(v) for v in index.values())
    avg_models = sum(len(v) for v in index.values()) / total_pairs

    print(f"Written: {output_file}")
    print(f"Total pairs: {total_pairs}")
    print(f"Models per pair: min={min_models}, max={max_models}, avg={avg_models:.1f}")
    print(f"Sample pairs: {list(index.keys())[:5]}")


if __name__ == "__main__":
    main()
