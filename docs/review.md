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

## 2026-10-14: descent labels (instructor)

At the instructor's request, the descent (leg motor neuron step 2) now draws the brain in the head and labels the central nervous system and the leg muscle.
- **Brain:** outlined round the MaleCNS central brain's cell bodies (`brain_somata_side` in the connectome cache) and joined to the VNC through the neck, so the central nervous system is one outline (`cns` in `anatomy.json`).
- **Labels:**
  - "Central nervous system", with one arrow to the brain and one to the VNC;
  - "Ventral nerve cord (VNC)", moved to the VNC's left;
  - "Leg muscle", under the femur.
- **Muscle:** drawn as a warm wash with pennate fibres, so it reads as muscle.
- **Smaller changes:**
  - The neuromere tags move off the motor neuron.
  - The camera's VNC view widens to take in the head.
  - The 4.8 s caption names the brain and the VNC.

**Checks.**
- Frozen frames at 3.6–9.4 s, in both themes.
- No console errors.
- The step 7 locator is unchanged; it still uses the VNC alone.

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Brain outline | The cell bodies' contour was hook-shaped: they form a shell round the neuropil. A rounded hull is used instead, nudged 30 µm down to sit inside the drawn head. | Fixed. |
| 2 | Muscle | As a pale wash it did not read as muscle, even labelled. It is now a warm wash with fibres slanting in to a tendon. | Fixed. |

## 2026-10-14: steps 3–6 drawn faded (class name clash)

The instructor saw the step 3 viewer and step 5 greyed out on localhost. The climbing vial's bench line, added with leg motor neuron step 1, was styled by `.bench { … opacity: .45 }`. But `.bench` is also the workbench layout of steps 3–6, so all four steps were drawn at 45% opacity in every case. The line's class is now `vial-bench` (`app.css`, `nmj-step1.js`, `stations.js`).

**Checks.**
- **Review set:** `tools/review-shots.sh <dir>` for pdf, mb and nmj (60 screenshots and 12 sheets each). Steps 3–6, their full screens and step 7 are at full strength in all three cases, in both themes and at both sizes. The vial, the station and the descents are unchanged.
- **Opacity:** the workbench computes opacity 1 on steps 3–6. The vial's bench line keeps 0.45 (1.2 px on step 1, 2.4 px on the landing station).
- **Console:** no errors or warnings on the landing or on leg motor neuron steps 1 and 3–6.
- The nmj review set logged under "leg motor neuron openings" was shot with the fade. Its step 3–6 sheets are replaced by this run.

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Steps 3–6, all cases | Drawn at 45% opacity: the vial's `.bench` rule also matched the workbench layout. | Fixed. |
| 2 | Leg motor neuron step 5 | The *stai* gene card says "synaptic boutons". | OK: FlyBase's wording, kept by the instructor (spec, 2026-10-13). |

## 2026-10-15: step 3 and 4 copy, "Region N" labels, simulated data (instructor)

The instructor's review notes:
- **Step 3** asks for an observation only. The Interpretation field went from step 3, the drawer and the step 4 recap; nothing else read it. The example is now about TDP-43 but describes only the control.
- **"Clue" is gone** from the student text: the stage is "RBP dysfunction".
- **Step 4** has a new prompt.
- **TDP-43 protein** is the name in the step 3 chip, the Channels row and the viewer overlay.
- **"(simulated data)"** appears on the projection label, the overlay and the step 1 pill.
- **Glossary:** a new projection definition and a DAPI hover.
- **Probe regions** show as "Region N" (display only: `regionLabel()` in `data.js`). Internal IDs and every data file are unchanged.
- **Exported PNGs** name the gene.

