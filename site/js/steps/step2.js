// Step 2: the descent (docs/storyboards/pdf-openings.md, shots K–O). Scroll-driven: the page
// scrolls through about three screens while the stage stays pinned, and the scroll position
// sets one 14 s timeline, so scrubbing back and forth always gives the same frame.
//   K 0–2      the WT fly leaves its tube and turns to face us (side view → front view, MorphSVG)
//   L 2–4.5    the camera pushes into its head, which turns see-through; the paper greys
//   M 4.5–7.5  the brain draws on inside the head (central brain and optic lobe named); the Pdf
//              neurons grow out in membrane blue on both sides (the right side a mirror image)
//   N 7.5–10.5 push to the s-LNvs; cell body, axon, dorsal terminals; paper → charcoal
//   O 10.5–14  the neurons settle where the viewer will open; black; the mutant's slide in on
//              the right and the microscope images come up under the outlines (matched swap)
//
// The world is in µm with the origin at the centre of the fly's head (brain.js). The camera is
// the SVG viewBox. `?t=6` freezes the descent at 6 s; reduced motion shows the labelled neurons.

import { href } from "../router.js";
import { term } from "../glossary.js";
import { loadJSON } from "../data.js";
import { loadGsap, reducedMotion, scrollScrub } from "../gsap.js";
import { loadFlySprite } from "../fly.js";
import { BRAIN, NEURON_AT } from "../brain.js";
import { handOff, takeHandOff } from "../handoff.js";

const NS = "http://www.w3.org/2000/svg";
const DUR = 14;
const FLY_K = 10;                              // µm per fly-sprite unit (life size)
const FRONT_HEAD_Y = 5.8;                      // the head's centre in the front-view sprite
const TUBE = { x0: -8500, y0: 1340, w: 17000, h: 2520 };   // the tube the fly comes from (µm); food and plug fill its ends, as in step 1
const FLY_START = { x: -1500, y: TUBE.y0 + TUBE.h - 60 - 118 * FLY_K };   // thorax, feet on the glass
const FLY_END = { x: 0, y: -FRONT_HEAD_Y * FLY_K };                          // head centre at 0,0
const STILL_T = 10.2;                          // reduced motion: the labelled neurons
const HEAD_PARTS = new Set(["head", "eye"]);   // the antennae go too: from the front they would make a face
const BLUE = { membrane: "#5F78C0", dapi: "#5A78EB" };
// brain regions, named while the whole brain is on screen: [name, anchor, label point, side] in
// brain µm. The optic lobe arrow points into the lobe's outer part, clear of the neurons.
const REGIONS = [
  ["Central brain", [0, -98], [0, -196], "above"],
  ["Optic lobe", [292, 92], [300, 196], "below"],
];

const CAPTIONS = [
  [0, "Scroll slowly to go inside the fly ↓"],
  [0.3, "We follow the hTDP-43 WT fly."],
  [2.3, "Into its head."],
  [4.8, "Inside the head: the brain."],
  [6.2, "In blue, the Pdf neurons on both sides of the brain."],
  [7.8, "Four small Pdf neurons (s-LNvs). Their dorsal terminals (synapses) remodel every day."],
  [10.8, "These are the neurons you will look at under the microscope."],
  [12.4, "hTDP-43 WT on the left, the ALS mutant on the right (labelled hTDP-43 mutant)."],
];

const ringsD = mp => mp.coordinates.map(poly => poly.map(r => "M" + r.map(p => `${p[0]},${p[1]}`).join("L") + "Z").join("")).join("");

function neuronMarkup(g, cls) {
  return `
    <g class="nrn ${cls}">
      <path class="nrn-fill" fill-rule="evenodd" d="${ringsD(g.terminals.shape)}"/>
      <path class="nrn-fill" fill-rule="evenodd" d="${ringsD(g.axon.shape)}"/>
      ${g.cells.map(c => `<path class="nrn-fill" fill-rule="evenodd" d="${ringsD(c.cytoplasm)}"/><path class="nrn-nuc" d="${ringsD(c.nucleus)}"/>`).join("")}
    </g>`;
}

const centre = pts => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

