// The T-maze (mushroom body case): the maze drawing, the odours, the shocks and the flies'
// choreography, shared by step 1 (the chosen assay) and its landing station.
// docs/storyboards/mb-openings.md, shots F–J.
//
// Seen front-on, as it stands on the bench: a vertical training tube lined with the shock grid,
// whose lower segment is the elevator, above the T's two horizontal arms (OCT on the left, MCH on
// the right). The flies are side-view drawings: on the tube's walls during training, heaped in
// the elevator when tapped down, then on the floor and ceiling of the arms. Every pose is a
// function of time (seeded walk–pause schedules from monitor.js), so a frozen frame (?t=) or a
// replay always looks the same.

import { mulberry32 } from "./prng.js";
import { walkPause, walkAt } from "./monitor.js";
import { groomFrame } from "./fly.js";

export const VB = { w: 960, h: 458 };
export const LW = 400;                         // lane width
const TW = 44;                                 // training tube width
const TOP = 30, JOINT = 186, EH = 40;          // tube top, tube/elevator joint, elevator height
export const ARM = { y: 262, h: 36 };          // the arms
export const DROP = ARM.y + ARM.h / 2 - (JOINT + EH / 2);   // how far the elevator slides down
const ENTRY = 40;                              // an arm's entrance line, from the lane centre
export const FLY_H = 20;                       // fly drawing height (full sprite frame)
const WALL = [48, 176];                        // where flies walk on the tube walls (y)
const LOCAL = 9;                               // each fly wanders this far either side of its own place
const VIRT = 200, K = (2 * LOCAL) / VIRT;      // local walks run on a 0–200 track, scaled down by K

// H-time cues (seconds after "Train the flies"): OCT with three shocks, air, MCH, then the test.
export const H = {
  octIn: 0, octOut: 2.2, mchIn: 2.6, mchOut: 4.2, pulses: [0.5, 1.2, 1.9],
  tap: [4.2, 4.5], slide: [4.5, 5.3], armsFill: [4.6, 5.4], out: 5.4, pi: 8.4, rest: 10.6, end: 11.8,
};

// Decision 4 (invented for this case; the mutant at chance, instructor 2026-10-12): ten drawn
// flies per lane stand in for about a hundred.
export const LANES = [
  { id: "wt", x: 40, label: "hTDP-43 WT", seed: 311, oct: [3, 8] },                 // 8 MCH, 2 OCT: PI 0.6
  { id: "mut", x: 520, label: "hTDP-43 ALS mutant", seed: 422, oct: [1, 3, 4, 6, 9] }, // 5 MCH, 5 OCT: PI 0
];
const FEED_Y = 8;                              // the odour hose runs into the inlet at this height
const BOLT_Y = 136;                            // the shock symbol, beside the grid
export const N_FLIES = 10;

const smooth = u => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const easeIn = u => (u <= 0 ? 0 : u >= 1 ? 1 : u * u);
const clamp01 = u => Math.max(0, Math.min(1, u));
const lerp = (a, b, u) => a + (b - a) * u;

// ---------- drawing ----------

// The odour textures (ink, never a hue): OCT a stipple, MCH short wavy strokes. One pattern pair
// per scene; `id` keeps step 1 and the landing station apart when both are on a page.
export function odourDefs(id) {
  const oct = k => `
    <pattern id="oct-${k}-${id}" class="odour-pat" width="9" height="9" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2.5" r=".9"/><circle cx="6.5" cy="5" r=".75"/><circle cx="3.5" cy="7.5" r=".6"/>
    </pattern>`;
  const mch = k => `
    <pattern id="mch-${k}-${id}" class="odour-pat" width="16" height="11" patternUnits="userSpaceOnUse">
      <path class="odour-wave" d="M1,3.5 q2,-2 4,0 t4,0"/><path class="odour-wave" d="M8,8.5 q2,-2 4,0 t4,0"/>
    </pattern>`;
  // the tube's odours flow down from the inlet; the arms' flow from their ends towards the
  // choice point, so each place has its own pattern to drift
  return oct("tube") + mch("tube") + oct("left") + mch("right");
}

