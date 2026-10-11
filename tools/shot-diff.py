#!/usr/bin/env python3
# Compare two directories of review screenshots (tools/review-shots.sh output) pixel by pixel.
# For each PNG present in both (top level only; sheet-*.png is ignored) it reports a size
# mismatch, how many pixels differ by more than --tol, and the largest difference. Files
# present on one side only are reported too. Exits 1 if anything differs or is missing.
#
#   uv run python tools/shot-diff.py <baseline-dir> <new-dir> [--tol 0] [--out <dir>]
#
# --out writes an amplified difference image per differing file (<name>-diff.png).
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image


def pngs(d: Path) -> dict[str, Path]:
    return {p.name: p for p in d.glob("*.png") if not p.name.startswith("sheet-")}


def main() -> int:
    ap = argparse.ArgumentParser(description="Pixel-compare two review screenshot directories.")
    ap.add_argument("baseline", type=Path)
    ap.add_argument("new", type=Path)
    ap.add_argument("--tol", type=int, default=0, help="largest channel difference allowed (default 0)")
    ap.add_argument("--out", type=Path, help="directory for amplified diff images")
    args = ap.parse_args()

    a, b = pngs(args.baseline), pngs(args.new)
    common = sorted(a.keys() & b.keys())
    missing = sorted(a.keys() ^ b.keys())
    failed = bool(missing) or not common
    if args.out:
        args.out.mkdir(parents=True, exist_ok=True)

    for name in common:
        ia = Image.open(a[name]).convert("RGBA")
        ib = Image.open(b[name]).convert("RGBA")
        if ia.size != ib.size:
            print(f"FAIL {name}: size {ia.size} != {ib.size}")
            failed = True
            continue
        # Largest absolute difference across R, G, B and A for each pixel.
        d = np.abs(np.asarray(ia, dtype=np.int16) - np.asarray(ib, dtype=np.int16)).max(axis=2)
        count = int((d > args.tol).sum())
        worst = int(d.max())
        if count == 0:
            print(f"ok   {name}: max diff {worst}")
            continue
        failed = True
        print(f"FAIL {name}: {count} px above tol {args.tol}, max diff {worst}")
        if args.out:
            # Scale so the largest difference is white; keeps faint ink-boil noise visible.
            amp = (d * 255 // max(worst, 1)).astype(np.uint8)
            Image.fromarray(amp, mode="L").save(args.out / f"{Path(name).stem}-diff.png")

    for name in missing:
        side = "baseline" if name in a else "new"
        print(f"FAIL {name}: only in {side} dir")
    if not common:
        print("FAIL no PNGs in common, nothing compared")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
