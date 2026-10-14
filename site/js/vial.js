// The climbing vial (leg motor neuron case): the vials, the taps, the flies' climbs, slips, falls
// and tremor, shared by step 1 (the chosen assay) and its landing station.
// docs/storyboards/nmj-openings.md, shots F–J.
//
// Seen front-on, as on the bench: two upright vials taped side by side (hTDP-43 WT left, the
// mutant right), each with a foam plug and a ring marked at 5 cm. The flies are side-view drawings
// on the vials' side walls, in profile, head up. Tapped down, they fall into a heap on the floor,
// right themselves and climb: the WT flies in quick bursts, most past the line within 3 s; the
// mutants late and slowly, with long pauses, two slips and a fall, their legs shaking whenever
// they stand. Which flies end above the line is fixed (decision 3: 8 of 10 WT, 2 of 10 mutants);
// their paths, bursts and pauses are seeded. Every pose is a function of time, so a frozen frame
// (?t=) or a replay always looks the same.

import { mulberry32 } from "./prng.js";
import { gait, GAIT_HZ } from "./monitor.js";
import { groomFrame } from "./fly.js";

export const VB = { w: 960, h: 482 };
export const VW = 100;                         // vial width
export const RIM = 50, FLOOR = 430;            // the vial's rim and its inside floor
const PLUG = [36, 90];                         // the foam plug, top to bottom
export const MM = (FLOOR - RIM) / 95;          // a 95 mm vial: 4 units per mm
export const LINE = FLOOR - 50 * MM;           // the 5 cm line
export const FLY_H = 18;                       // fly drawing height (full sprite frame): about 2.4× life size (Simplified)
const LIFT = 10;                               // how far the taped pair lifts at a tap
const LOCAL = 7;                               // a fly at rest wanders this far up or down its wall
export const N_FLIES = 10;

// H-time (seconds after "Tap the flies down"): three taps, the fall, the righting, then the timer
// runs 0 → 10 s in 7 s (decision 2: time runs 1.43× fast; Simplified), and the index builds.
export const H = {
  taps: [0, 0.36, 0.72], up: 0.12, down: 0.08,
  right: [0.95, 1.35], run: 1.4, rate: 10 / 7, timer: 10,
  stop: 8.4, index: 8.7, rest: 10.6, next: 10.8, end: 11.8,
};
export const impactAt = k => H.taps[k] + H.up + H.down;

export const LANES = [
  { id: "wt", cx: 426, out: -1, label: "hTDP-43 WT", seed: 731, mut: false },
  { id: "mut", cx: 534, out: 1, label: "hTDP-43 ALS mutant", seed: 845, mut: true },
];

