// Step 1, shared part: the hero (knock-in sequence, 9.6 s, docs/storyboards/pdf-openings.md) and
// the three-assay landing below it (shot F): every station runs live (stations.js).
//
// Deterministic: every animated state is a function of timeline time; idle grooming follows a
// seeded schedule. `?t=3.2` freezes the hero at 3.2 s (review renders); reduced motion shows the
// end frame with no idle motion.

import { CASES, CASE_ORDER } from "../content.js";
import { href } from "../router.js";
import { term } from "../glossary.js";
import { loadGsap, reducedMotion } from "../gsap.js";
import { loadFlySprite, flyNode, groomFrame, startBoil, stopBoil, ensureBoilFilter } from "../fly.js";
import { mulberry32 } from "../prng.js";
import { stationArt, stationLive } from "../stations.js";
import { handOff } from "../handoff.js";

// Schematic exon blocks within a 180-unit gene: [start, end, kind]; kind sets the block height
// (c = coding, u = UTR, m = coding + long 3′UTR).
const FLY_EXONS = [[0, 14, "u"], [24, 46, "c"], [56, 74, "c"], [86, 118, "c"], [128, 148, "c"], [158, 180, "u"]];
const HUMAN_EXONS = [[0, 10, "u"], [20, 34, "c"], [44, 64, "c"], [76, 94, "c"], [104, 120, "c"], [130, 180, "m"]];
const H = { c: 16, u: 9, m: 12 };
const MUTATION_AT = 146;   // in the last exon: most ALS-linked TDP-43 mutations lie in its C-terminal region

// The mutant stands turned a little and slightly lower, so the pair reads as two animals rather
// than one drawing copied; pose and behaviour stay the same (no visible defect).
const FLIES = [
  { id: "wt", x: 172, out: -1, turn: 0, dx: 0, dy: 0, label: "hTDP-43 WT" },
  { id: "mut", x: 468, out: 1, turn: 8, dx: 4, dy: 5, label: "hTDP-43 ALS mutant" },
];
const FLY_Y = 104, FLY_H = 300, STRIP_Y = 352, STRIP_W = 180;
const CW = STRIP_W + 12, CH = 28;   // a gene cassette's frame
const ORIGIN = { x: 302, y: 428 };  // where the human cassette appears, between the two loci
// A point on the fly's midline, `d` scene units behind the thorax, after the fly's turn.
const behind = (f, d) => {
  const a = f.turn * Math.PI / 180;
  return [f.x + f.dx - d * Math.sin(a), FLY_Y + f.dy + d * Math.cos(a)];
};

// Where each fly's knock-in moves: the slot in its chromosome, the aim point below and inside it
// (the human cassette strikes up and outwards from there), and the arc of the fly cassette it
// knocks out (up and away on the outer side, then falling).
function knockPath(f) {
  const cx = f.x - 18;
  const slot = { x: cx, y: STRIP_Y };
  const aim = { x: cx - f.out * 46, y: STRIP_Y + 66 };
  const k = (aim.y - (STRIP_Y + CH)) / (aim.y - slot.y);   // the frames touch here
  const contact = { x: aim.x + (slot.x - aim.x) * k, y: STRIP_Y + CH };
  return {
    cx, slot, aim, contact,
    peak: { x: cx + f.out * 34, y: STRIP_Y - 30 },
    fall: { x: cx + f.out * 84, y: STRIP_Y + 100 },
  };
}

function cassette(kind, exons, extra = "") {
  return `
      <rect class="cassette-frame" x="${-CW / 2}" y="${-CH / 2}" width="${CW}" height="${CH}" rx="6"/>
      <path class="cassette-line" d="M${-STRIP_W / 2},0 H${STRIP_W / 2}"/>
      ${exons.map(([a, b, k]) => `<rect class="gene-exon gene-exon--${kind}" x="${-STRIP_W / 2 + a}" y="${-H[k] / 2}" width="${b - a}" height="${H[k]}"/>`).join("")}
      ${extra}`;
}

