// Fly drawings (generator/flies.py, from the flybody model): one SVG sprite per view, each frame
// a <g id="fly-<view>-<sequence>-<k>"> in a shared coordinate frame with the thorax at 0,0.
// A fly on the page is an <svg> with the sprite's viewBox and one <use> whose href is swapped
// to play frames on twos (12 per second), in step with the ink boil.

const sprites = new Map();
let host = null;

export async function loadFlySprite(view) {
  if (!sprites.has(view)) {
    sprites.set(view, (async () => {
      const text = await (await fetch(`data/flies/fly-${view}.svg`)).text();
      if (!host) {
        host = document.createElement("div");
        host.className = "fly-sprites";
        host.setAttribute("aria-hidden", "true");
        document.body.append(host);
      }
      host.insertAdjacentHTML("beforeend", text);
      const svg = host.lastElementChild;
      return JSON.parse(svg.dataset.meta);
    })());
  }
  return sprites.get(view);
}

const NS = "http://www.w3.org/2000/svg";

// A fly as SVG markup to nest inside a scene: centred on its thorax at (x, y), `height` scene
// units tall for the sprite's full frame. Returns { el, use, meta, show(seq, k) }.
export function flyNode(meta, { x, y, height, className = "fly" }) {
  const [vx, vy, vw, vh] = meta.viewBox.split(" ").map(Number);
  const k = height / vh;
  const el = document.createElementNS(NS, "svg");
  el.setAttribute("class", className);
  el.setAttribute("viewBox", meta.viewBox);
  el.setAttribute("x", x + vx * k);
  el.setAttribute("y", y + vy * k);
  el.setAttribute("width", vw * k);
  el.setAttribute("height", vh * k);
  el.setAttribute("overflow", "visible");
  const use = document.createElementNS(NS, "use");
  use.setAttribute("filter", "url(#ink-boil)");
  el.append(use);
  let current = "";
  const show = (seq, f = 0) => {
    const n = meta.frames[seq] || 1;
    const id = `#fly-${meta.view}-${seq}-${((f % n) + n) % n}`;
    if (id !== current) { use.setAttribute("href", id); current = id; }
  };
  show("stand", 0);
  return { el, use, meta, show, scale: k };
}

// One grooming bout from t0 to t1 (seconds), on twos: the front legs rise (groom_in), rub for
// whole cycles (groom), then settle back to standing (groom_out). Time left over after the last
// whole cycle is spent standing, so every change of sequence joins matching drawings.
export function groomFrame(frames, t0, t1, t) {
  const k = Math.floor((t - t0) * 12);
  const nIn = frames.groom_in || 0, nOut = frames.groom_out || 0, cyc = frames.groom || 1;
  const loops = Math.max(0, Math.floor((Math.floor((t1 - t0) * 12) - nIn - nOut) / cyc)) * cyc;
  if (k < 0) return ["stand", 0];
  if (k < nIn) return ["groom_in", k];
  if (k < nIn + loops) return ["groom", (k - nIn) % cyc];
  if (k < nIn + loops + nOut) return ["groom_out", k - nIn - loops];
  return ["stand", 0];
}

// ---------- the ink boil: one filter, its noise reseeded 12 times a second ----------
// Three seeds in rotation, like redrawing the same line three times by hand. Paused with
// reduced motion. Texture stops at the data: only story artwork uses this filter. The
// displacement is in the fly drawings' units (about 0.65 screen px each in the hero), so the
// token's strength is scaled to give a wobble of about 1.4 px on screen.

let boilTimer = null;
let boilUsers = 0;

export function ensureBoilFilter() {
  if (document.getElementById("ink-boil")) return;
  const css = getComputedStyle(document.documentElement);
  const freq = css.getPropertyValue("--tex-ink-frequency").trim() || ".03";
  const scale = css.getPropertyValue("--tex-ink-displace").trim() || ".9";
  document.body.insertAdjacentHTML("beforeend", `
    <svg class="fly-sprites" aria-hidden="true" width="0" height="0">
      <filter id="ink-boil" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="3"/>
        <feDisplacementMap in="SourceGraphic" scale="${Number(scale) * 2.4}" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </svg>`);
}

export function startBoil() {
  ensureBoilFilter();
  boilUsers++;
  if (boilTimer || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const turb = document.querySelector("#ink-boil feTurbulence");
  const seeds = [3, 8, 13];
  let i = 0;
  boilTimer = setInterval(() => turb.setAttribute("seed", seeds[i++ % 3]), 1000 / 12);
}

export function stopBoil() {
  boilUsers = Math.max(0, boilUsers - 1);
  if (!boilUsers && boilTimer) { clearInterval(boilTimer); boilTimer = null; }
}