// The climbs (decision 3; invented for this case), in timer seconds after the climb starts (τ).
// Each fly: its wall (−1 left, 1 right), how far round the curved wall it sits (inset, so flies on
// one wall don't stack into one dark mass), when it sets off from the floor (null: it stays
// there), then its moves: [mm, speed] climbs to that height above the floor in bursts (the
// walk–pause gait), speed in mm per timer second; ["wait", s] stands; ["slip", mm] slides down;
// ["fall"] drops to the floor. Where a fly ends is also where it sits before the taps (the moment
// after a climb). The line is at 50 mm.
const SCRIPTS = {
  wt: [
    { wall: -1, inset: 0, start: 0.10, moves: [[57, 46], ["wait", 0.3], [78, 32]] },
    { wall: 1, inset: 2, start: 0.20, moves: [[69, 46], ["wait", 0.45], [79, 26]] },
    { wall: -1, inset: 5, start: 0.05, moves: [[47, 44], ["wait", 0.25], [69, 39]] },
    { wall: 1, inset: 1, start: 1.90, moves: [[19, 17], ["wait", 1.1], [30, 15]] },     // starts late and stops below the line
    { wall: -1, inset: 2, start: 0.35, moves: [[52, 40], ["wait", 0.6], [62, 30]] },
    { wall: 1, inset: 6, start: 0.25, moves: [[65, 43]] },
    { wall: -1, inset: 8, start: 0.60, moves: [[28, 39], ["wait", 0.8], [55, 32]] },
    { wall: 1, inset: 0, start: 0.80, moves: [[47, 44], ["wait", 0.4], [73, 34]] },
    { wall: -1, inset: 4, start: 0.55, moves: [[26, 30], ["wait", 0.8], [41, 21]] },    // stops at 4 cm
    { wall: 1, inset: 4, start: 1.30, moves: [[22, 24], ["wait", 1.6], [38, 20], ["wait", 0.6], [57, 20]] },   // passes late
  ],
  mut: [
    { wall: -1, inset: 2, start: 2.6, moves: [] },                                        // gets onto the wall and no further
    { wall: 1, inset: 0, start: 1.1, moves: [[18, 8], ["wait", 1.6], ["slip", 5]] },
    { wall: -1, inset: 6, start: 0.6, moves: [[22, 13], ["wait", 0.7], [38, 13], ["wait", 0.6], [55, 12]] },   // passes
    { wall: 1, inset: 5, start: 0.9, moves: [[26, 9], ["wait", 1.4], [35, 6], ["wait", 0.8], ["slip", 4]] },
    { wall: -1, inset: 0, start: 0.4, moves: [[28, 11], ["wait", 1.8], ["fall"]] },
    { wall: 1, inset: 2, start: null, moves: [] },                                        // stays on the floor
    { wall: -1, inset: 1, start: 1.6, moves: [[21, 6]] },
    { wall: 1, inset: 8, start: 1.2, moves: [[27, 13], ["wait", 0.8], [43, 12], ["wait", 0.4], [57, 11]] },     // passes, late
    { wall: -1, inset: 4, start: 1.0, moves: [[30, 9], ["wait", 1.5], [43, 7]] },
    { wall: 1, inset: 1, start: 2.2, moves: [[23, 6]] },
  ],
};

const smooth = u => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const easeIn = u => (u <= 0 ? 0 : u >= 1 ? 1 : u * u);
const easeOut = u => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - (1 - u) * (1 - u));
const lerp = (a, b, u) => a + (b - a) * u;

// ---------- drawing ----------

// One vial at centre cx: the glass, the foam plug and the 5 cm ring (its back half behind the
// flies, its front half in front), with groups for the flies. `small` drops the labels.
export function vialMarkup(l, { labels = false } = {}) {
  const x0 = l.cx - VW / 2, x1 = l.cx + VW / 2, b = FLOOR + 4, r = 9;
  const outline = `M${x0 - 2},${RIM} H${x0} V${b - r} Q${x0},${b} ${x0 + r},${b} H${x1 - r} Q${x1},${b} ${x1},${b - r} V${RIM} H${x1 + 2}`;
  const ring = (half) => `M${x0 - 1},${LINE.toFixed(1)} A${VW / 2 + 1},4 0 0 ${half === "front" ? 0 : 1} ${x1 + 1},${LINE.toFixed(1)}`;
  const foam = [];
  const rf = mulberry32(l.seed + 3);
  for (let i = 0; i < 26; i++) foam.push(`<circle cx="${(x0 + 5 + rf() * (VW - 10)).toFixed(1)}" cy="${(PLUG[0] + 4 + rf() * (PLUG[1] - PLUG[0] - 8)).toFixed(1)}" r="${(0.6 + rf() * 0.9).toFixed(2)}"/>`);
  return `
    <g class="vial" data-lane="${l.id}">
      <path class="tube-glass" d="${outline}"/>
      <path class="climb-ring climb-ring--back" d="${ring("back")}"/>
      <g class="vial-flies"></g>
      <path class="tube-outline" d="${outline}"/>
      <path class="climb-ring climb-ring--front" d="${ring("front")}"/>
      <rect class="tube-plug" x="${x0 + 1.5}" y="${PLUG[0]}" width="${VW - 3}" height="${PLUG[1] - PLUG[0]}" rx="5"/>
      <g class="plug-foam">${foam.join("")}</g>
      <path class="tube-outline plug-edge" d="M${x0 + 1.5},${PLUG[1]} H${x1 - 1.5}"/>
    </g>`;
}

