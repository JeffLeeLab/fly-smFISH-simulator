// Textures for the microscope image, drawn once on 2D canvases (no canvas filters, which
// Safari lacks): the Gaussian spot, the membrane + DAPI image, TDP-43's nuclear signal,
// autofluorescence and detector grain. Realism comes from optics and noise, not detail.

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

// Blur without ctx.filter: downsample, then draw back up with smoothing (twice, for softness).
function blur(src, factor) {
  let cur = src;
  for (let pass = 0; pass < 2; pass++) {
    const small = canvas(cur.width / factor, cur.height / factor);
    const s = small.getContext("2d");
    s.imageSmoothingEnabled = true;
    s.imageSmoothingQuality = "high";
    s.drawImage(cur, 0, 0, small.width, small.height);
    const out = canvas(src.width, src.height);
    const o = out.getContext("2d");
    o.imageSmoothingEnabled = true;
    o.imageSmoothingQuality = "high";
    o.drawImage(small, 0, 0, out.width, out.height);
    cur = out;
  }
  return cur;
}

function multiPolygonPath(geom, toPx) {
  const p = new Path2D();
  for (const poly of geom.coordinates) {
    for (const ring of poly) {
      ring.forEach(([x, y], i) => {
        const [px, py] = toPx(x, y);
        i ? p.lineTo(px, py) : p.moveTo(px, py);
      });
      p.closePath();
    }
  }
  return p;
}

// One path for several shapes, so a single destination-in fill masks to all of them
// (successive destination-in fills would intersect). Shapes don't overlap, so even-odd is safe.
function combined(paths) {
  const all = new Path2D();
  paths.forEach(p => all.addPath(p));
  return all;
}

// Greyscale images of the blue channel, at `res` px per µm over the geometry bounds:
// membrane (dim, uneven, soft) and nuclei (DAPI: brighter, mottled chromatin).
export function blueChannel(geometry, res, seed) {
  const [x0, y0, x1, y1] = geometry.bounds;
  const w = (x1 - x0) * res, h = (y1 - y0) * res;
  const toPx = (x, y) => [(x - x0) * res, (y - y0) * res];
  const rand = mulberry32(seed);

  // membrane: cytoplasm of each cell, the axon and the terminals
  const mem = canvas(w, h);
  const m = mem.getContext("2d");
  const shapeAll = combined([
    ...geometry.cells.map(c => multiPolygonPath(c.cytoplasm, toPx)),
    multiPolygonPath(geometry.axon.shape, toPx),
    multiPolygonPath(geometry.terminals.shape, toPx),
  ]);
  m.fillStyle = "#fff";
  m.fill(shapeAll, "evenodd");
  // the membrane label is brightest at the cell surface: add a soft rim
  m.strokeStyle = "rgba(255,255,255,0.9)";
  m.lineWidth = Math.max(1, 0.35 * res);
  for (const c of geometry.cells) m.stroke(multiPolygonPath(c.cytoplasm, toPx));
  m.globalCompositeOperation = "multiply";
  m.drawImage(noiseCanvas(w, h, 5 * res, rand, 0.45, 1.0), 0, 0);
  m.drawImage(noiseCanvas(w, h, 1.2 * res, rand, 0.7, 1.0), 0, 0);
  m.globalCompositeOperation = "destination-in";
  m.fill(shapeAll, "evenodd");
  const membrane = blur(mem, Math.max(2, Math.round(0.25 * res)));

  // nuclei: DAPI
  const nuc = canvas(w, h);
  const n = nuc.getContext("2d");
  const nucAll = combined(geometry.cells.map(c => multiPolygonPath(c.nucleus, toPx)));
  n.fillStyle = "#fff";
  n.fill(nucAll, "evenodd");
  n.globalCompositeOperation = "multiply";
  n.drawImage(noiseCanvas(w, h, 0.9 * res, rand, 0.5, 1.0), 0, 0);
  n.globalCompositeOperation = "destination-in";
  n.fill(nucAll, "evenodd");
  const nuclei = blur(nuc, Math.max(2, Math.round(0.2 * res)));

  return { membrane, nuclei, x0, y0, res };
}

// TDP-43 nuclear signal: each nucleus filled at its intensity, finely granular, soft-edged.
export function tdpNuclear(geometry, intensities, res, seed) {
  const [x0, y0, x1, y1] = geometry.bounds;
  const w = (x1 - x0) * res, h = (y1 - y0) * res;
  const toPx = (x, y) => [(x - x0) * res, (y - y0) * res];
  const rand = mulberry32(seed);
  const c = canvas(w, h);
  const g = c.getContext("2d");
  geometry.cells.forEach((cell, i) => {
    const v = Math.max(0, Math.min(1, intensities[i] ?? 0));
    g.fillStyle = `rgba(255,255,255,${v})`;
    g.fill(multiPolygonPath(cell.nucleus, toPx));
  });
  g.globalCompositeOperation = "multiply";
  g.drawImage(noiseCanvas(w, h, 0.6 * res, rand, 0.55, 1.0), 0, 0);
  g.globalCompositeOperation = "destination-in";
  g.fill(combined(geometry.cells.map(cell => multiPolygonPath(cell.nucleus, toPx))), "evenodd");
  return { canvas: blur(c, Math.max(2, Math.round(0.25 * res))), x0, y0, res };
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
