# Storyboard: openings, PDF neuron case (steps 1–2)

Reviewed and approved by the instructor (decisions 1–6 as proposed; total under 40 s; descent fly more transparent). Written for review before any animation code (spec, *Openings* and *Motion principles*). Format after ClaudeAnimationBase's storyboard (process reference only): each shot lists what is seen, its event and the camera, then its **reads**, the things the viewer must understand, in order, each with a start and end time. One read at a time; a shot is as long as its reads need.

Fly drawings: [flies.png](flies.png), from the flybody model (`generator/flies.py`).

## Decisions (approved as proposed)

1. **Descent view.** The s-LNvs and the viewer are drawn as a frontal view of the brain, so the descent needs the fly seen from the front. A frontal fly risks reading as a face (two big eyes, antennae between them), which the art direction rules out. Proposal: the frontal fly appears only during the push-in, already semi-transparent, with the antennae drawn lighter and smaller, and the brain outline drawing on inside the head within a second. *Alternative:* start the descent from the dorsal (top) view and morph only the head into the frontal brain view.
2. **Turning the fly.** The chosen fly lives in a tube, in side view. Proposal: it turns to face us with a quick part-by-part shape morph (MorphSVG, 0.8 s) while the camera pushes in, so the turn is carried by the push. *Alternative:* a cut-free swap in which the fly walks out of the tube towards us and the frontal drawing takes over mid-stride.
3. **Which fly we enter.** Proposal: the hTDP-43 WT fly (left lane). At the end, the neuron outline moves to the left half and the mutant's neurons slide in on the right, so the frame becomes the split viewer (control left, mutant right).
4. **The sleep phenotype** (invented for this case; needs your sign-off). Proposal: by day both flies look alike; at night the WT fly sleeps in long bouts, while the mutant keeps waking (short sleep bouts, more night-time beam crossings). A weaker rise in activity before lights-on is shown in the bars but not narrated.
5. **Fly motion source.** The spec asks for keyframes traced from real assay videos. Without footage, proposal: a seeded walk–pause model (bout lengths and speeds drawn from fixed distributions, with slips and turns), legs animated as drawn frames played on twos (12 per second, in step with the ink boil). If you can share a short tube or open-field video, I will trace it instead.
6. **Hero title.** Proposal: "Two flies, one human gene" (from the chosen style page), with the caption "They look the same." completing as "Their behaviour isn't." on scroll.

## Whole piece

- **Logline.** Two flies that look the same carry the same human gene, one with a single change; their nights differ, so we look inside their brains.
- **World.** Ivory paper, hand-inked outlines that boil 12 times a second, flat washes in ivory, warm grey and clay-tinted fills, light paper grain. Membrane blue is the only saturated colour, and only for the labelled neurons. Lights-off in the activity monitor is shown with warm grey, not a hue. During the descent the paper deepens from ivory to charcoal to black and the texture fades out, ending in the clean microscope field.
- **Motif.** The pair: hTDP-43 WT on the left, ALS mutant on the right, from the hero to the assay lanes, the descent's final split and the viewer. The ending (summary PNG) shows the same pair.
- **One persistent actor.** Hero flies → legend → the flies in the tubes → the WT fly → its head → its PDF neurons → the viewer's outline.
- **Budget.** Directed animation 38.9 s (hero 9.6 s, chosen assay 15.3 s, descent 14 s), under the 40 s limit set at review; the hero-to-legend flight is not counted, on scroll or when it runs by itself in a window too tall to scroll. Every segment can be skipped and replayed; captions are 1–2 lines of HTML text; no audio. Reduced motion shows each segment's end frame.
- **Flies.** Dorsal view in the hero (a calm pair), side view in the tubes, frontal view for the descent. Neither hero fly ever shakes or differs in pose; the mutant only stands turned by 8° and slightly lower, so the pair reads as two animals rather than one drawing copied. Idle motion is grooming, small antenna twitches and the boil, never in sync between the two.