// The tape round both vials, which makes one tap treat both alike.
export const tapeMarkup = () => {
  const [a, b] = [LANES[0].cx - VW / 2 - 5, LANES[1].cx + VW / 2 + 5];
  return [[142, 18], [328, 18]].map(([y, h]) => `
    <g class="tape"><rect class="tape-strip" x="${a}" y="${y}" width="${b - a}" height="${h}" rx="1.5"/>
      <path class="tape-edge" d="M${a},${y + 0.6} H${b} M${a},${y + h - 0.6} H${b}"/></g>`).join("");
};

// Short ink marks where the vials hit the bench, one set per vial.
export const impactMarkup = l => {
  const y = FLOOR + 6, x0 = l.cx - VW / 2, x1 = l.cx + VW / 2;
  const marks = [[x0 - 3, -1], [x1 + 3, 1]].flatMap(([x, d]) => [[-0.2, 7], [0.45, 9], [1.1, 6]].map(([a, len]) => {
    const dx = d * Math.cos(a), dy = Math.sin(a);
    return `M${(x + dx * 3).toFixed(1)},${(y + dy * 3).toFixed(1)} L${(x + dx * (3 + len)).toFixed(1)},${(y + dy * (3 + len)).toFixed(1)}`;
  }));
  return `<path class="impact vial-impact" data-lane="${l.id}" d="${marks.join(" ")}"/>`;
};

// The parts named in shot G, on the WT vial's outer side.
export const labelMarkup = l => {
  const x = l.cx - VW / 2 - 16;
  return `
    <g class="vial-labels">
      <text class="scene-small" x="${x}" y="${(PLUG[0] + PLUG[1]) / 2 + 4}" text-anchor="end">foam plug</text>
      <text class="scene-small" x="${x}" y="${LINE - 8}" text-anchor="end">5 cm line</text>
      <text class="scene-small" x="${x}" y="${FLOOR - 24}" text-anchor="end">vial</text>
    </g>`;
};

// The counter beside each vial at the line: flies above it now.
export const counterMarkup = l => {
  const x = l.cx + l.out * (VW / 2 + 16), a = l.out < 0 ? "end" : "start";
  return `<g class="counter" data-lane="${l.id}"><text class="counter-n" x="${x}" y="${LINE + 24}" text-anchor="${a}">0</text><text class="scene-small" x="${x}" y="${LINE + 40}" text-anchor="${a}">above the line</text></g>`;
};

// The climbing index: each lane's sum on its own side of the vials, over an ink bar on a 0–1 scale
// with a dot at the value; the formula once, under the bench.
export function indexMarkup(n) {
  const bw = 190, y = 346;
  const rows = LANES.map(l => {
    const bx = l.out < 0 ? l.cx - VW / 2 - 56 - bw : l.cx + VW / 2 + 56;
    const v = n[l.id] / N_FLIES, at = (bx + v * bw).toFixed(1);
    return `
      <g class="ci" data-lane="${l.id}">
        <text class="pi-sum ci-sum" x="${bx + bw / 2}" y="${y - 16}" text-anchor="middle">${n[l.id]} / ${N_FLIES} = <tspan class="pi-value">${v.toFixed(1)}</tspan></text>
        <line class="pi-track" x1="${bx}" y1="${y}" x2="${bx + bw}" y2="${y}"/>
        <g class="ci-scale">${[0, 0.5, 1].map(t => `<line class="pi-tick" x1="${bx + t * bw}" y1="${y + 6}" x2="${bx + t * bw}" y2="${y + 11}"/><text class="scene-tick" x="${bx + t * bw}" y="${y + 24}" text-anchor="middle">${t}</text>`).join("")}</g>
        <rect class="pi-bar" x="${bx}" y="${y - 4}" width="${(v * bw).toFixed(1)}" height="8" data-w="${(v * bw).toFixed(1)}"/>
        <circle class="pi-dot" cx="${at}" cy="${y}" r="4.5" data-x0="${bx}" data-x="${at}"/>
      </g>`;
  }).join("");
  return `
    <g class="ci-block">
      <text class="scene-small ci-formula" x="${(LANES[0].cx + LANES[1].cx) / 2}" y="${FLOOR + 38}" text-anchor="middle">Climbing index = flies above the line / all flies</text>
      ${rows}
    </g>`;
}

