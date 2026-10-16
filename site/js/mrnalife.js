// The life of a target mRNA in a fly neuron (step 4, and the small copy beside the hypotheses): a
// unipolar neuron drawn like a Cajal ink plate, with TDP-43 at each station (splicing, nuclear
// export, translation, decay, RNA transport granule, transport, local translation) and a close-up of TDP-43
// on a UG run. Ported from docs/mockups/step4-targets-neuron.py, so the markup as written is the
// approved end frame (docs/storyboards/targets-step.md); step 4 animates it from there.
//
// Ink outlines (the neuron, the nuclear envelope, the RNA strands) take the ink-boil filter from
// fly.js; molecules and text are never filtered. Ids are prefixed, so two copies can share a page.
// Classes name the parts step 4 builds up (its journey ends on exactly this markup).

import { mulberry32 } from "./prng.js";

const F = v => String(Math.round(v * 10) / 10);

function bez(c, t) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = c, u = 1 - t;
  return [u ** 3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3,
    u ** 3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3];
}

function dbez(c, t) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = c, u = 1 - t;
  const dx = 3 * u * u * (x1 - x0) + 6 * u * t * (x2 - x1) + 3 * t * t * (x3 - x2);
  const dy = 3 * u * u * (y1 - y0) + 6 * u * t * (y2 - y1) + 3 * t * t * (y3 - y2);
  const n = Math.hypot(dx, dy) || 1;
  return [dx / n, dy / n];
}

const lineC = (a, b) => [a, [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3], [a[0] + 2 * (b[0] - a[0]) / 3, a[1] + 2 * (b[1] - a[1]) / 3], b];
const poly = pts => "M" + pts.map(([x, y]) => `${F(x)},${F(y)}`).join(" L");
const circleD = (cx, cy, r) => `M${F(cx - r)},${F(cy)} a${F(r)},${F(r)} 0 1 0 ${F(2 * r)},0 a${F(r)},${F(r)} 0 1 0 ${F(-2 * r)},0 Z`;
const clen = c => { let L = 0, p = bez(c, 0); for (let i = 1; i <= 20; i++) { const q = bez(c, i / 20); L += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; } return L; };

// The base radius of a tapered branch at t, then its closed outline with a round tip. `bumps` are
// [t, amplitude, width] swellings.
const radius = (r0, r1, ease, t) => r1 + (r0 - r1) * (1 - t) ** ease;
function tube(c, r0, r1, { n = 60, ease = 1, bumps = [] } = {}) {
  const samples = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, [x, y] = bez(c, t), [tx, ty] = dbez(c, t);
    let r = radius(r0, r1, ease, t);
    for (const [tc, amp, w] of bumps) r += amp * Math.exp(-(((t - tc) / w) ** 2));
    samples.push([x, y, tx, ty, r]);
  }
  return outline(samples);
}

// The closed outline round a centreline sampled as [x, y, unit tangent x, y, radius], with a round tip
function outline(samples) {
  const left = [], right = [], cap = [];
  for (const [x, y, tx, ty, r] of samples) {
    const nx = -ty, ny = tx;
    left.push([x + nx * r, y + ny * r]);
    right.push([x - nx * r, y - ny * r]);
  }
  const [x, y, tx, ty, r] = samples[samples.length - 1], nx = -ty, ny = tx;
  for (let k = 1; k < 10; k++) {
    const a = k * Math.PI / 10;
    cap.push([x + r * (nx * Math.cos(a) + tx * Math.sin(a)), y + r * (ny * Math.cos(a) + ty * Math.sin(a))]);
  }
  return poly([...left, ...cap, ...right.reverse()]) + " Z";
}

function offsetCurve(c, k, t0, t1, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + (t1 - t0) * i / n, [x, y] = bez(c, t), [tx, ty] = dbez(c, t);
    pts.push([x - ty * k, y + tx * k]);
  }
  return pts;
}

// ---------- geometry (as in the mock-up script) ----------

