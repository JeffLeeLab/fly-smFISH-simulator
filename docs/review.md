# Review loop, Phase 1 (PDF neurons)

The automated review that comes before the manual assessment (spec, *Phase 1*, step 5). Each run records what was checked, what was found and what was done about it. The manual assessment's findings go into the spec, not here.

## 2026-10-06: after the openings were built

**Screenshots.** Every step at 1280×720 and 1920×1080, light and dark, with a filled-in notebook so the gated steps open, and animations at their end frames: `tools/review-shots.sh <out-dir>` (36 screenshots, one sheet per step). Contact sheets of the three animated segments are in `docs/storyboards/` (hero, assay and descent frames).

**Animation.** The hero and the activity monitor were recorded with `playwright-cli` and checked with `tools/frozen-time.sh`. Frame times were measured while scrolling through the descent.

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Hero, 1920×1080 | The lane legend is already on screen at load on a tall window, so the hero-to-legend transition started without any scrolling: the flies sat half-way to the legend and the caption had completed. | Fixed: the transition now runs from the first scroll to the legend reaching 45% of the screen height. |
| 2 | Descent, labels | The leaders didn't start at their labels (the labels' CSS alignment was cleared by GSAP), and had no heads. | Fixed: labels are placed directly; arrows are drawn in screen space each frame from the edge of the text to the anatomy, with arrowheads. A "Nucleus" label was added, so all four compartments are named in the viewer's order. |
| 3 | Step 5, 1280×720 | The map's key and the probe list sit below the fold. | By design: the main panel scrolls; the map and probe track themselves fit. Worth watching in the manual assessment. |
| 4 | Hero and assay recordings | The dead-stretch check reports low-motion stretches (hero 0.9–3.4 s, 6.7–10.2 s and the idle; assay 13.8–15.2 s and the final hold). Each matches a designed hold or a read made of thin lines or text (leader lines drawing, label reads, the ZT2 marker, the "untimed" end hold). | No change. Screenshots 0.1–0.3 s apart during the holds differ by 400–1,000 pixels: the ink boil keeps the drawing alive, though video compression hides it. |
| 5 | Descent, scrubbing | 60 fps while scrolling the whole descent over 8 s (480 frames, none over 17 ms) at 1280×720 on the development Mac. | OK here; the low-end Windows laptop test stays in the manual assessment. |

Nothing else needed changing: steps 3–7 read correctly at both sizes in both themes, with no clipped controls and no console errors.

**Still to do before the manual assessment:** the offline copy test, and the browser matrix (Edge, Firefox, Safari) from the spec's device list.

## 2026-10-06: after the rail and motion changes

**Screenshots.** `tools/review-shots.sh <out-dir>` now renders 10 states (the descent at `?t=6.6`, with the brain labels, is new), so 40 screenshots and 10 sheets. No console errors on any route.

**Animation.** The hero-to-legend flight was checked mid-scroll and in a tall window. The new gait model was checked numerically with `node`.

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Rail, steps 3–6 at 1280×720 | The rail is now the full 200 px rail in every layout. Every workbench screen still fits without page scroll; the viewer is narrower. In the split viewer, the mutant field's burned-in label ("F6 · F5 · hTDP-43 ALS mutant · animal 1 · simulated") wraps onto a second line. Nothing is clipped and "simulated" stays visible. | No change. Worth watching in the manual assessment. |
| 2 | Opening, 1700×1500 | The page can't scroll at this size, so the scroll-driven hero-to-legend transition never ran: the flies never reached the legend and the caption never completed. | Fixed: the flies now set off 0.8 s after the hero sequence ends and land in the legend. Checked by screenshots mid-flight and at the end. |
| 3 | Hero-to-legend flight, 1280×720 | Checked mid-scroll: the wings beat out of step between the two flies, and are half open at take-off and landing. | OK. |
| 4 | Walking, landing station and step 1 | The gait model was checked numerically. Every beam crossing matches the walk's positions either side of it. The first crossings are WT 3.10 s and mutant 2.87 s, both inside shot G. The station fly's sampled positions show the surges, a slow-down mid-walk, and quick starts and stops. | OK. |
| 5 | Rail, design check | The automated design check flagged the neuron-system box's 2 px clay left border as a "side-tab" accent. | Fixed: the border was removed; the box keeps its clay tint and clay-tinted hairline. |

**Still to do before the manual assessment:** the offline copy test, and the browser matrix (Edge, Firefox, Safari) from the spec's device list.

## 2026-10-08: step 7 revision (Part 1 summary)

