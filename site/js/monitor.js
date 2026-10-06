// The activity monitor (PDF case): the tube drawing, the flies' motion and the seeded activity
// model, shared by the landing station (small, live) and step 1 (the chosen assay).
// docs/storyboards/pdf-openings.md, shots F–J.
//
// Everything is a function of time: walk–pause schedules and the time-lapse trajectories are
// built up front from fixed seeds, so a frozen frame (?t=) or a replay always looks the same.

import { mulberry32 } from "./prng.js";
import { groomFrame } from "./fly.js";

export const BINS = 48;      // half-hour bins per day
export const DAY_S = 2.8;    // one time-lapse day, seconds (shot H)
export const PEAK = 64;      // crossings per half hour that fill an actogram row

const NS = "http://www.w3.org/2000/svg";
const circ = (zt, c, w) => {
  const d = Math.min(Math.abs(zt - c), 24 - Math.abs(zt - c));
  return Math.exp(-((d / w) ** 2));
};

// ---------- the activity model (invented for this case: the sleep phenotype) ----------
// Crossings per half hour. By day both flies have a morning and an evening peak with a quiet
// midday siesta. At night the hTDP-43 WT fly sleeps in long bouts, while the mutant keeps waking.
// The mutant's rise before lights-on is weaker: it is in the bars but never narrated.
export function activity(kind, days, seed) {
  const r = mulberry32(seed);
  const mut = kind === "mut";
  const rows = [];
  for (let d = 0; d < days; d++) {
    const row = [];
    for (let b = 0; b < BINS; b++) {
      const zt = (b + 0.5) / 2;
      let a;
      if (zt < 12) {
        a = 0.95 * circ(zt, 0.75, 1.3) + 1.0 * circ(zt, 11.3, 1.5) + 0.16;
        if (zt > 3 && zt < 9 && r() < 0.45) a *= 0.12;            // siesta: many quiet half hours
      } else {
        a = (mut ? 0.2 : 0.5) * circ(zt, 23.7, 1.4);              // anticipation of lights-on
        if (r() < (mut ? 0.52 : 0.06)) a += mut ? 0.16 + 0.3 * r() : 0.06 + 0.1 * r();
      }
      row.push(Math.round(Math.max(0, a * (0.7 + 0.6 * r())) * 48));
    }
    rows.push(row);
  }
  return rows;
}

// ---------- walking and pausing in real time (decision 5) ----------
// A walk is not a glide. The fly sets off and stops within a step or two, surges a little with
// each tripod step, changes pace from one bout to the next and now and then hesitates mid-walk
// (legs still) before carrying on. Each walk's progress is worked out up front at GAIT_HZ, so
// a frozen frame and the beam crossings are still exact functions of time.
const GAIT_HZ = 120;
const smoothstep = u => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

// Progress (0 → 1) along one walk of `dist` units at a mean speed near `v`, sampled at GAIT_HZ.
// `calm` walks are one steady bout (the storyboard's opening walks, timed to the captions).
function gait(r, dist, v, stride, calm = false) {
  const n = calm || dist < 40 ? 1 : 1 + Math.floor(r() * (dist > 100 ? 3 : 2));   // 1–3 bouts
  const w = Array.from({ length: n }, () => 0.6 + r());
  const halt = Array.from({ length: n - 1 }, () => r() < 0.55);   // between bouts: a hesitation, or only a slow-down
  const sum = w.reduce((a, b) => a + b, 0);
  const vel = [];
  for (let i = 0; i < n; i++) {
    const d = dist * w[i] / sum, pace = calm ? 1 : 0.75 + 0.5 * r();
    const lo0 = i === 0 || halt[i - 1] ? 0 : 0.45, lo1 = i === n - 1 || halt[i] ? 0 : 0.45;
    const T = d / (pace * v) + 0.16, a = Math.min(0.14, T / 3), b = Math.min(0.18, T / 3);
    const m = Math.max(2, Math.round(T * GAIT_HZ));
    const bout = [];
    let run = 0, phase = 0;
    for (let k = 0; k < m; k++) {
      const tau = (k + 0.5) / GAIT_HZ;
      const env = Math.min(lo0 + (1 - lo0) * smoothstep(tau / a), lo1 + (1 - lo1) * smoothstep((T - tau) / b));
      const u = env * (1 + 0.4 * Math.cos(2 * Math.PI * phase));   // one push per tripod step
      bout.push(u);
      run += u;
      phase += u * pace * v / GAIT_HZ / (stride / 2);
    }
    bout.forEach(u => vel.push(u * d / dist / run));
    if (halt[i]) for (let k = Math.round((0.12 + 0.3 * r()) * GAIT_HZ); k > 0; k--) vel.push(0);
  }
  const prog = new Float32Array(vel.length + 1);
  for (let k = 0; k < vel.length; k++) prog[k + 1] = prog[k] + vel[k];
  prog[vel.length] = 1;
  return prog;
}

const progAt = (s, t) => {
  const u = Math.min(s.prog.length - 1, Math.max(0, (t - s.t0) * GAIT_HZ));
  const i = Math.min(s.prog.length - 2, Math.floor(u));
  return s.prog[i] + (s.prog[i + 1] - s.prog[i]) * (u - i);
};