## 1 · Hero (`#/`), 9.6 s, plays once on load, then idles

Layout: rail on the left; the title, a one-line subtitle and the caption on the left (left-aligned, never centred); the two flies on the right, standing, heads up. Frame 0 is a finished image.

Revised at review: the knock-in is literal and carries most of the sequence. A human *TDP-43* cassette flies in and knocks the fly's *TBPH* cassette out of the chromosome, instead of the exon blocks morphing in place. Second review: the knock-ins stay on screen after the sequence (no retraction), the chromosome lines are labelled "genomic DNA", and grooming bouts ease in and out instead of snapping back to standing.

```
A  0.0–0.8   [frame 0 is finished]  title, subtitle, two identical flies standing · flies idle · camera still
   reads:  0.0–0.8  two flies, side by side, the same

B  0.8–1.6   a thin leader line draws from each fly's thorax to its locus below it (DrawSVG): a stretch
             of chromosome with the fly gene sitting in it as a cassette (a framed row of exon blocks);
             one small label between the two loci names both lines "genomic DNA"
   reads:  0.8–1.6  each fly is being linked to something about its genes (eye follows the drawing line)

C  1.6–6.6   the knock-in
   reads:  1.6–2.6  label "fly TBPH" under both cassettes: each fly's own gene
           2.6–3.4  one human TDP-43 cassette (clay-tinted exons, its label riding under it) rises
                    into view between the two loci
           3.4–4.4  it parts into two copies, one gliding to each fly, and each stops below and
                    inside its locus (the labels step aside while the copies separate)
           4.4–5.6  a short wind-up, then each copy strikes up into its locus: the fly cassette is
                    knocked out (up and away on the outer side, tumbling, falling, fading), small
                    ink strokes fly off the point of contact, the chromosome flexes and settles, and
                    the human cassette lands in the slot with a small squash. "fly TBPH" clears
                    just before the strike, so the old label leaves before the new one is in place
           5.6–6.6  both loci now read "human TDP-43" (hold)

D  6.6–8.2   one point change is marked on the right cassette only: a heavier ink tick and the label
             "ALS-linked point mutation" (no data colour); genotype labels settle under the flies
   reads:  6.6–7.4  one mark, on the right fly's gene only
           7.4–8.2  the flies are named: hTDP-43 WT (left), hTDP-43 ALS mutant (right)

E  8.2–9.6   caption fades up with a short clip wipe: "They look the same." The flies, their leader
             lines and the knocked-in loci all stay, so the end frame shows what each fly carries
   reads:  8.4–9.6   "They look the same."

   idle (not counted): the flies groom in turn, never together; first bouts at 10.0 s and 12.5 s.
   Each bout: the front legs rise (0.5 s), rub together in front of the head for one or two cycles
   (never through it), then settle back to standing (0.9 s, slowing as the feet come down)
   [transition out, on scroll: the two flies fly and shrink into a WT | mutant legend at the top of
    the assay scene (Flip); the caption completes: "Their behaviour isn't."]
```

As built (transition out): the caption completes as soon as the page scrolls. The legend ("hTDP-43 WT, left lane" | "hTDP-43 ALS mutant, right lane") sits under the landing's intro line. From the first scroll until the legend is 45% of the way up the screen (or the end of the page, if that comes first), stand-ins for the two flies travel from the hero to the legend, shrinking, the mutant's turn straightening, dropping down first and sliding across last so they clear the hero text. The hero's leader lines fade as the flies leave; the knock-ins stay. Scrolling back reverses it.

