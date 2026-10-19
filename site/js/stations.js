// The three-assay landing (storyboard shot F): one drawing per station, each split into a WT lane
// (left) and a mutant lane (right). All three run live: the activity monitor (flies walking and
// pausing, the beam, a tiny actogram in which the mutant's night bars stand out), the climbing
// vial (the moment after a climb: most WT flies high, the mutants low, shaking) and the T-maze
// (flies walking, pausing and grooming in the arms).

import { activity, walkPause, walkAt, gait, GAIT_HZ, lastCrossing, tube, tubeFly, actogramRows } from "./monitor.js";
import { flyNode } from "./fly.js";
import { mulberry32 } from "./prng.js";
import { odourDefs, driftOdours, swatch } from "./tmaze.js";
import { LANES as VIAL_LANES, VW as VIAL_W, FLOOR as VIAL_FLOOR, vialMarkup, laneFlies as vialFlies, ambientPose as vialPose, poseTransform } from "./vial.js";

const VB = "0 0 320 180";
const LANE_X = [10, 170], LANE_W = 140;

// ---------- activity monitor (live) ----------
const MINI = { tubeY: 30, tubeH: 26, beam: 71, xMin: 36, xMax: 108, flyH: 18.8, actoY: 86, rowH: 22 };
const MINI_LANES = [
  { id: "wt", seed: 31, x: 46, face: 1 },
  { id: "mut", seed: 47, x: 96, face: -1 },
];

function monitorArt() {
  return `
    <svg viewBox="${VB}" aria-hidden="true" class="station-svg station-svg--monitor">
      ${MINI_LANES.map((l, i) => {
        const x = LANE_X[i];
        return `
        <g class="mini-lane" data-lane="${l.id}">
          ${tube({ x, y: MINI.tubeY, w: LANE_W, h: MINI.tubeH, beam: x + MINI.beam, id: `mini-${l.id}`, small: true })}
          <g class="tube-flies"></g>
          <rect class="ld-day" x="${x}" y="${MINI.actoY - 9}" width="${LANE_W / 2}" height="4"/>
          <rect class="ld-night" x="${x + LANE_W / 2}" y="${MINI.actoY - 9}" width="${LANE_W / 2}" height="4"/>
          ${actogramRows(activity(l.id, 3, l.seed + 1), { x, y: MINI.actoY, w: LANE_W, rowH: MINI.rowH })}
        </g>`;
      }).join("")}
    </svg>`;
}

// Walking flies in the station's two tubes, from seeded schedules. Returns draw(t).
export function startMiniMonitor(svg, meta) {
  const lanes = MINI_LANES.map((l, i) => {
    const el = svg.querySelector(`.mini-lane[data-lane=${l.id}]`);
    const fly = tubeFly(flyNode, meta, { height: MINI.flyH });
    el.querySelector(".tube-flies").append(fly.g);
    return {
      x0: LANE_X[i], fly, beam: el.querySelector(".beam"),
      groundY: MINI.tubeY + MINI.tubeH - 1.5 - fly.groundOffset,
      w: walkPause(l.seed, { x: l.x, face: l.face, until: 900, xMin: MINI.xMin, xMax: MINI.xMax, beam: MINI.beam, speed: [14, 26], pause: [0.6, 2.8], stride: fly.stride }),
    };
  });
  return t => {
    for (const l of lanes) {
      const st = walkAt(l.w, t, l.fly.stride, l.fly.frames);
      l.fly.place(l.x0 + st.x, l.groundY, st.face);
      l.fly.node.show(st.seq, st.frame);
      const f = Math.max(0, 1 - (t - lastCrossing(l.w.crossings, t)) / 0.3);
      l.beam.style.strokeWidth = (1 + 1.6 * f).toFixed(2);
    }
  };
}

// ---------- climbing vial (live) ----------
// The step 1 drawing of the pair, scaled into the station, with five flies per vial where
// step 1's climbs leave them (most WT flies high on the wall, the mutants low). They stand head up
// and now and then climb a step; the mutants shake as they stand and slip back. No tapping here,
// so the loop stays calm. The flies are drawn larger than in step 1, to read at this size.
const VIAL_K = 0.42, VIAL_AT = [160 - 480 * VIAL_K, 90 - 226 * VIAL_K];
const VIAL_FLY_H = 30;                                       // in step 1 units (step 1: 18)
const VIAL_FLIES = { wt: [0, 1, 4, 5, 8], mut: [0, 1, 5, 6, 8] };

