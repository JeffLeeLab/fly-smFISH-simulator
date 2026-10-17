// Step 1, chosen case (Pdf neurons): the activity monitor. The landing station grows into the
// stage, the group starts the light–dark days and watches each fly's actogram build, and the
// brain-collection time is marked (docs/storyboards/pdf-openings.md, shots G–J).
//
// Deterministic: the flies follow seeded schedules and every readout is computed from time.
// `?t=5` freezes the page at 5 s on the storyboard clock (G runs 0–3.5 s; the days start at
// 3.5 s, as if the button were pressed then). Reduced motion: no motion before the button, and
// the button shows the finished actograms with the ZT2 marker.

import { href } from "../router.js";
import { loadGsap, reducedMotion } from "../gsap.js";
import { loadFlySprite, flyNode, groomFrame, startBoil, stopBoil, ensureBoilFilter } from "../fly.js";
import { BINS, DAY_S, activity, walkPause, walkAt, crossingsBy, lastCrossing, timelapse, lapseAt, tube, tubeFly, actogramRows } from "../monitor.js";
import { handOff, takeHandOff, growFrom } from "../handoff.js";
import { rollCaption } from "../caption.js";
import { mulberry32 } from "../prng.js";

const W = 960, HT = 458;
const LW = 380;                               // lane width
const TUBE = { y: 112, h: 56 };
const BEAM = 193, X_MIN = 100, X_MAX = 292;   // lane-relative: the beam, and the thorax's range
const FLY_H = 44;
const ACTO = { y: 256, rowH: 34 };
const LD = { x: 60, y: 30, w: 840, h: 16 };
const G_END = 3.5;
const BIN_S = DAY_S / BINS;
const STUB_BINS = 4;                          // day 4 runs to ZT2, when the brains are collected
const DAYS_END = (3 * BINS + STUB_BINS) * BIN_S;
const H_END = 11.8;

const LANES = [
  { id: "wt", x: 60, label: "hTDP-43 WT", seed: 101, walk: { x: X_MIN + 8, face: 1, first: { t: 1.7, x: BEAM + 64, speed: 64 } } },
  { id: "mut", x: 520, label: "hTDP-43 ALS mutant", seed: 202, walk: { x: X_MAX - 8, face: -1, first: { t: 1.5, x: BEAM - 60, speed: 70 } } },
];

const CAPTIONS = {
  g: "Each fly lives in its own tube. Every time it walks through the infrared beam, the monitor counts one crossing.",
  h1: "Activity builds up as an actogram: each bar is the crossings in half an hour.",
  h2: "At night, the hTDP-43 WT fly sleeps. The mutant keeps waking.",
  i: "Brains for the microscope were collected at ZT2, two hours after lights on.",
};
const ZT_TICKS = [0, 6, 12, 18, 24];

