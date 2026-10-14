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

## 2026-10-12: mushroom body science v2 (poison exon, draft) and T-maze changes

The case was redesigned as a splicing case (truth table redrafted, awaiting re-sign-off), the TDP-43 puncta were made equal in both genotypes, and the T-maze got an odour hose, a shock bolt and mutants at chance.

**Checks.** `build mb` reproduced the agent's build (same animals; 3760 checks, 0 failed against the draft). `tools/pdf-identical.sh` passed. No served file names the invented isoforms (`grep "+x|g1x" site/data/mb` is empty; `transcripts.json` lists the 7 annotated isoforms; no `mature_in`, `nascent_in` or `also_detects`). `tools/review-shots.sh <out-dir> mb` (40 screenshots), a step 6 plot run for every measure and channel of U2 + U4, the cell-body and nucleus zooms, a T-maze contact sheet through training, and the station at 1920×1080.

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Step 6 plot, Both channel | The case's key readout, the white U2+U4 spots (0.04 → 0.84 per nucleus), sat flat at zero: the count axis is fixed for the whole case, and the per-animal axon-bundle counts set it to 0–120. The nucleus and cell body were flattened the same way for every probe. | Fixed (mushroom body only; Pdf's plot unchanged): counts are spots per Kenyon cell, the shared axon bundle and lobes divided among the cells they come from (30; 10 per lobe system). A new measure, "Share of spots that are white", gives the share of a channel's spots that also carry the other probe: U2 in the nucleus reads about 0.02 in WT and 0.42 in the mutant, the exon's inclusion share. The Both channel is off for it. |
| 2 | Step 6 viewer, cell-body zoom | The white mature spots are visible in mutant nuclei and cell bodies but modest beside the bright transcription sites, which are white in both genotypes (group-1 pre-mRNA carries U2 and U4). | By design; the legend names the transcription sites. Worth watching in the manual assessment. |
| 3 | Step 3 | The puncta now look the same in both genotypes; the clue is the dimmer mutant nuclei. | OK. |
| 4 | Step 5 | The gene card and map are unchanged and give nothing away; the new junction is on no drawn isoform. | OK. |
| 5 | T-maze, step 1 | The PI dot showed from the start (a `fromTo` rendered its start state at once). | Fixed (`immediateRender: false`). The hose, its tag (OCT, air, MCH), the bolt with its count and the 5 : 5 mutant read in order; the station draws 3 : 3. |
| 6 | Pdf screens | Against the Wave 0 screenshot baseline, steps 3, 6 and 7 differ by a few pixels at the native controls (the LUT and measure drop-downs, the brightness slider). `main` and this branch render Pdf steps 3 and 6 identically in today's browser, so the browser's drawing of native controls changed, not the code. | OK; the baseline should be re-taken before the next Pdf comparison. |

**Still to do:** the instructor's re-sign-off of `data/mb/truth-table.toml`, then `validate mb --signed`; the manual assessment; the browser matrix.

## 2026-10-12: mushroom body science v2, revised at the instructor's request

The white-spot share measure was removed (the per-cell counts stay). The TDP-43 puncta were cut to a fifth (0.024 per µm², both genotypes). The fall in U2 was made larger, most of it in the neurites: 70% of group-1 transcripts include the exon in the mutant, and those decay before they travel far (about a third left in the cell body, a few in the calyx and axon bundle, none in the lobes). Transport is now scored "~": U2's share reaching the axon bundle and lobes falls, but only because the new isoform decays before it gets there.

**Checks.** `build mb`: 3790 checks, 0 failed (draft). `tools/pdf-identical.sh` passed. No served file names the invented isoforms. Step 3, step 6 (count, distal share; cell-body and lobes zooms) at 1280×720 light and 1920×1080 dark.

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Step 6 plot | U2 per cell: cell body 12.8 → 7.1, axon bundle 2.4 → 0.8, lobes 5.3 → 1.6; share in axon bundle + lobes 0.37 → 0.26, with no overlap between the genotypes' animals. | OK. The neurite counts sit low on the per-cell axis (0–40), so the share plot shows the localisation change best. |
| 2 | Step 6 viewer | Lobes zoom: far fewer green (U2-only) spots in the mutant. Cell-body zoom: many white spots in mutant nuclei and cell bodies, almost none in WT. | OK. |
| 3 | Step 3 | Sparse puncta in both genotypes; the dimmer mutant nuclei carry the clue. | OK. |