function locus(f) {
  const { cx, contact } = knockPath(f);
  const a = cx - CW / 2 - 30, b = cx + CW / 2 + 30;
  // ink strokes flying off both ends of the edge where the cassettes meet
  const lo = Math.max(cx, contact.x) - CW / 2, hi = Math.min(cx, contact.x) + CW / 2, edge = STRIP_Y + CH / 2;
  const spark = (x, dir) => [[1, 0], [0.8, 0.62], [0.36, 0.94]].map(([u, v]) =>
    `<path class="impact" d="M${x + dir * u * 4},${edge + v * 4} L${x + dir * u * 13},${edge + v * 13}"/>`).join("");
  const mutation = f.id === "mut" ? `
      <g class="gene-mutation">
        <path class="gene-tick" d="M${-STRIP_W / 2 + MUTATION_AT},-15 L${-STRIP_W / 2 + MUTATION_AT},15"/>
        <circle class="gene-dot" cx="${-STRIP_W / 2 + MUTATION_AT}" cy="-19" r="2.6"/>
        <text class="scene-small gene-mut-label" x="${-STRIP_W / 2 + MUTATION_AT + 9}" y="-30"><tspan>ALS-linked</tspan><tspan x="${-STRIP_W / 2 + MUTATION_AT + 9}" dy="14">point mutation</tspan></text>
      </g>` : "";
  return `
    <g class="gene" data-fly="${f.id}">
      <path class="chromosome" d="M${a},${STRIP_Y} Q${cx},${STRIP_Y} ${b},${STRIP_Y}"/>
      <g class="cassette cassette--fly">${cassette("fly", FLY_EXONS, `
        <text class="scene-gene gene-name gene-name--fly" x="0" y="32" text-anchor="middle">fly <tspan font-style="italic">TBPH</tspan></text>`)}
      </g>
      <g class="impacts">${spark(lo, -1)}${spark(hi, 1)}</g>
      <g class="cassette cassette--human">${cassette("human", HUMAN_EXONS, `
        <text class="scene-gene gene-name gene-name--human" x="0" y="32" text-anchor="middle">human <tspan font-style="italic">TDP-43</tspan></text>${mutation}`)}
      </g>
    </g>`;
}

// "genomic DNA", once, in the gap between the two loci, pointing to both chromosome lines.
function dnaLabel() {
  const l = FLIES[0].x - 18 + CW / 2 + 30, r = FLIES[1].x - 18 - CW / 2 - 30, mid = (l + r) / 2;
  return `
      <g class="dna-label">
        <path class="dna-pointer" d="M${mid - 24},${STRIP_Y + 9} L${l + 2},${STRIP_Y + 3} M${mid + 24},${STRIP_Y + 9} L${r - 2},${STRIP_Y + 3}"/>
        <text class="scene-small" x="${mid}" y="${STRIP_Y + 21}" text-anchor="middle">genomic DNA</text>
      </g>`;
}

function scene() {
  return `
    <svg class="hero__scene" viewBox="0 0 640 470" role="img" aria-label="Two humanised flies, identical in appearance. In each fly's genomic DNA, a human TDP-43 gene cassette knocks out the fly gene TBPH and takes its place; the mutant's copy carries one point mutation.">
      <g class="leaders">${FLIES.map(f => {
        const [x0, y0] = behind(f, 196), [x1, y1] = behind(f, 222);
        return `<path class="leader" data-fly="${f.id}" d="M${x0.toFixed(1)},${y0.toFixed(1)} C${x1.toFixed(1)},${y1.toFixed(1)} ${f.x - 18},${STRIP_Y - 46} ${f.x - 18},${STRIP_Y - 18}"/>`;
      }).join("")}</g>
      <g class="genes">${FLIES.map(locus).join("")}${dnaLabel()}</g>
      <g class="flies"></g>
      <g class="geno-labels">${FLIES.map(f => `
        <g class="geno" data-fly="${f.id}">
          <text class="scene-label" x="${f.x}" y="440" text-anchor="middle">${f.label}</text>
        </g>`).join("")}</g>
    </svg>`;
}

