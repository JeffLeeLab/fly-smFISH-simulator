// The microscope viewer: PixiJS v8 + pixi-viewport, drawn live from the generated data.
// Split view (control | mutant) with linked pan and zoom, or flicker (one field, F switches
// genotype in place). World units are µm, so the scale bar is exact for spots and granules.
//
// Layers per genotype, back to front, all additive like fluorescence:
//   autofluorescence → blue channel (membrane + DAPI) → TDP-43 IF (image, then granules) → smFISH 1 → smFISH 2
// Grain sits on top in screen space. Green + magenta sum to white on molecules carrying both.
// smFISH 1, smFISH 2 and TDP-43 are each a LUT layer, as in an imaging program: their contents
// are drawn untinted and added up inside the layer, where light stops at full intensity, and the
// layer is then coloured with the channel's LUT. So stacked spots saturate at the channel's
// colour and never drift towards white; only different channels mix.
// Every animal has its own neurons: the membrane, DAPI and TDP-43 images (diffuse nuclear and
// cytoplasmic signal, and the mutant's aggregates) are rendered by the generator
// (generator/render.py) from that animal's geometry; spots and TDP-43 transport granules are
// drawn live from the molecule data, so they stay sharp at any zoom.

import { Application, CanvasSource, Container, Filter, GlProgram, ImageSource, Rectangle, Sprite, Texture, TilingSprite, UniformGroup, defaultFilterVert } from "pixi.js";
import { Viewport } from "pixi-viewport";
import { loadJSON } from "../data.js";
import { copyCanvas } from "../export.js";
import { CASES } from "../content.js";
import { term } from "../glossary.js";
import { autofluorescence, gaussianCanvas, grainCanvas } from "./textures.js";

const TDP_DIM = 0.4;           // TDP-43 while an smFISH channel is on, so a spot on it doesn't sum to a false white
const GRANULE_DIM = 0.55;      // granules are faint already: dimmed less, so a spot inside one still shows (no whiter than over a nucleus)
const MAX_SCALE = 60;          // px per µm
const SCALE_STEPS = [0.5, 1, 2, 5, 10, 20, 50];
const GENOTYPES = ["control", "mutant"];
export const GENOTYPE_LABEL = { control: "hTDP-43 WT", mutant: "hTDP-43 mutant" };

export const TDP_LUTS = {
  "red-orange": { label: "Red-orange", color: "#FF4B3A" },
  yellow: { label: "Yellow", color: "#FFD63C" },
  cyan: { label: "Cyan", color: "#3CDCFF" },
};
export const FISH_LUT = { ch1: { color: "#46E66E", name: "Green" }, ch2: { color: "#EB46E1", name: "Magenta" } };
const BLUE = { membrane: "#5F78C0", dapi: "#5A78EB" };

const hex = c => parseInt(c.slice(1), 16);
const rgb = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) / 255);

// A channel's display: intensity (the brightest component of the untinted layer, already clamped
// at 1) times the display gain, clamped again, times the LUT colour; added to what lies below.
const LUT_FRAG = `
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec3 uColor;
uniform float uGain;

void main()
{
    vec4 c = texture(uTexture, vTextureCoord);
    float i = min(1.0, max(max(c.r, c.g), c.b) * uGain);
    finalColor = vec4(uColor * i, i);
}
`;

function lutLayer(frame) {
  const layer = new Container();
  const filter = new Filter({
    glProgram: GlProgram.from({ vertex: defaultFilterVert, fragment: LUT_FRAG, name: "lut-layer" }),
    resources: { lut: new UniformGroup({ uColor: { value: new Float32Array(3), type: "vec3<f32>" }, uGain: { value: 1, type: "f32" } }) },
    blendMode: "add",
    resolution: "inherit",
  });
  layer.filters = [filter];
  layer.filterArea = new Rectangle(frame[0], frame[1], frame[2] - frame[0], frame[3] - frame[1]);  // skips a bounds pass
  layer.lut = filter.resources.lut.uniforms;
  return layer;
}

