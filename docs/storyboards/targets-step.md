# Storyboard: step 4, TDP-43 and its targets (all three cases)

It adds a new step between the TDP-43 observation and the hypotheses. The decisions below were agreed with the instructor on 2026-10-16, and the step was built the same day: see *As built* for what changed on the way. The animation was then redesigned in the step 2 descent's motion language: see *Redesign (2026-10-16)* at the end, which supersedes the shot list and the shot timings in *As built*. *Revisions (2026-10-17)* after it slows the journey down and changes the drawing and the panels; its timings supersede the redesign's. The format follows the openings storyboards: each shot lists what is seen and its timing, then its **reads**, the things the viewer must understand, in order.

Still mock-up of the end frame: [step4-targets-endframe.html](../mockups/step4-targets-endframe.html) (served from the repo root; `?case=nmj|mb|pdf`, `?theme=dark`), rendered as `docs/mockups/mockup-step4-targets-*.png`.

## Why this step

Students currently go from "TDP-43 looks abnormal" (step 3) straight to shortlisting PTR modes, then straight to a transcript map. Before step 4, nothing says that TDP-43 is an RNA-binding protein (only the rail's stage name does), "mode" is never defined, and nothing says why this gene. The missing links are:

phenotype (step 1) ← these neurons (step 2) ← **a protein these neurons need** ← **its mRNA has to be processed, moved, kept and translated** ← **TDP-43 binds that mRNA and regulates those steps** ← TDP-43 looks abnormal in the mutant (step 3)

This step supplies the three links in bold, then asks the question the hypotheses answer.

## Decisions (instructor, 2026-10-16)

1. **The target comes before the hypotheses.** There is a new step 4, "TDP-43 and its targets". Hypotheses move to step 5 and probe design to step 6, renamed "Probe design" because the target is now met in step 4. The reveal becomes step 7 and Interpret & revise step 8. The spec's "Before the gene" rule becomes "Before the map": the transcript map and the FlyBase and NCBI links still appear only in probe design.
2. **A timed journey that ends on a labelled frame** (not a click-through). The end frame teaches on its own, so slower readers lose nothing.
3. **No mutant TDP-43 is drawn; the question names the mutation in words.** (Until the redesign, a small TDP-43 with the ALS tick sat beside the question; the instructor removed it as unnecessary.) The drawing shows what TDP-43 normally does. It never shows what the mutant does to the RNA. A generic mutant frame ("leaves the nucleus and aggregates") would be wrong for the leg motor neuron, which has no aggregates (its granules are larger and stretched instead), and it would pre-empt step 3.
4. **No statement of the two failure routes** (loss of function, gain of function). Students read them from the step 3 images.
5. **The phenotype link is stated as a candidate**, not grounded in the literature: the protein is needed far from the nucleus in these neurons, so if TDP-43 mishandles its mRNA, the neurons could run short of it.

## Whole piece

- **Logline.** TDP-43 binds its target RNAs and acts on them at each stage of their life. Here is one target these neurons need. Which stages fail in the mutant?
- **Same for all three cases.** The drawing and the captions are generic. Only the target panel and the question change with the case.
- **World.** The story layer, as in steps 1–2: ivory paper, ink outlines (they boil 12 times a second on the held end frame only, as redesigned), flat washes. The neuron is drawn in Membrane Blue, as in the descent. **TDP-43 is drawn in the TDP-43 channel's red-orange** (`--tdp`), so it reads as the protein students have just looked at. This is a deliberate exception to "blue is the only saturated colour in the drawn world" (DESIGN.md): a data colour keeps its meaning in the drawing. The mRNA is in ink. There are no smFISH colours: colour still arrives with the probes.
- **One persistent actor.** One target mRNA, from the binding close-up to the terminal, with TDP-43 on it.
- **Budget.** About 55 s timed (54.6 s since 2026-10-17; 25.4 s in the first redesign, which the instructor found too quick to read), then the target panel and the question appear and wait. A Skip button, then Replay. Next is available throughout, as in step 1. Reduced motion shows the end frame. Frozen time (`?t=`) works, as on every story page.
- **Label.** A dashed "Schematic" pill on the stage (*Motion principles*: animations are labelled schematic or simulated).

## Drawing elements

- **TDP-43:** two round lobes side by side (its two RNA-recognition motifs, RRMs) that clasp the RNA, a small knob in front (the N-terminal domain) and a loose wavy tail (the C-terminal region). Students are never told the domain names. Most TDP-43 is drawn in the nucleus; since 2026-10-17 a few molecules are also drawn in the cytoplasm (on the mRNA being translated, on the copy being broken down, in the axon and in a terminal), because TDP-43 is enriched in the nucleus but not confined to it. (The **ALS mark**, a heavier ink tick across the tail as in the landing hero, marked the mutant beside the question until the redesign; it is no longer drawn in this step.)
- **RNA:** an ink line with a small dot at the 5′ end. In pre-mRNA the exons are thick and the introns thin.
- **Splicing:** the intron, with TDP-43 on it, loops out and is removed; the exons join.
- **Nuclear export:** the mRNA threads through a gap in the nuclear envelope's double line (a pore).
- **Translation:** a two-subunit ribosome on the mRNA, with a short chain of beads (the protein) growing from it.
- **Decay:** a second, older copy of the mRNA shortens from one end and breaks into fading dots. There is no Pac-Man shape, which would clash with the sober tone.
- **RNA transport granule** (the station label; "RNA granule" until the redesign): a soft halo holding several mRNAs and TDP-43 molecules. The glossary entry stays "RNA granule", because the "Granule incorporation" card needs the broader meaning (granules also store mRNAs and hold back their translation).
- **Transport:** a small two-footed motor walking the granule along a microtubule (two thin parallel lines) in the axon.
- **Local translation:** in a synaptic terminal (a bouton), a ribosome on the mRNA making protein.
- **Neuron:** a unipolar fly neuron, like the ones students saw in steps 2–3. It has a round cell body holding a large nucleus, then one neurite running into the axon, and a beaded arbor of synaptic terminals. The compartments are labelled in the small-caps label style: Nucleus, Cell body, Axon, Synaptic terminals ("Terminals" until 2026-10-17). The dendrites that branched from the neurite were removed on 2026-10-17: they made little sense in a drawing about one mRNA's journey.
- **How it is drawn:** in the style of a Cajal ink drawing, not clip-art.
  - The outline is a Membrane Blue ink line, heavier on the shadow side (bottom right).
  - The wash is one gradient across the whole neuron, deepening towards the bottom, with a darker rim where the wash pools at the edges.
  - Three fine microtubules run down the axon and fan round the nucleus.
  - The nucleus is stippled, with a faint nucleolus.
  - Station labels are callouts with hairline leaders, outside the cell where there is room.
- **Not places:** isoform-specific and cell-type-specific regulation are a quiet side note in the stage corner, not stations.

## Shot list (about 24 s; frame 0 is a finished image)

The first build's shot list, kept as a record: superseded by *Redesign (2026-10-16)*.

```
A  0.0–4.6   close-up inside the nucleus: two RNA strands across the frame. The upper strand carries a run of
             UG letters (live mono text, "…UGUGUGUG…"), the lower a mixed run ("…ACGAUCCA…"). Free TDP-43 floats nearby
   caption C1 from 0.3 s
   reads:  0.0–1.2  two RNAs; one has UG repeats
           1.2–2.8  two TDP-43 molecules drift onto the UG run and clasp it (the lobes close round the strand);
                    the other RNA stays bare
           2.8–4.6  labels "target RNA" (upper) and "other RNA" (lower)

B  4.6–5.8   pull back (smootherstep): the close-up shrinks into the inset box above the axon, with two thin
             magnifier lines back to the binding site in the nucleus; the neuron outline draws on from the
             cell body to the terminals, then the compartment labels appear
   reads:  4.6–5.8  we were inside the nucleus of a neuron; the close-up stays as an inset

C  5.8–10.2  splicing: in the nucleus, the target pre-mRNA with TDP-43 on its intron. Most TDP-43 sits
             in the nucleus, matching the control students saw in step 3
   caption C2 at 5.8 s
   reads:  5.8–7.6  pre-mRNA with TDP-43 on it
           7.6–9.0  the intron loops out and is removed; the exons join
           9.0–10.2 label "splicing"

D  10.2–13.0 export: the mRNA, one TDP-43 still on it, threads through the nuclear pore
   caption C3 at 10.2 s
   reads:  10.2–12.0 the mRNA leaves the nucleus
           12.0–13.0 label "nuclear export"

E  13.0–17.2 cell body: a ribosome assembles on the mRNA (small subunit, then large) and a chain of beads grows;
             beside it an older copy shortens from one end and breaks into fading dots
   caption C4 at 13.0 s
   reads:  13.0–15.0 the mRNA is translated (label "translation")
           15.0–17.2 another copy is broken down (label "decay")

F  17.2–22.0 axon and terminals: our mRNA and its TDP-43 gather with others into a granule (label "RNA granule");
             a motor walks it along the microtubule, easing in, gliding and slowing into the terminal (label
             "transport", with an arrow); in the large bouton the granule loosens and a ribosome makes protein
             (label "local translation")
   caption C5 at 17.2 s
   reads:  17.2–18.6 mRNAs are packed into a granule
           18.6–20.6 the granule is carried down the axon
           20.6–22.0 protein is made in the terminal

G  22.0–24.0 hold: every station label stays on; the side note fades in in the stage's top-right corner; the
             granule in the terminal drifts slowly and the ink boils (a live hold, not a freeze)
   caption C6 at 22.0 s (it stays on screen)
   reads:  22.0–24.0 each of these steps is a mode of post-transcriptional regulation

H  24.0–25.2 under the caption, the target panel fades up (0.4 s), then the question panel; the TDP-43 drawn in
             the question panel gains its ALS mark (the ink tick on the tail draws on, 0.5 s)
   reads:  24.0–24.6 your target is named
           24.6–25.2 the question, with the mutant TDP-43
```

Reduced motion: the end frame (all station labels, C5 rolled up above C6, both panels).

## Captions

One line each at the stage's width (22 px italic serif, about 90 characters at most), rolling up as in step 1 (`caption.js`). Each is up for at least 3 s.

| Id | Shot | Caption |
| --- | --- | --- |
| C1 | A | TDP-43 is an RNA-binding protein. It binds target RNAs with UG-rich sequences and regulates them. |
| C2 | B | RBPs regulate an RNA's life cycle. |
| C3 | C | In the nucleus, splicing removes a target's introns, so a single gene can make several isoforms. |
| C4 | D | RBPs help mature mRNAs leave the nucleus through a nuclear pore. |
| C5 | E | In the cytoplasm, RBPs regulate protein translation of an mRNA and its eventual decay. |
| C6 | F | Neurons also send many mRNAs down the axon, packaged in RBP granules, to make protein where it is needed. |
| C7 | G | Each step is a mode of post-transcriptional regulation. TDP-43 takes part in many. |

- **"Not every RNA"** is carried by the picture: the bare "non-target RNA" in the inset ("other RNA" until 2026-10-17).
- **"Takes part in many"** is deliberate: the evidence for TDP-43 in splicing, stability, transport, translation and granules is strong, while for nuclear export it is weaker, so the text doesn't claim TDP-43 does all of them equally.
- **Side note (stage corner):** "Also: one gene's isoforms, or one RNA in different cell types, can be regulated differently."

## End frame (1280×720)

Story layout. Top to bottom:
1. Eyebrow "RBP dysfunction · Step 4"; title "TDP-43 and its targets".
2. The stage (hairline box, paper showing through, as in step 1), about 280 px tall at 1280 px wide: the neuron left to right, the inset box above the axon, the side note top right, the "Schematic" pill bottom right.
3. The caption block: C6 rolled up and quiet, C7 below it.
4. Two panels side by side: **Your target** (5 parts) and **Your question** (3 parts). Since 2026-10-17 both headings are 22 px serif ("Your target: *futsch* mRNA" was 28 px, too big), and the question is upright 22 px serif between large quiet quotation marks, the opening one hung in the margin (it was italic).
5. Controls: "Next: hypotheses" and "Replay".

Everything down to the Next button fits at 1280×720; at 1920×1080 the stage grows with the width.

As drawn in the mock-up (2026-10-16):
- At 1280×720 the Next button ends at 713 px in all three cases. The stage has 8 px of padding above and below the drawing, so no label sits against its hairline.
- The close-up is a box above the axon, not a circle, because RNA strands are long and thin. Two magnifier lines run from a small circle round the TDP-43 on the intron, so the close-up reads as a zoom into the nucleus.
- The first drafts were rejected as bare and childish (instructor, 2026-10-16): an egg-shaped cell body, stubby dendrites, a trident terminal, an even-weight outline and labels scattered inside the cell. The redrawn neuron is generated by [step4-targets-neuron.py](../mockups/step4-targets-neuron.py): tapered branches as filled outlines, an outline pass with a shadow-side pass, then the wash.
- The wash runs from Membrane Blue at 7% to 17% over the paper (14% to 28% in the dark theme). The gradient is set in user space so that the parts join without seams, and the pooled rim is taken from the whole outline (an SVG erode-and-blur filter), not from each part.
- A clay bar beside the target panel was tried and dropped: it is a stock "side-tab" pattern, and the clay accent belongs to the rail's current step. The heading size carries the emphasis.
- "TDP-43" and the gene names never break at their hyphen.
- The mock-up is static: no ink boil, captions or timing.

## Per-case text

The same template in every case: what the protein does and where these neurons need it, the TDP-43 evidence, then the candidate sentence ending in the case's phenotype. There are no PTR-mode names, and nothing says where the mRNA goes (see *Giveaway checks*).

| Case | Your target | Text |
| --- | --- | --- |
| Pdf clock neurons | *futsch* mRNA | Futsch (MAP1B in humans) organises microtubules in the axons and dorsal terminals of these neurons. TDP-43 regulates *futsch* mRNA in fly motor neurons. That makes it a candidate: if mutant TDP-43 fails to regulate it, these neurons could run short of Futsch, which could explain why the mutant keeps waking at night. |
| Leg motor neuron & NMJ | *stai* mRNA | Stathmin (*stai*, STMN2 in humans) regulates microtubules in the axon and synaptic terminals of this motor neuron. STMN2 is one of the best-known TDP-43 targets in human neurons. That makes *stai* a candidate: if mutant TDP-43 fails to regulate it, the neuron could run short of stathmin, which could explain why the mutants climb poorly. |
| Mushroom body | *unc-13* mRNA | UNC-13 (UNC13A in humans) prepares synaptic vesicles for release at the Kenyon cells' synapses in the lobes. UNC13A is one of the best-known TDP-43 targets in human neurons. That makes *unc-13* a candidate: if mutant TDP-43 fails to regulate it, these neurons could run short of UNC-13, which could explain why the mutants fail the memory test. |

**The question** (all cases, gene in italic): "Which steps in the life of *futsch* mRNA go wrong when TDP-43 carries the ALS mutation?" It says "steps", plural, because modes can co-occur. It is carried forward to the top of the hypotheses step, the step 8 claim, the summary PNG header and the top of the notebook drawer.

The three proteins share one thing the text lets students see for themselves: each works far from the nucleus, in axons and synapses (futsch and stathmin on microtubules, UNC-13 at synapses). Students connect that with C6.

## Layers (instructor material only; no badges on screen)

| Claim | Layer |
| --- | --- |
| TDP-43 is an RBP that binds UG-rich sequences in thousands of RNAs | Established (CLIP studies: Polymenidou et al. 2011; Tollervey et al. 2011) |
| TDP-43 acts in splicing, stability, transport, translation and RNA granules; most of it is nuclear and it shuttles | Established; nuclear export weaker, hence "takes part in many" |
| Neurons send mRNAs into axons and translate them locally | Established |
| TDP-43 regulates *futsch* mRNA in fly motor neurons | Established (Godena et al. 2011; Coyne et al. 2014; Romano et al. 2016) |
| STMN2 and UNC13A are among the best-known TDP-43 targets in human neurons | Established (Klim et al. 2019; Melamed et al. 2019; Ma et al. 2022; Brown et al. 2022) |
| What each protein does | Established (FlyBase summaries) |
| Where these neurons need each protein | Simplified |
| TDP-43 regulates fly *stai* and *unc-13*, and a fault in the target explains the phenotype | Invented for this case (worded as "candidate") |
| Most ALS-linked TDP-43 mutations lie in the C-terminal region | Established |

## Giveaway checks

- **Localisation stays in the generic story.** C6 says that neurons send many mRNAs down the axon. The target panel says only where the protein is needed, never that the target's mRNA travels: transport is supported for the leg motor neuron, ruled out for Pdf and ambiguous for the mushroom body, so a target-specific line would nudge every group towards it.
- **The literature priors balance out.** The text names each target as a known (or orthologue-known) TDP-43 target without naming a mode. The literature points to splicing for UNC13A (the case agrees), to splicing for STMN2 (the case rules it out: the designed trap) and to transport and translation for *futsch* (the case answer is stability). It is right once, wrong once and off to the side once.
- **The FlyBase function line stays in probe design.** *stai*'s FlyBase wording ("axonal transport", "stability") stays on the probe-design gene card, as now. This step uses the sentences above.
- **Nothing mutant is drawn** (decision 3): the question names the mutation in words.
- **No failure routes are named** (decision 4). The drawing's "most TDP-43 is in the nucleus" matches the control example already given in step 3.

## Changes elsewhere (for the planning step)

- **Structure:** 8 steps. Stages: Introduction (1–2) · RBP dysfunction (3–4) · Experimental design (5 Hypotheses, 6 Probe design) · Observe (7) · Conclude (8). This touches `content.js` (`STEPS`, `STAGES`, `lockReason`), `rail.js` (`SHORT_REASON`), `main.js` (`VIEWS`), the notebook, the store comments, the review set and every "step N" in the student text, spec, storyboards, DESIGN and PRODUCT ("seven steps in five stages"). Stored state is keyed by field, not step, so it survives. There are no users yet, so old hash URLs don't matter.
- **Step 3:** "TDP-43 is an RNA-binding protein. Look at TDP-43 protein (IF) in both genotypes. Write down what you see." ("RNA-binding protein" gets a glossary hover.)
- **Hypotheses (5):**
  - The question sits at the top, then "Which steps could the TDP-43 dysfunction you saw in step 3 disturb? Shortlist at least two; several can be true at once."
  - The cards keep their Nucleus / Cytoplasm / Both groups. At 1280×720 the current step 4 already fills the height (the last card touches the bottom), so the static end-frame drawing can't sit above the cards. Proposal: a small copy in the side pane under the step 3 recap, where hovering or focusing a card lights its station.
  - The "because…" placeholder becomes "Because in step 3 we saw…".
- **Probe design (6):** renamed. One line above the map: "smFISH shows each *futsch* mRNA molecule where it is in the neuron. With two probes on different regions, you can tell which parts each molecule carries. At first, it's most informative to design probes against a constitutive exon and a constitutive intron." The gene card, its links and the FlyBase function line stay.
- **Interpret & revise (8):** the claim answers the question (heading to be settled at planning). The summary PNG and the notebook drawer show the question.
- **Glossary:** new entries for RNA-binding protein (RBP), post-transcriptional regulation and RNA granule. They are hovers in the end-frame caption and in step 3; the timed captions are plain text.
- **DESIGN.md:** record the TDP-43 red-orange exception in the drawn world.

## Open for planning (settled at planning and build; see *As built*)

1. The TDP-43 red-orange in the drawn world (DESIGN.md exception). Recommendation: allow it, because the colour keeps its data meaning. Check its contrast on dark paper.
2. The step 8 heading for the claim ("Our answer" or keep "Our leading explanation").
3. Whether the hypotheses side pane can hold the small drawing at 1280×720 alongside the recap and the Next button, or whether it needs its own disclosure.
4. Implementation: inline SVG plus GSAP, seeded and a function of time, the ink-boil filter on outlines only (never on text), reviewed with contact sheets (`tools/contact-sheet.sh`) and `tools/frozen-time.sh`.

## As built (2026-10-16)

- **Code.** `site/js/mrnalife.js` draws the neuron in the browser, ported from the mock-up script with the same geometry: the dendrites' jitter is the script's `random.Random(11)` values written out, so the branches match the approved still; the nuclear stipple is seeded with `mulberry32`. `site/js/steps/step4.js` holds the timeline and draws what moves. The styles are the "step 4" section of `app.css`; the washes are tokens (`--nw-1`, `--nw-2`, `--nuc-1`, `--nuc-2`).
- **Settled at planning.** The TDP-43 red-orange is allowed in the drawn world (DESIGN.md records it; it reads well on dark paper). The step 8 claim keeps its label, "Claim: our leading explanation", with "Your question" above it. The small drawing fits the hypotheses' side pane at 1280×720 without a disclosure or a scroll. Implementation as in item 4.
- **Shots as built** in the first build (seconds on the step's clock; `?t=` freezes it; superseded by *Redesign*):
  - **A, 0–4.6.** The close-up fills the stage at 2.4 times its size. Frame 0 is complete: both strands, the sequences and two free TDP-43 above the target strand. They drift (0–1.2), settle onto the UG run (1.2–2.6) and close their lobes on it (2.4–2.8; the lobes hinge like tongs). "target RNA" at 2.8, "other RNA" at 3.3. C1 at 0.3.
  - **B, 4.6–5.8.** The close-up shrinks into its box (smootherstep, 1.0 s). The outline draws on from the cell body to the terminals, each shape over 0.55 s in order of its left edge (4.8–5.8); the nucleus fades in at 5.0, the wash at 5.1–5.8, the microtubules draw at 5.2, the magnifier at 5.4 and the compartment labels at 5.5–5.85.
  - **C, 5.8–10.2.** The nuclear TDP-43 at 5.8, the pre-mRNA at 5.9, and its TDP-43 lands on the straight intron (6.6–7.2). The intron loops out with TDP-43 riding it (7.6–8.6); "splicing" at 9.0. The exons are not shown joining: the end frame keeps the looped intron, which is what reads as splicing, and the joined product is the mRNA that leaves in D.
  - **D, 10.2–13.0.** The finished mRNA and its TDP-43 appear inside the nucleus and slide out through the pore (10.5–12.0); "nuclear export" at 12.0.
  - **E, 13.0–17.2.** The translation strand draws on; the small subunit grows (13.5), the large one drops on (13.8), and four beads follow (14.2–15.0); "translation" at 14.4. The older copy's far end is erased back to its end-frame length (15.3–16.5), leaving four fragments that fade to their end opacities; "decay" at 16.4.
  - **F, 17.2–22.0.** Two mRNAs and two TDP-43 gather (17.2) and the halo forms (17.6) at the start of the neurite; "RNA granule" at 18.0. The motor appears (18.2) and walks the granule to mid-axon (18.6–20.6, easing in, gliding and slowing), its feet stepping on the lower microtubule. The neurite and axon swell just enough round the granule wherever it is (their outlines are redrawn each frame), so the end frame's swelling is where it stops. Trail marks at 18.8; the transport arrow's shaft and then its head draw on (19.2–20.2); "transport" at 19.8. In the large bouton the strand and a TDP-43 appear (20.6), a ribosome assembles and three beads grow (20.8–21.8); "local translation" at 21.4. As the plan proposed, F reads "the granule travels to mid-axon; separately, a ribosome makes protein in the bouton": the granule does not reach the terminal or loosen there, matching the end frame.
  - **G, 22.0–24.0.** C7; the side note at 22.4–23.0. The live hold is the ink boil on the outlines; the granule does not drift.
  - **H, 24.0–25.2.** The target panel (24.0–24.4), the question panel (24.6–25.0).
- **Captions with hovers.** C1, C6 and C7 carry glossary hovers (RNA-binding protein, granules, post-transcriptional regulation), in the timed captions too, not only at the end frame: `caption.js` now sets trusted constant HTML. On the rolled-up line, which screen readers skip, the hovers leave the tab order. Step 3's sentence and the hypotheses prompt carry the RBP and post-transcriptional regulation hovers.
- **Ink boil.** The shared filter from `fly.js` on the neuron's outline, the nuclear envelope and the RNA strands; TDP-43, ribosomes and text stay crisp. (Since the redesign it runs on the held end frame only.) Frozen time and reduced motion keep the filter still.
- **Changes at build (instructor, 2026-10-16).**
  - Probe design: the smFISH line stays above the map. The map's minimum row pitch went from 32 to 26 px so the mushroom body's seven isoforms fit at 1280×720; read-only maps keep 32 px.
  - Summary slide: the question is its own row above the probe pair, labelled "QUESTION". In the right column it pushed a long claim into the footer. Claim and Uncertainty now go down to 22 px.
  - Rail: the lock reasons are one line each ("Needs two modes", "Needs a probe pair", "Needs every verdict").
- **Checks.** The `?t=25.2` frame equals the reduced-motion frame (no pixel differs by more than 8 levels at 1280×720). Playback holds 60 fps on the dev laptop, and every sampled frame of the stage has motion. Next ends at 713 px at 1280×720 in all three cases; 1920×1080 and the dark theme were checked by eye.

## Redesign (2026-10-16)

The instructor reviewed the first build and asked for four changes:
1. At each caption change, the stage briefly contracted and grew back.
2. The TDP-43 symbol beside the question is not needed.
3. The animation should be redesigned from scratch in the step 2 descent's motion language: lines drawn on; elements, labels and particles coming together gradually. The jittery ink is kept for the final still only.
4. "RNA granule" becomes "RNA transport granule".

**Decisions:** timed (not scroll-driven) and about 25 s, inside the same stage; the camera follows one mRNA through the neuron; the rename applies to the station label and the alt text only.

### Fixes

- **The roll-up beat.**
  - *Cause:* the rolled-up line starts scaled up from its left edge, so for about 0.25 s it reached 151 px (1280) or 293 px (1920) past the right edge. With classic scrollbars a scrollbar flashed, and the full-width stage shrank and grew back. Step 1 shared the bug.
  - *Fix:* the caption box clips sideways (`overflow-x: clip`). It is `clip`, not `hidden`, because the outgoing line rises above the box.
  - *Measured:* no overflow frames on steps 1 and 4 at either size; there were 48–54 before.
- **The question panel** holds the question alone. It now wraps to three lines, and Next still ends at 713 px.

### Motion language (from the descent)

- **Camera.** The camera is the SVG viewBox. It moves between stops with log-height interpolation, one move at a time, with eased starts and stops. The drawing's width and height attributes fix its shape, so the page never lays out again while the camera moves.
- **Line widths.** Strokes keep their end-frame width on screen when the camera is in close. Molecules (TDP-43, ribosomes, beads, the granule) scale with the zoom, so they read larger up close.
- **Lines draw on.**
  - The neuron grows out from its cell body behind a widening front: each branch's outline draws out along both sides from its base, and the wash follows behind it.
  - The envelope arcs, the microtubules and every RNA strand draw on; strands draw 5′ → 3′.
- **Particles gather.**
  - The chromatin stipple converges from seeded points further out.
  - TDP-43 comes into the nucleus through the pores.
  - The granule's cargo gathers from about 25 units out.
  - Protein beads extrude from the ribosome one at a time, pushing the earlier ones out.
- **Labels.**
  - On the journey, labels sit in screen space at the size of the end frame's callouts. Each has a hairline leader that draws to a dot, like the callouts.
  - Each label leaves as the camera moves on, before the next arrives.
  - In G, the end frame's own labels arrive one by one.
- **Ink.**
  - No SVG filter runs while the camera moves: zooming with the filters on gave frames of up to 233 ms.
  - The ink filter and the pooled rim come on once the camera is still (H); the rim fades in over 0.6 s.
  - The ink boils only on the held end frame, in live play. During the journey the wash is flat, as the descent's neurons are.

### Shots as built

Times are in seconds on the step's clock (`?t=` freezes it); the step ended at 25.4 s. Superseded by the slower timings in *Revisions (2026-10-17)*. The captions are unchanged (C1–C6) and each is up for at least 3 s.

| Shot | Time (s) | Camera | What happens |
| --- | --- | --- | --- |
| A | 0–3.4 | The close-up fills the stage (2.4×) | C1 at 0.3. Two TDP-43 travel curved paths to the UG run (0.3–2.0) and close their lobes on it. Four others drift past the other RNA and leave (they fade out between 1.3 and 2.7). "target RNA" at 2.2, "other RNA" at 2.6. |
| B | 3.4–6.6 | Whole | The close-up shrinks into its box (smootherstep, 3.4–4.4). The neuron grows from its cell body (3.7–5.9): the cell body's outline closes on the neurite, the nucleus and its envelope draw in, then the neurite, dendrites, axon and terminals; the microtubules draw at 4.9–6.2. The compartment names come in one at a time (5.3–6.05) and leave with the close-up by 6.45. |
| C | 6.6–9.8 | Nucleus | C2. The chromatin gathers (6.8–8.7). Four TDP-43 come in through the pores (7.0–8.45). The pre-mRNA draws 5′ → 3′ (7.5–8.15). A fifth TDP-43, in through the upper pore, lands on the intron (8.2–8.6) and rides it as it loops out (8.6–9.3). "splicing" at 8.8. |
| D | 9.8–12.8 | The pore | C3. The finished mRNA draws inside the nucleus, below the splice site, and its TDP-43 lands on it (10.2–10.9). It lines up with the pore and leaves through it (10.9–12.3). "nuclear export" at 11.8. |
| E | 12.8–15.9 | Cell body | C4. The translation strand and the older copy draw on (13.3–13.9). The ribosome's subunits close on the mRNA from either side (13.7–14.3), and four beads extrude (14.2–15.0). The older copy's far end is erased (14.5–15.2), and its fragments break off where the erasing passes them. "translation" at 14.3, "decay" at 15.0. |
| F | 15.9–22.0 | The start of the neurite, then following the granule, then the terminals | C5. Two mRNAs and two TDP-43 gather (16.3–17.35), and the dashed halo grows round them (16.8–17.3). "RNA transport granule" follows the granule from 17.1. The motor walks it to mid-axon (17.6–19.2) while the camera follows; the transport arrow draws (18.8–19.45); "transport" at 19.0. The camera glides to the terminals (20.1–20.9): the strand, a TDP-43, the ribosome closing and three beads (20.5–21.7); "local translation" at 21.1. |
| G | 22.0–24.4 | Pull back to the end frame (22.0–23.0) | C6. Only after the camera settles do the station labels arrive one by one, each leader drawing to its dot (23.0–24.0). Then come the compartment names, the close-up (23.4), its magnifier (23.6) and the side note (23.9). |
| H | 24.4–25.4 | Still | The ink filter and the rim; the target panel (24.5), then the question panel (24.9). In live play the boil starts at 25.4. |

### Details settled at build

- **Camera stops.** The camera stops ([centre x, centre y, height] in the drawing's units, end frame [492, 141, 270]) were chosen so that every station, label and pore shown sits inside the view:

  | Stop | [x, y, height] |
  | --- | --- |
  | Nucleus | [240, 157, 132] |
  | Pore | [210, 162, 96] |
  | Cell body | [222, 208, 122] |
  | Neurite | the granule's start + 30, 150, 110 |
  | Synaptic terminals | [800, 158, 150] |

  While it follows the granule, the camera runs 30 units ahead of it. The close-up is hidden while the camera is in close, because the neurite stop would show its lower edge.
- **The export mRNA.** It is drawn inside the nucleus 6 units lower than the pore and slides up into line before it leaves. Otherwise its TDP-43 would sit on top of a nuclear TDP-43.
- **The swelling.** While the granule travels, the neurite and the axon are drawn as one tube. In the first build the two shapes' swellings crossed where the axon begins, which left a kink for a moment. At rest they are the end frame's two shapes again.

### Code

- `site/js/storycam.js`: the camera track, the viewBox, the mapping from drawing to screen, the callout geometry, and the eases written out.
- `site/js/steps/step4.js`: sets every part from story time on each frame, and writes only what changed.
- `mrnalife.js`:
  - gained class hooks and the travelling tube;
  - three paths are split into one path per stroke: the envelope's arcs, the granule's two mRNAs and the two magnifier lines;
  - what it draws is otherwise unchanged.

### Checks

- **End frame.** `?t=25.4` equals the drawing as written and the reduced-motion frame (no pixel differs in either comparison).
- **Frame rate.** 60 fps at 1280×720 and 1920×1080 on the dev laptop, with no frame over 16.8 ms. The first run in a fresh browser had three one-off frames of 230–300 ms while the browser warmed up.
- **Filters.** They are off from A to G and on from 24.4 s. Skip starts the boil; Replay and leaving the page stop it.
- **Layout.** Next ends at 713 px at 1280×720 in all three cases and both themes. The labels stay on their anchors after a resize mid-journey.
- **Recording.** Counting changed pixels per frame inside the stage finds no still stretch during the journey.

## Revisions (2026-10-17)

The instructor asked for these changes, in all three cases:
1. **Slower.** The 25 s limit was the wrong call: the journey must be slow enough for students to read the captions and the labels.
2. **No side branches.** The dendrites on the neurite made little sense and are removed.
3. **Labels.** "TERMINALS" becomes "SYNAPTIC TERMINALS"; "other RNA" in the close-up becomes "non-target RNA".
4. **Panels.** "Your target: *gene* mRNA" was too big and "Your question" too small: both headings are now 22 px serif. The question is no longer italic: it is upright, between large quiet quotation marks, everywhere it is carried (step 4, the hypotheses, step 8, the notebook and the summary slide).
5. **The side note** is set right-aligned in its corner.
6. **The gene name** goes into the leg motor neuron's text: "Stathmin (*stai*, STMN2 in humans) …". Futsch/*futsch* and UNC-13/*unc-13* already share their names, so the other two texts are unchanged.
7. **TDP-43 outside the nucleus.** A few TDP-43 molecules are now drawn in the cytoplasm, especially by translation and decay. TDP-43 is enriched in the nucleus but not confined to it.

### The drawing

- **Removed:** the neurite's three dendrites, and the jitter values that shaped them.
- **The close-up:** the strands now start at x 450, not 420, so "non-target RNA" fits beside them. The sequences and the two bound TDP-43 moved with the strands.
- **"SYNAPTIC TERMINALS"** is centred at x 818, clear of the Schematic tag at 1280×720.
- **TDP-43:**
  - three more molecules in the nucleus, which now holds eight, counting the one on the intron, so the nucleus stays clearly the richest;
  - four in the cytoplasm:
    - on the 3′ side of the mRNA being translated;
    - near the 5′ end of the copy being broken down;
    - in the axon beyond the granule;
    - in the uppermost synaptic terminal.
- **Alt text** updated to match.

### Timings (54.6 s)

Times are written from the start of each shot (`SHOT` in `step4.js`), so a shot can be lengthened without moving the others. Each motion is 1.5 to 2 times slower than in the redesign, and each station is held long enough to read its caption and label. While a station is held, the camera pushes in slowly (5% over the hold), so the frame doesn't go still.

| Shot | Time (s) | Caption up for | What happens (times from the shot's start) |
| --- | --- | --- | --- |
| A | 0–6.5 | C1 from 0.3 to 7.0 | The binders travel (0.8–3.5) and clasp the UG run (3.2–4.1); the others drift onto the non-target RNA, touch it and bounce lightly off as they fade (touching at 2.4, 2.8, 3.2 and 3.6; gone by 4.7); "target RNA" at 4.2, "non-target RNA" at 4.8. |
| B | 6.5–12.5 | C2 from 7.0 | The close-up shrinks into its box (0–1.4). The neuron grows (0.5–4.1). The microtubules draw (2.4–4.6). The compartment names come in one at a time (3.6–5.2) and leave with the close-up (5.5–5.9). |
| C | 12.5–20.5 | C3, 8 s | Camera to the nucleus (0–1.8). The chromatin gathers (0.3–2.9). Seven TDP-43 come in through the pores (0.6–3.7). The pre-mRNA draws (2.4–3.6). TDP-43 lands on the intron (3.7) and the intron loops out (4.5–5.7). "splicing" at 5.0. |
| D | 20.5–27 | C4, 6.5 s | Camera to the pore (0–1.6). The finished mRNA draws (1.0), its TDP-43 lands (1.5), it lines up (2.2) and leaves through the pore (2.6–4.4). "nuclear export" at 4.0. |
| E | 27–34.5 | C5, 7.5 s | Camera to the cell body (0–1.6). Both strands draw (1.0–2.1) and a TDP-43 lands on each (1.7, 2.1). The ribosome closes (2.2–3.1); four beads extrude (3.0–4.6). The older copy's far end is erased (4.6–5.8). "translation" at 3.4, "decay" at 5.5. |
| F | 34.5–48 | C6, 13.5 s | Camera to the neurite (0–1.6). The cargo gathers (1.0–2.9) and the halo grows (2.0–2.8); "RNA transport granule" at 2.6. The motor walks the granule to mid-axon (3.6–6.6), followed by the camera; the axon's free TDP-43 drifts in (5.4). The arrow draws (6.2–7.3); "transport" at 6.8. Camera to the terminals (8.8–10.4); a TDP-43 drifts into a terminal (9.8); local translation (9.8–12.5), with its label at 11.4. |
| G | 48–53 | C7 to the end | The camera pulls back (0–1.8). The labels arrive one by one, 0.2 s apart (2.0–4.4), then the close-up (3.0), its magnifier (3.4) and the side note (4.0). |
| H | 53–54.6 | | The ink and the rim (0–0.8); the target panel (0.2), then the question (0.7). |

### Checks

- **End frame.** `?t=54.6` equals the drawing as written and the reduced-motion frame (no pixel differs in either comparison).
- **Frame rate.** 60 fps through the whole 54.6 s at 1920×1080 (no frame over 16.8 ms).
- **Layout.** At 1280×720 Next ends at 708 px in all three cases and both themes; the smaller target heading moved it up from 713. On the summary slide the upright question still fits one line in every case.
- **Elsewhere.** The question reads correctly in the hypotheses pane, the notebook drawer and step 8.

## Revisions (2026-10-19)

Instructor's wording, with grammar corrected.

- **Captions, now seven.** C1 "TDP-43 is an RNA-binding protein. It binds target RNAs with UG-rich sequences and regulates them." A new C2 at 7.0 s (shot B, as the neuron grows): "RBPs regulate an RNA's life cycle." It was written as the opening of the splicing caption, but the two together ran past one line at 1280 px, so it has its own beat. C3–C6 are reworded so that RBPs are the subject (see the caption table above). C7 is the old C6. At 1280×720 the widest caption (C6, the axon) is 921 px of the line's 968.
- **Shot A.** The four free TDP-43 no longer drift past the non-target RNA. Each drifts onto it, touches it, and springs lightly back with a small turn from the glancing touch while it fades (touches at 2.4, 2.8, 3.2 and 3.6 s; each gone 1.1 s after its touch). This is a rebound, not a bounce ease: there is one touch, and the push off dies away exponentially with no oscillation. The start points are clear of the "…UGUGUGUG…" and "…ACGAUCCA…" sequences and inside the box (`BOUNCE` and `REBOUND` in `step4.js`).
