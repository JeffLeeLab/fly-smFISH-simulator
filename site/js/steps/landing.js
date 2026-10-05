// Step 1, shared part: the hero (knock-in sequence, 9.6 s, docs/storyboards/pdf-openings.md) and
// the three-assay landing below it (shot F): the activity monitor runs live; the climbing vial and
// T-maze are stills in this build.
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
import { stationArt, startMiniMonitor } from "../stations.js";
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
  { id: "wt", x: 172, out: -1, turn: 0, dx: 0, dy: 0, label: "hTDP-43 WT", sub: "fly TBPH → human TDP-43" },
  { id: "mut", x: 468, out: 1, turn: 8, dx: 4, dy: 5, label: "hTDP-43 ALS mutant", sub: "the same knock-in + one point mutation" },
];
const FLY_Y = 104, FLY_H = 300, STRIP_Y = 352, STRIP_W = 180;
const CW = STRIP_W + 12, CH = 28;   // a gene cassette's frame
const ORIGIN = { x: 302, y: 428 };  // where the human cassette appears, between the two loci
// A point on the fly's midline, `d` scene units behind the thorax, after the fly's turn.
const behind = (f, d) => {
  const a = f.turn * Math.PI / 180;
  return [f.x + f.dx - d * Math.sin(a), FLY_Y + f.dy + d * Math.cos(a)];
};
const italicGenes = s => s.replace("TBPH", '<tspan font-style="italic">TBPH</tspan>').replace("TDP-43", '<tspan font-style="italic">TDP-43</tspan>');

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
          <text class="scene-small" x="${f.x}" y="458" text-anchor="middle">${italicGenes(f.sub)}</text>
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

function stations() {
  return CASE_ORDER.map(id => {
    const c = CASES[id];
    const body = `
      <span class="station__art">${stationArt[id]()}</span>
      <span class="station__name">${c.assay}</span>
      <span class="station__lanes"><span>hTDP-43 WT</span><span>hTDP-43 ALS mutant</span></span>
      <span class="t-ui t-muted">${c.system} · ${c.phenotype.toLowerCase()}</span>
      <span class="station__go">${c.available ? "Choose this system →" : "Not available in this build"}</span>`;
    return c.available
      ? `<li><a class="station" data-case="${id}" href="${href(id, 1)}">${body}</a></li>`
      : `<li><div class="station is-off" aria-disabled="true">${body}</div></li>`;
  }).join("");
}

export async function mount(root) {
  root.innerHTML = `
    <div class="story story--landing">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero__text">
          <p class="t-label">Meet · Step 1</p>
          <h1 class="t-display" id="hero-title">Two flies, one human gene</h1>
          <p class="t-story t-muted">In both flies the fly gene <i>TBPH</i> has been replaced by human <i>TDP-43</i> (${term("humanised", "humanised")}): the normal version, or one carrying an ALS-linked point mutation.</p>
          <p class="hero__caption"><span class="hero__cap1">They look the same.</span> <span class="hero__cap2">Their behaviour isn’t.</span></p>
          <p class="hero__controls"><button class="btn btn--quiet" type="button" data-act="skip">Skip</button><button class="btn btn--quiet" type="button" data-act="replay" hidden>Replay</button></p>
          <p class="hero__cue t-ui t-muted">Scroll to see how they behave ↓</p>
        </div>
        <div class="hero__art">
          <div class="hero__wash" aria-hidden="true"></div>
          ${scene()}
          <span class="tag-sim hero__tag">Schematic</span>
        </div>
      </section>
      <h2 class="t-h2">Choose your neuron system</h2>
      <p class="t-story">Each group works with one system. Each assay compares hTDP-43 WT (left) with the ALS mutant (right).</p>
      <ul class="stations" role="list">${stations()}</ul>
    </div>`;

  const svg = root.querySelector(".hero__scene");
  ensureBoilFilter();   // drawn with the ink texture even when frozen or with reduced motion (not animated)
  const [meta, lateral] = await Promise.all([loadFlySprite("dorsal"), loadFlySprite("lateral")]);
  const drawMonitor = startMiniMonitor(root.querySelector(".station[data-case=pdf] svg"), lateral);
  root.querySelector(".station[data-case=pdf]").addEventListener("click", e => handOff("monitor", e.currentTarget.querySelector(".station__art")));
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
  const cap1 = root.querySelector(".hero__cap1");
  const cap2 = root.querySelector(".hero__cap2");

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
  gsap.set(cap1, { autoAlpha: 0, clipPath: "inset(0 100% 0 0)" });
  gsap.set(cap2, { autoAlpha: 0 });

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
  // E 8.2–9.6: the caption lands; the knock-ins stay, linked to their flies
    .to(cap1, { autoAlpha: 1, clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "power2.out" }, 8.2)
    .to({}, { duration: 0.4 }, 9.2);   // the caption's read runs to 9.6 s
  drawPoses();

  const controls = { skip: root.querySelector("[data-act=skip]"), replay: root.querySelector("[data-act=replay]") };
  tl.eventCallback("onComplete", () => { controls.skip.hidden = true; controls.replay.hidden = false; });
  controls.skip.addEventListener("click", () => { tl.progress(1); drawPoses(); });
  controls.replay.addEventListener("click", () => { controls.replay.hidden = true; controls.skip.hidden = false; tl.restart(); drawPoses(); });

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
    drawMonitor(still ? 0 : t);
  };
  gsap.ticker.add(drawFlies);
  drawFlies();

  // the second half of the caption completes as the page scrolls on to the assays
  const st = window.ScrollTrigger.create({
    trigger: root.querySelector(".hero"), start: "top -48",   // only after a real scroll, whatever the screen height
    onEnter: () => gsap.to(cap2, { autoAlpha: 1, duration: 0.5, ease: "power2.out" }),
    onLeaveBack: () => gsap.to(cap2, { autoAlpha: 0, duration: 0.3 }),
  });

  if (frozen != null) { tl.pause(frozen); controls.skip.hidden = true; }
  else if (still) { tl.progress(1); controls.skip.hidden = true; }
  else { startBoil(); tl.play(0); }
  drawPoses();
  window.__hero = { tl, flies, clock };   // for review tooling (tools/contact-sheet.sh)

  return () => {
    gsap.ticker.remove(drawFlies);
    st.kill();
    tl.kill();
    if (!still && frozen == null) stopBoil();
    delete window.__hero;
  };
}
