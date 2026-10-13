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
from shapely.geometry import Polygon

RES = 10                     # px per µm
PSF_SIGMA_UM = 0.2          # lateral PSF (a little soft, as in the reference images)
HAZE_SIGMA_UM = 1.3          # out-of-focus light gathered by the projection
LAYERS = ("membrane", "dapi", "tdp43")

# per fibre kind: the radius at which stamp() gives full brightness, and the membrane layer's gain
FIBRE_CORE = {"axon": 0.62, "neurite": 0.6, "terminal": 0.6, "fine": 0.25, "swelling": 1.0}
FIBRE_GAIN = {"axon": 0.9, "neurite": 0.85, "terminal": 1.0, "fine": 1.0}
# synaptic swellings (leg motor neuron): their membrane label is brightest round the rim, as on
# p. 9 of the reference pack; a large swelling's middle falls to 1 - this
SWELLING_RIM = 0.45
# neuropil (mushroom body): a dim fill under the Kenyon cells' own processes, which run as fine
# bright streaks along the bundles (reference pack, p. 11); as fractions of a full-brightness fibre
NEUROPIL_FILL = 0.2
NEUROPIL_STREAKS = 0.85
NEUROPIL_TDP43 = 1.0         # diffuse TDP-43 in the neuropil, as a fraction of the neurite level
# unlabelled tissue seen by its autofluorescence (leg motor neuron), dimmer than the label
CONTEXT_VNC = 0.46           # nerve-cord tissue round the cell body
CONTEXT_SHEATH = 0.62        # the sheath along the VNC's edge
CONTEXT_NERVE = 0.42         # the nerve the axon leaves in
CONTEXT_CUTICLE = 0.62       # the leg's cuticle, at its outer edge
CUTICLE_EDGE = 0.75          # the shell's profile inwards from that edge: a crisp line,
CUTICLE_GLOW = 0.3           # a glow over a few µm,
CUTICLE_FILL = 0.08          # and a faint translucence across the leg
CUTICLE_JOINT = 0.65         # where one segment's end sits in the next
CONTEXT_BRISTLE = 0.4        # bristles and their sockets
CONTEXT_MUSCLE = 0.52        # striped muscle under the synaptic terminals
FIBRE_UM = 9.5               # muscle fibre width (they run along the femur)
SARCOMERE_UM = 3.2           # striation period across the fibres
CONTEXT_EDGE_UM = 8.0        # the tissue fades out over this distance from the image's edges
BIG_CASE_CELLS = 8           # beyond this many cells, per-cell textures are made in a window
WINDOW_UM = 3.0              # margin around a cell in its window


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

    def window(self, bounds, margin_um):
        """A smaller canvas on the same pixel grid around bounds, and the slice of this canvas it covers."""
        x0, y0, x1, y1 = bounds
        i0, j0 = self.px(x0 - margin_um, y0 - margin_um)
        i1, j1 = self.px(x1 + margin_um, y1 + margin_um)
        c0, c1 = max(0, int(i0)), min(self.w, int(math.ceil(i1)))
        r0, r1 = max(0, int(j0)), min(self.h, int(math.ceil(j1)))
        sub = Canvas((self.x0 + c0 / self.res, self.y0 + r0 / self.res, self.x0 + c1 / self.res, self.y0 + r1 / self.res), self.res)
        return sub, (slice(r0, r1), slice(c0, c1))


def cell_window(cv, cells, c):
    """Where to make one cell's textures: the whole canvas, or (many cells, a large frame) a
    window round the cell, so each cell does not cost full-canvas blurs."""
    if len(cells) <= BIG_CASE_CELLS:
        return cv, (slice(None), slice(None))
    return cv.window(c["soma"].bounds, WINDOW_UM)


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


