// The three-assay landing (storyboard shot F): one drawing per station, each split into a WT lane
// (left) and a mutant lane (right). The activity monitor runs live (flies walking and pausing,
// the beam, a tiny actogram in which the mutant's night bars stand out); the climbing vial and
// the T-maze are stills in this build.

import { activity, walkPause, walkAt, lastCrossing, tube, tubeFly, actogramRows } from "./monitor.js";
import { flyNode } from "./fly.js";

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

// ---------- climbing vial (still) ----------
// Flies tapped to the bottom climb the wall; by the moment shown most WT flies are past the line,
// most mutants are still low.
// [x from the vial's centre, y]; each fly's legs face the nearer wall.
const CLIMB = {
  wt: [[-14, 34], [14, 46], [-14, 60], [14, 76], [-14, 150]],
  mut: [[-14, 154], [14, 142], [14, 160], [-14, 120], [14, 100]],
};

function vialArt() {
  return `
    <svg viewBox="${VB}" aria-hidden="true" class="station-svg">
      ${["wt", "mut"].map((id, i) => {
        const cx = LANE_X[i] + LANE_W / 2;
        return `
        <g>
          <rect class="tube-glass" x="${cx - 24}" y="12" width="48" height="158" rx="7"/>
          <rect class="tube-plug" x="${cx - 24}" y="12" width="48" height="12" rx="4"/>
          <rect class="tube-outline" x="${cx - 24}" y="12" width="48" height="158" rx="7"/>
          <line class="climb-line" x1="${cx - 32}" y1="86" x2="${cx + 32}" y2="86"/>
          ${CLIMB[id].map(([dx, y]) => `<g class="fly" transform="translate(${cx + dx} ${y}) rotate(-90) scale(0.072 ${dx < 0 ? -0.072 : 0.072})"><use href="#fly-lateral-stand-0"/></g>`).join("")}
        </g>`;
      }).join("")}
    </svg>`;
}

// ---------- T-maze (still) ----------
// After training, WT flies gather in the arm away from the punished odour; mutants split evenly.
const MAZE = { wt: [-48, -40, -30, -21, -56, 40], mut: [-50, -38, -24, 26, 38, 52] };

function mazeArt() {
  return `
    <svg viewBox="${VB}" aria-hidden="true" class="station-svg">
      ${["wt", "mut"].map((id, i) => {
        const x = LANE_X[i], cx = x + LANE_W / 2;
        const d = `M${x + 14},34 H${x + LANE_W - 14} A12,12 0 0 1 ${x + LANE_W - 14},58 H${cx + 11} V160 Q${cx + 11},168 ${cx + 3},168 H${cx - 3} Q${cx - 11},168 ${cx - 11},160 V58 H${x + 14} A12,12 0 0 1 ${x + 14},34 Z`;
        return `
        <g>
          <path class="tube-glass" d="${d}"/>
          <path class="tube-outline" d="${d}"/>
          ${MAZE[id].map((dx, k) => `<g class="fly" transform="translate(${cx + dx} ${44 + (k % 2) * 5}) rotate(${dx < 0 ? -90 : 90}) scale(0.042)"><use href="#fly-dorsal-stand-0"/></g>`).join("")}
        </g>`;
      }).join("")}
    </svg>`;
}

export const stationArt = { pdf: monitorArt, nmj: vialArt, mb: mazeArt };
