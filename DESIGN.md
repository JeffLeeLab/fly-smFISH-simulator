---
name: smFISH Simulator
description: An editorial teaching site where a simulated confocal specimen sits at the centre of a warm, exact scientific essay.
colors:
  clay: "#D97757"
  clay-ink: "#A8492C"
  clay-ink-dark: "#E59A80"
  on-clay: "#141413"
  ivory: "#F0EEE6"
  ivory-panel: "#E8E6DC"
  ivory-field: "#F6F4EE"
  hairline: "#C9C6BC"
  hairline-strong: "#B0AEA5"
  stone: "#87867F"
  ink-black: "#141413"
  ink-grey: "#3D3D3A"
  charcoal-bg: "#1F1E1C"
  charcoal-panel: "#2A2926"
  charcoal-field: "#252422"
  charcoal-hairline: "#4A4945"
  charcoal-hairline-strong: "#5E5D59"
  stone-dark: "#9C9A91"
  ivory-text: "#F0EEE6"
  ash-text: "#B0AEA5"
  viewer-frame: "#2A2926"
  viewer-frame-dark: "#141413"
  viewer-field: "#000000"
  lut-green: "#46E66E"
  lut-magenta: "#EB46E1"
  lut-merge: "#FFFFFF"
  lut-tdp-yellow: "#FFD63C"
  membrane-blue: "#5F78C0"
  dapi-blue: "#5A78EB"
  green-ink: "#1F8A4C"
  magenta-ink: "#B0328F"
  green-ink-dark: "#4CC27A"
  magenta-ink-dark: "#E066C4"
  illustration-ink: "#2B2A27"
  illustration-ink-dark: "#E8E6DC"
  wash-body: "#E7E0D1"
  wash-eye: "#D7A089"
  wash-gene: "#E3D8C4"
  wash-a: "#E2D2BA"
  wash-b: "#E8C2AC"
  wash-c: "#D7D5CB"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "46px"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "40px"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "28px"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  subtitle:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: 1.3
  story:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  ui-large:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
  ui:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.08em"
  data:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "\"tnum\" 1"
  overlay:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.3
rounded:
  chip: "2px"
  pane: "3px"
  frame: "8px"
spacing:
  sp-1: "4px"
  sp-2: "8px"
  sp-3: "12px"
  sp-4: "16px"
  sp-5: "24px"
  sp-6: "32px"
  sp-7: "48px"
  measure: "70ch"
components:
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-black}"
    typography: "{typography.ui}"
    rounded: "{rounded.pane}"
    padding: "3px 10px"
  button-ghost-hover:
    backgroundColor: "{colors.ivory-panel}"
    textColor: "{colors.ink-black}"
  chip-channel:
    backgroundColor: "transparent"
    textColor: "{colors.ink-black}"
    typography: "{typography.ui}"
    rounded: "{rounded.chip}"
    padding: "3px 9px"
  verdict-segment:
    backgroundColor: "transparent"
    textColor: "{colors.ink-grey}"
    typography: "{typography.ui}"
    padding: "3px 0"
  verdict-segment-selected:
    backgroundColor: "{colors.clay}"
    textColor: "{colors.on-clay}"
  field:
    backgroundColor: "{colors.ivory-field}"
    textColor: "{colors.ink-black}"
    typography: "{typography.ui}"
    rounded: "{rounded.pane}"
    padding: "6px 8px"
  mode-card:
    backgroundColor: "{colors.ivory-field}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.pane}"
    padding: "8px 10px"
  tab-segmented:
    backgroundColor: "transparent"
    textColor: "{colors.ink-grey}"
    typography: "{typography.ui}"
    rounded: "{rounded.pane}"
    padding: "4px 12px"
  tab-segmented-selected:
    backgroundColor: "{colors.ivory-panel}"
    textColor: "{colors.ink-black}"
  rail-step-current:
    backgroundColor: "{colors.clay}"
    textColor: "{colors.on-clay}"
    typography: "{typography.overlay}"
    size: "24px"
  viewer-frame:
    backgroundColor: "{colors.viewer-frame}"
    rounded: "{rounded.chip}"
    padding: "8px"
---

