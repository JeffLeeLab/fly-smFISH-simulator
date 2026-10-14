// The three-assay landing (storyboard shot F): one drawing per station, each split into a WT lane
// (left) and a mutant lane (right). All three run live: the activity monitor (flies walking and
// pausing, the beam, a tiny actogram in which the mutant's night bars stand out), the climbing
// vial (the moment after a climb: most WT flies high, the mutants low, shaking) and the T-maze
// (flies resting and grooming in the arms).

import { activity, walkPause, walkAt, lastCrossing, tube, tubeFly, actogramRows } from "./monitor.js";
import { flyNode, groomFrame } from "./fly.js";
import { mulberry32 } from "./prng.js";
import { odourDefs, driftOdours, swatch } from "./tmaze.js";
import { LANES as VIAL_LANES, VW as VIAL_W, FLOOR as VIAL_FLOOR, vialMarkup, tapeMarkup, laneFlies as vialFlies, ambientPose as vialPose, poseTransform } from "./vial.js";

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
// The step 1 drawing of the taped pair, scaled into the station, with five flies per vial where
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
        <line class="bench" x1="${b[0]}" y1="${VIAL_FLOOR + 4.6}" x2="${b[1]}" y2="${VIAL_FLOOR + 4.6}"/>
        ${VIAL_LANES.map(l => vialMarkup(l)).join("")}${tapeMarkup()}
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
// arm, away from the shocked odour; the mutants split half and half. They stand and groom.
const MAZE = { tubeY: 18, tubeH: 66, tubeW: 18, armY: 100, armH: 18, dock: 11 };
const MAZE_FLY = { h: 13, vh: 197.8, ground: 118 };   // side-view sprite: frame height, thorax to feet
const MAZE_LANES = [   // [dx from the lane centre, on the ceiling?] per arm
  { id: "wt", seed: 61, oct: [[-44, 0]], mch: [[24, 0], [33, 1], [46, 0], [56, 1]] },
  { id: "mut", seed: 73, oct: [[-24, 1], [-36, 0], [-52, 1]], mch: [[26, 0], [42, 1], [55, 0]] },   // half and half: chance
];

function mazeFlies(l, cx) {
  const k = MAZE_FLY.h / MAZE_FLY.vh, g = MAZE_FLY.ground * k;
  const fly = ([dx, up], face) => {
    const y = up ? MAZE.armY + 1 + g : MAZE.armY + MAZE.armH - 1 - g;
    return `<g class="fly maze-fly" transform="translate(${cx + dx} ${y.toFixed(2)}) scale(${(face * k).toFixed(4)} ${(up ? -k : k).toFixed(4)})"><use href="#fly-lateral-stand-0"/></g>`;
  };
  return l.oct.map((f, i) => fly(f, i % 2 ? 1 : -1)).join("") + l.mch.map((f, i) => fly(f, i % 3 === 2 ? -1 : 1)).join("");
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
          <g class="maze-flies">${mazeFlies(l, cx)}</g>
        </g>`;
      }).join("")}
    </svg>`;
}

// The station's flies stand and groom on seeded schedules, never in step; the odours drift.
// Returns draw(t).
export function startMiniMaze(svg, meta) {
  const flies = [...svg.querySelectorAll(".maze-fly use")].map((use, i) => {
    const r = mulberry32(97 + i * 13);
    const bouts = [];
    for (let t = r() * 4; t < 900;) { const b = 2.2 + r(); bouts.push([t, t + b]); t += b + 2.4 + r() * 3.6; }
    return { use, bouts, shown: "" };
  });
  return t => {
    for (const f of flies) {
      const g = f.bouts.find(([a, b]) => t >= a && t < b);
      const [seq, k] = g ? groomFrame(meta.frames, g[0], g[1], t) : ["stand", 0];
      const id = `#fly-lateral-${seq}-${k}`;
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