// ---------- the flies ----------

// Where a fly's thorax sits on its wall, and its pose there: head up (face 1) or down (−1).
const wallX = (l, f, g) => l.cx + f.wall * (VW / 2 - 1 - g - f.inset);
const wallFoot = g => FLOOR - 1.5 * g;         // the thorax of a fly just up from the floor
const wallPose = (l, f, g, y, face) => ({ x: wallX(l, f, g), y, rot: f.wall < 0 ? 90 : -90, sx: f.wall < 0 ? -face : face, sy: 1 });
const floorPose = (f, g, x, face) => ({ x, y: FLOOR - 0.8 - g, rot: 0, sx: face, sy: 1 });

// The tremor (decision 4): the mutant's legs shake whenever it stands, in runs of drawings on
// twos, never the same drawing twice in a row, with a short still beat now and then.
function shakeTrack(seed) {
  const r = mulberry32(seed), out = new Int8Array(12 * 60);
  let i = 0, k = 0;
  while (i < out.length) {
    for (let n = 5 + Math.floor(r() * 12); n > 0 && i < out.length; n--) { k = (k + 1 + (r() < 0.5 ? 0 : 1)) % 3; out[i++] = k; }
    for (let n = 1 + Math.floor(r() * 4); n > 0 && i < out.length; n--) out[i++] = -1;
  }
  return out;
}
const shakeAt = (f, t) => {
  const k = f.shake[((Math.floor(t * 12) % f.shake.length) + f.shake.length) % f.shake.length];
  return k < 0 ? ["stand", 0] : ["tremor", k];
};

// Compile one fly's script into segments in τ, from standing on the floor at τ = 0.
function compile(l, f, g, stride, r) {
  const segs = [];
  let t = 0, y = wallFoot(g), on = "floor", x = f.floorX;
  const push = s => { segs.push({ t0: t, ...s }); t = s.t1; };
  if (f.start == null) {
    push({ k: "floor", x, t1: Infinity });
    return { segs, end: "floor", endX: x };
  }
  push({ k: "floor", x, t1: f.start });
  const mount = 0.2 + Math.abs(wallX(l, f, g) - f.floorX) / 90;
  push({ k: "mount", t1: t + mount });
  on = "wall";
  for (const m of f.moves) {
    if (m[0] === "wait") push({ k: "stand", y, t1: t + m[1] });
    else if (m[0] === "slip") { push({ k: "slip", y0: y, y1: y + m[1] * MM, t1: t + 0.22 }); y += m[1] * MM; }
    else if (m[0] === "fall") {
      const x1 = l.cx + f.wall * (10 + r() * 12), spin = (r() < 0.5 ? -1 : 1) * (150 + r() * 120);
      push({ k: "fall", y0: y, x1, spin, t1: t + 0.24 + 0.002 * (FLOOR - y) });
      push({ k: "lie", x: x1, rot: (f.wall < 0 ? 90 : -90) + spin, t1: t + 0.6 });
      push({ k: "right", x: x1, rot: (f.wall < 0 ? 90 : -90) + spin, t1: t + 0.45 });
      on = "floor"; x = x1;
    } else {
      const y1 = FLOOR - m[0] * MM, v = m[1] * MM;
      const prog = gait(r, Math.abs(y1 - y), v, stride);
      push({ k: "walk", y0: y, y1, prog, t1: t + (prog.length - 1) / GAIT_HZ });
      y = y1;
    }
  }
  push({ k: on === "floor" ? "floor" : "stand", x, y, t1: Infinity });
  return { segs, end: on === "floor" ? "floor" : y, endX: x };
}

