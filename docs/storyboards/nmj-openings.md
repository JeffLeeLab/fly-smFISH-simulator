# Storyboard: openings, leg motor neuron case (steps 1–2)

Signed off by the instructor on 2026-10-13: decisions 1–8 as proposed. Decisions 3, 4, 6 and 8 started from the instructor's own choices of the same day: the mutants' climbing index under 30% of WT, their legs shaking (subtle but noticeable), a side or slightly turned view for the descent with new VNC and leg drawings, the locator in that view, and the "Simulated" pill at the bottom right of the stage as in the other cases. Same format as the [Pdf](pdf-openings.md) and [mushroom body](mb-openings.md) storyboards: each shot lists what is seen, its event and the camera, then its **reads**, the things the viewer must understand, in order, each with a start and end time. One read at a time; a shot is as long as its reads need. The hero (segment 1) is shared by all cases and is not repeated here.

Students meet the system as "Leg motor neuron & NMJ" (instructor, 2026-10-16) and its last compartment as "Synaptic terminals", never "boutons" (instructor, 2026-10-13).

## Decisions (signed off 2026-10-13)

1. **Assay view.** *Proposal:* two upright vials drawn front-on, as on the bench, hTDP-43 WT left and the mutant right. The flies climb the side walls in profile, head up, so the existing side-view walking drawings carry over (rotated, as in today's still at the landing), and the activity monitor's walk–pause model drives them. *Alternative:* flies on the front wall seen from above, which needs new top-view climbing drawings.
2. **The protocol, compressed.** *Proposal:* three taps on the bench, then 10 s of climbing on a timer, shown in 7 s (time runs 1.4× fast; *Simplified*). A line at 5 cm, labelled (a common choice; some labs use 8 cm). Ten flies per vial, as on the bench, so the drawn count is the real count. *Amended 2026-10-16 (instructor):* the timer runs in real time, 0 → 10 s in 10 s, so the speed-up is gone. The flies' climbs are still scripted in timer seconds, so they now play out about 1.4× slower on screen. Each caption stays up for at least 3 s, because the narration passed too quickly to read.
3. **The climbing phenotype** (invented for this case; instructor, 2026-10-13: the mutants under 30%). *Proposal for the numbers:* at 10 s, 8 of 10 hTDP-43 WT flies are above the line (climbing index 0.8) and 2 of 10 mutants (0.2). That is under 30% both as an index and as a share of WT (a quarter). Climbing index = flies above the line / all flies.
4. **The tremor** (invented for this case; instructor, 2026-10-13: the legs shake, subtle but noticeable). *Proposal for how:* new side-view `tremor` drawings from flybody (`generator/flies.py`). The joints between femur and tibia and between tibia and tarsus are offset by ±4–6° in two or three poses, played on twos (12 per second, so the legs shake about 6 times a second). Each fly gets its own seed and phase, and the body itself stays still.
   - Mutant flies shake whenever they stand, pause or slip; they don't shake mid-stride, where the walk drawings follow the distance walked.
   - The shake is larger than the ink boil, so it reads as moving legs rather than wobbling ink.
   - WT flies and the hero flies never shake.
5. **Which fly we enter.** *Proposal:* the hTDP-43 WT fly highest on the wall, one that passed the line, lifts out of its vial, as the Pdf descent lifts the WT fly from its tube.
6. **The descent view** (instructor, 2026-10-13: side or slightly turned; new VNC and leg drawings in the style of the Pdf and mushroom body cases).
   - *View (proposal):* the fly in side view, turned about 20° towards us so that the underside of the thorax and the near legs show. This is a new projection of the flybody model in `generator/flies.py`, alongside the existing side view, so the turn from the vial's side view is a morph between two projections of the same fly.
   - *New drawings (proposal):* the VNC outline (MANC's neuropil, projected in the same view) and the inside of the leg (a femur muscle as a soft wash).
   - *The neuron (proposal):* its part in the VNC follows the chosen MANC skeleton; its part in the leg is drawn along the flybody leg, since MANC stops where the leg nerve leaves the VNC.
   - *Which leg:* it follows the motor neuron chosen from MANC (any of T1, T2 or T3; instructor, 2026-10-13). If MANC offers a clean one, a front leg (T1) is easiest to read in a side view.
7. **The shortening.** *Proposal:* during the push-in, the middle of the axon gathers behind an ink break symbol (//), and the cell body and synaptic terminals move to their places in the viewer's opening frame. The break symbol belongs to the drawn world and leaves with the paper, so the microscope field stays clean. The axon is simply short there, and the caption has said so. *Alternative:* keep a small break mark on the viewer's axon as an overlay, like the transcript map's intron break marks.
8. **The step 8 locator** (instructor, 2026-10-13, when it was step 7: the view from steps 1–2). The fly in the descent's side view, turned slightly towards us, with its thorax and the chosen leg ringed. Beside it is a framed inset of the VNC and that leg, holding the one motor neuron in blue on one side only, labelled "Leg motor neuron".

## Whole piece

- **Logline.** Two flies carry the same human gene, one with a single change. Tapped to the bottom of a vial, one climbs straight up and the other can't keep up, its legs shaking, so we look inside at the neuron that drives the leg.
- **World, motif, actor.** As in the Pdf case: ivory paper, boiling ink, membrane blue only for the labelled neuron. The pair runs from the hero to the two vials, the split and the viewer: hTDP-43 WT on the left, the mutant on the right. One persistent actor: hero flies → legend → the flies in the vials → the WT fly that passed the line → its thorax → the VNC → its leg motor neuron → the viewer's outline.
- **Budget.** 38.9 s, as for the other cases: hero 9.6 s, climbing vial 15.3 s, descent 14 s. *Amended 2026-10-16:* with the real-time timer the climbing vial is 16.9 s, so the total is 40.5 s, 0.5 s over the 40 s limit. The instructor accepted this on 2026-10-16, choosing to tighten the end of the climb rather than speed the timer up again or cut another segment. Skip and Replay on every segment; captions are 1–2 lines of HTML; no audio. Reduced motion shows each segment's end frame.
- **Flies.** Side view on the vial walls, head up (walking, pausing, slipping, grooming, and the mutants' tremor). The descent uses the side view turned slightly towards us.

## 2 · Three-assay landing (`#/`), ambient

```
F  ambient   the climbing vial station, live (stationLive.nmj): the moment after a climb, five flies
             per vial as in today's still. Most WT flies are high on the wall and the mutants low; they walk
             and pause; now and then a mutant climbs a step and slips back; the mutants' legs shake
             faintly while they stand. No tapping in the loop, so it stays calm. Hover brings it forward
             as for the other stations
   reads:  (self-paced) the leg motor neuron experiment: flies climbing the wall of a vial
   [transition out, on click: the station expands into the stage (Flip); URL #/nmj/step-1]
```

As built (cards, 2026-10-16): the station card follows the spec's *Openings*. The title is the phenotype ("Locomotion"), with the system ("Leg motor neuron & NMJ system", NMJ with its glossary hover) and the assay ("Climbing assay") below the drawing. Since 2026-10-17 the card has no lane labels; the legend above the stations names the lanes.

## 3 · Chosen assay: climbing vial (`#/nmj/step-1`), 16.9 s (3.5 s before the group's action, 13.4 s after; amended 2026-10-16, was 15.3 s and 11.8 s)

Layout per lane (WT left, mutant right): one upright vial with a foam plug at the top, and a ring marked round it at 5 cm (drawn as a thin ellipse, front and back). The two vials stand side by side, joined by a strip of tape, so one tap treats both alike, as on the bench. A counter (mono numbers) under each vial reads the flies above the line, and a timer (mono) sits between the vials. "Simulated data" pill at the bottom right of the stage.

Reference footage, for the mechanics only (as `references/dam-motion/` is for the activity monitor): ["The Climbing Assay – In the Fly Lab"](https://www.youtube.com/watch?v=nI-ed8NKUg0) (Alicia Hidalgo Lab, University of Birmingham; 39–47 s), not stored in the repo. What it shows, and what is taken from it:
- Two empty vials taped side by side are lifted a few centimetres and dropped onto the bench together, twice in about a second. Taken (three taps), with the tape.
- The flies land in a heap at the bottom and right themselves within about half a second. Taken.
- Healthy flies climb straight up in quick bursts with short pauses and a little sideways wander. They pass the 2 cm mark within 2–3 s and spread up the vial. Taken, for the WT lane.
- Slower flies (old flies in the clip) linger at the bottom, start late, stall part-way, and some fall back to the bottom. Taken, for the mutant lane, with the tremor added (decision 4).
- Not taken: the clip has 30–50 flies per vial (we draw ten) and a 2 cm mark (we keep 5 cm). Its flies are seen face-on across the vial; ours climb the side walls in profile, so they match the side-view flies of the activity monitor and the T-maze (decision 1).

```
G 0.0–3.5    [transition in: the station expands (Flip), 0.8 s]  ten flies per vial on the walls, where
             the ambient loop left them (most WT flies high, the mutants low); they walk and pause, and the
             mutants' legs shake faintly at rest
   reads:  0.8–2.2  two vials, ten flies each, a line on each (labels: "vial", "5 cm line", "foam plug")
           2.2–3.5  flies climb up the wall by instinct
   caption: "Tapped to the bottom, flies climb straight up the wall. We count how many pass the line in
             10 seconds."
   then waits (flies keep walking and pausing) for the button "Tap the flies down" (since 2026-10-19 the button fades in at 0.8 s, once the stage has arrived, while the parts are still being named; an early click finishes G at once; instructor)

H 0.0–1.4    (after the click) the taped pair of vials lifts a little and drops onto the bench, three times
             (0.2 s each, a short ink impact mark under each vial at each tap); the flies fall to the bottom
             in a heap and right themselves within about 0.5 s; the timer resets to 0.0 s and the counters to 0
   reads:  0.2–1.4  every fly starts at the bottom
   captions: 0.0–3.0 "Three taps on the bench, and every fly ends up at the bottom."

I 1.4–11.4   the timer runs from 0 to 10 s in real time (decision 2, as amended). The WT flies climb straight up in
             quick bursts with short pauses and a little sideways wander; most pass the line within the first 3 s
             of the timer (by 4.4 s here) and spread up the vial, and 8 of them are above it at 10 s (the eighth
             at 7 s of the timer, 8.4 s here). At each crossing the line thickens for a beat and the counter ticks
             up (cause → effect). The mutants start late and climb slowly with long pauses; some stall part-way,
             two slip back down a step and one falls to the bottom; at every pause their legs shake (decision 4);
             2 of them pass the line (at about 6.5 and 8.1 s of the timer, 7.9 and 9.5 s here)
   reads:  1.8–4.4  the WT flies climb fast and pass the line
           4.4–7.0  the mutants are slow and slip back
           7.0–11.4 their legs shake
   captions: 3.0–7.0  "Most hTDP-43 WT flies pass the line within 10 seconds."
             7.0–11.4 "The mutants climb slowly and slip back, and their legs shake."

J 11.4–13.4  the timer stops at 10.0 s and the counters hold (8 and 2). From 11.4 s the climbing index builds:
             "Climbing index = flies above the line / all flies", then 8 / 10 = 0.8 for WT and 2 / 10 = 0.2 for the
             mutant, and a short ink bar on a 0–1 scale with a dot at each lane's value. From 12.6 s the flies rest
             and groom (the mutants' legs still shake faintly); the "Next: look inside the fly" button appears at 12.8 s
   reads:  11.4–12.8 one number for climbing: the share of flies that passed the line
           12.8–13.4 where to go next (the hold continues, untimed, until the group moves on)
   caption: 11.4 "Climbing index: the share of flies above the line at 10 seconds."
```

Amended 2026-10-16 (decision 2; instructor): H–J are longer because the timer is now real time. Previous H-time marks: the timer stopped at 8.4 s, the index appeared at 8.7 s, the rest began at 10.6 s, the Next button at 10.8 s and the end was 11.8 s; the captions began at 1.4, 4.4 and 8.4 s. The taps and the righting are unchanged, and the climb still starts at 1.4 s. H–J now runs 0–13.4 s (was 0–11.8 s; the instructor's later tightening of the end of the climb, 2026-10-16, is in the Budget line and the step 1 timings in the spec). Every caption is up for at least 3 s.

Reduced motion: the end frame of G. On "Tap the flies down", the finished counts and both climbing indices with the Next button, as in the other cases. Skip jumps to the end of H–J (no Skip during G since 2026-10-19: Start, shown from 0.8 s, takes the group past it); Replay taps the vials again.

As built (captions, 2026-10-16): the captions roll up, as in broadcast captions. The newest caption wipes in on the lower line (the same 0.6 s clip wipe as before); the caption before it moves up to the upper line, set at 18 px against the current caption's 22 px. As it rolls up it shrinks gradually from 22 px to 18 px during the 0.45 s move (a scale from its top-left corner) and turns to the quiet label ink (`--text-3`); it never snaps. The oldest fades out upwards. A later caption is never shown early, and the upper line is always the caption before the current one in story order, so frozen, skipped and replayed states depend only on story time. The caption runs the stage's width, so each fits on one line at 1280 × 720 (the longest caption in the three assays, the activity monitor's first, is 898 px of 968); the upper line truncates rather than wraps, so the controls never move. Step 2's captions keep a single line.

As built (assay note, 2026-10-16; instructor): the climbing vial's description under the controls is a quiet sans note (`.assay__note`, 16px Instrument Sans, regular, `--text-2`), not the 18px serif story text, so it does not compete with the narration. It opens with the run-in label "Climbing assay" in the eyebrow style (`t-label`).

## 4 · Descent (`#/nmj/step-2`), scroll-driven, 14 s at a steady scroll

Scrubbing always gives the same frame. Compartment labels use the viewer's names and order (Nucleus, Cell body, Axon, Synaptic terminals), with glosses here only.

```
K  0.0–2.0   [transition in: shared element, the WT fly highest on the wall]  the vials wipe away
             (clip-path); the fly lifts off the wall to the stage centre and rights itself from head-up into
             the side view, turning slightly towards us (decision 6) as the camera starts to push; label
             "hTDP-43 WT" stays attached
   reads:  0.3–1.8  we follow this fly, the hTDP-43 WT one, a good climber

L  2.0–4.5   push-in on the thorax and the near leg; the body turns semi-transparent; paper ivory → warm grey
   reads:  2.3–4.3  we are going inside the thorax, where the legs attach

M  4.5–8.0   the VNC outline draws on in ink inside the thorax, with its three leg segments marked lightly
             (label "Ventral nerve cord (VNC)"); one motor neuron's cell body appears in membrane blue in
             the VNC, and its axon draws out (DrawSVG) through the leg nerve, down the leg into the femur,
             where it branches into synaptic terminals on a muscle (a soft wash)
   reads:  4.8–6.0  the ventral nerve cord, the fly's equivalent of our spinal cord
           6.0–8.0  one motor neuron: its cell body in the VNC, its axon running into the leg to a muscle
   captions: 4.8 "Inside the thorax lies the ventral nerve cord, the fly's equivalent of our spinal cord."
             6.0 "In blue, one leg motor neuron. Its axon runs down the leg and ends on a muscle. This connection is called the neuromuscular junction (NMJ)."

N  8.0–10.5  the fly outline and the VNC fade; the camera closes in on the neuron; the middle of the axon
             gathers behind an ink break symbol (decision 7) as the cell body and synaptic terminals move
             to the viewer's layout; labels one at a time: "Cell body (with its nucleus)", "Axon",
             "Synaptic terminals (on a leg muscle)"; paper → charcoal; grain, washes and boil fade out
   reads:  8.3–9.0  the cell body, with its nucleus
           9.0–9.7  the axon, drawn much shorter than it is
           9.7–10.5 the synaptic terminals, where it meets the muscle
   caption: 8.3 "The real axon is far longer. We draw it short so the whole neuron fits one view."

O  10.5–14.0 matched swap: the outline settles at the viewer's opening position and scale; paper → black;
             it moves to the left half and the mutant's motor neuron slides in on the right; labels
             hTDP-43 WT | hTDP-43 mutant; the frame becomes the step 3 viewer
   reads:  10.8–12.4 this is what we will look at under the microscope
           12.4–14.0 two fields: WT left, mutant right
   [transition out: route to #/nmj/step-3 with the viewer's opening frame identical to O's last frame]
```

Reduced motion: the labelled motor neuron (end of N) and the "Next: TDP-43 dysfunction" button.

## Checks

- An event in every shot: yes.
- Reads never overlap, and each has time to land: see the times above.
- A transition at every seam: Flip (station → stage), clip wipe and shared fly (assay → descent), matched swap (descent → viewer).
- Text: captions are 1–2 lines of HTML, never painted into the artwork.
- The ending rhymes with the opening: the step 8 summary locator shows the fly in the same side view, its thorax and leg ringed, the motor neuron in blue (decision 8).
- The tremor survives review: subtle motion can vanish in video compression, so check it on contact sheets and screenshots (`tools/contact-sheet.sh`), not only in recordings.

## Build notes

- Reuse from the activity monitor: `walkPause` and `walkAt` (`site/js/monitor.js`); the clock and `?t=` frozen-time pattern (`site/js/steps/step1.js`); `prng.js`; `handoff.js`; the `#ink-boil` filter and side-view sprites (`site/js/fly.js`); today's still vial (`vialArt` and `CLIMB` in `site/js/stations.js`).
- New fly drawings (`generator/flies.py`): the side-view `tremor` sequence (decision 4), and the side view turned about 20° for the descent and the locator (decision 6).
- New scripts: `site/js/vial.js` (the vials, the taps, the seeded climbs, slips and crossings, the tremor schedule), `site/js/steps/nmj-step1.js` and `stationLive.nmj`. Which flies pass the line is fixed by decision 3, while their paths, bout timings and slips are seeded. Crossing times are computed up front, so frozen frames and counter ticks stay functions of time.
- Descent: `site/js/steps/nmj-step2.js`. The VNC outline and the motor neuron's path are written by `generator/geometry_nmj.py` from the MANC neuropil and the chosen skeleton, with the leg part laid along the flybody leg. They come from the same data as the viewer's geometry, so the final frame matches the viewer.
- Motion source: as in the Pdf case, a seeded walk–pause model stands in until real climbing footage can be traced (spec, *Motion principles*). A short vial video from the instructor would let the climbs, pauses and slips be traced instead.

## As built (2026-10-14)

Built after the signed-off storyboard above, with these differences and details. The connectome changed from MANC to MaleCNS v0.9, which holds the whole male CNS, VNC included (spec, *Leg motor neuron*).

**Assay** (`site/js/vial.js`, `site/js/steps/nmj-step1.js`, `stationLive.nmj`):
- **Layout:**
  - The pair stands in the middle of the stage, half a vial width apart, with the flies drawn about 2.4× life size. The tape was removed on 2026-10-15 (instructor): its two strips read as extra lines either side of the 5 cm line and covered flies. The pair still lifts and drops as one, so both lanes get the same taps.
  - The line's label reads "finish line (5 cm)", not "5 cm line" (instructor, 2026-10-15).
  - The finish line is drawn heavier (front half 2.2, pulsing to 4.4 at each crossing), and a faint inner line on each wall gives the glass its thickness (instructor, 2026-10-15).
  - The counters sit beside the vials at the line.
  - Each lane's climbing index (its sum over an ink bar on a 0–1 scale) sits on its own side; the formula appears once, under the bench.
  - The timer sits above the vials, between the plugs.
  - The vial scene is as tall as the T-maze's, so the Next button stays on screen at 1280×720.
- **Climbs (decision 3):**
  - Each fly's climb is a script in millimetres and timer seconds, walked in bursts on the activity monitor's gait.
  - WT: five flies pass the line within 3 s of the timer, seven within 4 s, and the eighth at 7.0 s. Two stop below the line: a late starter, and one that stops at 4 cm.
  - Mutants: the two that pass do so at about 6.5 s and 8.1 s. Two slip back a step, one falls to the floor, one never gets past the foot of the wall, and one stays on the floor.
  - The counts (8 and 2) are checked against the schedules when the page loads.
- **Between climbs** (shot G, the landing and the rest after J):
  - The flies stand mostly head up and now and then climb a step.
  - A WT fly sometimes turns and walks back down a little, and grooms.
  - A mutant shakes as it stands and slips back after its steps.
- **Tremor (decision 4):**
  - Three side-view drawings, in which each foot moves round a small loop of its own (out from the wall and back, about 0.26 mm, and along it about 0.18 mm), with the knee flexing.
  - They are played on twos, in a seeded order that never repeats a drawing, in runs broken by short still beats.
  - Fixed joint offsets of 4–6° were not used: at the vial's scale they move a foot by under a pixel, below the ink boil.
  - The mutants also shake while they lie on the floor after the fall and as they slip.
- **Captions:** as above.

**Descent** (`site/js/steps/nmj-step2.js`; data in `site/data/nmj/anatomy.json`, written by `generator.geometry_nmj` from the cell that `generator.connectome_nmj` caches):
- **K:** the vial's wall wipes away (the foam plug is left out, because it drew a grey band behind the step's title). The fly lifts off head up, rotates into the side view (0.3–1.6 s) and morphs into the turned view (1.0–1.8 s).
- **L:** the thorax, the head and the near front leg stay drawn; the rest fades.
- **M:**
  - The VNC outline is drawn round about 4,000 MaleCNS VNC cell bodies seen from the side, with T1–T3 marked and the T2 and T3 leg nerves dashed.
  - The central brain is drawn in the head (instructor, 2026-10-14), outlined round the same specimen's central-brain cell bodies, rounded because they form a shell round the neuropil. It is joined to the VNC by the neck's connective, so the central nervous system is one outline.
  - Labels: "Central nervous system" at 4.9 s, with one arrow to the brain and one to the VNC; "Ventral nerve cord (VNC)" at 5.5 s; and "Leg muscle" at 7.1 s, under the femur (instructor, 2026-10-14). Since 2026-10-19 (instructor), "Neuromuscular junction (NMJ)" appears at 7.7 s, once the synaptic terminals have grown on the muscle. It sits above the femur, clear of the axon, with its arrow on the terminal swelling nearest the middle of the arbor. It leaves at 8.25 s as the muscle fades, and the 6.0 s caption now ends "This connection is called the neuromuscular junction (NMJ)." The muscle is drawn as a warm wash with fibres slanting in to a tendon, as in the viewer's images.
  - The 4.8 s caption now names both parts: "The central nervous system: the brain in the head, and the ventral nerve cord in the thorax, the fly’s equivalent of our spinal cord."
  - The cell is MaleCNS body 807165, a tibia flexor of the front leg, whose muscle lies in the femur. The femur reductors' skeletons are cleaner, but their muscle lies in the trochanter. It is a left cell, drawn on the near (right) side.
  - Its dendrites and its axon, out to where the femur reductors' nerve stumps show the nerve leaving, are drawn from the connectome. The axon then follows the flybody front leg down the coxa and through the trochanter, and runs up the femur to its first branch 42% of the way along.
  - The synaptic terminals are the viewer's own branches and swellings, enlarged 4× and turned to the fly's femur, on a muscle wash.
- **N:**
  - The fly's front leg shrinks into the viewer's coxa, trochanter and femur while the axon shortens, vertex for vertex, into the viewer's axon. The terminals settle to the viewer's size and place.
  - The break mark sits on the nerve between the VNC and the coxa, and leaves with the paper.
  - Labels come in at 8.3, 9.0 and 9.7 s.
  - The viewer's VNC edge and cuticle come in as faint blue outlines before the matched swap.
- **Captions:** two were added to the storyboard's: 0.3 "We follow one of the hTDP-43 WT flies, a good climber." and 2.3 "Into its thorax, where the legs attach."
- **Hand-off:** the fly that lifts off is the WT fly highest on the wall in step 1, handed off (`handOff("fly")`).
- **No `vnc.js`:** the VNC is data, not a hand-drawn schematic.

**Locator** (`CASE_LOCATOR.nmj` in `site/js/summary.js`):
- The turned side-view fly, with its thorax and near front leg ringed.
- An inset of the VNC and that leg holding the motor neuron in blue: dendrites, axon down the leg, and synaptic terminals.
- Labelled "Leg motor neuron".

**Descent (as built, 2026-10-16; instructor):**
- The Next button ("Next: TDP-43 dysfunction") is the descent's only one, below the story text; the in-stage button that faded in under N at 13.5 s is gone. The matched swap runs from that button while the end frame is still at least partly on screen; otherwise the link navigates.
- The end frame's bottom bar gives "maximum-intensity projection" the glossary hover.
- The story text drops the MaleCNS tracing clause, says "through the joint", adds "This contact is the neuromuscular junction (NMJ).", and ends "For simplicity, the images leave out the dendrites." (Reworded 2026-10-27 so people, not the images, act: "here we show it far shorter so you can see the whole cell in one view", "glow faintly from autofluorescence", "For simplicity, we have left out the dendrites.")
