// Transcript map with the probe track (step 5), drawn as SVG from the public transcript models.
// Every gene runs 5′→3′ left to right. Introns are compressed by default (under 300 nt stay at
// exon scale; longer ones get a log width, at most 40% of the map, with a break mark and their
// true length); "To scale" shows true proportions with a 2 kb bar. Monochrome until probes are
// chosen; chosen regions take their channel's ink colour as a band through every row.
// Ported from docs/mockups/step5-target-probe-map.html.

const NS = "http://www.w3.org/2000/svg";
const fmt = n => n.toLocaleString("en-GB");
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

export function createMap(host, g, { onPick }) {
  const state = { scale: "comp", pair: { ch1: null, ch2: null } };
  host.classList.add("tmap");
  host.innerHTML = `
    <div class="tmap__bar">
      <p class="tmap__title"><i>${g.gene}</i> transcript map <span>· ${g.transcripts.length} annotated isoforms · FlyBase R6</span></p>
      <div class="seg" role="group" aria-label="Intron scale">
        <button type="button" data-scale="comp" aria-pressed="true">Introns compressed</button><button type="button" data-scale="lin" aria-pressed="false">To scale</button>
      </div>
    </div>
    <svg class="tmap__svg" role="group"></svg>
    <div class="tmap__key"></div>
    <p class="tmap__strand">${g.strand === "-" ? "Minus strand, shown 5′→3′ (left to right). FlyBase displays this gene reversed." : "Plus strand, shown 5′→3′ (left to right)."}</p>
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

  function render() {
    svg.replaceChildren();
    host.querySelectorAll("[data-scale]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.scale === state.scale)));
    const LW = 112, W = 868, RH = 32;
    const ax = buildAxis(g, W, state.scale);
    const X = x => LW + ax.map(x);

    // probe track rows (greedy stacking so labels never collide)
    const rows = [];
    const items = g.probe_regions.map(p => {
      const t = toT(g, p.lo, p.hi);
      const x0 = X(t[0]), x1 = X(t[1]), cx = (x0 + x1) / 2;
      return { p, x0, x1, cx, l: Math.min(x0, cx - 13), r: Math.max(x1, cx + 13) };
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
          const h = isC ? 16 : 9;
          el("rect", { x: X(a), y: y - h / 2, width: Math.max(1.2, X(b) - X(a)), height: h, class: isC ? "tmap__cds" : "tmap__utr" }, gx);
        }
        el("rect", { x: Math.min(X(e[0]), (X(e[0]) + X(e[1])) / 2 - 6), y: y - 12, width: Math.max(12, X(e[1]) - X(e[0])), height: 24, fill: "transparent" }, gx);
        const len = e[1] - e[0];
        gx.addEventListener("mouseenter", ev => {
          highlight(new Set(everyone.filter(o => o.exons.some(f => overlaps(toT(g, ...f), e))).map(o => o.name)));
          const gl = g.strand === "+" ? [e[0] + 1, e[1]] : [-e[1] + 1, -e[0]];
          tip(ev, `<b>Exon</b> · ${fmt(len)} nt<br>${g.chrom}:${fmt(gl[0])}–${fmt(gl[1])}`);
        });
        gx.addEventListener("mousemove", moveTip);
        gx.addEventListener("mouseleave", () => { clearHL(); hideTip(); });
      }
      // TSS: bent arrow at the 5′ end; 3′ end: triangle
      el("path", { d: `M${x0},${y - 8} L${x0},${y - 15} L${x0 + 8},${y - 15}`, class: "tmap__mark-line" }, row);
      el("path", { d: `M${x0 + 6},${y - 18} L${x0 + 9.5},${y - 15} L${x0 + 6},${y - 12}`, class: "tmap__mark" }, row);
      el("path", { d: `M${x1 - 3.5},${y + 9} L${x1 + 3.5},${y + 9} L${x1},${y + 14} Z`, class: "tmap__mark" }, row);
    }

    let y = top + RH / 2;
    for (const t of tx) { drawTx(t, y); y += RH; }
    if (others.length) {
      // a separate, unflagged track for overlapping same-strand genes
      y += 10;
      el("line", { x1: LW - 100, x2: LW + W, y1: y - RH / 2 + 2, y2: y - RH / 2 + 2, class: "tmap__divider" }, rowsG);
      y += 6;
      for (const t of others) { drawTx(t, y); y += RH; }
    }

    // axis
    const ay = y + 4;
    const axG = el("g", {}, svg);
    if (state.scale === "comp") {
      el("line", { x1: X(ax.d0), x2: X(ax.d1), y1: ay, y2: ay, class: "tmap__axis" }, axG);
      let lastR = -1e9;
      for (const s of ax.gaps) {
        const a = LW + s.x, b = a + s.w, m = (a + b) / 2;
        el("rect", { x: a + 1, y: ay - 3, width: Math.max(0, s.w - 2), height: 6, class: "tmap__gap" }, axG);
        const len = s.b - s.a;
        el("path", { d: `M${m - 4},${ay + 4} L${m - 1},${ay - 4} M${m + 1},${ay + 4} L${m + 4},${ay - 4}`, class: "tmap__break" }, axG);
        const lw = kb(len).length * 7;
        if (len >= 500 && m - lw / 2 > lastR + 6) {
          const t = el("text", { x: m, y: ay + 18, "text-anchor": "middle", class: "tmap__tick" }, axG);
          t.textContent = kb(len);
          lastR = m + lw / 2;
        }
      }
      const n = el("text", { x: LW + W, y: ay + 36, "text-anchor": "end", class: "tmap__note" }, axG);
      n.textContent = "Introns compressed; break marks show their true length";
    } else {
      const k = W / (ax.d1 - ax.d0), L = 2000, x0 = LW + W - L * k;
      el("line", { x1: x0, x2: LW + W, y1: ay, y2: ay, class: "tmap__scalebar" }, axG);
      const t = el("text", { x: LW + W, y: ay + 18, "text-anchor": "end", class: "tmap__tick" }, axG);
      t.textContent = "2 kb";
    }
    svg.setAttribute("viewBox", `0 0 ${LW + W + 16} ${ay + 44}`);
    svg.setAttribute("aria-label", `${g.gene} transcript map: ${tx.length} isoforms drawn 5′ to 3′, with ${g.probe_regions.length} probe regions above`);

    // probe track
    const lab = el("text", { x: LW - 14, y: 14, "text-anchor": "end", class: "tmap__name tmap__name--muted" }, svg);
    lab.textContent = "Probe regions";
    const yBottom = y - RH / 2;
    for (const q of items) {
      const ch = state.pair.ch1 === q.p.id ? "ch1" : state.pair.ch2 === q.p.id ? "ch2" : "";
      const py = 10 + q.row * 26 + 14;
      if (ch) el("rect", { x: q.x0, y: py, width: Math.max(2, q.x1 - q.x0), height: yBottom - py, class: `tmap__band tmap__band--${ch}` }, bands);
      const gp = el("g", {
        class: `tmap__probe${ch ? ` is-${ch}` : ""}`, tabindex: 0, role: "button",
        "aria-pressed": String(!!ch),
        "aria-label": `Probe region ${q.p.id}, ${fmt(q.p.length_nt)} nt${ch ? `, in smFISH ${ch === "ch1" ? 1 : 2}` : ""}`,
      }, svg);
      el("rect", { class: "tmap__hit", x: q.l, y: py - 16, width: Math.max(24, q.r - q.l), height: 26 }, gp);
      const w = Math.max(3, q.x1 - q.x0);
      el("path", { class: "tmap__bracket", d: `M${q.x0},${py + 5} L${q.x0},${py} L${q.x0 + w},${py} L${q.x0 + w},${py + 5}` }, gp);
      const t = el("text", { x: q.cx, y: py - 5, "text-anchor": "middle", class: "tmap__pid" }, gp);
      t.textContent = q.p.id;
      gp.addEventListener("click", () => onPick(q.p.id));
      gp.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(q.p.id); } });
      gp.addEventListener("mouseenter", ev => tip(ev, `<b>${q.p.id}</b> · ${fmt(q.p.length_nt)} nt<br>${g.chrom}:${fmt(q.p.lo)}–${fmt(q.p.hi)}`));
      gp.addEventListener("mousemove", moveTip);
      gp.addEventListener("mouseleave", hideTip);
    }

    host.querySelector(".tmap__key").innerHTML = `
      <span><svg width="26" height="16" aria-hidden="true"><rect width="26" height="16" class="tmap__cds"/></svg>coding (CDS)</span>
      <span><svg width="26" height="16" aria-hidden="true"><rect y="3.5" width="26" height="9" class="tmap__utr"/></svg>UTR / non-coding</span>
      <span><svg width="30" height="16" aria-hidden="true"><line x1="0" x2="30" y1="8" y2="8" class="tmap__intron"/><path d="M13,4.5 L18,8 L13,11.5" class="tmap__chev"/></svg>intron</span>
      <span><svg width="16" height="16" aria-hidden="true"><path d="M3,15 L3,6 L11,6" class="tmap__mark-line"/><path d="M9,3 L12.5,6 L9,9" class="tmap__mark"/></svg>transcription start</span>
      <span><svg width="14" height="16" aria-hidden="true"><path d="M3,5 L11,5 L7,11 Z" class="tmap__mark"/></svg>3′ end (polyadenylation)</span>`;
  }

  host.addEventListener("click", e => {
    const b = e.target.closest("[data-scale]");
    if (b) { state.scale = b.dataset.scale; render(); }
  });

  render();
  return {
    setPair(pair) { state.pair = { ...pair }; render(); },
  };
}