// Every fly of one lane: its script compiled, its heap pose, its ambient walk (before the taps
// and on the landing), its rest bouts (grooming for WT), its tremor track, and when it crosses
// the line (the counter ticks then).
export function laneFlies(l, stride, g) {
  const r = mulberry32(l.seed);
  return SCRIPTS[l.id].map((s, k) => {
    const f = { k, ...s, moves: s.moves.map(m => [...m]) };
    f.floorX = l.cx + (r() - 0.5) * 56;
    f.heap = { dx: f.floorX - l.cx, dy: -2 - r() * 5, rot: (r() - 0.5) * 140 + (r() < 0.3 ? 180 : 0), sy: r() < 0.35 ? -1 : 1 };
    f.rightAt = H.right[0] + r() * (H.right[1] - H.right[0] - 0.3);
    Object.assign(f, compile(l, f, g, stride, r));
    f.home = f.end === "floor" ? { floor: true, x: f.endX } : { floor: false, y: f.end };
    f.local = ambientPlan(l.seed + 17 * k, l.mut, stride, f.home.floor);
    f.shake = shakeTrack(l.seed * 7 + k);
    f.rest = [];
    const arrive = f.segs.at(-1).t0 / H.rate + H.run;   // story time when the climb is over
    for (let t = arrive + 0.8 + r() * 1.6; t < 900;) { const b = 2.2 + r(); f.rest.push([t, t + b]); t += b + 2.4 + r() * 3.4; }
    f.cross = null;
    for (const s of f.segs) {   // the first moment the thorax is above the line, sampled finely
      if (s.k !== "walk" || s.y1 >= LINE || f.cross != null) continue;
      for (let t = s.t0; t <= s.t1; t += 1 / 240) if (segY(s, t) < LINE) { f.cross = t; break; }
    }
    return f;
  });
}

const progAtU = (prog, u) => {
  const x = Math.min(prog.length - 1, Math.max(0, u * GAIT_HZ));
  const i = Math.min(prog.length - 2, Math.floor(x));
  return prog[i] + (prog[i + 1] - prog[i]) * (x - i);
};
const segY = (s, tau) => lerp(s.y0, s.y1, progAtU(s.prog, tau - s.t0));

// A fly's life between climbs (before the taps, and on the landing): it stands, mostly head up,
// and now and then climbs a step. A WT fly sometimes turns and walks back down a little, and
// grooms; a mutant shakes as it stands and slips back after its steps. It stays within LOCAL of
// where it sits. Segments in seconds: { t0, t1, k: "stand" | "walk" | "slip", o0, o1 (offset
// down the wall, or along the floor), face, prog }.
function ambientPlan(seed, mut, stride, floor) {
  const r = mulberry32(seed), segs = [];
  let t = -r() * 3, o = (r() - 0.5) * LOCAL, face = 1;
  while (t < 900) {
    const rest = mut ? 1.4 + r() * 3.2 : 0.8 + r() * 2.6;
    const groom = !mut && r() < 0.3;
    segs.push({ t0: t, t1: t + (groom ? 2.2 + r() : rest), k: groom ? "groom" : "stand", o0: o, o1: o, face });
    t = segs.at(-1).t1;
    const d = (mut ? 2 : 3) + r() * (mut ? 4 : 7);
    let o1, k = "walk";
    if (floor) { o1 = Math.max(-LOCAL, Math.min(LOCAL, o + (r() < 0.5 ? -d : d))); face = Math.sign(o1 - o) || face; }
    else if (o - d >= -LOCAL && (r() < 0.7 || o + d > LOCAL)) { o1 = o - d; face = 1; }            // a step up
    else { o1 = o + d; if (mut) k = "slip"; else face = -1; }                                          // back down: a WT fly turns, a mutant slips
    if (Math.abs(o1 - o) < 0.5) continue;   // nowhere to go: rest again
    if (k === "slip") { segs.push({ t0: t, t1: t + 0.2, k, o0: o, o1, face }); t += 0.2; }
    else {
      const prog = gait(r, Math.abs(o1 - o), mut ? 7 + r() * 4 : 16 + r() * 14, stride, true);
      segs.push({ t0: t, t1: t + (prog.length - 1) / GAIT_HZ, k, o0: o, o1, face, prog });
      t = segs.at(-1).t1;
      if (!floor && face < 0 && r() < 0.8) face = 1;   // turns head up again before it rests
    }
    o = o1;
  }
  return { segs, cursor: 0 };
}