// Drift the odour patterns with time (pattern units per second).
export function driftOdours(svg, id, t) {
  const set = (k, dx, dy, w, h) => svg.querySelector(`#${k}-${id}`)?.setAttribute("patternTransform", `translate(${((dx * t) % w).toFixed(2)} ${((dy * t) % h).toFixed(2)})`);
  set("oct-tube", 0, 16, 9, 9);
  set("mch-tube", 0, 12, 16, 11);
  set("oct-left", 10, 0, 9, 9);
  set("mch-right", -8, 0, 16, 11);
}

// One lane's maze at lane origin (x, 0). `labels` adds the names read in shot G (WT lane only).
export function mazeMarkup(l, { id, labels = false, small = false }) {
  const cx = l.x + LW / 2, tx = cx - TW / 2;
  const a0 = l.x + 8, a1 = l.x + LW - 8;
  const grid = [];
  for (let k = -12; k < 30; k++) {   // the copper grid: a fine double helix printed on the wall
    const y = TOP + k * 7;
    grid.push(`M${tx},${y} l${TW},${TW * 0.55}`, `M${tx + TW},${y} l${-TW},${TW * 0.55}`);
  }
  const armPath = (xa, xb) => `<rect class="tube-glass" x="${xa}" y="${ARM.y}" width="${xb - xa}" height="${ARM.h}"/>`;
  const port = (x, side) => `<rect class="maze-port" x="${side < 0 ? x - 10 : x}" y="${ARM.y - 4}" width="10" height="${ARM.h + 8}" rx="2"/>`;
  return `
    <g class="maze" data-lane="${l.id}">
      ${small ? "" : `<text class="scene-label" x="${l.x}" y="24">${l.label}</text>`}
      <clipPath id="tube-${id}-${l.id}"><rect x="${tx}" y="${TOP}" width="${TW}" height="${JOINT - TOP}" rx="${TW / 2}" ry="${TW / 2}"/><rect x="${tx}" y="${TOP + TW}" width="${TW}" height="${JOINT - TOP - TW}"/></clipPath>
      <clipPath id="arm-${id}-${l.id}"><rect x="${a0}" y="${ARM.y}" width="${cx - TW / 2 - a0}" height="${ARM.h}"/><rect x="${cx + TW / 2}" y="${ARM.y}" width="${a1 - cx - TW / 2}" height="${ARM.h}"/></clipPath>
      <!-- the arms, with an odour port at each end -->
      ${armPath(a0, cx - TW / 2)}${armPath(cx + TW / 2, a1)}
      <g clip-path="url(#arm-${id}-${l.id})">
        <rect class="odour odour--arm" data-odour="oct" x="${a0}" y="${ARM.y}" width="${cx - TW / 2 - a0}" height="${ARM.h}" fill="url(#oct-left-${id})"/>
        <rect class="odour odour--arm" data-odour="mch" x="${cx + TW / 2}" y="${ARM.y}" width="${a1 - cx - TW / 2}" height="${ARM.h}" fill="url(#mch-right-${id})"/>
      </g>
      <path class="tube-outline" d="M${cx - TW / 2},${ARM.y} H${a0} V${ARM.y + ARM.h} H${cx - TW / 2} M${cx + TW / 2},${ARM.y} H${a1} V${ARM.y + ARM.h} H${cx + TW / 2}"/>
      ${port(a0, -1)}${port(a1, 1)}
      <line class="entry" data-arm="oct" x1="${cx - ENTRY}" y1="${ARM.y - 3}" x2="${cx - ENTRY}" y2="${ARM.y + ARM.h + 3}"/>
      <line class="entry" data-arm="mch" x1="${cx + ENTRY}" y1="${ARM.y - 3}" x2="${cx + ENTRY}" y2="${ARM.y + ARM.h + 3}"/>
      <!-- the choice point: where the elevator docks between the arms -->
      <rect class="maze-dock" x="${cx - TW / 2 - 3}" y="${ARM.y - 5}" width="${TW + 6}" height="${ARM.h + 10}" rx="3"/>
      <!-- the training tube with its grid, and the odour inlet at the top, fed by a hose whose end
           names what flows: dots of OCT or dashes of MCH run along it into the tube -->
      ${small ? "" : `
      <path class="feed" d="${feedD(cx)}"/><path class="feed-core" d="${feedD(cx)}"/><path class="feed-flow" d="${feedD(cx)}"/>
      <text class="feed-tag" x="${cx + 52}" y="${FEED_Y + 4.5}"></text>`}
      <rect class="maze-port" x="${cx - 7}" y="${TOP - 12}" width="14" height="14" rx="2"/>
      <rect class="tube-glass" x="${tx}" y="${TOP}" width="${TW}" height="${JOINT - TOP}" rx="${TW / 2}"/>
      <g clip-path="url(#tube-${id}-${l.id})">
        <rect class="odour odour--tube" data-odour="oct" x="${tx}" y="${TOP}" width="${TW}" height="${JOINT - TOP}" fill="url(#oct-tube-${id})"/>
        <rect class="odour odour--tube" data-odour="mch" x="${tx}" y="${TOP}" width="${TW}" height="${JOINT - TOP}" fill="url(#mch-tube-${id})"/>
        <path class="maze-grid" d="${grid.join(" ")}"/>
        <path class="shock" d="${zigzag(tx + 3, TOP + 10, JOINT - 6)} ${zigzag(tx + TW - 3, TOP + 10, JOINT - 6)}"/>
      </g>
      <path class="tube-outline" d="M${tx},${JOINT} V${TOP + TW / 2} a${TW / 2},${TW / 2} 0 0 1 ${TW},0 V${JOINT}"/>
      ${small ? "" : `
      <!-- the shock symbol: pops at each pulse, with the pulses counted -->
      <g class="bolt-g" transform="translate(${tx + TW + 17} ${BOLT_Y})">
        <path class="bolt" d="M3.5,-12 L-5,1.5 L0,1.5 L-3.5,12 L5.5,-2.5 L0.5,-2.5 L4.5,-12 Z"/>
        <text class="bolt-n" x="10" y="4.5"></text>
      </g>`}
      <!-- the elevator: the tube's lower segment, which carries the flies down to the choice point -->
      <g class="elevator">
        <rect class="tube-glass" x="${tx}" y="${JOINT}" width="${TW}" height="${EH}"/>
        <rect class="maze-elevator" x="${tx - 3}" y="${JOINT}" width="${TW + 6}" height="${EH}" rx="2"/>
        <g class="maze-flies"></g>
      </g>
      <g class="wall-flies"></g>
      <g class="arm-flies"></g>
      ${labels ? `
      <g class="maze-labels">
        <text class="scene-small" x="${tx - 10}" y="${TOP + 34}" text-anchor="end">training tube</text>
        <text class="scene-small" x="${tx + TW + 10}" y="${TOP + 70}">shock grid</text>
        <text class="scene-small" x="${cx}" y="${ARM.y + ARM.h + 22}" text-anchor="middle">choice point</text>
      </g>` : ""}
      ${small ? "" : `
      <g class="odour-labels">
        <text class="scene-small" x="${a0}" y="${ARM.y - 10}">${labels ? "OCT (3-octanol)" : "OCT"}</text>
        <text class="scene-small" x="${a1}" y="${ARM.y - 10}" text-anchor="end">${labels ? "MCH (4-methylcyclohexanol)" : "MCH"}</text>
      </g>
      <g class="counter" data-arm="oct"><text class="counter-n" x="${(a0 + cx - ENTRY) / 2}" y="${ARM.y + ARM.h + 34}" text-anchor="middle">0</text><text class="scene-small" x="${(a0 + cx - ENTRY) / 2}" y="${ARM.y + ARM.h + 50}" text-anchor="middle">in the OCT arm</text></g>
      <g class="counter" data-arm="mch"><text class="counter-n" x="${(a1 + cx + ENTRY) / 2}" y="${ARM.y + ARM.h + 34}" text-anchor="middle">0</text><text class="scene-small" x="${(a1 + cx + ENTRY) / 2}" y="${ARM.y + ARM.h + 50}" text-anchor="middle">in the MCH arm</text></g>`}
    </g>`;
}