## 2026-10-12: mushroom body signed off and merged

At the instructor's request the TDP-43 puncta were cut again, to 0.0072 per µm² in both genotypes, and the truth table was signed off (status "signed-off", Jeff Lee, 2026-10-12). `build mb`: 3788 checks passed; `validate mb --signed` and `validate pdf --signed`: 0 failed; `tools/pdf-identical.sh` passed; the Pages workflow's data check regenerates nothing new; no served file names the invented isoforms. Step 3's lobes zoom shows a scattering of faint puncta, alike in both genotypes. `phase2-mb` was merged into `main` (fast-forward).

## 2026-10-12: full screen for steps 3 and 6; TDP-43 granules slightly larger and dimmer

At the instructor's request, steps 3 and 6 get a full-screen view for laptop screens, and the transport granules are drawn slightly larger and less bright. Both changes are in the browser only: no generated data changed (`tools/pdf-identical.sh` passed; `validate pdf --signed` 2712 and `validate mb --signed` 3788 checks, 0 failed).

- **Full screen.**
  - An expand icon at the right end of the viewer toolbar opens it, in the browser's full screen where it can.
  - The bench goes dark in either theme. The viewer controls float over the fields' top-right corner and collapse to their header. In step 6 the plot drawer docks under the viewer.
  - The same button (now "Exit full screen", with an Esc key cap), Esc, the browser's own exit and leaving the step all close it.
  - The viewer tour gains a fourth stop.
  - `tools/review-shots.sh` now also shoots steps 3 and 6 in full screen, step 6 with the plot open.
- **Granules.**
  - A first redraw was rejected by the instructor as looking fake: flat-topped, irregular bodies out to the overlap distance.
  - The granules keep their original soft round Gaussian, 1.2× wider and at 0.7 of their brightness.
  - While smFISH is on they are dimmed to 70% (was 55%), so they end a little dimmer than before there too.

**Checks.**
- Close-ups before and after at 1280×720: Pdf axon (TDP-43 alone; F6 + F5) and mushroom body lobes (TDP-43 alone; U2 + U4).
- Real browser full screen (playwright-cli click): entered; Esc left it and returned the controls to the side pane; a route change also left it.
- The tour over the full view, with Esc closing the tour before the view.
- Review sets for both cases, at both sizes and in both themes.

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Granules | The same soft round puncta, slightly larger and dimmer; still smaller and dimmer than the aggregates. | OK. |
| 2 | Viewer toolbar at 1280 | The new icon pushed Pdf step 3's Split row 2 px past the width. `.vbtn` side padding went from 9 to 8 px, and Split fits again. In Flicker the row still wraps to two lines, as it did before this change ("Switch genotype F"). | Fixed (Split); Flicker wrap left as it was. |
| 3 | Full screen, step 6 | At 1280 with the plot open, the controls panel covers the mutant's dorsal terminals (Pdf) or the end of the vertical lobe (mushroom body) in the whole view. | Accepted: the panel collapses to its header, and the state is remembered. |
| 4 | Full screen, themes | Identical in light and dark; tours and glossary tips still show over it. | OK; the full view was approved by the instructor. |

## 2026-10-13: T-maze flies smaller; odours in colour

At the instructor's request the T-maze (mushroom body step 1) flies are drawn smaller, as they looked big and crowded in the tube and the arms, and the odours get colour so that students can follow them coming in. The activity monitor (Pdf step 1) is unchanged. Only the browser changed: no generated data and no generator code.

- **Flies.** Drawn 25% smaller (sprite height 20 → 15). The heap in the elevator is tightened to match. Wall places, arm slots, counts and timings are unchanged.
- **Odours.** This reverses the storyboard's "odours without colour" rule; the spec and the storyboard are updated.
  - Each odour is a muted wash under its own texture: OCT ochre (`--odour-oct`) with the stipple, MCH slate-teal (`--odour-mch`) with the waves. Both have light and dark values, and both stay clear of the data hues.
  - The textures are drawn in a darker shade of the same colour.
  - The hose fills with the colour of what flows, its dots or dashes run in that colour, and a swatch beside its tag shows the colour (hidden while nothing flows; air is neutral).
  - A swatch sits beside each arm's label, in step 1 and on the landing station.
  - Shocks stay ink.

