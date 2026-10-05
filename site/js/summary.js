// The Part 2 summary slide (16:9, 1920×1080, light background for white slides): case, probe
// pair, mode verdicts, Claim and Uncertainty, with the four headings students complete in
// PowerPoint. One SVG serves as the on-page preview and the copied PNG. Empty fields stay as
// blank placeholders, so copying always works.

import { MODES } from "./content.js";
import { LIGHT } from "./export.js";

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

export function summarySVG({ c, s, date }) {
  const P = LIGHT;
  const out = [];
  const serifFont = (px, st = "normal") => `${st} 400 ${px}px Newsreader`;
  const sansFont = px => `400 ${px}px "Instrument Sans"`;

  // header
  out.push(`<text x="80" y="112" font-family="${P.sans}" font-size="24" font-weight="600" letter-spacing="2.5" fill="${P.text2}">PART 2 · EXPERIMENTAL PLAN</text>`);
  out.push(`<text x="80" y="182" font-family="${P.serif}" font-size="60" font-weight="500" fill="${P.text}">${esc(c.system)} · <tspan font-style="italic">${esc(c.target.gene)}</tspan></text>`);
  out.push(`<line x1="80" x2="${W - 80}" y1="226" y2="226" stroke="${P.grid}" stroke-width="2"/>`);

  // left column: the experiment
  let y = 290;
  out.push(`<text x="80" y="${y}" font-family="${P.sans}" font-size="22" font-weight="600" letter-spacing="2" fill="${P.text2}">PROBE PAIR</text>`);
  y += 48;
  for (const [k, n, color] of [["ch1", 1, P.ch1], ["ch2", 2, P.ch2]]) {
    out.push(`<circle cx="92" cy="${y - 10}" r="10" fill="${color}"/><text x="114" y="${y}" font-family="${P.sans}" font-size="30" fill="${P.text}">smFISH ${n} · <tspan font-family="${P.mono}">${esc(s.pair[k] || "–")}</tspan></text>`);
    y += 46;
  }
  y += 24;
  for (const [v, label] of [["supported", "SUPPORTED"], ["ruled-out", "RULED OUT"], ["unresolved", "UNRESOLVED"]]) {
    const modes = s.shortlist.filter(m => s.verdicts[m] === v);
    out.push(`<text x="80" y="${y}" font-family="${P.sans}" font-size="22" font-weight="600" letter-spacing="2" fill="${P.text2}">${label}</text>`);
    y += 40;
    if (!modes.length) { out.push(`<text x="80" y="${y}" font-family="${P.sans}" font-size="26" fill="${P.text2}">None</text>`); y += 40; }
    for (const m of modes) {
      for (const line of wrap(MODES[m].title, sansFont(28), 640, 2)) {
        out.push(`<text x="80" y="${y}" font-family="${P.sans}" font-size="28" fill="${P.text}">${esc(line)}</text>`);
        y += 38;
      }
      y += 4;
    }
    y += 18;
  }

  // right column: claim, uncertainty, and the headings completed in PowerPoint
  const rx = 820, rw = W - 80 - rx;
  let ry = 290;
  const field = (label, text, placeholder, lines, size) => {
    out.push(`<text x="${rx}" y="${ry}" font-family="${P.sans}" font-size="22" font-weight="600" letter-spacing="2" fill="${P.text2}">${label}</text>`);
    ry += 46;
    if (text) {
      const ls = wrap(text, serifFont(size), rw, lines);
      out.push(textBlock(rx, ry, ls, size, P.serif, P.text));
      ry += Math.max(1, ls.length) * size * 1.35 + 30;
    } else {
      const h = lines * size * 1.35;
      out.push(`<rect x="${rx}" y="${ry - size}" width="${rw}" height="${h}" fill="none" stroke="${P.grid}" stroke-width="2" stroke-dasharray="8 8"/>`);
      out.push(`<text x="${rx + 16}" y="${ry + 4}" font-family="${P.sans}" font-size="24" fill="${P.text2}">${placeholder}</text>`);
      ry += h + 30 - size;
    }
  };
  field("CLAIM · OUR LEADING EXPLANATION", s.claim, "To write", 4, 34);
  const um = s.uncertainty.mode === "other" ? "Other" : s.uncertainty.mode ? MODES[s.uncertainty.mode].title : "";
  const unc = [um, s.uncertainty.why].filter(Boolean).join(": ");
  field("UNCERTAINTY · THE STRONGEST REMAINING ALTERNATIVE", unc, "To write", 3, 30);

  const boxes = [
    ["INTERVENTION", "One specific molecular change"],
    ["CONTROLS", "What makes the comparison interpretable"],
    ["READOUTS", `Molecular, plus organismal: ${c.readout}`],
    ["FAILURE CRITERION", "A result that would undermine the claim"],
  ];
  const bw = (rw - 24) / 2, bh = Math.max(110, (H - 140 - ry) / 2 - 12);
  boxes.forEach(([label, hint], i) => {
    const bx = rx + (i % 2) * (bw + 24), by = ry + Math.floor(i / 2) * (bh + 24);
    out.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="none" stroke="${P.grid}" stroke-width="2"/>`);
    out.push(`<text x="${bx + 20}" y="${by + 40}" font-family="${P.sans}" font-size="20" font-weight="600" letter-spacing="2" fill="${P.text2}">${label}</text>`);
    out.push(textBlock(bx + 20, by + 78, wrap(hint, sansFont(22), bw - 40, 2), 22, P.sans, P.text2, 1.3, 400, "italic"));
  });

  // footer
  out.push(`<line x1="80" x2="${W - 80}" y1="${H - 84}" y2="${H - 84}" stroke="${P.grid}" stroke-width="2"/>`);
  out.push(`<text x="80" y="${H - 44}" font-family="${P.sans}" font-size="22" fill="${P.text2}">Simulated teaching data · ${esc(c.system)} · ${esc(date)}</text>`);
  out.push(`<text x="${W - 80}" y="${H - 44}" text-anchor="end" font-family="${P.serif}" font-size="24" fill="${P.text2}">smFISH Simulator</text>`);
  return out.join("");
}

export const SLIDE = { W, H };
