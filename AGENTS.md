# smFISH Simulator

A teaching web app: final-year students design two-colour smFISH probes and read simulated confocal images of *Drosophila* neurons in a TDP-43 ALS model. A static site with no build step.

## Sources of truth

- `PRODUCT.md`: users, purpose, constraints, brand commitments. The site must never give the answer away.
- `docs/spec.md`: pedagogy, case truth tables, simulation parameters, screen spec, stack.
- `docs/style-directions/tokens.css` and `Style directions review.md`: the frozen visual direction.
- `docs/mockups/` and `docs/style-directions/` are design records and are not served.

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
- Then run `impeccable embed-prompt <image> --prompt "<exact prompt>"`, and write any `.json` sidecar that Impeccable asks for.
- Reference images (comp crops, page screenshots): give the path in the prompt. This is untested, so check that the result follows the reference.
- `buildPath` in `.impeccable/config.json` is `code`. Comp-first runs only if the user flips the toggle or changes that value.
