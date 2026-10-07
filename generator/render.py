"""Pre-rendered microscope images for one animal: membrane (mCD8::BFP), DAPI and the diffuse
TDP-43 nuclear signal, as greyscale WebP at RES px per µm over the case's frame:
site/data/<case>/images/<genotype>-<animal>-<layer>.webp

Realism comes from modelling the label and the optics, not from detail (docs/spec.md,
*Image realism model*):
- Membrane: continuous processes whose width and brightness wander irregularly, mottled like a
  real membrane label; cell bodies with a bright plasma-membrane rim, granular internal
  membranes and a dark nucleus.
- DAPI: mottled chromatin with bright chromocentres, a dimmer nucleolus and a brighter rim.
- TDP-43: finely speckled nucleoplasm that leaves the nucleolus out, scaled by each nucleus's
  level (lower in the mutant), and a much dimmer diffuse signal through the cell-body cytoplasm
  and the neurites (also lower in the mutant), on the same grey-per-level scale as the nucleus.
  The mutant's aggregates are drawn in too: irregular bodies with bright and dark patches, at the
  brightness the generator gave each, with a highlight roll-off so their texture survives.
  The small, round transport granules are drawn live by the viewer from the data.
- Optics: point-spread blur, an out-of-focus haze from the maximum-intensity projection, uneven
  labelling, and shot noise that scales with the signal (zero where there is no signal, so the
  image edges never show). Spots are drawn live by the viewer, so they stay sharp at any zoom.
"""

import math

import numpy as np
from PIL import Image
from shapely import contains_xy, prepare

RES = 10                     # px per µm
PSF_SIGMA_UM = 0.2          # lateral PSF (a little soft, as in the reference images)
HAZE_SIGMA_UM = 1.3          # out-of-focus light gathered by the projection
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
    V = f["b"] * f["v"] * (f["r"] / core_r) ** 0.25
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
        core = {"axon": 0.62, "neurite": 0.6, "terminal": 0.6, "fine": 0.25}[f["kind"]]
        stamp(layer, cv, f, core)
        np.maximum(out, layer * {"axon": 0.9, "neurite": 0.85, "terminal": 1.0, "fine": 1.0}[f["kind"]], out=out)
    # membrane label is cloudy, not even: mottle the processes at fine and medium scales
    out *= uneven(cv, rng, 0.42, 1.1, scale_um=0.3) * uneven(cv, rng, 0.6, 1.06, scale_um=1.2)
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
    return optics(out, rng, photons=30, haze=0.32) / 1.25


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


def cytoplasm_texture(cv, c, rng):
    """Diffuse cytoplasmic TDP-43: finely speckled, on the nucleus's scale (same mean per level)."""
    cyto = c["soma"].difference(c["nucleus"])
    m = mask(cv, c["soma"]) * (1 - mask(cv, c["nucleus"], 0.15))
    n = int(cyto.area * 5)
    speck = splat(cv, points_in(cyto, n, rng), rng.uniform(0.1, 0.6, n).astype(np.float32), 0.18)
    speck /= np.percentile(speck[m > 0.5], 95) + 1e-9
    return (0.62 + 0.45 * np.clip(speck, 0, 1.5)) * m


def tdp43(cv, skel, levels, neurite_level, rng):
    out = cv.zeros()
    for c, v, cy in zip(skel["cells"], levels["nuclear"], levels["cytoplasmic"]):
        out += nucleus_texture(cv, c, rng, "tdp") * v + cytoplasm_texture(cv, c, rng) * cy
    # neurites: a filled tube per fibre (max-composited, like the membrane), dimmer than the cell body
    layer, fill = cv.zeros(), cv.zeros()
    for f in skel["fibres"]:
        layer[:] = 0
        stamp(layer, cv, {**f, "b": 1.0, "v": np.ones_like(f["v"])}, {"axon": 0.62, "neurite": 0.6, "terminal": 0.6, "fine": 0.25}[f["kind"]])
        np.maximum(fill, layer, out=fill)
    level = neurite_level * float(np.mean(levels["cytoplasmic"]))
    fill *= level * 0.8 * uneven(cv, rng, 0.7, 1.1, scale_um=0.4)
    somata = sum(mask(cv, c["soma"]) for c in skel["cells"])
    out += fill * np.clip(1 - somata, 0, 1)
    if levels["aggregates"]:
        # shared fine and coarse patchiness; each aggregate is scaled to its mean grey (×1.3: optics divides it out)
        fine = blur(rng.standard_normal((cv.h, cv.w)).astype(np.float32), 0.15 * RES)
        coarse = blur(rng.standard_normal((cv.h, cv.w)).astype(np.float32), 0.45 * RES)
        tex = np.clip(1 + 0.42 * fine / fine.std() + 0.45 * coarse / coarse.std(), 0.1, None)
        for a in levels["aggregates"]:
            body = mask(cv, a["shape"], 0.06)
            piece = body * tex
            out += piece * (1.3 * a["grey"] * body.sum() / piece.sum())
    img = optics(out, rng, photons=40, haze=0.12) / 1.3
    knee = 0.7  # highlight roll-off: the nucleus is untouched, aggregates keep their texture below white
    return np.where(img < knee, img, knee + (1 - knee) * np.tanh((img - knee) / (1 - knee)))


def save(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    a = (np.clip(img, 0, 1) * 255).round().astype(np.uint8)
    Image.fromarray(a, mode="L").save(path, "WEBP", quality=88, method=6)


def render_animal(case_dir, frame, skel, genotype, animal, levels, neurite_level, seed):
    cv = Canvas(frame)
    rng = lambda k: np.random.default_rng([seed, ("control", "mutant").index(genotype), animal, k])
    save(membrane(cv, skel, rng(1)), case_dir / "images" / f"{genotype}-{animal}-membrane.webp")
    save(dapi(cv, skel, rng(2)), case_dir / "images" / f"{genotype}-{animal}-dapi.webp")
    save(tdp43(cv, skel, levels, neurite_level, rng(3)), case_dir / "images" / f"{genotype}-{animal}-tdp43.webp")