// Idle grooming, deterministic: each fly alternates standing (2.6–5 s) and grooming bouts
// (2.2–3.2 s: legs up, rubbing, legs back down); the second fly starts later, so the two are
// never in step. Nothing grooms during the 9.6 s sequence, so no motion competes with its reads.
function groomSchedule(seed, first, until = 600) {
  const r = mulberry32(seed);
  const out = [];
  let t = first - 2.6;   // the first bout starts at `first`
  while (t < until) {
    t += out.length ? 2.6 + r() * 2.4 : 2.6;
    const d = 2.2 + r() * 1.0;
    out.push([t, t + d]);
    t += d;
  }
  return out;
}

// The system line on each station card: CASES[id].system as a "… system" phrase, with NMJ's glossary hover.
const STATION_SYSTEM = {
  nmj: `Leg motor neuron &amp; ${term("nmj", "NMJ")} system`,
  pdf: "Pdf clock neuron system",
  mb: "Mushroom body system",
};

function stations() {
  return CASE_ORDER.map(id => {
    const c = CASES[id];
    const name = `<span class="station__name">${c.phenotype}</span>`;
    const body = link => `
      <span class="station__art">${stationArt[id]()}</span>
      ${link ? `<a class="station__link" href="${link}" aria-describedby="station-sub-${id}">${name}</a>` : name}
      <span class="station__sub t-ui t-muted" id="station-sub-${id}"><span>${STATION_SYSTEM[id]}</span><span>${c.assay}</span></span>
      <span class="station__go">${c.available ? "Choose this system →" : "Not available in this build"}</span>`;
    // a card, not a link: the link wraps the name and stretches over the card, so the NMJ glossary button is no link's child
    return c.available
      ? `<li><div class="station" data-case="${id}">${body(href(id, 1))}</div></li>`
      : `<li><div class="station is-off" aria-disabled="true">${body("")}</div></li>`;
  }).join("");
}