const SOMA = [176, 160, 108];                           // cx, cy, r
const NUC = [170, 160, 58];
const HILLOCK = lineC([236, 160], [424, 157]);
const AXON = [[410, 157], [530, 147], [660, 165], [806, 150]];
const GRAN_T = 0.52;                                    // the granule's place along the axon
const HILLOCK_TUBE = [36, 10.5, 2.4];                   // r0, r1, ease
const AXON_TUBE = [10.5, 8.5, 1];
const SWELL = 9, SWELL_W = 0.045;                       // the axon swells round the granule
const NEED = radius(...AXON_TUBE, GRAN_T) + SWELL;      // the radius the granule needs

// Every closed shape of the cell, with the x it starts at (the outline draws on from left to right).
function cellShapes() {
  const shapes = [{ d: circleD(...SOMA), x0: SOMA[0] - SOMA[2] }];
  shapes.push({ d: tube(HILLOCK, HILLOCK_TUBE[0], HILLOCK_TUBE[1], { ease: HILLOCK_TUBE[2] }), x0: 236, part: "hillock" });
  shapes.push({ d: tube(AXON, AXON_TUBE[0], AXON_TUBE[1], { bumps: [[GRAN_T, SWELL, SWELL_W]] }), x0: 410, part: "axon" });

  // the terminal arbor: beaded branches ending in boutons
  const T1 = [[804, 147], [834, 128], [862, 96], [896, 76]];
  const T2 = [[806, 150], [846, 151], [880, 146], [910, 142]];
  const T3 = [[804, 153], [834, 172], [860, 204], [892, 226]];
  const tw = [[T1, 0.56, [936, 104]], [T3, 0.62, [920, 250]]].map(([base, t, end]) => {
    const p = bez(base, t);
    return [p, [(2 * p[0] + end[0]) / 3, (2 * p[1] + end[1]) / 3 - 2], [(p[0] + 2 * end[0]) / 3, (p[1] + 2 * end[1]) / 3], end];
  });
  for (const [c, r0, r1] of [[T1, 5.6, 3.4], [T2, 6.2, 5.2], [T3, 5.6, 3.4], [tw[0], 2.8, 2.1], [tw[1], 2.8, 2.1]]) {
    shapes.push({ d: tube(c, r0, r1, { n: 40 }), x0: c[0][0] });
  }
  for (const [[x, y], r] of [[bez(T1, 0.42), 6.6], [bez(T1, 1), 8.6], [bez(T3, 0.44), 6.6], [bez(T3, 1), 8.6],
    [bez(tw[0], 1), 6.2], [bez(tw[1], 1), 6.2], [[BIG[0], BIG[1]], BIG[2]]]) {
    shapes.push({ d: circleD(x, y, r), x0: x - r });
  }
  return shapes;
}
const BIG = [928, 141, 21];                             // the large bouton (local translation)

// microtubules: three fine lines down the neurite and axon, fanning into the cell body
const MT = [-4.6, 0, 4.6].map(k => {
  const pts = [...offsetCurve(HILLOCK, k * 1.3, 0.3, 1, 20).slice(0, -1), ...offsetCurve(AXON, k, 0.02, 1, 70)];
  pts.push([pts[pts.length - 1][0] + 14, pts[pts.length - 1][1] + k * 0.25]);
  return pts;
});
const FAN = [[[262, 166], [240, 206], [204, 230], [156, 232]], [[266, 170], [250, 214], [222, 240], [186, 248]],
  [[262, 154], [250, 140], [242, 130], [236, 122]]];
const LOWER_MT = MT[2];

function envelope(r, gaps, w = 5.5) {   // one arc per stretch between pores
  const [cx, cy] = NUC, out = [];
  gaps.forEach((g, i) => {
    const a0 = (g + w) * Math.PI / 180;
    const a1 = (gaps[(i + 1) % gaps.length] - w + (i + 1 === gaps.length ? 360 : 0)) * Math.PI / 180;
    const large = ((a1 - a0) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) > Math.PI ? 1 : 0;
    out.push(`M${F(cx + r * Math.cos(a0))},${F(cy + r * Math.sin(a0))} A${r},${r} 0 ${large} 1 ${F(cx + r * Math.cos(a1))},${F(cy + r * Math.sin(a1))}`);
  });
  return out;
}
const GAPS = [0, 118, 232];                             // the pores; 0° faces the neurite