def neuropil(cv, n):
    """A neuropil's mask (one shape, so its regions show no seams) and its streaks: the Kenyon
    cells' processes summed into the image (sampled every 0.08 µm, each cell at its own
    brightness), so where more of them run together the bundle is brighter, then blurred to
    membrane width and scaled so the dense bundles reach about 1."""
    base = mask(cv, n["shape"], 0.3)
    seg, shine = n["segments"], n["shine"]
    d = seg[:, 1] - seg[:, 0]
    k = np.ceil(np.hypot(d[:, 0], d[:, 1]) / 0.08).astype(int) + 1
    idx = np.repeat(np.arange(len(seg)), k)
    t = (np.arange(k.sum()) - np.repeat(np.cumsum(k) - k, k)) / np.repeat(k, k)
    pts = seg[idx, 0] + d[idx] * t[:, None]
    I, J = cv.px(pts[:, 0], pts[:, 1])
    I, J = I.astype(int), J.astype(int)
    ok = (I >= 0) & (I < cv.w) & (J >= 0) & (J < cv.h)
    acc = cv.zeros()
    np.add.at(acc, (J[ok], I[ok]), shine[idx][ok] / k[idx][ok] * np.hypot(d[idx, 0], d[idx, 1])[ok])
    streaks = blur(acc, 0.1 * RES)
    inside = streaks[base > 0.5]
    streaks /= (np.percentile(inside, 98) if inside.size else 1.0) + 1e-9
    return base, np.clip(streaks, 0, 1.2) * base


