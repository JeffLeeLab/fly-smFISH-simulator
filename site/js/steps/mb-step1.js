// Step 1, mushroom body case: the T-maze. The landing station grows into the stage, the group
// trains the flies (OCT with shocks, then MCH without), the flies are tested at the choice point
// and each lane's performance index builds (docs/storyboards/mb-openings.md, shots G–J).
//
// Deterministic: the flies follow seeded schedules and every readout is computed from time.
// `?t=5` freezes the page at 5 s on the storyboard clock (G runs 0–3.5 s; training starts at
// 3.5 s, as if the button were pressed then). Reduced motion: no motion before the button, and
// the button shows the finished counts and performance indices.

import { href } from "../router.js";
import { loadGsap, reducedMotion } from "../gsap.js";
import { loadFlySprite, flyNode, startBoil, stopBoil, ensureBoilFilter } from "../fly.js";
import { tubeFly } from "../monitor.js";
import { VB, LANES, H, FLY_H, DROP, TUBE_SPAN, odourDefs, driftOdours, mazeMarkup, piMarkup, laneFlies, flyPose, poseTransform, armCounts, odourAt, shockAt, boltAt, feedAt } from "../tmaze.js";
import { handOff, takeHandOff, growFrom } from "../handoff.js";
import { rollCaption } from "../caption.js";

const G_END = 3.5;
const FEED_TAG = { oct: "OCT", air: "air", mch: "MCH" };
const ID = "step";

const CAPTIONS = {
  g: "Flies learn in the training tube, then choose between two odours at the T.",
  h: "OCT comes with mild shocks. MCH comes with none.",
  i: "A few minutes later, each fly picks an arm.",
  j: "Performance index: 1 if every fly avoided the shocked odour, 0 if they chose at random.",
};

