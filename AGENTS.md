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
- **Local server:** `uv run python -m http.server -d site`. Always test over HTTP, never from `file://`.
- **Browser checks:** `playwright-cli` (a global install, not a project dependency) for screenshots, window sizes (`resize 1280 720`), video recordings (`video-start` / `video-stop`) and the offline test (`network-state-set offline`).
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