**Checks.**
- Contact sheet of step 1 through training, tap-down, the choice and the PI.
- Close-ups at 1920.
- The MB review set in both themes and at both sizes.
- The landing station.
- The step 2 descent at `?t=1` and `?t=6.6`.

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Step 1, tube and heap | Flies no longer crowd the tube walls or the elevator; more of the tube and its odour shows between them. | OK. |
| 2 | Step 1, odours | The OCT front (ochre) and the MCH front (teal) read at a glance as they fill the tube; the arms read ochre left and teal right, in both themes. | OK. |
| 3 | Step 2 descent | The descent scales the MCH pattern ×60 behind the whole brain, so the tint would have washed the stage teal. It is hidden there (`.descent__svg .odour-tint`), and the descent looks as it did. The stage's existing warm-grey cast at `?t=6.6` was there before this change (same pixels). | Fixed. |

## 2026-10-14: leg motor neuron openings (steps 1–2) and locator; the case joins the gate

The leg motor neuron case was completed. Its truth table had been signed off on 2026-10-13. This work added:
- step 1, the climbing vial, live on the landing too;
- step 2, the descent;
- the step 7 locator in the turned side view;
- the fly drawings it needs (the side-view `tremor` sequence and the `turned` view);
- the connectome cell (MaleCNS v0.9 body 807165, a tibia flexor of the front leg) and `anatomy.json`.

The case was added to the Pages gate (`CASES: "pdf mb nmj"`).

**Checks.**
- **Gates:**
  - `validate pdf --signed` (2712 checks), `validate mb --signed` (3788) and `validate nmj --signed` (2795): 0 failed.
  - The workflow's data check (`public_models` and `truth_table` for all three cases) regenerates nothing new.
  - `tools/pdf-identical.sh` passed.
  - `build mb` reproduced the mushroom body's data exactly.
- **Fly sprites:** the existing side-view drawings and the viewBox are unchanged; three tremor drawings were added.
- **Review set:** `tools/review-shots.sh <dir> nmj` (new nmj branch: S7 + S8, transport and isoform-specific regulation both unresolved).
- **Contact sheets:** step 1 at G, the taps, the climb and J; step 2 at 0–14 s, closely through the shortening (7.4–11 s).
- **Live runs:**
  - Step 1 played and replayed; the hand-off into step 2; the descent scrolled.
  - The tremor was checked on consecutive frames at 1920, since it is too subtle to trust in a video.
- **Step 7:** the Pdf and mushroom body slides are unchanged.
- **Offline:** every resource on the landing, step 1 and step 2 comes from the site.
- **Console:** no errors.
- **Answer key:** no served file names the case's isoforms or CG31642 beyond `transcripts.json`.

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Step 1 | The first layout centred small vials with the index under them, and the timer collided with the formula. The vials were drawn nearly full height, with each lane's readouts on its own side. | Fixed. |
| 2 | Step 1, between climbs | The borrowed walk–pause model hung several flies head down on the walls. They now stand head up and climb a step now and then; WT flies turn back down a little, and mutants slip. | Fixed. |
| 3 | Step 1 at 1280×720 | The Next button fell just below the fold. The scene was trimmed to the T-maze's height. | Fixed. |
| 4 | Tremor | Three drawings in which each foot circles out from the wall and back. They read on consecutive frames at 1920 as moving legs, above the ink boil, and are subtle at 1280. | OK; for the instructor to judge in the browser. |
| 5 | Step 2, terminals | The synaptic terminals never showed, because their coordinates were made relative to the first branch twice. | Fixed. |
| 6 | Step 2, shortening | With only the axon morphing, the leg vanished and the axon was left as a bare zigzag. The fly's own coxa and femur now shrink into the viewer's leg, carrying the axon. | Fixed. |
| 7 | Step 2 at 10.1 s | The shrinking leg overlapped the viewer's cuticle outline. It fades a beat earlier. | Fixed. |
| 8 | Step 2 at 0 s | The vial's foam plug drew a grey band behind the step title. Only the wall is drawn now. | Fixed. |
| 9 | Step 2 at 8.4 s | Labels and caption turn light while the paper is still mid-grey (charcoal 8.0–8.8 s), as in the Pdf descent at 7.9 s. | Accepted, as in the other descents. |
| 10 | Step 2, matched swap | The last frame's outlines (neuron, VNC edge, cuticle) land on the images; step 3 opens on the same layout. | OK. |