def context(cv, ctx, rng):
    """The leg motor neuron's surroundings, seen only by their autofluorescence, so students can
    tell where they are: the VNC's tissue (a cortex of cell bodies along its edge, finer neuropil
    deeper in) and its sheath; the nerve the axon leaves in, a faint band of unlabelled axons;
    the leg's segments, each seen through its curved shell of cuticle (a crisp bright outer edge,
    a glow fading inwards over a few µm, a faint translucence across it), and its bristles; and
    the femur's muscle, fibres slanting in to a tendon along its midline with striations across
    them, each fibre's out of step with its neighbours'."""
    out, layer = cv.zeros(), cv.zeros()
    box = Polygon([(cv.x0, cv.y0), (cv.x0 + cv.w / cv.res, cv.y0), (cv.x0 + cv.w / cv.res, cv.y0 + cv.h / cv.res), (cv.x0, cv.y0 + cv.h / cv.res)])

    def strokes(fibres, gain):
        acc = cv.zeros()
        for f in fibres:
            layer[:] = 0
            stamp(layer, cv, f, f["r"])
            np.maximum(acc, layer, out=acc)
        return acc * gain

    if "vnc" in ctx:
        vnc = ctx["vnc"].intersection(box)
        cortex = vnc.difference(ctx["vnc"].buffer(-16))
        n = int(cortex.area / 18)
        cells = splat(cv, points_in(cortex, n, rng), rng.lognormal(0, 0.3, n).astype(np.float32), 1.25)
        cells /= np.percentile(cells[cells > 0], 90) + 1e-9
        deep = mask(cv, ctx["vnc"].buffer(-16), 4.0)
        tex = (1 - deep) * (0.55 + 0.5 * np.clip(cells, 0, 1.3)) + deep * uneven(cv, rng, 0.75, 1.1, scale_um=0.7)
        np.maximum(out, mask(cv, vnc, 1.2) * tex * CONTEXT_VNC, out=out)
        exy, es = resample_line(ctx["vnc_edge"])
        sheath = {"xy": exy, "s": es, "r": np.full(es.shape, 0.6), "v": np.ones_like(es), "b": 1.0}
        np.maximum(out, blur(strokes([sheath], CONTEXT_SHEATH), 0.5 * RES) * uneven(cv, rng, 0.55, 1.1, scale_um=3.0), out=out)
    if "nerve" in ctx:
        np.maximum(out, strokes(ctx["nerve"], CONTEXT_NERVE) * uneven(cv, rng, 0.75, 1.1, scale_um=1.5), out=out)
    xs = cv.x0 + (np.arange(cv.w) + 0.5) / cv.res
    ys = cv.y0 + (np.arange(cv.h) + 0.5) / cv.res
    X, Y = np.meshgrid(xs, ys)

    def along(axis):
        """Distance along an axis (from its start, in its direction) and across it, per pixel."""
        (px, py), th = axis["start"], axis["axis"]
        dx, dy = X - px, Y - py
        return dx * math.cos(th) + dy * math.sin(th), -dx * math.sin(th) + dy * math.cos(th)

    def fading(axis, a):
        """1 along an axis, fading in over its first fade_in µm and out over its last fade_out µm."""
        f = np.ones_like(a)
        if axis.get("fade_in"):
            f *= np.clip(a / axis["fade_in"], 0, 1) ** 2 * (3 - 2 * np.clip(a / axis["fade_in"], 0, 1))
        if axis.get("fade_out"):
            q = np.clip((a - (axis["length"] - axis["fade_out"])) / axis["fade_out"], 0, 1)
            f *= 1 - q * q * (3 - 2 * q)
        return f

    if "muscle" in ctx:
        pen = ctx["pennation"]
        # fibres run from the cuticle in to a tendon along the femur's midline, converging distally
        a, v = along(pen)
        u, slant = np.abs(v), pen["slant"]
        across = u * math.cos(slant) + a * math.sin(slant)
        lengthwise = a * math.cos(slant) - u * math.sin(slant)
        across = (across + 1.6 * np.sin(across / 7.0 + 1.3)) / FIBRE_UM   # fibres of uneven width
        k = np.floor(across)
        seams = 0.3 + 0.7 * np.sin(math.pi * (across - k)) ** 0.45                  # dark clefts between the fibres
        fibre_b = 0.7 + 0.4 * ((k * 0.754877) % 1.0)                         # each fibre a little brighter or dimmer
        bands = 0.86 + 0.14 * np.cos(2 * math.pi * (lengthwise / SARCOMERE_UM + ((k * 0.618034) % 1.0)))
        muscle = mask(cv, ctx["muscle"], 1.5) * seams * fibre_b * bands * fading(pen, a) * uneven(cv, rng, 0.65, 1.1, scale_um=4.0)
        np.maximum(out, muscle * CONTEXT_MUSCLE, out=out)
    if "leg" in ctx:
        leg = ctx["leg"]
        # the shell glows from the leg's outline, on a canvas padded so the image's edges cast none
        pad = 15.0
        big = Canvas((cv.x0 - pad, cv.y0 - pad, cv.x0 + cv.w / cv.res + pad, cv.y0 + cv.h / cv.res + pad))
        kp = int(round(pad * cv.res))
        m = mask(big, leg["shape"])
        shell = m * (2 * CUTICLE_EDGE * (1 - blur(m, 0.9 * RES)) + 2 * CUTICLE_GLOW * (1 - blur(m, 4.5 * RES)) + CUTICLE_FILL)
        shell = shell[kp:kp + cv.h, kp:kp + cv.w]
        joints = []
        for arc in leg["joints"]:
            jxy, js = resample_line(arc)
            joints.append({"xy": jxy, "s": js, "r": np.full(js.shape, 0.8), "v": np.ones_like(js), "b": 1.0})
        shell = np.maximum(shell, blur(strokes(joints, CUTICLE_JOINT), 0.6 * RES))
        # each segment fades along its own axis (the coxa in from the body, the femur out towards the tibia)
        fade = cv.zeros()
        for seg in leg["segments"]:
            np.maximum(fade, mask(cv, seg["shape"].buffer(2.0)) * fading(seg, along(seg)[0]), out=fade)
        np.maximum(out, shell * fade * CONTEXT_CUTICLE * uneven(cv, rng, 0.6, 1.1, scale_um=2.0), out=out)
    if "bristles" in ctx:
        np.maximum(out, blur(strokes(ctx["bristles"], CONTEXT_BRISTLE), 0.25 * RES), out=out)
    # fade out towards the image's edges, so the frame never shows as a hard edge in the tissue
    ramp = lambda n: np.clip(np.minimum(np.arange(n) + 0.5, n - np.arange(n) - 0.5) / (CONTEXT_EDGE_UM * cv.res), 0, 1) ** 2
    out *= np.outer(ramp(cv.h), ramp(cv.w)) * (3 - 2 * np.sqrt(np.outer(ramp(cv.h), ramp(cv.w))))
    return out