async function loadImage(url) {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

// The viewer's blue channel, drawn the way the viewer draws it: membrane and DAPI images tinted
// and added on black, at the viewer's opening view.
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
  const [geoC, geoM] = await Promise.all(["control", "mutant"].map(g => loadJSON(`data/${ctx.caseId}/geometry-${g}-1.json`)));
  const cellsAt = centre(geoC.cells.map(c => c.nucleus_centre));
  const whole = [Math.min(geoC.bounds[0], geoM.bounds[0]), Math.min(geoC.bounds[1], geoM.bounds[1]), Math.max(geoC.bounds[2], geoM.bounds[2]), Math.max(geoC.bounds[3], geoM.bounds[3])];
  const view = { cx: (whole[0] + whole[2]) / 2, cy: (whole[1] + whole[3]) / 2 };
  const nb = geoC.bounds;   // the neuron, for the close-up
  // compartment labels, in the viewer's order: [name, anchor on the anatomy, label point] in
  // geometry µm. Each label ends at its point, to the left of the anatomy; an arrow runs from the
  // label's edge to the anchor (drawn in screen space every frame, so it always starts at the text).
  const nearest = (mp, [x, y]) => mp.coordinates.flat(2).reduce((best, q) =>
    (Math.hypot(q[0] - x, q[1] - y) < Math.hypot(best[0] - x, best[1] - y) ? q : best));
  const cN = geoC.cells[2], cC = geoC.cells[1];
  const axonMid = geoC.axon.centreline[Math.floor(geoC.axon.centreline.length * 0.5)];
  const tb = geoC.views.terminals;
  const PARTS = [
    ["Nucleus", nearest(cN.nucleus, [cN.nucleus_centre[0] - 12, cN.nucleus_centre[1]]), [nb[0] - 10, cN.nucleus_centre[1]]],
    ["Cell body", nearest(cC.cytoplasm, [cC.nucleus_centre[0] - 20, cC.nucleus_centre[1] + 3]), [nb[0] - 10, cC.nucleus_centre[1] + 5]],
    ["Axon", [axonMid[0] - 1.6, axonMid[1]], [axonMid[0] - 26, axonMid[1] - 2]],
    ["Dorsal terminals (synapses)", nearest(geoC.terminals.shape, [tb[0] + 10, tb[1] + 3]), [tb[0] - 10, tb[1] - 3]],
  ];
  const lead = PARTS.map(() => ({ k: 0 })), rlead = REGIONS.map(() => ({ k: 0 }));

  root.innerHTML = `
    <div class="descent-page">
      <section class="descent" aria-label="Descent from the fly into its Pdf neurons">
        <div class="descent__stage">
          <div class="descent__bg" aria-hidden="true"><i class="bg-grey"></i><i class="bg-charcoal"></i><i class="bg-black"></i></div>
          <div class="descent__title"><p class="t-label">Introduction · Step 2</p><h1 class="t-h1">Anatomy</h1></div>
          <div class="descent__scene">
            <div class="descent__viewer">
              <p class="descent__vtop" aria-hidden="true">Simulated confocal images · membrane + DAPI</p>
              ${["hTDP-43 WT", "hTDP-43 mutant"].map((l, i) => `
                <div class="descent__field" data-field="${i}" aria-hidden="true"><canvas></canvas><p class="viewer__label">${l}</p></div>`).join("")}
              <p class="descent__vbar">${(ctx.case.anatomy?.projection || "2D maximum-intensity projection (simulated data)").replace("maximum-intensity projection", term("mip", "maximum-intensity projection"))}</p>
            </div>
            <svg class="descent__svg" role="img" aria-label="The hTDP-43 WT fly turns to face us; we push into its head, where the brain appears with the Pdf neurons in blue on both sides; we close in on the four on the left, each with a cell body, an axon running up and medially, and dorsal terminals (synapses). They end as two microscope fields: WT left, mutant right.">
              <defs>
                <filter id="descent-boil" x="-5%" y="-5%" width="110%" height="110%">
                  <feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="3"/>
                  <feDisplacementMap in="SourceGraphic" scale="2" xChannelSelector="R" yChannelSelector="G"/>
                </filter>
                <clipPath id="tube-wipe"><rect class="tube-wipe" x="${TUBE.x0 - 600}" y="${TUBE.y0 - 2000}" width="${TUBE.w + 1200}" height="${TUBE.h + 4000}"/></clipPath>
                <clipPath id="tube-inside"><rect x="${TUBE.x0}" y="${TUBE.y0}" width="${TUBE.w}" height="${TUBE.h}" rx="${TUBE.h / 2}"/></clipPath>
                <clipPath id="nrn-grow"><circle class="nrn-grow" cx="${cellsAt[0]}" cy="${cellsAt[1]}" r="0"/></clipPath>
              </defs>
              <g class="d-tube" clip-path="url(#tube-wipe)">
                <rect class="tube-glass" x="${TUBE.x0}" y="${TUBE.y0}" width="${TUBE.w}" height="${TUBE.h}" rx="${TUBE.h / 2}"/>
                <g clip-path="url(#tube-inside)">
                  <rect class="tube-food" x="${TUBE.x0}" y="${TUBE.y0}" width="${TUBE.w * 0.15}" height="${TUBE.h}"/>
                  <rect class="tube-plug" x="${TUBE.x0 + TUBE.w * 0.87}" y="${TUBE.y0}" width="${TUBE.w * 0.13}" height="${TUBE.h}"/>
                </g>
                <rect class="d-ink" x="${TUBE.x0}" y="${TUBE.y0}" width="${TUBE.w}" height="${TUBE.h}" rx="${TUBE.h / 2}" fill="none"/>
                <line class="d-beam" x1="0" y1="${TUBE.y0 - 260}" x2="0" y2="${TUBE.y0 + TUBE.h + 260}"/>
                <rect class="beam-box" x="-140" y="${TUBE.y0 - 420}" width="280" height="200" rx="20"/>
                <rect class="beam-box" x="-140" y="${TUBE.y0 + TUBE.h + 220}" width="280" height="200" rx="20"/>
              </g>
              <g class="d-brain">${BRAIN.map(([d, kind]) => `<path class="brain-${kind}" d="${d}"/>`).join("")}</g>
              <g class="d-fly fly"></g>
              <g class="d-mirror" transform="scale(-1 1) translate(${NEURON_AT.x} ${NEURON_AT.y})">
                <g clip-path="url(#nrn-grow)">${neuronMarkup(geoC, "nrn--wt")}</g>
              </g>
              <g class="d-neurons" transform="translate(${NEURON_AT.x} ${NEURON_AT.y})">
                <g clip-path="url(#nrn-grow)">${neuronMarkup(geoC, "nrn--wt")}</g>
                <g class="d-mutant">${neuronMarkup(geoM, "nrn--mut")}</g>
              </g>
            </svg>
            <div class="descent__labels" aria-hidden="true">
              <svg class="d-leaders">${PARTS.map(() => `<path class="d-leader"/><path class="d-arrow"/>`).join("")}${REGIONS.map(() => `<path class="d-leader d-leader--region"/><path class="d-arrow d-arrow--region"/>`).join("")}</svg>
              <span class="d-label d-label--fly">hTDP-43 WT</span>
              ${PARTS.map(([name]) => `<span class="d-label d-label--part">${name}</span>`).join("")}
              ${REGIONS.map(([name]) => `<span class="d-label d-label--region">${name}</span>`).join("")}
            </div>
          </div>
          <p class="descent__caption" aria-live="polite"><span class="descent__cap"></span></p>
          <button class="btn descent__skip" type="button" data-act="skip" hidden>Skip animation</button>
        </div>
      </section>
      <div class="story descent__after">
        <p class="t-story">The Pdf neurons are master clock neurons: they release the neuropeptide Pdf (pigment-dispersing factor), which keeps the brain’s other clock neurons in step. They sit on each side of the brain; this simulation follows the four small ventral lateral neurons (s-LNvs) on one side. Their cell bodies lie near the accessory medulla; their axons run up towards the top of the brain and end in the dorsal terminals, where their synapses are. The terminals remodel every day and are most branched at ${term("zt", "ZT2")}, when these brains were collected.</p>
        <p class="t-story">A membrane label (${term("labels", "mCD8::BFP")}, made only in these neurons) shows their shape in blue, and ${term("labels", "DAPI")} marks their nuclei in the same blue. In the images you will count spots in four compartments: nucleus, cell body, axon and dorsal terminals (synapses).</p>
        <p class="next-row"><a class="btn btn--primary btn--lg" data-act="next" href="${href(ctx.caseId, 3)}">Next: TDP-43 dysfunction</a></p>
      </div>
    </div>`;

  const $ = s => root.querySelector(s);
  const $$ = s => root.querySelectorAll(s);
  const section = $(".descent"), stage = $(".descent__stage"), svg = $(".descent__svg"), scene = $(".descent__scene");
  const flyG = $(".d-fly"), capEl = $(".descent__cap"), frameEl = $(".descent__viewer");
  const flyLabel = $(".d-label--fly"), partLabels = [...$$(".d-label--part")], regionLabels = [...$$(".d-label--region")];
  const leaders = [...$$(".d-leader:not(.d-leader--region)")], arrows = [...$$(".d-arrow:not(.d-arrow--region)")];
  const rLeaders = [...$$(".d-leader--region")], rArrows = [...$$(".d-arrow--region")];
  const turb = $("#descent-boil feTurbulence"), disp = $("#descent-boil feDisplacementMap");
  const handRect = takeHandOff("fly");

  const [, , gsap] = await Promise.all([loadFlySprite("lateral"), loadFlySprite("frontal"), loadGsap()]);
  const imgs = {};
  const imagesReady = Promise.all(["control", "mutant"].flatMap(g => ["membrane", "dapi"].map(async l => {
    (imgs[g] ||= {})[l] = await loadImage(`data/${ctx.caseId}/images/${g}-1-${l}.webp`);
  })));
  const P = new URLSearchParams(location.search);
  const frozen = P.has("t") ? Number(P.get("t")) : null;
  const still = reducedMotion();

  // ---------- the fly: side-view drawing, one live path per part, morphing to the front view ----------
  const partsOf = view => [...document.getElementById(`fly-${view}-stand-0`).children]
    .map(el => (el.tagName === "use" ? document.querySelector(el.getAttribute("href")) : el));
  const front = partsOf("frontal");
  const frontBy = new Map(front.map(p => [p.dataset.part, p]));
  const live = [];
  for (const src of partsOf("lateral")) {
    const el = src.cloneNode(true);
    el.removeAttribute("id");
    flyG.append(el);
    live.push({ el, part: src.dataset.part, to: frontBy.get(src.dataset.part) });
  }
  for (const p of front) {
    if (live.some(l => l.part === p.dataset.part)) continue;
    const el = p.cloneNode(true);
    el.removeAttribute("id");
    el.style.opacity = "0";
    flyG.append(el);
    live.push({ el, part: p.dataset.part, to: p, fadeIn: true });
  }
  const sideOrder = live.map(l => l.el);
  const frontOrder = front.map(p => live.find(l => l.part === p.dataset.part).el).concat(live.filter(l => !l.to).map(l => l.el));
  let order = "side";

  // ---------- layout: stage aspect, the viewer-like frame, the camera that lands in it ----------
  const cam = { cx: 0, cy: 0, lh: 0 };
  const flyAt = { x: FLY_START.x, y: FLY_START.y };
  const look = { wash: 100, ink: 100 };
  const hand = { dx: 0, dy: 0, s: 1 };
  let L = null, tl = null;

  function layout() {
    const sw = svg.clientWidth || 1, sh = svg.clientHeight || 1;
    const sr = svg.getBoundingClientRect();
    const fields = [...$$(".descent__field")].map(f => {
      const r = f.getBoundingClientRect();
      return { x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height };
    });
    const f0 = fields[0], f1 = fields[1];
    const s = Math.min(f0.w / (whole[2] - whole[0]), f0.h / (whole[3] - whole[1])) * 0.92;   // the viewer's "whole neuron"
    const vh = sh / s, vw = sw / s;
    const vx = view.cx + NEURON_AT.x - (f0.x + f0.w / 2) / s, vy = view.cy + NEURON_AT.y - (f0.y + f0.h / 2) / s;
    const camO = { cx: vx + vw / 2, cy: vy + vh / 2, h: vh };
    const shift = ((f1.x + f1.w / 2) - (f0.x + f0.w / 2)) / s;
    L = { sw, sh, aspect: sw / sh, s, camO, shift };
    imagesReady.then(() => $$(".descent__field canvas").forEach((c, i) => paintField(c, imgs[i ? "mutant" : "control"], geoC.frame, view, s)));
  }

  // camera stops: [centre x, centre y, height] in µm
  const camAt = {
    tube: () => [-2600, TUBE.y0 + TUBE.h / 2 - 300, 12000 / L.aspect],
    fly: () => [0, 270, 2500],
    head: () => [0, 20, 880],
    brain: () => [0, 0, Math.max(760, 720 / L.aspect)],
    neuron: () => [(nb[0] + nb[2]) / 2 + NEURON_AT.x - 18, (nb[1] + nb[3]) / 2 + NEURON_AT.y, 180],
    drift: () => [(nb[0] + nb[2]) / 2 + NEURON_AT.x - 16, (nb[1] + nb[3]) / 2 + NEURON_AT.y, 168],
    viewer: () => [L.camO.cx, L.camO.cy, L.camO.h],
  };
  const stop = k => { const [cx, cy, h] = camAt[k](); return { cx, cy, lh: Math.log(h) }; };

  function build() {
    const p = tl ? tl.progress() : 0;
    if (tl) tl.kill();
    layout();
    // start values for everything whose first tween comes later (rendered when the playhead is earlier)
    Object.assign(flyAt, FLY_START);
    Object.assign(look, { wash: 100, ink: 100 });
    Object.assign(cam, stop("tube"));
    live.forEach(l => { l.el.style.opacity = l.fadeIn ? "0" : "1"; });
    gsap.set([".bg-grey", ".bg-charcoal", ".bg-black", ".brain-dash", ".d-mutant", ".descent__field canvas"], { opacity: 0 });
    gsap.set([frameEl, ...partLabels, ...regionLabels], { autoAlpha: 0 });
    gsap.set([...leaders, ...arrows, ...rLeaders, ...rArrows], { autoAlpha: 1 });
    [...lead, ...rlead].forEach(l => { l.k = 0; });
    gsap.set([".descent__title", flyLabel], { autoAlpha: 1 });
    gsap.set(".brain-line", { drawSVG: "0%" });
    gsap.set(".nrn-grow", { attr: { r: 0 } });
    gsap.set([".d-brain", ".nrn", ".d-mirror"], { opacity: 1 });
    tl = gsap.timeline({ paused: true, onUpdate: draw, defaults: { ease: "power2.inOut", immediateRender: false } });
    const camTo = (from, to, at, dur, ease = "power2.inOut") => tl.fromTo(cam, stop(from), { ...stop(to), duration: dur, ease }, at);

    // K 0–2: the tube wipes away; the fly lifts to the centre and turns to face us
    camTo("tube", "fly", 0, 2.0);
    tl.fromTo(".tube-wipe", { attr: { x: TUBE.x0 - 600 } }, { attr: { x: TUBE.x0 + TUBE.w + 600 }, duration: 0.8, ease: "power1.in" }, 0)
      .fromTo(flyAt, { ...FLY_START }, { ...FLY_END, duration: 1.2 }, 0.4)
      .fromTo(look, { wash: 100, ink: 100 }, { wash: 30, ink: 62, duration: 0.8 }, 1.0);
    for (const l of live) {
      if (l.to && !l.fadeIn) tl.fromTo(l.el, { morphSVG: l.el.getAttribute("d") }, { morphSVG: l.to.getAttribute("d"), duration: 0.8 }, 0.9);
      else if (!l.to) tl.fromTo(l.el, { opacity: 1 }, { opacity: 0, duration: 0.5 }, 0.9);
      else tl.fromTo(l.el, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 1.2);
    }
    // only the head stays drawn as we go in, so its outline isn't lost among the body's
    tl.fromTo(live.filter(l => l.to && !HEAD_PARTS.has(l.part)).map(l => l.el), { opacity: 1 }, { opacity: 0, duration: 1.2, ease: "power1.in" }, 2.1)
      .fromTo(".descent__title", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4 }, 2.1)
      .fromTo(flyLabel, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3 }, 2.2)
    // L 2–4.5: into the head; the body nearly clear; the paper greys
      .fromTo(look, { wash: 30, ink: 62 }, { wash: 6, ink: 30, duration: 2.0 }, 2.0)
      .fromTo(".bg-grey", { opacity: 0 }, { opacity: 1, duration: 2.5 }, 2.0);
    camTo("fly", "head", 2.0, 2.5);
    // M 4.5–7.5: the brain draws on; the Pdf neurons grow out from their cell bodies
    camTo("head", "brain", 4.6, 1.0, "power1.inOut");
    tl.fromTo(".brain-line", { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.3, stagger: 0.08, ease: "power1.inOut" }, 4.5)
      .fromTo(".brain-dash", { opacity: 0 }, { opacity: 1, duration: 0.5 }, 5.5)
      .fromTo(".nrn-grow", { attr: { r: 0 } }, { attr: { r: 190 }, duration: 1.1, ease: "power1.inOut" }, 6.2);
    // the brain's two main regions are named once it is drawn, and go as the camera moves in
    REGIONS.forEach(([, , , side], i) => {
      const at = 5.75 + i * 0.3;
      tl.fromTo(regionLabels[i], { autoAlpha: 0, y: side === "above" ? -4 : 4 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, at)
        .fromTo(rlead[i], { k: 0 }, { k: 1, duration: 0.35, ease: "power2.out" }, at + 0.12);
    });
    tl.fromTo([...regionLabels, ...rLeaders, ...rArrows], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, 7.3)
    // the right side's neurons (a mirror image of the left's) go before the camera closes in on the left
      .fromTo(".d-mirror", { opacity: 1 }, { opacity: 0, duration: 0.4, ease: "power1.in" }, 7.3)
    // N 7.5–10.5: close in on the s-LNvs; labels one at a time; paper → charcoal; the drawing fades
      .fromTo(look, { wash: 6, ink: 30 }, { wash: 0, ink: 0, duration: 0.8 }, 7.5)
      .fromTo(".bg-charcoal", { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power1.inOut" }, 7.5)
      .fromTo(".d-brain", { opacity: 1 }, { opacity: 0.32, duration: 1.4 }, 7.8);
    camTo("brain", "neuron", 7.5, 1.3);
    camTo("neuron", "drift", 8.8, 1.7, "none");
    PARTS.forEach((_, i) => {
      const at = 7.9 + i * 0.6;
      tl.fromTo(partLabels[i], { autoAlpha: 0, x: -6 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out" }, at)
        .fromTo(lead[i], { k: 0 }, { k: 1, duration: 0.35, ease: "power2.out" }, at + 0.12);
    });
    // O 10.5–14: to the viewer's opening view; black; the mutant's neurons; the images
    tl.fromTo([...partLabels, ...leaders, ...arrows], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25 }, 10.4)
      .fromTo(".d-brain", { opacity: 0.32 }, { opacity: 0, duration: 0.5 }, 10.4)
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

  // ---------- every frame, from the timeline's time ----------
  const toScreen = (x, y) => {
    const h = Math.exp(cam.lh), w = h * L.aspect;
    return [(x - (cam.cx - w / 2)) * L.sw / w, (y - (cam.cy - h / 2)) * L.sh / h];
  };
  // a label at screen point [x, y] (`side`: the text ends there, or sits centred above or below
  // it) with an arrow drawn `k` of the way from the text to the anchor [ax, ay]
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
    const hs = Math.min(1, Math.max(0, (k - 0.6) / 0.4));   // the head grows in as the line arrives
    const bx = ex - ux * 8 * hs, by = ey - uy * 8 * hs, nx = -uy * 3.6 * hs, ny = ux * 3.6 * hs;
    arrow.setAttribute("d", hs > 0 ? `M${ex.toFixed(1)},${ey.toFixed(1)} L${(bx + nx).toFixed(1)},${(by + ny).toFixed(1)} L${(bx - nx).toFixed(1)},${(by - ny).toFixed(1)} Z` : "");
  }

  let capKey = -1, lastSeed = 0;
  function draw() {
    if (!tl || !L) return;
    const t = tl.time();
    const h = Math.exp(cam.lh), w = h * L.aspect;
    svg.setAttribute("viewBox", `${(cam.cx - w / 2).toFixed(2)} ${(cam.cy - h / 2).toFixed(3)} ${w.toFixed(3)} ${h.toFixed(3)}`);
    const px = w / L.sw;   // µm per screen pixel
    svg.style.setProperty("--px", px.toFixed(5));

    // the fly: position (plus the hand-off from step 1), see-through washes, front-view order
    const fx = flyAt.x + hand.dx * px, fy = flyAt.y + hand.dy * px;
    flyG.setAttribute("transform", `translate(${fx.toFixed(2)} ${fy.toFixed(2)}) scale(${(FLY_K * hand.s).toFixed(4)})`);
    flyG.style.setProperty("--fly-wash", `color-mix(in srgb, var(--wash-body) ${look.wash.toFixed(1)}%, transparent)`);
    flyG.style.setProperty("--fly-eye", `color-mix(in srgb, var(--wash-eye) ${look.wash.toFixed(1)}%, transparent)`);
    flyG.style.setProperty("--fly-wing", `color-mix(in srgb, var(--wash-wing) ${look.wash.toFixed(1)}%, transparent)`);
    flyG.style.setProperty("--fly-ink", `color-mix(in srgb, var(--ink) ${look.ink.toFixed(1)}%, transparent)`);
    flyG.style.display = look.ink <= 0.01 ? "none" : "";
    const want = t >= 1.3 ? "front" : "side";
    if (want !== order) { flyG.append(...(want === "front" ? frontOrder : sideOrder)); order = want; }
    // the ink boil while the fly is small (filters stay off large areas), ~1.3 px on screen
    if (t < 1.9 && !still) {
      flyG.setAttribute("filter", "url(#descent-boil)");
      disp.setAttribute("scale", (1.3 * px / FLY_K).toFixed(3));
      const seed = frozen != null ? 3 : [3, 8, 13][Math.floor(performance.now() / (1000 / 12)) % 3];
      if (seed !== lastSeed) { turb.setAttribute("seed", seed); lastSeed = seed; }
    } else flyG.removeAttribute("filter");

    // labels follow their anchors on screen
    const [lx, ly] = toScreen(fx + 1700 * hand.s, fy - 250 * hand.s);   // beside the fly, on its right
    flyLabel.style.transform = `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px) translate(0, -50%)`;
    // compartment labels: text ends at its point, to the left of the anatomy; region labels sit
    // above or below theirs. Each arrow starts just past the text and stops short of its anchor,
    // its head pointing at the anatomy.
    PARTS.forEach(([, a, p], i) => pointer(partLabels[i], leaders[i], arrows[i], lead[i].k, "left",
      toScreen(p[0] + NEURON_AT.x, p[1] + NEURON_AT.y), toScreen(a[0] + NEURON_AT.x, a[1] + NEURON_AT.y)));
    REGIONS.forEach(([, a, p, side], i) => pointer(regionLabels[i], rLeaders[i], rArrows[i], rlead[i].k, side,
      toScreen(p[0], p[1]), toScreen(a[0], a[1])));

    // caption and the dark stage
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

  // ---------- scroll, frozen review frames, reduced motion ----------
  let stopScrub = null;
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
    stopScrub = scrollScrub(gsap, section, () => tl, { skip: root.querySelector("[data-act=skip]"), next: root.querySelector("[data-act=next]") });
    // hand-off from step 1: the fly grows out of where it stood in its tube
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

  let boilTimer = frozen == null && !still ? setInterval(() => { if (tl && tl.time() < 1.9) draw(); }, 1000 / 12) : null;
  let resizeTimer = null;
  const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { build(); window.ScrollTrigger?.refresh(); }, 120); };
  window.addEventListener("resize", onResize);

  // the matched swap: step 3's viewer grows out of this frame
  root.querySelector("[data-act=next]").addEventListener("click", () => { if (frameEl.getBoundingClientRect().bottom > 0) handOff("viewer", frameEl); });
  window.__descent = { get tl() { return tl; }, cam, hand, handRect };   // for review tooling

  return () => {
    window.removeEventListener("resize", onResize);
    clearInterval(boilTimer);
    clearTimeout(resizeTimer);
    stopScrub?.();
    tl?.kill();
    delete window.__descent;
  };
}
