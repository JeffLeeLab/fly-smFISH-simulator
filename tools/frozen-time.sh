#!/usr/bin/env bash
# Dead-stretch check for a recorded animation: samples the video at 12 frames per second and
# reports stretches where almost nothing changes (mean pixel change below a threshold). Note: the
# subtle ink boil (a ~1 px wobble) is often lost in the recording's compression, so a "frozen"
# stretch with only the boil running may still be alive on screen: check it with screenshots.
#
#   tools/frozen-time.sh <video.webm> [threshold, default 0.35] [min seconds, default 1.0]
#
# Prints the motion level per half second and any frozen stretches.
set -euo pipefail
video="$1"; thr="${2:-0.35}"; min="${3:-1.0}"
tmp="$(mktemp -d)"
ffmpeg -loglevel error -i "$video" -vf "fps=12,format=gray" "$tmp/f%05d.png"   # full resolution: the boil is a ~1 px wobble
uv run python - "$tmp" "$thr" "$min" <<'PY'
import sys
from pathlib import Path
import numpy as np
from PIL import Image
src, thr, min_s = Path(sys.argv[1]), float(sys.argv[2]), float(sys.argv[3])
frames = [np.asarray(Image.open(f), np.float32) for f in sorted(src.glob("f*.png"))]
diff = [float(np.mean(np.abs(b - a))) for a, b in zip(frames, frames[1:])]
fps = 12
print("motion per 0.5 s (mean |Δ| per frame, 0–255):")
for k in range(0, len(diff), fps // 2):
    seg = diff[k:k + fps // 2]
    print(f"  {k / fps:5.1f} s  {np.mean(seg):6.2f}  {'#' * int(min(60, np.mean(seg) * 20))}")
frozen, start = [], None
for i, d in enumerate(diff + [thr + 1]):
    if d < thr and start is None:
        start = i
    elif d >= thr and start is not None:
        if (i - start) / fps >= min_s:
            frozen.append((start / fps, i / fps))
        start = None
print("frozen stretches:" if frozen else f"no frozen stretch of {min_s} s or more")
for a, b in frozen:
    print(f"  {a:.1f}–{b:.1f} s ({b - a:.1f} s)")
PY
rm -rf "$tmp"