As built (flight): the stand-ins fly.
- Their wings are half open as they take off and land (the first and last 5% of the transition) and beat in between. The beat alternates two drawings, wings swept forward and wings swept back, changing on twos (12 per second) in real time, with the two flies out of step. If the scroll pauses mid-way, a fly hovers there with its wings still beating. It is a stylised wingbeat: a real fly beats about 200 times a second.
- The dorsal fly sprite has a "flap" sequence of three drawings (half open, forward, back), posed from flybody's wing joints; the legs keep the standing pose. The wings are drawn as membrane only, without veins, as on a beating wing. The drawings extend past the sprite's viewBox, which is still set by the fly on the ground, so the sprite's size doesn't change.
- A window too tall to scroll never runs the scroll-driven transition. There the flies set off on their own 0.8 s after the hero sequence ends and fly for 2.2 s (power2.inOut), and the caption completes as usual. Replay flies them back up in 1.2 s before the hero sequence replays. This flight stands in for the scroll transition, which is paced by the user and not counted in the budget, so it isn't counted either; it blocks nothing, and the stations stay usable.

Reduced motion: the end frame of E (flies labelled, caption shown).

## 2 · Three-assay landing (`#/`, below the hero), ambient until a group chooses

```
F  ambient   three stations in a row, each split WT lane (left) | mutant lane (right):
             climbing vial (still, Phase 1), activity monitor (live), T-maze (still, Phase 1)
             activity monitor: a short horizontal tube per lane, a fly walking and pausing in each,
             the infrared beam across the middle as a dashed ink line, a tiny actogram strip below
             in which the mutant's night bars stand out · hover brings a station forward (hairline
             darkens, slight lift by scale, no shadow)
   reads:  (self-paced) three experiments, one per neuron system; the PDF neuron one is moving
   [transition out, on click: the activity monitor expands into the stage (Flip); URL #/pdf/step-1]
```

As built: the climbing vial (WT flies mostly past the line, mutants mostly low) and the T-maze (WT flies gathered in one arm, mutants split evenly) are still drawings, dimmed, marked "Not available in this build". The activity monitor's tiny actogram shows three days, with the night halves shaded. The station grows into the stage across the route change (its screen position is handed to step 1, which scales the stage up from there). The mini monitor's flies walk as in step 1 (see the walking note in section 3).

## 3 · Chosen assay: activity monitor (`#/pdf/step-1`), 15.3 s (3.5 s before the group's action, 11.8 s after)

```
G  0.0–3.5   [transition in: the station expands (Flip), 0.8 s]  two large tubes, WT left, mutant right:
             food at the left end, cotton plug at the right, the beam across the middle with small
             emitter and detector marks, a crossing counter (mono numbers) under each tube
             · each fly walks; as it passes the beam, the beam line thickens for a beat and its
             counter ticks up (cause → effect)
   reads:  0.8–2.2  one fly per tube, food at one end (labels "food", "cotton plug", "infrared beam")
           2.2–3.5  walking through the beam adds one to the counter
   caption: "Each fly lives in its own tube. Every time it walks through the infrared beam, the
             monitor counts one crossing."
   then waits (flies keep walking and pausing) for the button "Start the light–dark days"

H  0.0–8.4   (after the click) three days pass, 2.8 s each: a light–dark bar above the tubes runs with
             ZT ticks; during lights-off the scene's paper takes a warm grey wash; flies move faster
             (time-lapse) while active and rest while asleep; below each tube its actogram builds one
             row per day, the bars growing as that fly moves (crossings per half hour)
   reads:  0.0–2.8  day 1: the bars are the fly's activity, built as it moves
           2.8–5.6  day 2, night: the WT fly sleeps; the mutant keeps waking (its night bars)
           5.6–8.4  day 3 confirms the pattern (no new read; eye rests on the two actograms)
   captions: 0.0 "Activity builds up as an actogram: each bar is the crossings in half an hour."
             2.8 "At night, the hTDP-43 WT fly sleeps. The mutant keeps waking."

I  8.4–10.6  the clock runs on into day 4 and stops at ZT2 (0.23 s), where a thin ink marker drops
             onto the short day-4 row of both actograms, with the label "ZT2 · brains collected here"
   reads:  8.7–10.6  the time the brains were taken: two hours after lights on
   caption: "Brains for the microscope were collected at ZT2, two hours after lights on."

J  10.6–11.8 hold: flies rest and groom; badges appear ("Established: how the monitor works",
             "Invented for this case: the sleep phenotype"); the "Next: look inside the brain" button
   reads:  10.8–11.8 where to go next (the hold continues, untimed, until the group moves on)
```