Probe-track labels now stack by their measured width, and the strip and slide labels push apart by it. The TDP-43 brightness slider moved to the LUT line, and the step 6 channel buttons show the dot and the region (both instructor's choice, so they fit at 1280×720).

**Checks.**
- **Review set:** `tools/review-shots.sh` for pdf, mb and nmj, against a baseline shot from HEAD. `tools/shot-diff.py` lists only the screens expected to change: step 1 (pill), the step 2 label frame (projection label), the rail on steps 1–7, and steps 3–7.
- **Exports**, captured from the clipboard for all three cases:
  - Plot PNG: two-line header with the gene in italics.
  - Viewer PNG (split): the gene leads, and the line wraps inside its field.
  - Summary slide: "smFISH 1 · Region 7" clears slot 2, and the map labels clear each other.
- **Hovers:** the DAPI and projection tips show the new text. A click on "DAPI" leaves the Membrane + DAPI channel on.
- **No console errors.**
- **`site/data` and `data/` unchanged**, so the Pdf baseline and the Pages data gate are unaffected.

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Steps 3 and 6, Channels, 1280×720 | "TDP-43 protein" ran under the brightness slider's sun icon. | Fixed: the slider (now 52 px) sits beside the LUT select on the line below (instructor). |
| 2 | Step 6 plot bar, 1280×720 | "smFISH 1 · Region 7" buttons pushed "Copy as PNG" onto a second line and shortened the viewer. | Fixed: the buttons show the channel dot and the region; the accessible names keep "smFISH 1, Region 7" (instructor). |
| 3 | Steps 5 and 7 probe track (Pdf, leg motor neuron) | "Region 1" overlapped the gutter's "Probe regions". | Fixed: labels are kept clear of the gutter. |
| 4 | Channels row | An 8 px flex gap split "Membrane +" from "DAPI". | Fixed: the name is one flex item. |
| 5 | Viewer overlay, 1280×720 split | The longer line wraps; "data" was left alone on the second line. | Fixed: "simulated data" wraps as a unit. The wrap itself stays (already noted on 2026-10-06). |
| 6 | Step 6 legend, 1280×720 | Wraps onto two lines with "Region N" labels. | OK: nothing is clipped. |

## 2026-10-15: climbing vial gap, tape and finish line (instructor)

The instructor asked for more space between the two climbing vials, and for a line label that means something to students who don't know the assay.
- **Gap:** the vials stand half a vial width apart (centres 405 and 555, were 426 and 534; a 50-unit gap, was 10) in step 1 and in the landing station, which draws the same pair. The labels, counters, index bars and flies are placed from the centres and moved with them.
- **Tape removed:** the two grey strips (the tape joining the vials, from the reference footage) read as two extra lines either side of the 5 cm line and covered flies. The pair still lifts and drops as one, so both lanes get the same taps.
- **Label:** "5 cm line" became "finish line (5 cm)" (the instructor's choice of four). The counters' "above the line" and the formula still refer to it.
- **Finish line and glass:** the ring is drawn at twice its old weight (2.2, was 1.1; the back half a firmer dash), and its pulse at each crossing rises from there (to 4.4), so the vials read less bare. A faint inner line on each wall gives the glass its thickness, behind the flies (instructor's choice from five mock-ups: heavier ink, a wash band, a red line, cm ticks, glass wall).

**Checks.** `tools/review-shots.sh` for nmj: step 1 at 1280×720 and 1920×1080 in both themes, with nothing clipped and the timer centred over the gap. The landing station and two mid-run frames (`?t=5.2`, the heap; `?t=8`, the climb) checked by eye. The ring's pulse checked on a contact sheet (`?t=5.5`–`6.5`; the first WT crossing at 6.3 s). No console errors. Only leg motor neuron step 1 and its landing station use `site/js/vial.js`; `site/data` and `data/` are unchanged.

## 2026-10-16: opening and step 1–2 wording, roll-up captions, one Next on the descent (instructor)

The instructor reworded the opening and the first two steps for all three cases, keeping the text short.
- **Landing:** the hero reads "Studying ALS in humanised flies", with an ALS hover and the caption "They look the same, but behave differently." on screen from the first frame. The station cards lead with the phenotype, then a "… system" line (NMJ hover on the leg motor neuron card) and the assay. Their lane labels are paler, at the top corners (`--text-3`).
- **Names:** the system names are "Pdf clock neurons" and "Leg motor neuron & NMJ" (rail, notebook, tab title, step 7, summary PNG). The step 1 headings read "Phenotype: assay".
- **Step 1:** the captions roll up on all three assays (`site/js/caption.js`). The caption before the current one moves up and shrinks gradually from 22 to 18 px. The climbing timer runs in real time, and the opening runs 40.5 s (accepted). Each assay's description is a quiet 16 px sans note with a small-caps run-in label.
- **Step 2:**
  - The descent's end frame gives "maximum-intensity projection" the viewer's hover.
  - Only the Next button below the story text remains, and the matched swap to step 3 runs from it.
  - The story text is reworded for all three cases. Pdf now says "most branched at ZT2" and has a new ZT hover.

**Checks.**
- **Review set:** `tools/review-shots.sh` for pdf, mb and nmj, against a baseline shot from HEAD (a worktree served on port 8766). `tools/shot-diff.py` lists only the screens expected to change:
  - The hero and step 1.
  - All three step 2 frames: the stage's scene is taller without the controls row, so the camera framing moves.
  - The rail on steps 3–7: tighter spacing below 760 px of window height, and the new system names at both sizes.
  - Step 7's summary.
  - The full-screen views of steps 3 and 6 match, apart from 2–3 px of native-control antialiasing.
- **Mid-run frames:**
  - The roll-up slowed to 0.04× shows the gradual shrink and the fade to `--text-3`.
  - The climbing run: the counts are 8 and 2, and it ends at 16.9 s with Next. Replay and Skip work.
  - The caption box stays 62 px high in every state, so the controls don't move.
- **Descent:**
  - The projection term is the topmost element under the pointer (`elementFromPoint`), and its tip shows.
  - Nothing focusable sits inside `aria-hidden`.
  - With the Next button scrolled into view at 1280×720, the end frame's bottom is still at 213–271 px. Step 3's viewer grows out of it.
- **Contrast:** `--text-3` measures 5.3:1 (light) and 5.16:1 (dark).
- **No console errors.** `site/data` and `data/` are unchanged.

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Rail, 1280×720, leg motor neuron | The two-line "Leg motor neuron & NMJ" pushed the rail 16 px past the window. | Fixed: tighter rail spacing below 760 px of window height. |
| 2 | Step 1 captions, Pdf | The longest caption (898 px) wrapped in the 853 px measure, so the roll-up would have grown to three lines. | Fixed: the caption runs the stage's width; the upper line never wraps (ellipsis). |
| 3 | Roll-up mid-transition | The outgoing line overlapped the rising one. | Fixed: it fades out faster (0.25 s, 12 px up). |
| 4 | Opening budget, leg motor neuron | The real-time timer took the opening to 41.9 s. | Fixed: the end of the climb is tightened, so the opening runs 40.5 s (instructor accepted). |
| 5 | Step 2 story text, Pdf | The draft said the terminals are "most fasciculated" at ZT2, which reverses Fernández et al. 2008. | Fixed: "most branched at ZT2" (instructor). |
| 6 | Descent stage | Removing the in-stage Next left the caption hugging the window's bottom edge. | Fixed: the caption takes the bottom padding. |

## 2026-10-16: step 4, "TDP-43 and its targets", and the eight-step flow (instructor)

A new step 4 bridges the TDP-43 observation and the hypotheses (storyboard `docs/storyboards/targets-step.md`, with its *As built* section). Hypotheses move to step 5, probe design to step 6 (renamed from "Target & probe design"), the reveal to step 7 and Interpret & revise to step 8.
- **Step 4:** a 25.2 s drawing of the life of a target mRNA in a fly neuron, TDP-43 at each station (`site/js/mrnalife.js`, `site/js/steps/step4.js`), six roll-up captions with three new glossary hovers, then the case's target as a candidate and the question "Which steps in the life of *gene* mRNA go wrong when TDP-43 carries the ALS mutation?".
- **Carried forward:** the question heads the hypotheses' side pane (with a small copy of the drawing whose stations light up when a card is hovered or focused), sits above the step 8 Claim, is a row on the summary slide and heads the notebook drawer.
- **Elsewhere:** step 3 says that TDP-43 is an RNA-binding protein; the hypotheses prompt and the "because…" placeholder are reworded; probe design has a line on what smFISH shows; the rail's lock reasons are one line each; old notebooks are migrated (visited steps 4–7 become 5–8).

**Checks.**
- **Walk:** steps 1–8 in all three cases with no console messages. The three gates lock, name the step that fixes them ("Go to step 5: Hypotheses" and so on) and show the short rail reasons.
- **Rail:** fits 1280×720 in all three cases, with and without the lock reasons (the leg motor neuron's two-line name included).
- **Step 4:** contact sheets at the storyboard times and full-resolution crops of 18 frames; `?t=25.2` equals the reduced-motion frame (no pixel differs by more than 8 levels); 60 fps through playback; motion in every sampled frame of the stage (the boil holds the end frame live); Skip and Replay work; Next ends at 713 px at 1280×720 in all three cases.
- **Hypotheses:** no page or pane scroll at 1280×720 (the main column still scrolls a little with two cards open, as before; the new prompt is a line shorter). Hovering a card, and focusing each card in turn, rings the right stations (isoform- and cell-type-specific none); leaving clears them.
- **Probe design:** the map fits its column in all three cases and both themes at 1280×720.
- **Migration:** an old notebook (`visited` 1–7, no `steps`) shows steps 1–3 and 5–8 done and step 4 to do, and is saved with `steps: 8` on the next write.
- **Summary PNG:** a long Claim and Uncertainty fit in all three cases.
- **Data:** `generator.validate --signed` passes for pdf (2712 checks), mb (3788) and nmj (2795). `site/data` changes only in the nmj anatomy note ("step 8 locator"). Every resource on step 4 is local.
- **Review set:** `tools/review-shots.sh` for pdf, mb and nmj (now 11 states plus two full screens, steps 3 and 7), inspected.

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Step 4, frame 0 | One free TDP-43 crossed the close-up's top edge and the other sat on the "…UGUGUGUG…" text. | Fixed: both start above the target strand, inside the box. |
| 2 | Step 4, transport arrow | Drawn as one path, the arrowhead appeared before the shaft was done. | Fixed: the shaft draws, then the head. |
| 3 | Probe design, 1280×720 | The new smFISH line pushed the map column into scrolling (mb 41 px, nmj 23 px, pdf 5 px) and the help link below the fold. | Fixed (instructor's choice): the map's minimum row pitch is 26 px instead of 32. |
| 4 | Steps 7–8, read-only maps | They start at the minimum pitch, so #3 would have tightened them too. | Fixed: maps start at 32 px; only a fitted map goes down to 26. |
| 5 | Summary slide | The question at the top of the right column pushed a long Claim and Uncertainty into the footer. | Fixed (instructor's choice): the question is its own row above the probe pair; the claim sizes go down to 22 px. |
| 6 | Hypotheses prompt | "TDP-43" broke at its hyphen. | Fixed: no break inside "TDP-43" or a hyphenated gene name. |
| 7 | Step 4 target text, probe design line | An italic gene name ran into the roman word after it ("*unc-13* a"). | Fixed: a small italic correction. |
| 8 | `generator.geometry_nmj --sketch` | The plan's command only redraws the sketch; it doesn't write the geometry. | Ran the script without `--sketch` as well; AGENTS.md now says so. |
| 9 | Step 3 side pane (review set, mb and nmj) | The full stop after the new "RNA-binding protein" hover wrapped onto a line of its own: a glossary button breaks like one box. | Fixed: the hover and its punctuation stay together, here and after the hypotheses prompt's hover. Older hovers followed by punctuation (step 2 story text, the landing) are unchanged. |

## 2026-10-16: step 4 redesigned in the descent's motion language; roll-up fix (instructor)

The instructor asked for four changes to the new step 4:
- fix the stage's "beat" at each caption change;
- drop the TDP-43 symbol beside the question;
- redesign the animation from scratch in the step 2 descent's motion language (lines drawn on; elements, labels and particles coming together gradually; the ink boil only on the final still);
- rename the station "RNA granule" to "RNA transport granule".

The storyboard's new *Redesign* section (`docs/storyboards/targets-step.md`) has the motion language, the shot list (25.4 s) and the reasons. The code is `site/js/storycam.js` (new) and `site/js/steps/step4.js` (rewritten); `mrnalife.js` gained class hooks and the travelling tube, and still draws the same end frame.

**Checks.**
- **Roll-up:** a per-frame log of the page's width against the window's through three rolls on step 4 and on step 1 (pdf, mb and nmj), at 1280×720 and 1920×1080: no overflow frames (48–54 before).
- **Contact sheets:** stage crops at about 30 times across A–H at 1280×720, the growth (B) at 1920×1080, and close sheets of the granule crossing into the axon.
- **End frame:** `?t=25.4` equals the drawing as written (`lifeSVG()` swapped in unanimated: no pixel differs) and the reduced-motion frame (no pixel differs).
- **Filters:** off on every filtered group from A to G and on from 24.4 s. Skip starts the boil; Replay and leaving the page stop it.
- **Frame rate:** 60 fps through playback at 1280×720 and 1920×1080 (no frame over 16.8 ms). The first run in a fresh browser had three one-off frames of 230–300 ms.
- **Recording:** a live recording run through `tools/frozen-time.sh`. Since its whole-frame mean misses small motions, changed pixels were also counted inside the stage frame by frame: there is no still stretch during the journey.
- **Every case and theme:** Next ends at 713 px at 1280×720 in all three cases, light and dark. The journey labels read in the dark theme, and stay on their anchors after a resize mid-journey. The hypotheses' small drawing is unchanged and its rings still light. No console messages.
- **Review set:** `tools/review-shots.sh` for pdf, mb and nmj (step 4's end frame is now `?t=25.4`), inspected.

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Steps 1 and 4, caption roll-up | The rolled-up line starts scaled up from its left edge, so for about 0.25 s it reached 151 px (1280) or 293 px (1920) past the right edge. With classic scrollbars a scrollbar flashed, and the full-width stage shrank and grew back: the "beat". | Fixed: the caption box clips sideways (`overflow-x: clip`; not `hidden`, since the outgoing line rises above the box). |
| 2 | Step 4, camera | Zooming the viewBox with the ink and rim filters on gave frames of up to 233 ms (measured before the build). | Fixed by design: no filter while the camera moves; the ink and the rim come on at the still. |
| 3 | Step 4, the new frame | The fixed-ratio wrapper (`aspect-ratio`) rounded the drawing's height down by a fraction of a pixel. That scaled the whole drawing by 0.006%, and crisp lines antialiased differently from the drawing as written. | Fixed: the SVG stays in the page flow. Its width and height attributes fix its shape, so a moving viewBox can't re-lay out the page. |
| 4 | Step 4, export (D) | The finished mRNA's TDP-43 started on top of a nuclear TDP-43. | Fixed: the mRNA starts 6 units lower and lines up with the pore before it leaves. |
| 5 | Step 4, camera stops | The nucleus stop cut the looped intron or the lower envelope; the cell-body stop cut the cell body's lower edge. | Fixed: the stops were moved and enlarged (storyboard *Details settled at build*). |
| 6 | Step 4, granule crossing into the axon | The two shapes' swellings crossed at the axon's base and left a kink for about 0.2 s. A hand-over between them still left a corner. | Fixed: while the granule travels, the neurite and the axon are drawn as one tube. |
| 7 | Step 4, journey labels | Most were up for under a second. | Fixed: each stays until its camera move starts, and fades as the camera moves on. |
| 8 | Step 4, the old end frame | Diffed against the new one, the old end frame differed on crisp lines: GSAP had left 100% dash arrays and identity matrices on the parts it drew. | Superseded: the new step writes the markup's own values back at the end. |
| 9 | Step 4, growth (B) | The last compartment name, "Terminals", was fully on screen for only about 0.25 s before the names left. | Fixed: the names come in from 5.3 s. |

## 2026-10-17: step 4 slowed down; drawing, labels, panels and the question's style (instructor)

The instructor asked for these changes in all three cases (storyboard *Revisions (2026-10-17)*):
- the journey slowed so students can read it (25.4 s → 54.6 s);
- the neurite's dendrites removed;
- "SYNAPTIC TERMINALS" and "non-target RNA";
- both panel headings at 22 px;
- the question upright between hanging quotation marks wherever it appears;
- the side note right-aligned;
- "Stathmin (*stai*, STMN2 in humans)";
- a few TDP-43 molecules in the cytoplasm, by translation and decay, in the axon and in a terminal.

The instructor chose the quotation style, its use everywhere, and the gene name for *stai* only.

**Checks.**
- **Contact sheet:** 30 frames across the new timeline (nmj, 1280×720). Each station holds with its caption and label. The camera pushes in slowly through each hold. The new TDP-43 arrive in their own shots.
- **End frame:** `?t=54.6` equals the drawing as written and the reduced-motion frame (no pixel differs in either comparison).
- **Frame rate:** 60 fps through the whole 54.6 s at 1920×1080 (no frame over 16.8 ms).
- **Layout:** Next ends at 708 px at 1280×720 in all three cases and both themes (713 before; the target heading is smaller). "SYNAPTIC TERMINALS" clears the Schematic tag, and "non-target RNA" clears its strand.
- **The question elsewhere:** checked in the hypotheses pane, the notebook drawer and step 8. On the summary slide it still fits one line in every case (its right edge is at 1365–1408 of 1840).
- **Review set:** `tools/review-shots.sh` for pdf, mb and nmj (step 4 at `?t=54.6`), inspected.

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Step 4, close-up | "non-target RNA" is 95 units long and would have run into the strands' 5′ ends at x 420. | Fixed: the strands start at x 450; the sequences and the bound TDP-43 moved with them. |
| 2 | Step 4, "SYNAPTIC TERMINALS" | Centred where "TERMINALS" was (x 836), it overlapped the Schematic tag by about 6 units at 1280×720. | Fixed: centred at x 818. |
| 3 | Step 4, TDP-43 | Four new molecules in the cytoplasm would have outnumbered the nucleus (five), against "enriched in the nucleus". | Fixed: three more in the nucleus (eight there in all). |
| 4 | Summary slide | The slide's palette had no quiet text grey for the quotation marks. | Added `text3` (#66655F, the light theme's `--text-3`) to `LIGHT` in `export.js`. |
| 5 | Docs (Haiku's edit) | The *stai* inserted into the spec and storyboard rows was in roman. | Fixed: italic, as gene names are in the docs. The mock-up page (`docs/mockups/step4-targets-endframe.html`) keeps the old text: it is a design record. |

## 2026-10-17: opening tightened; boxed animation controls; station cards without lane labels (instructor)

The instructor asked for these changes:
- the hero introduction reworded ("ALS is a fatal disease of motor neurons. These two flies are humanised: …"), with "ALS-linked" kept on one line;
- the lines under the two hero flies dropped (they repeated the introduction), and the scroll cue removed;
- Skip and Replay moved beside the hero's Schematic tag and named "Skip animation" / "Replay animation", as on step 4; Skip renamed the same way on all three step 1 pages;
- the animation controls on the hero, step 1 and step 4 drawn as ghost buttons (a hairline box at rest) instead of quiet ones; the tour's Skip stays quiet;
- the lane labels removed from the three station cards (the legend above them names the lanes once), and the landing intro reworded ("…mutant flies behave abnormally in three assays, each relying on a different neuron system. Your group works with one system.").

**Checks.**
- **Review set:** `tools/review-shots.sh` for pdf, inspected (hero, step 1 and step 4 at both sizes and in both themes). The set shows frozen end frames, where Skip and Replay are hidden, so the buttons were checked live instead.
- **Buttons, live:** hero (both themes), step 4 (both themes) and step 1 for pdf, mb and nmj (light), at 1280×720. On step 4 Next still ends at 704 px; on Pdf step 1 the controls row ends at 712 px.
- **Station cards:** 1280×720 in both themes; the drawing now starts 17 px below the card's top edge, the card's own padding.

| # | Where | Finding | Status |
| --- | --- | --- | --- |
| 1 | Hero | "ALS-linked" broke at its hyphen across two lines. | Fixed: wrapped in `.nw`. |
| 2 | Process | The change was first checked only by spot screenshots; the review set wasn't run until the instructor asked. | Fixed: AGENTS.md (CLAUDE.md) now says to run the review set before committing any change a student would see, and `.claude/launch.json` starts `tools/serve.py` for the desktop app's browser pane. |