// The hose, drawn from its free end to the inlet, so the flow's dash offset runs into the tube.
const feedD = cx => `M${cx + 46},${FEED_Y} H${cx + 6} Q${cx},${FEED_Y} ${cx},${FEED_Y + 6} V${TOP - 12}`;

function zigzag(x, y0, y1) {
  const pts = [];
  for (let y = y0, k = 0; y <= y1; y += 6, k++) pts.push(`${(x + (k % 2 ? 2.5 : -2.5)).toFixed(1)},${y}`);
  return `M${pts.join(" L")}`;
}

// The performance index under a lane: the formula, the sum, and an ink bar on a 0–1 scale with a
// dot at the value, so an index of 0 (chance, marked under the 0) still shows.
export function piMarkup(l, n) {
  const cx = l.x + LW / 2, bx = cx - 100, y = 404;
  const pi = (n.mch - n.oct) / (n.mch + n.oct);
  const at = (bx + pi * 200).toFixed(1);
  return `
    <g class="pi" data-lane="${l.id}">
      <text class="scene-small pi-formula" x="${cx}" y="${y - 22}" text-anchor="middle">PI = (MCH − OCT) / all flies</text>
      <text class="pi-sum" x="${cx}" y="${y - 3}" text-anchor="middle">(${n.mch} − ${n.oct}) / ${n.mch + n.oct} = <tspan class="pi-value">${pi.toFixed(1)}</tspan></text>
      <line class="pi-track" x1="${bx}" y1="${y + 14}" x2="${bx + 200}" y2="${y + 14}"/>
      ${[0, 0.5, 1].map(v => `<line class="pi-tick" x1="${bx + v * 200}" y1="${y + 10}" x2="${bx + v * 200}" y2="${y + 18}"/><text class="scene-tick" x="${bx + v * 200}" y="${y + 31}" text-anchor="middle">${v}</text>`).join("")}
      <text class="scene-tick pi-chance" x="${bx}" y="${y + 44}" text-anchor="middle">chance</text>
      <rect class="pi-bar" x="${bx}" y="${y + 10}" width="${(pi * 200).toFixed(1)}" height="8" data-w="${(pi * 200).toFixed(1)}"/>
      <circle class="pi-dot" cx="${at}" cy="${y + 14}" r="4.5" data-x0="${bx}" data-x="${at}"/>
    </g>`;
}