// A seeded walk–pause schedule: walks between points (see gait), pauses (some spent grooming,
// long enough to raise, rub and lower the legs), turning at the start of a walk. Most walks
// cross the beam. `first` fixes the opening walk, so the beam is crossed when the storyboard
// needs it. `stride` is the fly's stride in the same units as x (for the steps' surges).
export function walkPause(seed, o) {
  const { until, xMin, xMax, beam, speed = [36, 68], pause = [0.5, 2.4], groom = 0.35, cross = 0.72, stride = 15 } = o;
  const r = mulberry32(seed), rg = mulberry32(seed + 7);   // the schedule, and the walks' gaits
  const segs = [];
  let t = o.from ?? 0, x = o.x, face = o.face ?? 1;
  const stay = (t1, act) => { segs.push({ t0: t, t1, x0: x, x1: x, act, face }); t = t1; };
  const walk = (x1, v, calm) => {
    if (x1 !== x) face = Math.sign(x1 - x);
    const prog = gait(rg, Math.abs(x1 - x), v, stride, calm);
    segs.push({ t0: t, t1: t + (prog.length - 1) / GAIT_HZ, x0: x, x1, act: "walk", face, prog });
    t = segs.at(-1).t1; x = x1;
  };
  if (o.first) {
    stay(o.first.t, "stand");
    walk(o.first.x, o.first.speed, true);
  }
  const far = () => (x < beam ? beam + 24 + r() * (xMax - beam - 24) : xMin + r() * (beam - 24 - xMin));
  const near = () => (x < beam ? xMin + r() * (beam - 24 - xMin) : beam + 24 + r() * (xMax - beam - 24));
  while (t < until) {
    const act = r() < groom ? "groom" : "stand";
    stay(t + (act === "groom" ? 2.2 + r() * 1.0 : pause[0] + r() * (pause[1] - pause[0])), act);
    let target = r() < cross ? far() : near();
    if (Math.abs(target - x) < 30) target = x + (x < (xMin + xMax) / 2 ? 44 : -44);
    walk(target, speed[0] + r() * (speed[1] - speed[0]), false);
  }
  // beam crossings, exactly: where each walk's progress passes the beam
  const crossings = [];
  for (const s of segs) {
    if (s.act !== "walk" || (s.x0 - beam) * (s.x1 - beam) >= 0) continue;
    const e = (beam - s.x0) / (s.x1 - s.x0);
    let k = 0;
    while (k < s.prog.length - 2 && s.prog[k + 1] < e) k++;
    crossings.push(s.t0 + (k + (e - s.prog[k]) / ((s.prog[k + 1] - s.prog[k]) || 1)) / GAIT_HZ);
  }
  return { segs, crossings, cursor: 0 };
}

// The fly's state at time t: position, facing, and which drawing to show. Leg frames follow the
// distance walked, so the feet never slide (and stand still while the fly hesitates); drawings
// change on twos (12 per second), the body moves every frame. `frames` is the sprite's frame
// counts (for grooming bouts).
export function walkAt(w, t, strideUnits, frames) {
  const { segs } = w;
  if (t < segs[0].t0) t = segs[0].t0;
  let i = Math.min(w.cursor, segs.length - 1);
  while (i > 0 && segs[i].t0 > t) i--;
  while (i < segs.length - 1 && segs[i].t1 <= t) i++;
  w.cursor = i;
  const s = segs[i];
  if (s.act === "walk") {
    const xAt = tt => s.x0 + (s.x1 - s.x0) * progAt(s, tt);
    const tq = Math.floor(t * 12) / 12;
    return { x: xAt(t), face: s.face, seq: "walk", frame: Math.floor(Math.abs(xAt(tq) - s.x0) / (strideUnits / 8)) };
  }
  if (s.act === "groom") {
    const [seq, frame] = groomFrame(frames, s.t0, s.t1, t);
    return { x: s.x0, face: s.face, seq, frame };
  }
  return { x: s.x0, face: s.face, seq: "stand", frame: 0 };
}

export const crossingsBy = (w, t) => {
  let n = 0;
  for (const c of w.crossings) { if (c > t) break; n++; }
  return n;
};
export const lastCrossing = (list, t) => {
  let last = -Infinity;
  for (const c of list) { if (c > t) break; last = c; }
  return last;
};