function stipple() {
  const rnd = mulberry32(43), out = [];
  const keep = [[178, 116, 24], [214, 160, 16], [170, 203, 17], [146, 178, 13]];
  while (out.length < 70) {
    const a = rnd() * 2 * Math.PI, r = 50 * Math.sqrt(rnd());
    const x = NUC[0] + r * Math.cos(a), y = NUC[1] + r * Math.sin(a);
    if (keep.some(([kx, ky, kr]) => Math.hypot(x - kx, y - ky) < kr)) continue;
    out.push(`<circle cx="${F(x)}" cy="${F(y)}" r="${(0.5 + rnd() * 0.35).toFixed(2)}"/>`);
  }
  return out.join("");
}

// ---------- the granule's journey: from the neurite's start to its place in the axon ----------
// A polyline along the centreline (the neurite from x = 300, then the axon to GRAN_T), with the
// length at each point, so a position s in 0..1 moves at an even speed.

const PATH = (() => {
  const pts = [];
  const tEnd = (410 - 236) / 188;
  for (let i = 0; i <= 30; i++) pts.push(bez(HILLOCK, 0.34 + (tEnd - 0.34) * i / 30));
  for (let i = 1; i <= 60; i++) pts.push(bez(AXON, GRAN_T * i / 60));
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, len, total: len[len.length - 1] };
})();

const lerpY = (pts, x) => {
  let i = pts.findIndex(p => p[0] >= x);
  if (i <= 0) i = i < 0 ? pts.length - 1 : 1;
  const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
  return x1 === x0 ? y1 : y0 + (y1 - y0) * (x - x0) / (x1 - x0);
};

// Where the granule is at s (0: forming in the neurite; 1: its place in the end frame): its centre
// (5 above the centreline, as drawn), the distance travelled and the lower microtubule's y there.
export function granuleAt(s) {
  const d = Math.max(0, Math.min(1, s)) * PATH.total;
  let i = PATH.len.findIndex(L => L >= d);
  if (i <= 0) i = 1;
  const f = (d - PATH.len[i - 1]) / (PATH.len[i] - PATH.len[i - 1] || 1);
  const x = PATH.pts[i - 1][0] + (PATH.pts[i][0] - PATH.pts[i - 1][0]) * f;
  const y = PATH.pts[i - 1][1] + (PATH.pts[i][1] - PATH.pts[i - 1][1]) * f;
  return { x, y: y - 5, dist: d, mt: lerpY(LOWER_MT, x) };
}

// While the granule travels, the neurite and the axon are drawn as one tube (the neurite up to the
// axon's base, then the axon), so the swelling round the granule stays smooth as it crosses from
// one to the other; the axon's own outline is then empty. At s = 0 and s = 1 they are the end
// frame's two shapes (step 4 puts those back at the end).
const JOIN_T = (AXON[0][0] - HILLOCK[0][0]) / (HILLOCK[3][0] - HILLOCK[0][0]);   // the axon's base along the neurite
const LINE = (() => {
  const step = radius(...HILLOCK_TUBE, JOIN_T) - AXON_TUBE[0];   // eased out along the axon's start
  const pts = [];
  for (let i = 0; i <= 56; i++) { const t = JOIN_T * i / 56; pts.push([...bez(HILLOCK, t), ...dbez(HILLOCK, t), radius(...HILLOCK_TUBE, t)]); }
  for (let i = 1; i <= 60; i++) { const t = i / 60; pts.push([...bez(AXON, t), ...dbez(AXON, t), radius(...AXON_TUBE, t) + step * Math.max(0, 1 - t / 0.08)]); }
  let d = 0;
  return pts.map((p, i) => { if (i) d += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]); return [...p, d]; });
})();
// the swelling's width along the line: the end frame's (a width in t) at the granule's place
const SWELL_D = SWELL_W * Math.hypot(...[0, 1].map(k => bez(AXON, GRAN_T + 1e-3)[k] - bez(AXON, GRAN_T - 1e-3)[k])) / 2e-3;

