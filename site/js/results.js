// Step 6 results: the SuperPlot, read from the pre-computed tables (site/data/<case>/tables.json),
// so the validation gate covers everything shown. Exact values appear on hover and in a table
// for screen readers.
// SuperPlot (Lord et al. 2020): sub-units (cells) as faint small points, the 3 animal means as
// large points, mean ± SD across animals. Animals are told apart by shape, never by colour:
// colour belongs to the channel. Genotype is shown by position and label; control on the left.
// No p-values or stars: students judge the effect size against the spread.

import { mulberry32 } from "./prng.js";
import { CASES } from "./content.js";

const SHAPES = ["circle", "square", "triangle"];
const GENO = [["control", "WT"], ["mutant", "Mutant"]];

const fmt = (v, d = 1) => (v == null ? "–" : Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(d));

// Each measure: categories along the x-axis, and how to read animals and sub-units from the tables.
// The compartments, notes and small-point sources come from the case's `plot` config (content.js).
const SUBS = {
  cells: c => a => a.raw.cells.map(x => x[c]),
  lobes: () => a => a.raw.units.lobes,
};

export function measuresFor(cs) {
  const P = cs.plot;
  return {
    count: {
      label: "Spots in each compartment",
      axis: "spots",
      note: P.count.note,
      cats: P.count.cats.map(({ id: c, sub, unit }) => ({
        id: c, label: P.labels[c], fly: c, unit,
        animal: a => a.m.count[c],
        sub: sub ? SUBS[sub](c) : null,
      })),
    },
    nc_ratio: {
      label: "Nucleus vs cell body (N:C)",
      axis: "ratio",
      note: "Nuclear spots divided by cell-body spots. Small points: single cells.",
      cats: [{
        id: "nc", label: "Nucleus : cell body", fly: "cellbody", unit: "cells", animal: a => a.m.nc_ratio,
        sub: a => a.raw.cells.filter(x => x.cellbody > 0).map(x => x.nucleus / x.cellbody),
      }],
    },
    share_distal: {
      label: P.distal.label,
      axis: "proportion",
      note: P.distal.note,
      cats: [{ id: "distal", label: P.distal.catLabel, fly: P.distal.fly, animal: a => a.m.share_distal, sub: null }],
    },
    ts: {
      label: "Transcription sites",
      axis: "molecules",
      note: "Nascent molecules at each nucleus’s transcription site (0 where there is none). Small points: single nuclei.",
      cats: [{ id: "ts", label: "Transcription sites", fly: "nucleus", unit: "cells", animal: a => a.m.ts_level, sub: a => a.raw.cells.map(x => x.ts) }],
    },
    overlap: {
      label: "Spots in TDP-43 granules",
      axis: "share",
      note: "Share of spots on TDP-43 granules (the small, round puncta; large irregular aggregates are not counted). Dashed band: the share expected by chance, if the same spots were placed at random in the same compartment.",
      cats: P.overlap.map(c => ({
        id: `overlap-${c}`, label: P.labels[c], fly: c, sub: null,
        animal: a => a.m.overlap?.[c]?.observed ?? null,
        chance: a => a.m.overlap?.[c]?.chance ?? null,
      })),
    },
  };
}

// Built once per case; the plot functions take the case (object or id) and look it up here.
const MEMO = new Map();
export const measuresOf = cs => {
  const c = typeof cs === "string" ? CASES[cs] : cs;
  if (!MEMO.has(c.id)) MEMO.set(c.id, measuresFor(c));
  return MEMO.get(c.id);
};