// ---------- the flies ----------

// Every fly of one lane: its wall and walk on the tube during training, its pose in the heap
// when tapped down, its arm, wall (floor or ceiling) and walk in the test, and when it crosses
// the arm's entrance line (the counter ticks then).
export function laneFlies(l, stride) {
  const r = mulberry32(l.seed);
  const cx = LW / 2;   // lane-relative
  const order = [...Array(N_FLIES).keys()].sort(() => r() - 0.5);   // who leaves the heap first
  const inArm = { oct: 0, mch: 0 };
  const total = { oct: l.oct.length, mch: N_FLIES - l.oct.length };
  const perWall = N_FLIES / 2;
  return Array.from({ length: N_FLIES }, (_, k) => {
    // training: each fly keeps its own place on one wall (the walls' places are staggered), and
    // wanders a little round it, so ten flies never pile into one dark mass
    const left = k % 2 === 0;
    const y0 = WALL[0] + ((k >> 1) + (left ? 0.3 : 0.75)) / perWall * (WALL[1] - WALL[0]);
    const wall = walkPause(l.seed + 17 * k, {
      x: VIRT / 2 + (r() - 0.5) * 60, face: r() < 0.5 ? 1 : -1, until: 900, xMin: 0, xMax: VIRT, beam: VIRT / 2,
      speed: [10 / K, 20 / K], pause: [0.8, 3.2], groom: 0.3, stride: stride / K,
    });
    const heap = { dx: (r() - 0.5) * 24, dy: (r() - 0.5) * 14, rot: (r() - 0.5) * 70 + (r() < 0.2 ? 180 : 0), face: r() < 0.5 ? 1 : -1 };
    // the test: a calm walk out to the fly's own spot in its arm, on the floor or the ceiling,
    // then it rests and grooms there
    const arm = l.oct.includes(k) ? "oct" : "mch";
    const dir = arm === "oct" ? -1 : 1;
    const i = inArm[arm]++;
    const ceiling = i % 2 === 1;
    const span = [ENTRY + 22, LW / 2 - 26];   // distance from the centre where flies settle
    const slots = Math.ceil(total[arm] / 2);
    const d = lerp(span[0], span[1], slots > 1 ? (i >> 1) / (slots - 1) : 0.5) + (r() - 0.5) * 8 + (ceiling ? 9 : 0);
    const start = H.out + order.indexOf(k) * 0.24 + r() * 0.12;
    const walk = walkPause(l.seed + 31 * k + 5, { x: cx, face: dir, first: { t: start, x: cx + dir * d, speed: 58 + r() * 14 }, until: 0, xMin: 0, xMax: LW, beam: cx, stride });
    const seg = walk.segs.at(-1);
    let enters = seg.t1;   // when the walk crosses the entrance line (sampled finely)
    for (let t = seg.t0; t <= seg.t1; t += 1 / 240) {
      if (Math.abs(walkAt(walk, t, stride, {}).x - cx) >= ENTRY) { enters = t; break; }
    }
    walk.cursor = 0;
    const rest = [];
    for (let t = seg.t1 + 0.4 + r() * 1.6; t < 900;) { const b = 2.2 + r(); rest.push([t, t + b]); t += b + 2.4 + r() * 2.6; }
    return { k, left, y0, wall, heap, arm, dir, ceiling, start, walk, arrive: seg.t1, x1: cx + dir * d, rest, enters };
  });
}