<!-- Source of truth: docs/style-directions/tokens.css (frozen). This file explains how to use those tokens; if the two ever disagree, tokens.css wins and this file should be updated. Recorded from Chosen-A-with-C-pane.html and mockups/step5-target-probe-map.html before any site/ code existed; run /impeccable document again after the Phase 1 scaffold. -->

# Design System: smFISH Simulator

## Overview

**Creative North Star: "The Annotated Specimen"**

The site reads like a scientific essay built around one real specimen. Steps 1–2 and 7 are set as a single serif column on warm ivory paper, with ink drawings of the flies, soft washes and a light paper grain. From step 3 onwards the essay gives way to the specimen: a black microscope field in a warm charcoal frame, with notes beside it. The notes are set in a precise sans-serif and laid out in hairline boxes, like annotations written next to a figure. The page steps from ivory to charcoal to black, so moving into the microscope feels like a change of material, not a cut.

The mood is **sober, warm and exact**. It is sober because ALS is a fatal disease and the readers are final-year students: there are no mascots, no celebration and no decoration for its own sake. It is warm because of the ivory, clay and serif type, which make this a place to think rather than a dashboard. It is exact wherever data appears: crisp lines, mono numbers, fixed scales, and saturated colour only where colour carries meaning. Density is moderate. The story steps have generous space; steps 3–6 are packed to fit 1280×720 without losing the hierarchy.

Rejected outright (spec banned list): purple/blue gradients, glassmorphism, emoji and stock icon sets, drop-shadowed rounded cards everywhere, centred heroes, Inter as the default font, the same fade-up stagger everywhere.

**Key Characteristics:**
- An ivory → charcoal → black progression that follows the story → instrument → specimen progression.
- A serif carries the argument, a sans carries the controls, and a mono carries numbers and IDs.
- One clay accent for chrome. Every other saturated colour is a data channel.
- Hairlines and tonal fills instead of shadows. Corners are 2–3 px everywhere except the outer page frames.
- Hand-drawn texture on the story artwork only. It stops at the data.

## Colors

The palette is warm neutrals with one restrained accent. All the saturated hues belong to the data.

### Primary
- **Kiln Clay** (`clay`): the single UI accent, used for fills, the current-step marker, a selected verdict and focus rings. It is never used as text: clay on ivory is about 2.7:1. Text on clay is always near-black (`on-clay`, about 5.9:1), never white.
- **Fired Clay Ink** (`clay-ink`; dark theme `clay-ink-dark`): links and accent text, because clay itself can't be text (4.9:1 on ivory, 7.3:1 on charcoal).

### Neutral
- **Gallery Ivory** (`ivory`): the light-theme page and paper.
- **Bound Panel** (`ivory-panel`): raised panels, the selected tab and hover fills.
- **Blotter White** (`ivory-field`): input fields and mode cards. It is lighter than the page, so a field reads as a sheet laid on top of it.
- **Pencil Hairline** (`hairline`) and **Graphite Hairline** (`hairline-strong`): all borders and dividers. They are decorative, so no contrast minimum applies.
- **Stone** (`stone`): non-text graphics at 3:1 or more, such as UTR blocks on the map, rail numbers and placeholders. Never body text.
- **Lamp Black** (`ink-black`) and **Slate Ink** (`ink-grey`, 9.4:1): primary and secondary text. Slate Ink also draws CDS blocks on the transcript map.
- **Warm Charcoal** (`charcoal-bg`, `#1F1E1C`): the dark-theme page, chosen in the style phase as slightly lighter than `#141413`. The dark theme's panel, field, hairline, stone and text values follow it (`charcoal-panel`, `charcoal-field`, `charcoal-hairline`, `charcoal-hairline-strong`, `stone-dark`, `ivory-text`, `ash-text`).
- **Viewer Surround** (`viewer-frame`; dark theme `viewer-frame-dark`) and **Field Black** (`viewer-field`): the frame around the microscope field, and the field itself. The field is black in both themes.