// ---------- the time-lapse days (shot H) ----------
// The fly walks while its activity says it is awake (faster when more active), turns now and
// then, and rests while it sleeps. Sampled at 120 Hz from a given start.
export function timelapse(bins, o) {
  const { x: x0, xMin, xMax, beam, dur, seed, vmax = 360, face: f0 = 1 } = o;
  const dt = 1 / 120;
  const n = Math.ceil(dur / dt) + 2;
  const xs = new Float32Array(n), dist = new Float32Array(n), face = new Int8Array(n);
  const r = mulberry32(seed);
  const binDur = DAY_S / BINS;
  const at = k => bins[Math.min(bins.length - 1, Math.max(0, k))];
  let x = x0, d = 0, dir = f0;
  const crossings = [];
  for (let k = 0; k < n; k++) {
    const t = k * dt;
    const i = Math.floor(t / binDur);
    const a = Math.min(1.2, (at(i - 1) + 2 * at(i) + at(i + 1)) / 4 / 40);   // smoothed over 1.5 h
    const v = a > 0.12 ? vmax * Math.min(1, a) : 0;
    if (v && r() < 0.7 * dt) dir = -dir;                                    // an occasional turn
    const prev = x;
    x += dir * v * dt;
    d += v * dt;
    if (x > xMax) { x = 2 * xMax - x; dir = -1; } else if (x < xMin) { x = 2 * xMin - x; dir = 1; }
    if ((prev - beam) * (x - beam) < 0) crossings.push(t);
    xs[k] = x; dist[k] = d; face[k] = dir;
  }
  return { xs, dist, face, dt, crossings, end: n - 1 };
}

export function lapseAt(L, t, strideUnits) {
  const idx = tt => Math.min(L.end, Math.max(0, Math.round(tt / L.dt)));
  const k = idx(t), kq = idx(Math.floor(t * 12) / 12);   // drawings on twos, body smooth
  const moving = L.dist[kq] - L.dist[Math.max(0, kq - 10)] > 0.5;
  return { x: L.xs[k], face: L.face[k], seq: moving ? "walk" : "stand", frame: Math.floor(L.dist[kq] / (strideUnits / 8)) };
}

// ---------- drawing ----------
// One tube, drawn at (x, y) with width w and height h: food at the left end, cotton plug at the
// right, the infrared beam across the middle with its emitter above and detector below.
export function tube({ x, y, w, h, beam, id = "", small = false }) {
  const food = Math.round(w * 0.15), plug = Math.round(w * 0.13);
  const r = h / 2;
  const sq = small ? "" : [0.3, 0.55, 0.8].map(f => {
    const yy = y + h * f, x0 = x + w - plug + 6;
    return `<path class="tube-plug-line" d="M${x0},${yy} q${plug * 0.18},-4 ${plug * 0.36},0 t${plug * 0.36},0"/>`;
  }).join("");
  const em = small ? 4 : 6;
  return `
    <g class="tube" data-lane="${id}">
      <clipPath id="tube-clip-${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath>
      <rect class="tube-glass" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>
      <g clip-path="url(#tube-clip-${id})">
        <rect class="tube-food" x="${x}" y="${y}" width="${food}" height="${h}"/>
        <rect class="tube-plug" x="${x + w - plug}" y="${y}" width="${plug}" height="${h}"/>
        ${sq}
      </g>
      <rect class="tube-outline" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>
      <rect class="beam-box" x="${beam - em}" y="${y - em * 1.6}" width="${em * 2}" height="${em * 1.2}" rx="1"/>
      <rect class="beam-box" x="${beam - em}" y="${y + h + em * 0.4}" width="${em * 2}" height="${em * 1.2}" rx="1"/>
      <line class="beam" data-lane="${id}" x1="${beam}" y1="${y - em * 0.4}" x2="${beam}" y2="${y + h + em * 0.4}"/>
    </g>`;
}

// A fly that walks in a tube: an outer <g> moved and mirrored each frame, holding the sprite.
export function tubeFly(flyNode, meta, { height }) {
  const g = document.createElementNS(NS, "g");
  g.setAttribute("class", "tube-fly");
  const node = flyNode(meta, { x: 0, y: 0, height, className: "fly" });
  g.append(node.el);
  const stride = meta.strideUnits * node.scale;
  const place = (x, y, face) => g.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${face} 1)`);
  return { g, node, stride, frames: meta.frames, groundOffset: meta.groundY * node.scale, place };
}

// Actogram bars for one fly, as SVG: one row per day (bins left to right, ZT0 → ZT24), the
// dark half shaded. A shorter last row (a day cut off at brain collection) gets no shading.
export function actogramRows(rows, { x, y, w, rowH, gap = 0, cls = "acto" }) {
  const bw = w / BINS;
  return rows.map((row, d) => {
    const base = y + (d + 1) * rowH + d * gap;
    const bars = row.map((v, b) => {
      const hh = Math.min(rowH - 3, (v / PEAK) * (rowH - 3));
      return `<rect class="${cls}-bar" data-d="${d}" data-b="${b}" x="${(x + b * bw + bw * 0.12).toFixed(2)}" y="${(base - hh).toFixed(2)}" width="${(bw * 0.76).toFixed(2)}" height="${hh.toFixed(2)}" data-h="${hh.toFixed(2)}" data-base="${base.toFixed(2)}"/>`;
    }).join("");
    return `
      <g class="${cls}-row" data-d="${d}">
        ${row.length === BINS ? `<rect class="${cls}-night" x="${x + w / 2}" y="${base - rowH + 1}" width="${w / 2}" height="${rowH - 1}"/>` : ""}
        <line class="${cls}-base" x1="${x}" y1="${base}" x2="${x + w}" y2="${base}"/>
        ${bars}
      </g>`;
  }).join("");
}