def resample_line(points, step=0.1):
    p = np.asarray(points, float)
    s = np.r_[0, np.cumsum(np.hypot(*np.diff(p, axis=0).T))]
    t = np.arange(0, s[-1], step)
    return np.c_[np.interp(t, s, p[:, 0]), np.interp(t, s, p[:, 1])], t


def swellings(cv, fibres):
    """Synaptic swellings, filled, their membrane label brightest round the rim (reference pack,
    p. 9); small ones are rim all through. Returns their brightness and how much of each pixel
    they cover, so they hide the branch running through them."""
    cover, fill, layer = cv.zeros(), cv.zeros(), cv.zeros()
    for f in fibres:
        layer[:] = 0
        stamp(layer, cv, {**f, "b": 1.0, "v": np.ones_like(f["r"])}, f["r"])
        np.maximum(cover, layer, out=cover)
        np.maximum(fill, layer * f["b"], out=fill)
    rim = np.clip(cover * (1 - blur(cover, 0.45 * RES)) * 2.4, 0, 1)
    return fill * (1 - SWELLING_RIM + SWELLING_RIM * rim), cover


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


def membrane(whole, skel, rng):
    cv = whole
    # A maximum-intensity projection: where structures overlap, the brightest wins (each fibre
    # lies at its own depth), so fibres and cells are max-composited, not summed.
    out = cv.zeros()
    layer = cv.zeros()
    for f in skel["fibres"]:
        if f["kind"] == "swelling":
            continue
        layer[:] = 0
        stamp(layer, cv, f, FIBRE_CORE[f["kind"]])
        np.maximum(out, layer * FIBRE_GAIN[f["kind"]], out=out)
    swell = [f for f in skel["fibres"] if f["kind"] == "swelling"]
    if swell:
        bright, cover = swellings(cv, swell)
        out = out * (1 - cover) + bright
    if "neuropil" in skel:
        base, streaks = neuropil(cv, skel["neuropil"])
        np.maximum(out, base * (NEUROPIL_FILL + NEUROPIL_STREAKS * streaks), out=out)
    if "context" in skel:
        np.maximum(out, context(cv, skel["context"], rng), out=out)
    # membrane label is cloudy, not even: mottle the processes at fine and medium scales
    out *= uneven(cv, rng, 0.42, 1.1, scale_um=0.3) * uneven(cv, rng, 0.6, 1.06, scale_um=1.2)
    for c in skel["cells"]:
        cv, sl = cell_window(whole, skel["cells"], c)
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
        np.maximum(out[sl], body * c["brightness"] * 1.45, out=out[sl])
    cv = whole
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
        win, sl = cell_window(cv, skel["cells"], c)
        out[sl] += nucleus_texture(win, c, rng, "dapi") * c["brightness"]
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
        win, sl = cell_window(cv, skel["cells"], c)
        out[sl] += nucleus_texture(win, c, rng, "tdp") * v + cytoplasm_texture(win, c, rng) * cy
    # neurites: a filled tube per fibre (max-composited, like the membrane), dimmer than the cell body
    layer, fill = cv.zeros(), cv.zeros()
    for f in skel["fibres"]:
        layer[:] = 0
        stamp(layer, cv, {**f, "b": 1.0, "v": np.ones_like(f["v"])}, FIBRE_CORE[f["kind"]])
        np.maximum(fill, layer, out=fill)
    if "neuropil" in skel:
        base, streaks = neuropil(cv, skel["neuropil"])
        np.maximum(fill, base * NEUROPIL_TDP43 * (0.75 + 0.35 * streaks), out=fill)
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