function vialArt() {
  const b = [VIAL_LANES[0].cx - VIAL_W / 2 - 30, VIAL_LANES[1].cx + VIAL_W / 2 + 30];
  return `
    <svg viewBox="${VB}" aria-hidden="true" class="station-svg station-svg--vial">
      <g transform="translate(${VIAL_AT[0].toFixed(1)} ${VIAL_AT[1].toFixed(1)}) scale(${VIAL_K})">
        <line class="vial-bench" x1="${b[0]}" y1="${VIAL_FLOOR + 4.6}" x2="${b[1]}" y2="${VIAL_FLOOR + 4.6}"/>
        ${VIAL_LANES.map(l => vialMarkup(l)).join("")}
      </g>
    </svg>`;
}

// The station's flies on their seeded schedules. Returns draw(t).
export function startMiniVial(svg, meta) {
  const lanes = VIAL_LANES.map(l => {
    const el = svg.querySelector(`.vial[data-lane=${l.id}] .vial-flies`);
    const probe = tubeFly(flyNode, meta, { height: VIAL_FLY_H });
    const all = vialFlies(l, probe.stride, probe.groundOffset);
    const flies = VIAL_FLIES[l.id].map((k, i) => {
      const node = i === 0 ? probe : tubeFly(flyNode, meta, { height: VIAL_FLY_H });
      el.append(node.g);
      return { ...all[k], node };
    });
    return { l, flies, stride: probe.stride, g: probe.groundOffset, frames: probe.frames };
  });
  return t => {
    for (const { l, flies, stride, g, frames } of lanes) {
      for (const f of flies) {
        const p = vialPose(l, f, t, g, stride, frames);
        f.node.g.setAttribute("transform", poseTransform(p));
        f.node.node.show(p.seq, p.frame);
      }
    }
  };
}

// ---------- T-maze (live once its case is available; a still otherwise) ----------
// Front-on, as in step 1, after the test: a short training tube, the elevator docked at the
// choice point, and the two arms with their odours (washes under textures). Most WT flies rest in the MCH
// arm, away from the shocked odour; the mutants split half and half. They walk, pause and groom.
const MAZE = { tubeY: 18, tubeH: 66, tubeW: 18, armY: 100, armH: 18, dock: 11 };
// Side-view sprite, in its own units (as in its meta): frame height, thorax to feet, stride, and
// how far the drawing reaches behind the thorax (wing tips) and ahead of it (front legs, grooming).
// The height keeps step 1's fly-to-arm proportion (15 in 36), so floor and ceiling flies clear
// each other.
const MAZE_FLY = { h: 7.5, vh: 197.8, ground: 118, stride: 70, back: 269, front: 146 };
const MAZE_K = MAZE_FLY.h / MAZE_FLY.vh;   // sprite units to station units
const MAZE_LANES = [   // flies per arm: [on the floor, on the ceiling]
  { id: "wt", seed: 61, oct: [1, 0], mch: [2, 2] },
  { id: "mut", seed: 73, oct: [1, 2], mch: [2, 1] },   // half and half: chance
];

