// Step 2, leg motor neuron case: the descent (docs/storyboards/nmj-openings.md, shots K–O).
// Scroll-driven like the other descents (step2.js): the stage stays pinned for about three screens
// and the scroll position sets one 14 s timeline, so scrubbing back and forth always gives the same
// frame.
//   K 0–2      the WT fly highest on the vial's wall lifts off, rights itself into the side view and
//              turns a little towards us (side view → the turned side view, MorphSVG)
//   L 2–4.5    the camera pushes in on the thorax and the near front leg, which turn see-through
//   M 4.5–8    the ventral nerve cord (VNC) draws on inside the thorax; one motor neuron's cell body
//              and dendrites appear in membrane blue, and its axon draws out through the leg nerve,
//              down the coxa and up the femur, where it branches into synaptic terminals on a muscle
//   N 8–10.5   the fly and the VNC fade; the camera closes in; the middle of the axon gathers behind
//              an ink break symbol as the neuron settles into the viewer's layout; cell body, axon and
//              synaptic terminals are named; paper → charcoal
//   O 10.5–14  the outline settles where the viewer will open; black; the mutant's slides in on the
//              right and the microscope images come up under the outlines (matched swap)
//
// The world is the fly drawing's, in µm (anatomy.json: the turned side view, thorax at 0,0, x towards
// the head, y down). The VNC and the cell's part in it follow the MaleCNS cell; its path down the leg
// follows the flybody front leg. The viewer's geometry sits at viewer.at. `?t=6` freezes the descent at
// 6 s; reduced motion shows the labelled motor neuron.

import { href } from "../router.js";
import { term } from "../glossary.js";
import { loadJSON } from "../data.js";
import { loadGsap, reducedMotion } from "../gsap.js";
import { loadFlySprite } from "../fly.js";
import { handOff, takeHandOff } from "../handoff.js";

const NS = "http://www.w3.org/2000/svg";
const DUR = 14;
const FLY_K = 10;                              // µm per fly-sprite unit (life size)
const GROUND = 118;                            // the side-view sprite's thorax above its feet (sprite units)
const FLY_START = { x: -1600, y: 600, rot: -90 };   // head up on the vial's right wall, as in step 1
const WALL = FLY_START.x + GROUND * FLY_K;     // the wall's inner face
const STILL_T = 10.2;
const MORPH = [8.1, 9.7];                      // the shortening
const KEEP = new Set(["thorax", "head", "eye", "coxa_T1_right", "femur_T1_right", "tibia_T1_right", "tarsus_T1_right"]);
const BLUE = { membrane: "#5F78C0", dapi: "#5A78EB" };

