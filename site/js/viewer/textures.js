// Small textures drawn in the browser on 2D canvases: the Gaussian spot, faint tissue
// autofluorescence and detector grain. The membrane, DAPI and TDP-43 nuclear images are
// rendered by the generator (generator/render.py) and loaded as files.

import { mulberry32 } from "../prng.js";

const canvas = (w, h) => {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

// A 2D Gaussian covering ±3σ: one molecule's point spread function. White; tinted per channel.
export function gaussianCanvas(size = 64) {
  const c = canvas(size, size);
  const g = c.getContext("2d");
  const img = g.createImageData(size, size);
  const sigma = size / 6;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - size / 2, dy = y + 0.5 - size / 2;
      const v = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(255 * v);
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

// TDP-43 transport granules: soft bodies, flat-topped, a little irregular (smooth outlines from
// low harmonics, far gentler than the aggregates' lobes in the generator's image), with a faint
// mottle. White; the TDP-43 layer tints them. Seeded variants, so each granule always looks the
// same. The body's mean radius is GRANULE_BODY of the canvas half-width; the rest holds its edge.
export const GRANULE_BODY = 0.68;
export function granuleCanvases(n = 12, size = 128, seed = 4301) {
  const rand = mulberry32(seed);
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const out = [];
  for (let k = 0; k < n; k++) {
    const harmonics = [[2, 0.06, 0.06], [3, 0.03, 0.04], [4, 0.02, 0.02], [5, 0.015, 0.015]]
      .map(([m, lo, span]) => [m, lo + span * rand(), rand() * 2 * Math.PI]);
    const bumps = Array.from({ length: 5 }, () => [1.2 * rand() - 0.6, 1.2 * rand() - 0.6, 0.25 + 0.2 * rand(), 0.12 * rand() - 0.06]);
    const c = canvas(size, size);
    const g = c.getContext("2d");
    const img = g.createImageData(size, size);
    const R = GRANULE_BODY * size / 2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x + 0.5 - size / 2) / R, dy = (y + 0.5 - size / 2) / R;
        const th = Math.atan2(dy, dx);
        let edge = 1;
        for (const [m, a, ph] of harmonics) edge += a * Math.cos(m * th + ph);
        const t = Math.hypot(dx, dy) / edge;   // 1 at the body's edge
        let mottle = 1;
        for (const [bx, by, s, a] of bumps) mottle += a * Math.exp(-((dx - bx) ** 2 + (dy - by) ** 2) / (2 * s * s));
        const v = smooth(1.15, 0.85, t) * (0.88 + 0.12 * (1 - Math.min(1, t) ** 2)) * mottle;
        const i = (y * size + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = Math.round(255 * Math.min(1, Math.max(0, v)));
      }
    }
    g.putImageData(img, 0, 0);
    out.push(c);
  }
  return out;
}

// Smooth value noise in [lo, hi]: a coarse random grid, upscaled with bilinear smoothing.
function noiseCanvas(w, h, cellPx, rand, lo, hi) {
  const gw = Math.ceil(w / cellPx) + 2, gh = Math.ceil(h / cellPx) + 2;
  const small = canvas(gw, gh);
  const g = small.getContext("2d");
  const img = g.createImageData(gw, gh);
  for (let i = 0; i < gw * gh; i++) {
    const v = Math.round(255 * (lo + (hi - lo) * rand()));
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const big = canvas(w, h);
  const b = big.getContext("2d");
  b.imageSmoothingEnabled = true;
  b.imageSmoothingQuality = "high";
  b.drawImage(small, 0, 0, gw, gh, -cellPx, -cellPx, gw * cellPx, gh * cellPx);
  return big;
}

// Faint, uneven tissue autofluorescence over the whole field (world space).
export function autofluorescence(bounds, res, seed) {
  const [x0, y0, x1, y1] = bounds;
  const rand = mulberry32(seed);
  const w = (x1 - x0) * res, h = (y1 - y0) * res;
  return { canvas: noiseCanvas(w, h, 8 * res, rand, 0.0, 1.0), x0, y0, res };
}

// Detector grain (screen space): fine random speckle, tiled.
export function grainCanvas(size, seed) {
  const rand = mulberry32(seed);
  const c = canvas(size, size);
  const g = c.getContext("2d");
  const img = g.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = Math.round(255 * Math.pow(rand(), 3));
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}
