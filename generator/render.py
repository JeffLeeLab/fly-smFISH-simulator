"""Pre-rendered microscope images for one animal: membrane (mCD8::BFP), DAPI and the diffuse
TDP-43 nuclear signal, as greyscale WebP at RES px per µm over the case's frame:
site/data/<case>/images/<genotype>-<animal>-<layer>.webp

Realism comes from modelling the label and the optics, not from detail (docs/spec.md,
*Image realism model*):
- Membrane: beaded neurites whose brightness follows their thickness and labelling, cell bodies
  with a bright plasma-membrane rim, granular internal membranes and a dark nucleus.
- DAPI: mottled chromatin with bright chromocentres, a dimmer nucleolus and a brighter rim.
- TDP-43: finely speckled nucleoplasm that leaves the nucleolus out, scaled by each nucleus's
  intensity (lower in the mutant). Its puncta are drawn live by the viewer from the data.
- Optics: point-spread blur, an out-of-focus haze from the maximum-intensity projection, uneven
  labelling, and shot noise that scales with the signal (zero where there is no signal, so the
  image edges never show). Spots are drawn live by the viewer, so they stay sharp at any zoom.
"""

import math

import numpy as np
from PIL import Image
from shapely import contains_xy, prepare

RES = 10                     # px per µm
PSF_SIGMA_UM = 0.13          # lateral PSF
HAZE_SIGMA_UM = 1.6          # out-of-focus light gathered by the projection
LAYERS = ("membrane", "dapi", "tdp43")


class Canvas:
    def __init__(self, frame, res=RES):
        self.x0, self.y0, x1, y1 = frame
        self.res = res
        self.w = int(round((x1 - self.x0) * res))
        self.h = int(round((y1 - self.y0) * res))

    def px(self, x, y):
        return (x - self.x0) * self.res, (y - self.y0) * self.res

    def zeros(self):
        return np.zeros((self.h, self.w), np.float32)


def blur(img, sigma_px):
    """Gaussian blur by FFT, zero-padded so nothing wraps round the edges."""
    if sigma_px <= 0:
        return img
    pad = int(math.ceil(3 * sigma_px)) + 2
    a = np.pad(img, pad)
    fy = np.fft.fftfreq(a.shape[0])[:, None]
    fx = np.fft.rfftfreq(a.shape[1])[None, :]
    g = np.exp(-2 * math.pi ** 2 * sigma_px ** 2 * (fx ** 2 + fy ** 2))
    out = np.fft.irfft2(np.fft.rfft2(a) * g, s=a.shape)
    return out[pad:-pad, pad:-pad].astype(np.float32)


def mask(cv, geom, soft_um=0.0):
    """Antialiased-enough raster of a polygon (pixel centres inside), optionally softened."""
    prepare(geom)
    x0, y0, x1, y1 = geom.bounds
    i0, j0 = cv.px(x0, y0)
    i1, j1 = cv.px(x1, y1)
    c0, c1 = max(0, int(i0) - 2), min(cv.w, int(i1) + 3)
    r0, r1 = max(0, int(j0) - 2), min(cv.h, int(j1) + 3)
    xs = cv.x0 + (np.arange(c0, c1) + 0.5) / cv.res
    ys = cv.y0 + (np.arange(r0, r1) + 0.5) / cv.res
    X, Y = np.meshgrid(xs, ys)
    m = cv.zeros()
    m[r0:r1, c0:c1] = contains_xy(geom, X, Y)
    return blur(m, soft_um * cv.res) if soft_um else m


def splat(cv, pts, weights, sigma_um):
    """Points as Gaussian blobs: a weighted histogram, blurred."""
    img = cv.zeros()
    if len(pts):
        i, j = cv.px(pts[:, 0], pts[:, 1])
        ok = (i >= 0) & (i < cv.w) & (j >= 0) & (j < cv.h)
        np.add.at(img, (j[ok].astype(int), i[ok].astype(int)), weights[ok])
    return blur(img, sigma_um * cv.res)


def points_in(geom, n, rng):
    x0, y0, x1, y1 = geom.bounds
    prepare(geom)
    out = []
    while sum(len(o) for o in out) < n:
        k = max(64, 3 * n)
        xs, ys = rng.uniform(x0, x1, k), rng.uniform(y0, y1, k)
        ok = contains_xy(geom, xs, ys)
        out.append(np.c_[xs[ok], ys[ok]])
    return np.vstack(out)[:n]


def stamp(layer, cv, f, core_r):
    """One fibre into a layer: discs along the centreline at the local radius (max-composited
    within the fibre, so it reads as one continuous tube). Thicker = brighter, as there is
    more labelled membrane in the column."""
    I, J = cv.px(f["xy"][:, 0], f["xy"][:, 1])
    R = f["r"] * cv.res
    V = f["b"] * f["v"] * (f["r"] / core_r) ** 0.3
    for i, j, r, v in zip(I, J, R, V):
        c0, c1 = max(0, int(i - r - 2)), min(cv.w, int(i + r + 3))
        r0, r1 = max(0, int(j - r - 2)), min(cv.h, int(j + r + 3))
        if c0 >= c1 or r0 >= r1:
            continue
        yy, xx = np.mgrid[r0:r1, c0:c1]
        d = np.hypot(xx + 0.5 - i, yy + 0.5 - j)
        disc = np.clip(r + 0.5 - d, 0, 1) * v
        np.maximum(layer[r0:r1, c0:c1], disc, out=layer[r0:r1, c0:c1])


def uneven(cv, rng, lo, hi, scale_um=5.0):
    """Smooth multiplicative field: uneven labelling across the tissue."""
    f = blur(rng.standard_normal((cv.h, cv.w)).astype(np.float32), scale_um * cv.res)
    f = (f - f.min()) / (f.max() - f.min() + 1e-9)
    return lo + (hi - lo) * f


