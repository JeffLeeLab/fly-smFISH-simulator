// The Part 1 summary slide (16:9, 1920×1080, light background for white slides), the starting
// point for Part 2: case, genotypes and a locator for the neurons; the probe pair on the
// transcript map; mode verdicts; Claim and Uncertainty. One SVG serves as the on-page preview and
// the copied PNG. Empty fields stay as blank placeholders, so copying always works.

import { MODES } from "./content.js";
import { LIGHT } from "./export.js";
import { slideMap } from "./map.js";
import { regionLabel } from "./data.js";
import { BRAIN, BRAIN_BOX, NEURON_AT } from "./brain.js";
import { MB_AT, MB_BIG, projector } from "./mbanatomy.js";

const W = 1920, H = 1080;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

let measureCtx;
function wrap(text, font, max, maxLines) {
  measureCtx ||= document.createElement("canvas").getContext("2d");
  measureCtx.font = font;
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (measureCtx.measureText(next).width > max && line) { lines.push(line); line = w; } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S*$/, "")} …`;
  }
  return lines;
}

function textBlock(x, y, lines, size, family, fill, lh = 1.35, weight = 400, style = "normal") {
  return lines.map((l, i) => `<text x="${x}" y="${y + i * size * lh}" font-family="${family}" font-size="${size}" font-weight="${weight}" font-style="${style}" fill="${fill}">${esc(l)}</text>`).join("");
}

// The fly's drawing as markup for the slide: the theme's ink and wash variables give way to their
// light fallbacks, and strokes scale with the drawing. From the front the antennae go, as in step 2:
// they would make a face. `el` is the sprite frame's <g>; parts it shares with other frames
// (<use>) are written out in place, since a copied image can't follow references.
export function slideFly(el, { antennae = false } = {}) {
  const markup = [...el.children].map(c => (c.tagName === "use" ? document.querySelector(c.getAttribute("href")).outerHTML.replace(/ id="[^"]*"/, "") : c.outerHTML)).join("");
  return (antennae ? markup : markup.replace(/<path data-part="antenna_[a-z]+"[^>]*>(<\/path>)?/g, ""))
    .replace(/ vector-effect="non-scaling-stroke"/g, "")
    .replace(/var\(--fly-[a-z]+,\s*((?:[^()]|\([^()]*\))+)\)/g, "$1");
}

const ringsD = mp => mp.coordinates.map(poly => poly.map(r => "M" + r.map(p => `${p[0]},${p[1]}`).join("L") + "Z").join("")).join("");

// Per case: where one side's neurons sit in the brain frame, how they are drawn (`neurons(geo, sw)`,
// `sw` converting px to brain units) and the points the label line aims at; or, for a case seen from
// the side, its own drawing (`draw`) and fly view (`view`). A case without an entry gets the fly and
// brain only.
export const CASE_LOCATOR = {
  nmj: { view: "turned", file: "anatomy.json", draw: args => nmjLocator(args) },
  pdf: {
    at: NEURON_AT,
    neurons: (geo, sw) => `
    <path fill-rule="evenodd" d="${ringsD(geo.terminals.shape)}${ringsD(geo.axon.shape)}${geo.cells.map(c => ringsD(c.cytoplasm)).join("")}" fill="${LIGHT.mem}" fill-opacity=".42" stroke="${LIGHT.mem}" stroke-width="${sw(1.2)}"/>
    ${geo.cells.map(c => `<path d="${ringsD(c.nucleus)}" fill="${LIGHT.dapi}" fill-opacity=".55"/>`).join("")}`,
    bodies: geo => geo.cells.map(c => c.nucleus_centre),
  },
  // the mushroom bodies from the front: the 30 simulated Kenyon cells (anatomy.json), drawn larger
  // as in the descent; the schematic's calyx dashes give way to the real calyces
  mb: {
    at: MB_AT,
    file: "anatomy.json",
    brain: BRAIN.slice(0, 6),
    neurons: (A, sw) => {
      const p = projector(A)(0), k = MB_BIG;
      const xy = q => p(q).map(v => (v * k).toFixed(2)).join(",");
      return `<g fill="none" stroke="${LIGHT.mem}" stroke-width="${sw(1.1)}" stroke-opacity=".8" stroke-linecap="round" stroke-linejoin="round">
        ${A.cells.flatMap(c => c.paths).map(path => `<path d="M${path.filter((_, i) => i % 2 === 0 || i === path.length - 1).map(xy).join("L")}"/>`).join("")}</g>
        ${A.cells.map(c => { const [x, y] = p(c.soma); return `<circle cx="${(x * k).toFixed(2)}" cy="${(y * k).toFixed(2)}" r="${(4.4 * k).toFixed(2)}" fill="${LIGHT.mem}" fill-opacity=".55"/>`; }).join("")}`;
    },
    bodies: A => { const p = projector(A)(0); return A.cells.map(c => p(c.soma).map(v => v * MB_BIG)); },
  },
};

// Leg motor neuron: the step 2 descent's turned side view (anatomy.json, in the fly's µm). The fly
// with its thorax and near front leg ringed; beside it, the VNC and that leg with the one motor
// neuron in blue (its dendrites, its axon down the leg, its synaptic terminals in the femur).
const NMJ_BOX = [-240, -30, 700, 520];   // the inset's view of the fly, µm

function nmjLocator({ fly, geo: A, cells, right, top }) {
  const P = LIGHT;
  const iw = 260, ih = 150, ix = right - iw, iy = top - 10;
  const kb = Math.min((iw - 16) / (NMJ_BOX[2] - NMJ_BOX[0]), (ih - 12) / (NMJ_BOX[3] - NMJ_BOX[1]));
  const bx = ix + iw / 2 - ((NMJ_BOX[0] + NMJ_BOX[2]) / 2) * kb, by = iy + ih / 2 - ((NMJ_BOX[1] + NMJ_BOX[3]) / 2) * kb;
  const [vx, vy, vw, vh] = fly.viewBox;
  const kf = 130 / vh;                                     // the fly, 130 px tall
  const fx = ix - 56 - (vx + vw) * kf, fy = top + 4 - vy * kf;   // its thorax, at the sprite's 0,0
  const k10 = 1 / 10;                                      // µm → sprite units
  const cx = (NMJ_BOX[0] + NMJ_BOX[2]) / 2 * k10, cy = (NMJ_BOX[1] + NMJ_BOX[3]) / 2 * k10;
  const rx = fx + (cx - 6) * kf, ry = fy + (cy - 2) * kf, rr = 74 * kf;   // the ring: thorax and near front leg
  const out = [];
  out.push(`<g transform="translate(${fx} ${fy}) scale(${kf})" stroke-width="${1.5 / kf}" stroke-linejoin="round">${fly.markup}</g>`);
  out.push(`<circle cx="${rx}" cy="${ry}" r="${rr}" fill="none" stroke="${P.border}" stroke-width="2"/>`);
  for (const [px, py] of [[ix, iy], [ix, iy + ih]]) {
    const d = Math.hypot(px - rx, py - ry);
    out.push(`<line x1="${rx + ((px - rx) / d) * rr}" y1="${ry + ((py - ry) / d) * rr}" x2="${px}" y2="${py}" stroke="${P.border}" stroke-width="2"/>`);
  }
  out.push(`<clipPath id="nmj-inset"><rect x="${ix}" y="${iy}" width="${iw}" height="${ih}"/></clipPath>`);
  out.push(`<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="${P.bg}" stroke="${P.border}" stroke-width="2"/>`);
  const sw = w => w / kb;
  const leg = ["coxa_T1_right", "femur_T1_right", "tibia_T1_right", "tarsus_T1_right"]
    .map(part => fly.markup.match(new RegExp(`<path data-part="${part}"[^>]* d="([^"]+)"`))?.[1]).filter(Boolean)
    .map(d => `<path d="${d.replace(/-?\d*\.?\d+/g, n => (Number(n) * 10).toFixed(1))}" fill="none" stroke="${P.text2}" stroke-width="${sw(1.1)}" stroke-opacity=".55"/>`).join("");
  const N = A.neuron, T = A.terminals.world;
  const blue = `fill="none" stroke="${P.mem}" stroke-linecap="round" stroke-linejoin="round"`;
  out.push(`<g clip-path="url(#nmj-inset)"><g transform="translate(${bx} ${by}) scale(${kb})">
    ${leg}
    <path d="${A.vnc.outline}" fill="none" stroke="${P.text2}" stroke-width="${sw(1.5)}"/>
    <path d="${N.dendrites}" ${blue} stroke-width="${sw(0.6)}" stroke-opacity=".7"/>
    <path d="M${N.path.map(p => p.join(",")).join("L")}" ${blue} stroke-width="${sw(1.8)}"/>
    <g transform="translate(${T.at[0]} ${T.at[1]}) rotate(${T.rot}) scale(${T.k})">
      <path d="${A.terminals.branches}" ${blue} stroke-width="${sw(1.4) / T.k}"/>
      ${A.terminals.swellings.map(([x, y, a, b, r]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" transform="rotate(${r} ${x} ${y})" fill="${P.mem}"/>`).join("")}
    </g>
    <circle cx="${N.soma[0]}" cy="${N.soma[1]}" r="${Math.max(N.soma_r, sw(3.5))}" fill="${P.mem}"/>
  </g></g>`);
  // the label, under the inset, points at the cell body
  const nx = bx + N.soma[0] * kb, ny = by + N.soma[1] * kb;
  out.push(`<line x1="${nx}" y1="${ny + 7}" x2="${nx}" y2="${iy + ih + 14}" stroke="${P.text2}" stroke-width="1.5"/>`);
  out.push(`<text x="${nx}" y="${iy + ih + 40}" text-anchor="middle" font-family="${P.sans}" font-size="22" fill="${P.text2}">${esc(cells)}</text>`);
  return out.join("");
}

// The locator, the step 2 descent in one picture: the fly from the front with its head ringed,
// and the brain enlarged beside it, the neurons on both sides in the anatomy blue. The brain's
// frame has the head's centre at 0,0, at 10 µm per fly-sprite unit (step 2). Right-aligned at
// `right`; returns markup.
function locator({ fly, geo, cells, right, top, loc }) {
  if (loc?.draw && geo) return loc.draw({ fly, geo, cells, right, top });
  const P = LIGHT;
  const iw = 260, ih = 124;                                // the brain inset
  const ix = right - iw, iy = top;
  const kb = Math.min((iw - 24) / (BRAIN_BOX[2] - BRAIN_BOX[0]), (ih - 18) / (BRAIN_BOX[3] - BRAIN_BOX[1]));
  const bx = ix + iw / 2 - ((BRAIN_BOX[0] + BRAIN_BOX[2]) / 2) * kb, by = iy + ih / 2 - ((BRAIN_BOX[1] + BRAIN_BOX[3]) / 2) * kb;
  const [vx, vy, vw, vh] = fly.viewBox;
  const kf = 150 / vh;                                     // the fly, 150 px tall
  const fx = ix - 64 - (vx + vw) * kf, fy = top + 8 - vy * kf;   // its thorax, at the sprite's 0,0
  const hx = fx, hy = fy + 5.8 * kf, hr = 60 * kf;          // the head: centre and ring
  const out = [];
  out.push(`<g transform="translate(${fx} ${fy}) scale(${kf})" stroke-width="${1.5 / kf}" stroke-linejoin="round">${fly.markup}</g>`);
  out.push(`<circle cx="${hx}" cy="${hy}" r="${hr}" fill="none" stroke="${P.border}" stroke-width="2"/>`);
  for (const [cx, cy] of [[ix, iy], [ix, iy + ih]]) {
    const d = Math.hypot(cx - hx, cy - hy);
    out.push(`<line x1="${hx + ((cx - hx) / d) * hr}" y1="${hy + ((cy - hy) / d) * hr}" x2="${cx}" y2="${cy}" stroke="${P.border}" stroke-width="2"/>`);
  }
  out.push(`<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="${P.bg}" stroke="${P.border}" stroke-width="2"/>`);
  const sw = w => w / kb;
  const brain = (loc?.brain || BRAIN).map(([d, kind]) => kind === "line"
    ? `<path d="${d}" fill="none" stroke="${P.text2}" stroke-width="${sw(1.6)}" stroke-linecap="round"/>`
    : `<path d="${d}" fill="none" stroke="${P.text2}" stroke-width="${sw(1.1)}" stroke-dasharray="${sw(3)} ${sw(3)}" stroke-opacity=".7"/>`).join("");
  if (!loc || !geo) {   // a case without a locator entry (or its data): the fly and the empty brain
    out.push(`<g transform="translate(${bx} ${by}) scale(${kb})">${brain}</g>`);
    return out.join("");
  }
  const nrn = loc.neurons(geo, sw);
  out.push(`<g transform="translate(${bx} ${by}) scale(${kb})">${brain}
    <g transform="translate(${loc.at.x} ${loc.at.y})">${nrn}</g>
    <g transform="scale(-1 1) translate(${loc.at.x} ${loc.at.y})">${nrn}</g></g>`);
  // the label, under the inset, points at the left side's cell bodies
  const cc = loc.bodies(geo);
  const nx = bx + (loc.at.x + cc.reduce((s, p) => s + p[0], 0) / cc.length) * kb;
  const ny = by + (loc.at.y + cc.reduce((s, p) => s + p[1], 0) / cc.length) * kb;
  out.push(`<line x1="${nx}" y1="${ny + 7}" x2="${nx}" y2="${iy + ih + 14}" stroke="${P.text2}" stroke-width="1.5"/>`);
  out.push(`<text x="${nx}" y="${iy + ih + 40}" text-anchor="middle" font-family="${P.sans}" font-size="22" fill="${P.text2}">${esc(cells)}</text>`);
  return out.join("");
}

export function summarySVG({ c, s, date, g, art }) {
  const P = LIGHT;
  const out = [];
  const serifFont = px => `400 ${px}px Newsreader`;
  const sansFont = px => `400 ${px}px "Instrument Sans"`;
  const label = (x, y, text) => `<text x="${x}" y="${y}" font-family="${P.sans}" font-size="22" font-weight="600" letter-spacing="2" fill="${P.text2}">${text}</text>`;

  // header: the case, the two genotypes, and where the neurons are
  out.push(`<text x="80" y="104" font-family="${P.sans}" font-size="24" font-weight="600" letter-spacing="2.5" fill="${P.text2}">PART 1 SUMMARY</text>`);
  out.push(`<text x="80" y="170" font-family="${P.serif}" font-size="60" font-weight="500" fill="${P.text}">${esc(c.system)} · <tspan font-style="italic">${esc(c.target.gene)}</tspan></text>`);
  out.push(`<text x="80" y="218" font-family="${P.sans}" font-size="28" fill="${P.text2}">hTDP-43 WT vs hTDP-43 mutant</text>`);
  if (art) out.push(locator({ ...art, loc: CASE_LOCATOR[c.id], cells: c.cells, right: W - 80, top: 56 }));
  out.push(`<line x1="80" x2="${W - 80}" y1="256" y2="256" stroke="${P.grid}" stroke-width="2"/>`);

  // the probe pair on the transcript map
  let y = 306;
  out.push(label(80, y, "PROBE PAIR"));
  let kx = 262;
  for (const [k, n] of [["ch1", 1], ["ch2", 2]]) {
    out.push(`<circle cx="${kx + 10}" cy="${y - 8}" r="10" fill="${P[k]}"/><text x="${kx + 30}" y="${y}" font-family="${P.sans}" font-size="26" fill="${P.text}">smFISH ${n} · <tspan font-family="${P.mono}">${esc(regionLabel(s.pair[k]) || "–")}</tspan></text>`);
    kx += 320;
  }
  out.push(`<text x="${W - 80}" y="${y}" text-anchor="end" font-family="${P.sans}" font-size="22" fill="${P.text2}">Isoforms 5′ → 3′ · introns compressed</text>`);
  const map = slideMap(g, s.pair, { x: 80, y: y + 14, width: W - 160, P });
  out.push(map.svg);
  y += 14 + map.height + 24;
  out.push(`<line x1="80" x2="${W - 80}" y1="${y}" y2="${y}" stroke="${P.grid}" stroke-width="2"/>`);
  const top = y + 52, bottom = H - 122;

  // left: the verdicts, stacked at the largest size that fits; a long shortlist sets the three
  // groups side by side. Whatever still doesn't fit is counted ("+ 2 more"), never dropped silently.
  const groups = [["supported", "SUPPORTED"], ["ruled-out", "RULED OUT"], ["unresolved", "UNRESOLVED"]]
    .map(([v, name]) => [name, s.shortlist.filter(m => s.verdicts[m] === v).map(m => MODES[m].title)]);
  const layVerdicts = (size, cols) => {
    const lh = size * 1.3, cw = cols === 1 ? 700 : (740 - 2 * 28) / 3;
    const laid = groups.map(([name, titles]) => [name, titles.map(t => wrap(t, sansFont(size), cw, 3))]);
    const gh = ([, ts]) => 38 + Math.max(1, ts.flat().length) * lh + ts.length * 4;
    const h = cols === 1 ? laid.reduce((a, gr) => a + gh(gr) + 18, -18) : Math.max(...laid.map(gh));
    return { size, lh, cw, cols, laid, h };
  };
  let fit;
  for (const [size, cols] of [[28, 1], [25, 1], [22, 1], [24, 3], [22, 3], [20, 3]]) {
    fit = layVerdicts(size, cols);
    if (top + fit.h - 22 <= bottom) break;
  }
  let gx = 80, gy = top;
  fit.laid.forEach(([name, ts], i) => {
    if (fit.cols === 3) { gx = 80 + i * (fit.cw + 28); gy = top; }
    out.push(label(gx, gy, name));
    gy += 38;
    if (!ts.length) { out.push(`<text x="${gx}" y="${gy}" font-family="${P.sans}" font-size="${fit.size}" fill="${P.text2}">None</text>`); gy += fit.lh; }
    ts.some((lines, k) => {
      if (gy + (lines.length - 1 + (k < ts.length - 1 ? 1 : 0)) * fit.lh > bottom) {
        out.push(`<text x="${gx}" y="${gy}" font-family="${P.sans}" font-size="${fit.size}" fill="${P.text2}">+ ${ts.length - k} more</text>`);
        return true;
      }
      for (const line of lines) {
        out.push(`<text x="${gx}" y="${gy}" font-family="${P.sans}" font-size="${fit.size}" fill="${P.text}">${esc(line)}</text>`);
        gy += fit.lh;
      }
      gy += 4;
      return false;
    });
    gy += 18;
  });

  // right: Claim and Uncertainty, at the largest sizes that fit
  const rx = 900, rw = W - 80 - rx;
  const um = s.uncertainty.mode === "other" ? "Other" : s.uncertainty.mode ? MODES[s.uncertainty.mode].title : "";
  const unc = [um, s.uncertainty.why].filter(Boolean).join(": ");
  const fields = [["CLAIM · OUR LEADING EXPLANATION", s.claim], ["UNCERTAINTY · THE STRONGEST REMAINING ALTERNATIVE", unc]];
  let laid;
  for (const [size, max] of [[34, 3], [30, 3], [27, 4], [24, 4]]) {
    laid = fields.map(([name, text]) => ({ name, size, lines: text ? wrap(text, serifFont(size), rw, max) : null }));
    const h = laid.reduce((a, f) => a + 44 + (f.lines ? f.lines.length : 2) * f.size * 1.35 + 26, 0) - 26;
    if (top + h - 22 <= bottom) break;
  }
  let ry = top;
  for (const f of laid) {
    out.push(label(rx, ry, f.name));
    ry += 44;
    if (f.lines) {
      out.push(textBlock(rx, ry, f.lines, f.size, P.serif, P.text));
      ry += f.lines.length * f.size * 1.35 + 26;
    } else {
      const h = 2 * f.size * 1.35;
      out.push(`<rect x="${rx}" y="${ry - f.size * 0.6}" width="${rw}" height="${h}" fill="none" stroke="${P.grid}" stroke-width="2" stroke-dasharray="8 8"/>`);
      out.push(`<text x="${rx + 16}" y="${ry + 12}" font-family="${P.sans}" font-size="24" fill="${P.text2}">To write</text>`);
      ry += h + 26;
    }
  }

  // footer
  out.push(`<line x1="80" x2="${W - 80}" y1="${H - 84}" y2="${H - 84}" stroke="${P.grid}" stroke-width="2"/>`);
  out.push(`<text x="80" y="${H - 44}" font-family="${P.sans}" font-size="22" fill="${P.text2}">Simulated teaching data · ${esc(c.system)} · ${esc(date)}</text>`);
  out.push(`<text x="${W - 80}" y="${H - 44}" text-anchor="end" font-family="${P.serif}" font-size="24" fill="${P.text2}">smFISH Simulator</text>`);
  return out.join("");
}

export const SLIDE = { W, H };