// The fly's pose before the taps (and on the landing), at time t.
export function ambientPose(l, f, t, g, stride, frames) {
  const P = f.local;
  let i = Math.min(P.cursor, P.segs.length - 1);
  while (i > 0 && P.segs[i].t0 > t) i--;
  while (i < P.segs.length - 1 && P.segs[i].t1 <= t) i++;
  P.cursor = i;
  const s = P.segs[i], u = Math.max(0, Math.min(1, (t - s.t0) / (s.t1 - s.t0)));
  let off = s.o0, seq = "stand", frame = 0;
  if (s.k === "walk") {
    off = lerp(s.o0, s.o1, progAtU(s.prog, t - s.t0));
    const tq = Math.max(s.t0, Math.floor(t * 12) / 12);
    [seq, frame] = ["walk", Math.floor(Math.abs(lerp(s.o0, s.o1, progAtU(s.prog, tq - s.t0)) - s.o0) / (stride / 8))];
  } else if (s.k === "slip") off = lerp(s.o0, s.o1, smooth(u));
  else if (s.k === "groom") [seq, frame] = groomFrame(frames, s.t0, s.t1, t);
  const p = f.home.floor ? floorPose(f, g, f.home.x + off, s.face) : wallPose(l, f, g, f.home.y + off, s.face);
  if (l.mut && seq === "stand") [seq, frame] = shakeAt(f, t);
  return { ...p, seq, frame };
}