export function swellingAt(s) {
  if (s <= 0) return { hillock: tube(HILLOCK, ...HILLOCK_TUBE.slice(0, 2), { ease: HILLOCK_TUBE[2] }), axon: tube(AXON, AXON_TUBE[0], AXON_TUBE[1]) };
  const { x } = granuleAt(s);
  const at = LINE.reduce((b, p) => (Math.abs(p[0] - x) < Math.abs(b[0] - x) ? p : b));
  const amp = NEED - at[4];
  return {
    hillock: outline(LINE.map(([px, py, tx, ty, r, d]) => [px, py, tx, ty, amp > 0 ? r + amp * Math.exp(-(((d - at[5]) / SWELL_D) ** 2)) : r])),
    axon: "M0,0",
  };
}

// The granule's motor, in the granule's own coordinates: a stalk to the lower microtubule and two
// feet on it, swinging as it walks (`dist` travelled; they stand as drawn at the end).
export function motorD(gy, mt, dist = PATH.total) {
  const m = mt - gy, sw = 1.4 * Math.sin((PATH.total - dist) / 5);
  return `M0,10.5 L0,${F(m - 2.6)} M-3,${F(m - 2.6)} L3,${F(m - 2.6)} M-3,${F(m - 2.6)} L${F(-4.6 - sw)},${F(m)} M3,${F(m - 2.6)} L${F(4.6 - sw)},${F(m)}`;
}

// The intron at k (0: straight between the exons; 1: looped out, as in the end frame) and where its
// TDP-43 rides.
export function intronAt(k) {
  const y1 = 130 - 24 * k, y2 = 130 - 26 * k;
  const c = [[161, 130], [161 + 11 * (1 - k), y1], [195 - 11 * (1 - k), y2], [195, 130]];
  const [x, y] = bez(c, 0.5);
  return { d: `M161,130 C${F(c[1][0])},${F(y1)} ${F(c[2][0])},${F(y2)} 195,130`, tdp: [x - 3, y - 2.85] };
}

// Which stations show each mode (the hypotheses light them). Isoform- and cell-type-specific
// regulation are not places; the step 4 side note covers them.
export const STATION_OF = {
  splicing: ["splice"],
  export: ["pore"],
  stability: ["decay"],
  translation: ["ribosome", "bouton"],
  transport: ["granule", "arrow"],
  granule: ["granule"],
};

const tdpDef = id => `
    <g id="${id}">
      <path d="M8.6,.4 c1.8,-2.6 3.6,2.6 5.4,0 s3.6,2.6 5.4,0" fill="none" stroke="var(--tdp)" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="-6.6" cy="-1.2" r="2.3" fill="var(--tdp)" stroke="var(--ink)" stroke-width=".55"/>
      <ellipse cx="-1.5" cy="0" rx="4" ry="3.6" fill="var(--tdp)" stroke="var(--ink)" stroke-width=".55"/>
      <ellipse cx="5" cy="0" rx="4" ry="3.6" fill="var(--tdp)" stroke="var(--ink)" stroke-width=".55"/>
    </g>`;

// TDP-43 drawn out in two halves, so its lobes can open and close round the RNA (the close-up)
const tdpHinged = (cls, x, y) => `
    <g class="${cls}" transform="translate(${x},${y})">
      <g class="lobe-a"><circle cx="-6.6" cy="-1.2" r="2.3" fill="var(--tdp)" stroke="var(--ink)" stroke-width=".55"/><ellipse cx="-1.5" cy="0" rx="4" ry="3.6" fill="var(--tdp)" stroke="var(--ink)" stroke-width=".55"/></g>
      <g class="lobe-b"><path d="M8.6,.4 c1.8,-2.6 3.6,2.6 5.4,0 s3.6,2.6 5.4,0" fill="none" stroke="var(--tdp)" stroke-width="1.4" stroke-linecap="round"/><ellipse cx="5" cy="0" rx="4" ry="3.6" fill="var(--tdp)" stroke="var(--ink)" stroke-width=".55"/></g>
    </g>`;