As built: the marker sits on a fourth, partial row rather than on day 3, because a day-3 marker followed by the rest of day 3's bars would say the flies kept walking after their brains were taken. The Next button and the badges share the row under the caption, so they appear without scrolling on a 1280 × 720 screen. The counter keeps the real crossings from shot G and then adds the activity model's counts as the days run. A Skip button jumps to the end of G or of H–J, and Replay restarts the days.

As built (walking, in the landing's mini monitor and in step 1's real-time walking; the time-lapse days are unchanged): a walk is not a glide.
- Each walk is 1–3 bouts (one for a short walk), each at its own pace, 0.75–1.25× the walk's speed. Between bouts the fly either hesitates for 0.12–0.42 s with its legs still, or only slows to 45% of its speed.
- It sets off within about 0.14 s and stops within about 0.18 s. The body surges once per tripod step (half a stride), at ±40% of its speed.
- The opening walks in step 1 stay one steady bout, so the first beam crossing still lands during shot G (the WT fly's first crossing is at about 3.1 s, the mutant's at about 2.9 s).
- Progress along each walk is computed up front at 120 Hz, so frozen frames (`?t=`) and the exact beam crossings are still functions of time. The gaits have their own seeded generator (seed + 7), so the draws that make the walk–pause schedules (when to pause, where to walk) are unchanged.
- The leg drawings still follow the distance walked: the feet never slide, and the legs stand still during a hesitation. Bobbing of the body up and down is deliberately not modelled.

Reduced motion: the finished actograms with the ZT2 marker, shown on click.

## 4 · Descent (`#/pdf/step-2`), scroll-driven, 14 s at a steady scroll (about three screens)

Scrubbing back and forth always gives the same frame. Compartment labels use the viewer's names and order.

```
K  0.0–2.0   [transition in: shared element, the WT fly from its tube]  the tube and monitor wipe away
             (clip-path); the fly lifts to the stage centre and turns to face us (decision 2) as the
             camera starts to push; label "hTDP-43 WT" stays attached
   reads:  0.3–1.8  we follow this fly, the hTDP-43 WT one

L  2.0–4.5   push-in on the head; the body turns semi-transparent (washes nearly clear, ink faint);
             paper ivory → warm grey
   reads:  2.3–4.3  we are going inside its head

M  4.5–7.5   the brain outline draws on inside the head (central brain and optic lobes, frontal view,
             after the reference schematic); its two main regions are named with ink labels and
             arrows, which clear as the camera starts to push in; then the PDF neurons appear in
             membrane blue on one side, the only saturated colour on screen
   reads:  4.8–6.2  the brain, inside the head (its regions named from 5.75 s)
           6.2–7.5  these blue cells are the PDF neurons

N  7.5–10.5  push to the s-LNvs on one side; the neurons grow; labels appear one at a time along
             them: "cell bodies", "axon", "dorsal terminals"; paper → charcoal; grain, washes and
             boil fade out
   reads:  7.8–8.6  cell bodies (where the nuclei are)
           8.6–9.4  axon
           9.4–10.5 dorsal terminals, which remodel every day

O  10.5–14.0 matched swap: the neuron outline (from the same geometry file the viewer opens with)
             settles at the viewer's opening position and scale; paper → black; the outline moves
             to the left half and the mutant's neurons slide in on the right; labels hTDP-43 WT |
             hTDP-43 ALS mutant; the frame becomes the viewer (PixiJS) in step 3, TDP-43 dysfunction
   reads:  10.8–12.4 these neurons are what we will look at under the microscope
           12.4–14.0 two fields: WT left, mutant right
   badges: "Established: s-LNv anatomy and daily remodelling", "Simplified: cell bodies and axons enlarged"
   [transition out: route to #/pdf/step-3 with the viewer's opening frame identical to O's last frame]
```

