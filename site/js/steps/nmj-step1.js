// Step 1, leg motor neuron case: the climbing vial. The landing station grows into the stage, the
// group taps the flies down, the timer runs to 10 s while the flies climb (the mutants slowly,
// slipping back, their legs shaking), and each lane's climbing index builds
// (docs/storyboards/nmj-openings.md, shots G–J).
//
// Deterministic: the flies follow seeded schedules and every readout is computed from time.
// `?t=5` freezes the page at 5 s on the storyboard clock (G runs 0–3.5 s; the taps start at 3.5 s,
// as if the button were pressed then). Reduced motion: no motion before the button, and the button
// shows the finished counts and climbing indices.

import { href } from "../router.js";
import { loadGsap, reducedMotion } from "../gsap.js";
import { loadFlySprite, flyNode, startBoil, stopBoil, ensureBoilFilter } from "../fly.js";
import { tubeFly } from "../monitor.js";
import { VB, LANES, H, FLY_H, LINE, VW, FLOOR, vialMarkup, impactMarkup, labelMarkup, counterMarkup, indexMarkup,
  laneFlies, ambientPose, climbPose, liftAt, impactFlash, aboveCount, timerAt, poseTransform } from "../vial.js";
import { handOff, takeHandOff, growFrom } from "../handoff.js";
import { rollCaption } from "../caption.js";

const G_END = 3.5;
const CAP = { i: 3, i2: 7 };   // H-time each caption takes over: every caption is up for at least 3 s
const ID = "step";

const CAPTIONS = {
  g: "Tapped to the bottom, flies climb straight up the wall. We count how many pass the line in 10 seconds.",
  h: "Three taps on the bench, and every fly ends up at the bottom.",
  i: "Most hTDP-43 WT flies pass the line within 10 seconds.",
  i2: "The mutants climb slowly and slip back, and their legs shake.",
  j: "Climbing index: the share of flies above the line at 10 seconds.",
};

