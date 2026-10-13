# Storyboard: openings, leg motor neuron case (steps 1–2)

Signed off by the instructor on 2026-10-13: decisions 1–8 as proposed. Decisions 3, 4, 6 and 8 started from the instructor's own choices of the same day: the mutants' climbing index under 30% of WT, their legs shaking (subtle but noticeable), a side or slightly turned view for the descent with new VNC and leg drawings, the locator in that view, and the "Simulated" pill at the bottom right of the stage as in the other cases. Same format as the [Pdf](pdf-openings.md) and [mushroom body](mb-openings.md) storyboards: each shot lists what is seen, its event and the camera, then its **reads**, the things the viewer must understand, in order, each with a start and end time. One read at a time; a shot is as long as its reads need. The hero (segment 1) is shared by all cases and is not repeated here.

Students meet the system as "Leg motor neuron" and its last compartment as "Synaptic terminals", never "boutons" (instructor, 2026-10-13).

## Decisions (signed off 2026-10-13)

1. **Assay view.** *Proposal:* two upright vials drawn front-on, as on the bench, hTDP-43 WT left and the mutant right. The flies climb the side walls in profile, head up, so the existing side-view walking drawings carry over (rotated, as in today's still at the landing), and the activity monitor's walk–pause model drives them. *Alternative:* flies on the front wall seen from above, which needs new top-view climbing drawings.
2. **The protocol, compressed.** *Proposal:* three taps on the bench, then 10 s of climbing on a timer, shown in 7 s (time runs 1.4× fast; *Simplified*). A line at 5 cm, labelled (a common choice; some labs use 8 cm). Ten flies per vial, as on the bench, so the drawn count is the real count.
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
8. **The step 7 locator** (instructor, 2026-10-13: the view from steps 1–2). The fly in the descent's side view, turned slightly towards us, with its thorax and the chosen leg ringed. Beside it is a framed inset of the VNC and that leg, holding the one motor neuron in blue on one side only, labelled "Leg motor neuron".

## Whole piece

- **Logline.** Two flies carry the same human gene, one with a single change. Tapped to the bottom of a vial, one climbs straight up and the other can't keep up, its legs shaking, so we look inside at the neuron that drives the leg.
- **World, motif, actor.** As in the Pdf case: ivory paper, boiling ink, membrane blue only for the labelled neuron. The pair runs from the hero to the two vials, the split and the viewer: hTDP-43 WT on the left, the mutant on the right. One persistent actor: hero flies → legend → the flies in the vials → the WT fly that passed the line → its thorax → the VNC → its leg motor neuron → the viewer's outline.
- **Budget.** 38.9 s, as for the other cases: hero 9.6 s, climbing vial 15.3 s, descent 14 s. Skip and Replay on every segment; captions are 1–2 lines of HTML; no audio. Reduced motion shows each segment's end frame.
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

## 3 · Chosen assay: climbing vial (`#/nmj/step-1`), 15.3 s (3.5 s before the group's action, 11.8 s after)

Layout per lane (WT left, mutant right): one upright vial with a foam plug at the top, and a ring marked round it at 5 cm (drawn as a thin ellipse, front and back). The two vials stand side by side, joined by a strip of tape, so one tap treats both alike, as on the bench. A counter (mono numbers) under each vial reads the flies above the line, and a timer (mono) sits between the vials. "Simulated" pill at the bottom right of the stage.

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
   then waits (flies keep walking and pausing) for the button "Tap the flies down"

H 0.0–1.4    (after the click) the taped pair of vials lifts a little and drops onto the bench, three times
             (0.2 s each, a short ink impact mark under each vial at each tap); the flies fall to the bottom
             in a heap and right themselves within about 0.5 s; the timer resets to 0.0 s and the counters to 0
   reads:  0.2–1.4  every fly starts at the bottom
   caption: 0.0 "Three taps on the bench, and every fly ends up at the bottom."

I 1.4–8.4    the timer runs from 0 to 10 s (decision 2). The WT flies climb straight up in quick bursts with
             short pauses and a little sideways wander; most pass the line within the first 3 s of the timer
             and spread up the vial, and 8 of them are above it at 10 s. At each crossing the line thickens
             for a beat and the counter ticks up (cause → effect). The mutants start late and climb slowly
             with long pauses; some stall part-way, two slip back down a step and one falls to the bottom;
             at every pause their legs shake (decision 4); 2 of them pass the line
   reads:  1.7–4.4  the WT flies climb fast and pass the line
           4.4–6.4  the mutants are slow and slip back
           6.4–8.4  their legs shake
   captions: 1.4 "Most hTDP-43 WT flies pass the line within 10 seconds."
             4.4 "The mutants climb slowly and slip back, and their legs shake."

J 8.4–11.8   the timer stops at 10.0 s and the counters hold (8 and 2). Under each vial the climbing index
             builds: "Climbing index = flies above the line / all flies", then 8 / 10 = 0.8 for WT and
             2 / 10 = 0.2 for the mutant, and a short ink bar on a 0–1 scale with a dot at each lane's value.
             From 10.6 s the flies rest and groom (the mutants' legs still shake faintly); the "Next: look
             inside the fly" button
   reads:  8.7–10.6 one number for climbing: the share of flies that passed the line
           10.8–11.8 where to go next (the hold continues, untimed, until the group moves on)
   caption: 8.4 "Climbing index: the share of flies above the line at 10 seconds."
```

Reduced motion: the end frame of G. On "Tap the flies down", the finished counts and both climbing indices with the Next button, as in the other cases. Skip jumps to the end of G or of H–J; Replay taps the vials again.

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
             6.0 "In blue, one leg motor neuron. Its axon runs down the leg and ends on a muscle."

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

Reduced motion: the labelled motor neuron (end of N) and the "Next: the first clue" button.

## Checks

- An event in every shot: yes.
- Reads never overlap, and each has time to land: see the times above.
- A transition at every seam: Flip (station → stage), clip wipe and shared fly (assay → descent), matched swap (descent → viewer).
- Text: captions are 1–2 lines of HTML, never painted into the artwork.
- The ending rhymes with the opening: the step 7 summary locator shows the fly in the same side view, its thorax and leg ringed, the motor neuron in blue (decision 8).
- The tremor survives review: subtle motion can vanish in video compression, so check it on contact sheets and screenshots (`tools/contact-sheet.sh`), not only in recordings.

## Build notes

- Reuse from the activity monitor: `walkPause` and `walkAt` (`site/js/monitor.js`); the clock and `?t=` frozen-time pattern (`site/js/steps/step1.js`); `prng.js`; `handoff.js`; the `#ink-boil` filter and side-view sprites (`site/js/fly.js`); today's still vial (`vialArt` and `CLIMB` in `site/js/stations.js`).
- New fly drawings (`generator/flies.py`): the side-view `tremor` sequence (decision 4), and the side view turned about 20° for the descent and the locator (decision 6).
- New scripts: `site/js/vial.js` (the vials, the taps, the seeded climbs, slips and crossings, the tremor schedule), `site/js/steps/nmj-step1.js` and `stationLive.nmj`. Which flies pass the line is fixed by decision 3, while their paths, bout timings and slips are seeded. Crossing times are computed up front, so frozen frames and counter ticks stay functions of time.
- Descent: `site/js/steps/nmj-step2.js`. The VNC outline and the motor neuron's path are written by `generator/geometry_nmj.py` from the MANC neuropil and the chosen skeleton, with the leg part laid along the flybody leg. They come from the same data as the viewer's geometry, so the final frame matches the viewer.
- Motion source: as in the Pdf case, a seeded walk–pause model stands in until real climbing footage can be traced (spec, *Motion principles*). A short vial video from the instructor would let the climbs, pauses and slips be traced instead.