function setLut(layer, color, gain = 1) {
  layer.lut.uColor.set(rgb(color));
  layer.lut.uGain = gain;
}
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function texture(canvas) {
  return new Texture({ source: new CanvasSource({ resource: canvas }) });
}

function imageSprite(img, tint, alpha) {
  const s = new Sprite(texture(img.canvas || img));
  s.position.set(img.x0, img.y0);
  s.scale.set(1 / img.res);
  s.tint = hex(tint);
  s.alpha = alpha;
  s.blendMode = "add";
  return s;
}

async function loadImage(url) {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

// A sprite showing one of the generator's images over the case frame (µm).
function frameSprite(tint, alpha) {
  const s = new Sprite(Texture.EMPTY);
  s.tint = hex(tint);
  s.alpha = alpha;
  s.blendMode = "add";
  return s;
}

function setImage(sprite, img, frame) {
  const old = sprite.texture;
  sprite.texture = new Texture({ source: new ImageSource({ resource: img, autoGenerateMipmaps: true }) });
  if (old && old !== Texture.EMPTY) old.destroy(true);
  sprite.position.set(frame[0], frame[1]);
  sprite.scale.set((frame[2] - frame[0]) / img.naturalWidth);
}

export async function createViewer(root, opts) {
  const { caseId, mode, pair = null, regionIds = [] } = opts;
  const { anatomy, display } = CASES[caseId];
  const { spotSigmaUm: SIGMA_UM, minSigmaPx: MIN_SIGMA_PX, spotGain: SPOT_GAIN } = display;
  const firstAnimal = opts.animal || 1;
  const geometryOf = n => Promise.all(GENOTYPES.map(g => loadJSON(`data/${caseId}/geometry-${g}-${n}.json`)));
  const firstGeoms = await geometryOf(firstAnimal);
  const frame = firstGeoms[0].frame;  // one frame for every animal of the case
  const [bx0, by0, bx1, by1] = frame;
  // fly-to boxes for an animal: the union of its control and mutant boxes, so both fields fit
  function viewsFor(geoms) {
    const out = {};
    for (const k of Object.keys(geoms[0].views)) {
      const bs = geoms.map(g => g.views[k]);
      out[k] = [Math.min(...bs.map(b => b[0])), Math.min(...bs.map(b => b[1])), Math.max(...bs.map(b => b[2])), Math.max(...bs.map(b => b[3]))];
    }
    const bounds = geoms.map(g => g.bounds);
    out.whole = [Math.min(...bounds.map(b => b[0])), Math.min(...bounds.map(b => b[1])), Math.max(...bounds.map(b => b[2])), Math.max(...bounds.map(b => b[3]))];
    return out;
  }
  let views = viewsFor(firstGeoms);
  const bitOf = id => regionIds.indexOf(id);

  const state = {
    layout: "split",
    flicker: "control",
    animal: firstAnimal,
    visible: { blue: true, tdp: true, ch1: mode === "results", ch2: mode === "results" },
    tdpLut: opts.tdpLut || "red-orange",
    tdpBrightness: opts.tdpBrightness ?? 1,
    solo: null,
  };
  const listeners = new Set();
  const emit = () => listeners.forEach(fn => fn(state));

  // ---------- DOM ----------
  root.classList.add("viewer");
  root.innerHTML = `
    <div class="viewer__tools" role="toolbar" aria-label="Viewer">
      <span class="viewer__group" role="group" aria-label="Fly to">
        ${[["whole", anatomy.whole], ...anatomy.flyTo]
          .map(([k, l]) => `<button type="button" class="vbtn" data-fly="${k}">${l}</button>`).join("")}
      </span>
      <span class="viewer__sep" aria-hidden="true"></span>
      <span class="vseg" role="group" aria-label="Compare genotypes">
        <button type="button" class="vbtn" data-layout="split" aria-pressed="true">Split</button><button type="button" class="vbtn" data-layout="flicker" aria-pressed="false">Flicker</button>
      </span>
      <button type="button" class="vbtn" data-act="flip" hidden>Switch genotype <kbd>F</kbd></button>
      <span class="viewer__spacer"></span>
      <button type="button" class="vbtn" data-act="png">Copy as PNG</button>
    </div>
    <div class="viewer__fields" data-layout="split">
      ${GENOTYPES.map((g, i) => `
        <div class="viewer__field" data-field="${i}">
          <p class="viewer__overlay" aria-live="polite"></p>
          <p class="viewer__note viewer__loading">Loading simulated images…</p>
          <div class="viewer__scale" aria-hidden="true"><i></i><span></span></div>
        </div>`).join("")}
    </div>
    ${mode === "results" && pair ? `<p class="viewer__legend"></p>` : ""}
    <div class="viewer__bar"><span class="viewer__hint"><button type="button" class="viewer__tour" data-act="tour">Viewer tour</button> · Drag to pan · scroll or pinch to zoom</span><span class="proj">${anatomy.projection.replace("maximum-intensity projection", term("mip", "maximum-intensity projection"))}</span></div>`;

  const fieldEls = [...root.querySelectorAll(".viewer__field")];
  const fieldsBox = root.querySelector(".viewer__fields");

  // ---------- one PixiJS application per field ----------
  const gaussCanvas = gaussianCanvas(64);
  const grain = grainCanvas(256, 7);
  const auto = autofluorescence([bx0 - 150, by0 - 150, bx1 + 150, by1 + 150], 0.5, 11);  // reaches past any view, so no edge shows

  async function makeField(el, index) {
    const app = new Application();
    await app.init({
      resizeTo: el,
      background: "#000000",
      preference: "webgl",
      antialias: false,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      preserveDrawingBuffer: false,
    });
    app.canvas.classList.add("viewer__canvas");
    app.canvas.setAttribute("aria-label", "Simulated confocal image");
    app.canvas.tabIndex = 0;
    el.prepend(app.canvas);

    const vp = new Viewport({
      screenWidth: app.screen.width,
      screenHeight: app.screen.height,
      worldWidth: bx1 - bx0,
      worldHeight: by1 - by0,
      events: app.renderer.events,
      passiveWheel: false,
    });
    vp.drag().pinch().wheel({ smooth: 4 }).decelerate({ friction: 0.92 });
    app.stage.addChild(vp);
    // pixi-viewport assumes the world starts at 0,0: shift the µm coordinates so the bounds do
    const content = new Container();
    content.position.set(-bx0, -by0);
    vp.addChild(content);

    const gauss = texture(gaussCanvas);
    const worlds = {};
    for (const g of GENOTYPES) {
      const w = new Container();
      const af = imageSprite(auto, "#8C9A9E", 0.05);
      const blueC = new Container();
      const membrane = frameSprite(BLUE.membrane, 1.0);
      const dapi = frameSprite(BLUE.dapi, 0.9);
      blueC.addChild(membrane, dapi);
      const tdp = lutLayer(frame);
      const tdpNuclear = frameSprite("#FFFFFF", 1.0);
      const granules = new Container();
      tdp.addChild(tdpNuclear, granules);
      const ch1 = lutLayer(frame), ch2 = lutLayer(frame);
      const spots = { ch1: new Container(), ch2: new Container() };  // inside the layers, so their dimming comes before the clamp
      ch1.addChild(spots.ch1);
      ch2.addChild(spots.ch2);
      w.addChild(af, blueC, tdp, ch1, ch2);
      w.visible = false;
      content.addChild(w);
      worlds[g] = { root: w, blue: blueC, membrane, dapi, tdp, tdpNuclear, granules, ch1, ch2, spots };
    }
    const grainSprite = new TilingSprite({ texture: texture(grain), width: app.screen.width, height: app.screen.height });
    grainSprite.blendMode = "add";
    grainSprite.alpha = 0.07;
    app.stage.addChild(grainSprite);

    const field = { el, index, app, vp, worlds, gauss, grainSprite, shown: GENOTYPES[index] };
    app.renderer.on("resize", () => onResize(field));
    return field;
  }

  const fields = [];
  for (let i = 0; i < 2; i++) fields.push(await makeField(fieldEls[i], i));

  // ---------- data for the current animal ----------
  async function loadAnimal(n) {
    root.dataset.loading = "true";
    const [geoms, data, images] = await Promise.all([
      geometryOf(n),
      Promise.all(GENOTYPES.map(g => loadJSON(`data/${caseId}/molecules/${g}-${n}.json`))).then(ds => Object.fromEntries(GENOTYPES.map((g, i) => [g, ds[i]]))),
      Promise.all(GENOTYPES.flatMap(g => ["membrane", "dapi", "tdp43"].map(l => loadImage(`data/${caseId}/images/${g}-${n}-${l}.webp`))))
        .then(imgs => Object.fromEntries(GENOTYPES.map((g, i) => [g, { membrane: imgs[i * 3], dapi: imgs[i * 3 + 1], tdp43: imgs[i * 3 + 2] }]))),
    ]);
    views = viewsFor(geoms);
    for (const f of fields) {
      for (const g of GENOTYPES) {
        const w = f.worlds[g];
        const d = data[g];
        setImage(w.membrane, images[g].membrane, frame);
        setImage(w.dapi, images[g].dapi, frame);
        setImage(w.tdpNuclear, images[g].tdp43, frame);
        // TDP-43 transport granules, drawn live: soft, round, a little larger than a spot
        w.granules.removeChildren().forEach(c => c.destroy());
        for (const [x, y, r, peak] of d.tdp43.granules) {
          const s = new Sprite(f.gauss);
          s.anchor.set(0.5);
          s.position.set(x, y);
          s.sigmaUm = Math.max(SIGMA_UM, r * 0.75);
          s.peak = Math.min(1, peak);
          s.scale.set((6 * s.sigmaUm) / 64);
          s.alpha = s.peak;
          s.blendMode = "add";
          w.granules.addChild(s);
        }
        // smFISH spots
        for (const ch of ["ch1", "ch2"]) {
          w.spots[ch].removeChildren().forEach(c => c.destroy());
          if (mode !== "results" || !pair) continue;
          const bit = bitOf(pair[ch]);
          if (bit < 0) continue;
          for (let i = 0; i < d.m.length; i++) {
            if (!((d.m[i] >> bit) & 1)) continue;
            const s = new Sprite(f.gauss);
            s.anchor.set(0.5);
            s.position.set(d.x[i], d.y[i]);
            s.alpha = Math.min(1, SPOT_GAIN * d.i[i]);
            s.blendMode = "add";
            w.spots[ch].addChild(s);
          }
        }
      }
    }
    applyStyle();
    fields.forEach(updateZoomDependent);
    root.querySelectorAll(".viewer__loading").forEach(n => n.remove());
    delete root.dataset.loading;
  }

  // ---------- appearance ----------
  function applyStyle() {
    const v = state.visible;
    const anyFish = v.ch1 || v.ch2;
    const tdpColor = TDP_LUTS[state.tdpLut].color;
    for (const f of fields) {
      for (const g of GENOTYPES) {
        const w = f.worlds[g];
        w.blue.visible = v.blue;
        // the blue channel stays dim behind spots, so it never competes with them
        w.membrane.alpha = anyFish ? 0.5 : 0.78;
        w.dapi.alpha = anyFish ? 0.55 : 0.85;
        // brightness and the smFISH dimming act before the clamp; above full scale they become the layer's display gain
        const img = state.tdpBrightness * (anyFish ? TDP_DIM : 1), gr = state.tdpBrightness * (anyFish ? GRANULE_DIM : 1);
        const gain = Math.max(1, img, gr);
        w.tdp.visible = v.tdp;
        w.tdpNuclear.alpha = img / gain;
        w.granules.alpha = gr / gain;
        setLut(w.tdp, tdpColor, gain);
        w.ch1.visible = v.ch1;
        w.ch2.visible = v.ch2;
        setLut(w.ch1, FISH_LUT.ch1.color);
        setLut(w.ch2, FISH_LUT.ch2.color);
      }
    }
    labelFields();
  }

  function labelFields() {
    fields.forEach(f => {
      const g = f.shown;
      const probes = mode === "results" && pair
        ? `<span class="d" style="--c:${FISH_LUT.ch1.color}"></span>${pair.ch1} · <span class="d" style="--c:${FISH_LUT.ch2.color}"></span>${pair.ch2} · `
        : `<span class="d" style="--c:${TDP_LUTS[state.tdpLut].color}"></span>TDP-43 IF · `;
      f.el.querySelector(".viewer__overlay").innerHTML =
        `${probes}${GENOTYPE_LABEL[g]} · animal ${state.animal} · simulated`;
    });
    const legend = root.querySelector(".viewer__legend");
    if (legend && pair) {
      const a = pair.ch1, b = pair.ch2;
      legend.innerHTML = `White: carries ${a} and ${b} · ${FISH_LUT.ch1.name} only: ${a} without ${b} · ${FISH_LUT.ch2.name} only: ${b} without ${a} · Bright nuclear spots: ${term("ts", "transcription sites")}`;
    }
  }

  // Spots shrink below a pixel when zoomed out: draw them at least MIN_SIGMA_PX wide and dim
  // them by the same area factor, so the total light (and dense regions' glow) is conserved.
  function updateZoomDependent(f) {
    const s = f.vp.scale.x;
    const sigmaPx = SIGMA_UM * s;
    const k = Math.max(1, MIN_SIGMA_PX / sigmaPx);
    const size = (6 * SIGMA_UM * k) / 64;
    for (const g of GENOTYPES) {
      for (const ch of ["ch1", "ch2"]) {
        const c = f.worlds[g].spots[ch];
        c.alpha = 1 / (k * k);
        c.children.forEach(sp => sp.scale.set(size));
      }
      // TDP-43 granules: the same conserved-light rule, each at its own size
      for (const sp of f.worlds[g].granules.children) {
        const kg = Math.max(1, MIN_SIGMA_PX / (sp.sigmaUm * s));
        sp.scale.set((6 * sp.sigmaUm * kg) / 64);
        sp.alpha = sp.peak / (kg * kg);
      }
    }
    // live scale bar: the smallest round length that spans at least 80 px
    const len = SCALE_STEPS.find(L => L * s >= 80) ?? SCALE_STEPS[SCALE_STEPS.length - 1];
    const bar = f.el.querySelector(".viewer__scale");
    bar.querySelector("i").style.width = `${Math.round(len * s)}px`;
    bar.querySelector("span").textContent = `${len} µm`;
    f.scaleLen = len;
  }

  function showWorlds() {
    fields.forEach((f, i) => {
      f.shown = state.layout === "split" ? GENOTYPES[i] : state.flicker;
      for (const g of GENOTYPES) f.worlds[g].root.visible = g === f.shown;
    });
    labelFields();
  }

  // ---------- navigation ----------
  function fitScale(f, [x0, y0, x1, y1]) {
    return Math.min(f.app.screen.width / (x1 - x0), f.app.screen.height / (y1 - y0));
  }

  // What the student is looking at (world units, viewport coordinates). When a field changes size
  // (the plot drawer opening, a window resize, split ↔ flicker), this is fitted again, so the
  // picture rescales instead of being cropped. Set by fly-to, panning, zooming and the keys.
  let aim = null, resizing = false;
  const look = f => ({ cx: f.vp.center.x, cy: f.vp.center.y, w: f.app.screen.width / f.vp.scale.x, h: f.app.screen.height / f.vp.scale.x });

  function onResize(f) {
    resizing = true;
    const { width: w, height: h } = f.app.screen;
    f.vp.resize(w, h);
    f.grainSprite.width = w;
    f.grainSprite.height = h;
    const min = fitScale(f, views.whole) * 0.92;
    f.vp.clampZoom({ minScale: min, maxScale: MAX_SCALE });
    const m = 30;
    f.vp.clamp({ left: -m, right: bx1 - bx0 + m, top: -m, bottom: by1 - by0 + m, underflow: "center" });
    if (aim && w > 1 && h > 1) {
      f.vp.setZoom(Math.min(MAX_SCALE, Math.max(min, Math.min(w / aim.w, h / aim.h))), true);
      f.vp.moveCenter(aim.cx, aim.cy);
    }
    updateZoomDependent(f);
    f.app.render();   // a resized canvas is blank until drawn: draw now, before the page paints
    resizing = false;
  }

  let syncing = false;
  function syncFrom(src) {
    if (syncing) return;
    syncing = true;
    for (const f of fields) {
      if (f === src) continue;
      f.vp.scale.set(src.vp.scale.x);
      f.vp.moveCenter(src.vp.center.x, src.vp.center.y);
      updateZoomDependent(f);
    }
    syncing = false;
  }

  function flyTo(name, { animate = true } = {}) {
    const box = views[name];
    if (!box) return;
    const f0 = fields[0];
    const scale = Math.min(MAX_SCALE, fitScale(f0, box) * (name === "whole" ? 0.92 : 0.9));
    const cx = (box[0] + box[2]) / 2 - bx0, cy = (box[1] + box[3]) / 2 - by0;  // viewport coordinates
    const pad = name === "whole" ? 0.92 : 0.9;
    aim = { cx, cy, w: (box[2] - box[0]) / pad, h: (box[3] - box[1]) / pad };
    for (const f of fields) {
      if (animate && !reduceMotion()) {
        f.vp.animate({ position: { x: cx, y: cy }, scale, time: 650, ease: "easeInOutSine", removeOnInterrupt: true });
      } else {
        f.vp.setZoom(scale, true);
        f.vp.moveCenter(cx, cy);
        updateZoomDependent(f);
      }
    }
  }

  for (const f of fields) {
    onResize(f);
    const on = () => { updateZoomDependent(f); syncFrom(f); if (!resizing && f.app.screen.width > 1) aim = look(f); };
    f.vp.on("moved", on);
    f.vp.on("zoomed", on);
  }

  // Layout changes resize the field elements without a window resize: watch them.
  const ro = new ResizeObserver(() => fields.forEach(f => f.app.resize()));
  fieldEls.forEach(el => ro.observe(el));

  function setLayout(layout) {
    state.layout = layout;
    fieldsBox.dataset.layout = layout;
    root.querySelectorAll("[data-layout]").forEach(b => { if (b.tagName === "BUTTON") b.setAttribute("aria-pressed", String(b.dataset.layout === layout)); });
    root.querySelector("[data-act=flip]").hidden = layout !== "flicker";
    showWorlds();
    requestAnimationFrame(() => { fields.forEach(f => f.app.resize()); syncFrom(fields[0]); });
    emit();
  }

  function flip() {
    if (state.layout !== "flicker") setLayout("flicker");
    else {
      state.flicker = state.flicker === "control" ? "mutant" : "control";
      showWorlds();
      emit();
    }
  }

  // ---------- controls ----------
  root.querySelector("[data-act=tour]").addEventListener("click", () => root.dispatchEvent(new CustomEvent("viewer-tour")));
  root.querySelector(".viewer__tools").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.fly) flyTo(b.dataset.fly);
    else if (b.dataset.layout) setLayout(b.dataset.layout);
    else if (b.dataset.act === "flip") flip();
    else if (b.dataset.act === "png") copyPNG(b);
  });

  const onKey = e => {
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (e.key === "f" || e.key === "F") { e.preventDefault(); flip(); }
    if (document.activeElement?.classList.contains("viewer__canvas")) {
      const f = fields.find(x => x.app.canvas === document.activeElement) || fields[0];
      const step = 40 / f.vp.scale.x;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[e.key]) { e.preventDefault(); f.vp.moveCenter(f.vp.center.x + moves[e.key][0], f.vp.center.y + moves[e.key][1]); updateZoomDependent(f); syncFrom(f); aim = look(f); }
      if (e.key === "+" || e.key === "=" || e.key === "-") {
        e.preventDefault();
        f.vp.setZoom(f.vp.scale.x * (e.key === "-" ? 1 / 1.25 : 1.25), true);
        updateZoomDependent(f); syncFrom(f); aim = look(f);
      }
    }
  };
  document.addEventListener("keydown", onKey);

  // ---------- PNG export at slide resolution, overlay burned in ----------
  async function exportCanvas() {
    const shown = state.layout === "split" ? fields : [fields[0]];
    const gap = 12;
    const targetW = 1920;
    const fw = shown[0].app.screen.width, fh = shown[0].app.screen.height;
    const scale = (targetW - gap * (shown.length - 1)) / (fw * shown.length);
    const out = document.createElement("canvas");
    out.width = targetW;
    out.height = Math.round(fh * scale);
    const g = out.getContext("2d");
    g.fillStyle = "#000";
    g.fillRect(0, 0, out.width, out.height);
    shown.forEach((f, i) => {
      const c = f.app.renderer.extract.canvas({ target: f.app.stage, resolution: scale, frame: f.app.screen.clone(), clearColor: "#000000" });
      const ox = i * (fw * scale + gap);
      g.drawImage(c, ox, 0, fw * scale, fh * scale);
      // overlay: same text as on screen, scaled for a slide
      const px = Math.round(11 * scale * 1.15);
      g.font = `${px}px "IBM Plex Mono", ui-monospace, monospace`;
      g.textBaseline = "top";
      g.shadowColor = "#000";
      g.shadowBlur = 3 * scale;
      const text = f.el.querySelector(".viewer__overlay").textContent;
      let x = ox + 8 * scale, y = 6 * scale;
      if (mode === "results" && pair) {
        for (const [ch, label] of [["ch1", pair.ch1], ["ch2", pair.ch2]]) {
          g.fillStyle = FISH_LUT[ch].color;
          g.beginPath(); g.arc(x + px * 0.35, y + px * 0.55, px * 0.32, 0, Math.PI * 2); g.fill();
          x += px * 0.9;
          g.fillStyle = "#E8E6DC";
          g.fillText(`${label} · `, x, y);
          x += g.measureText(`${label} · `).width;
        }
        g.fillText(text.split(" · ").slice(2).join(" · "), x, y);
      } else {
        g.fillStyle = "#E8E6DC";
        g.fillText(text, x, y);
      }
      // scale bar
      const len = f.scaleLen;
      const barPx = len * f.vp.scale.x * scale;
      const bx = ox + fw * scale - 12 * scale - barPx, by = fh * scale - 14 * scale;
      g.fillStyle = "#E8E6DC";
      g.fillRect(bx, by, barPx, 3 * scale);
      g.textAlign = "center";
      g.textBaseline = "bottom";
      g.fillText(`${len} µm`, bx + barPx / 2, by - 3 * scale);
      g.textAlign = "left";
    });
    return out;
  }

  async function copyPNG(button) {
    const c = await exportCanvas();
    await copyCanvas(c, `smFISH-${caseId}-${mode}-animal${state.animal}.png`, button);
  }

  // ---------- start ----------
  showWorlds();
  await loadAnimal(state.animal);
  flyTo(opts.view || "whole", { animate: false });
  root.dataset.ready = "true";

  return {
    state,
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    async setAnimal(n) { state.animal = n; await loadAnimal(n); emit(); },
    setVisible(ch, on) { state.visible[ch] = on; state.solo = null; applyStyle(); emit(); },
    solo(ch) {
      if (state.solo === ch) { state.visible = { ...state.beforeSolo }; state.solo = null; }
      else {
        if (!state.solo) state.beforeSolo = { ...state.visible };
        state.solo = ch;
        for (const k of Object.keys(state.visible)) state.visible[k] = k === ch && (mode === "results" || !k.startsWith("ch"));
      }
      applyStyle(); emit();
    },
    setTdpLut(name) { state.tdpLut = name; applyStyle(); emit(); },
    setTdpBrightness(v) { state.tdpBrightness = v; applyStyle(); emit(); },
    flyTo,
    setLayout,
    flip,
    exportCanvas,
    destroy() {
      document.removeEventListener("keydown", onKey);
      ro.disconnect();
      fields.forEach(f => f.app.destroy(true, { children: true, texture: true }));
    },
  };
}