export async function mount(root, ctx) {
  const final = { wt: 8, mut: 2 };   // decision 3; checked against the schedules below
  const bench = [LANES[0].cx - VW / 2 - 40, LANES[1].cx + VW / 2 + 40];
  root.innerHTML = `
    <div class="story story--assay">
      <p class="t-label story__eyebrow">Introduction · Step 1</p>
      <h1 class="t-h1">Locomotion: climbing assay</h1>
      <div class="stage stage--assay">
        <svg class="assay climb" viewBox="0 0 ${VB.w} ${VB.h}" role="img" aria-label="Two climbing vials seen from the front, side by side: hTDP-43 WT on the left and the ALS mutant on the right, ten flies in each, with a finish line 5 cm up. The vials are tapped on the bench together three times, so every fly falls to the bottom; then a timer runs for 10 seconds while the flies climb the walls. Eight of ten WT flies pass the line, a climbing index of 0.8. The mutants climb slowly, slip back, one falls, and their legs shake: two of ten pass the line, a climbing index of 0.2.">
          ${LANES.map(l => `<text class="scene-label lane-label" x="${l.cx + l.out * (VW / 2 + 16)}" y="40" text-anchor="${l.out < 0 ? "end" : "start"}">${l.label}</text>`).join("")}
          <line class="vial-bench" x1="${bench[0]}" y1="${FLOOR + 4.6}" x2="${bench[1]}" y2="${FLOOR + 4.6}"/>
          ${LANES.map(impactMarkup).join("")}
          <g class="vials">${LANES.map(l => vialMarkup(l)).join("")}</g>
          ${labelMarkup(LANES[0])}
          ${LANES.map(counterMarkup).join("")}
          <text class="climb-timer" x="${(LANES[0].cx + LANES[1].cx) / 2}" y="18" text-anchor="middle">0.0 s</text>
          ${indexMarkup(final)}
        </svg>
        <span class="tag-sim assay__tag">Simulated data</span>
      </div>
      <p class="assay__caption" aria-live="polite"></p>
      <div class="assay__controls">
        <button class="btn btn--primary btn--lg" type="button" data-act="start" hidden>Tap the flies down</button>
        <a class="btn btn--primary btn--lg assay__end" href="${href(ctx.caseId, 2)}">Next: look inside the fly</a>
        <button class="btn btn--quiet" type="button" data-act="skip">Skip</button>
        <button class="btn btn--quiet" type="button" data-act="replay" hidden>Tap them down again</button>
      </div>
      <p class="assay__note"><span class="t-label run-in">Climbing assay</span> Flies climb upwards by instinct. Tapped to the bottom of a vial, they turn and climb the wall within seconds. In this assay, the vials are tapped down, and after a set time the flies above a finish line are counted; climbing declines with age and in many fly models of motor neuron disease. Each vial here holds ten flies.</p>
    </div>`;

  const stage = root.querySelector(".stage--assay");
  const svg = root.querySelector(".climb");
  const capBox = root.querySelector(".assay__caption");
  const ends = root.querySelectorAll(".assay__end");
  const btn = { start: root.querySelector("[data-act=start]"), skip: root.querySelector("[data-act=skip]"), replay: root.querySelector("[data-act=replay]") };
  const handRect = takeHandOff("vial");

  ensureBoilFilter();
  const meta = await loadFlySprite("lateral");
  const gsap = await loadGsap();
  const P = new URLSearchParams(location.search);
  const frozen = P.has("t") ? Number(P.get("t")) : null;
  const still = reducedMotion();

  const lanes = LANES.map(l => {
    const el = svg.querySelector(`.vial[data-lane=${l.id}]`);
    const probe = tubeFly(flyNode, meta, { height: FLY_H });
    const flies = laneFlies(l, probe.stride, probe.groundOffset).map(f => {
      const node = f.k === 0 ? probe : tubeFly(flyNode, meta, { height: FLY_H });
      el.querySelector(".vial-flies").append(node.g);
      return { ...f, node, origin: null, last: null };
    });
    const n = aboveCount(flies, H.timer).n;
    if (n !== final[l.id]) console.warn(`climbing vial: ${l.id} ends with ${n} above the line, not ${final[l.id]}`);
    return {
      ...l, el, flies, stride: probe.stride, frames: probe.frames, g: probe.groundOffset,
      ring: el.querySelector(".climb-ring--front"),
      counter: svg.querySelector(`.counter[data-lane=${l.id}] .counter-n`),
      impact: svg.querySelector(`.vial-impact[data-lane=${l.id}]`),
      shown: -1,
    };
  });
  const vials = svg.querySelector(".vials"), timer = svg.querySelector(".climb-timer");

  // ---------- G: the stage arrives and the parts are named (3.5 s) ----------
  const q = s => svg.querySelectorAll(s);
  gsap.set(q(".vial-labels text"), { autoAlpha: 0 });
  gsap.set(q(".counter, .climb-timer, .ci-formula, .ci-sum, .pi-track, .ci-scale, .pi-bar, .pi-dot"), { autoAlpha: 0 });
  gsap.set(ends, { autoAlpha: 0 });
  const tlG = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
  if (!handRect) tlG.fromTo(stage, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.8, ease: "power2.inOut" }, 0);
  tlG.fromTo(q(".vial-labels text"), { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.35 }, 0.8)
    .to({}, { duration: 0.01 }, G_END - 0.01);

  // ---------- H–J: the taps, the climb, the climbing index, the way on (13.4 s) ----------
  const tlH = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
  tlH.fromTo(q(".counter, .climb-timer"), { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 0.3)
    .fromTo(q(".ci-formula"), { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.35 }, H.index)
    .fromTo(q(".ci-sum"), { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.12 }, H.index + 0.5)
    .fromTo(q(".pi-track, .ci-scale"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, H.index + 0.5)
    .fromTo(q(".pi-bar"), { autoAlpha: 1, attr: { width: 0 } }, { attr: { width: (i, el) => el.dataset.w }, duration: 0.7, ease: "power2.inOut", stagger: 0.12 }, H.index + 0.8)
    .fromTo(q(".pi-dot"), { autoAlpha: 1, attr: { cx: (i, el) => el.dataset.x0 } }, { attr: { cx: (i, el) => el.dataset.x }, duration: 0.7, ease: "power2.inOut", stagger: 0.12, immediateRender: false }, H.index + 0.8)
    .fromTo(ends, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.15 }, H.next)
    .to({}, { duration: 0.01 }, H.end - 0.01);

  // ---------- state, clock and controls ----------
  let phase = "g", tClick = G_END;
  const t0 = performance.now();
  const clock = () => (frozen != null ? Math.min(frozen, G_END) : still ? G_END : (performance.now() - t0) / 1000);
  const setCaption = rollCaption(gsap, capBox, CAPTIONS, Object.keys(CAPTIONS), frozen == null && !still);   // CAPTIONS is in story order
  // each fly falls from where it was when the vials were picked up
  const takeOrigins = tc => lanes.forEach(l => l.flies.forEach(f => { f.origin = f.last || ambientPose(l, f, tc, l.g, l.stride, l.frames); }));
  function startTapping(tc) {
    phase = "tap";
    tClick = tc;
    btn.start.hidden = true;
    btn.skip.hidden = !!still;
    btn.replay.hidden = true;
  }
  tlG.eventCallback("onComplete", () => { if (phase === "g") { btn.start.hidden = false; btn.skip.hidden = true; } });
  let endedAt = null;   // after the hold, the flies keep resting and grooming on a running clock
  tlH.eventCallback("onComplete", () => { endedAt = performance.now(); btn.skip.hidden = true; btn.replay.hidden = !!still; });
  btn.start.addEventListener("click", () => {
    takeOrigins(clock());
    startTapping(clock());
    if (still) { tlH.progress(1); render(); } else { tlH.play(0); btn.skip.focus(); }
  });
  btn.skip.addEventListener("click", () => {
    if (phase === "g") tlG.progress(1);
    else tlH.progress(1);
    render();
  });
  btn.replay.addEventListener("click", () => {
    btn.replay.hidden = true; btn.skip.hidden = false;
    takeOrigins(clock());
    for (const l of lanes) l.shown = -1;
    endedAt = null;
    tlH.restart();
  });

  // ---------- drawing, every frame, from time ----------
  let timerShown = "";
  function render() {
    let tH = null;
    if (phase === "g") {
      setCaption(tlG.time() >= 0.8 ? "g" : "");
    } else {
      tH = endedAt != null && frozen == null && !still ? H.end + (performance.now() - endedAt) / 1000 : tlH.time();
      setCaption(tH < CAP.i ? "h" : tH < CAP.i2 ? "i" : tH < H.stop ? "i2" : "j");
    }
    const tWall = phase === "g" ? clock() : tClick + (tH ?? 0);
    const lift = tH == null ? 0 : liftAt(tH), flash = tH == null ? 0 : impactFlash(tH);
    vials.setAttribute("transform", lift ? `translate(0 ${(-lift).toFixed(2)})` : "");
    const tau = tH == null ? 0 : timerAt(tH);
    for (const l of lanes) {
      for (const f of l.flies) {
        const p = tH == null ? ambientPose(l, f, tWall, l.g, l.stride, l.frames) : climbPose(l, f, tH, l.g, l.stride, l.frames, f.origin);
        f.last = p;
        f.node.g.setAttribute("transform", poseTransform(p));
        f.node.node.show(p.seq, p.frame);
      }
      // the counter: flies above the line while the timer runs; it pulses, and the line thickens, at each crossing
      const { n, last } = tH == null ? { n: 0, last: -Infinity } : aboveCount(l.flies, tau);
      if (n !== l.shown) { l.counter.textContent = String(n); l.shown = n; }
      const dt = tH == null ? 9 : tH - (H.run + last / H.rate);   // story seconds since the latest crossing
      const beat = Math.max(0, 1 - dt / 0.3);
      l.ring.style.strokeWidth = (2.2 + 2.2 * beat).toFixed(2);   // at rest, the .climb-ring weight
      l.ring.style.opacity = (0.9 + 0.1 * beat).toFixed(2);
      const s = 1 + 0.28 * Math.max(0, 1 - dt / 0.25);
      const x = +l.counter.getAttribute("x"), y = +l.counter.getAttribute("y") - 7;
      l.counter.setAttribute("transform", s > 1.001 ? `translate(${x} ${y}) scale(${s.toFixed(3)}) translate(${-x} ${-y})` : "");
      l.impact.style.opacity = flash.toFixed(3);
    }
    const label = `${tau.toFixed(1)} s`;
    if (label !== timerShown) { timer.textContent = label; timerShown = label; }
  }

  gsap.ticker.add(render);

  if (handRect && !still && frozen == null) growFrom(gsap, stage, handRect);
  if (frozen != null) {
    btn.skip.hidden = true;
    if (frozen < G_END) tlG.pause(frozen);
    else { tlG.progress(1); takeOrigins(G_END); startTapping(G_END); tlH.pause(frozen - G_END); btn.skip.hidden = true; }
  } else if (still) {
    tlG.progress(1);
  } else {
    startBoil();
    tlG.play(0);
  }
  render();
  // the descent (step 2) starts from the WT fly highest on the wall, one that passed the line
  const chosen = lanes[0].flies.filter(f => f.end !== "floor").sort((a, b) => a.end - b.end)[0];
  root.querySelector(".assay__controls a.btn").addEventListener("click", () => handOff("fly", chosen.node.g));
  window.__assay = { tlG, tlH, clock, lanes };   // for review tooling

  return () => {
    gsap.ticker.remove(render);
    tlG.kill();
    tlH.kill();
    if (!still && frozen == null) stopBoil();
    delete window.__assay;
  };
}
