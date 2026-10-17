// Step 4: TDP-43 and its targets (docs/storyboards/targets-step.md, "Redesign"). A timed journey in
// the step 2 descent's language: lines draw on, molecules and labels gather one at a time, and a
// camera (the SVG viewBox, storycam.js) follows one target mRNA through a fly neuron. It ends on
// the labelled drawing mrnalife.js makes, then the case's target and the question the hypotheses
// answer.
//
// Everything on the stage is a function of story time t: render() reads the clock (a paused GSAP
// timeline that only keeps time) and sets each part from the times below, so frozen frames
// (`?t=7.6`), Skip, Replay and seeking always agree. Times are written from the start of their shot
// (SHOT), so a shot can be lengthened without touching the others. No SVG filter runs while the
// camera moves: the ink filter and the rim come on at the still (H), and the ink boils only once
// the end frame is reached in live play. Reduced motion shows the end frame, which equals ?t=54.6.
//
//   A  0–6.5    the close-up fills the stage: two TDP-43 clasp the UG run; others drift past
//   B  6.5–12.5 it shrinks into its box; the neuron grows out from its cell body; compartments named
//   C 12.5–20.5 the nucleus: chromatin gathers, TDP-43 comes in through the pores; splicing
//   D 20.5–27   the pore: the finished mRNA leaves the nucleus
//   E 27–34.5   the cell body: translation; an older copy is broken down; TDP-43 on both
//   F 34.5–48   a transport granule forms; the camera follows it down the axon; local translation
//   G 48–53     back to the whole neuron; its labels arrive one by one; the close-up returns
//   H 53–54.6   the ink and the rim; the target, then the question
// While a station is held for reading, the camera drifts slowly in, so the frame never goes dead.

import { href } from "../router.js";
import { loadGsap, reducedMotion } from "../gsap.js";
import { ensureBoilFilter, startBoil, stopBoil } from "../fly.js";
import { rollCaption } from "../caption.js";
import { term } from "../glossary.js";
import { caseProse, question } from "../content.js";
import { mulberry32 } from "../prng.js";
import { lifeSVG, granuleAt, swellingAt, motorD, intronAt } from "../mrnalife.js";
import { clamp01, ease, ramp, win, camTrack, applyCam, screenMap, pointer } from "../storycam.js";

const SHOT = { A: 0, B: 6.5, C: 12.5, D: 20.5, E: 27, F: 34.5, G: 48, H: 53 };
const { A, B, C, D, E, F, G, H } = SHOT;
const END = H + 1.6, STILL = H;
const { lin, io1, io2, out2, smoother } = ease;

// One line each at the stage's width; trusted constants (caption.js), so they can hold terms.
const CAPTIONS = {
  c1: `TDP-43 is an ${term("rbp", "RNA-binding protein")}. It binds RNAs with UG-rich sequences: its targets.`,
  c2: "In the nucleus, splicing removes a target’s introns. One gene can make several isoforms.",
  c3: "The finished mRNA leaves the nucleus through a nuclear pore.",
  c4: "In the cytoplasm, it is translated into protein and, in the end, broken down.",
  c5: `Neurons send many mRNAs down the axon in ${term("granule", "granules")}, to make protein where it is needed.`,
  c6: `Each step is a mode of ${term("ptr", "post-transcriptional regulation")}. TDP-43 takes part in many.`,
};
const CAPTION_AT = [[A + 0.3, "c1"], [C, "c2"], [D, "c3"], [E, "c4"], [F, "c5"], [G, "c6"]];

// ---------- the camera: stops are [centre x, centre y, height] in the drawing's units ----------
const REST = { stop: [492, 141, 270], viewBox: "0 6 984 270", aspect: 984 / 270 };   // the end frame
const STOP = { nucleus: [240, 157, 132], pore: [210, 162, 96], soma: [222, 208, 122], terminal: [800, 158, 150] };
const drift = ([x, y, h]) => [x, y, h * 0.95];          // a slow push in while a station is read
const LEAD = 30;                                        // the camera runs this far ahead of the granule
const granS = t => ramp(t, F + 3.6, 3.0, io2);          // the granule's journey, 0..1 (granuleAt)
const track = t => [granuleAt(granS(t)).x + LEAD, 150, 110];
const NEURITE = track(0), AXON_END = track(END);
const camAt = camTrack(REST.stop, [
  [C, C + 1.8, REST.stop, STOP.nucleus, io2],
  [C + 1.8, D, STOP.nucleus, drift(STOP.nucleus), lin],
  [D, D + 1.6, drift(STOP.nucleus), STOP.pore, io2],
  [D + 1.6, E, STOP.pore, drift(STOP.pore), lin],
  [E, E + 1.6, drift(STOP.pore), STOP.soma, io2],
  [E + 1.6, F, STOP.soma, drift(STOP.soma), lin],
  [F, F + 1.6, drift(STOP.soma), NEURITE, io2],         // the neurite, where the granule forms
  [F + 3.6, F + 6.6, track, track],                     // following it down the axon
  [F + 6.6, F + 8.8, AXON_END, drift(AXON_END), lin],
  [F + 8.8, F + 10.4, drift(AXON_END), STOP.terminal, io2],
  [F + 10.4, G, STOP.terminal, drift(STOP.terminal), lin],
  [G, G + 1.8, drift(STOP.terminal), REST.stop, io2],
]);

