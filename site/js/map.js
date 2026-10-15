// Transcript map with the probe track (step 5), drawn as SVG from the public transcript models.
// Every gene runs 5′→3′ left to right. Introns are compressed by default (under 300 nt stay at
// exon scale; longer ones get a log width, at most 40% of the map, with a break mark and their
// true length); "To scale" shows true proportions with a 2 kb bar. Monochrome until probes are
// chosen; chosen regions take their channel's ink colour as a band through every row, and while a
// channel is free, hovering or focusing a region previews it in that channel's ink. The map is
// drawn at its column's pixel width (one SVG unit per CSS pixel, so its text keeps its size) and
// redrawn when the column changes width. Given a column to fill (fitTo), the isoform rows spread
// out and the exons thicken to use its height, within limits. Read-only (step 6's probe-map card):
// the same drawing with the pair in its inks, but the regions can't be chosen.
// Ported from docs/mockups/step5-target-probe-map.html.

import { term } from "./glossary.js";
import { regionLabel } from "./data.js";

const NS = "http://www.w3.org/2000/svg";
const fmt = n => n.toLocaleString("en-GB");
// half the width of a region label in Plex Mono (0.6 em a character) at font size fs
const halfLabel = (text, fs) => text.length * fs * 0.3;

// Centres (lx) for the pair's labels above their brackets: pushed apart until they clear each
// other by `gap`, then shifted together to stay within lo–hi.
function placeLabels(chosen, fs, gap, lo, hi) {
  if (!chosen.length) return;
  for (const c of chosen) { c.label = regionLabel(c.id); c.hw = halfLabel(c.label, fs); c.lx = c.cx; }
  const [l, r = l] = [...chosen].sort((a, b) => a.cx - b.cx);
  const d = l.hw + r.hw + gap, mid = (l.cx + r.cx) / 2;
  if (r !== l && r.cx - l.cx < d) { l.lx = mid - d / 2; r.lx = mid + d / 2; }
  const shift = Math.max(0, lo - (l.lx - l.hw)) || Math.min(0, hi - (r.lx + r.hw));
  for (const c of chosen) c.lx += shift;
}
const kb = n => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)} kb` : `${n} nt`);

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

// transcript orientation: x increases 5′→3′ on either strand
const toT = (g, lo, hi) => (g.strand === "+" ? [lo - 1, hi] : [-hi, -(lo - 1)]);
const overlaps = (a, b) => a[0] < b[1] && b[0] < a[1];

function buildAxis(g, width, scale) {
  const ivs = [];
  for (const t of g.transcripts) for (const e of t.exons) ivs.push(toT(g, ...e));
  for (const k in g.overlapping_same_strand_genes) for (const t of g.overlapping_same_strand_genes[k]) for (const e of t.exons) ivs.push(toT(g, ...e));
  const all = ivs.slice();
  for (const p of g.probe_regions) all.push(toT(g, p.lo, p.hi));
  const d0 = Math.min(...all.map(i => i[0])), d1 = Math.max(...all.map(i => i[1]));
  if (scale === "lin") {
    const k = width / (d1 - d0);
    return { map: x => (x - d0) * k, gaps: [], d0, d1 };
  }
  ivs.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const iv of ivs) {
    const m = merged[merged.length - 1];
    if (m && iv[0] <= m[1]) m[1] = Math.max(m[1], iv[1]); else merged.push(iv.slice());
  }
  const segs = [];
  let cur = d0;
  for (const m of merged) {
    if (m[0] > cur) segs.push({ a: cur, b: m[0], gap: true });
    segs.push({ a: m[0], b: m[1], gap: false });
    cur = m[1];
  }
  if (d1 > cur) segs.push({ a: cur, b: d1, gap: true });
  for (const s of segs) if (s.gap && s.b - s.a < 300) { s.gap = false; s.small = true; }
  const gw = len => Math.max(8, 22 * (Math.log10(len) - 1.2));
  let G = 0, E = 0;
  for (const s of segs) { if (s.gap) { s.w = gw(s.b - s.a); G += s.w; } else E += s.b - s.a; }
  if (G > 0.4 * width) {
    const f = (0.4 * width) / G;
    for (const s of segs) if (s.gap) s.w = Math.max(5, s.w * f);
    G = segs.filter(s => s.gap).reduce((a, s) => a + s.w, 0);
  }
  const k = (width - G) / E;
  let px = 0;
  for (const s of segs) { if (!s.gap) s.w = (s.b - s.a) * k; s.x = px; px += s.w; }
  const map = x => {
    for (const s of segs) if (x <= s.b) return s.x + ((x - s.a) / (s.b - s.a)) * s.w;
    return width;
  };
  return { map, gaps: segs.filter(s => s.gap), d0, d1 };
}

const RH_MIN = 32, RH_MAX = 52;   // isoform row pitch, px

export function createMap(host, g, { onPick = () => {}, fitTo = null, readOnly = false }) {
  // the name gutter fits the longest isoform name (Plex Mono 12px: 7.2px a character) or the
  // two-line track label, whichever is wider, so the map keeps the rest of the width
  const names = g.transcripts.map(t => t.name);
  for (const k in g.overlapping_same_strand_genes) for (const t of g.overlapping_same_strand_genes[k]) names.push(t.name);
  const LW = Math.ceil(Math.max(62, ...names.map(n => n.length * 7.2))) + 16;
  const nRows = names.length;
  let RH = RH_MIN;
  const state = { scale: "comp", pair: { ch1: null, ch2: null } };
  host.classList.add("tmap");
  host.innerHTML = `
    <div class="tmap__bar">
      <p class="tmap__title"><i>${g.gene}</i> transcript map <span>· ${g.transcripts.length} annotated ${term("isoform", "isoforms")}</span></p>
      <div class="seg" role="group" aria-label="Intron scale">
        <button type="button" data-scale="comp" aria-pressed="true">Introns compressed</button><button type="button" data-scale="lin" aria-pressed="false">To scale</button>
      </div>
    </div>
    <svg class="tmap__svg" role="group"></svg>
    <div class="tmap__legend">
      <div class="tmap__key"></div>
      <p class="tmap__notes"></p>
    </div>
    <div class="tmap__tip" role="tooltip" hidden></div>`;
  const svg = host.querySelector("svg");
  const tipEl = host.querySelector(".tmap__tip");

  const tip = (ev, html) => { tipEl.innerHTML = html; tipEl.hidden = false; moveTip(ev); };
  const moveTip = ev => {
    const r = host.getBoundingClientRect();
    tipEl.style.left = `${ev.clientX - r.left + 14}px`;
    tipEl.style.top = `${ev.clientY - r.top + 14}px`;
  };
  const hideTip = () => { tipEl.hidden = true; };

  function highlight(names) {
    svg.classList.add("is-dim");
    svg.querySelectorAll(".tmap__row").forEach(r => r.classList.toggle("is-lit", names.has(r.dataset.name)));
  }
  function clearHL() {
    svg.classList.remove("is-dim");
    svg.querySelectorAll(".tmap__row").forEach(r => r.classList.remove("is-lit"));
  }

  let drawnWidth = 0;
  function render() {
    // a probe region chosen from the keyboard keeps focus through the redraw
    const focused = svg.contains(document.activeElement) ? document.activeElement.dataset.region : null;
    svg.replaceChildren();
    host.querySelectorAll("[data-scale]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.scale === state.scale)));
    drawnWidth = host.clientWidth;
    const W = Math.max(420, (drawnWidth || 996) - LW - 16);   // below that, the SVG scales down
    const hC = Math.round(Math.min(22, Math.max(16, RH * 0.45))), hU = Math.round(hC * 0.56), half = hC / 2;   // CDS, UTR heights
    const next = readOnly ? null : !state.pair.ch1 ? "ch1" : !state.pair.ch2 ? "ch2" : null;
    const ax = buildAxis(g, W, state.scale);
    const X = x => LW + ax.map(x);

    // probe track rows (greedy stacking so labels never collide)
    const rows = [];
    const items = g.probe_regions.map(p => {
      const t = toT(g, p.lo, p.hi);
      const x0 = X(t[0]), x1 = X(t[1]), cx = (x0 + x1) / 2;
      // the label is centred over its bracket, but kept clear of the gutter's "Probe regions"
      const label = regionLabel(p.id), hw = halfLabel(label, 12) + 3;
      const lx = Math.min(Math.max(cx, LW - 6 + hw), LW + W + 16 - hw);
      return { p, label, x0, x1, lx, l: Math.min(x0, lx - hw), r: Math.max(x1, lx + hw) };
    }).sort((a, b) => a.l - b.l);
    for (const q of items) { let r = 0; while (rows[r] !== undefined && rows[r] > q.l - 4) r++; rows[r] = q.r; q.row = r; }
    const PH = 26 * rows.length + 18;

    const tx = [...g.transcripts].sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
    const others = [];
    for (const k in g.overlapping_same_strand_genes) for (const t of g.overlapping_same_strand_genes[k]) others.push(t);
    const everyone = tx.concat(others);
    const top = PH + 18;

    const bands = el("g", {}, svg);
    const rowsG = el("g", {}, svg);

    function drawTx(t, y) {
      const row = el("g", { class: "tmap__row", "data-name": t.name }, rowsG);
      const exs = t.exons.map(e => toT(g, ...e)).sort((a, b) => a[0] - b[0]);
      const x0 = X(exs[0][0]), x1 = X(exs[exs.length - 1][1]);
      const lab = el("text", { x: LW - 14, y: y + 4, "text-anchor": "end", class: "tmap__name" }, row);
      lab.textContent = t.name;
      lab.addEventListener("mouseenter", () => highlight(new Set([t.name])));
      lab.addEventListener("mouseleave", clearHL);
      el("line", { x1: x0, x2: x1, y1: y, y2: y, class: "tmap__intron" }, row);
      for (let i = 0; i < exs.length - 1; i++) {
        const a = X(exs[i][1]), b = X(exs[i + 1][0]);
        if (b - a > 18) {
          const m = (a + b) / 2;
          el("path", { d: `M${m - 2.5},${y - 3.5} L${m + 2.5},${y} L${m - 2.5},${y + 3.5}`, class: "tmap__chev" }, row);
        }
      }
      const cds = t.cds ? toT(g, ...t.cds) : null;
      for (const e of exs) {
        const gx = el("g", { class: "tmap__exon" }, row);
        const parts = [];
        if (cds && overlaps(e, cds)) {
          const c0 = Math.max(e[0], cds[0]), c1 = Math.min(e[1], cds[1]);
          if (e[0] < c0) parts.push([e[0], c0, false]);
          parts.push([c0, c1, true]);
          if (c1 < e[1]) parts.push([c1, e[1], false]);
        } else parts.push([e[0], e[1], false]);
        for (const [a, b, isC] of parts) {
          const h = isC ? hC : hU;
          el("rect", { x: X(a), y: y - h / 2, width: Math.max(1.2, X(b) - X(a)), height: h, class: isC ? "tmap__cds" : "tmap__utr" }, gx);
        }
        const hit = Math.max(12, half + 4);
        el("rect", { x: Math.min(X(e[0]), (X(e[0]) + X(e[1])) / 2 - 6), y: y - hit, width: Math.max(12, X(e[1]) - X(e[0])), height: 2 * hit, fill: "transparent" }, gx);
        const len = e[1] - e[0];
        gx.addEventListener("mouseenter", ev => {
          highlight(new Set(everyone.filter(o => o.exons.some(f => overlaps(toT(g, ...f), e))).map(o => o.name)));
          const gl = g.strand === "+" ? [e[0] + 1, e[1]] : [-e[1] + 1, -e[0]];
          tip(ev, `<b>Exon</b> · ${fmt(len)} nt<br>${g.chrom}:${fmt(gl[0])}–${fmt(gl[1])}`);
        });
        gx.addEventListener("mousemove", moveTip);
        gx.addEventListener("mouseleave", () => { clearHL(); hideTip(); });
      }
      // TSS: bent arrow at the 5′ end; 3′ end: triangle (both clear of the CDS edge)
      const up = y - half;
      el("path", { d: `M${x0},${up} L${x0},${up - 7} L${x0 + 8},${up - 7}`, class: "tmap__mark-line" }, row);
      el("path", { d: `M${x0 + 6},${up - 10} L${x0 + 9.5},${up - 7} L${x0 + 6},${up - 4}`, class: "tmap__mark" }, row);
      el("path", { d: `M${x1 - 3.5},${y + half + 1} L${x1 + 3.5},${y + half + 1} L${x1},${y + half + 6} Z`, class: "tmap__mark" }, row);
    }

    let y = top + RH / 2;
    for (const t of tx) { drawTx(t, y); y += RH; }
    if (others.length) {
      // a separate, unflagged track for overlapping same-strand genes
      y += 10;
      el("line", { x1: 4, x2: LW + W, y1: y - RH / 2 + 2, y2: y - RH / 2 + 2, class: "tmap__divider" }, rowsG);
      y += 6;
      for (const t of others) { drawTx(t, y); y += RH; }
    }

    // axis
    const ay = y + 4;
    let lines = 1;
    const axG = el("g", {}, svg);
    if (state.scale === "comp") {
      el("line", { x1: X(ax.d0), x2: X(ax.d1), y1: ay, y2: ay, class: "tmap__axis" }, axG);
      // every break mark carries its length; a label that would collide drops to the next line
      // (up to three), and one that fits on none is left off (its break mark stays)
      const lastR = [-1e9, -1e9, -1e9];
      for (const s of ax.gaps) {
        const a = LW + s.x, b = a + s.w, m = (a + b) / 2;
        el("rect", { x: a + 1, y: ay - 3, width: Math.max(0, s.w - 2), height: 6, class: "tmap__gap" }, axG);
        const len = s.b - s.a;
        el("path", { d: `M${m - 4},${ay + 4} L${m - 1},${ay - 4} M${m + 1},${ay + 4} L${m + 4},${ay - 4}`, class: "tmap__break" }, axG);
        const lw = kb(len).length * 7;
        const line = lastR.findIndex(r => m - lw / 2 > r + 6);
        if (line < 0) continue;
        lines = Math.max(lines, line + 1);
        const t = el("text", { x: m, y: ay + 18 + line * 14, "text-anchor": "middle", class: "tmap__tick" }, axG);
        t.textContent = kb(len);
        lastR[line] = m + lw / 2;
      }
    } else {
      const k = W / (ax.d1 - ax.d0), L = 2000, x0 = LW + W - L * k;
      el("line", { x1: x0, x2: LW + W, y1: ay, y2: ay, class: "tmap__scalebar" }, axG);
      const t = el("text", { x: LW + W, y: ay + 18, "text-anchor": "end", class: "tmap__tick" }, axG);
      t.textContent = "2 kb";
    }
    svg.setAttribute("viewBox", `0 0 ${LW + W + 16} ${ay + 26 + (lines - 1) * 14}`);
    svg.setAttribute("aria-label", `${g.gene} transcript map: ${tx.length} isoforms drawn 5′ to 3′, with ${g.probe_regions.length} probe regions above`);

    // probe track
    const lab = el("text", { x: LW - 14, y: 12, "text-anchor": "end", class: "tmap__gutter" }, svg);
    for (const [i, word] of ["Probe", "regions"].entries()) el("tspan", { x: LW - 14, dy: i ? 13 : 0 }, lab).textContent = word;
    const yBottom = y - RH / 2;
    for (const q of items) {
      const ch = state.pair.ch1 === q.p.id ? "ch1" : state.pair.ch2 === q.p.id ? "ch2" : "";
      const py = 10 + q.row * 26 + 14;
      if (ch) el("rect", { x: q.x0, y: py, width: Math.max(2, q.x1 - q.x0), height: yBottom - py, class: `tmap__band tmap__band--${ch}` }, bands);
      const gp = el("g", readOnly ? { class: `tmap__probe is-static${ch ? ` is-${ch}` : ""}`, "data-region": q.p.id } : {
        class: `tmap__probe${ch ? ` is-${ch}` : ""}`, tabindex: 0, role: "button", "data-region": q.p.id,
        "aria-pressed": String(!!ch),
        "aria-label": `${q.label}, ${fmt(q.p.length_nt)} nt${ch ? `, in smFISH ${ch === "ch1" ? 1 : 2}` : ""}`,
      }, svg);
      el("rect", { class: "tmap__hit", x: q.l, y: py - 16, width: Math.max(24, q.r - q.l), height: 26 }, gp);
      const w = Math.max(3, q.x1 - q.x0);
      el("path", { class: "tmap__bracket", d: `M${q.x0},${py + 5} L${q.x0},${py} L${q.x0 + w},${py} L${q.x0 + w},${py + 5}` }, gp);
      const t = el("text", { x: q.lx, y: py - 5, "text-anchor": "middle", class: "tmap__pid" }, gp);
      t.textContent = q.label;
      // while a channel is free, an unchosen region previews the channel a click would fill:
      // a dashed bracket and dashed guides down its edges (provisional; a chosen region is solid)
      if (!ch && next) {
        let guide = null;
        const on = () => {
          gp.classList.add(`is-next-${next}`);
          if (guide) return;
          guide = el("g", { class: `tmap__guide tmap__guide--${next}` }, bands);
          for (const gx of q.x1 - q.x0 > 3 ? [q.x0, q.x1] : [(q.x0 + q.x1) / 2]) el("line", { x1: gx, x2: gx, y1: py, y2: yBottom }, guide);
        };
        const off = () => { gp.classList.remove(`is-next-${next}`); guide?.remove(); guide = null; };
        gp.addEventListener("mouseenter", on);
        gp.addEventListener("focus", on);
        gp.addEventListener("mouseleave", off);
        gp.addEventListener("blur", off);
      }
      if (!readOnly) {
        gp.addEventListener("click", () => onPick(q.p.id));
        gp.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(q.p.id); } });
      }
      gp.addEventListener("mouseenter", ev => tip(ev, `<b>${q.label}</b> ·${fmt(q.p.length_nt)} nt<br>${g.chrom}:${fmt(q.p.lo)}–${fmt(q.p.hi)}`));
      gp.addEventListener("mousemove", moveTip);
      gp.addEventListener("mouseleave", hideTip);
      if (q.p.id === focused) gp.focus();
    }

    // the legend: the key, then the strand and scale notes in small print
    host.querySelector(".tmap__notes").textContent = [
      g.strand === "-" ? "Minus strand, shown 5′→3′ (left to right); FlyBase displays this gene reversed" : "Plus strand, shown 5′→3′ (left to right)",
      state.scale === "comp" ? "Introns compressed; break marks show their true length" : "Drawn to scale",
    ].join(" · ");
    host.querySelector(".tmap__key").innerHTML = `
      <span><svg width="26" height="16" aria-hidden="true"><rect width="26" height="16" class="tmap__cds"/></svg><span>coding (${term("cds", "CDS")})</span></span>
      <span><svg width="26" height="16" aria-hidden="true"><rect y="3.5" width="26" height="9" class="tmap__utr"/></svg><span>${term("utr", "UTR")} / non-coding</span></span>
      <span><svg width="30" height="16" aria-hidden="true"><line x1="0" x2="30" y1="8" y2="8" class="tmap__intron"/><path d="M13,4.5 L18,8 L13,11.5" class="tmap__chev"/></svg><span>${term("intron", "intron")}</span></span>
      <span><svg width="16" height="16" aria-hidden="true"><path d="M3,15 L3,6 L11,6" class="tmap__mark-line"/><path d="M9,3 L12.5,6 L9,9" class="tmap__mark"/></svg><span>${term("tss", "transcription start")}</span></span>
      <span><svg width="14" height="16" aria-hidden="true"><path d="M3,5 L11,5 L7,11 Z" class="tmap__mark"/></svg><span>${term("pas", "3′ end (polyadenylation)")}</span></span>`;
    fit();
  }

  host.addEventListener("click", e => {
    const b = e.target.closest("[data-scale]");
    if (b) { state.scale = b.dataset.scale; render(); }
  });

  // the row pitch grows to fill fitTo's height (less a little air), between RH_MIN and RH_MAX;
  // the drawing's height is linear in the pitch, so one step lands it
  let fitting = false;
  function fit() {
    if (!fitTo || fitting || !fitTo.lastElementChild) return;
    const box = fitTo.getBoundingClientRect();
    const used = fitTo.lastElementChild.getBoundingClientRect().bottom - box.top + fitTo.scrollTop;
    const want = Math.round(Math.min(RH_MAX, Math.max(RH_MIN, RH + (fitTo.clientHeight - used - 8) / nRows)));
    if (want === RH) return;
    RH = want;
    fitting = true;
    render();
    fitting = false;
  }

  const ro = new ResizeObserver(() => { if (Math.abs(host.clientWidth - drawnWidth) >= 1) render(); else fit(); });
  ro.observe(host);
  if (fitTo) ro.observe(fitTo);
  render();
  return {
    setPair(pair) { state.pair = { ...pair }; render(); },
    destroy() { ro.disconnect(); },
  };
}

// The probe strip (step 6 header): the map's rows in its compressed coordinates, drawn small and
// without names or the probe track; the pair's two regions are ink bands under a bracket and ID.
// Drawn at `width` px; returns the height used.
export function drawStrip(svg, g, pair, width) {
  const LAB = 11, PITCH = 5, SPLIT = 2, hC = 3, hU = 2;
  const ax = buildAxis(g, width - 2, "comp");
  const X = x => 1 + ax.map(x);
  const tx = [...g.transcripts].sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
  const others = [];
  for (const k in g.overlapping_same_strand_genes) for (const t of g.overlapping_same_strand_genes[k]) others.push(t);
  svg.replaceChildren();
  const bands = el("g", {}, svg), rowsG = el("g", {}, svg), heads = el("g", {}, svg);
  let y = LAB + 4 + PITCH / 2;
  const row = t => {
    const exs = t.exons.map(e => toT(g, ...e)).sort((a, b) => a[0] - b[0]);
    el("line", { x1: X(exs[0][0]), x2: X(exs[exs.length - 1][1]), y1: y, y2: y, class: "strip__intron" }, rowsG);
    const cds = t.cds ? toT(g, ...t.cds) : null;
    for (const e of exs) {
      const parts = cds && overlaps(e, cds)
        ? [[e[0], Math.max(e[0], cds[0]), false], [Math.max(e[0], cds[0]), Math.min(e[1], cds[1]), true], [Math.min(e[1], cds[1]), e[1], false]]
        : [[e[0], e[1], false]];
      for (const [a, b, isC] of parts) {
        if (b <= a) continue;
        const h = isC ? hC : hU;
        el("rect", { x: X(a), y: y - h / 2, width: Math.max(1, X(b) - X(a)), height: h, class: isC ? "strip__cds" : "strip__utr" }, rowsG);
      }
    }
    y += PITCH;
  };
  tx.forEach(row);
  if (others.length) { y += SPLIT; others.forEach(row); }
  const bottom = y - PITCH / 2 + 2;
  // the two regions: an ink band through every row, a bracket and the ID above (pushed apart if close)
  const chosen = ["ch1", "ch2"].map(ch => {
    const p = g.probe_regions.find(r => r.id === pair[ch]);
    if (!p) return null;
    const [a, b] = toT(g, p.lo, p.hi);
    const x0 = X(a), x1 = Math.max(X(b), X(a) + 2);
    return { ch, id: p.id, x0, x1, cx: (x0 + x1) / 2 };
  }).filter(Boolean);
  placeLabels(chosen, 11, 8, 0, width);
  for (const c of chosen) {
    el("rect", { x: c.x0, y: LAB + 3, width: c.x1 - c.x0, height: bottom - LAB - 3, class: `strip__band strip__band--${c.ch}` }, bands);
    el("path", { d: `M${c.x0},${LAB + 6} L${c.x0},${LAB + 3} L${c.x1},${LAB + 3} L${c.x1},${LAB + 6}`, class: `strip__bracket strip__bracket--${c.ch}` }, heads);
    el("text", { x: c.lx, y: LAB - 2, "text-anchor": "middle", class: `strip__id strip__id--${c.ch}` }, heads).textContent = c.label;
  }
  svg.setAttribute("viewBox", `0 0 ${width} ${bottom}`);
  svg.setAttribute("width", width);
  svg.setAttribute("height", bottom);
  return bottom;
}

// The pair on the Part 1 summary slide (summary.js): the map's rows in its compressed coordinates
// with their names, start and end marks, and the pair's two regions as ink bands under a bracket
// and ID (the probe track's other regions are left out). Markup with inline colours from the
// palette P, so one string serves the page preview and the PNG. Returns { svg, height }.
export function slideMap(g, pair, { x, y, width, P }) {
  const FS = 20, PITCH = 38, SPLIT = 20, hC = 18, hU = 10, half = hC / 2;
  const tx = [...g.transcripts].sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
  const others = [];
  for (const k in g.overlapping_same_strand_genes) for (const t of g.overlapping_same_strand_genes[k]) others.push(t);
  const LW = Math.ceil(Math.max(...tx.concat(others).map(t => t.name.length * FS * 0.6))) + 28;   // Plex Mono: 0.6 em a character
  const ax = buildAxis(g, width - LW - 12, "comp");
  const X = v => x + LW + ax.map(v);
  const out = [];
  const bandTop = y + 30;
  let ry = y + 66;
  const row = t => {
    const exs = t.exons.map(e => toT(g, ...e)).sort((a, b) => a[0] - b[0]);
    const x0 = X(exs[0][0]), x1 = X(exs[exs.length - 1][1]);
    out.push(`<text x="${x + LW - 18}" y="${ry + 7}" text-anchor="end" font-family="${P.mono}" font-size="${FS}" fill="${P.text}">${t.name}</text>`);
    out.push(`<line x1="${x0}" x2="${x1}" y1="${ry}" y2="${ry}" stroke="${P.intron}" stroke-width="2"/>`);
    const cds = t.cds ? toT(g, ...t.cds) : null;
    for (const e of exs) {
      const parts = cds && overlaps(e, cds)
        ? [[e[0], Math.max(e[0], cds[0]), false], [Math.max(e[0], cds[0]), Math.min(e[1], cds[1]), true], [Math.min(e[1], cds[1]), e[1], false]]
        : [[e[0], e[1], false]];
      for (const [a, b, isC] of parts) {
        if (b <= a) continue;
        const h = isC ? hC : hU;
        out.push(`<rect x="${X(a)}" y="${ry - h / 2}" width="${Math.max(1.5, X(b) - X(a))}" height="${h}" fill="${isC ? P.cds : P.utr}"/>`);
      }
    }
    // TSS: bent arrow at the 5′ end; 3′ end: triangle
    const up = ry - half;
    out.push(`<path d="M${x0},${up} L${x0},${up - 11} L${x0 + 12},${up - 11}" fill="none" stroke="${P.text2}" stroke-width="2"/>`);
    out.push(`<path d="M${x0 + 9},${up - 15.5} L${x0 + 14},${up - 11} L${x0 + 9},${up - 6.5} Z" fill="${P.text2}"/>`);
    out.push(`<path d="M${x1 - 5},${ry + half + 2} L${x1 + 5},${ry + half + 2} L${x1},${ry + half + 9} Z" fill="${P.text2}"/>`);
    ry += PITCH;
  };
  tx.forEach(row);
  if (others.length) {
    const dy = ry - PITCH / 2 + SPLIT / 2;
    out.push(`<line x1="${x}" x2="${x + width}" y1="${dy}" y2="${dy}" stroke="${P.grid}" stroke-width="2" stroke-dasharray="3 6"/>`);
    ry += SPLIT;
    others.forEach(row);
  }
  const bottom = ry - PITCH + half + 10;
  // the two regions: an ink band through every row, a bracket and the ID above (pushed apart if close)
  const chosen = ["ch1", "ch2"].map(ch => {
    const p = g.probe_regions.find(r => r.id === pair[ch]);
    if (!p) return null;
    const [a, b] = toT(g, p.lo, p.hi);
    const x0 = X(a), x1 = Math.max(X(b), X(a) + 3);
    return { ch, id: p.id, x0, x1, cx: (x0 + x1) / 2 };
  }).filter(Boolean);
  placeLabels(chosen, 22, 24, x, x + width);
  const bands = chosen.map(c => {
    const ink = P[c.ch];
    return `<rect x="${c.x0}" y="${bandTop}" width="${c.x1 - c.x0}" height="${bottom - bandTop}" fill="${ink}" fill-opacity=".14"/>
      <path d="M${c.x0},${bandTop + 7} L${c.x0},${bandTop} L${c.x1},${bandTop} L${c.x1},${bandTop + 7}" fill="none" stroke="${ink}" stroke-width="3"/>
      <text x="${c.lx}" y="${bandTop - 9}" text-anchor="middle" font-family="${P.mono}" font-size="22" font-weight="500" fill="${ink}">${c.label}</text>`;
  });
  return { svg: bands.join("") + out.join(""), height: bottom - y };
}
