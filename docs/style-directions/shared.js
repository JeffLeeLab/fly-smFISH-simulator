/* Style-direction mockups: shared renderers.
   Static pictures only: fake data, no generator, no real interactions. */
const SD = (() => {
  const P = new URLSearchParams(location.search);
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  // ---------- seeded randomness (mulberry32) ----------
  function prng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function poisson(r, lam) {
    if (lam > 30) return Math.max(0, Math.round(lam + Math.sqrt(lam) * gauss(r)));
    const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1;
  }

  // ---------- contrast ----------
  function lum(hex) {
    const h = hex.replace("#", ""); const c = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
      .map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

  // ---------- theme / texture params ----------
  function init() {
    const d = document.documentElement;
    if (P.get("theme")) d.dataset.theme = P.get("theme");
    document.querySelectorAll("[data-act=theme]").forEach(b => b.onclick = () => { d.dataset.theme = d.dataset.theme === "dark" ? "light" : "dark"; redraw(); });
    window.addEventListener("resize", fitFrames);
  }
  const redrawers = [];
  function onRedraw(fn) { redrawers.push(fn); fn(); }
  function redraw() { redrawers.forEach(f => f()); }

  // 1280×720 frames scaled to fit the page
  function fitFrames() {
    document.querySelectorAll(".frame-wrap").forEach(w => {
      const f = w.querySelector(".frame"); const s = Math.min(1, w.clientWidth / 1280);
      f.style.transform = `scale(${s})`; w.style.height = (720 * s) + "px";
    });
  }

  // ---------- tokens ----------
  function tokens(el, list) {
    const bg = css("--bg");
    el.innerHTML = list.map(([name, role, nonText]) => {
      const v = css(name); const c = contrast(v, bg);
      if (nonText === "deco") return `<div class="tok"><span class="sw" style="background:${v}"></span><div><b>${role}</b><code>${name} ${v.toUpperCase()}</code><small>${c.toFixed(1)}:1 · decorative, no minimum</small></div></div>`;
      if (nonText === "fill") return `<div class="tok"><span class="sw" style="background:${v}"></span><div><b>${role}</b><code>${name} ${v.toUpperCase()}</code><small class="${c >= 3 ? "pass" : "fail"}">${c.toFixed(1)}:1 · large fills and focus rings only, never text</small></div></div>`;
      const need = nonText ? 3 : 4.5; const ok = c >= need;
      return `<div class="tok"><span class="sw" style="background:${v}"></span><div><b>${role}</b><code>${name} ${v.toUpperCase()}</code><small class="${ok ? "pass" : "fail"}">${c.toFixed(1)}:1 on background ${ok ? "✓" : "✗"} (${nonText ? "graphics" : "text"} ≥ ${need}:1)</small></div></div>`;
    }).join("");
  }

  // ---------- count table ----------
  function countTable(el) {
    const rows = [["Nucleus", "15.2 ± 1.4", "14.8 ± 1.9"], ["Cell body", "151 ± 12", "148 ± 15"], ["Axon", "59.4 ± 5.1", "86.0 ± 7.7"], ["Boutons", "60.3 ± 6.2", "28.7 ± 3.4"], ["Per bouton", "3.0 ± 0.3", "1.9 ± 0.2"]];
    el.innerHTML = `<table class="ctab"><caption>S7 (smFISH 1) spots, mean ± SD, n = 3 animals · simulated data</caption>
      <thead><tr><th>Compartment</th><th>hTDP-43 WT</th><th>hTDP-43 ALS mutant</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td></tr>`).join("")}</tbody></table>`;
  }

  // ---------- progress rail ----------
  const STAGES = [["Meet", ["Phenotype", "Anatomy"]], ["Clue", ["TDP-43 clue", "Hypotheses"]], ["Design", ["Target + probe design"]], ["Observe", ["Reveal + compare"]], ["Conclude", ["Revise"]]];
  function rail(el, current, collapsed) {
    let n = 0;
    if (collapsed) {
      el.innerHTML = `<div class="rail rail-c">${STAGES.map(([, steps]) => steps.map(() => { n++; const st = n < current ? "done" : n === current ? "now" : "todo"; return `<span class="rc ${st}" title="Step ${n}">${n}</span>`; }).join("")).join('<span class="rc-gap"></span>')}</div>`;
      return;
    }
    el.innerHTML = `<nav class="rail">${STAGES.map(([stage, steps]) => `<div class="rs"><div class="rs-h">${stage}</div>${steps.map(s => { n++; const st = n < current ? "done" : n === current ? "now" : "todo"; return `<div class="rstep ${st}"><span class="rn">${n}</span>${s}</div>`; }).join("")}</div>`).join("")}</nav>`;
  }

  // ---------- fly (dorsal view), ink + washes; drawn in SVG ----------
  function flyMarkup(id) {
    const L = (d, w = 1.5) => `<path d="${d}" fill="none" stroke="var(--ink)" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const legs = [
      "M-12,-30 L-30,-46 L-44,-74 L-47,-90", "M-15,-16 L-44,-18 L-66,-6 L-76,2", "M-13,0 L-36,22 L-50,54 L-54,70"
    ];
    const mirror = d => d.replace(/-(\d+(\.\d+)?),/g, "$1,");
    return `<g class="fly" id="${id}">
      ${legs.map(d => L(d, 1.3) + L(mirror(d), 1.3)).join("")}
      <!-- abdomen with tergite bands -->
      <ellipse cx="0" cy="44" rx="23" ry="40" fill="var(--wash-body)" stroke="var(--ink)" stroke-width="1.6"/>
      ${[26, 40, 54, 68].map((y, i) => `<path d="M${-21 + i * 1.5},${y} Q0,${y + 7} ${21 - i * 1.5},${y}" fill="none" stroke="var(--ink)" stroke-width="${i === 3 ? 1 : 2.2}" opacity="${.55 - i * .08}"/>`).join("")}
      <!-- wings -->
      <path d="M-5,-10 C-40,6 -58,66 -40,104 C-28,120 -12,92 -4,36 Z" fill="var(--wash-wing)" stroke="var(--ink)" stroke-width="1.2" opacity=".92"/>
      <path d="M5,-10 C40,6 58,66 40,104 C28,120 12,92 4,36 Z" fill="var(--wash-wing)" stroke="var(--ink)" stroke-width="1.2" opacity=".92"/>
      ${L("M-6,-4 C-24,20 -36,60 -36,96", .7)}${L("M-8,4 C-18,30 -24,62 -26,88", .6)}${L("M6,-4 C24,20 36,60 36,96", .7)}${L("M8,4 C18,30 24,62 26,88", .6)}
      <!-- thorax with bristles -->
      <ellipse cx="0" cy="-18" rx="21" ry="23" fill="var(--wash-body)" stroke="var(--ink)" stroke-width="1.6"/>
      ${[[-9, -30, -12, -38], [9, -30, 12, -38], [-14, -14, -20, -20], [14, -14, 20, -20], [-5, -6, -7, 2], [5, -6, 7, 2]].map(([a, b, c, d]) => L(`M${a},${b} L${c},${d}`, .8)).join("")}
      <!-- head, eyes, antennae -->
      <ellipse cx="0" cy="-51" rx="17" ry="12" fill="var(--wash-body)" stroke="var(--ink)" stroke-width="1.6"/>
      <ellipse cx="-13" cy="-52" rx="8.5" ry="10.5" fill="var(--wash-eye)" stroke="var(--ink)" stroke-width="1.3"/>
      <ellipse cx="13" cy="-52" rx="8.5" ry="10.5" fill="var(--wash-eye)" stroke="var(--ink)" stroke-width="1.3"/>
      ${L("M-4,-62 L-6,-69 L-11,-74", .9)}${L("M4,-62 L6,-69 L11,-74", .9)}
    </g>`;
  }

  // hero frame (step 1). strength: "subtle" | "full"
  function hero(el, strength) {
    const full = strength === "full";
    const k = full ? { ink: 2.4, inkF: .045, wash: .6, grain: .55, blobs: 3 } : { ink: .9, inkF: .03, wash: .28, grain: .22, blobs: 1 };
    const uid = "h" + Math.random().toString(36).slice(2, 7);
    const strip = (x, mut) => {
      const ex = [[0, 16], [22, 40], [46, 58], [64, 92], [98, 112], [118, 150]];
      return `<g transform="translate(${x},392)">
        <line x1="-8" x2="158" y1="7" y2="7" stroke="var(--ink)" stroke-width="1" opacity=".6"/>
        ${ex.map(([a, b]) => `<rect x="${a}" y="0" width="${b - a}" height="14" fill="var(--wash-gene)" stroke="var(--ink)" stroke-width="1.1"/>`).join("")}
        ${mut ? `<line x1="104" x2="104" y1="-7" y2="21" stroke="var(--ink)" stroke-width="2.4"/><circle cx="104" cy="-10" r="2.6" fill="var(--ink)"/>` : ""}
      </g>`;
    };
    el.innerHTML = `
      <div class="hero hero-${strength}">
        <svg class="hero-art" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <filter id="${uid}ink" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence class="boil" type="fractalNoise" baseFrequency="${k.inkF}" numOctaves="2" seed="3"/>
              <feDisplacementMap in="SourceGraphic" scale="${k.ink}" xChannelSelector="R" yChannelSelector="G"/>
            </filter>
            <filter id="${uid}wc" x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="3" seed="11"/>
              <feDisplacementMap in="SourceGraphic" scale="${full ? 70 : 30}"/>
              <feGaussianBlur stdDeviation="${full ? 6 : 12}"/>
            </filter>
            <filter id="${uid}grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="5" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .4  0 0 0 -1.6 1.25"/></filter>
          </defs>
          <g filter="url(#${uid}wc)" opacity="${k.wash}">
            <ellipse cx="690" cy="250" rx="280" ry="180" fill="var(--wash-a)"/>
            ${k.blobs > 1 ? `<ellipse cx="560" cy="330" rx="120" ry="90" fill="var(--wash-b)"/><ellipse cx="860" cy="180" rx="110" ry="80" fill="var(--wash-c)"/>` : ""}
          </g>
          <g filter="url(#${uid}ink)">
            <g transform="translate(570,215) scale(1.25) rotate(-4)">${flyMarkup(uid + "a")}</g>
            <g transform="translate(830,215) scale(1.25) rotate(3)">${flyMarkup(uid + "b")}</g>
            <path d="M570,262 C570,320 560,350 545,388" fill="none" stroke="var(--ink)" stroke-width="1" stroke-dasharray="3 4" opacity=".7"/>
            <path d="M830,262 C830,320 820,350 805,388" fill="none" stroke="var(--ink)" stroke-width="1" stroke-dasharray="3 4" opacity=".7"/>
            ${strip(470, false)}${strip(730, true)}
          </g>
          <rect class="grain" width="1000" height="560" filter="url(#${uid}grain)" opacity="${k.grain}"/>
        </svg>
        <div class="hero-text">
          <p class="eyebrow">Meet · Step 1</p>
          <h1>Two flies, one human gene</h1>
          <p class="lede">The fly gene <i>TBPH</i> has been replaced by human <i>TDP-43</i>: the normal version, or one carrying an ALS mutation.</p>
          <p class="cap">They look the same.</p>
          <p class="scrollcue">Scroll to see how they behave ↓</p>
        </div>
        <div class="hero-lab" style="left:47%;top:77.5%">hTDP-43 WT<small>fly <i>TBPH</i> → human <i>TDP-43</i></small></div>
        <div class="hero-lab" style="left:73%;top:77.5%">hTDP-43 ALS mutant<small>same knock-in + one point mutation</small></div>
        <span class="tag-sim">Schematic</span>
      </div>`;
    // the boil: reseed the ink noise 12 times a second (cycling 3 seeds, like hand-drawn boil)
    const t = el.querySelector(".boil"); let i = 0;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches && !P.has("still")) setInterval(() => t.setAttribute("seed", [3, 8, 13][i++ % 3]), 1000 / 12);
  }

  // ---------- mock micrograph (canvas, additive) ----------
  const COL = { g: [70, 230, 110], m: [235, 70, 225], y: [255, 214, 60], mem: [70, 95, 175], dapi: [90, 120, 235] };
  const sprites = {};
  function sprite(key) {
    if (sprites[key]) return sprites[key];
    const c = document.createElement("canvas"); c.width = c.height = 32; const x = c.getContext("2d");
    const [r, g, b] = COL[key]; const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(.35, `rgba(${r},${g},${b},.55)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, 32, 32); return sprites[key] = c;
  }
  // geometry in world px (0.16 µm per px)
  const UM = 0.16;
  const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };
  const AX = [[134, 205], [230, 240], [330, 140], [440, 170]];
  const BR = [[[440, 170], [490, 150], [520, 100], [575, 92]], [[440, 170], [495, 190], [530, 240], [580, 250]]];
  function geom(gt) {
    const nb = gt === "WT" ? 20 : 15; const boutons = [];
    for (let i = 0; i < nb; i++) { const br = BR[i % 2]; const t = .12 + .86 * Math.floor(i / 2) / Math.ceil(nb / 2); const [x, y] = bez(...br, t); boutons.push([x, y, 6.5 + (i % 3)]); }
    return { soma: [88, 205, 46], nuc: [86, 203, 20], boutons };
  }
  function viewer(canvas, o) {
    const gt = o.genotype, r = prng(gt === "WT" ? 101 : 202), G = geom(gt);
    const dpr = 2, W = canvas.clientWidth, H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const x = canvas.getContext("2d");
    const view = o.crop || { x: 20, y: 60, w: 590, h: 290 };
    const s = Math.min(W / view.w, H / view.h);
    x.setTransform(dpr * s, 0, 0, dpr * s, dpr * (W - view.w * s) / 2 - dpr * s * view.x, dpr * (H - view.h * s) / 2 - dpr * s * view.y);
    x.fillStyle = "#000"; x.fillRect(view.x - 50, view.y - 50, view.w + 100, view.h + 100);
    x.globalCompositeOperation = "lighter";
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    // autofluorescence + grain
    for (let i = 0; i < 6; i++) { const ax = view.x + r() * view.w, ay = view.y + r() * view.h, ar = 60 + r() * 90; const g2 = x.createRadialGradient(ax, ay, 0, ax, ay, ar); g2.addColorStop(0, "rgba(40,38,60,.16)"); g2.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g2; x.beginPath(); x.arc(ax, ay, ar, 0, 7); x.fill(); }
    // membrane (dim, uneven, soft)
    if (o.mem !== false) {
      x.filter = "blur(1.6px)";
      x.fillStyle = rgba(COL.mem, .30); x.beginPath(); x.arc(G.soma[0], G.soma[1], G.soma[2], 0, 7); x.fill();
      x.strokeStyle = rgba(COL.mem, .32); x.lineCap = "round";
      x.lineWidth = 12; x.beginPath(); x.moveTo(...AX[0]); x.bezierCurveTo(...AX[1], ...AX[2], ...AX[3]); x.stroke();
      x.lineWidth = 4.5; for (const b of BR) { x.beginPath(); x.moveTo(...b[0]); x.bezierCurveTo(...b[1], ...b[2], ...b[3]); x.stroke(); }
      x.fillStyle = rgba(COL.mem, .34); for (const [bx, by, br] of G.boutons) { x.beginPath(); x.arc(bx, by, br, 0, 7); x.fill(); }
      for (let i = 0; i < 40; i++) { const a = r() * 7, d = r() * 40; x.fillStyle = rgba(COL.mem, .05 + r() * .06); x.beginPath(); x.arc(G.soma[0] + Math.cos(a) * d, G.soma[1] + Math.sin(a) * d, 6 + r() * 10, 0, 7); x.fill(); }
      x.filter = "blur(1.2px)"; x.fillStyle = rgba(COL.dapi, .42); x.beginPath(); x.arc(G.nuc[0], G.nuc[1], G.nuc[2], 0, 7); x.fill();
      x.filter = "none";
    }
    // TDP-43
    const isMut = gt !== "WT";
    const puncta = [];
    const nP = isMut ? { soma: 10, axon: 25, bout: 8 } : { soma: 5, axon: 5, bout: 2 };
    for (let i = 0; i < nP.soma; i++) { const a = r() * 7, d = G.nuc[2] + 4 + r() * 18; puncta.push([G.soma[0] + Math.cos(a) * d, G.soma[1] + Math.sin(a) * d]); }
    for (let i = 0; i < nP.axon; i++) { const [px, py] = bez(...AX, .05 + r() * .9); puncta.push([px + gauss(r) * 2, py + gauss(r) * 2]); }
    for (let i = 0; i < nP.bout; i++) { const b = G.boutons[Math.floor(r() * G.boutons.length)]; puncta.push([b[0] + gauss(r) * 2, b[1] + gauss(r) * 2]); }
    const tdp = o.tdp || "add";
    const TC = o.tdpCol || COL.y;
    if (tdp !== "off") {
      const amp = o.amp != null ? o.amp : (tdp === "dim" ? .38 : 1);
      const nucI = isMut ? .7 : 1;
      if (tdp === "contour") {
        x.strokeStyle = rgba(TC, .55 * nucI); x.lineWidth = 1.1; x.beginPath(); x.arc(G.nuc[0], G.nuc[1], G.nuc[2] - 1, 0, 7); x.stroke();
        x.strokeStyle = rgba(TC, .75); x.lineWidth = .8; for (const [px, py] of puncta) { x.beginPath(); x.arc(px, py, 3.4, 0, 7); x.stroke(); }
      } else {
        const g3 = x.createRadialGradient(G.nuc[0], G.nuc[1], 0, G.nuc[0], G.nuc[1], G.nuc[2]); g3.addColorStop(0, rgba(TC, .36 * nucI * amp)); g3.addColorStop(1, rgba(TC, .08 * nucI * amp));
        x.fillStyle = g3; x.beginPath(); x.arc(G.nuc[0], G.nuc[1], G.nuc[2], 0, 7); x.fill();
        x.filter = "blur(1px)"; x.fillStyle = rgba(TC, .85 * amp); for (const [px, py] of puncta) { x.beginPath(); x.arc(px, py, 2.6, 0, 7); x.fill(); } x.filter = "none";
      }
    }
    // smFISH molecules: S7 (green, all isoforms) + S8 (magenta, long-3'UTR isoforms) → long = white
    if (o.fish !== false) {
      const spot = (px, py, long) => {
        const a = .9 + .2 * (r() - .5) * 2 * .5; const sz = 5.2;
        x.globalAlpha = a; x.drawImage(sprite("g"), px - sz / 2, py - sz / 2, sz, sz);
        if (long) x.drawImage(sprite("m"), px - sz / 2, py - sz / 2, sz, sz);
        x.globalAlpha = 1;
      };
      const C = isMut ? { nuc: [15, .2], cyto: [150, .2], axon: [85, .86], bout: [29, .69] } : { nuc: [15, .2], cyto: [150, .2], axon: [60, .8], bout: [60, .85] };
      for (let i = 0; i < poisson(r, C.nuc[0]); i++) { const a = r() * 7, d = Math.sqrt(r()) * (G.nuc[2] - 2); spot(G.nuc[0] + Math.cos(a) * d, G.nuc[1] + Math.sin(a) * d, r() < C.nuc[1]); }
      for (let i = 0; i < poisson(r, C.cyto[0]); i++) { const a = r() * 7, d = G.nuc[2] + 1 + Math.sqrt(r()) * (G.soma[2] - G.nuc[2] - 3); spot(G.soma[0] + Math.cos(a) * d, G.soma[1] + Math.sin(a) * d, r() < C.cyto[1]); }
      const axPuncta = puncta.slice(nP.soma, nP.soma + nP.axon);
      for (let i = 0; i < poisson(r, C.axon[0]); i++) {
        const long = r() < C.axon[1];
        if (isMut && long && r() < .55) { const p = axPuncta[Math.floor(r() * axPuncta.length)]; spot(p[0] + gauss(r) * .9, p[1] + gauss(r) * .9, true); }
        else { const [px, py] = bez(...AX, .03 + r() * .94); spot(px + gauss(r) * 2.4, py + gauss(r) * 2.4, long); }
      }
      for (let i = 0; i < poisson(r, C.bout[0]); i++) { const b = G.boutons[Math.floor(r() * G.boutons.length)]; const a = r() * 7, d = Math.sqrt(r()) * (b[2] - 1.5); spot(b[0] + Math.cos(a) * d, b[1] + Math.sin(a) * d, r() < C.bout[1]); }
      // transcription site (S7 exon also labels nascent RNA)
      x.globalAlpha = .95; x.drawImage(sprite("g"), G.nuc[0] + 6 - 7, G.nuc[1] - 5 - 7, 14, 14); x.globalAlpha = 1;
    }
    // sensor grain
    x.globalCompositeOperation = "lighter";
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(255,255,255,${r() * .05})`; x.fillRect(view.x + r() * view.w, view.y + r() * view.h, .7, .7); }
    x.globalCompositeOperation = "source-over";
    return { umPerPx: UM / s };
  }

  // ---------- SuperPlot (SVG) ----------
  function superplot(el) {
    const r = prng(7);
    const comps = ["Nucleus", "Cell body", "Axon", "Boutons"];
    const mu = { WT: [15, 150, 60, 60], MUT: [15, 150, 85, 29] };
    const W = 900, H = 212, L = 54, B = 44, T = 12, ymax = 180;
    const Y = v => T + (H - T - B) * (1 - v / ymax);
    const gx = i => L + 60 + i * ((W - L - 80) / comps.length);
    let s = `<svg viewBox="0 0 ${W} ${H}" class="splot" role="img" aria-label="SuperPlot of S7 spots per compartment">`;
    for (const v of [0, 50, 100, 150]) s += `<line x1="${L}" x2="${W - 8}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end" class="tick">${v}</text>`;
    s += `<text transform="translate(14,${(H - B + T) / 2}) rotate(-90)" text-anchor="middle" class="axl">spots per compartment</text>`;
    comps.forEach((c, i) => {
      ["WT", "MUT"].forEach((g, j) => {
        const cx = gx(i) + j * 46; const m = mu[g][i];
        const vals = [0, 1, 2].map(() => m * (1 + .09 * gauss(r)));
        const mean = vals.reduce((a, b) => a + b) / 3, sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / 2);
        vals.forEach((v, k) => { s += `<circle cx="${cx + (k - 1) * 7}" cy="${Y(v)}" r="5" class="pt ${g === "WT" ? "wt" : "mut"}"><title>${g === "WT" ? "hTDP-43 WT" : "ALS mutant"} · animal ${k + 1}: ${v.toFixed(0)}</title></circle>`; });
        s += `<line x1="${cx + 17}" x2="${cx + 17}" y1="${Y(mean - sd)}" y2="${Y(mean + sd)}" class="sd"/><line x1="${cx - 15}" x2="${cx + 21}" y1="${Y(mean)}" y2="${Y(mean)}" class="mean"/>`;
        s += `<text x="${cx}" y="${H - B + 16}" text-anchor="middle" class="tick">${g === "WT" ? "WT" : "mut"}</text>`;
      });
      s += `<text x="${gx(i) + 23}" y="${H - B + 34}" text-anchor="middle" class="xl">${c}</text>`;
    });
    el.innerHTML = s + "</svg>";
  }

  // ---------- compare panel ----------
  function compare(el) {
    const cards = [
      ["Nucleus", "Splicing / alternative exon / intron retention", "ruled", "", "No difference in the cassette-exon colour mix (our guess, mock text)."],
      ["Cytoplasm", "Localisation / transport", "supported", "Fewer white spots in boutons, more in the axon.", "Fewer magenta spots in boutons; green unchanged."],
      ["Cytoplasm", "RNA stability", "", "", ""],
      ["Cytoplasm", "Granule incorporation", "unres", "White spots sit on TDP-43 puncta in the axon?", ""],
    ];
    const v = (st, k, lab) => `<button class="vb ${st === k ? "on" : ""}">${lab}</button>`;
    el.innerHTML = `<div class="cmp">
      <div class="cmp-tabs"><button>Viewer</button><button class="on">Compare</button></div>
      <label class="fld"><span>Observation</span><div class="ta">Mutant boutons have about half as many white spots; the axon has more, many on yellow puncta.</div></label>
      <label class="fld"><span>Interpretation</span><div class="ta empty">What could explain it?</div></label>
      <div class="cards">${cards.map(([grp, name, st, ev, pred]) => `
        <div class="mc"><div class="mc-h"><small>${grp}</small><b>${name}</b></div>
          <div class="vbar">${v(st, "ruled", "Ruled out")}${v(st, "supported", "Supported")}${v(st, "unres", "Unresolved")}</div>
          ${pred ? `<div class="pred">Your prediction: ${pred}</div>` : ""}
          <div class="ev ${ev ? "" : "empty"}">${ev || "Evidence (optional)"}</div></div>`).join("")}</div>
    </div>`;
  }

  // ---------- step 6 frame ----------
  function step6(el, opt = {}) {
    el.innerHTML = `
      <div class="s6">
        <div class="s6-rail"></div>
        <div class="s6-head">
          <div><p class="eyebrow">Observe · Step 6</p><h2>Reveal + compare</h2></div>
          <div class="pair"><span class="chip c1">smFISH 1 · S7</span><span class="chip c2">smFISH 2 · S8</span><span class="chip c3">TDP-43</span><span class="chip c4">Membrane + DAPI</span><button class="ghost">Choose a new pair</button></div>
        </div>
        <div class="s6-viewer">
          <div class="vtool"><span>Split view</span><span class="key">F</span><span>flicker</span><span class="sep"></span><span>Fly to:</span><b>Cell body</b><b>Axon</b><b>Boutons</b><span class="sep"></span><span>Animal</span><b class="on">1</b><b>2</b><b>3</b></div>
          <div class="vsplit">
            <div class="vpane"><canvas data-gt="WT"></canvas><div class="ovl">S7 <i class="d g"></i> S8 <i class="d m"></i> · hTDP-43 WT · animal 1 · simulated</div><div class="sbar"><i></i>10 µm</div></div>
            <div class="vpane"><canvas data-gt="MUT"></canvas><div class="ovl">S7 <i class="d g"></i> S8 <i class="d m"></i> · hTDP-43 ALS mutant · animal 1 · simulated</div><div class="sbar"><i></i>10 µm</div></div>
          </div>
          <div class="legend"><b>Decoder</b> <span><i class="d w"></i>White: carries S7 and S8</span><span><i class="d g"></i>Green only: S7 without S8</span><span><i class="d m"></i>Magenta only: S8 without S7</span><span>Bright nuclear spot: transcription site</span><span class="proj">2D maximum-intensity projection (simulated)</span></div>
        </div>
        <div class="s6-plot">
          <div class="ptabs"><button class="on">Plot</button><button>Table</button><span class="sep"></span><span class="pl">Channel</span><button class="on">smFISH 1</button><button>smFISH 2</button><button>Both</button><span class="sep"></span><span class="pl">Measure</span><button class="on">Counts</button><button>Per terminal unit</button><button>N:C ratio</button><button>On TDP-43</button></div>
          <div class="ptitle">S7 (smFISH 1) spots per compartment · n = 3 animals · simulated data</div>
          <div class="plotbox"></div>
        </div>
        <div class="s6-side"></div>
      </div>`;
    rail(el.querySelector(".s6-rail"), 6, true);
    compare(el.querySelector(".s6-side"));
    superplot(el.querySelector(".plotbox"));
    const draw = () => el.querySelectorAll("canvas").forEach(c => viewer(c, { genotype: c.dataset.gt, tdp: opt.tdp || "dim" }));
    requestAnimationFrame(draw);
    return draw;
  }

  // ---------- TDP-43 overlap test strip ----------
  function overlapTest(el) {
    const modes = [["add", "Additive yellow (current default)", "Magenta-on-yellow reads as near-white: looks like a double-positive spot."], ["dim", "Yellow at ~40% when smFISH is on", "Puncta still visible; white stays clearly white."], ["contour", "Yellow outline when smFISH is on", "Cleanest separation; puncta read as rings, not blobs."]];
    el.innerHTML = `<div class="otest">${modes.map(([m, t, n]) => `<figure><canvas data-m="${m}"></canvas><figcaption><b>${t}</b>${n}</figcaption></figure>`).join("")}</div>`;
    const draw = () => el.querySelectorAll("canvas").forEach(c => viewer(c, { genotype: "MUT", tdp: c.dataset.m, crop: { x: 250, y: 150, w: 110, h: 62 } }));
    requestAnimationFrame(draw); return draw;
  }

  // ---------- TDP-43 colour options ----------
  function colourTest(el) {
    const opts = [
      ["Yellow, 40% when smFISH is on", [255, 214, 60], .38, "Current default. Magenta + dim yellow → pink-lavender, not white."],
      ["Cyan, 40% when smFISH is on", [60, 220, 235], .38, "Common IF colour. Sits close to the membrane blue."],
      ["Red-orange, full", [255, 80, 50], 1, "Never sums to white with magenta, but red + green → yellow, and red–green is the colour-blind pair."],
      ["Red-orange, 40% when smFISH is on", [255, 80, 50], .38, "Safest for overlaps; dim puncta are easier to miss."],
    ];
    el.innerHTML = `<div class="otest otest4">${opts.map(([t, c, a, n], i) => `<figure><canvas data-i="${i}"></canvas><figcaption><b>${t}</b>${n}</figcaption></figure>`).join("")}</div>`;
    const draw = () => el.querySelectorAll("canvas").forEach(cv => { const [, c, a] = opts[+cv.dataset.i]; viewer(cv, { genotype: "MUT", tdp: "add", tdpCol: c, amp: a, crop: { x: 250, y: 150, w: 110, h: 62 } }); });
    requestAnimationFrame(draw); return draw;
  }

  return { init, fitFrames, tokens, countTable, rail, hero, step6, overlapTest, colourTest, onRedraw };
})();