function niceCeil(x) {
  if (x <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(x));
  return [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map(m => m * p).find(v => v >= x);
}

// Fixed y-scale per measure for the whole case, so switching channel or pair never rescales.
export function fixedScales(tables, cs) {
  const max = {};
  for (const [mid, m] of Object.entries(measuresOf(cs))) {
    let hi = 0;
    for (const entry of Object.values(tables.selections)) {
      for (const ch of entry.channels) {
        for (const [g] of GENO) {
          for (const an of entry[g].animals) {
            const a = an[ch];
            for (const c of m.cats) {
              hi = Math.max(hi, c.animal(a) ?? 0, ...(c.sub ? c.sub(a) : []), c.chance ? (c.chance(a) ?? 0) : 0);
            }
          }
        }
      }
    }
    max[mid] = niceCeil(hi * 1.04);
  }
  return max;
}

function ticks(max) {
  const step = niceCeil(max / 4);
  const out = [];
  for (let v = 0; v <= max + 1e-9; v += step) out.push(+v.toFixed(6));
  return out;
}

function shapePath(shape, x, y, r) {
  if (shape === "circle") return `M${x - r},${y}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
  if (shape === "square") { const s = r * 0.9; return `M${x - s},${y - s}h${2 * s}v${2 * s}h${-2 * s}z`; }
  const h = r * 1.15;
  return `M${x},${y - h}L${x + h},${y + h * 0.75}L${x - h},${y + h * 0.75}z`;
}

const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = xs => (xs.length > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - mean(xs)) ** 2, 0) / (xs.length - 1)) : 0);

// Exact values, for the hover on a genotype's column and the screen-reader table: unit and decimals.
const UNIT = { count: " spots", ts: " molecules" };
const digits = measure => (measure === "count" || measure === "ts" ? 1 : 3);

// One category × genotype: the animals' values, their mean ± SD, and the chance level if any.
function summary(entry, channel, c, g) {
  const animals = entry[g].animals.map(an => an[channel]);
  const vals = animals.map(c.animal).filter(v => v != null);
  const ch = c.chance ? animals.map(c.chance).filter(v => v != null) : [];
  return { animals, vals, mu: vals.length ? mean(vals) : null, s: sd(vals), chance: ch.length ? mean(ch) : null, chLo: Math.min(...ch), chHi: Math.max(...ch) };
}

// Returns SVG markup. `pal` holds colours (CSS variables on screen, resolved values for export).
// Each compartment sits in its own band (every other one tinted), named at the top; WT | Mutant
// along the foot of the band.
export function plotSVG({ entry, channel, measure, yMax, width, height, pal, seed = 1, font = 1, cs }) {
  const m = measuresOf(cs)[measure];
  const L = 52 * font, R = 10, T = 4, HEAD = 26 * font, B = 24 * font;
  const pw = width - L - R, top = T + HEAD, ph = height - top - B;
  const y = v => top + ph - (Math.min(v, yMax) / yMax) * ph;
  const rand = mulberry32(seed);
  const nCat = m.cats.length;
  const catW = pw / Math.max(nCat, 2);
  const x0 = L + (pw - catW * nCat) / 2;
  const fs = 11 * font;
  const d = digits(measure);
  const parts = [];

  m.cats.forEach((c, ci) => {
    if (pal.band && ci % 2 === 0) parts.push(`<rect x="${x0 + catW * ci}" y="${T}" width="${catW}" height="${HEAD + ph + B}" fill="${pal.band}"/>`);
  });
  for (const t of ticks(yMax)) {
    parts.push(`<line x1="${L}" x2="${L + pw}" y1="${y(t)}" y2="${y(t)}" stroke="${pal.grid}" stroke-width="1"/>`);
    parts.push(`<text x="${L - 6}" y="${y(t) + fs * 0.35}" text-anchor="end" font-size="${fs}" font-family="${pal.mono}" fill="${pal.text2}">${+t.toFixed(3)}</text>`);
  }
  parts.push(`<text transform="translate(${12 * font},${top + ph / 2}) rotate(-90)" text-anchor="middle" font-size="${fs}" font-family="${pal.sans}" fill="${pal.text2}">${m.axis}</text>`);

  m.cats.forEach((c, ci) => {
    const cx = x0 + catW * (ci + 0.5);
    // both genotypes' values, shown when the name has keyboard focus (the columns' hover, for keys)
    const both = GENO.map(([g, short]) => {
      const sm = summary(entry, channel, c, g);
      return sm.mu == null ? "" : `&#10;${short}: ${fmt(sm.mu, d)} ± ${fmt(sm.s, d)}${UNIT[measure] || ""}${sm.chance != null ? `, chance ${fmt(sm.chance, 3)}` : ""}`;
    }).join("");
    parts.push(`<g class="splot__cat" data-fly="${c.fly}" data-tip="${c.label}${both}&#10;(mean ± SD, n = 3 animals)" tabindex="0" role="button" aria-label="Show ${c.label} in the viewer">
      <rect x="${cx - catW / 2}" y="${T}" width="${catW}" height="${HEAD}" fill="transparent"/>
      <text x="${cx}" y="${T + 17 * font}" text-anchor="middle" font-size="${12 * font}" font-weight="600" font-family="${pal.sans}" fill="${pal.text}">${c.label}</text></g>`);
    GENO.forEach(([g, short], gi) => {
      const gx = cx + (gi ? 1 : -1) * Math.min(catW * 0.21, 64);
      const colW = Math.min(catW * 0.4, 96);
      parts.push(`<text x="${gx}" y="${top + ph + 16 * font}" text-anchor="middle" font-size="${fs}" font-family="${pal.mono}" fill="${pal.text2}">${short}</text>`);
      const sm = summary(entry, channel, c, g);
      const { animals } = sm;
      // the column: hovering it (off the points) gives the exact mean ± SD
      if (sm.mu != null) {
        const tip = `${short} · ${c.label}&#10;${fmt(sm.mu, d)} ± ${fmt(sm.s, d)}${UNIT[measure] || ""} (mean ± SD, n = ${sm.vals.length} animals)${sm.chance != null ? `&#10;expected by chance: ${fmt(sm.chance, 3)}` : ""}`;
        parts.push(`<rect class="splot__col" x="${gx - colW / 2}" y="${top}" width="${colW}" height="${ph}" fill="transparent" data-tip="${tip}"/>`);
      }
      // chance band (TDP-43 overlap)
      if (sm.chance != null) {
        parts.push(`<rect x="${gx - 30}" y="${y(sm.chHi) - 2}" width="60" height="${Math.max(4, y(sm.chLo) - y(sm.chHi) + 4)}" fill="${pal.text2}" opacity=".10" pointer-events="none"/>`);
        parts.push(`<line x1="${gx - 30}" x2="${gx + 30}" y1="${y(sm.chance)}" y2="${y(sm.chance)}" stroke="${pal.text2}" stroke-width="1.5" stroke-dasharray="4 3" pointer-events="none"/>`);
      }
      // sub-units
      animals.forEach((a, ai) => {
        if (!c.sub) return;
        for (const v of c.sub(a)) {
          const jx = gx + (rand() - 0.5) * Math.min(catW * 0.3, 40);
          parts.push(`<path d="${shapePath(SHAPES[ai], jx, y(v), 2.4 * font)}" fill="${pal.ink}" opacity=".35" pointer-events="none"/>`);
        }
      });
      // mean ± SD across animals
      if (sm.mu != null) {
        parts.push(`<line x1="${gx}" x2="${gx}" y1="${y(sm.mu + sm.s)}" y2="${y(Math.max(0, sm.mu - sm.s))}" stroke="${pal.text}" stroke-width="1.5" pointer-events="none"/>`);
        parts.push(`<line x1="${gx - 16}" x2="${gx + 16}" y1="${y(sm.mu)}" y2="${y(sm.mu)}" stroke="${pal.text}" stroke-width="2.2" pointer-events="none"/>`);
      }
      // animal means
      animals.forEach((a, ai) => {
        const v = c.animal(a);
        if (v == null) return;
        const ax = gx + (ai - 1) * 10 * font;
        const cells = c.sub ? c.sub(a).length : null;
        const extra = measure === "ts" ? ` · sites in ${a.m.ts_number} of ${cells} nuclei` : cells != null ? ` · ${cells} ${c.unit}` : "";
        parts.push(`<path class="splot__pt" data-animal="${ai + 1}" data-tip="${short} · animal ${ai + 1} · ${fmt(v, d)}${UNIT[measure] || ""}${extra}" tabindex="-1"
          d="${shapePath(SHAPES[ai], ax, y(v), 5.2 * font)}" fill="${pal.ink}" stroke="${pal.bg}" stroke-width="${1.5 * font}"/>`);
      });
    });
  });
  return parts.join("");
}

