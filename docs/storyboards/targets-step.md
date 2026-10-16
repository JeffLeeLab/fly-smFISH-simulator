# Storyboard: step 4, TDP-43 and its targets (all three cases)

Draft for review before the planning step (2026-10-16). It adds a new step between the TDP-43 observation and the hypotheses. The decisions below were agreed with the instructor on 2026-10-16; nothing has been built yet. The format follows the openings storyboards: each shot lists what is seen and its timing, then its **reads**, the things the viewer must understand, in order.

Still mock-up of the end frame: [step4-targets-endframe.html](../mockups/step4-targets-endframe.html) (served from the repo root; `?case=nmj|mb|pdf`, `?theme=dark`), rendered as `docs/mockups/mockup-step4-targets-*.png`.

## Why this step

Students currently go from "TDP-43 looks abnormal" (step 3) straight to shortlisting PTR modes, then straight to a transcript map. Before step 4, nothing says that TDP-43 is an RNA-binding protein (only the rail's stage name does), "mode" is never defined, and nothing says why this gene. The missing links are:

phenotype (step 1) ← these neurons (step 2) ← **a protein these neurons need** ← **its mRNA has to be processed, moved, kept and translated** ← **TDP-43 binds that mRNA and regulates those steps** ← TDP-43 looks abnormal in the mutant (step 3)

This step supplies the three links in bold, then asks the question the hypotheses answer.

## Decisions (instructor, 2026-10-16)

1. **The target comes before the hypotheses.** There is a new step 4, "TDP-43 and its targets". Hypotheses move to step 5 and probe design to step 6, renamed "Probe design" because the target is now met in step 4. The reveal becomes step 7 and Interpret & revise step 8. The spec's "Before the gene" rule becomes "Before the map": the transcript map and the FlyBase and NCBI links still appear only in probe design.
2. **A timed journey that ends on a labelled frame** (not a click-through). The end frame teaches on its own, so slower readers lose nothing.
3. **Mutant TDP-43 appears only at the question.** The drawing shows what TDP-43 normally does. It never shows what the mutant does to the RNA. A generic mutant frame ("leaves the nucleus and aggregates") would be wrong for the leg motor neuron, which has no aggregates (its granules are larger and stretched instead), and it would pre-empt step 3.
4. **No statement of the two failure routes** (loss of function, gain of function). Students read them from the step 3 images.
5. **The phenotype link is stated as a candidate**, not grounded in the literature: the protein is needed far from the nucleus in these neurons, so if TDP-43 mishandles its mRNA, the neurons could run short of it.

## Whole piece

- **Logline.** TDP-43 binds its target RNAs and acts on them at each stage of their life. Here is one target these neurons need. Which stages fail in the mutant?
- **Same for all three cases.** The drawing and the captions are generic. Only the target panel and the question change with the case.
- **World.** The story layer, as in steps 1–2: ivory paper, ink outlines that boil 12 times a second, flat washes. The neuron is drawn in Membrane Blue, as in the descent. **TDP-43 is drawn in the TDP-43 channel's red-orange** (`--tdp`), so it reads as the protein students have just looked at. This is a deliberate exception to "blue is the only saturated colour in the drawn world" (DESIGN.md): a data colour keeps its meaning in the drawing. The mRNA is in ink. There are no smFISH colours: colour still arrives with the probes.
- **One persistent actor.** One target mRNA, from the binding close-up to the terminal, with TDP-43 on it.
- **Budget.** About 24 s timed, then the target panel and the question appear and wait. A Skip button, then Replay. Next is available throughout, as in step 1. Reduced motion shows the end frame. Frozen time (`?t=`) works, as on every story page.
- **Label.** A dashed "Schematic" pill on the stage (*Motion principles*: animations are labelled schematic or simulated).

## Drawing elements

- **TDP-43:** two round lobes side by side (its two RNA-recognition motifs, RRMs) that clasp the RNA, a small knob in front (the N-terminal domain) and a loose wavy tail (the C-terminal region). The **ALS mark** is a heavier ink tick across the tail, as in the landing hero, because most ALS-linked mutations lie in the C-terminal region. Students are never told the domain names.
- **RNA:** an ink line with a small dot at the 5′ end. In pre-mRNA the exons are thick and the introns thin.
- **Splicing:** the intron, with TDP-43 on it, loops out and is removed; the exons join.
- **Nuclear export:** the mRNA threads through a gap in the nuclear envelope's double line (a pore).
- **Translation:** a two-subunit ribosome on the mRNA, with a short chain of beads (the protein) growing from it.
- **Decay:** a second, older copy of the mRNA shortens from one end and breaks into fading dots. There is no Pac-Man shape, which would clash with the sober tone.
- **RNA granule:** a soft halo holding several mRNAs and TDP-43 molecules.
- **Transport:** a small two-footed motor walking the granule along a microtubule (two thin parallel lines) in the axon.
- **Local translation:** in a terminal bouton, a ribosome on the mRNA making protein.
- **Neuron:** a unipolar fly neuron, like the ones students saw in steps 2–3. It has a round cell body holding a large nucleus, then one neurite with dendrites branching from it (unlabelled), the axon and a beaded terminal arbor ending in boutons. The compartments are labelled in the small-caps label style: Nucleus, Cell body, Axon, Terminals.
- **How it is drawn:** in the style of a Cajal ink drawing, not clip-art.
  - The outline is a Membrane Blue ink line, heavier on the shadow side (bottom right).
  - The wash is one gradient across the whole neuron, deepening towards the bottom, with a darker rim where the wash pools at the edges.
  - The dendrites taper to a hairline through three orders of branching.
  - Three fine microtubules run down the axon and fan round the nucleus.
  - The nucleus is stippled, with a faint nucleolus.
  - Station labels are callouts with hairline leaders, outside the cell where there is room.
- **Not places:** isoform-specific and cell-type-specific regulation are a quiet side note in the stage corner, not stations.

## Shot list (about 24 s; frame 0 is a finished image)

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
| C1 | A | TDP-43 is an RNA-binding protein. It binds RNAs with UG-rich sequences: its targets. |
| C2 | C | In the nucleus, splicing removes a target's introns. One gene can make several isoforms. |
| C3 | D | The finished mRNA leaves the nucleus through a nuclear pore. |
| C4 | E | In the cytoplasm, it is translated into protein and, in the end, broken down. |
| C5 | F | Neurons send many mRNAs down the axon in granules, to make protein where it is needed. |
| C6 | G | Each step is a mode of post-transcriptional regulation. TDP-43 takes part in many. |

- **"Not every RNA"** is carried by the picture: the bare "other RNA" in the inset.
- **"Takes part in many"** is deliberate: the evidence for TDP-43 in splicing, stability, transport, translation and granules is strong, while for nuclear export it is weaker, so the text doesn't claim TDP-43 does all of them equally.
- **Side note (stage corner):** "Also: one gene's isoforms, or one RNA in different cell types, can be regulated differently."

## End frame (1280×720)

Story layout. Top to bottom:
1. Eyebrow "RBP dysfunction · Step 4"; title "TDP-43 and its targets".
2. The stage (hairline box, paper showing through, as in step 1), about 280 px tall at 1280 px wide: the neuron left to right, the inset box above the axon, the side note top right, the "Schematic" pill bottom right.
3. The caption block: C5 rolled up and quiet, C6 below it.
4. Two panels side by side: **Your target** (5 parts) and **Your question** (3 parts). "Your target: *futsch* mRNA" is set at heading size (28 px serif) so it stands out; "Your question" is a smaller heading over the question in 22 px italic serif.
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
| Leg motor neuron & NMJ | *stai* mRNA | Stathmin (STMN2 in humans) regulates microtubules in the axon and synaptic terminals of this motor neuron. STMN2 is one of the best-known TDP-43 targets in human neurons. That makes *stai* a candidate: if mutant TDP-43 fails to regulate it, the neuron could run short of stathmin, which could explain why the mutants climb poorly. |
| Mushroom body | *unc-13* mRNA | UNC-13 (UNC13A in humans) prepares synaptic vesicles for release at the Kenyon cells' synapses in the lobes. UNC13A is one of the best-known TDP-43 targets in human neurons. That makes *unc-13* a candidate: if mutant TDP-43 fails to regulate it, these neurons could run short of UNC-13, which could explain why the mutants fail the memory test. |

**The question** (all cases, gene in italic): "Which steps in the life of *futsch* mRNA go wrong when TDP-43 carries the ALS mutation?" It says "steps", plural, because modes can co-occur. It is carried forward to the top of the hypotheses step, the step 8 claim, the summary PNG header and the top of the notebook drawer.

The three proteins share one thing the text lets students see for themselves: each works far from the nucleus, in axons and synapses (futsch and stathmin on microtubules, UNC-13 at synapses). Students connect that with C5.

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

- **Localisation stays in the generic story.** C5 says that neurons send many mRNAs down the axon. The target panel says only where the protein is needed, never that the target's mRNA travels: transport is supported for the leg motor neuron, ruled out for Pdf and ambiguous for the mushroom body, so a target-specific line would nudge every group towards it.
- **The literature priors balance out.** The text names each target as a known (or orthologue-known) TDP-43 target without naming a mode. The literature points to splicing for UNC13A (the case agrees), to splicing for STMN2 (the case rules it out: the designed trap) and to transport and translation for *futsch* (the case answer is stability). It is right once, wrong once and off to the side once.
- **The FlyBase function line stays in probe design.** *stai*'s FlyBase wording ("axonal transport", "stability") stays on the probe-design gene card, as now. This step uses the sentences above.
- **Nothing mutant is drawn** except the shape beside the question (decision 3).
- **No failure routes are named** (decision 4). The drawing's "most TDP-43 is in the nucleus" matches the control example already given in step 3.

## Changes elsewhere (for the planning step)

- **Structure:** 8 steps. Stages: Introduction (1–2) · RBP dysfunction (3–4) · Experimental design (5 Hypotheses, 6 Probe design) · Observe (7) · Conclude (8). This touches `content.js` (`STEPS`, `STAGES`, `lockReason`), `rail.js` (`SHORT_REASON`), `main.js` (`VIEWS`), the notebook, the store comments, the review set and every "step N" in the student text, spec, storyboards, DESIGN and PRODUCT ("seven steps in five stages"). Stored state is keyed by field, not step, so it survives. There are no users yet, so old hash URLs don't matter.
- **Step 3:** "TDP-43 is an RNA-binding protein. Look at TDP-43 protein (IF) in both genotypes. Write down what you see." ("RNA-binding protein" gets a glossary hover.)
- **Hypotheses (5):**
  - The question sits at the top, then "Which steps could the TDP-43 dysfunction you saw in step 3 disturb? Shortlist at least two; several can be true at once."
  - The cards keep their Nucleus / Cytoplasm / Both groups. At 1280×720 the current step 4 already fills the height (the last card touches the bottom), so the static end-frame drawing can't sit above the cards. Proposal: a small copy in the side pane under the step 3 recap, where hovering or focusing a card lights its station.
  - The "because…" placeholder becomes "Because in step 3 we saw…".
- **Probe design (6):** renamed. One line above the map: "smFISH shows each *futsch* mRNA molecule where it is in the neuron. With two probes on different regions, you can tell which parts each molecule carries." The gene card, its links and the FlyBase function line stay.
- **Interpret & revise (8):** the claim answers the question (heading to be settled at planning). The summary PNG and the notebook drawer show the question.
- **Glossary:** new entries for RNA-binding protein (RBP), post-transcriptional regulation and RNA granule. They are hovers in the end-frame caption and in step 3; the timed captions are plain text.
- **DESIGN.md:** record the TDP-43 red-orange exception in the drawn world.

## Open for planning

1. The TDP-43 red-orange in the drawn world (DESIGN.md exception). Recommendation: allow it, because the colour keeps its data meaning. Check its contrast on dark paper.
2. The step 8 heading for the claim ("Our answer" or keep "Our leading explanation").
3. Whether the hypotheses side pane can hold the small drawing at 1280×720 alongside the recap and the Next button, or whether it needs its own disclosure.
4. Implementation: inline SVG plus GSAP, seeded and a function of time, the ink-boil filter on outlines only (never on text), reviewed with contact sheets (`tools/contact-sheet.sh`) and `tools/frozen-time.sh`.
