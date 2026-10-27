#!/usr/bin/env bash
# Retakes the annotated screenshots in the Webapp usage guide (site/guide/img/*.webp). The shots,
# the example notebook and the numbered boxes are listed in tools/guide-shots.js; the numbers
# match the numbered lists in site/guide/guide.md.
#
#   tools/guide-shots.sh
#
# Needs the site served (uv run python tools/serve.py) and playwright-cli on PATH.
set -euo pipefail
repo="$(pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
# playwright-cli reads and writes files only under the folder the session was opened in
cp tools/guide-shots.js "$tmp/"
cd "$tmp"
playwright-cli kill-all >/dev/null 2>&1 || true
playwright-cli open about:blank >/dev/null
log="$(playwright-cli run-code --filename guide-shots.js 2>&1 || true)"
playwright-cli kill-all >/dev/null 2>&1 || true
if ! grep -q '^### Result' <<<"$log"; then
  echo "guide-shots: the screenshots failed:" >&2
  sed -n '1,12p' <<<"$log" >&2
  exit 1
fi
grep -A1 '^### Result' <<<"$log" | tail -1
cd "$repo"
mkdir -p site/guide/img
uv run python - "$tmp" site/guide/img <<'PY'
import sys
from pathlib import Path
from PIL import Image
src, dst = Path(sys.argv[1]), Path(sys.argv[2])
for png in sorted(src.glob("*.png")):
    out = dst / f"{png.stem}.webp"
    Image.open(png).convert("RGB").save(out, "WEBP", quality=82, method=6)
    print(f"{out}  {out.stat().st_size // 1024} KB")
PY