export async function mount(root, ctx) {
  const counts = l => ({ oct: l.oct.length, mch: 10 - l.oct.length });
  root.innerHTML = `
    <div class="story story--assay">
      <p class="t-label story__eyebrow">Introduction · Step 1</p>
      <h1 class="t-h1">Learning &amp; memory: T-maze assay</h1>
      <div class="stage stage--assay">
        <svg class="assay tmaze" viewBox="0 0 ${VB.w} ${VB.h}" role="img" aria-label="T-maze, seen from the front. Two mazes, hTDP-43 WT on the left and the ALS mutant on the right, each with ten flies. The flies are trained in a tube lined with a shock grid: the odour OCT comes with mild shocks, the odour MCH with none. Minutes later they are moved to the choice point between an OCT arm and an MCH arm. Eight of ten WT flies avoid OCT, a performance index of 0.6; the mutant flies split five and five, a performance index of 0, as if they chose at random.">
          <defs>${odourDefs(ID)}</defs>
          ${LANES.map(l => mazeMarkup(l, { id: ID, labels: l.id === "wt" }) + piMarkup(l, counts(l))).join("")}
        </svg>
        <span class="tag-sim assay__tag">Simulated data</span>
      </div>
      <p class="assay__caption" aria-live="polite"></p>
      <div class="assay__controls">
        <button class="btn btn--primary btn--lg" type="button" data-act="start" hidden>Train the flies</button>
        <a class="btn btn--primary btn--lg assay__end" href="${href(ctx.caseId, 2)}">Next: look inside the brain</a>
        <button class="btn" type="button" data-act="skip" hidden>Skip animation</button>
        <button class="btn" type="button" data-act="replay" hidden>Replay the training</button>
      </div>
      <p class="assay__note"><span class="t-label run-in">T-maze assay</span> In the training tube, one odour comes with mild electric shocks from the grid and a second odour comes with none. A few minutes later the flies are moved down to the choice point, between an arm smelling of each odour. Flies that remember avoid the shocked odour. Each count stands for a group of about a hundred flies.</p>
    </div>`;

  const stage = root.querySelector(".stage--assay");
  const svg = root.querySelector(".tmaze");
  const capBox = root.querySelector(".assay__caption");
  const ends = root.querySelectorAll(".assay__end");
  const btn = { start: root.querySelector("[data-act=start]"), skip: root.querySelector("[data-act=skip]"), replay: root.querySelector("[data-act=replay]") };
  const handRect = takeHandOff("maze");

  ensureBoilFilter();
  const meta = await loadFlySprite("lateral");
  const gsap = await loadGsap();
  const P = new URLSearchParams(location.search);
  const frozen = P.has("t") ? Number(P.get("t")) : null;
  const still = reducedMotion();

  const lanes = LANES.map(l => {
    const el = svg.querySelector(`.maze[data-lane=${l.id}]`);
    const probe = tubeFly(flyNode, meta, { height: FLY_H });
    const flies = laneFlies(l, probe.stride).map(f => {
      const node = f.k === 0 ? probe : tubeFly(flyNode, meta, { height: FLY_H });
      el.querySelector(".wall-flies").append(node.g);
      return { ...f, node };
    });
    return {
      ...l, el, flies, stride: probe.stride, frames: probe.frames, ground: probe.groundOffset,
      elevator: el.querySelector(".elevator"),
      shock: el.querySelector(".shock"),
      feed: { tag: el.querySelector(".feed-tag"), flow: el.querySelector(".feed-flow"), core: el.querySelector(".feed-core"), key: el.querySelector(".feed-tag").previousElementSibling, shown: "" },
      bolt: { g: el.querySelector(".bolt-g"), n: el.querySelector(".bolt-n"), at: el.querySelector(".bolt-g").getAttribute("transform"), shown: -1 },
      tube: { oct: el.querySelector(".odour--tube[data-odour=oct]"), mch: el.querySelector(".odour--tube[data-odour=mch]") },
      arms: [...el.querySelectorAll(".odour--arm")],
      entry: { oct: el.querySelector(".entry[data-arm=oct]"), mch: el.querySelector(".entry[data-arm=mch]") },
      counter: { oct: el.querySelector(".counter[data-arm=oct] .counter-n"), mch: el.querySelector(".counter[data-arm=mch] .counter-n") },
      shown: { oct: -1, mch: -1 },
    };
  });

  // ---------- G: the stage arrives and the parts are named (3.5 s) ----------
  const q = s => svg.querySelectorAll(s);
  gsap.set(q(".maze-labels text, .odour-labels text"), { autoAlpha: 0 });
  gsap.set(q(".counter, .pi-formula, .pi-sum, .pi-track, .pi-tick, .pi .scene-tick, .pi-bar, .pi-dot"), { autoAlpha: 0 });
  gsap.set(ends, { autoAlpha: 0 });
  const tlG = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
  if (!handRect) tlG.fromTo(stage, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.8, ease: "power2.inOut" }, 0);
  tlG.fromTo(q(".maze-labels text"), { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.3 }, 0.8)
    .fromTo(q(".odour-labels text"), { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.15 }, 2.2)
    .to({}, { duration: 0.01 }, G_END - 0.01);

  // ---------- H–J: training, the test, the performance index, the way on (11.8 s) ----------
  const tlH = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
  tlH.fromTo(q(".counter"), { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.35 }, H.armsFill[0])
    .fromTo(q(".pi-formula"), { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.35 }, H.pi)
    .fromTo(q(".pi-track, .pi-tick, .pi .scene-tick"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, H.pi + 0.5)
    .fromTo(q(".pi-sum"), { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.12 }, H.pi + 0.5)
    .fromTo(q(".pi-bar"), { autoAlpha: 1, attr: { width: 0 } }, { attr: { width: (i, el) => el.dataset.w }, duration: 0.7, ease: "power2.inOut", stagger: 0.12 }, H.pi + 0.8)
    .fromTo(q(".pi-dot"), { autoAlpha: 1, attr: { cx: (i, el) => el.dataset.x0 } }, { attr: { cx: (i, el) => el.dataset.x }, duration: 0.7, ease: "power2.inOut", stagger: 0.12, immediateRender: false }, H.pi + 0.8)
    .fromTo(ends, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.15 }, H.rest)
    .to({}, { duration: 0.01 }, H.end - 0.01);

  // ---------- state, clock and controls ----------
  let phase = "g", tClick = G_END;
  const t0 = performance.now();
  const clock = () => (frozen != null ? Math.min(frozen, G_END) : still ? G_END : (performance.now() - t0) / 1000);
  const setCaption = rollCaption(gsap, capBox, CAPTIONS, Object.keys(CAPTIONS), frozen == null && !still);   // CAPTIONS is in story order
  function startTraining(tc) {
    phase = "train";
    tClick = tc;
    btn.start.hidden = true;
    btn.skip.hidden = !!still;
    btn.replay.hidden = true;
  }
  // Start comes in as soon as the stage has arrived (0.8 s), while the parts are still being named;
  // there is no Skip before it (Start takes the group past the rest of G)
  const showStart = () => {
    if (phase !== "g" || !btn.start.hidden) return;
    btn.start.hidden = false;
    if (frozen == null && !still) gsap.fromTo(btn.start, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out" });
  };
  tlG.call(showStart, null, 0.8);
  tlG.eventCallback("onComplete", showStart);
  let endedAt = null;   // after the hold, the flies keep walking and grooming on a running clock
  tlH.eventCallback("onComplete", () => { endedAt = performance.now(); btn.skip.hidden = true; btn.replay.hidden = !!still; });
  btn.start.addEventListener("click", () => {
    if (tlG.progress() < 1) tlG.progress(1);   // an early start: the parts are named at once
    startTraining(clock());
    if (still) { tlH.progress(1); render(); } else { tlH.play(0); btn.skip.focus(); }
  });
  btn.skip.addEventListener("click", () => {
    if (phase === "g") tlG.progress(1);
    else tlH.progress(1);
    render();
  });
  btn.replay.addEventListener("click", () => {
    btn.replay.hidden = true; btn.skip.hidden = false;
    for (const l of lanes) l.shown = { oct: -1, mch: -1 };
    endedAt = null;
    tlH.restart();
  });

  // ---------- drawing, every frame, from time ----------
  const span = TUBE_SPAN.bottom - TUBE_SPAN.top;
  const setOdour = (el, [back, front]) => {
    const h = Math.max(0, front - back) * span;
    el.setAttribute("y", (TUBE_SPAN.top + back * span).toFixed(2));
    el.setAttribute("height", h.toFixed(2));
  };
  const count = (l, arm, n, dt) => {
    if (n !== l.shown[arm]) { l.counter[arm].textContent = String(n); l.shown[arm] = n; }
    const f = Math.max(0, 1 - dt / 0.3);
    l.entry[arm].style.strokeWidth = (1.2 + 2.2 * f).toFixed(2);
    l.entry[arm].style.opacity = (0.55 + 0.45 * f).toFixed(2);
    const s = 1 + 0.28 * Math.max(0, 1 - dt / 0.25), el = l.counter[arm];
    const x = +el.getAttribute("x"), y = +el.getAttribute("y") - 7;
    el.setAttribute("transform", s > 1.001 ? `translate(${x} ${y}) scale(${s.toFixed(3)}) translate(${-x} ${-y})` : "");
  };

  function render() {
    let tH = null, tWall, tDrift;
    if (phase === "g") {
      tWall = tDrift = clock();
      setCaption(tlG.time() >= 0.8 ? "g" : "");
    } else {
      tH = endedAt != null && frozen == null && !still ? H.end + (performance.now() - endedAt) / 1000 : tlH.time();
      tWall = tClick + tH;
      tDrift = tWall;
      setCaption(tH < H.tap[0] ? "h" : tH < H.pi ? "i" : "j");
    }
    const od = odourAt(tH, phase);
    const shock = tH == null ? 0 : shockAt(tH);
    const bolt = boltAt(tH), feed = feedAt(tH);
    for (const l of lanes) {
      for (const f of l.flies) {
        const p = flyPose(f, l, tWall, tH, l.stride, l.frames, l.ground);
        f.node.g.setAttribute("transform", poseTransform(p));
        f.node.node.show(p.seq, p.frame);
      }
      setOdour(l.tube.oct, od.tube.oct);
      setOdour(l.tube.mch, od.tube.mch);
      l.arms.forEach(a => { a.style.opacity = (0.55 * od.arms).toFixed(3); });
      l.shock.style.opacity = shock.toFixed(3);
      // the hose names what flows, fills with its colour and its texture runs into the tube; the bolt pops at each pulse
      if (feed !== l.feed.shown) {
        l.feed.tag.textContent = feed ? FEED_TAG[feed] : "";
        l.feed.flow.dataset.odour = l.feed.core.dataset.odour = l.feed.key.dataset.odour = feed || "";
        l.feed.key.style.visibility = feed ? "" : "hidden";
        l.feed.shown = feed;
      }
      l.feed.flow.style.strokeDashoffset = (-14 * tDrift).toFixed(2);
      l.bolt.g.style.opacity = bolt.alpha.toFixed(3);
      l.bolt.g.setAttribute("transform", `${l.bolt.at} scale(${(1 + 0.45 * bolt.pop).toFixed(3)})`);
      if (bolt.n !== l.bolt.shown) { l.bolt.n.textContent = bolt.n ? `×${bolt.n}` : ""; l.bolt.shown = bolt.n; }
      const lift = tH == null || tH < H.slide[0] ? 0 : (H.slide[1] <= tH ? 1 : gsap.parseEase("power2.inOut")((tH - H.slide[0]) / (H.slide[1] - H.slide[0])));
      l.elevator.setAttribute("transform", lift ? `translate(0 ${(lift * DROP).toFixed(2)})` : "");
      const { n, last } = armCounts(l.flies, tH);
      for (const arm of ["oct", "mch"]) count(l, arm, n[arm], tH == null ? 9 : tH - last[arm]);
    }
    driftOdours(svg, ID, tDrift);
  }

  gsap.ticker.add(render);

  if (handRect && !still && frozen == null) growFrom(gsap, stage, handRect);
  if (frozen != null) {
    btn.skip.hidden = true;
    if (frozen < G_END) tlG.pause(frozen);
    else { tlG.progress(1); startTraining(G_END); tlH.pause(frozen - G_END); btn.skip.hidden = true; }
  } else if (still) {
    tlG.progress(1);
  } else {
    startBoil();
    tlG.play(0);
  }
  render();
  // the descent (step 2) starts from a WT fly that remembered: one in the MCH arm
  const chosen = lanes[0].flies.find(f => f.arm === "mch" && !f.ceiling);
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

