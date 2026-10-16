// Step 2, mushroom body case: the descent (docs/storyboards/mb-openings.md, shots K–O).
// Scroll-driven like the Pdf descent (step2.js): the stage stays pinned for about three screens and
// the scroll position sets one 14 s timeline, so scrubbing back and forth always gives the same frame.
//   K 0–2      a WT fly leaves the MCH arm of the T-maze and turns to face us (side → front view)
//   L 2–4.5    the camera pushes into its head, which turns see-through; the paper greys
//   M 4.5–7.5  the brain draws on (front view); the mushroom bodies grow in membrane blue on both
//              sides, from the cell bodies through the calyx and along the axon bundle into the lobes
//   N 7.5–10.5 the right one goes; the left one turns from the front view into the viewer's oblique
//              view (a true 3D rotation of the 30 simulated Kenyon cells, anatomy.json) while the
//              camera closes in; cell bodies, axon bundle and lobes are named; paper → charcoal
//   O 10.5–14  the outline settles where the viewer will open; black; the mutant's slides in on the
//              right and the microscope images come up under the outlines (matched swap)
//
// The world is in µm with the origin at the centre of the fly's head (brain.js). The mushroom body's
// own µm (its geometry files) sit at MB_AT. `?t=6` freezes the descent at 6 s; reduced motion shows
// the labelled mushroom body.

import { href } from "../router.js";
import { term } from "../glossary.js";
import { loadJSON } from "../data.js";
import { loadGsap, reducedMotion } from "../gsap.js";
import { loadFlySprite } from "../fly.js";
import { BRAIN } from "../brain.js";
import { handOff, takeHandOff } from "../handoff.js";
import { odourDefs } from "../tmaze.js";
import { MB_AT, MB_BIG, projector } from "../mbanatomy.js";

const DUR = 14;
const FLY_K = 10;                              // µm per fly-sprite unit (life size)
const FRONT_HEAD_Y = 5.8;
const TUBE = { x0: -8500, y0: 1340, w: 17000, h: 2520 };   // the MCH arm the fly comes from (µm)
const FLY_START = { x: 1600, y: TUBE.y0 + TUBE.h - 60 - 118 * FLY_K };
const FLY_END = { x: 0, y: -FRONT_HEAD_Y * FLY_K };
const STILL_T = 10.2;
const HEAD_PARTS = new Set(["head", "eye"]);
const BLUE = { membrane: "#5F78C0", dapi: "#5A78EB" };
const BRAIN_NO_CALYX = BRAIN.slice(0, 6);      // the schematic's calyx dashes give way to the real ones
const REGIONS = [
  ["Central brain", [0, 70], [0, 196], "below"],
  ["Optic lobe", [292, 92], [300, 196], "below"],
];
const TURN = [7.5, 8.9];                       // the turn into the oblique view (s)

const CAPTIONS = [
  [0, "Scroll to go inside the fly ↓"],
  [0.3, "We follow one of the hTDP-43 WT flies."],
  [2.3, "Into its head."],
  [4.8, "Inside the head: the brain."],
  [6.2, "In blue, the mushroom bodies, a centre for learning and memory, on both sides of the brain."],
  [7.8, "About 2,000 Kenyon cells on each side; we follow 30. Their axons run in one bundle to the lobes."],
  [10.8, "This is what you will look at under the microscope."],
  [12.4, "hTDP-43 WT on the left, the ALS mutant on the right (labelled hTDP-43 mutant)."],
];

const ringsD = mp => mp.coordinates.map(poly => poly.map(r => "M" + r.map(p => `${p[0]},${p[1]}`).join("L") + "Z").join("")).join("");

// The viewer geometry's outline: neuropil and cell bodies, filled like the Pdf neurons.
function mbMarkup(g, cls) {
  const r = g.regions;
  const shapes = [r.calyx.shape, r.peduncle.shape, ...Object.values(r.lobes).map(l => l.shape)];
  return `
    <g class="nrn ${cls}">
      <g class="nrn-neuropil">${shapes.map(s => `<path fill-rule="evenodd" d="${ringsD(s)}"/>`).join("")}</g>
      ${g.cells.map(c => `<path class="nrn-fill" fill-rule="evenodd" d="${ringsD(c.cytoplasm)}"/><path class="nrn-nuc" d="${ringsD(c.nucleus)}"/>`).join("")}
    </g>`;
}