// The flies on one floor or ceiling walk, pause and groom on seeded schedules between lo and hi
// (thorax x), as segments that monitor.js's walkAt plays. They keep their order and a body's
// length apart: each new walk or rest keeps clear of the stretch its neighbours hold until their
// own segments end, so two flies never meet. The opening places assume room for them (n ≤ 2).
function surfaceWalks(n, seed, lo, hi, gap, stride) {
  const r = mulberry32(seed), rg = mulberry32(seed + 7);   // the schedule, and the walks' gaits
  const flies = Array.from({ length: n }, (_, i) => {
    const x = n === 1 ? lo + r() * (hi - lo) : lo + (hi - lo) * i / (n - 1) + (i ? -4 : 4) * r();
    return { segs: [], cursor: 0, x, face: r() < 0.5 ? 1 : -1, t: 0, hold: [x, x], rest: true };
  });
  for (;;) {
    const f = flies.reduce((a, b) => (b.t < a.t ? b : a));   // the next fly to finish what it is doing
    if (f.t >= 900) break;
    const i = flies.indexOf(f);
    const a = Math.max(lo, i > 0 ? flies[i - 1].hold[1] + gap : lo);
    const b = Math.min(hi, i < n - 1 ? flies[i + 1].hold[0] - gap : hi);
    const x1 = a + r() * (b - a);
    if (f.rest || Math.abs(x1 - f.x) < 3) {
      const groom = r() < 0.35, t1 = f.t + (groom ? 2.2 + r() : 0.6 + r() * 2.2);
      f.segs.push({ t0: f.t, t1, x0: f.x, x1: f.x, act: groom ? "groom" : "stand", face: f.face });
      Object.assign(f, { t: t1, hold: [f.x, f.x], rest: false });
    } else {
      f.face = Math.sign(x1 - f.x);
      const prog = gait(rg, Math.abs(x1 - f.x), 6 + r() * 4, stride);
      const t1 = f.t + (prog.length - 1) / GAIT_HZ;
      f.segs.push({ t0: f.t, t1, x0: f.x, x1, act: "walk", face: f.face, prog });
      Object.assign(f, { t: t1, hold: [Math.min(f.x, x1), Math.max(f.x, x1)], x: x1, rest: true });
    }
  }
  return flies.map(f => ({ segs: f.segs, cursor: 0 }));
}

// Every station fly, per lane, as { up, w } (on the ceiling?, its walks); built once.
let mazeWalks = null;
function mazeFlyWalks() {
  if (mazeWalks) return mazeWalks;
  const back = MAZE_FLY.back * MAZE_K, gap = (MAZE_FLY.back + MAZE_FLY.front) * MAZE_K;
  const inner = MAZE.dock + back, outer = LANE_W / 2 - 4 - back;   // where a thorax may go, from the lane centre
  mazeWalks = MAZE_LANES.map(l => [["oct", -1], ["mch", 1]].flatMap(([arm, dir], a) => l[arm].flatMap((n, up) => {
    if (!n) return [];
    const [lo, hi] = dir < 0 ? [-outer, -inner] : [inner, outer];
    return surfaceWalks(n, l.seed + 10 * a + up, lo, hi, gap, MAZE_FLY.stride * MAZE_K).map(w => ({ up, w }));
  })));
  return mazeWalks;
}

const mazeTransform = (cx, up, x, face) => {
  const g = MAZE_FLY.ground * MAZE_K, y = up ? MAZE.armY + 1 + g : MAZE.armY + MAZE.armH - 1 - g;
  return `translate(${(cx + x).toFixed(2)} ${y.toFixed(2)}) scale(${(face * MAZE_K).toFixed(4)} ${(up ? -MAZE_K : MAZE_K).toFixed(4)})`;
};

function mazeFlies(i, cx) {
  return mazeFlyWalks()[i].map(({ up, w }) => `<g class="fly maze-fly" transform="${mazeTransform(cx, up, w.segs[0].x0, w.segs[0].face)}"><use href="#fly-lateral-stand-0"/></g>`).join("");
}

