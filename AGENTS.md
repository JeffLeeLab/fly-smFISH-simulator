# smFISH Simulator

A teaching web app: final-year students design two-colour smFISH probes and read simulated confocal images of *Drosophila* neurons in a TDP-43 ALS model. A static site with no build step.

Three cases. The case ID is used in code, data paths and URLs: `pdf` (Pdf clock neurons, *futsch*, regions F1–F8), `mb` (mushroom body, *unc-13*, U1–U8) and `nmj` (leg motor neuron & NMJ, *stai*, S1–S8).

## Rules

- **Never give the answer away.** Check any student-facing text against `PRODUCT.md` (*Capabilities and Constraints*).
- **Only `site/` is served** (the Pages workflow uploads `path: site`). The answer key in `docs/` and `data/` is readable on GitHub, and that is accepted. Keep `mature_in`, `nascent_in` and `also_detects` out of the public JSON (`generator.public_models` refuses them).
- **Probe IDs are internal.** They follow the spec's menus, numbered 5′→3′; if `docs/transcript_models_R6.json` disagrees, the spec wins. Students see `regionLabel(id)` from `site/js/data.js` ("Region 6" for F6), never the raw ID.
- **Python only through uv** (Python 3.14): `uv sync`, `uv run …`, `uv add <package>`. No `pip`, system `python3` or hand-made venv.
- **Test over HTTP with `uv run python tools/serve.py`** (http://localhost:8765). It sends `Cache-Control: no-store`; `python -m http.server` doesn't, and browsers then mix new and cached files. Never use `file://`.
- **Write British English** (colour, centre, behaviour) in docs, comments, commit messages and student-facing text. Keep US spelling only where code requires it (CSS `color`, API names).
- **Keep this file current:** update the code map when you add, rename or split a file.

## Delegation

- **Search with Haiku.** Explore and search the codebase through Haiku subagents (in Claude Code: the Agent tool with `model: "haiku"`; the Explore type for read-only work).
- **Give simple edits to Haiku, then review.** Simple code edits and documentation updates can go to Haiku subagents. Name the exact files and the change wanted. As the orchestrator, review the diff yourself and re-run any gate yourself; don't trust a subagent's report that it passed.
- **Do the substantial work yourself.** Substantial reasoning, substantial code changes and design work (including student-facing text and science judgement) stay in the main thread.

## Where to look

- `PRODUCT.md`: users, purpose, constraints, brand, accessibility minimums.
- `docs/spec.md` (about 870 lines; read only the section you need):
  - *Introduction*: the biology, PTR modes, and the case truth tables (the instructor answer key) under *Simulations*.
  - *Part 1 › Implementation spec*: Architecture, Transcript models and probe menus, Geometry references, Simulation parameters, Rendering stack, Visual design and navigation (art direction, theme, rail, notebook, layouts, plot, export), Openings (steps 1–2), Steps 3–5, Steps 6–8, Motion principles, Viewer features, Image realism model, Student-facing text (gene cards, glossary), Hosting and offline use.
  - *Part 2*, *Future implementation ideas*.
- `DESIGN.md`: the design system as built (YAML tokens, then components and do's and don'ts). The frozen direction is `docs/style-directions/tokens.css` and `Style directions review.md`; where DESIGN.md disagrees with the tokens, the tokens win.
- `docs/storyboards/<case>-openings.md`: steps 1–2 for each case, with "As built" notes.
- `docs/storyboards/targets-step.md`: step 4, "TDP-43 and its targets" (built 2026-10-16, its animation redesigned the same day and slowed down on 2026-10-17; "As built", "Redesign" and "Revisions" at the end). Its end-frame mock-up is `docs/mockups/step4-targets-endframe.html`, drawn by `docs/mockups/step4-targets-neuron.py`; the live drawing is `site/js/mrnalife.js`.
- `docs/transcript_models_R6.json`: transcript models and probe menus, including the answer-key fields.
- `docs/review.md`: one entry per review run. `docs/references/`: reference packs, compartment sketches, gene models. `docs/mockups/` and `docs/style-directions/`: design records.

## Code map

**site/** (the served app)
- `index.html` loads only `js/main.js`; an importmap points PixiJS at `vendor/`.
- `js/main.js`: app shell (rail, notebook, views). Its `VIEWS` and `CASE_VIEWS` choose each step's module; `js/router.js` only parses `#/<case>/step-<n>`.
- `js/steps/`: one module per step. Steps 1–2 differ by case: `step1.js` and `step2.js` are Pdf (the default), replaced by `mb-step*.js` and `nmj-step*.js`. Steps 3–8 are shared and read the case's data: `step3.js` TDP-43 dysfunction, `step4.js` TDP-43 and its targets, `step5.js` hypotheses, `step6.js` probe design, `step7.js` microscopy reveal, `step8.js` interpret & revise. `landing.js` is `#/`; `locked.js` shows the reason from `lockReason()` in `content.js`.
- `js/viewer/`: `viewer.js` (split and flicker viewer, the only PixiJS import), `controls.js` (channels, LUTs, brightness), `fullview.js` (full screen, steps 3 and 6), `gl.js` (WebGL 2 check and fallback), `textures.js`.
- Student-facing text: `content.js` (cases, steps, stages, mode cards, lock rules, the step 4 target text and `question()`), `glossary.js` (`ENTRIES`), `summary.js` (Part 1 summary slide and locator text), `notebook.js` (drawer labels). Story prose and headings are inline in `steps/*.js`.
- State: `store.js` owns localStorage (`smfish:v1:`, per case); `theme.js` uses `smfish:theme`.
- Data and results: `data.js` (`loadJSON`, `transcripts()`, `regionLabel()`), `map.js` (transcript map), `results.js` (step 7 SuperPlot from `tables.json`), `export.js` (PNG).
- Story layer: `fly.js` (sprites, ink boil), `gsap.js` (loads the vendored GSAP), `caption.js`, `handoff.js` (elements carried across a route change), `stations.js` (landing), `brain.js` (descent), `storycam.js` (the step 4 camera: the SVG viewBox as a function of time, labels in screen space), `mrnalife.js` (the step 4 neuron, also drawn small beside the hypotheses); per case `monitor.js` (`pdf`), `tmaze.js` and `mbanatomy.js` (`mb`), `vial.js` (`nmj`).
- UI helpers: `popcard.js` (help cards), `tour.js` (once-per-browser tours), `forms.js` (fields bound to the store), `icons.js`, `prng.js` (seeded, so animations replay identically).
- `css/`: `tokens.css` (the live tokens: the frozen set plus `--text-3` and the odour colours), `base.css`, `app.css` (layouts, per-case animation), `fonts.css`.
- `data/` and `textures/`: generated (below); never edit by hand.

**generator/** (run as `uv run python -m generator.<name>`)
- Scripts: `public_models`, `connectome_mb`, `connectome_nmj`, `geometry_<case>`, `truth_table`, `build`, `validate`, `flies`, `textures`.
- Libraries: `paths` (paths, case → gene), `cases` (per-case parameters), `model` (inputs, region membership), and `simulate`, `render` and `tables` (used by `build`). `geometry_mb` and `geometry_nmj` import shape helpers from `geometry_pdf`.

**tools/**: `serve.py`, `pdf-identical.sh` (with `pdf-baseline.sha256`), `review-shots.sh`, `shot-diff.py`, `contact-sheet.sh`, `frozen-time.sh` (usage below).

## Generated data

The site reads only `site/data/`. Commit the output: the Pages workflow regenerates it and fails if it differs. Truth tables and full molecule records stay in `data/<case>/`. For a case, in order:

1. `generator.connectome_<case>` (`mb` and `nmj`, once): downloads MaleCNS data into `data/<case>/connectome/`, not committed.
2. `generator.public_models`: transcript maps without the answer key.
3. `generator.geometry_<case>`: six geometry files, plus `site/data/<case>/anatomy.json` for `mb` and `nmj` (the descent; for `nmj` also the step 8 locator). For those two, `--sketch docs/references/<case>-compartment-sketch.png` redraws the compartment sketch; that run writes only the sketch, so run the script again without it for the data.
4. `generator.truth_table <case>`: expands `data/<case>/truth-table.toml`.
5. `generator.build <case>`: chooses animals, places molecules, renders images, writes tables (1–2 minutes).
6. `generator.validate <case> --signed`: the gate; fails on any mismatch or an unsigned truth table.

- After any change to shared generator code (`geometry_pdf` included), run `tools/pdf-identical.sh`: the Pdf output must stay byte-identical.
- The Pages workflow gates `CASES: "pdf mb nmj"`; add a case only once its truth table is signed off.
- **Artwork:** `generator.flies [<view> …]` writes fly sprites from flybody into `site/data/flies/` (meshes cached in `data/flybody/`; all views take about 6 minutes). `generator.textures` writes paper grain and washes into `site/textures/`. Sprite sequences (`flap`, `tremor`) and views are documented in `flies.py`.

## Review and browser checks

- **Review before pushing visible changes.** Before pushing to the remote, if the commits not yet pushed change anything a student would see in `site/` (text, layout, styles, drawings, animation), run `tools/review-shots.sh` for each affected case, look at the shots (both sizes, both themes), and log the run in `docs/review.md` (commit the log entry before the push). Commits in between need only spot checks. Pushes of docs-only or generator-only changes don't need it (the generator has its own gates).
- `tools/review-shots.sh <out-dir> [pdf|mb|nmj]`: the review set for a case (every step at 1280×720 and 1920×1080 in both themes, animation end frames, full screen for steps 3 and 6). `tools/shot-diff.py <old> <new>` pixel-diffs two sets. Log each run in `docs/review.md`.
- `tools/contact-sheet.sh '<url with {t}>' out.png <times…>` tiles frames through the page's frozen-time mode (`?t=` seconds). `tools/frozen-time.sh <video.webm>` reports dead stretches in a recording; video compression can hide the ink boil, so confirm with screenshots.
- `playwright-cli` (a global install) for screenshots, `resize 1280 720`, `video-start` / `video-stop` and the offline test (`network-state-set offline`, or check that every URL in `performance.getEntriesByType('resource')` is local). Sessions start with empty localStorage: seed the notebook state before testing gated steps.

## Image generation (Impeccable)

There is no native image tool here, and `impeccable generate-image` fails (no OpenAI key). When Impeccable calls for "the harness-native image tool", follow `docs/image-generation.md` (Antigravity's `generate_image` through `agy-delegate --yolo`). `buildPath` in `.impeccable/config.json` is `code`.