async function loadImage(url) {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

function paintField(canvas, imgs, frame, view, s) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "lighter";
  for (const [img, tint, alpha] of [[imgs.membrane, BLUE.membrane, 1], [imgs.dapi, BLUE.dapi, 0.9]]) {
    const t = document.createElement("canvas");
    t.width = img.naturalWidth; t.height = img.naturalHeight;
    const tc = t.getContext("2d");
    tc.drawImage(img, 0, 0);
    tc.globalCompositeOperation = "multiply";
    tc.fillStyle = tint;
    tc.fillRect(0, 0, t.width, t.height);
    ctx.globalAlpha = alpha;
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (w / 2 - view.cx * s), dpr * (h / 2 - view.cy * s));
    ctx.drawImage(t, frame[0], frame[1], frame[2] - frame[0], frame[3] - frame[1]);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export async function mount(root, ctx) {
  const [geoC, geoM, A] = await Promise.all([
    loadJSON(`data/${ctx.caseId}/geometry-control-1.json`), loadJSON(`data/${ctx.caseId}/geometry-mutant-1.json`), loadJSON(`data/${ctx.caseId}/anatomy.json`)]);
  const whole = [Math.min(geoC.bounds[0], geoM.bounds[0]), Math.min(geoC.bounds[1], geoM.bounds[1]), Math.max(geoC.bounds[2], geoM.bounds[2]), Math.max(geoC.bounds[3], geoM.bounds[3])];
  const view = { cx: (whole[0] + whole[2]) / 2, cy: (whole[1] + whole[3]) / 2 };
  const nb = geoC.bounds;
  const project = projector(A);
  // each path's arc length, for growing it from the cell body
  const kc = A.cells.map(c => ({ ...c, len: c.paths.map(p => p.reduce((s, q, i) => s + (i ? Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1], q[2] - p[i - 1][2]) : 0), 0)) }));
  const longest = Math.max(...kc.flatMap(c => c.len));
  const lead = [0, 1, 2].map(() => ({ k: 0 })), rlead = REGIONS.map(() => ({ k: 0 }));
  const PARTS = ["Cell bodies (with their nuclei)", "Axon bundle (peduncle)", "Lobes (synapses)"];

  root.innerHTML = `
    <div class="descent-page">
      <section class="descent" aria-label="Descent from the fly into its mushroom body">
        <div class="descent__stage">
          <div class="descent__bg" aria-hidden="true"><i class="bg-grey"></i><i class="bg-charcoal"></i><i class="bg-black"></i></div>
          <div class="descent__title"><p class="t-label">Introduction · Step 2</p><h1 class="t-h1">Anatomy</h1></div>
          <div class="descent__scene">
            <div class="descent__viewer">
              <p class="descent__vtop" aria-hidden="true">Simulated confocal images · membrane + DAPI</p>
              ${["hTDP-43 WT", "hTDP-43 mutant"].map((l, i) => `
                <div class="descent__field" data-field="${i}" aria-hidden="true"><canvas></canvas><p class="viewer__label">${l}</p></div>`).join("")}
              <p class="descent__vbar">${(ctx.case.anatomy?.projection || "Oblique maximum-intensity projection (simulated data)").replace("maximum-intensity projection", term("mip", "maximum-intensity projection"))}</p>
            </div>
            <svg class="descent__svg" role="img" aria-label="An hTDP-43 WT fly from the T-maze turns to face us; we push into its head, where the brain appears with the mushroom bodies in blue on both sides, growing from their cell bodies along an axon bundle into the lobes. The left one turns to an oblique view while we close in on it: cell bodies, axon bundle and lobes. It ends as two microscope fields: WT left, mutant right.">
              <defs>
                ${odourDefs("descent")}
                <filter id="descent-boil" x="-5%" y="-5%" width="110%" height="110%">
                  <feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="3"/>
                  <feDisplacementMap in="SourceGraphic" scale="2" xChannelSelector="R" yChannelSelector="G"/>
                </filter>
                <clipPath id="tube-wipe"><rect class="tube-wipe" x="${TUBE.x0 - 600}" y="${TUBE.y0 - 2000}" width="${TUBE.w + 1200}" height="${TUBE.h + 4000}"/></clipPath>
                <clipPath id="tube-inside"><rect x="${TUBE.x0}" y="${TUBE.y0}" width="${TUBE.w}" height="${TUBE.h}"/></clipPath>
              </defs>
              <g class="d-tube" clip-path="url(#tube-wipe)">
                <rect class="tube-glass" x="${TUBE.x0}" y="${TUBE.y0}" width="${TUBE.w}" height="${TUBE.h}"/>
                <g clip-path="url(#tube-inside)"><rect class="odour odour--descent" x="${TUBE.x0}" y="${TUBE.y0}" width="${TUBE.w}" height="${TUBE.h}" fill="url(#mch-right-descent)" transform="translate(${TUBE.x0} ${TUBE.y0}) scale(60) translate(${-TUBE.x0} ${-TUBE.y0})"/></g>
                <path class="d-ink" fill="none" d="M${TUBE.x0},${TUBE.y0} H${TUBE.x0 + TUBE.w} M${TUBE.x0},${TUBE.y0 + TUBE.h} H${TUBE.x0 + TUBE.w}"/>
                <rect class="maze-port" x="${TUBE.x0 + TUBE.w}" y="${TUBE.y0 - 240}" width="700" height="${TUBE.h + 480}" rx="120"/>
              </g>
              <g class="d-brain">${BRAIN_NO_CALYX.map(([d, kind]) => `<path class="brain-${kind}" d="${d}"/>`).join("")}</g>
              <g class="d-fly fly"></g>
              <g class="d-mirror" transform="scale(-1 1) translate(${MB_AT.x} ${MB_AT.y})"><g class="kc kc--mirror"></g></g>
              <g class="d-neurons" transform="translate(${MB_AT.x} ${MB_AT.y})">
                <g class="d-fill">${mbMarkup(geoC, "nrn--wt")}</g>
                <g class="kc kc--left"></g>
                <g class="d-mutant">${mbMarkup(geoM, "nrn--mut")}</g>
              </g>
            </svg>
            <div class="descent__labels" aria-hidden="true">
              <svg class="d-leaders">${PARTS.map(() => `<path class="d-leader"/><path class="d-arrow"/>`).join("")}${REGIONS.map(() => `<path class="d-leader d-leader--region"/><path class="d-arrow d-arrow--region"/>`).join("")}</svg>
              <span class="d-label d-label--fly">hTDP-43 WT</span>
              ${PARTS.map(name => `<span class="d-label d-label--part">${name}</span>`).join("")}
              ${REGIONS.map(([name]) => `<span class="d-label d-label--region">${name}</span>`).join("")}
            </div>
          </div>
          <p class="descent__caption" aria-live="polite"><span class="descent__cap"></span></p>
        </div>
      </section>
      <div class="story descent__after">
        <p class="t-story">The mushroom bodies are the fly’s centre for learning and memory, often likened to our hippocampus. Each holds about 2,000 Kenyon cells, whose cell bodies sit in a cap at the back of the brain. A Kenyon cell sends out one neurite: it first branches into dendrites, where the cell receives its input, then runs on as an axon, bundled with all the others, to the lobes, where its synapses are. Kenyon cells come in three classes (α/β, α′/β′ and γ), each forming its own lobes. This simulation follows 30 of them, 10 of each class, seen from an oblique angle so every part has its own space.</p>
        <p class="t-story">A membrane label (${term("labels", "mCD8::BFP")}, made in all Kenyon cells) shows their shape in blue, and ${term("labels", "DAPI")} marks their nuclei in the same blue. In the images you will count spots in four compartments: nucleus, cell body, axon bundle and lobes. The dendrites are drawn but not counted.</p>
        <p class="next-row"><a class="btn btn--primary btn--lg" data-act="next" href="${href(ctx.caseId, 3)}">Next: TDP-43 dysfunction</a></p>
      </div>
    </div>`;

  const NS = "http://www.w3.org/2000/svg";
  const $ = s => root.querySelector(s);
  const $$ = s => root.querySelectorAll(s);
  const section = $(".descent"), stage = $(".descent__stage"), svg = $(".descent__svg");
  const flyG = $(".d-fly"), capEl = $(".descent__cap"), frameEl = $(".descent__viewer");
  const flyLabel = $(".d-label--fly"), partLabels = [...$$(".d-label--part")], regionLabels = [...$$(".d-label--region")];
  const leaders = [...$$(".d-leader:not(.d-leader--region)")], arrows = [...$$(".d-arrow:not(.d-arrow--region)")];
  const rLeaders = [...$$(".d-leader--region")], rArrows = [...$$(".d-arrow--region")];
  const turb = $("#descent-boil feTurbulence"), disp = $("#descent-boil feDisplacementMap");
  const handRect = takeHandOff("fly");

  // the 3D cells as live paths (both sides share the drawing; the right is a mirror image)
  const groups = [$(".kc--left"), $(".kc--mirror")];
  const live = groups.map(g => kc.map(c => {
    const soma = document.createElementNS(NS, "circle");
    soma.setAttribute("class", "kc-soma");
    soma.setAttribute("r", "4.4");
    const paths = c.paths.map(() => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("class", "kc-path");
      return p;
    });
    g.append(...paths, soma);
    return { soma, paths };
  }));

  const [, , gsap] = await Promise.all([loadFlySprite("lateral"), loadFlySprite("frontal"), loadGsap()]);
  const imgs = {};
  const imagesReady = Promise.all(["control", "mutant"].flatMap(g => ["membrane", "dapi"].map(async l => {
    (imgs[g] ||= {})[l] = await loadImage(`data/${ctx.caseId}/images/${g}-1-${l}.webp`);
  })));
  const P = new URLSearchParams(location.search);
  const frozen = P.has("t") ? Number(P.get("t")) : null;
  const still = reducedMotion();

  // ---------- the fly: side view morphing to the front view (as in the Pdf descent) ----------
  const partsOf = v => [...document.getElementById(`fly-${v}-stand-0`).children]
    .map(el => (el.tagName === "use" ? document.querySelector(el.getAttribute("href")) : el));
  const front = partsOf("frontal");
  const frontBy = new Map(front.map(p => [p.dataset.part, p]));
  const flyParts = [];
  for (const src of partsOf("lateral")) {
    const el = src.cloneNode(true);
    el.removeAttribute("id");
    flyG.append(el);
    flyParts.push({ el, part: src.dataset.part, to: frontBy.get(src.dataset.part) });
  }
  for (const p of front) {
    if (flyParts.some(l => l.part === p.dataset.part)) continue;
    const el = p.cloneNode(true);
    el.removeAttribute("id");
    el.style.opacity = "0";
    flyG.append(el);
    flyParts.push({ el, part: p.dataset.part, to: p, fadeIn: true });
  }
  const sideOrder = flyParts.map(l => l.el);
  const frontOrder = front.map(p => flyParts.find(l => l.part === p.dataset.part).el).concat(flyParts.filter(l => !l.to).map(l => l.el));
  let order = "side";

  // ---------- layout and camera ----------
  const cam = { cx: 0, cy: 0, lh: 0 };
  const flyAt = { x: FLY_START.x, y: FLY_START.y };
  const look = { wash: 100, ink: 100 };
  const hand = { dx: 0, dy: 0, s: 1 };
  const grow = { g: 0 }, turn = { u: 0 }, big = { k: MB_BIG };
  const leftG = $(".d-neurons"), mirrorG = $(".d-mirror");
  let L = null, tl = null;

  function layout() {
    const sw = svg.clientWidth || 1, sh = svg.clientHeight || 1;
    const sr = svg.getBoundingClientRect();
    const fields = [...$$(".descent__field")].map(f => {
      const r = f.getBoundingClientRect();
      return { x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height };
    });
    const f0 = fields[0], f1 = fields[1];
    const s = Math.min(f0.w / (whole[2] - whole[0]), f0.h / (whole[3] - whole[1])) * 0.92;   // the viewer's "whole mushroom body"
    const vh = sh / s, vw = sw / s;
    const vx = view.cx + MB_AT.x - (f0.x + f0.w / 2) / s, vy = view.cy + MB_AT.y - (f0.y + f0.h / 2) / s;
    L = { sw, sh, aspect: sw / sh, s, camO: { cx: vx + vw / 2, cy: vy + vh / 2, h: vh }, shift: ((f1.x + f1.w / 2) - (f0.x + f0.w / 2)) / s };
    imagesReady.then(() => $$(".descent__field canvas").forEach((c, i) => paintField(c, imgs[i ? "mutant" : "control"], geoC.frame, view, s)));
  }

  const mbAt = () => [(nb[0] + nb[2]) / 2 + MB_AT.x, (nb[1] + nb[3]) / 2 + MB_AT.y];
  const camAt = {
    tube: () => [2600, TUBE.y0 + TUBE.h / 2 - 300, 12000 / L.aspect],
    fly: () => [0, 270, 2500],
    head: () => [0, 20, 880],
    brain: () => [0, 0, Math.max(760, 720 / L.aspect)],
    mb: () => [mbAt()[0] - 30, mbAt()[1], 330],
    drift: () => [mbAt()[0] - 26, mbAt()[1], 312],
    viewer: () => [L.camO.cx, L.camO.cy, L.camO.h],
  };
  const stop = k => { const [cx, cy, h] = camAt[k](); return { cx, cy, lh: Math.log(h) }; };

  function build() {
    const p = tl ? tl.progress() : 0;
    if (tl) tl.kill();
    layout();
    Object.assign(flyAt, FLY_START);
    Object.assign(look, { wash: 100, ink: 100 });
    Object.assign(cam, stop("tube"));
    grow.g = 0; turn.u = 0; big.k = MB_BIG;
    flyParts.forEach(l => { l.el.style.opacity = l.fadeIn ? "0" : "1"; });
    gsap.set([".bg-grey", ".bg-charcoal", ".bg-black", ".brain-dash", ".d-mutant", ".descent__field canvas", ".d-fill"], { opacity: 0 });
    gsap.set([frameEl, ...partLabels, ...regionLabels], { autoAlpha: 0 });
    gsap.set([...leaders, ...arrows, ...rLeaders, ...rArrows], { autoAlpha: 1 });
    [...lead, ...rlead].forEach(l => { l.k = 0; });
    gsap.set([".descent__title", flyLabel], { autoAlpha: 1 });
    gsap.set(".brain-line", { drawSVG: "0%" });
    gsap.set([".d-brain", ".kc", ".d-mirror"], { opacity: 1 });
    tl = gsap.timeline({ paused: true, onUpdate: draw, defaults: { ease: "power2.inOut", immediateRender: false } });
    const camTo = (from, to, at, dur, ease = "power2.inOut") => tl.fromTo(cam, stop(from), { ...stop(to), duration: dur, ease }, at);

    // K 0–2: the maze wipes away; the fly lifts to the centre and turns to face us
    camTo("tube", "fly", 0, 2.0);
    tl.fromTo(".tube-wipe", { attr: { x: TUBE.x0 - 600 } }, { attr: { x: TUBE.x0 + TUBE.w + 600 }, duration: 0.8, ease: "power1.in" }, 0)
      .fromTo(flyAt, { ...FLY_START }, { ...FLY_END, duration: 1.2 }, 0.4)
      .fromTo(look, { wash: 100, ink: 100 }, { wash: 30, ink: 62, duration: 0.8 }, 1.0);
    for (const l of flyParts) {
      if (l.to && !l.fadeIn) tl.fromTo(l.el, { morphSVG: l.el.getAttribute("d") }, { morphSVG: l.to.getAttribute("d"), duration: 0.8 }, 0.9);
      else if (!l.to) tl.fromTo(l.el, { opacity: 1 }, { opacity: 0, duration: 0.5 }, 0.9);
      else tl.fromTo(l.el, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 1.2);
    }
    tl.fromTo(flyParts.filter(l => l.to && !HEAD_PARTS.has(l.part)).map(l => l.el), { opacity: 1 }, { opacity: 0, duration: 1.2, ease: "power1.in" }, 2.1)
      .fromTo(".descent__title", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4 }, 2.1)
      .fromTo(flyLabel, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3 }, 2.2)
    // L 2–4.5: into the head
      .fromTo(look, { wash: 30, ink: 62 }, { wash: 6, ink: 30, duration: 2.0 }, 2.0)
      .fromTo(".bg-grey", { opacity: 0 }, { opacity: 1, duration: 2.5 }, 2.0);
    camTo("fly", "head", 2.0, 2.5);
    // M 4.5–7.5: the brain draws on; the mushroom bodies grow out from their cell bodies
    camTo("head", "brain", 4.6, 1.0, "power1.inOut");
    tl.fromTo(".brain-line", { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.3, stagger: 0.08, ease: "power1.inOut" }, 4.5)
      .fromTo(".brain-dash", { opacity: 0 }, { opacity: 1, duration: 0.5 }, 5.5)
      .fromTo(grow, { g: 0 }, { g: 1, duration: 1.2, ease: "power1.inOut" }, 6.2);
    REGIONS.forEach(([, , , side], i) => {
      const at = 5.75 + i * 0.3;
      tl.fromTo(regionLabels[i], { autoAlpha: 0, y: side === "above" ? -4 : 4 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, at)
        .fromTo(rlead[i], { k: 0 }, { k: 1, duration: 0.35, ease: "power2.out" }, at + 0.12);
    });
    tl.fromTo([...regionLabels, ...rLeaders, ...rArrows], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, 7.3)
      .fromTo(".d-mirror", { opacity: 1 }, { opacity: 0, duration: 0.4, ease: "power1.in" }, 7.3)
    // N 7.5–10.5: the brain goes; the left mushroom body turns into the oblique view as we close in
      .fromTo(look, { wash: 6, ink: 30 }, { wash: 0, ink: 0, duration: 0.8 }, 7.5)
      .fromTo(".bg-charcoal", { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power1.inOut" }, 7.5)
      .fromTo(".d-brain", { opacity: 1 }, { opacity: 0, duration: 0.6 }, 7.4)
      .fromTo(turn, { u: 0 }, { u: 1, duration: TURN[1] - TURN[0], ease: "power2.inOut" }, TURN[0])
      .fromTo(big, { k: MB_BIG }, { k: 1, duration: TURN[1] - TURN[0], ease: "power2.inOut" }, TURN[0])
      .fromTo(".d-fill", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.inOut" }, TURN[1] - 0.1)
      .fromTo(".kc--left", { opacity: 1 }, { opacity: 0, duration: 0.7, ease: "power1.in" }, TURN[1] + 0.1);
    camTo("brain", "mb", 7.5, 1.4);
    camTo("mb", "drift", 8.9, 1.6, "none");
    PARTS.forEach((_, i) => {
      const at = 7.9 + i * 0.75;
      tl.fromTo(partLabels[i], { autoAlpha: 0, x: -6 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out" }, at)
        .fromTo(lead[i], { k: 0 }, { k: 1, duration: 0.35, ease: "power2.out" }, at + 0.12);
    });
    // O 10.5–14: to the viewer's opening view; black; the mutant's mushroom body; the images
    tl.fromTo([...partLabels, ...leaders, ...arrows], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25 }, 10.4)
      .fromTo(".bg-black", { opacity: 0 }, { opacity: 1, duration: 0.8 }, 10.5);
    camTo("drift", "viewer", 10.5, 1.0);
    tl.fromTo(frameEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power1.out" }, 12.4)
      .fromTo(".d-mutant", { opacity: 0, x: L.shift + 70 }, { opacity: 1, x: L.shift, duration: 0.8, ease: "power2.out" }, 12.4)
      .fromTo(".descent__field canvas", { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power1.inOut" }, 12.7)
      .fromTo(".nrn", { opacity: 1 }, { opacity: 0, duration: 0.6, ease: "power1.inOut" }, 13.3)
      .to({}, { duration: 0.01 }, DUR - 0.01);
    tl.progress(p);
    draw();
  }

  // ---------- every frame ----------
  const toScreen = (x, y) => {
    const h = Math.exp(cam.lh), w = h * L.aspect;
    return [(x - (cam.cx - w / 2)) * L.sw / w, (y - (cam.cy - h / 2)) * L.sh / h];
  };
  function pointer(el, leader, arrow, k, side, [x, y], [ax, ay]) {
    const w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = `${(side === "left" ? x - w : x - w / 2).toFixed(1)}px`;
    el.style.top = `${(side === "left" ? y - h / 2 : side === "above" ? y - h : y).toFixed(1)}px`;
    const sx = side === "left" ? x + 6 : x, sy = side === "left" ? y : side === "above" ? y + 4 : y - 4;
    const len = Math.hypot(ax - sx, ay - sy) || 1;
    const ux = (ax - sx) / len, uy = (ay - sy) / len;
    const tip = Math.max(0, len - 2);
    const ex = sx + ux * tip * k, ey = sy + uy * tip * k;
    leader.setAttribute("d", k > 0 ? `M${sx.toFixed(1)},${sy.toFixed(1)} L${(ex - ux * 6 * k).toFixed(1)},${(ey - uy * 6 * k).toFixed(1)}` : "");
    const hs = Math.min(1, Math.max(0, (k - 0.6) / 0.4));
    const bx = ex - ux * 8 * hs, by = ey - uy * 8 * hs, nx = -uy * 3.6 * hs, ny = ux * 3.6 * hs;
    arrow.setAttribute("d", hs > 0 ? `M${ex.toFixed(1)},${ey.toFixed(1)} L${(bx + nx).toFixed(1)},${(by + ny).toFixed(1)} L${(bx - nx).toFixed(1)},${(by - ny).toFixed(1)} Z` : "");
  }

  // the cells at the current turn: each path grown `grow.g` of the longest path's length from its
  // cell body; the cell bodies move from their own projected places to the viewer's packed cap
  let anchors = null;
  function drawCells() {
    const u = turn.u, proj = project(u);
    const reach = grow.g * longest;
    const capK = 1 - 0.3 * u;   // the cap tightens towards the calyx (the viewer packs it at 0.7)
    const pts = kc.map(c => proj(c.soma));
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const tips = [], peds = [];
    kc.forEach((c, i) => {
      const [px, py] = pts[i];
      const sx = (cx + (px - cx) * capK) * (1 - u) + c.at[0] * u, sy = (cy + (py - cy) * capK) * (1 - u) + c.at[1] * u;   // the cell bodies settle into the viewer's cap
      const appear = Math.min(1, grow.g * 6);
      c.paths.forEach((path, j) => {
        let d = "", run = 0;
        for (let k = 0; k < path.length; k++) {
          if (k) run += Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1], path[k][2] - path[k - 1][2]);
          if (run > reach) break;
          let [x, y] = proj(path[k]);
          if (k === 0) { x = sx; y = sy; }
          d += (k ? "L" : "M") + x.toFixed(2) + "," + y.toFixed(2);
          if (k === Math.floor(path.length * 0.45)) peds.push([x, y]);
          if (k === path.length - 1 && j === c.paths.length - 1) tips.push([x, y]);
        }
        for (const g of live) g[i].paths[j].setAttribute("d", d);
      });
      for (const g of live) {
        g[i].soma.setAttribute("cx", sx.toFixed(2));
        g[i].soma.setAttribute("cy", sy.toFixed(2));
        g[i].soma.style.opacity = appear.toFixed(3);
      }
    });
    const mean = a => (a.length ? [a.reduce((s, p) => s + p[0], 0) / a.length, a.reduce((s, p) => s + p[1], 0) / a.length] : [0, 0]);
    anchors = { cells: [cx * (1 - u) + mean(kc.map(c => c.at))[0] * u, cy * (1 - u) + mean(kc.map(c => c.at))[1] * u], ped: mean(peds), lobes: mean(tips) };
  }

  let capKey = -1, lastSeed = 0;
  function draw() {
    if (!tl || !L) return;
    const t = tl.time();
    const h = Math.exp(cam.lh), w = h * L.aspect;
    svg.setAttribute("viewBox", `${(cam.cx - w / 2).toFixed(2)} ${(cam.cy - h / 2).toFixed(3)} ${w.toFixed(3)} ${h.toFixed(3)}`);
    const px = w / L.sw;
    svg.style.setProperty("--px", px.toFixed(5));

    const fx = flyAt.x + hand.dx * px, fy = flyAt.y + hand.dy * px;
    flyG.setAttribute("transform", `translate(${fx.toFixed(2)} ${fy.toFixed(2)}) scale(${(FLY_K * hand.s).toFixed(4)})`);
    flyG.style.setProperty("--fly-wash", `color-mix(in srgb, var(--wash-body) ${look.wash.toFixed(1)}%, transparent)`);
    flyG.style.setProperty("--fly-eye", `color-mix(in srgb, var(--wash-eye) ${look.wash.toFixed(1)}%, transparent)`);
    flyG.style.setProperty("--fly-wing", `color-mix(in srgb, var(--wash-wing) ${look.wash.toFixed(1)}%, transparent)`);
    flyG.style.setProperty("--fly-ink", `color-mix(in srgb, var(--ink) ${look.ink.toFixed(1)}%, transparent)`);
    flyG.style.display = look.ink <= 0.01 ? "none" : "";
    const want = t >= 1.3 ? "front" : "side";
    if (want !== order) { flyG.append(...(want === "front" ? frontOrder : sideOrder)); order = want; }
    if (t < 1.9 && !still) {
      flyG.setAttribute("filter", "url(#descent-boil)");
      disp.setAttribute("scale", (1.3 * px / FLY_K).toFixed(3));
      const seed = frozen != null ? 3 : [3, 8, 13][Math.floor(performance.now() / (1000 / 12)) % 3];
      if (seed !== lastSeed) { turb.setAttribute("seed", seed); lastSeed = seed; }
    } else flyG.removeAttribute("filter");

    leftG.setAttribute("transform", `translate(${MB_AT.x} ${MB_AT.y}) scale(${big.k.toFixed(4)})`);
    mirrorG.setAttribute("transform", `scale(-1 1) translate(${MB_AT.x} ${MB_AT.y}) scale(${big.k.toFixed(4)})`);
    drawCells();
    const [lx, ly] = toScreen(fx + 1700 * hand.s, fy - 250 * hand.s);
    flyLabel.style.transform = `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px) translate(0, -50%)`;
    // compartment labels sit to the left of the anatomy, their arrows riding on it as it turns
    const off = [[-34, -22], [-58, 4], [-30, 52]];
    [anchors.cells, anchors.ped, anchors.lobes].forEach((a, i) => {
      const ax = a[0] * big.k + MB_AT.x, ay = a[1] * big.k + MB_AT.y;
      pointer(partLabels[i], leaders[i], arrows[i], lead[i].k, "left", toScreen(ax + off[i][0] - (i === 2 ? 40 : 0), ay + off[i][1]), toScreen(ax, ay));
    });
    REGIONS.forEach(([, a, p, side], i) => pointer(regionLabels[i], rLeaders[i], rArrows[i], rlead[i].k, side, toScreen(p[0], p[1]), toScreen(a[0], a[1])));

    let k = 0;
    CAPTIONS.forEach(([at], i) => { if (t >= at) k = i; });
    if (still) k = CAPTIONS.findIndex(([at]) => at === 7.8);
    if (k !== capKey) {
      capKey = k;
      capEl.textContent = CAPTIONS[k][1];
      if (frozen == null && !still) gsap.fromTo(capEl, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.5, ease: "power2.out" });
    }
    stage.classList.toggle("is-dark", t >= 7.9);
  }

  // ---------- scroll, frozen review frames, reduced motion (as in the Pdf descent) ----------
  let st = null, smooth = null;
  const pinnedAt = q => window.scrollY + section.getBoundingClientRect().top + q * (section.offsetHeight - window.innerHeight);
  if (still) {
    section.classList.add("is-still");
    build();
    tl.time(STILL_T);
    draw();
  } else if (frozen != null) {
    build();
    window.scrollTo(0, pinnedAt(Math.min(1, frozen / DUR)));
    tl.time(frozen);
    draw();
  } else {
    build();
    const target = { p: 0 };
    st = window.ScrollTrigger.create({
      trigger: section, start: "top top", end: "bottom bottom",
      onUpdate: self => {
        smooth?.kill();
        smooth = gsap.to(target, { p: self.progress, duration: 0.45, ease: "power3.out", onUpdate: () => tl.progress(target.p) });
      },
    });
    if (handRect && window.scrollY < 4) {
      const r = flyG.getBoundingClientRect();
      if (r.width) {
        hand.dx = (handRect.left + handRect.width / 2) - (r.left + r.width / 2);
        hand.dy = (handRect.top + handRect.height / 2) - (r.top + r.height / 2);
        hand.s = handRect.width / r.width;
        draw();
        gsap.to(hand, { dx: 0, dy: 0, s: 1, duration: 0.8, ease: "power2.inOut", onUpdate: draw });
      }
    }
  }

  const boilTimer = frozen == null && !still ? setInterval(() => { if (tl && tl.time() < 1.9) draw(); }, 1000 / 12) : null;
  let resizeTimer = null;
  const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { build(); window.ScrollTrigger?.refresh(); }, 120); };
  window.addEventListener("resize", onResize);

  root.querySelector("[data-act=next]").addEventListener("click", () => { if (frameEl.getBoundingClientRect().bottom > 0) handOff("viewer", frameEl); });
  window.__descent = { get tl() { return tl; }, cam, hand, handRect };

  return () => {
    window.removeEventListener("resize", onResize);
    clearInterval(boilTimer);
    clearTimeout(resizeTimer);
    st?.kill();
    smooth?.kill();
    tl?.kill();
    delete window.__descent;
  };
}