### Data Channels
Each of these means the same thing in the viewer, the transcript map, the plot, the chips and the exported PNGs.
- **smFISH Green** (`lut-green`) and **smFISH Magenta** (`lut-magenta`): the viewer LUTs for probe channels 1 and 2, blended additively.
- **Merge White** (`lut-merge`): a molecule carrying both regions. White is reserved for this, so no other channel may default to white or grey.
- **TDP-43 Yellow** (`lut-tdp-yellow`): the default TDP-43 IF LUT, dimmed to 40% while any smFISH channel is on (`--tdp-with-fish: .4`) so it doesn't add up to a false white. The default is still provisional until the pilot.
- **Membrane Blue** (`membrane-blue`) and **DAPI Blue** (`dapi-blue`): the labelled neuron and its nuclei. Membrane Blue is also the colour of the neurons in the story artwork, the only saturated colour in the drawn world, so blue always means "the labelled neuron".
- **Green Ink** and **Magenta Ink** (`green-ink`, `magenta-ink`; dark-theme variants `-dark`): the same two hues, darkened for the page (map probe bands, plot points, chip dots) so they reach ≥3:1 on ivory.

### Illustration
- **Drawing Ink** (`illustration-ink`; dark theme `illustration-ink-dark`) for the boiling outlines, plus the **washes** (`wash-body`, `wash-eye`, `wash-gene`, `wash-a/b/c`): ivory, warm grey and clay-tinted fills. They are used in the story layer only and never on data.

### Named Rules
**The Colour Belongs to the Data Rule.** Chrome is warm neutral plus Kiln Clay. Any other saturated hue on screen must be a data channel and must mean that channel. Don't use a channel colour for decoration, status or emphasis.

**The Clay Never Speaks Rule.** Clay fills; it never carries text. Text on clay is `on-clay`, and accent text is `clay-ink`.

**The Clay Is Not a LUT Rule.** No LUT option, now or later, may look like clay. That is why TDP-43 is yellow and not amber or orange.

## Typography

**Display Font:** Newsreader (with Georgia, serif)
**Body/UI Font:** Instrument Sans (with system-ui, sans-serif)
**Label/Mono Font:** IBM Plex Mono (with ui-monospace, monospace)

**Character:** Newsreader gives the essay its scholarly warmth: weight 500 for headings with a slight negative tracking, 400 for running text, and italic for captions and the viewer's decoder legend. Instrument Sans is the neutral instrument voice of the controls. Plex Mono is used for anything that is counted, measured or named by ID. All three are open-licence fonts, self-hosted at pinned versions.

### Hierarchy
- **Display** (500, 46px, 1.04): the hero title only.
- **Headline** (500, 40px, 1.05): step titles in the story layout.
- **Title** (500, 28px): step titles in the workbench layout ("Reveal + compare").
- **Subtitle** (500, 18px): section heads inside a step.
- **Story** (400, 18px, 1.6, max 70ch): the serif narrative in steps 1–2 and 7. The hero caption is the same face in italic at 22–24px.
- **Body** (400, 16px, 1.55): sans body text, explanations and the glossary.
- **UI Large** (500, 14px): mode-card titles, field text and table headers.
- **UI** (400, 13px): controls, chips, tabs, verdict buttons, predictions and evidence lines. This is the minimum size for anything interactive.
- **Label** (600, 11px, 0.08em, uppercase): eyebrows ("OBSERVE · STEP 6"), rail stage names and mode-group labels.
- **Data** (Plex Mono 400, 13px, tabular figures): counts, coordinates, probe IDs and ± values in tables.
- **Overlay** (Plex Mono 400, 11px): text burned into the viewer, scale-bar labels and plot ticks.

### Named Rules
**The Size Floor Rule.** Body text is at least 16px, UI text and controls at least 13px, and burned-in overlays and plot ticks at least 11px (mono). Nothing goes smaller. If a screen doesn't fit, cut content, not type size.

**The Three Voices Rule.** The serif argues, the sans operates and the mono counts. A number in a sentence of the story can stay serif, but a number in a table, plot, overlay or ID is always mono.

**The Crisp Text Rule.** All text is live HTML or SVG text in these three fonts. Text is never painted into artwork and never given the ink-boil filter.

## Layout

There are two layouts on one token set.

- **Story layout** (steps 1–2 and 7): a vertical progress rail on the left (about 200px, hairline right border) and a single serif column up to `70ch`. Animations and the fly use a full-width stage. The hero is left-aligned, with the title and subtitle beside the flies, never a centred hero.
- **Workbench layout** (steps 3–6): the rail collapses to a 40px strip of numbered circles. The grid is `rail | viewer | side pane` (side pane about 292px), with the step header across the top and plot/table tabs under the viewer. Spacing is 12px between rows and 24px between columns. The viewer takes about two-thirds of the width. The side pane scrolls on its own; the viewer never does.
- **Step 5:** the compact target card, instructions, channel slots and full-width transcript map all fit within 1366×768. The accessible button list and the prediction rows go below the fold.

