# smFISH Simulator

A teaching web app: final-year students design two-colour smFISH probes and read simulated confocal images of *Drosophila* neurons in a TDP-43 ALS model. A static site with no build step.

## Sources of truth

- `PRODUCT.md`: users, purpose, constraints, brand commitments. The site must never give the answer away.
- `docs/spec.md`: pedagogy, case truth tables, simulation parameters, screen spec, stack.
- `docs/style-directions/tokens.css` and `Style directions review.md`: the frozen visual direction.
- `docs/transcript_models_R6.json`: transcript models and probe menus. Probe IDs follow the spec's menus (numbered 5′→3′); if the two disagree, the spec wins.
- `docs/mockups/` and `docs/style-directions/` are design records and are not served.

## Tooling

- **Python is managed with uv.** The generator and every build script run in this repo's uv environment (`pyproject.toml`, `uv.lock`, Python 3.14). Set up with `uv sync`, run with `uv run <script>`, and add dependencies with `uv add <package>` so `uv.lock` stays in step. Don't use `pip`, the system `python3` or a hand-made venv.
- **Local server:** `uv run python tools/serve.py` (http://localhost:8765). It sends `Cache-Control: no-store`; plain `python -m http.server` doesn't, and browsers then mix new and cached old files after edits (steps fail to load, new elements appear unstyled). Always test over HTTP, never from `file://`.
- **Generated data:** the site only reads files in `site/data/`, written by scripts in `generator/`. Commit the output; the Pages workflow fails if it is out of date. Truth tables and private molecule records go in `data/`, which is never served. For a case, in order:
  - `uv run python -m generator.public_models` (transcript maps without the answer key)
  - `uv run python -m generator.geometry_pdf` (geometry for every genotype and animal; one script per case)
  - `uv run python -m generator.truth_table pdf` (expands `data/pdf/truth-table.toml`)
  - `uv run python -m generator.build pdf` (chooses the animals, places molecules, renders images, writes tables; about a minute)
  - `uv run python -m generator.validate pdf --signed` (the gate; fails on any mismatch or an unsigned truth table)
  - Mushroom body (`mb`), same order: `uv run python -m generator.connectome_mb` first (once: downloads 450 Kenyon cells from the public MaleCNS bucket into `data/mb/connectome/`, not committed), then `generator.geometry_mb` (six geometry files plus `site/data/mb/anatomy.json`; add `--sketch docs/references/mb-compartment-sketch.png` for the compartment sketch), `generator.truth_table mb`, `generator.build mb` (about 2 minutes) and `generator.validate mb --signed`.
  - Leg motor neuron (`nmj`), same order: `uv run python -m generator.connectome_nmj` first (once: downloads the MaleCNS tags and a sample of front-leg motor neuron skeletons into `data/nmj/connectome/`, not committed, and writes a contact sheet there), then `generator.geometry_nmj` (six geometry files plus `site/data/nmj/anatomy.json` for the descent and the step 7 locator; add `--sketch docs/references/nmj-compartment-sketch.png` for the compartment sketch), `generator.truth_table nmj`, `generator.build nmj` (about a minute) and `generator.validate nmj --signed`.
  - `tools/pdf-identical.sh` re-runs the Pdf pipeline and fails unless the output is byte-identical (hashes in `tools/pdf-baseline.sha256`); run it after any change to shared generator code.
  - The Pages workflow gates `CASES: "pdf mb nmj"`: add a case there only once its truth table is signed off.
- **Story artwork:** `uv run python -m generator.flies` (fly drawings from flybody; downloads the meshes into `data/flybody/`, not committed) and `uv run python -m generator.textures` (paper grain and watercolour washes). Both write into `site/`. The dorsal fly sprite has a `flap` sequence (three wingbeat drawings, without wing veins) that extends past the sprite's viewBox, which the fly on the ground sets. The side-view sprite has a `tremor` sequence (the leg motor neuron mutants), and `fly-turned.svg` is the side view turned 20° towards us (that case's descent and locator). `generator.flies <view> …` rebuilds only the views named (the whole set takes about 6 minutes).
- **Animation review:** `tools/contact-sheet.sh '<url with {t}>' out.png <times…>` renders frames through the page's frozen-time mode (`?t=` seconds) and tiles them; `tools/frozen-time.sh <video.webm>` reports dead stretches in a `playwright-cli` recording (the subtle ink boil can vanish in video compression, so confirm "frozen" holds with screenshots).
- **Browser checks:** `playwright-cli` (a global install, not a project dependency) for screenshots, window sizes (`resize 1280 720`), video recordings (`video-start` / `video-stop`) and the offline test (`network-state-set offline`; or list `performance.getEntriesByType('resource')` and check that every URL is local). Sessions start with empty localStorage, so seed the notebook state before testing gated steps. `tools/review-shots.sh <out-dir> [pdf|mb|nmj]` does this for the whole review set of a case (Pdf by default): every step at 1280×720 and 1920×1080 in both themes, animations at their end frames (the descent also at `?t=6.6`, with the whole brain on screen), steps 3 and 6 also in full screen (step 6 with the plot open), one sheet per screen. `tools/shot-diff.py` gives a pixel diff of two review-shot folders. Each review run is logged in `docs/review.md`.
- **The public repo is fine.** The answer key in `docs/` is readable on GitHub, and that is accepted. What matters is that the site never serves it, so keep stripping `mature_in`, `nascent_in` and `also_detects` from the public JSON.

## Image generation (Impeccable comps and plates)

Claude Code has no native image tool here, and `impeccable generate-image` fails because no OpenAI key is set. Antigravity is this project's image tool. Whenever Impeccable calls for "the harness-native image tool", use:

```sh
mkdir -p <out-dir>
agy-delegate --tier flash --yolo --dir <out-dir> --timeout 8m \
  "Use your built-in generate_image tool to create: <prompt>. Save it as <out-dir>/<name>.png. \
Do not draw it with code (no PIL, SVG or ImageMagick). Write nothing else. Reply: IMAGE_TOOL_USED, FILE."
```

- `--yolo` is required. Under `--mode plan`, agy hides `generate_image` and reports that it has none, and `agy models` lists no image models. Neither means that image generation is unavailable.
- The build thread writes every prompt, because Impeccable comps are never delegated. agy only renders them.
- Save under `.impeccable/mocks/` as Impeccable directs.
- Verify each file yourself: it exists, `sips` reports a PNG of the expected size, and it looks right when opened. A code-drawn image is a failure, not a comp.
- Then run `impeccable embed-prompt <image> --prompt "<exact prompt>"`, and write any `.json` sidecar that Impeccable asks for. `impeccable` isn't on PATH: call it as the Impeccable skill does, at `<skill dir>/scripts/impeccable`.
- Reference images (comp crops, page screenshots): give the path in the prompt. This is untested, so check that the result follows the reference.
- `buildPath` in `.impeccable/config.json` is `code`. Comp-first runs only if the user flips the toggle or changes that value.