function laneMarkup(l, rows) {
  const x = l.x, bx = x + BEAM;
  const axisY = ACTO.y + rows.length * ACTO.rowH;
  const zx = x + (STUB_BINS / BINS) * LW, top = ACTO.y + (rows.length - 1) * ACTO.rowH;
  return `
    <g class="lane" data-lane="${l.id}">
      <text class="scene-label" x="${x}" y="96">${l.label}</text>
      ${tube({ x, y: TUBE.y, w: LW, h: TUBE.h, beam: bx, id: l.id })}
      <g class="tube-flies"></g>
      ${l.id === "wt" ? `
      <g class="assay-labels">
        <text class="scene-small" x="${x + 28}" y="194" text-anchor="middle">food</text>
        <text class="scene-small" x="${x + LW - 25}" y="194" text-anchor="middle">cotton plug</text>
        <text class="scene-small" x="${bx + 12}" y="105">infrared beam</text>
      </g>` : ""}
      <g class="counter">
        <text class="counter-n" x="${bx}" y="207" text-anchor="middle">0</text>
        <text class="scene-small" x="${bx}" y="223" text-anchor="middle">beam crossings</text>
      </g>
      <g class="acto">
        <text class="scene-small acto-key" x="${x + LW}" y="${ACTO.y - 8}" text-anchor="end">crossings per half hour</text>
        ${actogramRows(rows, { x, y: ACTO.y, w: LW, rowH: ACTO.rowH })}
        ${rows.map((_, d) => `<text class="scene-small acto-day" x="${x - 8}" y="${ACTO.y + (d + 1) * ACTO.rowH - 4}" text-anchor="end">day ${d + 1}</text>`).join("")}
        ${ZT_TICKS.map(z => `<line class="acto-tick" x1="${x + z / 24 * LW}" y1="${axisY}" x2="${x + z / 24 * LW}" y2="${axisY + 5}"/><text class="scene-tick" x="${x + z / 24 * LW}" y="${axisY + 18}" text-anchor="middle">${z}</text>`).join("")}
        <text class="scene-tick" x="${x + LW + 14}" y="${axisY + 18}">ZT (h)</text>
      </g>
      <g class="zt2">
        <path class="zt2-head" d="M${zx - 4.5},${top - 7} L${zx + 4.5},${top - 7} L${zx},${top} Z"/>
        <path class="zt2-line" d="M${zx},${top} V${axisY}"/>
        <text class="scene-small zt2-label" x="${zx + 8}" y="${axisY - 12}">ZT2 · brains collected here</text>
      </g>
    </g>`;
}

function ldMarkup() {
  return `
    <g class="ld">
      <rect class="ld-day" x="${LD.x}" y="${LD.y}" width="${LD.w / 2}" height="${LD.h}"/>
      <rect class="ld-night" x="${LD.x + LD.w / 2}" y="${LD.y}" width="${LD.w / 2}" height="${LD.h}"/>
      <text class="scene-tick ld-on" x="${LD.x + 8}" y="${LD.y + 11.5}">lights on</text>
      <text class="scene-tick ld-off" x="${LD.x + LD.w / 2 + 8}" y="${LD.y + 11.5}">lights off</text>
      ${ZT_TICKS.map(z => `<line class="acto-tick" x1="${LD.x + z / 24 * LD.w}" y1="${LD.y + LD.h}" x2="${LD.x + z / 24 * LD.w}" y2="${LD.y + LD.h + 4}"/><text class="scene-tick" x="${LD.x + z / 24 * LD.w}" y="${LD.y + LD.h + 15}" text-anchor="middle">ZT${z}</text>`).join("")}
      <g class="ld-head"><path d="M0,-2 L-5,-9 L5,-9 Z"/><line x1="0" y1="-2" x2="0" y2="${LD.h + 2}"/><text class="scene-tick ld-readout" x="0" y="-13" text-anchor="middle">Day 1 · ZT 00</text></g>
    </g>`;
}

// Resting after the days: stand and groom in turn, never in step between the two flies.
function restSchedule(seed, first) {
  const r = mulberry32(seed);
  const out = [];
  let t = first;
  while (t < 600) {
    const d = 2.2 + r() * 1.0;
    out.push([t, t + d]);
    t += d + 2.4 + r() * 2.6;
  }
  return out;
}