Spacing uses a 4px base scale (`sp-1` to `sp-7`: 4, 8, 12, 16, 24, 32, 48). The minimum supported viewport is 1280×720, and every workbench screen is checked at that size and at 1920×1080. There is no phone layout. Spatial convention: control (hTDP-43 WT) is always on the left and the mutant on the right, in the hero, assays, split viewer and plot.

**The Fits-at-720 Rule.** Every workbench screen must work at 1280×720 without scrolling the page. Only the side pane may scroll.

## Elevation & Depth

The system is flat. Nothing has a shadow. Depth comes from three things:

1. **Tonal layering:** page (`ivory`) → panel (`ivory-panel`) → field (`ivory-field`, lighter so it reads as a sheet on top). In dark mode each step goes one warm-charcoal step up instead.
2. **Hairlines** (1px `hairline`) separate regions, the rail and the side pane.
3. **The ivory → charcoal → black progression**, which is the system's only real sense of depth: the viewer sits in a charcoal surround, and the field is black.

The only shadow-like effect allowed is the 3px `text-shadow: 0 0 3px #000` on text burned into the viewer, which keeps it legible over bright spots. It belongs to the specimen, not to the chrome.

The story layer gets its depth from subtle parallax between the fly, the apparatus and the background while scrolling (transforms only), and from texture: a paper-grain WebP (opacity .22 light / .12 dark) and watercolour washes (.28) under SVG ink outlines.

**The No-Shadow Rule.** No `box-shadow` or drop shadows on any surface, card, popover or button. If something needs to stand out, use a tonal fill or a hairline.

**The Texture Stops at the Data Rule.** Grain, washes and the ink boil exist only in the story artwork. The transcript map, plot, tables, notebook and viewer are always crisp, because a wobbly line suggests imprecision.

## Shapes

Corners are nearly square, in a strict three-step scale:
- **2px** (`chip`): chips and the viewer frame. Editorial and sharp.
- **3px** (`pane`): compare-pane fields, mode cards, verdict bars, segmented tabs and buttons (the boxed pane carried over from Direction C).
- **8px** (`frame`): outer page frames only.

Full circles appear only where the shape means something: the 24px numbered rail markers, the 8px channel dots inside chips, and data points in the plot. There are no pills, except the dashed "Simulated" / "Schematic" tag.

On the transcript map, shape carries meaning: CDS is a tall block, UTR a shorter block in Stone, introns are hairlines with 5′→3′ chevrons, each TSS has a bent arrow, each 3′ end a triangle, and long introns have a break mark. Block height is the second cue alongside colour.

## Components

The controls are precise and unadorned: hairline outlines, near-square corners and no shadows. State is shown by fill and darker ink, like filling in a lab form.

### Buttons
- **Shape:** near-square (3px).
- **Ghost (default):** transparent background, 1px `hairline` border, UI text, padding 3px 10px. Used for "Choose a new pair", the fly-to buttons and "Copy as PNG".
- **Hover / Focus (provisional, not in the mockups):** hover fills with `ivory-panel`. Focus-visible shows a 2px clay outline offset by 2px. Colour transitions take about 150ms; nothing moves or scales.
- **Primary action (provisional)** ("Show results"): a clay fill with `on-clay` text. Use it on at most one control per screen.

### Chips
- **Style:** transparent, 1px `hairline` border, 2px corners, 13px UI text, with an 8px dot in the channel's LUT colour before the label ("smFISH 1 · S7").
- **State:** chips show which channel is which; they aren't filters. Provisional: a channel toggled off greys its dot to `stone` and drops its label to `ink-grey`.

### Cards / Containers
- **Mode card:** `ivory-field` background, 1px `hairline` border, 3px corners, padding 8px 10px. It holds a group label (Label style), a title (UI Large), a verdict bar, the group's step 5 prediction in italic `ink-grey`, and an evidence line under a dashed hairline.
- **Target card (step 5):** a compact header strip above the map, not a boxed card, separated by hairlines.
- **Shadow Strategy:** none (see Elevation & Depth).