// ---------- A: the close-up fills the stage (ZOOM times its size, centred), then shrinks into its box ----------
const ZOOM = 2.4, BOX_C = [466, 54], STAGE_C = [492, 141];
// the two that bind: start [x, y, angle], the point their path bends towards, their place on the UG run
const BIND = [{ from: [452, 25, -14], via: [485, 19], on: [499, 36.6], at: A + 0.8 }, { from: [574, 22, 16], via: [550, 17], on: [533, 36.6], at: A + 1.1 }];
// the rest drift past the non-target RNA without binding and leave: [x, y, angle], drift over 6 s, fade-out time
const DRIFT = [{ at: [392, 60, 24], by: [24, 4], out: A + 2.6 }, { at: [470, 63, -8], by: [26, 1], out: A + 3.0 },
  { at: [574, 83, 14], by: [-8, 3], out: A + 3.4 }, { at: [430, 84, -16], by: [14, -3], out: A + 3.8 }];

// ---------- B: the neuron grows out from its cell body; the outline leads, the wash follows ----------
const SOMA_C = [176, 160], GROW = { at: B + 0.5, dur: 3.6, r: 830, lag: 30 };

// ---------- C: TDP-43 comes into the nucleus through its pores (0° faces the neurite) ----------
const NUC = [170, 160];
const IMPORT = [[232, 0.6], [0, 0.85], [0, 1.1], [118, 1.35], [0, 1.6], [118, 1.85], [0, 2.1]];   // [pore, start in C]
const SP_IMPORT = 232;                                  // the pore the intron's TDP-43 comes through
// TDP-43 in the cytoplasm: on the mRNA being translated and the copy being broken down (they land on
// their RNA, E), in the axon and in a terminal (they drift in, F)
const CYTO = [{ land: E + 1.7 }, { land: E + 2.1 }, { gather: F + 5.4, from: [-10, -7] }, { gather: F + 9.8, from: [-8, 6] }];

// ---------- labels on the journey, in screen space: anchor and label point in drawing units; each
// stays until the camera moves on, before the next arrives ----------
const GRAN_END = granuleAt(1);
const JOURNEY = [
  { text: "splicing", at: [164, 117], pt: [118, 106], side: "left", in: C + 5.0, out: D },
  { text: "nuclear export", at: [258, 162], pt: [272, 188], side: "right", in: D + 4.0, out: E },
  { text: "translation", at: [252, 222], pt: [262, 244], side: "right", in: E + 3.4, out: F },
  { text: "decay", at: [112, 214], pt: [100, 238], side: "left", in: E + 5.5, out: F },
  { text: "RNA transport granule", follow: true, side: "above", in: F + 2.6, out: F + 8.6 },
  { text: "transport", pt: [GRAN_END.x + 57, GRAN_END.mt + 22], side: "right", in: F + 6.8, out: F + 8.6 },
  { text: "local translation", at: [930, 166], pt: [944, 190], side: "right", in: F + 11.4, out: G },
];

// ---------- G: the end frame's labels arrive one at a time, in the journey's order, then the compartments ----------
const CALL_AT = G + 2.0, CALL_STEP = 0.2;
const CALLOUTS = [".lab-splice", ".lab-export", ".lab-transl", ".lab-decay", ".gr-label", ".lab-transport", ".lab-local"];

const num = v => String(Math.round(v * 100) / 100);
const bez2 = (a, b, c, t) => { const u = 1 - t; return [0, 1].map(k => u * u * a[k] + 2 * u * t * b[k] + t * t * c[k]); };
const bez3 = ([a, b, c, d], t) => { const u = 1 - t; return [0, 1].map(k => u ** 3 * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t ** 3 * d[k]); };
// a path into the nucleus through the pore at `deg`, ending at `end`
const viaPore = (deg, end) => {
  const ux = Math.cos(deg * Math.PI / 180), uy = Math.sin(deg * Math.PI / 180);
  return [[NUC[0] + 76 * ux, NUC[1] + 76 * uy], [NUC[0] + 48 * ux, NUC[1] + 48 * uy], end, end];
};

