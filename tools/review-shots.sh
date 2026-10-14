#!/usr/bin/env bash
# Review screenshots (spec, Phase 1 review loop): every step of a case at 1280×720 and 1920×1080,
# light and dark, with a filled-in notebook so the gated steps open and the first-run tours
# marked as seen. Animated steps are frozen at their end frames (?t=). Steps 3 and 6 are also
# shot in full screen (step 6 with the plot open); a scripted click is not a user gesture, so
# that is the page's own full view, without the browser's. Writes one PNG per state and one
# sheet per state (light | dark, small | large).
#
#   tools/review-shots.sh <out-dir> [case]     case: pdf (default), mb or nmj
#
# Needs the site served (uv run python tools/serve.py) and playwright-cli on PATH.
set -euo pipefail
out_arg="$1"; case="${2:-pdf}"
# Per-case notebook state and step routes (the step-2 retimes are the animation end frames).
case "$case" in
  pdf)
    state='{"visited":[1,2,3,4,5,6,7],"clue":{"observation":"TDP-43 looks dimmer in the mutant nuclei.","interpretation":"Less TDP-43 may reach the nucleus."},"shortlist":["splicing","transport"],"because":{},"pair":{"ch1":"F6","ch2":"F5"},"predictions":{},"features":"","results":{"observation":"","interpretation":""},"verdicts":{"splicing":"ruled-out","transport":"unresolved"},"evidence":{},"claim":"","uncertainty":{"mode":"","why":""}}'
    routes=("?t=9.6#/" "?t=15.3#/$case/step-1" "?t=6.6#/$case/step-2" "?t=10.1#/$case/step-2" "?t=14#/$case/step-2"
            "#/$case/step-3" "#/$case/step-4" "#/$case/step-5" "#/$case/step-6" "#/$case/step-7")
    ;;
  mb)
    # Neutral review state: both hypotheses unresolved, so no verdict is given away.
    state='{"visited":[1,2,3,4,5,6,7],"clue":{"observation":"TDP-43 looks dimmer in the mutant nuclei.","interpretation":"Less TDP-43 may reach the nucleus."},"shortlist":["isoform","transport"],"because":{},"pair":{"ch1":"U2","ch2":"U4"},"predictions":{},"features":"","results":{"observation":"","interpretation":""},"verdicts":{"isoform":"unresolved","transport":"unresolved"},"evidence":{},"claim":"","uncertainty":{"mode":"","why":""}}'
    routes=("?t=9.6#/" "?t=15.3#/$case/step-1" "?t=6.6#/$case/step-2" "?t=10.1#/$case/step-2" "?t=14#/$case/step-2"
            "#/$case/step-3" "#/$case/step-4" "#/$case/step-5" "#/$case/step-6" "#/$case/step-7")
    ;;
  nmj)
    # Neutral review state, as for mb: the one-probe pair S7 + S8 and two hypotheses, both unresolved.
    state='{"visited":[1,2,3,4,5,6,7],"clue":{"observation":"TDP-43 looks dimmer in the mutant nuclei and brighter along the axon.","interpretation":"TDP-43 may be held up on its way down the axon."},"shortlist":["transport","isoform"],"because":{},"pair":{"ch1":"S7","ch2":"S8"},"predictions":{},"features":"","results":{"observation":"","interpretation":""},"verdicts":{"transport":"unresolved","isoform":"unresolved"},"evidence":{},"claim":"","uncertainty":{"mode":"","why":""}}'
    routes=("?t=9.6#/" "?t=15.3#/$case/step-1" "?t=6.6#/$case/step-2" "?t=10.1#/$case/step-2" "?t=14#/$case/step-2"
            "#/$case/step-3" "#/$case/step-4" "#/$case/step-5" "#/$case/step-6" "#/$case/step-7")
    ;;
  *)
    echo "review-shots: unknown case '$case' (expected pdf, mb or nmj)" >&2
    exit 1
    ;;
esac
mkdir -p "$out_arg"
out="$(cd "$out_arg" && pwd)"
base="${REVIEW_URL:-http://localhost:8765/}"
names=(hero step1 step2-brain step2-labels step2-end step3 step4 step5 step6 step7)
repo="$(pwd)"
cd "$out"   # playwright-cli writes screenshots relative to where the session was opened
for theme in light dark; do
  for size in 1280x720 1920x1080; do
    playwright-cli kill-all >/dev/null 2>&1 || true
    playwright-cli open about:blank >/dev/null
    playwright-cli resize "${size%x*}" "${size#*x}" >/dev/null
    playwright-cli goto "$base" >/dev/null
    playwright-cli localstorage-set smfish:theme "$theme" >/dev/null
    playwright-cli localstorage-set "smfish:v1:case:$case" "$state" >/dev/null
    for k in viewer legend; do playwright-cli localstorage-set "smfish:v1:tour:$k" true >/dev/null; done
    for i in "${!names[@]}"; do
      playwright-cli goto about:blank >/dev/null
      playwright-cli goto "$base${routes[$i]}" >/dev/null
      sleep "${REVIEW_WAIT:-3}"
      playwright-cli screenshot --filename="${names[$i]}-$theme-$size.png" >/dev/null
    done
    for st in 3 6; do
      plot=""; [ "$st" = 6 ] && plot="document.querySelector('.results__toggle').click();"
      playwright-cli goto about:blank >/dev/null
      playwright-cli goto "$base#/$case/step-$st" >/dev/null
      sleep "${REVIEW_WAIT:-3}"
      playwright-cli eval "() => { document.querySelector('[data-act=full]').click(); $plot return 1; }" >/dev/null
      sleep 1.5
      playwright-cli screenshot --filename="step$st-full-$theme-$size.png" >/dev/null
    done
  done
done
playwright-cli kill-all >/dev/null 2>&1 || true
cd "$repo"
uv run python - "$out" "${names[@]}" step3-full step6-full <<'PY'
import sys
from pathlib import Path
from PIL import Image, ImageDraw
out, names = Path(sys.argv[1]), sys.argv[2:]
for n in names:
    cells = [(t, s) for t in ("light", "dark") for s in ("1280x720", "1920x1080")]
    ims = [Image.open(out / f"{n}-{t}-{s}.png").convert("RGB").resize((960, 540), Image.LANCZOS) for t, s in cells]
    sheet = Image.new("RGB", (2 * 960 + 36, 2 * (540 + 24) + 12), (40, 39, 36))
    d = ImageDraw.Draw(sheet)
    for k, ((t, s), im) in enumerate(zip(cells, ims)):
        x, y = 12 + (k % 2) * 972, 12 + (k // 2) * 564
        sheet.paste(im, (x, y))
        d.text((x, y + 544), f"{n} · {t} · {s}", fill=(232, 230, 220))
    sheet.save(out / f"sheet-{n}.png")
print(f"wrote {len(names)} sheets to {out}")
PY