// Shocks: an ink zig-zag flashes along the grid, and each fly hops off the wall for a beat.
export const shockAt = tH => {
  let f = 0;
  for (const p of H.pulses) if (tH >= p && tH < p + 0.15) f = Math.max(f, 1 - (tH - p) / 0.15);
  return f;
};
// The shock symbol: how many pulses so far (shown during OCT), its pop after each pulse, and its
// opacity: faint between pulses while OCT flows, full at a pulse, gone once OCT is out.
export const boltAt = tH => {
  if (tH == null || tH < H.pulses[0]) return { n: 0, pop: 0, alpha: 0 };
  const n = H.pulses.filter(p => tH >= p).length;
  const since = tH - H.pulses[n - 1];
  const pop = Math.max(0, 1 - since / 0.28);
  const out = clamp01((tH - H.octOut) / 0.3);
  return { n, pop, alpha: (0.4 + 0.6 * pop) * (1 - out) };
};
// What flows into the tube now (the hose's tag and its moving texture), or null.
export const feedAt = tH =>
  tH == null || tH >= H.mchOut ? null : tH < H.octOut ? "oct" : tH < H.mchIn ? "air" : "mch";

const hopAt = (tH, k) => {
  for (const p of H.pulses) {
    const u = (tH - p - 0.02 * (k % 3)) / 0.32;
    if (u >= 0 && u < 1) return Math.sin(Math.PI * u);
  }
  return 0;
};

