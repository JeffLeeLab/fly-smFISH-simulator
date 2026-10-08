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
