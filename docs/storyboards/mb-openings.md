# Storyboard: openings, mushroom body case (steps 1–2)

Signed off by the instructor on 2026-10-12: decisions 1–6 as proposed (spec, *Openings* and *Motion principles*). The same day the instructor named the peduncle the "axon bundle" for students: "Axon bundle (peduncle)" in the descent, "Axon bundle" everywhere after; the calyx is described as the dendrites and not labelled. Same format as the [Pdf storyboard](pdf-openings.md): each shot lists what is seen, its event and the camera, then its **reads**, the things the viewer must understand, in order, each with a start and end time. One read at a time; a shot is as long as its reads need. The hero (segment 1) is shared by all cases and is not repeated here.

## Decisions (signed off 2026-10-12)

1. **Assay view.** The T-maze is drawn front-on, as it stands on the bench: a vertical training tube above the choice point, and the T's two horizontal arms. The flies are then seen from the side, so the existing side-view walking drawings and the activity monitor's walk–pause model carry over, and no new fly drawings are needed. The landing station is redrawn to match (today's still shows the maze from above). *Alternative:* a top view, which needs new top-view walking drawings.
2. **Training, compressed.** The real protocol is about 60 s of OCT with 12 shocks, 45 s of air, then 60 s of MCH. Proposal: one compressed cycle, OCT with three shock pulses, a breath of air, then MCH with none (*Simplified*). *Alternative:* the real 12 pulses as tick marks on a small timeline bar under the tube.
3. **Odours in muted colour; shocks in ink.** Each odour is a muted watercolour wash under its own ink texture: OCT ochre with a drifting stipple, MCH slate-teal with short wavy strokes. The washes stay clear of the data hues (smFISH green and magenta, TDP-43 red, membrane blue), and the textures mean that colour is never the only cue. (Ink only at first, since colour belongs to the data; the instructor asked for colour on 2026-10-13 so students can follow the odours coming in.) A shock is an ink zig-zag flashing along the grid, and the flies hop. Labels gloss the odours once: "OCT (3-octanol)", "MCH (4-methylcyclohexanol)".
4. **The memory phenotype** (invented for this case). Tested a few minutes after training, the hTDP-43 WT flies mostly avoid OCT (8 of 10 in the MCH arm, performance index 0.6); the mutants choose at random (5 of 10, index 0.0). Ten drawn flies per lane stand in for about 100 (*Simplified*); the reciprocal experiment (MCH shocked) is not shown. *Signed off with the mutants at 6 of 10 (index 0.2); amended 2026-10-12 at the instructor's request to the starker alternative, chance, so the drop reads at a glance.*
5. **Which fly we enter.** Proposal: one hTDP-43 WT fly from the MCH arm (a fly that remembered) lifts out of the maze, as the Pdf descent lifts the WT fly from its tube.
6. **The turn into the oblique view.** The viewer shows the mushroom body in an oblique view (about 35° down from the front, turned about 30° to the side), so the cell bodies, axon bundle (peduncle) and lobes each have their own space. Proposal: the brain is drawn from the front as in the Pdf case; once it has faded, the mushroom body alone turns from the front view to the oblique view while the camera pushes in. The turn is a morph between projections of the same 3D outline (from the MaleCNS Kenyon cells), so it is true to the anatomy. *Alternative:* a cross-fade from the front view to the oblique view, with no turn.

## Whole piece

- **Logline.** Two flies carry the same human gene, one with a single change; one remembers which odour came with a shock and the other remembers less, so we look inside the brain at a centre for learning and memory.
- **World, motif, actor.** As in the Pdf case: ivory paper, boiling ink, membrane blue only for the labelled cells; the pair, hTDP-43 WT left and the mutant right, from the hero to the T-maze lanes, the split and the viewer. One persistent actor: hero flies → legend → the flies in the mazes → the WT fly → its head → its mushroom body → the viewer's outline.
- **Budget.** 38.9 s, as for Pdf: hero 9.6 s, T-maze 15.3 s, descent 14 s. Skip and Replay on every segment; captions 1–2 lines of HTML; no audio. Reduced motion shows each segment's end frame.
- **Flies.** Side view in the maze (walking, pausing, grooming, a short hop at a shock); frontal view for the descent.

## 2 · Three-assay landing (`#/`), ambient

```
F  ambient   the T-maze station, live: a small front-on maze per lane after the test; the flies walk
             and pause inside their arms (most WT flies in the MCH arm, the mutants split half and half; the station draws 3 and 3);
             the odour textures drift faintly; hover brings it forward as the other stations
   reads:  (self-paced) the mushroom body experiment: flies choosing between two arms
   [transition out, on click: the station expands into the stage (Flip); URL #/mb/step-1]
```

As built (cards, 2026-10-16): the station card follows the spec's *Openings*. The title is the phenotype ("Learning & memory"), with the system ("Mushroom body system") and the assay ("T-maze assay") below the drawing, and the lane labels sit above it.

## 3 · Chosen assay: T-maze (`#/mb/step-1`), 15.3 s (3.5 s before the group's action, 11.8 s after)

Layout per lane (WT left, mutant right): the training tube (lined with the shock grid, a fine helical hatch) stands above the choice point; at its foot a short sliding chamber (the elevator) carries the flies down to the T; the OCT arm runs to one side and the MCH arm to the other, the same sides in both lanes. A counter (mono numbers) sits under each arm. "Simulated data" pill at the bottom right of the stage.

```
G 0.0–3.5    [transition in: the station expands (Flip), 0.8 s]  ten flies per lane wander on the walls
             of the training tube; faint odour textures drift in the empty arms
   reads:  0.8–2.2  a training tube with a shock grid, above a choice point (labels: "training tube",
                    "shock grid", "OCT (3-octanol)", "MCH (4-methylcyclohexanol)")
           2.2–3.5  the two arms smell different
   caption: "Flies learn in the training tube, then choose between two odours at the T."
   then waits (flies keep wandering) for the button "Train the flies"

H 0.0–4.2    (after the click) OCT flows down the tube (the stipple drifts in from the top); the grid
             flashes three times (0.5, 1.2, 1.9 s; an ink zig-zag along the hatch, 0.15 s each) and at
             each flash the flies hop and freeze for a beat (cause → effect); 2.2–2.6 air (the stipple
             clears); 2.6–4.2 MCH flows (wavy strokes), no flashes, the flies walk calmly.
             An odour hose runs into the tube's inlet, its free end tagged with what flows (OCT, then
             air, then MCH) beside a swatch of its colour; the hose fills with that colour and the
             odour's own texture (OCT ochre dots, MCH teal dashes) runs along it into the tube. An ink lightning bolt beside the shock grid pops at each pulse with a running
             count (×1, ×2, ×3) and fades before MCH
   reads:  0.2–2.2  this odour comes with shocks
           2.6–4.2  this one doesn't
   caption: 0.0 "OCT comes with mild shocks. MCH comes with none."

I 4.2–8.4    the elevator slides the flies down to the choice point (0.8 s); both arms fill with their
             odour; the flies walk out and into the arms (walk–pause); each fly that crosses an arm's
             entrance line ticks that arm's counter up (the line thickens for a beat)
   reads:  4.4–7.0  each fly goes one way or the other
           7.0–8.4  the WT flies mostly avoid OCT; the mutants split evenly
   caption: 4.2 "A few minutes later, each fly picks an arm."

J 8.4–11.8   under each lane the performance index builds: "PI = (MCH − OCT) / all flies", then the
             numbers, (8 − 2) / 10 = 0.6 for WT and (5 − 5) / 10 = 0.0 for the mutant, and a short ink
             bar on a 0–1 scale with a dot at each lane's value and "chance" under the 0; from 10.6 s the flies rest and groom; the "Next: look inside the brain"
             button
   reads:  8.7–10.6 one number for memory: higher means the flies remembered better
           10.8–11.8 where to go next (the hold continues, untimed, until the group moves on)
   caption: 8.4 "Performance index: 1 if every fly avoided the shocked odour, 0 if they chose at random."
```

Reduced motion: the end frame of G; on "Train the flies", the finished counts and both performance indices, with the Next button (as in the Pdf case). Skip jumps to the end of G or of H–J; Replay restarts the training.

## 4 · Descent (`#/mb/step-2`), scroll-driven, 14 s at a steady scroll

Scrubbing always gives the same frame. Compartment labels use the viewer's names and order (Nucleus, Cell body, Axon bundle, Lobes), with glosses here only.

```
K  0.0–2.0   [transition in: shared element, a WT fly from the MCH arm]  the maze wipes away
             (clip-path); the fly lifts to the stage centre and turns to face us as the camera starts
             to push; label "hTDP-43 WT" stays attached
   reads:  0.3–1.8  we follow this fly, the hTDP-43 WT one

L  2.0–4.5   push-in on the head; the body turns semi-transparent; paper ivory → warm grey
   reads:  2.3–4.3  we are going inside its head

M  4.5–7.5   the brain outline draws on (front view, as in the Pdf case) with its region labels; then
             both mushroom bodies grow in membrane blue, from the cell bodies along the axon bundle
             into the lobes; the right one and the brain's labels fade as the camera starts to push in
   reads:  4.8–6.2  the brain, inside the head
           6.2–7.5  these blue structures are the mushroom bodies
   caption: 6.2 "In blue, the mushroom bodies, a centre for learning and memory, on both sides of the brain."

N  7.5–10.5  the brain outline fades; the left mushroom body turns from the front view to the oblique
             view while the camera closes in (decision 6); labels one at a time: "Cell bodies (with
             their nuclei)", "Axon bundle (peduncle)", "Lobes (synapses)"; paper → charcoal; grain,
             washes and boil fade out
   reads:  7.8–8.6  the cell bodies, where the nuclei are
           8.6–9.4  the axon bundle
           9.4–10.5 the lobes, where their synapses are
   caption: 7.8 "About 2,000 Kenyon cells on each side; we follow 30. Their axons run in one bundle to the lobes."

O  10.5–14.0 matched swap: the outline settles at the viewer's opening position and scale; paper →
             black; it moves to the left half and the mutant's mushroom body slides in on the right;
             labels hTDP-43 WT | hTDP-43 mutant; the frame becomes the step 3 viewer
   reads:  10.8–12.4 this is what we will look at under the microscope
           12.4–14.0 two fields: WT left, mutant right
   [transition out: route to #/mb/step-3 with the viewer's opening frame identical to O's last frame]
```

Reduced motion: the labelled oblique mushroom body (end of N) and the "Next: TDP-43 dysfunction" button.

## Checks

- An event in every shot: yes.
- Reads never overlap, and each has time to land: see the times above.
- A transition at every seam: Flip (station → stage), clip wipe and shared fly (assay → descent), matched swap (descent → viewer).
- Text: captions are 1–2 lines of HTML, never painted into the artwork.
- The ending rhymes with the opening: the step 8 summary locator shows the fly from the front, its brain enlarged, the mushroom bodies in blue.

## Build notes

- Reuse from the activity monitor: `walkPause`, `walkAt`, `tube`, `tubeFly` (`site/js/monitor.js`); the clock and `?t=` frozen-time pattern (`site/js/steps/step1.js`); `prng.js`; `handoff.js`; the `#ink-boil` filter and side-view sprites (`site/js/fly.js`).
- New: `site/js/tmaze.js` (the maze drawing, the seeded fly paths and choices, the odour textures as SVG patterns drifting with time, the shock flash) and `site/js/steps/mb-step1.js`. Each fly's arm is fixed by decision 4; its path and timing are seeded, so every frame is a function of time.
- Descent: `site/js/steps/mb-step2.js`. The mushroom body outlines (front view for M and the locator, the turn frames for N, the oblique view for O) are written by `generator/geometry_mb.py` from the same 3D Kenyon cell data as the viewer's geometry, so the final frame matches the viewer.

## As built

- H: the odour hose runs into the tube's inlet. A tag at its free end names what flows (OCT, then air, then MCH) beside a swatch of its colour; the hose fills with that colour, and the odour's own texture (OCT ochre dots, MCH teal dashes) runs along it into the tube. An ink lightning bolt beside the shock grid pops at each of the three pulses with a running count (×1, ×2, ×3), and fades before MCH.
- J: on the performance-index scale a dot marks each lane's value, and "chance" sits under the 0. The mutant lane reads (5 − 5) / 10 = 0.0.
- K: the fly that lifts out of the maze comes from the MCH arm, the arm the WT flies mostly chose.
- M: the 30 simulated Kenyon cells (`site/data/mb/anatomy.json`) grow as 3D paths from their cell bodies, through the calyx and along the axon bundle into the lobes. There is no outline morph.
- N: the left mushroom body turns in true 3D, tilt 0 → 35° and turn 0 → −30°. It is drawn 1.35× larger in the whole brain and eases to life size during the turn. Labels: "Cell bodies (with their nuclei)", "Axon bundle (peduncle)", "Lobes (synapses)".
- The neuropil is drawn as one flat blue layer, so overlapping lobe systems don't stack.
- Captions (as built, 2026-10-16): the step 1 captions roll up, as in broadcast captions. The newest caption wipes in on the lower line (the same 0.6 s clip wipe as before); the caption before it moves up to the upper line, set at 18 px against the current caption's 22 px. As it rolls up it shrinks gradually from 22 px to 18 px during the 0.45 s move (a scale from its top-left corner) and turns to the quiet label ink (`--text-3`); it never snaps. The oldest fades out upwards. A later caption is never shown early, and the upper line is always the caption before the current one in story order, so frozen, skipped and replayed states depend only on story time. The caption runs the stage's width rather than the 70ch story measure, so each caption fits on one line at 1280 × 720 (the activity monitor's first, the longest, is 898 px of 968). The upper line truncates with an ellipsis rather than wrapping, so the controls never move. The two lines were already reserved, so nothing below shifts. The timings above are unchanged.
- Descent (as built, 2026-10-16; instructor): the Next button is the descent's only one, below the story text, and the in-stage button is gone. The matched swap runs from that button while O is still at least partly on screen; otherwise the link navigates. O's bottom bar gives "maximum-intensity projection" the glossary hover. The story text opens on the learning-and-memory role and calls the three Kenyon cell types "classes".
- Assay note (as built, 2026-10-16; instructor): the T-maze's description under the controls is a quiet sans note (`.assay__note`, 16px Instrument Sans, regular, `--text-2`), not the 18px serif story text, so it does not compete with the narration. It opens with the run-in label "T-maze assay" in the eyebrow style (`t-label`). The text is unchanged.