// The fly's pose at H-time tH (seconds since "Tap the flies down"), starting from `origin` (its
// pose when the vials were picked up).
export function climbPose(l, f, tH, g, stride, frames, origin) {
  const i0 = impactAt(0);
  if (tH < i0) return origin;
  const heap = { x: l.cx + f.heap.dx, y: FLOOR - 4 + f.heap.dy, rot: f.heap.rot, sx: f.wall, sy: f.heap.sy, seq: "stand", frame: 0 };
  const shook = (p, t) => { if (l.mut) [p.seq, p.frame] = shakeAt(f, t); return p; };
  if (tH < f.rightAt + 0.3 && tH < H.run + 0.01) {
    // knocked off the wall at the first impact; falls into the heap; hops at the next two
    const drop = 0.1 + 0.0009 * Math.max(0, heap.y - origin.y);
    if (tH < i0 + drop) {
      const u = easeIn((tH - i0) / drop);
      return { x: lerp(origin.x, heap.x, u), y: lerp(origin.y, heap.y, u), rot: lerp(origin.rot, heap.rot, u), sx: origin.sx, sy: u < 0.5 ? origin.sy : heap.sy, seq: "stand", frame: 0 };
    }
    let hop = 0;
    for (const k of [1, 2]) { const u = (tH - impactAt(k)) / 0.16; if (u >= 0 && u < 1) hop = 3 * Math.sin(Math.PI * u); }
    if (tH < f.rightAt) return shook({ ...heap, y: heap.y - hop }, tH);
    // rights itself: rolls back onto its feet
    const u = smooth((tH - f.rightAt) / 0.3), up = floorPose(f, g, heap.x, f.wall);
    const rot0 = heap.rot - 360 * Math.round(heap.rot / 360);
    return { x: heap.x, y: lerp(heap.y, up.y, u), rot: lerp(rot0, 0, u), sx: f.wall, sy: lerp(heap.sy, 1, u) || 0.01, seq: "stand", frame: 0 };
  }
  const tau = Math.max(0, (tH - H.run) * H.rate);
  const tq = Math.max(0, (Math.floor(tH * 12) / 12 - H.run) * H.rate);   // leg drawings change on twos
  let s = f.segs.find(x => tau >= x.t0 && tau < x.t1) || f.segs.at(-1);
  const u = (s.t1 === Infinity ? 0 : (tau - s.t0) / (s.t1 - s.t0));
  const wf = n => ({ seq: "walk", frame: Math.floor(n / (stride / 8)) });
  switch (s.k) {
    case "floor": {
      const p = { ...floorPose(f, g, s.x, f.wall), seq: "stand", frame: 0 };
      if (s.t1 === Infinity && !l.mut) return rested(f, p, tH, frames);
      return shook(p, tH);
    }
    case "mount": {
      const x1 = wallX(l, f, g), a = floorPose(f, g, f.floorX, f.wall), b = wallPose(l, f, g, wallFoot(g), 1);
      const v = smooth(u), w = smooth((u - 0.35) / 0.65);
      const d = (Math.abs(x1 - f.floorX) + 14) * Math.min(1, Math.max(0, (tq - s.t0) / (s.t1 - s.t0)));
      return { x: lerp(a.x, b.x, v), y: lerp(a.y, b.y, w), rot: lerp(0, b.rot, w), sx: f.wall, sy: 1, ...wf(d) };
    }
    case "walk": {
      const y = segY(s, tau), yq = segY(s, Math.max(s.t0, tq));
      return { ...wallPose(l, f, g, y, s.y1 < s.y0 ? 1 : -1), ...wf(Math.abs(yq - s.y0)) };
    }
    case "stand": {
      const p = { ...wallPose(l, f, g, s.y, 1), seq: "stand", frame: 0 };
      if (s.t1 === Infinity && !l.mut) return rested(f, p, tH, frames);
      return shook(p, tH);
    }
    case "slip": return shook({ ...wallPose(l, f, g, lerp(s.y0, s.y1, smooth(u)), 1) }, tH);
    case "fall": {
      const a = wallPose(l, f, g, s.y0, 1);
      return shook({ x: lerp(a.x, s.x1, easeOut(u)), y: lerp(s.y0, FLOOR - 5, easeIn(u)), rot: a.rot + s.spin * u, sx: a.sx, sy: 1 }, tH);
    }
    case "lie": return shook({ x: s.x, y: FLOOR - 5, rot: s.rot, sx: f.wall, sy: 1 }, tH);
    case "right": {
      const rot0 = s.rot - 360 * Math.round(s.rot / 360), up = floorPose(f, g, s.x, f.wall);
      return shook({ x: s.x, y: lerp(FLOOR - 5, up.y, smooth(u)), rot: lerp(rot0, 0, smooth(u)), sx: f.wall, sy: 1 }, tH);
    }
  }
  return origin;
}

// A WT fly at rest after its climb grooms in seeded bouts (story time).
function rested(f, p, t, frames) {
  const b = f.rest.find(([a, z]) => t >= a && t < z);
  if (b) [p.seq, p.frame] = groomFrame(frames, b[0], b[1], t);
  return p;
}

// The vials' lift at H-time tH: up, then dropped onto the bench, at each tap.
export function liftAt(tH) {
  for (const t0 of H.taps) {
    const u = tH - t0;
    if (u >= 0 && u < H.up) return LIFT * easeOut(u / H.up);
    if (u >= H.up && u < H.up + H.down) return LIFT * (1 - easeIn((u - H.up) / H.down));
  }
  return 0;
}
// The impact marks: drawn at each landing, gone in 0.2 s.
export function impactFlash(tH) {
  let f = 0;
  for (let k = 0; k < 3; k++) { const u = (tH - impactAt(k)) / 0.2; if (u >= 0 && u < 1) f = Math.max(f, 1 - u); }
  return f;
}

// Flies above the line at timer time tau (counted until the timer stops), and the latest crossing.
export function aboveCount(flies, tau) {
  let n = 0, last = -Infinity;
  for (const f of flies) if (f.cross != null && f.cross <= tau) { n++; last = Math.max(last, f.cross); }
  return { n, last };
}
export const timerAt = tH => Math.min(H.timer, Math.max(0, (tH - H.run) * H.rate));

export const poseTransform = p =>
  `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.rot.toFixed(1)}) scale(${p.sx} ${p.sy.toFixed(3)})`;
