# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Decided in `docs/spec.md` (*Rendering stack*, *Hosting and offline use*): a static site with no build step. Plain HTML, CSS, SVG and vanilla JavaScript; PixiJS v8 + `pixi-viewport` for the microscopy viewer; GSAP (pinned local copy with plugins) for the openings. Fonts and libraries are self-hosted at pinned versions, with no CDN. Served from GitHub Pages under `/repo-name/` with relative paths, and also runs offline from a local folder over HTTP. A separate generator (Python with NumPy, run with uv) pre-computes all molecules and tables.

## Users

Final-year (L4) undergraduates on the *Core Skills in MCB* course, working in three groups during one 2-hour, student-led feedback session. Many are new to FISH. Each group gets one *Drosophila* neuron system (NMJ, Pdf neurons or mushroom body) and works through it at its own pace: designing a two-colour smFISH experiment, reading simulated images, and narrowing down which post-transcriptional regulation (PTR) modes fail in a humanised TDP-43 ALS model.

The secondary user is the instructor, who wrote the cases and keeps the answer key off the site. There is no instructor view and no shared screen; groups present from their own slides.

How the room uses laptops is undecided: a group may share one laptop with one person driving while the others read, or each student may run it on their own laptop. The design must work both ways.

## Product Purpose

The smFISH Simulator lets students design probes against real FlyBase transcript maps, look at simulated confocal images of control vs ALS-mutant neurons, and reason from the evidence to a claim. The aim is to **narrow the hypotheses, not solve the case**: each case rules out at least one mode, supports one or two, and leaves one unresolved on purpose. The unresolved mode becomes the starting point for Part 2, where students design experiments to dissect the mechanism further and propose interventions.

Success: a FISH-naive group gets from the opening to the summary PNG without help. They separate observation from interpretation, give every shortlisted mode a justified verdict, and leave with a claim and an honest uncertainty for their Part 2 presentation.

## Positioning

The images and numbers come from one seeded simulation built from an instructor-written truth table, so whatever students see is consistent and can be checked. A validation step fails the build if any result disagrees with the truth table. Probe regions are real annotated features on real FlyBase transcript models, including decoys and traps. As a result, probe design changes what students can conclude: one observation gives three different explanations across the three cases. Ambiguity comes from the biology, never from unclear images.

## Operating Context

- One live 2-hour session, run three groups at a time. Students use their own Windows and macOS laptops in current Chrome, Edge, Firefox or Safari, often with low-end integrated graphics. The minimum viewport is 1280×720, with trackpad pinch and scroll.
- The flow has seven steps in five stages (Introduction → RBP clue → Experimental design → Observe → Conclude), with each step at its own hash URL so a group can recover after a refresh.
- Students record notes in a lab notebook drawer stored in localStorage on their own browser. Nothing is uploaded.
- Evidence leaves the site only as PNGs (viewer, plot and a 16:9 Part 1 summary) and students' own screenshots, which go into the group's own PowerPoint for Part 2. Every image is labelled "simulated".
- A companion lecture covers RNA/RBP "Core Skills". FlyBase is the external reference students are sent to.

## Capabilities and Constraints

- Pilot scope covers three adult cases (NMJ – *stai*, Pdf neurons – *futsch*, mushroom body – *unc-13*). Phase 1 builds the Pdf/*futsch* case end to end before the other two.
- In scope: animated phenotype/assay openings; probe placement from a curated 8-region menu per gene; a zoomable split-view viewer with membrane + DAPI, two smFISH channels and TDP-43 IF; configurable LUTs; a SuperPlot; the notebook; PNG export.
- Out of scope: real image data, probe thermodynamics, user accounts, server storage, follow-up experiments, target protein readout, cell-type comparisons and glia.
- No lock on the student's path and no limit on attempts. Exploring is never penalised, groups can always go back, and locked steps say why they are locked.
- The site must never give the answer away. PTR-mode names do not appear in case text, there are no hints about traps or decoys, the plot has no p-values or significance stars, and the public JSON hides which isoforms each region detects.
- Every claim in the spec and the instructor material is classified in one of three layers: *Established*, *Simplified* or *Invented for this case*. The student screens show no per-claim layer badges: repeated on every screen, they cluttered the view without informing. The dashed "Simulated" pill ("Simulated teaching data" in the rail footer on every screen, "Simulated" on the activity monitor) is how students are told that the case is simulated and partly invented, and it meets the *Invented for this case* disclosure.
- Terminology follows the spec glossary, in British English with short sentences.
- The three open questions were settled on 2026-10-09 (see the spec): verdicts carry over between probe pairs, the TDP-43 default LUT is red-orange, and results open at the whole-neuron view.

## Brand Commitments

- Name: **smFISH Simulator**.
- No University of Glasgow branding. anthropic.com and gla.ac.uk are references for principles only, not for identity.
- Tone: sober and respectful, because ALS is a fatal disease and the audience is final-year students. Flies are simplified drawings with a correct body plan, and never mascots.
- A visual direction has already been chosen and frozen: `docs/style-directions/tokens.css` and `docs/style-directions/Style directions review.md`, with art direction in `docs/spec.md`. That direction is the authority for visual decisions; this file does not repeat it.

## Evidence on Hand

- `docs/spec.md`: the full pedagogy, case truth tables, simulation parameters and screen spec.
- `docs/transcript_models_R6.json`: FlyBase R6 transcript models, CDS and probe menus.
- `docs/references/`: the Pdf-neuron reference pack, FlyBase gene-model images and the DAM activity-monitor schematic.
- `docs/mockups/` and `docs/style-directions/`: design records only; they are not served.
- Not yet available: student testimonials, pilot results and usage data. Don't invent outcomes or claims of effectiveness.

## Product Principles

1. **Narrow, don't solve.** Every screen supports reasoning from evidence. None of them reveals the answer.
2. **One truth, everywhere.** The viewer, map and plot read the same pre-computed data, so they cannot disagree.
3. **Honest about what is simulated.** Say what is established, what is simplified and what is invented: the instructor material classifies each claim, and the "Simulated" pill tells students the case is partly invented. Label every image and animation as simulated.
4. **Exploring is free.** No penalties, no locks without a reason, no time pressure. A new probe pair is always one click away.
5. **Readable by a novice.** A FISH-naive student must be able to read the images using only the decoder legend and the "How two-colour smFISH works" explainer.

## Accessibility & Inclusion

- WCAG AA contrast in both light and dark themes. Minimum text sizes: body ≥16 px, UI text ≥13 px, overlays and plot ticks ≥11 px.
- Reduced motion shows still end frames. The opening animations stay under 40 seconds and can be skipped and replayed.
- The transcript map's probe regions are themselves keyboard-operable buttons (Tab to a region; Enter or Space chooses or removes it), focus stays on the region when the map redraws, click targets are at least 24 px wide, and each channel slot has a × button that clears its region.
- Fallback states for missing WebGL 2 and for blocked localStorage (copying PNGs still works).
- Genotype is always shown by position and label, never by colour alone. Control is always on the left.