export async function mount(root) {
  root.innerHTML = `
    <div class="story story--landing">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero__text">
          <p class="t-label">Introduction · Start</p>
          <h1 class="t-display" id="hero-title">Studying ALS in humanised flies</h1>
          <p class="t-story t-muted">${term("als", "ALS")} is a fatal neurodegenerative disease. These two flies are ${term("humanised", "humanised")}, with human ${term("tdp43", "<i>TDP-43</i>")} replacing the fly gene <i>TBPH</i>: one carries the wild-type (WT) version, and the other carries an <span class="nw">ALS-linked</span> mutation.</p>
          <p class="hero__caption"><span class="hero__cap">They look the same, but behave differently.</span></p>
        </div>
        <div class="hero__art">
          <div class="hero__wash" aria-hidden="true"></div>
          ${scene()}
          <p class="hero__tools"><button class="btn" type="button" data-act="skip">Skip animation</button><button class="btn" type="button" data-act="replay" hidden>Replay animation</button><span class="tag-sim">Schematic</span></p>
        </div>
      </section>
      <h2 class="t-h2 landing__choose" id="choose" tabindex="-1">Choose your neuron system</h2>
      <p class="t-story">In these simulated data, mutant flies behave abnormally in three assays, each relying on a different neuron system. Your group works with one system.</p>
      <div class="legend" role="list" aria-label="Lanes in every station">
        ${FLIES.map(f => `
        <span class="legend__item" role="listitem">
          <svg class="legend__fly fly" data-fly="${f.id}" aria-hidden="true"><use href="#fly-dorsal-stand-0" filter="url(#ink-boil)"/></svg>
          <span class="legend__text"><span class="legend__name">${f.label}</span><span class="t-ui t-muted">${f.id === "wt" ? "left" : "right"} lane</span></span>
        </span>`).join("")}
      </div>
      <ul class="stations" role="list">${stations()}</ul>
      <svg class="legend-ghosts" aria-hidden="true">${FLIES.map(f => `<g class="fly" data-fly="${f.id}"><use href="#fly-dorsal-stand-0" filter="url(#ink-boil)"/></g>`).join("")}</svg>
    </div>`;

  const svg = root.querySelector(".hero__scene");
  ensureBoilFilter();   // drawn with the ink texture even when frozen or with reduced motion (not animated)
  const [meta, lateral] = await Promise.all([loadFlySprite("dorsal"), loadFlySprite("lateral")]);
  const liveDraws = [];
  for (const [id, live] of Object.entries(stationLive)) {
    const station = root.querySelector(`.station[data-case=${id}]`);
    if (!station) continue;
    liveDraws.push(live.start(station.querySelector("svg"), lateral));
    station.addEventListener("click", e => {
      if (e.target.closest(".gl")) return;   // a glossary term on the card pins its tip (glossary.js) instead of navigating
      handOff(live.handOff, e.currentTarget.querySelector(".station__art"));
    });
  }
  const legendFlies = [...root.querySelectorAll(".legend__fly")];
  legendFlies.forEach(el => el.setAttribute("viewBox", meta.viewBox));
  const flies = FLIES.map(f => {
    const node = flyNode(meta, { x: f.x, y: FLY_Y, height: FLY_H, className: "fly" });
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${f.dx} ${f.dy}) rotate(${f.turn} ${f.x} ${FLY_Y})`);
    g.append(node.el);
    svg.querySelector(".flies").append(g);
    return node;
  });
  const schedules = [groomSchedule(11, 10.0), groomSchedule(29, 12.5)];

  const gsap = await loadGsap();
  const q = s => svg.querySelectorAll(s);
  const P = new URLSearchParams(location.search);
  const frozen = P.has("t") ? Number(P.get("t")) : null;
  const still = reducedMotion();

  // Cassettes move as plain {x, y, r, sx, sy} objects written to their transform each frame, so
  // rotation and squash pivot on the cassette's centre and a frozen frame is exact.
  const poses = [];
  const pose = (el, x, y) => { const p = { el, x, y, r: 0, sx: 1, sy: 1 }; poses.push(p); return p; };
  const drawPoses = () => poses.forEach(p =>
    p.el.setAttribute("transform", `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.r.toFixed(2)}) scale(${p.sx.toFixed(3)} ${p.sy.toFixed(3)})`));
  const loci = FLIES.map(f => {
    const gene = svg.querySelector(`.gene[data-fly=${f.id}]`);
    const path = knockPath(f);
    return {
      f, gene, path,
      old: pose(gene.querySelector(".cassette--fly"), path.slot.x, path.slot.y),
      neu: pose(gene.querySelector(".cassette--human"), ORIGIN.x, ORIGIN.y + 42),
    };
  });

  // ---------- the 9.6 s timeline (storyboard shots A–E) ----------
  const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut" }, onUpdate: drawPoses });
  gsap.set(q(".leader"), { drawSVG: "0%" });
  gsap.set(q(".gene, .geno, .gene-mutation, .cassette--human, .gene-name--fly, .dna-label"), { autoAlpha: 0 });
  gsap.set(q(".impact"), { drawSVG: "0%" });
  gsap.set(q(".gene-tick"), { drawSVG: "50% 50%" });

  // B 0.8–1.6: leader lines draw from each fly to its locus; the loci appear as they arrive
  tl.to(q(".leader"), { drawSVG: "100%", duration: 0.8 }, 0.8)
    .fromTo(q(".gene"), { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }, 1.3)
    .fromTo(q(".dna-label"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out" }, 1.4)
  // C 1.6–6.6: the knock-in. Each fly's own gene is named first.
    .fromTo(q(".gene-name--fly"), { autoAlpha: 0, y: 5 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 1.6);

  // 2.6–3.4: one human TDP-43 cassette rises between the flies (the mutant's copy waits under it)
  const [wt, mut] = loci;
  tl.to(wt.gene.querySelector(".cassette--human"), { autoAlpha: 1, duration: 0.45, ease: "power1.out" }, 2.6)
    .to([wt.neu, mut.neu], { y: ORIGIN.y, duration: 0.7, ease: "power2.out" }, 2.6)
    .set(mut.gene.querySelector(".cassette--human"), { autoAlpha: 1 }, 3.4)
  // the copies' labels step aside while the two part, so the words never overlap
    .to(q(".gene-name--human"), { autoAlpha: 0, duration: 0.12, ease: "power1.in" }, 3.4)
    .to(q(".gene-name--human"), { autoAlpha: 1, duration: 0.25, ease: "power1.out" }, 3.8);

  for (const { f, gene, path, old, neu } of loci) {
    const { slot, aim, contact, peak, fall } = path;
    const back = { x: aim.x + (aim.x - slot.x) * 0.12, y: aim.y + (aim.y - slot.y) * 0.12 };   // the wind-up
    // 3.4–4.4: the copies part, one to each fly, on a shallow arc
    tl.to(neu, { motionPath: { path: [{ x: ORIGIN.x, y: ORIGIN.y }, { x: (ORIGIN.x + aim.x) / 2, y: aim.y - 14 }, { x: aim.x, y: aim.y }], curviness: 1.2 }, duration: 1.0, ease: "power2.out" }, 3.4)
      .to(neu, { keyframes: [{ r: -f.out * 6, duration: 0.45, ease: "power1.out" }, { r: 0, duration: 0.55, ease: "power1.inOut" }] }, 3.4)
    // 4.4–4.6: a short wind-up; the fly gene's label clears before the strike
      .to(neu, { x: back.x, y: back.y, r: f.out * 3, duration: 0.2, ease: "power1.out" }, 4.4)
      .to(gene.querySelector(".gene-name--fly"), { autoAlpha: 0, y: 4, duration: 0.15, ease: "power1.in" }, 4.48)
    // 4.6–4.72: the strike; on contact the fly cassette is knocked out, up and away, then falls
      .to(neu, { x: contact.x, y: contact.y, r: 0, duration: 0.12, ease: "power2.in" }, 4.6)
      .to(old, { x: fall.x, duration: 0.85, ease: "power1.out" }, 4.72)
      .to(old, { keyframes: [{ y: peak.y, duration: 0.22, ease: "power2.out" }, { y: fall.y, duration: 0.63, ease: "power2.in" }] }, 4.72)
      .to(old, { r: f.out * 38, duration: 0.85, ease: "power1.out" }, 4.72)
      .to(gene.querySelector(".cassette--fly"), { autoAlpha: 0, duration: 0.55, ease: "power1.in" }, 4.95)
      .to(gene.querySelectorAll(".impact"), { drawSVG: "100%", duration: 0.12, ease: "power2.out" }, 4.72)
      .to(gene.querySelectorAll(".impact"), { autoAlpha: 0, duration: 0.22 }, 4.8)
      .to(gene.querySelector(".chromosome"), { keyframes: [
        { attr: { d: `M${slot.x - CW / 2 - 30},${STRIP_Y} Q${slot.x},${STRIP_Y - 9} ${slot.x + CW / 2 + 30},${STRIP_Y}` }, duration: 0.08, ease: "power2.out" },
        { attr: { d: `M${slot.x - CW / 2 - 30},${STRIP_Y} Q${slot.x},${STRIP_Y} ${slot.x + CW / 2 + 30},${STRIP_Y}` }, duration: 0.5, ease: "power2.out" }] }, 4.72)
    // ... and the human cassette carries on into the slot, settling with a small squash
      .to(neu, { x: slot.x, y: slot.y, duration: 0.3, ease: "power3.out" }, 4.72)
      .to(neu, { keyframes: [{ sx: 1.05, sy: 0.86, duration: 0.07, ease: "power1.out" }, { sx: 1, sy: 1, duration: 0.3, ease: "power2.out" }] }, 4.98);
  }

  // D 6.6–8.2: one mark on the mutant's gene only; then the flies are named
  tl.set(q(".gene-mutation"), { autoAlpha: 1 }, 6.6)
    .to(q(".gene-tick"), { drawSVG: "0% 100%", duration: 0.35, ease: "power2.out" }, 6.6)
    .fromTo(q(".gene-dot"), { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.25, ease: "power2.out" }, 6.8)
    .fromTo(q(".gene-mut-label"), { autoAlpha: 0, x: -4 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out" }, 6.85)
    .fromTo(q(".geno"), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out", stagger: 0.12 }, 7.4)
  // E 8.2–9.6: a hold; the knock-ins stay, linked to their flies (the caption is on screen from the start)
    .to({}, { duration: 0.4 }, 9.2);
  drawPoses();

  const controls = { skip: root.querySelector("[data-act=skip]"), replay: root.querySelector("[data-act=replay]") };
  const hooks = { done: () => {}, replay: () => {} };   // set by the hero-to-legend transition below
  tl.eventCallback("onComplete", () => { controls.skip.hidden = true; controls.replay.hidden = false; hooks.done(); });
  controls.skip.addEventListener("click", () => { tl.progress(1); drawPoses(); controls.replay.focus({ preventScroll: true }); });   // the clicked button hides: keep focus on the pair
  controls.replay.addEventListener("click", () => { controls.replay.hidden = true; controls.skip.hidden = false; hooks.replay(); tl.restart(); drawPoses(); controls.skip.focus({ preventScroll: true }); });

  let drawWings = null;   // the flying stand-ins' wingbeat (below)

  // ---------- fly frames: idle grooming on twos, from the seeded schedule ----------
  const t0 = performance.now();
  const clock = () => (frozen != null ? frozen : (performance.now() - t0) / 1000);
  const drawFlies = () => {
    const t = clock();
    flies.forEach((fly, i) => {
      const g = still ? null : schedules[i].find(([a, b]) => t >= a && t < b);
      if (g) fly.show(...groomFrame(fly.meta.frames, g[0], g[1], t));
      else fly.show("stand", 0);
    });
    for (const draw of liveDraws) draw(still ? 0 : t);
    drawWings?.(t);
  };
  gsap.ticker.add(drawFlies);
  drawFlies();

  // ---------- scroll on to the assays: the hero flies shrink into the lane legend (shared element) ----------
  // Scrubbed by scroll. While it runs, two stand-ins fly from the hero to the legend; both ends
  // are measured every update in the page's own coordinates, so resizing can't break the match.
  // They fly: wings half open as they take off and land, beating on twos in between, in real
  // time, so a fly held mid-way by a paused scroll hovers. The caption completes as soon as the
  // scroll starts. A window tall enough to show the whole page can't scroll, so there the flies
  // set off on their own once the hero sequence has played.
  const ghostSvg = root.querySelector(".legend-ghosts");
  const ghosts = [...ghostSvg.querySelectorAll("g")];
  const leaders = svg.querySelector(".leaders");
  const [, , vw0, vh0] = meta.viewBox.split(" ").map(Number);
  const rel = (m, x, y, base) => { const p = new DOMPoint(x, y).matrixTransform(m); return [p.x - base.left, p.y - base.top]; };
  const legendState = { p: 0 };
  function drawLegend() {
    // down first, then across: the flies drop past the hero text before sliding to the legend
    const p = legendState.p, e = gsap.parseEase("power2.inOut")(p), ex = gsap.parseEase("power2.in")(p), ey = gsap.parseEase("power2.out")(p);
    const base = root.querySelector(".story--landing").getBoundingClientRect();
    const moving = p > 0.001 && p < 0.999 && !still;
    flies.forEach((fly, i) => {
      const f = FLIES[i];
      fly.el.style.visibility = (p >= 0.999 && !still) || moving ? "hidden" : "";
      legendFlies[i].style.visibility = p >= 0.999 || still ? "" : "hidden";
      ghosts[i].style.display = moving ? "" : "none";
      if (!moving) return;
      const m0 = svg.getScreenCTM(), m1 = legendFlies[i].getScreenCTM();
      const [x0, y0] = rel(m0, f.x + f.dx, FLY_Y + f.dy, base), k0 = m0.a * FLY_H / vh0;
      const [x1, y1] = rel(m1, 0, 0, base), k1 = m1.a;
      const k = k0 * Math.pow(k1 / k0, e);
      ghosts[i].setAttribute("transform", `translate(${(x0 + (x1 - x0) * ex).toFixed(1)} ${(y0 + (y1 - y0) * ey).toFixed(1)}) rotate(${(f.turn * (1 - e)).toFixed(2)}) scale(${k.toFixed(4)})`);
      ghosts[i].style.strokeWidth = `${(1.4 - 0.5 * e).toFixed(2)}px`;
    });
    drawWings(clock());
    leaders.style.opacity = String(Math.max(0, 1 - p / 0.25));
  }
  const flap = meta.frames.flap ? n => `#fly-dorsal-flap-${n}` : null;
  drawWings = t => {
    const p = legendState.p;
    ghosts.forEach((g, i) => {
      if (g.style.display === "none") return;
      const href = !flap ? flies[i].use.getAttribute("href")
        : p < 0.05 || p > 0.95 ? flap(0)                          // half open: taking off, landing
        : flap(1 + ((Math.floor(t * 12) + i) % 2));               // forward, back: on twos, out of step
      if (g.firstElementChild.getAttribute("href") !== href) g.firstElementChild.setAttribute("href", href);
    });
  };
  let smooth = null, auto = null;
  const canScroll = () => document.documentElement.scrollHeight - window.innerHeight > 2;
  // from the first scroll (never at load, even on a tall screen where the legend already shows)
  // until the legend is 45% of the way up the screen, or the page's end if that comes first
  const st = window.ScrollTrigger.create({
    trigger: root.querySelector(".hero"), start: () => `top+=1 ${root.querySelector(".hero").getBoundingClientRect().top + window.scrollY}px`,
    endTrigger: root.querySelector(".legend"), end: "clamp(top 45%)",
    onUpdate: self => {
      if (!canScroll()) return;
      smooth?.kill();
      smooth = gsap.to(legendState, { p: self.progress, duration: still ? 0 : 0.4, ease: "power3.out", onUpdate: drawLegend });
    },
  });
  hooks.done = () => {
    if (canScroll() || frozen != null) return;
    auto?.kill();
    auto = gsap.to(legendState, { p: 1, duration: still ? 0 : 2.2, delay: still ? 0 : 0.8, ease: "power2.inOut", onUpdate: drawLegend });
  };
  hooks.replay = () => {
    if (canScroll()) return;
    auto?.kill();
    auto = gsap.to(legendState, { p: 0, duration: 1.2, ease: "power2.inOut", onUpdate: drawLegend });
  };
  drawLegend();

  if (frozen != null) { tl.pause(frozen); controls.skip.hidden = true; }
  else if (still) { tl.progress(1); controls.skip.hidden = true; }
  else { startBoil(); tl.play(0); }
  drawPoses();
  window.__hero = { tl, flies, clock };   // for review tooling (tools/contact-sheet.sh)

  return () => {
    gsap.ticker.remove(drawFlies);
    st.kill();
    smooth?.kill();
    auto?.kill();
    tl.kill();
    if (!still && frozen == null) stopBoil();
    delete window.__hero;
  };
}