function mazeArt() {
  return `
    <svg viewBox="${VB}" aria-hidden="true" class="station-svg station-svg--maze">
      <defs>${odourDefs("mini")}</defs>
      ${MAZE_LANES.map((l, i) => {
        const x = LANE_X[i], cx = x + LANE_W / 2, tx = cx - MAZE.tubeW / 2, d = MAZE.dock;
        const a0 = x + 4, a1 = x + LANE_W - 4, ay = MAZE.armY, ah = MAZE.armH;
        const grid = Array.from({ length: 12 }, (_, j) => `M${tx},${MAZE.tubeY + j * 6} l${MAZE.tubeW},${MAZE.tubeW * 0.55} M${tx + MAZE.tubeW},${MAZE.tubeY + j * 6} l${-MAZE.tubeW},${MAZE.tubeW * 0.55}`).join(" ");
        return `
        <g class="mini-maze" data-lane="${l.id}">
          <clipPath id="mini-tube-${l.id}"><rect x="${tx}" y="${MAZE.tubeY}" width="${MAZE.tubeW}" height="${MAZE.tubeH}" rx="${MAZE.tubeW / 2}"/></clipPath>
          <rect class="tube-glass" x="${tx}" y="${MAZE.tubeY}" width="${MAZE.tubeW}" height="${MAZE.tubeH}" rx="${MAZE.tubeW / 2}"/>
          <path class="maze-grid" clip-path="url(#mini-tube-${l.id})" d="${grid}"/>
          <rect class="tube-outline" x="${tx}" y="${MAZE.tubeY}" width="${MAZE.tubeW}" height="${MAZE.tubeH}" rx="${MAZE.tubeW / 2}"/>
          <rect class="tube-glass" x="${a0}" y="${ay}" width="${a1 - a0}" height="${ah}"/>
          <rect class="odour odour--station" x="${a0}" y="${ay}" width="${cx - d - a0}" height="${ah}" fill="url(#oct-left-mini)"/>
          <rect class="odour odour--station" x="${cx + d}" y="${ay}" width="${a1 - cx - d}" height="${ah}" fill="url(#mch-right-mini)"/>
          <path class="tube-outline" d="M${cx - d},${ay} H${a0} V${ay + ah} H${cx - d} M${cx + d},${ay} H${a1} V${ay + ah} H${cx + d}"/>
          <rect class="maze-port" x="${a0 - 5}" y="${ay - 2}" width="5" height="${ah + 4}" rx="1"/>
          <rect class="maze-port" x="${a1}" y="${ay - 2}" width="5" height="${ah + 4}" rx="1"/>
          <rect class="maze-elevator" x="${cx - d}" y="${ay - 3}" width="${2 * d}" height="${ah + 6}" rx="1.5"/>
          ${swatch(a0, ay + ah + 11, "oct", 8)}<text class="station-odour" x="${a0 + 11}" y="${ay + ah + 15}">OCT</text>
          ${swatch(a1 - 8, ay + ah + 11, "mch", 8)}<text class="station-odour" x="${a1 - 11}" y="${ay + ah + 15}" text-anchor="end">MCH</text>
          <g class="maze-flies">${mazeFlies(i, cx)}</g>
        </g>`;
      }).join("")}
    </svg>`;
}

// The station's flies walk, pause and groom on their seeded schedules, never in step; the odours
// drift. Returns draw(t).
export function startMiniMaze(svg, meta) {
  const stride = MAZE_FLY.stride * MAZE_K;
  const flies = MAZE_LANES.flatMap((l, i) => {
    const cx = LANE_X[i] + LANE_W / 2;
    const els = svg.querySelectorAll(`.mini-maze[data-lane=${l.id}] .maze-fly`);
    return mazeFlyWalks()[i].map(({ up, w }, j) => ({ cx, up, w, g: els[j], use: els[j].firstElementChild, pose: "", shown: "" }));
  });
  return t => {
    for (const f of flies) {
      const st = walkAt(f.w, t, stride, meta.frames);
      const pose = mazeTransform(f.cx, f.up, st.x, st.face);
      if (pose !== f.pose) { f.g.setAttribute("transform", pose); f.pose = pose; }
      const id = `#fly-lateral-${st.seq}-${st.frame % (meta.frames[st.seq] || 1)}`;
      if (id !== f.shown) { f.use.setAttribute("href", id); f.shown = id; }
    }
    driftOdours(svg, "mini", t);
  };
}

export const stationArt = { pdf: monitorArt, nmj: vialArt, mb: mazeArt };

// Stations that run live on the landing: `start(svg, sprites)` returns draw(t); `handOff` names
// the hand-off to the case's step 1. A case without an entry keeps its still art.
export const stationLive = {
  pdf: { start: (svg, sprites) => startMiniMonitor(svg, sprites), handOff: "monitor" },
  nmj: { start: (svg, sprites) => startMiniVial(svg, sprites), handOff: "vial" },
  mb: { start: (svg, sprites) => startMiniMaze(svg, sprites), handOff: "maze" },
};