def optics(img, rng, photons, haze):
    """PSF blur + projection haze + signal-dependent shot noise."""
    img = blur(img, PSF_SIGMA_UM * RES) + haze * blur(img, HAZE_SIGMA_UM * RES)
    counts = rng.poisson(np.clip(img, 0, None) * photons).astype(np.float32)
    return blur(counts / photons, 0.6)  # a touch of detector smoothing


def membrane(cv, skel, rng):
    # A maximum-intensity projection: where structures overlap, the brightest wins (each fibre
    # lies at its own depth), so fibres and cells are max-composited, not summed.
    out = cv.zeros()
    layer = cv.zeros()
    for f in skel["fibres"]:
        layer[:] = 0
        core = {"axon": 0.4, "neurite": 0.5, "terminal": 0.3}[f["kind"]]
        stamp(layer, cv, f, core)
        np.maximum(out, layer * {"axon": 0.9, "neurite": 0.85, "terminal": 1.0}[f["kind"]], out=out)
    for c in skel["cells"]:
        soma = mask(cv, c["soma"])
        nuc = mask(cv, c["nucleus"], 0.15)
        # plasma membrane: brightest at the rim, unevenly so around the cell
        rim = np.clip(soma * (1 - blur(soma, 0.6 * RES)) * 2.2, 0, 1)
        rim = blur(rim, 0.15 * RES) * uneven(cv, rng, 0.45, 1.15, scale_um=1.6)
        # internal membranes: clumped granules of mixed sizes
        cyto_geom = c["soma"].difference(c["nucleus"].buffer(0.25))
        n = int(cyto_geom.area * 2.4)
        pts = points_in(cyto_geom, n, rng)
        gran = splat(cv, pts, rng.lognormal(0, 0.7, n).astype(np.float32), 0.28) + \
            0.8 * splat(cv, pts[: n // 4], rng.lognormal(0, 0.6, n // 4).astype(np.float32), 0.6)
        gran /= np.percentile(gran[soma > 0], 95) + 1e-9
        envelope = np.clip(nuc * (1 - blur(nuc, 0.35 * RES)) * 2, 0, 1)
        body = (0.12 + 0.55 * np.clip(gran, 0, 1.8) + 0.62 * rim) * soma * (1 - 0.88 * nuc) + 0.08 * envelope
        np.maximum(out, body * c["brightness"] * 1.45, out=out)
    out *= uneven(cv, rng, 0.62, 1.08)
    return optics(out, rng, photons=30, haze=0.22) / 1.35


def nucleus_texture(cv, c, rng, kind):
    m = mask(cv, c["nucleus"])
    soft = blur(m, 0.2 * RES)
    area = c["nucleus"].area
    (ncx, ncy), nr = c["nucleolus"]
    nucleolus = splat(cv, np.array([[ncx, ncy]]), np.array([1.0], np.float32), nr * 0.7)
    nucleolus /= nucleolus.max() + 1e-9
    if kind == "dapi":
        clumps = splat(cv, points_in(c["nucleus"], int(area * 1.3), rng), rng.uniform(0.2, 0.8, int(area * 1.3)).astype(np.float32), 0.3)
        clumps /= np.percentile(clumps[m > 0], 95) + 1e-9
        cc = np.array([p for p, _ in c["chromocentres"]])
        chromo = splat(cv, cc, np.ones(len(cc), np.float32), 0.42)
        chromo /= chromo.max() + 1e-9
        rim = np.clip(m * (1 - blur(m, 0.5 * RES)) * 2, 0, 1)
        tex = 0.38 + 0.55 * np.clip(clumps, 0, 1.6) + 1.1 * chromo + 0.32 * rim - 0.38 * nucleolus
    else:  # TDP-43: finely speckled nucleoplasm, nucleolus left out
        n = int(area * 7)
        speck = splat(cv, points_in(c["nucleus"], n, rng), rng.uniform(0.1, 0.6, n).astype(np.float32), 0.16)
        speck /= np.percentile(speck[m > 0], 95) + 1e-9
        tex = (0.62 + 0.45 * np.clip(speck, 0, 1.5)) * (1 - 0.88 * nucleolus)
    return np.clip(tex, 0, None) * soft


def dapi(cv, skel, rng):
    out = cv.zeros()
    for c in skel["cells"]:
        out += nucleus_texture(cv, c, rng, "dapi") * c["brightness"]
    return optics(out, rng, photons=55, haze=0.12) / 0.95


def tdp43(cv, skel, nuclear, rng):
    out = cv.zeros()
    for c, v in zip(skel["cells"], nuclear):
        out += nucleus_texture(cv, c, rng, "tdp") * v
    return optics(out, rng, photons=40, haze=0.12) / 1.3


def save(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    a = (np.clip(img, 0, 1) * 255).round().astype(np.uint8)
    Image.fromarray(a, mode="L").save(path, "WEBP", quality=88, method=6)


def render_animal(case_dir, frame, skel, genotype, animal, nuclear, seed):
    cv = Canvas(frame)
    rng = lambda k: np.random.default_rng([seed, ("control", "mutant").index(genotype), animal, k])
    save(membrane(cv, skel, rng(1)), case_dir / "images" / f"{genotype}-{animal}-membrane.webp")
    save(dapi(cv, skel, rng(2)), case_dir / "images" / f"{genotype}-{animal}-dapi.webp")
    save(tdp43(cv, skel, nuclear, rng(3)), case_dir / "images" / f"{genotype}-{animal}-tdp43.webp")