// The fly's transform at a moment: `tWall` is the training clock (walks on the wall), `tH` the
// time since "Train the flies" (null before), `groundOffset` the thorax's height above its feet.
export function flyPose(f, l, tWall, tH, stride, frames, groundOffset) {
  const cx = l.x + LW / 2, tx = cx - TW / 2;
  const wallPose = tw => {
    const st = walkAt(f.wall, tw, stride / K, frames);
    // left wall: feet to the left, rotate 90° (forward = down); right wall: −90° (forward = up)
    const x = f.left ? tx + groundOffset : tx + TW - groundOffset;
    return { x, y: f.y0 + (st.x - VIRT / 2) * K, rot: f.left ? 90 : -90, sx: f.left ? st.face : -st.face, sy: 1, seq: st.seq, frame: st.frame };
  };
  if (tH == null || tH < H.tap[0]) {
    const p = wallPose(tWall);
    const hop = tH == null ? 0 : hopAt(tH, f.k);
    if (hop) { p.x += (f.left ? 1 : -1) * 6 * hop; p.seq = "stand"; p.frame = 0; }
    return p;
  }
  const lift = H.slide[1] <= tH ? DROP : tH > H.slide[0] ? DROP * smooth((tH - H.slide[0]) / (H.slide[1] - H.slide[0])) : 0;
  const heap = { x: cx + f.heap.dx, y: JOINT + EH / 2 + f.heap.dy + lift, rot: f.heap.rot, sx: f.heap.face, sy: 1, seq: "stand", frame: 0 };
  if (tH < H.tap[1]) {   // tapped down: falling from the wall into the heap
    const from = wallPose(tWall - (tH - H.tap[0]));
    const u = easeIn((tH - H.tap[0]) / (H.tap[1] - H.tap[0]));
    return { ...heap, x: lerp(from.x, heap.x, u), y: lerp(from.y, heap.y, u), rot: lerp(from.rot, heap.rot, u), sx: u < 0.5 ? from.sx : heap.sx };
  }
  if (tH < f.start) return heap;
  let st = walkAt(f.walk, tH, stride, frames);
  if (tH >= f.arrive) {
    const g = f.rest.find(([a, b]) => tH >= a && tH < b);
    const [seq, frame] = g ? groomFrame(frames, g[0], g[1], tH) : ["stand", 0];
    st = { x: f.x1, face: f.dir, seq, frame };
  }
  const floor = ARM.y + ARM.h - 2, ceil = ARM.y + 2;
  const arm = { x: l.x + st.x, y: f.ceiling ? ceil + groundOffset : floor - groundOffset, rot: 0, sx: st.face, sy: f.ceiling ? -1 : 1, seq: st.seq, frame: st.frame };
  const u = smooth((tH - f.start) / 0.22);   // leaving the heap: the pose eases onto the floor or ceiling
  return u >= 1 ? arm : { ...arm, x: lerp(heap.x, arm.x, u), y: lerp(heap.y, arm.y, u), rot: lerp(heap.rot, 0, u) };
}

export const poseTransform = p =>
  `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.rot.toFixed(1)}) scale(${p.sx} ${p.sy})`;

// Flies counted into each arm by time tH, and the most recent entry (for the counter's pulse).
export function armCounts(flies, tH) {
  const n = { oct: 0, mch: 0 }, last = { oct: -Infinity, mch: -Infinity };
  for (const f of flies) if (tH != null && f.enters <= tH) { n[f.arm]++; last[f.arm] = Math.max(last[f.arm], f.enters); }
  return { n, last };
}

// The odour fronts: how much of the tube (from the top) and of the arms (from their ends) holds
// each odour, and where its back edge is, as fractions 0–1.
export function odourAt(tH, phase) {
  if (phase === "g" || tH == null) return { tube: { oct: [0, 0], mch: [0, 0] }, arms: 0.35 };
  const front = (a, b) => clamp01((tH - a) / (b - a));
  return {
    tube: {
      oct: [front(H.octOut, H.octOut + 0.4), front(H.octIn, H.octIn + 0.6)],
      mch: [front(H.mchOut, H.mchOut + 0.4), front(H.mchIn, H.mchIn + 0.6)],
    },
    arms: 0.35 + 0.65 * smooth((tH - H.armsFill[0]) / (H.armsFill[1] - H.armsFill[0])),
  };
}
export const TUBE_SPAN = { top: TOP, bottom: JOINT };