**Screenshots.** A targeted run, not the full `tools/review-shots.sh` set: step 7 full-page at 1280×720 and 1920×1080 in light and dark, with a filled-in notebook; the copied PNG rendered through the real export path (`svgToCanvas`) at 1920×1080; two stress states (all eight modes shortlisted, a ~400-character claim and a long uncertainty; a blank claim and uncertainty). No console errors.

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Slide, eight shortlisted modes | The verdicts were cut off silently once the space ran out (one of four unresolved modes showed). | Fixed: the three groups are set side by side when stacking doesn't fit, and any mode that still doesn't fit is counted ("+ n more"). |
| 2 | Locator | The fly's antennae made a face at this size. | Fixed: removed, as in step 2. |
| 3 | Locator | The head ring sat on the head's outline, and the inset frame was heavier than the slide's hairlines. | Fixed: wider ring; frame and zoom lines in the border-strong grey. |
| 4 | Long claim, blank fields | A long claim is cut at four lines with an ellipsis; the uncertainty fits. Blank fields show dashed placeholders. | OK. |
| 5 | Page, dark theme | The slide preview stays white, as it previews a white slide. | OK. |

The full `tools/review-shots.sh` run is still to do with the next round.

## 2026-10-09: TDP-43 default LUT changed to red-orange

**Screenshots.** `tools/review-shots.sh` run for pdf: all steps at 1280×720 and 1920×1080, light and dark. Sheets inspected for this change: step 3, step 6 and the end of step 2 (membrane + DAPI only, so unaffected).

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Viewer, step 6 | The red-orange granules stay distinct from the green and magenta spots. Transcription sites still read white. | OK. |
| 2 | Viewer, steps 3 and 6 | Nuclei read violet (red-orange plus DAPI blue; pink-violet in step 3, where TDP-43 is undimmed). | OK. Worth watching in the manual assessment whether magenta-only spots inside nuclei lose contrast. |
| 3 | Controls | The red-orange TDP-43 dot sits beside the clay checkbox and slider. It is redder and more saturated, so distinguishable, but close. | OK. Worth watching in the manual assessment. |

## 2026-10-12: mushroom body case (Phase 2), first full run

After the instructor's sign-offs (truth table, storyboard, compartment sketch with the heel moved into the axon bundle) and the switch-on.

**Screenshots.** `tools/review-shots.sh <out-dir> mb`: 10 states at 1280×720 and 1920×1080, light and dark (40 screenshots, 10 sheets), run twice (before and after the fixes below). A targeted step 6 run: every plot measure and the Axon bundle, Lobes and Cell body zooms, at 1280×720 light and 1920×1080 dark. Pdf: `tools/pdf-identical.sh` passed (2712 checks, 0 failed).

**Animation.** Contact sheets of the T-maze (12 frames, `?t=0.8` to `15.3`) and the descent (14 frames, `?t=0.6` to `14`). Reduced motion (emulated) on the landing, step 1 and step 2.

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Images (membrane, TDP-43), whole mushroom body | A thin dark line across the axon bundle where it meets the lobes. The neuropil texture left out every skeleton segment that crosses a region border, and the new heel cut, a flat plane, lined those gaps up. | Fixed: the texture keeps every neuropil segment. `build mb` re-run: same animals, 3702 checks, 0 failed. |
| 2 | Descent, filled outline (shots N–O) | A hairline seam at the same border: the regions are cut 0.3 µm apart. | Fixed: the flat fill layer has a stroke in its own colour. |
| 3 | Viewer toolbar, steps 3 and 6 at 1280×720 | With "Axon bundle" in place of "Peduncle", "Copy as PNG" wrapped onto a second row and the images lost about 35 px of height. | Fixed: the whole-view button reads "Mushroom body" (was "Whole mushroom body"). |
| 4 | Plot bar, step 6 at 1280×720 | The measure menu was 3 px too wide with "Proportion in axon bundle + lobes", so "Copy as PNG" wrapped. | Fixed: "Share in axon bundle + lobes". |
| 5 | Plot, Spots in TDP-43 granules | The case-wide y-axis ran to 1.2: the sparsest probe (U8) reaches a share of 1 (one spot, on a punctum). | Fixed: share and proportion axes stop at 1. Pdf is unchanged (its shares stay below 0.5). |
| 6 | Step 1, reduced motion | The T-maze waits for "Train the flies" and then shows the counts and indices at once, as the Pdf assay does; the storyboard said the end frame shows straight away. | Storyboard corrected; no code change. |
| 7 | T-maze and descent | The contact sheets read in storyboard order: training, elevator, choice, counts, indices; fly, head, brain, growth, turn, labels, matched swap. | OK. |
| 8 | Offline | 83 resources across steps 1–7, all from the local server. No console errors or warnings. | OK. |
| 9 | Step 6 plots and zooms | All five measures read at both sizes; the zooms frame the bundle (fibres visible), the lobe junction and about a dozen cell bodies. | OK. |

**Still to do:** the instructor's manual assessment of the mushroom body strand, and the browser matrix (Edge, Firefox, Safari).