export async function mount(root, ctx) {
  const lanes = LANES.map(l => {
    const rows = activity(l.id, 4, l.seed);
    rows[3] = rows[3].slice(0, STUB_BINS);
    const bins = rows.flat();
    const cum = [0];
    bins.forEach(v => cum.push(cum[cum.length - 1] + v));
    return { ...l, rows, bins, cum };
  });

  root.innerHTML = `
    <div class="story story--assay">
      <p class="t-label story__eyebrow">Introduction · Step 1</p>
      <h1 class="t-h1">Sleep &amp; circadian rhythm: activity monitor assay</h1>
      <div class="stage stage--assay">
        <svg class="assay" viewBox="0 0 ${W} ${HT}" role="img" aria-label="Activity monitor. Two glass tubes, hTDP-43 WT on the left and the ALS mutant on the right, each with one fly, food at the left end, a cotton plug at the right and an infrared beam across the middle. Below each tube, an actogram of beam crossings per half hour over three days of 12 hours light and 12 hours dark. By day the two flies are alike; at night the WT fly sleeps while the mutant keeps waking. Brains were collected at ZT2.">
          <rect class="night-wash" x="0" y="0" width="${W}" height="${HT}" opacity="0"/>
          ${ldMarkup()}
          ${lanes.map(l => laneMarkup(l, l.rows)).join("")}
        </svg>
        <span class="tag-sim assay__tag">Simulated data</span>
      </div>
      <p class="assay__caption" aria-live="polite"></p>
      <div class="assay__controls">
        <button class="btn btn--primary btn--lg" type="button" data-act="start" hidden>Start the light–dark days</button>
        <a class="btn btn--primary btn--lg assay__end" href="${href(ctx.caseId, 2)}">Next: look inside the brain</a>
        <button class="btn" type="button" data-act="skip">Skip animation</button>
        <button class="btn" type="button" data-act="replay" hidden>Replay the days</button>
      </div>
      <p class="assay__note"><span class="t-label run-in">Activity monitor assay</span> The monitor counts every walk through the beam, day and night. Over days of 12 hours light and 12 hours dark, the counts show when each fly is active and when it sleeps: a fly that does not cross the beam for five minutes or more is counted as asleep.</p>
    </div>`;

  const stage = root.querySelector(".stage--assay");
  const svg = root.querySelector(".assay");
  const capBox = root.querySelector(".assay__caption");
  const ends = root.querySelectorAll(".assay__end");
  const btn = { start: root.querySelector("[data-act=start]"), skip: root.querySelector("[data-act=skip]"), replay: root.querySelector("[data-act=replay]") };
  const handRect = takeHandOff("monitor");

  ensureBoilFilter();
  const meta = await loadFlySprite("lateral");
  const gsap = await loadGsap();
  const P = new URLSearchParams(location.search);
  const frozen = P.has("t") ? Number(P.get("t")) : null;
  const still = reducedMotion();

  for (const l of lanes) {
    l.el = svg.querySelector(`.lane[data-lane=${l.id}]`);
    l.fly = tubeFly(flyNode, meta, { height: FLY_H });
    l.el.querySelector(".tube-flies").append(l.fly.g);
    l.groundY = TUBE.y + TUBE.h - 3 - l.fly.groundOffset;
    l.w = walkPause(l.seed, { ...l.walk, until: 900, xMin: X_MIN, xMax: X_MAX, beam: BEAM, stride: l.fly.stride });
    l.beam = l.el.querySelector(".beam");
    l.count = l.el.querySelector(".counter-n");
    l.bars = [...l.el.querySelectorAll(".acto-bar")].map(el => ({ el, h: +el.dataset.h, base: +el.dataset.base }));
    l.rest = restSchedule(l.seed + 7, DAYS_END + (l.id === "wt" ? 0.7 : 1.6));
    l.shown = -100;
    l.lastN = -1;
  }
  const ldHead = svg.querySelector(".ld-head");
  const ldText = svg.querySelector(".ld-readout");
  const wash = svg.querySelector(".night-wash");

  // ---------- G: the stage arrives, the parts are named, a crossing is counted (3.5 s) ----------
  const q = s => svg.querySelectorAll(s);
  gsap.set(q(".assay-labels text, .counter, .ld, .acto, .zt2"), { autoAlpha: 0 });
  gsap.set(q(".beam"), { drawSVG: "50% 50%" });
  gsap.set(ends, { autoAlpha: 0 });
  const tlG = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
  if (!handRect) tlG.fromTo(stage, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.8, ease: "power2.inOut" }, 0);
  tlG.fromTo(q(".assay-labels text"), { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.35 }, 0.8)
    .to(q(".beam"), { drawSVG: "0% 100%", duration: 0.4, ease: "power2.inOut" }, 1.5)
    .fromTo(q(".counter"), { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 2.2)
    .to({}, { duration: 0.01 }, G_END - 0.01);

  // ---------- H–J: three days, the ZT2 marker, the way on (11.8 s) ----------
  const tlH = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
  tlH.fromTo(q(".ld"), { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 0)
    .fromTo(q(".acto"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0)
    .fromTo(q(".acto-base"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.5, ease: "power2.inOut", stagger: 0.04 }, 0)
    .fromTo(q(".zt2"), { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: 0.45 }, 8.7)
    .fromTo(q(".zt2-label"), { autoAlpha: 0, x: -4 }, { autoAlpha: 1, x: 0, duration: 0.3 }, 9.0)
    .fromTo(ends, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.15 }, 10.6)
    .to({}, { duration: 0.01 }, H_END - 0.01);

  // ---------- state, clock and controls ----------
  let phase = "g";
  const t0 = performance.now();
  const clock = () => (frozen != null ? Math.min(frozen, G_END) : still ? G_END : (performance.now() - t0) / 1000);
  const setCaption = rollCaption(gsap, capBox, CAPTIONS, Object.keys(CAPTIONS), frozen == null && !still);   // CAPTIONS is in story order

  function startDays(tc) {
    phase = "days";
    for (const l of lanes) {
      const st = walkAt(l.w, tc, l.fly.stride, l.fly.frames);
      l.base = crossingsBy(l.w, tc);
      l.lapse = timelapse(l.bins, { x: st.x, face: st.face, xMin: X_MIN, xMax: X_MAX, beam: BEAM, dur: DAYS_END, seed: l.seed + 3 });
      l.shown = -100;
    }
    btn.start.hidden = true;
    btn.skip.hidden = !!still;
    btn.replay.hidden = true;
  }

  tlG.eventCallback("onComplete", () => { if (phase === "g") { btn.start.hidden = false; btn.skip.hidden = true; } });
  let endedAt = null;   // after the hold, the flies rest and groom on a running clock
  tlH.eventCallback("onComplete", () => { endedAt = performance.now(); btn.skip.hidden = true; btn.replay.hidden = !!still; });
  btn.start.addEventListener("click", () => {
    startDays(clock());
    if (still) { tlH.progress(1); render(); } else { tlH.play(0); btn.skip.focus(); }
  });
  btn.skip.addEventListener("click", () => {
    if (phase === "g") tlG.progress(1);
    else tlH.progress(1);
    render();
  });
  btn.replay.addEventListener("click", () => {
    btn.replay.hidden = true; btn.skip.hidden = false;
    for (const l of lanes) l.shown = -100;
    endedAt = null;
    tlH.restart();
  });

  // ---------- drawing, every frame, from time ----------
  const flash = (l, dt) => {
    const f = Math.max(0, 1 - dt / 0.3);
    l.beam.style.strokeWidth = (1.2 + 2.4 * f).toFixed(2);
    l.beam.style.opacity = (0.6 + 0.4 * f).toFixed(2);
  };
  const setCount = (l, n) => {
    if (n !== l.lastN) { l.count.textContent = String(n); l.lastN = n; }
  };
  const pulse = (l, dt) => {
    const s = 1 + 0.28 * Math.max(0, 1 - dt / 0.25);
    const bx = l.x + BEAM;
    l.count.setAttribute("transform", s > 1.001 ? `translate(${bx} 200) scale(${s.toFixed(3)}) translate(${-bx} -200)` : "");
  };
  const drawBars = (l, tH) => {
    if (tH > DAYS_END + 0.3 && l.shown === Infinity) return;   // finished and drawn
    const grown = j => Math.min(1, Math.max(0, (tH - j * BIN_S) / 0.15));
    const cur = Math.floor(tH / BIN_S);
    const all = Math.abs(cur - l.shown) > 3;
    const lo = all ? 0 : Math.max(0, cur - 5), hi = all ? l.bars.length - 1 : Math.min(l.bars.length - 1, cur + 1);
    for (let j = lo; j <= hi; j++) {
      const b = l.bars[j], h = b.h * grown(j);
      b.el.setAttribute("y", (b.base - h).toFixed(2));
      b.el.setAttribute("height", h.toFixed(2));
    }
    l.shown = tH > DAYS_END + 0.3 ? Infinity : cur;
  };
  const countAt = (l, tH) => {
    const i = Math.min(l.bins.length, Math.floor(tH / BIN_S));
    const frac = i < l.bins.length ? (tH - i * BIN_S) / BIN_S : 0;
    return Math.round(l.cum[i] + (l.bins[i] || 0) * frac);
  };
  const drawClock = tH => {
    const T = Math.min(tH, DAYS_END) / DAY_S * 24;     // hours since the first lights-on
    const zt = T % 24;
    const hx = LD.x + zt / 24 * LD.w;
    ldHead.setAttribute("transform", `translate(${hx.toFixed(2)} ${LD.y})`);
    ldText.textContent = `Day ${Math.floor(T / 24) + 1} · ZT ${String(Math.floor(zt)).padStart(2, "0")}`;
    ldText.setAttribute("x", (Math.min(LD.x + LD.w - 44, Math.max(LD.x + 44, hx)) - hx).toFixed(2));   // rides above the head, kept inside the bar
    const edge = 0.35;   // hours: lights switch quickly, not instantly
    const into = zt >= 12 ? Math.min(zt - 12, 24 - zt) : -Math.min(12 - zt, zt);
    const night = T < edge ? 0 : Math.min(1, Math.max(0, 0.5 + into / (2 * edge)));
    wash.setAttribute("opacity", night.toFixed(3));
  };

  function render() {
    if (phase === "g") {
      const t = clock();
      for (const l of lanes) {
        const st = walkAt(l.w, t, l.fly.stride, l.fly.frames);
        l.fly.place(l.x + st.x, l.groundY, st.face);
        l.fly.node.show(st.seq, st.frame);
        const dt = t - lastCrossing(l.w.crossings, t);
        setCount(l, crossingsBy(l.w, t));
        flash(l, dt);
        pulse(l, dt);
      }
      setCaption(tlG.time() >= 0.8 ? "g" : "");
      return;
    }
    const tH = endedAt != null && frozen == null && !still ? H_END + (performance.now() - endedAt) / 1000 : tlH.time();
    for (const l of lanes) {
      let st;
      if (tH < DAYS_END) st = lapseAt(l.lapse, tH, l.fly.stride);
      else {
        const end = lapseAt(l.lapse, DAYS_END, l.fly.stride);
        const g = still ? null : l.rest.find(([a, b]) => tH >= a && tH < b);
        const [seq, frame] = g ? groomFrame(l.fly.frames, g[0], g[1], tH) : ["stand", 0];
        st = { x: end.x, face: end.face, seq, frame };
      }
      l.fly.place(l.x + st.x, l.groundY, st.face);
      l.fly.node.show(st.seq, st.frame);
      const dt = tH < DAYS_END ? tH - lastCrossing(l.lapse.crossings, tH) : 9;
      setCount(l, l.base + countAt(l, Math.min(tH, DAYS_END)));
      flash(l, dt);
      pulse(l, 9);
      drawBars(l, tH);
    }
    drawClock(tH);
    setCaption(tH < DAY_S ? "h1" : tH < 3 * DAY_S ? "h2" : "i");
  }

  gsap.ticker.add(render);

  if (handRect && !still && frozen == null) growFrom(gsap, stage, handRect);
  if (frozen != null) {
    btn.skip.hidden = true;
    if (frozen < G_END) tlG.pause(frozen);
    else { tlG.progress(1); startDays(G_END); tlH.pause(frozen - G_END); btn.skip.hidden = true; }
  } else if (still) {
    tlG.progress(1);
  } else {
    startBoil();
    tlG.play(0);
  }
  render();
  // the descent (step 2) starts from the WT fly where it stands now
  root.querySelector(".assay__controls a.btn").addEventListener("click", () => handOff("fly", lanes[0].fly.g));
  window.__assay = { tlG, tlH, clock, lanes };   // for review tooling

  return () => {
    gsap.ticker.remove(render);
    tlG.kill();
    tlH.kill();
    if (!still && frozen == null) stopBoil();
    delete window.__assay;
  };
}