// The same numbers as a table for screen readers (the plot's text alternative).
export function plotTable(entry, pair, channel, measure, cs) {
  const m = measuresOf(cs)[measure], d = digits(measure);
  const chance = m.cats.some(c => c.chance);
  return `<table class="vh"><caption>${plotTitle(pair, channel, measure, cs)}</caption>
    <thead><tr><th scope="col">Compartment</th><th scope="col">Genotype</th><th scope="col">Mean ± SD${UNIT[measure] ? ` (${UNIT[measure].trim()})` : ""}</th>${chance ? `<th scope="col">Expected by chance</th>` : ""}</tr></thead>
    <tbody>${m.cats.flatMap(c => GENO.map(([g, short]) => {
      const sm = summary(entry, channel, c, g);
      return `<tr><th scope="row">${c.label}</th><td>${short}</td><td>${sm.mu == null ? "–" : `${fmt(sm.mu, d)} ± ${fmt(sm.s, d)}`}</td>${chance ? `<td>${sm.chance == null ? "–" : fmt(sm.chance, 3)}</td>` : ""}</tr>`;
    })).join("")}</tbody></table>`;
}

export function plotTitle(pair, channel, measure, cs) {
  const who = channel === "ch1" ? `${pair.ch1} (smFISH 1)` : channel === "ch2" ? `${pair.ch2} (smFISH 2)` : `${pair.ch1} + ${pair.ch2} (white, both regions)`;
  return `${who} · ${measuresOf(cs)[measure].label} · mean ± SD, n = 3 animals · simulated data`;
}