Reduced motion: the labelled head–brain–neuron end frame and the "Next: the first clue" button.

As built ([descent-frames.png](descent-frames.png)):
- One 14 s timeline, set by the scroll position (the stage stays pinned for three screens). The camera is the SVG view box, in µm, with the origin at the centre of the head; strokes keep one width on screen at every zoom.
- K opens on the WT fly standing in its tube, grown out of where it stood in step 1. The label "hTDP-43 WT" rides beside the fly. The turn morphs each body part from its side-view drawing to its front-view drawing; the ink boil is on only while the fly is small.
- In L only the head and eyes stay drawn as we go in. The rest of the body and the antennae fade, so the head outline isn't lost among the body's, and the front view never reads as a face.
- In M the brain follows a simplified frontal schematic (`site/js/brain.js`, after the reference pack, p. 3). The neurons grow out from their cell bodies (a widening circular mask), at the medial edge of the left medulla.
- Once the brain has drawn on, M names its two main regions with ink labels and arrows, like the compartment labels in N: each arrow runs from the label's text to the region and ends in an arrowhead. "Central brain" appears at 5.75 s above the brain, its arrow pointing down into it. "Optic lobe" appears at 6.05 s below the optic lobe on the viewer's right (the one without the neurons, so the arrow stays clear of them), its arrow pointing up. Both fade out at 7.3–7.6 s, as the camera starts to push in towards the neurons at 7.5 s.
- N labels the four compartments one at a time, in the viewer's names and order: "Nucleus", "Cell body", "Axon", "Dorsal terminals" (7.9, 8.5, 9.1 and 9.7 s). Each label sits to the left of the neuron, with an arrow from the edge of its text to the structure (drawn in screen space every frame, so it always starts at the text). Caption: "Four small PDF neurons (s-LNvs). Their dorsal terminals remodel every day."
- O's frame is drawn from the viewer's own membrane and DAPI images (animal 1), tinted and added on black as the viewer does, at its "Whole neuron" scale, inside a frame laid out like the viewer's. On "Next: the first clue", step 3's viewer grows out of this frame, and the TDP-43 channel appears there: the clue.
- Reduced motion shows the end of N (the labelled neurons, close up) with the badges and the Next button.

## Checks (from the storyboard rules)

- An event in every shot: yes (A is the finished frame with idle motion).
- Each read has time to land before the next; no two reads overlap: yes, see the times above.
- A transition at every seam: Flip (hero → legend, station → stage), clip wipe and shared fly (assay → descent), matched swap (descent → viewer).
- Text: captions are 1–2 lines of crisp HTML, never painted into the artwork.
- The ending rhymes with the opening: the summary PNG (step 7) shows the hero's WT | mutant pair.

## Build notes

- Flies: SVG drawings from `generator/flies.py` (dorsal, side and frontal; standing, walking and grooming by inverse kinematics on the legs). Walking and grooming become short frame sequences (8–12 drawings per cycle) played on twos; the dorsal fly also has a three-drawing flap sequence (wings half open, swept forward, swept back) for the flight to the legend. In the activity monitor the body's travel follows a seeded gait computed up front (see the walking note in section 3), not a tween.
- Brain outline: a simplified frontal schematic traced from the reference pack (p. 3). The PDF neurons inside it come from `site/data/pdf/geometry-control-1.json`, the viewer's opening animal, so the final frame matches.
- Actograms: drawn from a seeded activity model (two flies × three days, half-hour bins), shown as an "invented for this case" phenotype.
- GSAP: timelines for the hero and assay; ScrollTrigger scrub for the descent; Flip for shared elements; MotionPath for the cassettes' flight; MorphSVG for the fly's turn; DrawSVG for leader lines and the brain outline. Deterministic: randomness only from the seeded PRNG.
