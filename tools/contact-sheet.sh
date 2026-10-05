#!/usr/bin/env bash
# Contact sheet for an animation: renders frames at chosen times (via the page's frozen-time
# mode, ?t=<seconds>) with playwright-cli and tiles them into one PNG, each labelled with its time.
#
#   tools/contact-sheet.sh <url containing {t}> <out.png> <t1> <t2> ...
#   tools/contact-sheet.sh 'http://localhost:8765/?t={t}#/' hero.png 0 0.8 1.6 2.6 3.6 4.6 5.4 6.2 7.0 8.0
#
# Needs the site served (uv run python tools/serve.py) and playwright-cli on PATH.
set -euo pipefail
url="$1"; out="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"; shift 2
size="${SHEET_SIZE:-1280x720}"
tmp="$(mktemp -d)"
repo="$(pwd)"
cd "$tmp"   # playwright-cli writes screenshots relative to where the session was opened
playwright-cli kill-all >/dev/null 2>&1 || true
playwright-cli open about:blank >/dev/null
playwright-cli resize "${size%x*}" "${size#*x}" >/dev/null
i=0
for t in "$@"; do
  playwright-cli goto "${url//\{t\}/$t}" >/dev/null
  sleep "${SHEET_WAIT:-2.2}"
  playwright-cli screenshot --filename="$(printf %03d $i)_$t.png" >/dev/null
  i=$((i + 1))
done
playwright-cli kill-all >/dev/null 2>&1 || true
cd "$repo"
uv run python - "$tmp" "$out" <<'PY'
import sys
from pathlib import Path
from PIL import Image, ImageDraw
src, out = Path(sys.argv[1]), sys.argv[2]
frames = sorted(src.glob("*.png"))
ims = [Image.open(f).convert("RGB") for f in frames]
w, h = ims[0].size
cols = 3 if len(ims) > 4 else len(ims)
scale = 0.42
tw, th = int(w * scale), int(h * scale)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw + (cols + 1) * 12, rows * (th + 26) + 12), (40, 39, 36))
d = ImageDraw.Draw(sheet)
for k, (f, im) in enumerate(zip(frames, ims)):
    x, y = 12 + (k % cols) * (tw + 12), 12 + (k // cols) * (th + 26)
    sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y))
    d.text((x, y + th + 5), f"t = {f.stem.split('_', 1)[1]} s", fill=(232, 230, 220))
sheet.save(out)
print(f"wrote {out} ({len(ims)} frames)")
PY
rm -rf "$tmp"