const ALT_SMALL = "Schematic: where each step in the life of an mRNA happens in a neuron: splicing and nuclear export in the nucleus, translation and decay in the cell body, an RNA transport granule carried along the axon, and local translation in a synaptic terminal. Hovering or focusing a card marks its step.";
const ALT = "Schematic. A fly neuron drawn left to right: a round cell body with its nucleus, one neurite running into the axon, and a branched, beaded arbor of synaptic terminals. A close-up shows TDP-43 clasping a target RNA with a UG-rich run, while a non-target RNA without one stays bare. Most TDP-43 is in the nucleus; a few molecules are in the cytoplasm. In the nucleus, TDP-43 sits on the intron of a pre-mRNA being spliced; the finished mRNA leaves through a nuclear pore. In the cell body, a ribosome translates an mRNA and another copy is broken down, each with TDP-43 on it. In the axon, a transport granule of mRNAs and TDP-43 is carried along a microtubule; in a synaptic terminal, a ribosome makes protein.";

// The drawing as markup. `labels: false` (the small copy beside the hypotheses) leaves out the
// text, the close-up and the side of the stage it needs, and crops to the cell.
export function lifeSVG({ prefix = "life", labels = true } = {}) {
  const p = prefix;
  const shapes = cellShapes();
  const cell = shapes.map(s => `<path d="${s.d}" data-x0="${F(s.x0)}"${s.part ? ` data-part="${s.part}"` : ""}/>`).join("");
  const mt = MT.map(pts => `<path d="${poly(pts)}"/>`).join("") +
    FAN.map(c => `<path d="${poly(Array.from({ length: 31 }, (_, i) => bez(c, i / 30)))}"/>`).join("");
  const walls = GAPS.flatMap(g => [-5.5, 5.5].map(s => {
    const a = (g + s) * Math.PI / 180;
    return `M${F(NUC[0] + 58 * Math.cos(a))},${F(NUC[1] + 58 * Math.sin(a))} L${F(NUC[0] + 54.5 * Math.cos(a))},${F(NUC[1] + 54.5 * Math.sin(a))}`;
  })).join(" ");
  const g = granuleAt(1), gx = g.x, gy = g.y, mlx = g.mt;
  const [bx, by] = BIG;
  const intron = intronAt(1);
  const use = (id, tf, cls = "") => `<use href="#${p}-${id}" transform="${tf}"${cls ? ` class="${cls}"` : ""}/>`;
  const leader = (x0, y0, x1, y1, cls) => `<g class="${cls}"><path class="lead" d="M${x0},${y0} L${x1},${y1}"/><circle class="lead-dot" cx="${x1}" cy="${y1}" r="1.5" fill="var(--text-3)"/></g>`;
  const T = (cls, x, y, text, anchor) => labels ? `<text class="${cls}" x="${F(x)}" y="${F(y)}"${anchor ? ` text-anchor="${anchor}"` : ""}>${text}</text>` : "";

  const viewBox = labels ? "0 6 984 270" : "58 44 902 228";
  const svg = `
<svg class="life" viewBox="${viewBox}" role="img" aria-label="${labels ? ALT : ALT_SMALL}">
  <defs>
    <filter id="${p}-rim" x="0" y="0" width="100%" height="100%">
      <feMorphology in="SourceAlpha" operator="erode" radius="2.5" result="e"/><feGaussianBlur in="e" stdDeviation="3.2" result="eb"/>
      <feComposite in="SourceAlpha" in2="eb" operator="out" result="ring"/>
      <feFlood style="flood-color: var(--mem)" flood-opacity=".26"/><feComposite in2="ring" operator="in"/>
    </filter>
    <linearGradient id="${p}-wash" gradientUnits="userSpaceOnUse" x1="0" y1="52" x2="0" y2="268">
      <stop offset="0" style="stop-color: var(--nw-1)"/><stop offset="1" style="stop-color: var(--nw-2)"/>
    </linearGradient>
    <radialGradient id="${p}-nucwash" cx=".42" cy=".38" r=".7">
      <stop offset="0" style="stop-color: var(--nuc-1)"/><stop offset="1" style="stop-color: var(--nuc-2)"/>
    </radialGradient>
    <!-- TDP-43: N-terminal knob, two RRM lobes clasping the RNA just below y = 0, loose C-terminal tail -->
    ${tdpDef(`${p}-tdp`)}
    <path id="${p}-ribo-l" d="M-8.6,-3.2 C-8.8,-9.6 -3.4,-12 0,-11.6 C4.6,-12 8.8,-9 8.6,-3.2 C8.4,-.8 -8.4,-.8 -8.6,-3.2 Z" fill="var(--wash-a)" stroke="var(--ink)" stroke-width=".8"/>
    <path id="${p}-ribo-s" d="M-7,2.6 C-7,.6 7,.6 7,2.6 C7,5.6 -7,5.6 -7,2.6 Z" fill="var(--wash-a)" stroke="var(--ink)" stroke-width=".8"/>
    <g id="${p}-cell">${cell}</g>
  </defs>

  <!-- the neuron: weighted ink outline (shadow side heavier), wash, pooled edge -->
  <g class="life-cell">
    <g class="life-ink" filter="url(#ink-boil)">
      <g class="life-shadow" fill="none" stroke="var(--mem)" stroke-width="2.3" stroke-linejoin="round" transform="translate(.7,.9)"><use href="#${p}-cell"/></g>
      <g class="life-line" fill="none" stroke="var(--mem)" stroke-width="1.8" stroke-linejoin="round"><use href="#${p}-cell"/></g>
    </g>
    <g class="life-wash"><g class="life-fill" fill="url(#${p}-wash)"><use href="#${p}-cell"/></g><g class="life-rim" filter="url(#${p}-rim)" fill="#000"><use href="#${p}-cell"/></g></g>
  </g>
  <g class="life-mt" fill="none" stroke="var(--mem)" stroke-width=".7" opacity=".55" stroke-linecap="round">${mt}</g>

  <!-- nucleus -->
  <g class="life-nuc">
    <circle class="nuc-wash" cx="${NUC[0]}" cy="${NUC[1]}" r="57" fill="url(#${p}-nucwash)"/>
    <circle class="nuc-ol" cx="146" cy="178" r="10" fill="var(--nuc-2)" opacity=".9"/>
    <g class="nuc-stip" fill="var(--ink)" opacity=".22">${stipple()}</g>
    <g class="nuc-env" fill="none" stroke="var(--text-3)" stroke-width=".9" filter="url(#ink-boil)">${[...envelope(58, GAPS), ...envelope(54.5, GAPS)].map(d => `<path class="env-arc" d="${d}"/>`).join("")}<path class="env-wall" d="${walls}"/></g>
  </g>

  <!-- the RNAs, in ink: splicing, export, translation, decay, local translation -->
  <g class="life-rna" fill="none" stroke="var(--ink)" stroke-linecap="round" filter="url(#ink-boil)">
    <g class="sp"><circle cx="140" cy="130" r="1.8" fill="var(--ink)" stroke="none"/><path class="sp-ex" d="M140,130 L161,130" stroke-width="3.2" stroke-linecap="butt"/><path class="sp-in" d="${intron.d}" stroke-width="1.1"/><path class="sp-ex" d="M195,130 L212,130" stroke-width="3.2" stroke-linecap="butt"/></g>
    <g class="ex"><path d="M190,160 L278,159" stroke-width="1.4"/><circle cx="190" cy="160" r="1.8" fill="var(--ink)" stroke="none"/></g>
    <path class="tr" d="M218,226 C232,220 250,216 270,214" stroke-width="1.4"/>
    <g class="dc"><circle cx="96" cy="200" r="1.8" fill="var(--ink)" stroke="none"/><path d="M96,200 C104,208 112,214 120,217" stroke-width="1.4"/><path class="dc-tail" d="M120,217 C126,219.4 132,221.6 139.4,224.4" stroke-width="1.4" opacity="0"/></g>
    <path class="bt" d="M${bx - 15},${by + 6} C${bx - 6},${by + 2} ${bx + 6},${by + 2} ${bx + 15},${by + 6}" stroke-width="1.3"/>
  </g>

  <!-- TDP-43 (most in the nucleus, a few in the cytoplasm) and the ribosomes -->
  <g class="life-mol">
    <g class="ntdp">${use("tdp", "translate(124,150) scale(.66) rotate(-18)")}${use("tdp", "translate(156,148) scale(.6) rotate(12)")}${use("tdp", "translate(202,184) scale(.66) rotate(-28)")}${use("tdp", "translate(134,180) scale(.6) rotate(30)")}${use("tdp", "translate(186,141) scale(.6) rotate(-8)")}${use("tdp", "translate(122,166) scale(.62) rotate(20)")}${use("tdp", "translate(212,146) scale(.6) rotate(-24)")}</g>
    <g class="ctdp">${use("tdp", "translate(261.4,213.1) scale(.55) rotate(-8)")}${use("tdp", "translate(100.8,202) scale(.55) rotate(41)")}${use("tdp", "translate(700,154.2) scale(.4)")}${use("tdp", "translate(893,77) scale(.38) rotate(-30)")}</g>
    <g class="sp-tdp" transform="translate(${F(intron.tdp[0])},${F(intron.tdp[1])})">${use("tdp", "scale(.72)")}</g>
    <g class="ex-tdp" transform="translate(206,157)">${use("tdp", "scale(.62)")}</g>
    <g transform="translate(244,218.5) rotate(-12) scale(.9)"><use class="tr-rs" href="#${p}-ribo-s"/><use class="tr-rl" href="#${p}-ribo-l"/></g>
    <g class="tr-beads" fill="var(--wash-b)" stroke="var(--ink)" stroke-width=".6"><circle cx="241" cy="205.5" r="1.9"/><circle cx="236.6" cy="201.6" r="1.9"/><circle cx="231.2" cy="199.4" r="1.9"/><circle cx="225.6" cy="199" r="1.9"/></g>
    <g class="dc-dots" fill="var(--ink)"><circle cx="124.6" cy="219.2" r="1.2"/><circle cx="129.4" cy="221.4" r="1.1" opacity=".7"/><circle cx="134" cy="222.4" r="1" opacity=".45"/><circle cx="138.8" cy="224.2" r=".9" opacity=".25"/></g>
    <g transform="translate(${bx},${by + 3.4}) scale(.82)"><use class="bt-rs" href="#${p}-ribo-s"/><use class="bt-rl" href="#${p}-ribo-l"/></g>
    <g class="bt-beads" fill="var(--wash-b)" stroke="var(--ink)" stroke-width=".55"><circle cx="${bx + 3}" cy="${by - 8}" r="1.7"/><circle cx="${bx + 6.8}" cy="${by - 11.2}" r="1.7"/><circle cx="${bx + 11}" cy="${by - 12.6}" r="1.7"/></g>
    <g class="bt-tdp" transform="translate(${bx - 12},${by + 11})">${use("tdp", "scale(.4)")}</g>
  </g>

  <!-- the RNA transport granule, carried along the lower microtubule; drawn round its centre -->
  <g class="gr" transform="translate(${F(gx)},${F(gy)})">
    <g class="gr-trail" fill="none" stroke="var(--text-3)" stroke-width=".8" opacity=".7"><path d="M-16,-5 q-3,5 0,10"/><path d="M-22,-3 q-2,3.5 0,7"/></g>
    <circle class="gr-halo" r="10.5" fill="var(--wash-b)" fill-opacity=".85" stroke="var(--text-3)" stroke-width=".8" stroke-dasharray="1.6 1.6"/>
    <g class="gr-load"><path class="gr-rna" d="M-7,-3 c2.4,-2.4 4.8,2.4 7.2,0 s4.8,2.4 6.4,0" fill="none" stroke="var(--ink)" stroke-width="1"/><path class="gr-rna" d="M-7,4 c2.4,-2.4 4.8,2.4 7.2,0 s4,2 5.4,0" fill="none" stroke="var(--ink)" stroke-width="1"/>${use("tdp", "translate(-3,-6.5) scale(.36)")}${use("tdp", "translate(1,7.5) scale(.36)")}</g>
    <path class="gr-motor" d="${motorD(gy, mlx)}" fill="none" stroke="var(--ink)" stroke-width=".9" stroke-linecap="round"/>
    ${T("st gr-label", 0, -22, "RNA transport granule", "middle")}
  </g>
  <g class="tp-arrow" fill="none" stroke="var(--ink)" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"><path class="tp-shaft" d="M${F(gx - 14)},${F(mlx + 22)} L${F(gx + 50)},${F(mlx + 22)}"/><path class="tp-head" d="M${F(gx + 44)},${F(mlx + 18)} L${F(gx + 51)},${F(mlx + 22)} L${F(gx + 44)},${F(mlx + 26)}"/></g>

  <!-- stations lit from the hypotheses (clay, the focus colour) -->
  <g class="st-rings" fill="none">
    <circle data-st="splice" cx="177" cy="121" r="30"/><circle data-st="pore" cx="228" cy="160" r="15"/>
    <circle data-st="decay" cx="116" cy="212" r="25"/><circle data-st="ribosome" cx="243" cy="212" r="24"/>
    <circle data-st="granule" cx="${F(gx)}" cy="${F(gy)}" r="19"/><ellipse data-st="arrow" cx="${F(gx + 18)}" cy="${F(mlx + 22)}" rx="40" ry="10"/>
    <circle data-st="bouton" cx="${bx}" cy="${by}" r="27"/>
  </g>
${labels ? `
  <!-- close-up of TDP-43 binding, with magnifier lines from the splicing site -->
  <g class="life-mag"><circle cx="179" cy="112" r="15" fill="none" stroke="var(--text-2)" stroke-width=".8"/><path class="lead" d="M189.6,101.4 L332,14"/><path class="lead" d="M193.8,114.6 L332,94"/></g>
  <g class="life-zoom">
    <rect x="332" y="14" width="268" height="80" rx="3" fill="var(--field)" stroke="var(--border-strong)" stroke-width="1"/>
    <g class="cu-rna" fill="none" stroke="var(--ink)" stroke-width="1.4" filter="url(#ink-boil)"><path d="M450,40 L588,40 M450,72 L588,72"/><circle cx="450" cy="40" r="1.8" fill="var(--ink)" stroke="none"/><circle cx="450" cy="72" r="1.8" fill="var(--ink)" stroke="none"/></g>
    ${tdpHinged("cu-tdp", 499, 36.6)}${tdpHinged("cu-tdp", 533, 36.6)}
    <!-- live text: never filtered -->
    <text class="seq" x="519" y="55" text-anchor="middle">…UGUGUGUG…</text>
    <text class="seq" x="519" y="87" text-anchor="middle">…ACGAUCCA…</text>
    <text class="st cu-label" x="344" y="44">target RNA</text>
    <text class="st cu-label" x="344" y="76">non-target RNA</text>
  </g>

  <g class="lab-splice">${T("st", 160, 100, "splicing", "end")}</g>
  <g class="lab-export">${leader(290, 190, 264, 162, "lead-g")}${T("st", 294, 198, "nuclear export")}</g>
  <g class="lab-transl">${leader(266, 248, 252, 222, "lead-g")}${T("st", 270, 260, "translation")}</g>
  <g class="lab-decay">${leader(96, 244, 112, 214, "lead-g")}${T("st", 92, 258, "decay", "middle")}</g>
  <g class="lab-transport">${T("st", gx + 18, mlx + 40, "transport", "middle")}</g>
  <g class="lab-local">${leader(942, 184, 930, 166, "lead-g")}${T("st", 968, 198, "local translation", "end")}</g>

  <g class="life-cmp">${T("cmp", NUC[0], 207, "Nucleus", "middle")}${T("cmp", 36, 62, "Cell body")}${T("cmp", 742, 132, "Axon", "middle")}${T("cmp", 818, 268, "Synaptic terminals", "middle")}</g>` : ""}
</svg>`;
  return { markup: svg, granule: { x: gx, y: gy, mt: mlx } };
}