### Inputs / Fields
- **Style:** `ivory-field` background, 1px `hairline` border, 3px corners, 13px text, padding 6px 8px, minimum height 36px. The label sits above in UI weight 600 `ink-grey`.
- **Placeholder:** `stone`, written as a question ("What could explain it?"), never as an example answer.
- **Focus:** the border changes to `hairline-strong`, plus a 2px clay focus ring.

### Verdict Bar (signature)
A segmented bar of three equal parts (Ruled out · Supported · Unresolved) with a 1px `hairline` border, hairline dividers and 3px outer corners. The selected segment fills with clay and uses `on-clay` text at weight 600. Unselected segments are transparent with `ink-grey` text. All three verdicts look the same when selected: "unresolved" is a valid answer and must not look like a failure.

### Navigation (Progress Rail)
- **Story rail:** stage names in Label style; under each, steps as UI rows with a mono step number in `stone`. The current step has a 2px clay left border and weight 600; completed steps use `ink-black`, and upcoming steps `ink-grey`.
- **Workbench rail:** 24px circles with 1px hairline borders and mono numbers. The current step is a clay-filled circle with `on-clay` text.
- **Locked steps** give a reason in words ("Choose two probe regions to see the results"), never just a padlock.

### Segmented Tabs
Viewer | Compare and Plot | Table use a single 1px hairline box with 3px corners. The selected tab fills with `ivory-panel` at weight 600. The plot's channel and measure toggles use the same pattern, separated by a 1px divider.

### Microscope Viewer (signature)
A `viewer-frame` surround (2px corners, 8px padding) holding a black field, split control | mutant with a 6px gap. Toolbar and legend text use fixed light neutrals (`#E8E6DC`, `#B0AEA5`) whatever the theme, because they sit on charcoal. Burned-in overlays (probe IDs with LUT dots, genotype, animal, "simulated") are 11px mono at the top left. The live scale bar is fixed to the bottom right. The decoder legend is a single line of 13px italic serif under the field.

### Transcript Map (signature)
Monochrome until probes are chosen: CDS in `ink-grey`, UTR in `stone`, introns as hairlines. A chosen probe takes its channel's ink colour as a translucent band through every isoform row. Hover keeps the matching isoforms lit and fades the rest (opacity, about 150ms). Every clickable target is at least 24px wide, whatever its drawn width.

## Do's and Don'ts

### Do:
- **Do** take every colour, size, radius and spacing value from `tokens.css` custom properties. Never hard-code them.
- **Do** keep clay for fills, the current step, selected verdicts and focus rings, and put `on-clay` (#141413) text on it.
- **Do** use the `-ink` channel variants on page surfaces (map, plot, chips) and the raw LUT colours only on black.
- **Do** keep the ivory → charcoal → black order: viewer field black, surround charcoal, page by theme.
- **Do** set every number in a table, plot, overlay or probe ID in IBM Plex Mono with tabular figures.
- **Do** check every screen at 1280×720 and 1920×1080 in both themes, at WCAG AA (text 4.5:1, graphics 3:1).
- **Do** follow the system theme by default, setting `data-theme` on `<html>`, and keep a manual toggle in localStorage (wrapped in try/catch).
- **Do** use smooth, zero-velocity-start eases (smootherstep) and one main move at a time. Reduced motion shows the end frames.
- **Do** label every image, plot and animation as simulated or schematic.

### Don't:
- **Don't** use `box-shadow`, glassmorphism, gradients on chrome, or purple/blue gradients anywhere.
- **Don't** use white text on clay, or clay as text.
- **Don't** use a data-channel hue (green, magenta, yellow, blue) for decoration, status, links or emphasis, and don't make any LUT option look like clay.
- **Don't** apply grain, washes or the ink-boil filter to the map, plot, tables, notebook or viewer.
- **Don't** use emoji, stock icon sets, mascots, or flies with faces or expressions.
- **Don't** centre the hero, use Inter, or repeat the same fade-up stagger across sections.
- **Don't** use bounce, elastic or back eases, or animate layout properties (transform and opacity only).
- **Don't** set any text below 11px, or any control text below 13px.
- **Don't** show genotype by colour. Show it by position (control on the left) and by label.
- **Don't** add p-values, significance stars or highlighted "relevant" regions. The design must never hint at the answer.