const CAPTIONS = [
  [0, "Scroll to go inside the fly ↓"],
  [0.3, "We follow one of the hTDP-43 WT flies, a good climber."],
  [2.3, "Into its thorax, where the legs attach."],
  [4.8, "Inside the thorax lies the ventral nerve cord, the fly’s equivalent of our spinal cord."],
  [6.0, "In blue, one leg motor neuron. Its axon runs down the leg and ends on a muscle."],
  [8.3, "The real axon is far longer. We draw it short so the whole neuron fits one view."],
  [10.8, "This is what you will look at under the microscope."],
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

// The VNC's edge and the leg as the viewer's images show them (each piece of the cuticle's outline
// as strong as the image there), with the femur muscle as a wash.
const contextMarkup = A => `
  <g class="nmj-ctx">
    <path class="ctx-muscle" d="${A.viewer.muscle}"/>
    <path class="ctx-edge" d="${A.viewer.vnc_edge}"/>
    ${A.viewer.cuticle.map(([d, a]) => `<path class="ctx-cuticle" d="${d}" stroke-opacity="${a}"/>`).join("")}
    ${A.viewer.joints.map(d => `<path class="ctx-cuticle ctx-joint" d="${d}"/>`).join("")}
  </g>`;

async function loadImage(url) {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

// The viewer's blue channel at its opening view: membrane and DAPI images tinted and added on black.
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

const lerp = (a, b, u) => a + (b - a) * u;
const lerp2 = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];

export async function mount(root, ctx) {
  const [geoC, geoM, A] = await Promise.all([
    loadJSON(`data/${ctx.caseId}/geometry-control-1.json`), loadJSON(`data/${ctx.caseId}/geometry-mutant-1.json`), loadJSON(`data/${ctx.caseId}/anatomy.json`)]);
  const whole = [Math.min(geoC.bounds[0], geoM.bounds[0]), Math.min(geoC.bounds[1], geoM.bounds[1]), Math.max(geoC.bounds[2], geoM.bounds[2]), Math.max(geoC.bounds[3], geoM.bounds[3])];
  const view = { cx: (whole[0] + whole[2]) / 2, cy: (whole[1] + whole[3]) / 2 };
  const AT = { x: A.viewer.at[0], y: A.viewer.at[1] };
  const N = A.neuron, T = A.terminals, nb = geoC.bounds;
  const shortPath = A.viewer.path.map(([x, y]) => [x + AT.x, y + AT.y]);
  const cellC = geoC.cells[0].nucleus_centre;
  const soma1 = [cellC[0] + AT.x, cellC[1] + AT.y];
  const fbV = [T.viewer.at[0] + AT.x, T.viewer.at[1] + AT.y];
  // compartment labels, in the viewer's order (the nucleus is named with its cell body); label points
  // in geometry µm, to the left of the anatomy
  const PARTS = ["Cell body (with its nucleus)", "Axon", "Synaptic terminals (on a leg muscle)"];
  const LABEL_AT = [[nb[0] - 8, cellC[1]], [nb[0] - 2, 92], [nb[0] + 30, 150]];
  const lead = PARTS.map(() => ({ k: 0 })), rlead = { k: 0 };

  root.innerHTML = `
    <div class="descent-page">
      <section class="descent" aria-label="Descent from the fly into its leg motor neuron">
        <div class="descent__stage">
          <div class="descent__bg" aria-hidden="true"><i class="bg-grey"></i><i class="bg-charcoal"></i><i class="bg-black"></i></div>
          <div class="descent__title"><p class="t-label">Introduction · Step 2</p><h1 class="t-h1">Anatomy</h1></div>
          <div class="descent__scene">
            <div class="descent__viewer" aria-hidden="true">
              <p class="descent__vtop">Simulated confocal images · membrane + DAPI</p>
              ${["hTDP-43 WT", "hTDP-43 mutant"].map((l, i) => `
                <div class="descent__field" data-field="${i}"><canvas></canvas><p class="viewer__label">${l}</p></div>`).join("")}
              <p class="descent__vbar">${ctx.case.anatomy?.projection || "2D maximum-intensity projection (simulated)"}</p>
            </div>
            <svg class="descent__svg" role="img" aria-label="The hTDP-43 WT fly highest on the vial's wall rights itself and turns a little towards us; we push into its thorax, where the ventral nerve cord appears. One motor neuron lights up in blue: its cell body and dendrites in the nerve cord, its axon running out through the leg nerve, down the leg and into the femur, where it ends in synaptic terminals on a muscle. The axon is then drawn much shorter, behind a break mark, so the whole neuron fits one view: cell body, axon and synaptic terminals. It ends as two microscope fields: WT left, mutant right.">
              <defs>
                <filter id="descent-boil" x="-5%" y="-5%" width="110%" height="110%">
                  <feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="3"/>
                  <feDisplacementMap in="SourceGraphic" scale="2" xChannelSelector="R" yChannelSelector="G"/>
                </filter>
                <clipPath id="vial-wipe"><rect class="vial-wipe" x="${WALL - 30000}" y="-40000" width="34000" height="80000"/></clipPath>
                <clipPath id="mn-grow"><circle class="mn-grow" cx="${N.soma[0]}" cy="${N.soma[1]}" r="0"/></clipPath>
                <clipPath id="term-grow"><circle class="term-grow" cx="0" cy="0" r="0"/></clipPath>
              </defs>
              <g class="d-vial" clip-path="url(#vial-wipe)">
                <rect class="tube-glass" x="${WALL - 25000}" y="-40000" width="25000" height="80000"/>
                <path class="d-ink" d="M${WALL},-40000 V40000"/>
              </g>
              <g class="d-fly fly"></g>
              <g class="d-vnc">
                <path class="brain-line vnc-line" d="${A.vnc.outline}"/>
                ${A.vnc.nerves.map(d => `<path class="brain-dash vnc-nerve" d="${d}"/>`).join("")}
                ${Object.entries(A.vnc.neuromeres).map(([k, [x, y]]) => `<text class="vnc-tag" x="${x}" y="${y}" text-anchor="middle">${k}</text>`).join("")}
              </g>
              <g class="d-leg"></g>
              <ellipse class="mn-muscle" cx="${N.muscle.at[0]}" cy="${N.muscle.at[1]}" rx="${N.muscle.rx}" ry="${N.muscle.ry}" transform="rotate(${N.muscle.angle} ${N.muscle.at[0]} ${N.muscle.at[1]})"/>
              <g class="d-ctx" transform="translate(${AT.x} ${AT.y})">${contextMarkup(A)}</g>
              <g class="d-neurons" transform="translate(${AT.x} ${AT.y})">
                <g class="d-fill">${neuronMarkup(geoC, "nrn--wt")}</g>
                <g class="d-mutant">${contextMarkup(A)}${neuronMarkup(geoM, "nrn--mut")}</g>
              </g>
              <g class="d-mn">
                <path class="mn-dend" clip-path="url(#mn-grow)" d="${N.dendrites}"/>
                <path class="mn-axon"/>
                <g class="mn-term"><g clip-path="url(#term-grow)">
                  <path class="mn-branch" d="${T.branches}"/>
                  ${T.swellings.map(([x, y, rx, ry, a]) => `<ellipse class="mn-swell" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})"/>`).join("")}
                </g></g>
                <circle class="mn-soma" cx="${N.soma[0]}" cy="${N.soma[1]}" r="${N.soma_r}"/>
              </g>
              <g class="d-break"><path class="break-mark" d="M-4,-7 L-1,7 M1,-7 L4,7"/></g>
            </svg>
            <div class="descent__labels" aria-hidden="true">
              <svg class="d-leaders">${PARTS.map(() => `<path class="d-leader"/><path class="d-arrow"/>`).join("")}<path class="d-leader d-leader--region"/><path class="d-arrow d-arrow--region"/></svg>
              <span class="d-label d-label--fly">hTDP-43 WT</span>
              ${PARTS.map(name => `<span class="d-label d-label--part">${name}</span>`).join("")}
              <span class="d-label d-label--region">Ventral nerve cord (VNC)</span>
            </div>
          </div>
          <p class="descent__caption" aria-live="polite"><span class="descent__cap"></span></p>
          <div class="descent__controls">
            <a class="btn btn--primary btn--lg" data-act="next" href="${href(ctx.caseId, 3)}">Next: the first clue</a>
          </div>
        </div>
      </section>
      <div class="story descent__after">
        <p class="t-story">The legs are moved by ${term("mn", "motor neurons")} whose cell bodies sit in the ${term("vnc", "ventral nerve cord (VNC)")}, the fly’s equivalent of our spinal cord. This simulation follows one of them, a motor neuron of the front leg; its cell body and dendrites in the VNC are traced from a reconstruction of the male fly’s nervous system (MaleCNS). Its dendrites receive input in the VNC. Its axon leaves through the leg nerve, runs down the coxa and through the trochanter into the femur, and ends in synaptic terminals on a leg muscle, which it makes contract. The real axon is about half a millimetre long; the images draw it far shorter, so the whole cell fits one view.</p>
        <p class="t-story">A membrane label (${term("labels", "mCD8::BFP")}, made with OK371-GAL4) shows its shape in blue, and ${term("labels", "DAPI")} marks its nucleus in the same blue. The VNC, the leg’s cuticle and the muscle show faintly by their own glow. In the images you will count spots in four compartments: nucleus, cell body, axon and synaptic terminals. The dendrites are drawn here but not in the images.</p>
        <p class="next-row"><a class="btn btn--primary btn--lg" href="${href(ctx.caseId, 3)}">Next: the first clue</a></p>
      </div>
    </div>`;

  const $ = s => root.querySelector(s);
  const $$ = s => root.querySelectorAll(s);
  const section = $(".descent"), stage = $(".descent__stage"), svg = $(".descent__svg");
  const flyG = $(".d-fly"), capEl = $(".descent__cap"), frameEl = $(".descent__viewer");
  const flyLabel = $(".d-label--fly"), partLabels = [...$$(".d-label--part")], regionLabel = $(".d-label--region");
  const leaders = [...$$(".d-leader:not(.d-leader--region)")], arrows = [...$$(".d-arrow:not(.d-arrow--region)")];
  const rLeader = $(".d-leader--region"), rArrow = $(".d-arrow--region");
  const turb = $("#descent-boil feTurbulence"), disp = $("#descent-boil feDisplacementMap");
  const axonEl = $(".mn-axon"), somaEl = $(".mn-soma"), termEl = $(".mn-term"), breakEl = $(".d-break");
  const handRect = takeHandOff("fly");

  const [, , gsap] = await Promise.all([loadFlySprite("lateral"), loadFlySprite("turned"), loadGsap()]);
  const imgs = {};
  const imagesReady = Promise.all(["control", "mutant"].flatMap(g => ["membrane", "dapi"].map(async l => {
    (imgs[g] ||= {})[l] = await loadImage(`data/${ctx.caseId}/images/${g}-1-${l}.webp`);
  })));
  const P = new URLSearchParams(location.search);
  const frozen = P.has("t") ? Number(P.get("t")) : null;
  const still = reducedMotion();

  // ---------- the fly: side view, one live path per part, morphing to the turned side view ----------
  const partsOf = v => [...document.getElementById(`fly-${v}-stand-0`).children]
    .map(el => (el.tagName === "use" ? document.querySelector(el.getAttribute("href")) : el));
  const turned = partsOf("turned");
  const turnedBy = new Map(turned.map(p => [p.dataset.part, p]));
  const live = [];
  for (const src of partsOf("lateral")) {
    const el = src.cloneNode(true);
    el.removeAttribute("id");
    flyG.append(el);
    live.push({ el, part: src.dataset.part, to: turnedBy.get(src.dataset.part) });
  }
  // the near front leg, in the world: shrinks into the viewer's leg as the axon shortens (the
  // tibia and tarsus fade; the trochanter, which flybody draws with the femur, comes in)
  const legG = $(".d-leg");
  const scaleD = (d, k) => d.replace(/-?\d*\.?\d+(?:e-?\d+)?/g, n => (Number(n) * k).toFixed(1));
  const moveD = (d, dx, dy) => { let i = 0; return d.replace(/-?\d*\.?\d+/g, n => (Number(n) + (i++ % 2 ? dy : dx)).toFixed(2)); };
  const legPart = (cls, d) => { const el = document.createElementNS(NS, "path"); el.setAttribute("class", cls); el.setAttribute("d", d); legG.append(el); return el; };
  const LEG_TO = { coxa_T1_right: "coxa", femur_T1_right: "femur", tibia_T1_right: null, tarsus_T1_right: null };
  const legParts = Object.entries(LEG_TO).map(([part, to]) => {
    const d = scaleD(turnedBy.get(part).getAttribute("d"), FLY_K);
    return { el: legPart("leg-part", d), from: d, to: to && moveD(A.viewer.legs[to], AT.x, AT.y) };
  });
  const trochEl = legPart("leg-part", moveD(A.viewer.legs.trochanter, AT.x, AT.y));
  const sideOrder = live.map(l => l.el);
  const turnOrder = turned.map(p => live.find(l => l.part === p.dataset.part)?.el).filter(Boolean).concat(live.filter(l => !l.to).map(l => l.el));
  let order = "side";

  // the long path (through the VNC, down the nerve and the leg) and the short one (the viewer's), vertex for vertex
  const longPath = N.path;
  const nerveMid = N.parts.nerve + Math.floor((N.parts.coxa - N.parts.nerve) / 2);
  const axonAnchor = N.parts.coxa + Math.floor((N.parts.trochanter - N.parts.coxa) / 2);

  // ---------- layout and camera ----------
  const cam = { cx: 0, cy: 0, lh: 0 };
  const fly = { x: FLY_START.x, y: FLY_START.y, rot: FLY_START.rot };
  const look = { wash: 100, ink: 100 };
  const hand = { dx: 0, dy: 0, s: 1 };
  const grow = { axon: 0 }, morph = { u: 0 };
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
    const vx = view.cx + AT.x - (f0.x + f0.w / 2) / s, vy = view.cy + AT.y - (f0.y + f0.h / 2) / s;
    L = { sw, sh, aspect: sw / sh, s, camO: { cx: vx + vw / 2, cy: vy + vh / 2, h: vh }, shift: ((f1.x + f1.w / 2) - (f0.x + f0.w / 2)) / s };
    imagesReady.then(() => $$(".descent__field canvas").forEach((c, i) => paintField(c, imgs[i ? "mutant" : "control"], geoC.frame, view, s)));
  }

  // camera stops: [centre x, centre y, height] in µm
  const mid = [(nb[0] + nb[2]) / 2 + AT.x, (nb[1] + nb[3]) / 2 + AT.y];
  const camAt = {
    vial: () => [FLY_START.x - 1400, FLY_START.y - 1800, 13000],
    fly: () => [-300, 150, 2700],
    thorax: () => [200, 260, 1300],
    vnc: () => [180, 300, Math.max(1050, 1900 / L.aspect)],
    neuron: () => [mid[0] - 14, mid[1], 250],
    drift: () => [mid[0] - 12, mid[1], 236],
    viewer: () => [L.camO.cx, L.camO.cy, L.camO.h],
  };
  const stop = k => { const [cx, cy, h] = camAt[k](); return { cx, cy, lh: Math.log(h) }; };

  function build() {
    const p = tl ? tl.progress() : 0;
    if (tl) tl.kill();
    layout();
    Object.assign(fly, FLY_START);
    Object.assign(look, { wash: 100, ink: 100 });
    Object.assign(cam, stop("vial"));
    grow.axon = 0; morph.u = 0;
    live.forEach(l => { l.el.style.opacity = "1"; });
    gsap.set([".bg-grey", ".bg-charcoal", ".bg-black", ".vnc-nerve", ".vnc-tag", ".d-mutant", ".descent__field canvas", ".d-fill", ".d-ctx", ".mn-muscle", ".mn-soma", ".mn-dend", ".d-break", ".d-leg", trochEl], { opacity: 0 });
    legParts.forEach(p => { p.el.setAttribute("d", p.from); p.el.style.opacity = "1"; });
    gsap.set([frameEl, ".descent__controls", ...partLabels, regionLabel], { autoAlpha: 0 });
    gsap.set([...leaders, ...arrows, rLeader, rArrow], { autoAlpha: 1 });
    [...lead, rlead].forEach(l => { l.k = 0; });
    gsap.set([".descent__title", flyLabel], { autoAlpha: 1 });
    gsap.set(".vnc-line", { drawSVG: "0%" });
    gsap.set([".mn-grow", ".term-grow"], { attr: { r: 0 } });
    gsap.set([".d-vnc", ".d-mn", ".nrn"], { opacity: 1 });
    tl = gsap.timeline({ paused: true, onUpdate: draw, defaults: { ease: "power2.inOut", immediateRender: false } });
    const camTo = (from, to, at, dur, ease = "power2.inOut") => tl.fromTo(cam, stop(from), { ...stop(to), duration: dur, ease }, at);

    // K 0–2: the vial wipes away; the fly lifts off the wall, rights itself and turns a little towards us
    camTo("vial", "fly", 0, 2.0);
    tl.fromTo(".vial-wipe", { attr: { x: WALL - 30000 } }, { attr: { x: WALL + 4000 }, duration: 0.8, ease: "power1.in" }, 0)
      .fromTo(fly, { ...FLY_START }, { x: 0, y: 0, rot: 0, duration: 1.3 }, 0.3)
      .fromTo(look, { wash: 100, ink: 100 }, { wash: 34, ink: 66, duration: 0.8 }, 1.1);
    for (const l of live) {
      if (l.to) tl.fromTo(l.el, { morphSVG: l.el.getAttribute("d") }, { morphSVG: l.to.getAttribute("d"), duration: 0.8 }, 1.0);
    }
    // only the thorax, the head and the near front leg stay drawn as we go in
    tl.fromTo(live.filter(l => !KEEP.has(l.part)).map(l => l.el), { opacity: 1 }, { opacity: 0, duration: 1.2, ease: "power1.in" }, 2.1)
      .fromTo(".descent__title", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4 }, 2.1)
      .fromTo(flyLabel, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3 }, 2.2)
    // L 2–4.5: into the thorax; the body nearly clear; the paper greys
      .fromTo(look, { wash: 34, ink: 66 }, { wash: 8, ink: 34, duration: 2.0 }, 2.0)
      .fromTo(".bg-grey", { opacity: 0 }, { opacity: 1, duration: 2.5 }, 2.0);
    camTo("fly", "thorax", 2.0, 2.5);
    // M 4.5–8: the VNC draws on; the motor neuron's cell body and dendrites appear; the axon draws
    // out into the leg and branches into synaptic terminals on the muscle
    camTo("thorax", "vnc", 4.5, 1.2, "power1.inOut");
    tl.fromTo(".vnc-line", { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.3, ease: "power1.inOut" }, 4.5)
      .fromTo([".vnc-nerve", ".vnc-tag"], { opacity: 0 }, { opacity: 1, duration: 0.5 }, 5.5)
      .fromTo(regionLabel, { autoAlpha: 0, y: -4 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 4.9)
      .fromTo(rlead, { k: 0 }, { k: 1, duration: 0.35, ease: "power2.out" }, 5.02)
      .fromTo(".mn-soma", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 6.0)
      .fromTo(".mn-dend", { opacity: 0 }, { opacity: 1, duration: 0.2 }, 6.0)
      .fromTo(".mn-grow", { attr: { r: 0 } }, { attr: { r: 90 }, duration: 0.7, ease: "power1.out" }, 6.0)
      .fromTo(grow, { axon: 0 }, { axon: 1, duration: 1.2, ease: "power1.inOut" }, 6.2)
      .fromTo(".mn-muscle", { opacity: 0 }, { opacity: 1, duration: 0.5 }, 6.9)
      .fromTo(".term-grow", { attr: { r: 0 } }, { attr: { r: 60 }, duration: 0.6, ease: "power1.out" }, 7.35)
      .fromTo([regionLabel, rLeader, rArrow], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, 7.6)
    // N 8–10.5: the fly and the VNC go; the neuron settles into the viewer's layout as we close in
      .fromTo(look, { wash: 8, ink: 34 }, { wash: 0, ink: 0, duration: 0.8 }, 8.0)
      .fromTo(".bg-charcoal", { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power1.inOut" }, 8.0)
      .fromTo([".d-vnc", ".mn-muscle"], { opacity: 1 }, { opacity: 0, duration: 0.6 }, 8.0)
      .fromTo(".mn-dend", { opacity: 1 }, { opacity: 0, duration: 0.6 }, 8.2)
      .fromTo(".d-leg", { opacity: 0 }, { opacity: 1, duration: 0.4 }, 7.8)
      .fromTo(legParts.filter(p => !p.to).map(p => p.el), { opacity: 1 }, { opacity: 0, duration: 0.6 }, MORPH[0])
      .fromTo(trochEl, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 9.0)
      .fromTo(".d-leg", { opacity: 1 }, { opacity: 0, duration: 0.5, ease: "power1.in" }, 9.7)
      .fromTo(morph, { u: 0 }, { u: 1, duration: MORPH[1] - MORPH[0], ease: "power2.inOut" }, MORPH[0])
      .fromTo(".d-break", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 8.4)
      .fromTo(".d-ctx", { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power1.inOut" }, 9.3)
      .fromTo(".d-fill", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.inOut" }, 9.8)
      .fromTo(".d-mn", { opacity: 1 }, { opacity: 0, duration: 0.5, ease: "power1.in" }, 10.0);
    for (const p of legParts) if (p.to) tl.fromTo(p.el, { morphSVG: p.from }, { morphSVG: p.to, duration: MORPH[1] - MORPH[0], ease: "power2.inOut" }, MORPH[0]);
    camTo("vnc", "neuron", 8.0, 1.7);
    camTo("neuron", "drift", 9.7, 0.8, "none");
    PARTS.forEach((_, i) => {
      const at = [8.3, 9.0, 9.7][i];
      tl.fromTo(partLabels[i], { autoAlpha: 0, x: -6 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out" }, at)
        .fromTo(lead[i], { k: 0 }, { k: 1, duration: 0.35, ease: "power2.out" }, at + 0.12);
    });
    // O 10.5–14: to the viewer's opening view; the break mark leaves with the paper; black; the
    // mutant's neuron; the images
    tl.fromTo([...partLabels, ...leaders, ...arrows], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25 }, 10.4)
      .fromTo(".d-break", { opacity: 1 }, { opacity: 0, duration: 0.4 }, 10.5)
      .fromTo(".bg-black", { opacity: 0 }, { opacity: 1, duration: 0.8 }, 10.5);
    camTo("drift", "viewer", 10.5, 1.0);
    tl.fromTo(frameEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power1.out" }, 12.4)
      .fromTo(".d-mutant", { opacity: 0, x: L.shift + 70 }, { opacity: 1, x: L.shift, duration: 0.8, ease: "power2.out" }, 12.4)
      .fromTo(".descent__field canvas", { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power1.inOut" }, 12.7)
      .fromTo([".nrn", ".nmj-ctx"], { opacity: 1 }, { opacity: 0, duration: 0.6, ease: "power1.inOut" }, 13.3)
      .fromTo(".descent__controls", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 13.5)
      .to({}, { duration: 0.01 }, DUR - 0.01);
    tl.progress(p);
    draw();
  }

  // ---------- every frame, from the timeline's time ----------
  const toScreen = (x, y) => {
    const h = Math.exp(cam.lh), w = h * L.aspect;
    return [(x - (cam.cx - w / 2)) * L.sw / w, (y - (cam.cy - h / 2)) * L.sh / h];
  };
  // a label at screen point [x, y] (`side`: the text ends there, or sits centred above it) with an
  // arrow drawn `k` of the way from the text to the anchor [ax, ay]
  function pointer(el, leader, arrow, k, side, [x, y], [ax, ay]) {
    const w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = `${(side === "left" ? x - w : x - w / 2).toFixed(1)}px`;
    el.style.top = `${(side === "left" ? y - h / 2 : y - h).toFixed(1)}px`;
    const sx = side === "left" ? x + 6 : x, sy = side === "left" ? y : y + 4;
    const len = Math.hypot(ax - sx, ay - sy) || 1;
    const ux = (ax - sx) / len, uy = (ay - sy) / len;
    const tip = Math.max(0, len - 2);
    const ex = sx + ux * tip * k, ey = sy + uy * tip * k;
    leader.setAttribute("d", k > 0 ? `M${sx.toFixed(1)},${sy.toFixed(1)} L${(ex - ux * 6 * k).toFixed(1)},${(ey - uy * 6 * k).toFixed(1)}` : "");
    const hs = Math.min(1, Math.max(0, (k - 0.6) / 0.4));
    const bx = ex - ux * 8 * hs, by = ey - uy * 8 * hs, nx = -uy * 3.6 * hs, ny = ux * 3.6 * hs;
    arrow.setAttribute("d", hs > 0 ? `M${ex.toFixed(1)},${ey.toFixed(1)} L${(bx + nx).toFixed(1)},${(by + ny).toFixed(1)} L${(bx - nx).toFixed(1)},${(by - ny).toFixed(1)} Z` : "");
  }

  // the axon: the long path morphing into the short one, drawn out to `grow.axon` of its length
  function axonPoints(u) {
    return longPath.map((p, i) => lerp2(p, shortPath[i], u));
  }
  function drawAxon(pts, g) {
    let total = 0;
    const seg = pts.map((p, i) => (i ? (total += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])) : 0));
    const reach = g * total;
    let d = "";
    for (let i = 0; i < pts.length; i++) {
      if (seg[i] <= reach) d += (i ? "L" : "M") + pts[i][0].toFixed(2) + "," + pts[i][1].toFixed(2);
      else {
        const f = (reach - seg[i - 1]) / (seg[i] - seg[i - 1] || 1);
        const q = lerp2(pts[i - 1], pts[i], f);
        d += "L" + q[0].toFixed(2) + "," + q[1].toFixed(2);
        break;
      }
    }
    axonEl.setAttribute("d", g > 0 ? d : "");
  }
  // the synaptic terminals: about the first branch, enlarged and turned to the fly's femur, settling
  // to the viewer's size and place
  function termTransform(u) {
    const w = T.world, at = lerp2(w.at, fbV, u), k = lerp(w.k, 1, u), rot = lerp(w.rot, 0, u);
    return { at, k, rot };
  }

  let capKey = -1, lastSeed = 0;
  function draw() {
    if (!tl || !L) return;
    const t = tl.time();
    const h = Math.exp(cam.lh), w = h * L.aspect;
    svg.setAttribute("viewBox", `${(cam.cx - w / 2).toFixed(2)} ${(cam.cy - h / 2).toFixed(3)} ${w.toFixed(3)} ${h.toFixed(3)}`);
    const px = w / L.sw;   // µm per screen pixel
    svg.style.setProperty("--px", px.toFixed(5));

    // the fly: position (plus the hand-off from step 1), its turn from head-up, see-through washes
    const fx = fly.x + hand.dx * px, fy = fly.y + hand.dy * px;
    flyG.setAttribute("transform", `translate(${fx.toFixed(2)} ${fy.toFixed(2)}) rotate(${fly.rot.toFixed(2)}) scale(${(FLY_K * hand.s).toFixed(4)})`);
    flyG.style.setProperty("--fly-wash", `color-mix(in srgb, var(--wash-body) ${look.wash.toFixed(1)}%, transparent)`);
    flyG.style.setProperty("--fly-eye", `color-mix(in srgb, var(--wash-eye) ${look.wash.toFixed(1)}%, transparent)`);
    flyG.style.setProperty("--fly-wing", `color-mix(in srgb, var(--wash-wing) ${look.wash.toFixed(1)}%, transparent)`);
    flyG.style.setProperty("--fly-ink", `color-mix(in srgb, var(--ink) ${look.ink.toFixed(1)}%, transparent)`);
    flyG.style.display = look.ink <= 0.01 ? "none" : "";
    const want = t >= 1.4 ? "turned" : "side";
    if (want !== order) { flyG.append(...(want === "turned" ? turnOrder : sideOrder)); order = want; }
    if (t < 1.9 && !still) {
      flyG.setAttribute("filter", "url(#descent-boil)");
      disp.setAttribute("scale", (1.3 * px / FLY_K).toFixed(3));
      const seed = frozen != null ? 3 : [3, 8, 13][Math.floor(performance.now() / (1000 / 12)) % 3];
      if (seed !== lastSeed) { turb.setAttribute("seed", seed); lastSeed = seed; }
    } else flyG.removeAttribute("filter");

    // the motor neuron: the axon, the cell body (never smaller than a few pixels), the terminals and the break mark
    const u = morph.u;
    const pts = axonPoints(u);
    drawAxon(pts, grow.axon);
    const sc = lerp2(N.soma, soma1, u);
    somaEl.setAttribute("cx", sc[0].toFixed(2));
    somaEl.setAttribute("cy", sc[1].toFixed(2));
    somaEl.setAttribute("r", Math.max(lerp(N.soma_r, 8.5, u), 3.2 * px).toFixed(2));
    const tt = termTransform(u);
    termEl.setAttribute("transform", `translate(${tt.at[0].toFixed(2)} ${tt.at[1].toFixed(2)}) rotate(${tt.rot.toFixed(2)}) scale(${tt.k.toFixed(4)})`);
    termEl.style.setProperty("--tk", tt.k.toFixed(4));
    const bm = pts[nerveMid], bn = pts[nerveMid + 1];
    const ang = Math.atan2(bn[1] - bm[1], bn[0] - bm[0]) * 180 / Math.PI;
    breakEl.setAttribute("transform", `translate(${bm[0].toFixed(2)} ${bm[1].toFixed(2)}) rotate(${(ang - 90).toFixed(1)}) scale(${px.toFixed(4)})`);

    // labels follow their anchors on screen
    const [lx, ly] = toScreen(fx + 1700 * hand.s, fy - 250 * hand.s);
    flyLabel.style.transform = `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px) translate(0, -50%)`;
    const anchors = [[sc[0] - lerp(N.soma_r, 8.5, u), sc[1]], pts[axonAnchor], (() => {
      const q = T.swellings.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a)), c = [q[0], q[1]], r = tt.rot * Math.PI / 180;
      return [tt.at[0] + tt.k * (c[0] * Math.cos(r) - c[1] * Math.sin(r)), tt.at[1] + tt.k * (c[0] * Math.sin(r) + c[1] * Math.cos(r))];
    })()];
    PARTS.forEach((_, i) => pointer(partLabels[i], leaders[i], arrows[i], lead[i].k, "left",
      toScreen(LABEL_AT[i][0] + AT.x, LABEL_AT[i][1] + AT.y), toScreen(...anchors[i])));
    const vTop = A.vnc.neuromeres.T2;
    pointer(regionLabel, rLeader, rArrow, rlead.k, "above", toScreen(vTop[0] - 40, vTop[1] - 230), toScreen(vTop[0] - 20, vTop[1] - 80));

    // caption and the dark stage
    let k = 0;
    CAPTIONS.forEach(([at], i) => { if (t >= at) k = i; });
    if (still) k = CAPTIONS.findIndex(([at]) => at === 8.3);
    if (k !== capKey) {
      capKey = k;
      capEl.textContent = CAPTIONS[k][1];
      if (frozen == null && !still) gsap.fromTo(capEl, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.5, ease: "power2.out" });
    }
    stage.classList.toggle("is-dark", t >= 8.4);
  }

  // ---------- scroll, frozen review frames, reduced motion (as in the other descents) ----------
  let st = null, smooth = null;
  const pinnedAt = q => window.scrollY + section.getBoundingClientRect().top + q * (section.offsetHeight - window.innerHeight);
  if (still) {
    section.classList.add("is-still");
    build();
    tl.time(STILL_T);
    draw();
    gsap.set($(".descent__controls"), { autoAlpha: 1 });
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
    // hand-off from step 1: the fly grows out of where it stood on the vial's wall
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

  // the matched swap: step 3's viewer grows out of this frame
  root.querySelector("[data-act=next]").addEventListener("click", () => handOff("viewer", frameEl));
  window.__descent = { get tl() { return tl; }, cam, hand, handRect };   // for review tooling

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