export async function mount(root, ctx) {
  const c = ctx.case;
  root.innerHTML = `
    <div class="story">
      <p class="t-label story__eyebrow">${ctx.stage} · Step 4</p>
      <h1 class="t-h1">TDP-43 and its targets</h1>
      <div class="stage stage--life">
        <div class="life-frame" style="visibility: hidden">
          ${lifeSVG({ prefix: "life" }).markup}
          <div class="life-labels" aria-hidden="true">
            <svg class="life-leads">${JOURNEY.map(() => `<g class="jl-g"><path class="jl-lead"/><circle class="jl-dot" r="0"/></g>`).join("")}</svg>
            ${JOURNEY.map(j => `<span class="jl">${j.text}</span>`).join("")}
          </div>
        </div>
        <p class="life-note">Also: one gene’s isoforms, or one RNA in different cell types, can be regulated differently.</p>
        <span class="tag-sim life-tag">Schematic</span>
      </div>
      <p class="assay__caption" aria-live="polite"></p>
      <div class="tq">
        <section class="tq__target" aria-labelledby="tq-target">
          <h2 class="t-h3 tq__head tq__name" id="tq-target">Your target: ${caseProse(c, c.target.gene)} mRNA</h2>
          <p class="tq__text">${caseProse(c, c.target.about)}</p>
        </section>
        <section class="tq__ask" aria-labelledby="tq-q">
          <h2 class="t-h3 tq__head" id="tq-q">Your question</h2>
          <p class="tq__qtext">${question(c)}</p>
        </section>
      </div>
      <div class="assay__controls">
        <a class="btn btn--primary btn--lg" href="${href(ctx.caseId, 5)}">Next: hypotheses</a>
        <button class="btn" type="button" data-act="skip">Skip animation</button>
        <button class="btn" type="button" data-act="replay" hidden>Replay animation</button>
      </div>
    </div>`;

  ensureBoilFilter();
  const gsap = await loadGsap();
  const P = new URLSearchParams(location.search);
  const frozen = P.has("t") ? Number(P.get("t")) : null;
  const still = reducedMotion();
  const live = frozen == null && !still;
  const frame = root.querySelector(".life-frame"), svg = frame.querySelector(".life");
  svg.setAttribute("width", 984);   // its shape comes from these, not from the moving viewBox
  svg.setAttribute("height", 270);
  const one = s => svg.querySelector(s);
  const all = s => [...svg.querySelectorAll(s)];
  const btn = { skip: root.querySelector("[data-act=skip]"), replay: root.querySelector("[data-act=replay]") };

  // ---------- writing to the page: only what changed, so the held end frame costs nothing ----------
  const seen = new WeakMap();
  const memo = el => { let m = seen.get(el); if (!m) seen.set(el, m = {}); return m; };
  const attr = (el, name, v) => {
    const m = memo(el);
    if (m[name] === v) return;
    m[name] = v;
    if (v == null) el.removeAttribute(name); else el.setAttribute(name, v);
  };
  const css = (el, prop, v) => {
    const m = memo(el), k = `style:${prop}`;
    if (m[k] === v) return;
    m[k] = v;
    el.style.setProperty(prop, v);
  };
  const own = new WeakMap();   // the opacity a part has in the end frame
  const ownOp = el => { if (!own.has(el)) own.set(el, +(el.getAttribute("opacity") ?? 1)); return own.get(el); };
  // v of the way to its end-frame opacity
  const show = (el, v) => {
    css(el, "visibility", v > 0 ? "" : "hidden");
    css(el, "opacity", v > 0 && v < 1 ? (v * ownOp(el)).toFixed(3) : "");
  };
  // a line drawn p of its length from its start (`both`: from its start and its end at once, which
  // for a branch's closed outline means out along both sides from its base)
  const lengths = new WeakMap();
  const len = el => { if (!lengths.has(el)) lengths.set(el, el.getTotalLength()); return lengths.get(el); };
  const draw = (el, p, both = false) => {
    css(el, "visibility", p > 0 ? "" : "hidden");
    if (p <= 0) return;
    if (p >= 1) { css(el, "stroke-dasharray", ""); return; }
    const L = len(el), a = p * L;
    css(el, "stroke-dasharray", both ? `${num(a / 2)} ${num(L - a)} ${num(a / 2)}` : `${num(a)} ${num(L + 1)}`);
  };
  // a part placed by `translate(x,y) …`, so it can be moved and sent home
  const placed = el => {
    const tf = el.getAttribute("transform"), m = /^translate\(([-\d.]+)[ ,]([-\d.]+)\)(.*)$/.exec(tf || "");
    return { el, home: tf, x: m ? +m[1] : 0, y: m ? +m[2] : 0, rest: m ? m[3] : "" };
  };
  const moveTo = (pl, x, y) => attr(pl.el, "transform", `translate(${num(x)},${num(y)})${pl.rest}`);
  const goHome = pl => attr(pl.el, "transform", pl.home);

  // ---------- prepare: filters off until the still; the t = 0 geometry, measured ----------
  const filters = new Map(all("[filter]").map(el => [el, el.getAttribute("filter")]));
  filters.forEach((_, el) => el.removeAttribute("filter"));
  let stillOn = false;
  const setStill = on => {
    if (on === stillOn) return;
    stillOn = on;
    filters.forEach((f, el) => (on ? el.setAttribute("filter", f) : el.removeAttribute("filter")));
  };

  const intron = one(".sp-in"), intronHome = intron.getAttribute("d");
  intron.setAttribute("d", intronAt(0).d);
  const part = { hillock: one("[data-part=hillock]"), axon: one("[data-part=axon]") };
  const partHome = { hillock: part.hillock.getAttribute("d"), axon: part.axon.getAttribute("d") };
  const sw0 = swellingAt(0);
  part.hillock.setAttribute("d", sw0.hillock);
  part.axon.setAttribute("d", sw0.axon);

  // each closed shape of the cell, with how far from the cell body's centre it starts and ends
  const cell = all("#life-cell path").map(el => {
    const L = el.getTotalLength();
    let lo = Infinity, hi = 0;
    for (let i = 0; i <= 48; i++) {
      const q = el.getPointAtLength(L * i / 48), d = Math.hypot(q.x - SOMA_C[0], q.y - SOMA_C[1]);
      lo = Math.min(lo, d); hi = Math.max(hi, d);
    }
    return { el, lo, span: Math.max(hi - lo, 12) };
  });
  one("defs").insertAdjacentHTML("beforeend", `<clipPath id="life-grow"><circle cx="${SOMA_C[0]}" cy="${SOMA_C[1]}" r="0"/></clipPath>`);
  const growC = one("#life-grow circle"), fill = one(".life-fill"), rim = one(".life-rim");

  // strokes keep their end-frame width on screen while the camera is in close (--zw, storycam.js)
  const shadow = one(".life-shadow");
  for (const el of [shadow, one(".life-line"), one(".life-mt"), one(".nuc-env"), one(".tp-arrow"), ...all(".life-rna [stroke-width]")]) {
    el.style.strokeWidth = `calc(${el.getAttribute("stroke-width")}px * var(--zw, 1))`;
  }
  const ends5 = all(".sp > circle, .ex > circle, .dc > circle");   // the 5′ dots keep their size too

  // A
  const zoom = one(".life-zoom");
  zoom.querySelector(".seq").insertAdjacentHTML("beforebegin", DRIFT.map(() => `<use class="cu-free" href="#life-tdp"/>`).join(""));
  const binders = all(".cu-tdp").map(placed), drifters = all(".cu-free"), cuLabels = all(".cu-label");
  // B
  const arcs = all(".env-arc"), walls = one(".env-wall"), nucWash = one(".nuc-wash"), nucOl = one(".nuc-ol");
  const mt = all(".life-mt path"), cmp = all(".life-cmp text");
  // C: the chromatin gathers from seeded points further out
  const rnd = mulberry32(17);
  const stip = all(".nuc-stip circle").map(el => {
    const x = +el.getAttribute("cx"), y = +el.getAttribute("cy");
    const a = Math.atan2(y - NUC[1], x - NUC[0]) + (rnd() - 0.5) * 0.8, r = 10 + 14 * rnd();
    return { el, cx: el.getAttribute("cx"), cy: el.getAttribute("cy"), x, y, x0: x + r * Math.cos(a), y0: y + r * Math.sin(a), at: C + 0.3 + 1.4 * rnd() };
  });
  const imports = all(".ntdp use").map((el, i) => { const pl = placed(el); return { pl, at: C + IMPORT[i][1], path: viaPore(IMPORT[i][0], [pl.x, pl.y]) }; });
  const spTdp = placed(one(".sp-tdp")), it0 = intronAt(0).tdp;
  const spPath = viaPore(SP_IMPORT, [it0[0], it0[1] - 8]);
  const spDot = one(".sp > circle"), spEx = all(".sp-ex");
  const cyto = all(".ctdp use").map((el, i) => ({ pl: placed(el), ...CYTO[i] }));
  // D
  const ex = one(".ex"), exPath = one(".ex > path"), exDot = one(".ex > circle"), exTdp = placed(one(".ex-tdp"));
  // E: protein chains grow from the ribosome's exit (beads listed nearest the ribosome first)
  const chain = (sel, exit) => ({ exit, beads: all(sel).map(el => ({ el, cx: el.getAttribute("cx"), cy: el.getAttribute("cy"), xy: [+el.getAttribute("cx"), +el.getAttribute("cy")] })) });
  const tr = one(".tr"), trRs = one(".tr-rs"), trRl = one(".tr-rl"), trChain = chain(".tr-beads circle", [242.5, 210]);
  const dcDot = one(".dc > circle"), dcPath = one(".dc > path:not(.dc-tail)"), tail = one(".dc-tail");
  // the older copy's fragments break off as its far end is erased, each where the erasing passes it
  const shed = all(".dc-dots circle").map(el => {
    const x = +el.getAttribute("cx"), y = +el.getAttribute("cy");
    return { el, cx: el.getAttribute("cx"), cy: el.getAttribute("cy"), x, y, at: E + 4.6 + 1.2 * (1 - (x - 120) / 19.4) };
  });
  // F
  const gr = one(".gr"), grHome = gr.getAttribute("transform"), motor = one(".gr-motor"), motorHome = motor.getAttribute("d");
  const halo = one(".gr-halo"), trail = one(".gr-trail");
  const LOAD_FROM = [[-26, -12], [-22, 16], [18, -20], [24, 14]];   // two mRNAs, two TDP-43, gathering
  const load = all(".gr-load > *").map((el, i) => ({ pl: placed(el), from: LOAD_FROM[i], at: F + 1.0 + 0.3 * i }));
  const shaft = one(".tp-shaft"), head = one(".tp-head");
  const bt = one(".bt"), btTdp = placed(one(".bt-tdp")), btRs = one(".bt-rs"), btRl = one(".bt-rl"), btChain = chain(".bt-beads circle", [929.5, 136]);
  // G, H
  const callouts = CALLOUTS.map(sel => { const g = one(sel); return { text: g.matches("text") ? g : g.querySelector("text"), lead: g.querySelector(".lead"), dot: g.querySelector(".lead-dot") }; });
  const magC = one(".life-mag circle"), magL = all(".life-mag .lead");
  const note = root.querySelector(".life-note"), panels = [[root.querySelector(".tq__target"), H + 0.2], [root.querySelector(".tq__ask"), H + 0.7]];
  const jl = [...frame.querySelectorAll(".jl")], jg = [...frame.querySelectorAll(".jl-g")];

  // labels are sized from the stage's width: re-measured when it changes (the notebook drawer, a resize)
  let W = 0, sizes = [];
  const measure = () => {
    W = frame.clientWidth;
    frame.style.setProperty("--lw", (W / 984).toFixed(4));
    sizes = jl.map(l => [l.offsetWidth, l.offsetHeight]);
  };

  const sub = (el, t, at, dy) => {   // a ribosome subunit closing onto the mRNA from one side
    const p = ramp(t, at, 0.7, out2);
    attr(el, "transform", p >= 1 ? null : `translate(0 ${num(dy * (1 - p))})`);
    show(el, clamp01(p / 0.4));
  };
  // each new bead appears at the exit and pushes the earlier ones out, so the first one made ends farthest
  const extrude = ({ exit, beads }, t, at, step) => {
    const n = beads.length, pts = [exit, ...beads.map(b => b.xy)];
    const raw = clamp01((t - at) / (n * step)) * n, c = Math.floor(raw) + io1(raw - Math.floor(raw));
    beads.forEach((b, i) => {
      const u = Math.min(c - (n - 1 - i), i + 1);
      show(b.el, clamp01(u / 0.6));
      if (u >= i + 1 || u <= 0) { attr(b.el, "cx", b.cx); attr(b.el, "cy", b.cy); return; }
      const j = Math.floor(u), f = u - j;
      attr(b.el, "cx", num(pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f));
      attr(b.el, "cy", num(pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f));
    });
  };
  const land = (pl, t, at) => {   // a TDP-43 settling onto its RNA from just above
    const p = ramp(t, at, 0.6, io1);
    if (p >= 1) goHome(pl); else moveTo(pl, pl.x, pl.y - 8 * (1 - p));
    show(pl.el, ramp(t, at, 0.4));
  };
  const gather = (pl, t, at, [dx, dy]) => {   // a molecule drifting into place
    const p = ramp(t, at, 0.9, out2);
    if (p >= 1) goHome(pl); else moveTo(pl, pl.x + dx * (1 - p), pl.y + dy * (1 - p));
    show(pl.el, clamp01(p / 0.5));
  };

  // ---------- every frame: the stage at story time t ----------
  const clock = gsap.timeline({ paused: true }).to({}, { duration: END });
  const setCaption = rollCaption(gsap, root.querySelector(".assay__caption"), CAPTIONS, Object.keys(CAPTIONS), live);
  let boiling = false, lastS = null;

  function render() {
    const t = Math.min(Math.max(clock.time(), 0), END);
    const cam = camAt(t), rest = applyCam(svg, cam, REST), zw = cam.h / REST.stop[2];
    attr(shadow, "transform", rest ? "translate(.7,.9)" : `translate(${num(0.7 * zw)},${num(0.9 * zw)})`);
    ends5.forEach(d => attr(d, "r", rest ? "1.8" : num(1.8 * zw)));
    setStill(t >= STILL);

    // A: two TDP-43 travel to the UG run and close their lobes on it; the others pass the non-target RNA by
    const z = ramp(t, B, 1.4, smoother), k = ZOOM + (1 - ZOOM) * z;
    attr(zoom, "transform", z >= 1 ? null : `translate(${num(STAGE_C[0] + (BOX_C[0] - STAGE_C[0]) * z)} ${num(STAGE_C[1] + (BOX_C[1] - STAGE_C[1]) * z)}) scale(${num(k)}) translate(${-BOX_C[0]} ${-BOX_C[1]})`);
    show(zoom, Math.max(win(t, -1, 0, B + 5.5, B + 5.9), ramp(t, G + 3.0, 0.6)));
    binders.forEach((b, i) => {
      const m = BIND[i], p = ramp(t, m.at, 2.4, io1);
      if (p >= 1) goHome(b);
      else { const [x, y] = bez2(m.from, m.via, m.on, p); attr(b.el, "transform", `translate(${num(x)},${num(y)}) rotate(${num(m.from[2] * (1 - p))})`); }
      const a = 22 * (1 - ramp(t, m.at + 2.4, 0.6, io2));   // the lobes open like tongs, hinged above the RNA
      attr(b.el.firstElementChild, "transform", a > 0 ? `rotate(${num(a)} 1.75 -3)` : null);
      attr(b.el.lastElementChild, "transform", a > 0 ? `rotate(${num(-a)} 1.75 -3)` : null);
    });
    drifters.forEach((el, i) => {
      const m = DRIFT[i], u = clamp01((t - A) / 6);
      attr(el, "transform", `translate(${num(m.at[0] + m.by[0] * u)},${num(m.at[1] + m.by[1] * u)}) rotate(${m.at[2]}) scale(.9)`);
      show(el, 1 - ramp(t, m.out, 0.8));
    });
    cuLabels.forEach((el, i) => show(el, ramp(t, A + 4.2 + 0.6 * i, 0.5)));

    // B: the outline draws out from the cell body behind a widening front; the wash fills in behind it
    const r = GROW.r * io1(clamp01((t - GROW.at) / GROW.dur));
    cell.forEach((s, i) => draw(s.el, i === 0 ? ramp(t, GROW.at, 1.0, io1) : clamp01((r - s.lo) / s.span), true));
    const rw = r - GROW.lag;
    attr(fill, "clip-path", rw >= GROW.r - GROW.lag ? null : "url(#life-grow)");
    attr(growC, "r", num(Math.max(0, rw)));
    show(rim, ramp(t, STILL, 0.8));
    arcs.forEach(a => draw(a, ramp(t, B + 1.0, 1.2, io1)));
    show(walls, ramp(t, B + 1.8, 0.5));
    show(nucWash, ramp(t, B + 0.7, 0.8));
    show(nucOl, ramp(t, B + 1.0, 0.7));
    mt.forEach((m, i) => draw(m, ramp(t, (i < 3 ? B + 2.4 : B + 2.9) + 0.1 * (i % 3), 1.6, io1)));
    cmp.forEach((el, i) => show(el, Math.max(win(t, B + 3.6 + 0.4 * i, B + 4.0 + 0.4 * i, B + 5.5, B + 5.9), ramp(t, CALL_AT + (CALLOUTS.length + i) * CALL_STEP, 0.4))));

    // C: chromatin gathers; TDP-43 comes in through the pores; the pre-mRNA draws 5′ → 3′, one TDP-43
    // lands on its intron and rides it as it loops out
    stip.forEach(s => {
      const p = ramp(t, s.at, 1.2, out2);
      show(s.el, clamp01(p / 0.4));
      attr(s.el, "cx", p >= 1 || p <= 0 ? s.cx : num(s.x0 + (s.x - s.x0) * p));
      attr(s.el, "cy", p >= 1 || p <= 0 ? s.cy : num(s.y0 + (s.y - s.y0) * p));
    });
    imports.forEach(m => {
      const p = ramp(t, m.at, 1.6, io1);
      if (p >= 1) goHome(m.pl); else moveTo(m.pl, ...bez3(m.path, p));
      show(m.pl.el, clamp01(p / 0.25));
    });
    show(spDot, ramp(t, C + 2.4, 0.2));
    draw(spEx[0], ramp(t, C + 2.4, 0.4));
    draw(intron, ramp(t, C + 2.8, 0.5));
    draw(spEx[1], ramp(t, C + 3.3, 0.3));
    const spIn = ramp(t, C + 1.0, 1.6, io1), landK = ramp(t, C + 3.7, 0.6, io1), loop = ramp(t, C + 4.5, 1.2, io1);
    const it = intronAt(loop);
    attr(intron, "d", loop >= 1 ? intronHome : it.d);
    if (spIn < 1) moveTo(spTdp, ...bez3(spPath, spIn));
    else if (loop >= 1) goHome(spTdp);
    else moveTo(spTdp, it.tdp[0], it.tdp[1] - 8 * (1 - landK));
    show(spTdp.el, clamp01(spIn / 0.25));

    // D: the finished mRNA, with its TDP-43, lines up with the pore and leaves through it
    const exit = ramp(t, D + 2.6, 1.8, io1), dx = -54 * (1 - exit), dy = 6 * (1 - ramp(t, D + 2.2, 0.7, io1));
    attr(ex, "transform", exit >= 1 ? null : `translate(${num(dx)} ${num(dy)})`);
    show(exDot, ramp(t, D + 1.0, 0.2));
    draw(exPath, ramp(t, D + 1.0, 0.6));
    const exK = ramp(t, D + 1.5, 0.6, io1);
    if (exit >= 1) goHome(exTdp); else moveTo(exTdp, exTdp.x + dx, exTdp.y + dy - 8 * (1 - exK));
    show(exTdp.el, ramp(t, D + 1.5, 0.4));

    // E: a ribosome closes on an mRNA and protein grows from it; an older copy shortens from its far
    // end; TDP-43 sits on both
    draw(tr, ramp(t, E + 1.0, 0.6));
    sub(trRs, t, E + 2.2, 11);
    sub(trRl, t, E + 2.4, -11);
    extrude(trChain, t, E + 3.0, 0.4);
    show(dcDot, ramp(t, E + 1.2, 0.2));
    draw(dcPath, ramp(t, E + 1.2, 0.6));
    const tIn = ramp(t, E + 1.8, 0.3), tOut = ramp(t, E + 4.6, 1.2);
    if (tIn > 0 && tOut < 1) { css(tail, "opacity", "1"); draw(tail, tIn * (1 - tOut)); }
    else { css(tail, "opacity", ""); draw(tail, 1); }   // gone in the end frame (opacity 0)
    shed.forEach(s => {
      const p = ramp(t, s.at, 0.8, out2);
      css(s.el, "visibility", t >= s.at ? "" : "hidden");
      css(s.el, "opacity", p >= 1 || t < s.at ? "" : (1 + (ownOp(s.el) - 1) * p).toFixed(3));
      attr(s.el, "cx", p >= 1 ? s.cx : num(s.x - 2.3 * (1 - p)));
      attr(s.el, "cy", p >= 1 ? s.cy : num(s.y - 0.9 * (1 - p)));
    });
    cyto.forEach(m => (m.land != null ? land(m.pl, t, m.land) : gather(m.pl, t, m.gather, m.from)));

    // F: two mRNAs and two TDP-43 gather into a granule; a motor walks it down the axon, which
    // swells round it; in a terminal, a ribosome makes protein
    load.forEach(m => {
      const p = ramp(t, m.at, 1.0, out2);
      if (p >= 1) goHome(m.pl); else moveTo(m.pl, m.pl.x + m.from[0] * (1 - p), m.pl.y + m.from[1] * (1 - p));
      show(m.pl.el, clamp01(p / 0.4));
    });
    const hp = ramp(t, F + 2.0, 0.8, out2);
    attr(halo, "transform", hp >= 1 ? null : `scale(${num(0.4 + 0.6 * hp)})`);
    show(halo, hp);
    show(motor, ramp(t, F + 3.0, 0.4));
    show(trail, ramp(t, F + 3.8, 0.4));
    const s = granS(t);
    if (s !== lastS) {
      lastS = s;
      if (s >= 1) {
        attr(gr, "transform", grHome); attr(motor, "d", motorHome);
        attr(part.hillock, "d", partHome.hillock); attr(part.axon, "d", partHome.axon);
      } else {
        const g = granuleAt(s), sw = swellingAt(s);
        attr(gr, "transform", `translate(${num(g.x)},${num(g.y)})`);
        attr(motor, "d", motorD(g.y, g.mt, g.dist));
        attr(part.hillock, "d", sw.hillock); attr(part.axon, "d", sw.axon);
      }
    }
    draw(shaft, ramp(t, F + 6.2, 0.8));
    draw(head, ramp(t, F + 7.0, 0.3));
    draw(bt, ramp(t, F + 9.8, 0.5));
    land(btTdp, t, F + 10.2);
    sub(btRs, t, F + 10.6, 12);
    sub(btRl, t, F + 10.8, -12);
    extrude(btChain, t, F + 11.4, 0.35);

    // G: the end frame's labels, each leader drawing to its dot; the close-up and its magnifier; the note
    callouts.forEach((co, i) => {
      const at = CALL_AT + i * CALL_STEP;
      show(co.text, ramp(t, at, 0.4));
      if (!co.lead) return;
      const kk = ramp(t, at + 0.05, 0.45, out2);
      draw(co.lead, kk);
      attr(co.dot, "r", kk >= 1 ? "1.5" : num(1.5 * clamp01((kk - 0.7) / 0.3)));
    });
    show(magC, ramp(t, G + 3.4, 0.4));
    magL.forEach(l => draw(l, ramp(t, G + 3.5, 0.5)));
    show(note, ramp(t, G + 4.0, 0.6));

    // H: the target, then the question
    panels.forEach(([el, at]) => {
      const p = ramp(t, at, 0.5, out2);
      show(el, p);
      css(el, "transform", p > 0 && p < 1 ? `translateY(${num(6 * (1 - p))}px)` : "");
    });

    // the journey's labels, in screen space
    const toScreen = screenMap(cam, W, REST.aspect);
    JOURNEY.forEach((j, i) => {
      const v = win(t, j.in, j.in + 0.4, j.out, j.out + 0.3);
      show(jl[i], v);
      show(jg[i], v);
      if (v <= 0) return;
      let pt = j.pt, nudge = 0;
      if (j.follow) { const g = granuleAt(granS(t)); pt = [g.x, g.y - 10.5]; nudge = -10; }
      const [x, y] = toScreen(pt);
      const o = pointer(sizes[i], j.side, [x, y + nudge], j.at && toScreen(j.at), ramp(t, j.in + 0.15, 0.5, out2), 1.5 * W / 984);
      css(jl[i], "transform", o.transform);
      const [lead, dot] = jg[i].children;
      attr(lead, "d", o.d || null);
      if (o.at) { attr(dot, "cx", o.at[0].toFixed(1)); attr(dot, "cy", o.at[1].toFixed(1)); }
      attr(dot, "r", num(o.dot));
    });

    let key = "";
    for (const [at, id] of CAPTION_AT) if (t >= at) key = id;
    setCaption(key);

    if (live && (t >= END) !== boiling) {   // the ink boils on the held end frame only
      boiling = !boiling;
      if (boiling) startBoil(); else stopBoil();
    }
  }

  // ---------- controls ----------
  const ended = () => { btn.skip.hidden = true; btn.replay.hidden = !live; };
  clock.eventCallback("onComplete", ended);
  btn.skip.addEventListener("click", () => { clock.progress(1); render(); ended(); btn.replay.focus(); });
  btn.replay.addEventListener("click", () => { btn.replay.hidden = true; btn.skip.hidden = false; clock.restart(); btn.skip.focus(); });

  measure();
  const ro = new ResizeObserver(() => { measure(); render(); });
  ro.observe(frame);
  document.fonts?.ready.then(() => { measure(); render(); });
  gsap.ticker.add(render);
  if (frozen != null) { clock.pause(Math.min(Math.max(frozen, 0), END)); ended(); }
  else if (still) { clock.progress(1); ended(); }
  else clock.play(0);
  render();
  frame.style.visibility = "";
  window.__life = { clock, camAt, render };   // for review tooling

  return () => {
    gsap.ticker.remove(render);
    ro.disconnect();
    clock.kill();
    if (boiling) stopBoil();
    delete window.__life;
  };
}
