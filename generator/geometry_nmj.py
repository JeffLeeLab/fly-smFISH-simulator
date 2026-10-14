"""Leg motor neuron geometry, one per genotype and animal, in µm:
site/data/nmj/geometry-<genotype>-<animal>.json.

Representative, not exact anatomy (docs/spec.md, *Geometry references*, *Leg motor neuron*),
after the reference pack (docs/references/reference-mn-neurons.pdf). Side view, top to bottom
(instructor, 2026-10-13):
- The cell body, enlarged to about 18 µm across with a nucleus of about 8 µm, lies inside the
  VNC, near its lower edge. The viewer shows no dendrites (they are drawn in the descent only,
  p. 4).
- The leg is drawn after a confocal image of a T1 leg (instructor, 2026-10-14): the coxa hangs
  from under the VNC, the small trochanter sits at its foot, and the femur rises from there to
  the right, fading out where the tibia would begin. Each segment is a translucent shell of
  cuticle; only the femur holds muscle. The leg is about a third of real size (*Simplified*).
- The axon leaves the VNC through its nerve, runs down the coxa, kinks through the trochanter
  and runs up the femur, wandering a little as real axons do (pp. 10–11): fuller in the coxa,
  pinched where it passes the joints, a little slimmer in the femur. It is far shorter than the
  real path. It ends at its first branch on the femur muscle.
- The synaptic terminals are everything beyond that branch, after the larval and adult
  terminals on pp. 9–10: the axon's continuation along the muscle fibres, thinning, and thin side
  branches that leave it at a slant and turn to run along the fibres, wandering and kinking a
  little; each branch ends in a string of round to oval swellings of mixed sizes (the last one
  largest), some touching, some apart. 20 swellings in control, 15 in the mutant (which has one
  branch fewer), with the same look.
- Context, not compartments, seen by its autofluorescence and drawn into the membrane image by
  render.py: the VNC's tissue with its sheath, the nerve the axon leaves in, the leg's segments
  (each seen through its curved shell of cuticle: a crisp outer edge with a glow fading inwards),
  a few bristles, and the striped muscle inside the femur.
Every animal is a little different (cell size and position, the axon's path, the branches'
order, angles and lengths, the swellings' sizes); only the number of swellings is systematic.

The skeleton (fibre centrelines with radius and brightness) is also returned by build() for
the image renderer (generator/render.py), as for the Pdf neurons.

x runs left → right, y dorsal (top) → ventral (bottom), as on screen.

The step 2 descent's drawing goes to site/data/nmj/anatomy.json (anatomy(), below): the fly's
VNC and its leg motor neuron in the fly's own µm, from the MaleCNS v0.9 cell that
generator.connectome_nmj picks and caches (run that first, once), laid into the flybody fly's
front leg; and the viewer's outlines, for the descent's last frame.

    uv run python -m generator.geometry_nmj
    uv run python -m generator.geometry_nmj --sketch docs/references/nmj-compartment-sketch.png
"""

import json
import math
import sys
from types import SimpleNamespace

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from shapely.geometry import LineString, Point, Polygon
from shapely.ops import unary_union

from .geometry_pdf import STEP, as_multi, catmull, fibre, irregular, normals, resample, rounded, smooth, tube_polygon, wobbly
from .paths import SITE_DATA

SEED = 20261013
GENOTYPES = ("control", "mutant")
ANIMALS = (1, 2, 3)
SOMA_R = (8.6, 9.4)            # cell body about 18 µm across: it holds about 150 molecules
NUC_R = (3.8, 4.2)             # nucleus about 8 µm
AXON_R = 1.45                  # about 2.9 µm wide
TRUNK_R = (1.0, 0.45)          # the axon's continuation past its first branch, thinning to its end
BRANCH_R = (0.42, 0.32)        # side branches, thinning to their ends (spec minimum width 0.5 µm)
SWELL_R = (0.75, 1.45)         # synaptic swellings, about 1.5–3 µm across
# swellings per string, the trunk's first, then the branches' (the last string is a second-order
# branch): 20 in control, 15 in the mutant, which has one branch fewer
STRINGS = {"control": (5, 4, 4, 3, 2, 2), "mutant": (4, 3, 3, 3, 2)}
TRUNK_LEN = {"control": 30.0, "mutant": 25.0}   # the trunk before its own string
SOMA_C = (30.0, 19.0)
# the axon's course: cell body neck → out of the VNC → down the coxa → its kink through the
# trochanter → up the femur to its first branch, on the femur's midline
AXON_GUIDE = [(31.5, 30.0), (33.0, 44.0), (36.0, 66.0), (40.0, 92.0), (44.0, 114.0), (48.0, 128.0), (55.0, 137.0),
              (63.0, 138.0), (70.0, 132.0), (75.5, 125.5)]
# the VNC's ventral edge across the frame (left → right), gently uneven
VNC_EDGE = [(-30.0, 30.0), (0.0, 35.5), (25.0, 40.0), (50.0, 43.5), (75.0, 42.0), (100.0, 37.5), (125.0, 33.0), (160.0, 28.0)]
# the leg, side view, after a confocal image of a T1 leg (instructor, 2026-10-14), about a third of
# real size: the coxa hangs from under the VNC (its top fading in, where it meets the body), the
# small trochanter at its foot, and the femur rising to the right, fading out where the tibia
# would begin. Per segment: centreline control points (proximal → distal), half-widths along it,
# and how far it fades in at its start and out at its end (µm).
LEG = {
    "coxa": ([(31.0, 48.0), (35.0, 76.0), (40.0, 102.0), (45.0, 124.0)], (18.0, 22.0, 20.0, 14.0), 16.0, 0.0),
    "trochanter": ([(44.0, 128.0), (52.0, 140.0), (63.0, 145.0)], (11.0, 12.5, 11.0), 0.0, 0.0),
    "femur": ([(60.0, 146.0), (82.2, 117.6), (104.3, 89.3), (127.8, 59.3)], (15.0, 19.0, 18.0, 16.0), 0.0, 24.0),
}
AXON_SEGMENT_R = {"coxa": 1.55, "trochanter": 1.1, "femur": 1.3}   # the axon fuller in the coxa, pinched at the joints
PENNATION = 0.2                # the femur muscle's fibres slant this much (rad) in to a tendon along its midline
# bristles, lying back towards the foot: segment, how far along it, which side (+1: right of the
# segment's proximal → distal direction... seen on screen, the coxa's left and the femur's lower
# side), length
BRISTLES = (("coxa", 0.35, 1, 24.0), ("coxa", 0.72, 1, 28.0), ("femur", 0.42, 1, 28.0), ("femur", 0.68, 1, 30.0),
            ("femur", 0.6, -1, 24.0))
ARBOR_MARGIN = 5.0             # the terminals keep this far inside the cuticle
GRANULE_REACH = 0.43 + 0.3     # mean granule radius + the overlap distance (spec)
GRANULES = {"axon": (5, 25), "terminals": (2, 8)}   # per neuron, control → mutant (spec)


def rng_for(genotype, animal, stream):
    return np.random.default_rng([SEED, GENOTYPES.index(genotype), animal, stream])


def smoothstep(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def heading(xy, i, back=8):
    d = xy[i] - xy[max(0, i - back)]
    return math.atan2(d[1], d[0])


# ---------- the neuron ----------

def build_cell(rng):
    """The cell body, teardrop-shaped where the axon leaves (downwards), with its nucleus."""
    cx, cy = SOMA_C[0] + rng.uniform(-2, 2), SOMA_C[1] + rng.uniform(-1.5, 1.5)
    R = rng.uniform(*SOMA_R)
    blob = wobbly(cx, cy, R, rng)
    tip = np.array([cx + 0.28 * R + 0.8, cy + 0.96 * R + 1.6])
    neck = unary_union([Point(cx + 0.15 * R, cy + R * 0.4).buffer(R * 0.6), Point(*tip).buffer(AXON_R + 0.2)]).convex_hull
    soma = unary_union([blob, neck])
    rn = rng.uniform(*NUC_R)
    nc = np.array([cx + rng.uniform(-1.0, 0.6), cy - rng.uniform(0.6, 1.4)])
    nucleus = wobbly(nc[0], nc[1], rn, rng, amps=(0.03, 0.02, 0.01))
    assert soma.buffer(-0.5).contains(nucleus), "nucleus too close to the cell edge"
    return {"soma": soma, "nucleus": nucleus, "tip": tip, "R": R,
            "nucleolus": (nc + rng.uniform(-1.0, 1.0, 2), rng.uniform(0.8, 1.1)),
            "chromocentres": [(nc + rng.uniform(-1.8, 1.8, 2), rng.uniform(0.35, 0.5)) for _ in range(rng.integers(1, 3))],
            "brightness": float(rng.uniform(0.9, 1.1))}


def build_axon(rng, cell):
    """The axon: from the cell body's neck out of the VNC, down the coxa, kinking through the
    trochanter and up the femur, wandering a little along the way (a slow drift and a faint ripple,
    none at its ends); fuller in the coxa, pinched where it passes the trochanter, a little slimmer
    in the femur, with slight swellings, thinning over its last 12 µm into the trunk."""
    guide = [cell["tip"] - [0, 0.8]] + [np.array(p) + rng.uniform(-1.8, 1.8, 2) for p in AXON_GUIDE[1:-1]] \
        + [np.array(AXON_GUIDE[-1]) + [rng.uniform(-1.5, 1.5), rng.uniform(-1.0, 1.0)]]
    xy, s = resample(catmull(guide))
    L = s[-1]
    calm = smoothstep(s / 10) * smoothstep((L - s) / 10)
    drift = (1.1 * smooth(rng, wl=(30, 60))(s) + 0.35 * smooth(rng, wl=(6, 12))(s)) * calm
    xy, s = resample(xy + normals(xy) * drift[:, None])
    m, v = irregular(s, rng, 1.0, var=0.07, swell=(0.08, 0.2), every=(9.0, 18.0), swell_len=(2.0, 5.0), r_min=0.0)
    segs = leg_shapes()
    base = np.full(s.shape, AXON_R)
    for name in ("coxa", "femur", "trochanter"):   # later ones win where segments overlap
        inside = np.array([segs[name]["shape"].contains(Point(*p)) for p in xy[::5]]).repeat(5)[:len(s)]
        base[inside] = AXON_SEGMENT_R[name]
    k = np.exp(-0.5 * (np.arange(-60, 61) * STEP / 4.0) ** 2)
    base = np.convolve(np.pad(base, 60, mode="edge"), k / k.sum(), mode="valid")
    r = base * m * (1 - (1 - TRUNK_R[0] / AXON_SEGMENT_R["femur"]) * smoothstep((s - (s[-1] - 12)) / 12))
    b = (0.85 + 0.15 * smooth(rng, wl=(10, 30))(s)) * rng.uniform(0.92, 1.05)
    return fibre(xy, s, (r, v), b, "axon"), xy


def grow(rng, start, theta0, target, L, settle=(3.0, 7.0), wander=0.42, kink=0.26):
    """A process leaving `start` at angle theta0 and turning to run at `target` (along the muscle
    fibres), wandering gently with small kinks, as the terminal branches on pp. 9–10 do."""
    s = np.arange(0, L + STEP / 2, STEP)
    th = target + (theta0 - target) * np.exp(-s / rng.uniform(*settle)) \
        + wander * smooth(rng, wl=(6, 14))(s) + kink * smooth(rng, wl=(1.5, 3.5))(s)
    steps = np.c_[np.cos(th), np.sin(th)] * STEP
    return np.asarray(start, float) + np.vstack([[0, 0], steps[:-1].cumsum(axis=0)]), s


def swellings_for(rng, n):
    """A string of n swellings, tip first: radius, half-length along the branch, and the gap to
    the next one in (a quarter of them touch)."""
    out = []
    for j in range(n):
        rho = float(np.clip(rng.lognormal(math.log(1.0), 0.2), *SWELL_R)) * (1.15 if j == 0 else 1.0)
        e = float(rng.uniform(0.1, 0.55) * rho)
        gap = float(rng.uniform(0.0, 0.25) if rng.random() < 0.25 else rng.uniform(0.5, 1.8))
        out.append((rho, e, gap))
    return out


def string_length(sw):
    return sum(2 * (rho + e) + gap for rho, e, gap in sw)


def place_swellings(rng, xy, s, sw):
    """The swellings of one string along the end of a branch (xy, s): the last at the tip, each
    a short fat fibre (a round or oval blob), nudged a little off the branch's line."""
    out, pos = [], s[-1] - 0.3 * sw[0][0]
    nrm = normals(xy)
    for j, (rho, e, gap) in enumerate(sw):
        if j:
            prev = sw[j - 1]
            pos -= prev[0] + prev[1] + prev[2] + rho + e
        i = int(np.clip(np.searchsorted(s, pos), 0, len(s) - 1))
        u = xy[min(i + 3, len(s) - 1)] - xy[max(i - 3, 0)]
        u /= np.hypot(*u) + 1e-12
        c = xy[i] + nrm[i] * rng.normal(0, 0.12)
        pxy, ps = resample([c - e * u, c + e * u])
        pxy, ps = np.vstack([pxy, c + e * u]), np.r_[ps, 2 * e]
        r = rho * (1 + 0.05 * smooth(rng, wl=(0.8, 2.0))(ps))
        out.append(fibre(pxy, ps, (r, np.ones_like(ps)), float(rng.uniform(0.95, 1.1)), "swelling"))
    return out


def branch_radius(rng, s, r0, r1, base=None):
    """A thin process thinning from r0 to r1, with small varicosities and ragged edges; with
    `base` (the parent's radius where it leaves), it starts that wide and narrows within a
    micrometre or two, so the fork is smooth."""
    m, v = irregular(s, rng, 1.0, var=0.18, swell=(0.25, 0.7), every=(2.0, 4.5), swell_len=(0.5, 1.1), r_min=0.0)
    r = (r0 + (r1 - r0) * s / max(s[-1], 1e-9)) * m
    if base is not None:
        r = r + (base - r) * np.exp(-s / 0.9)
    return np.maximum(r, 0.27), v


class Arbor:
    """The terminals as they grow: their sample points and radii, to keep new branches clear of
    the old, and the region they must stay in."""

    def __init__(self, region):
        self.region, self.pts, self.rad = region, np.zeros((0, 2)), np.zeros(0)

    def add(self, xy, r):
        self.pts, self.rad = np.vstack([self.pts, xy[::3]]), np.r_[self.rad, r[::3]]

    def clear(self, xy, r, start, skip=4.0, gap=1.4):
        """Whether a new process stays in the region and at least `gap` µm from the others,
        except within `skip` µm of where it leaves its parent."""
        if not all(self.region.contains(Point(*p)) for p in xy[::10]):
            return False
        keep = np.hypot(*(xy - start).T) > skip
        if not keep.any() or not len(self.pts):
            return True
        a, ra = xy[keep][::3], r[keep][::3]
        near = np.hypot(*(self.pts - start).T) > skip
        b, rb = self.pts[near], self.rad[near]
        d = np.hypot(a[:, None, 0] - b[None, :, 0], a[:, None, 1] - b[None, :, 1]) - ra[:, None] - rb[None, :]
        return bool(d.min() >= gap)


def build_terminals(rng, genotype, axon):
    """The axon's continuation (the trunk) along the muscle from its first branch, thinning, with
    its own string at the end; side branches leaving it at a slant on either side (the first at
    the axon's end), turning to run along the fibres; one second-order branch; each ends in its
    string of swellings."""
    t0, th0 = axon["xy"][-1], heading(axon["xy"], len(axon["xy"]) - 1)
    segs = leg_shapes()
    fem = segs["femur"]
    along = fem["axis"]
    region = fem["shape"].buffer(-ARBOR_MARGIN).intersection(span(fem, -50.0, fem["length"] - fem["fade_out"] - 8.0)) \
        .difference(segs["trochanter"]["shape"].buffer(4.0)).difference(segs["coxa"]["shape"].buffer(4.0))
    arbor = Arbor(region)
    arbor.add(axon["xy"][-200:], axon["r"][-200:])
    counts = list(STRINGS[genotype])
    trunk_n, branch_n, second_n = counts[0], counts[1:-1], counts[-1]
    rng.shuffle(branch_n)
    fibres, swells = [], []

    # the trunk
    sw = swellings_for(rng, trunk_n)
    L = TRUNK_LEN[genotype] * rng.uniform(0.95, 1.05) + string_length(sw)
    for _ in range(60):
        xy, s = grow(rng, t0, th0, along + rng.uniform(-0.12, 0.12), L, settle=(6.0, 12.0), wander=0.3, kink=0.1)
        r, v = branch_radius(rng, s, TRUNK_R[0], TRUNK_R[1])
        if arbor.clear(xy, r, t0, skip=1e9):
            break
    trunk = fibre(xy, s, (r, v), float(rng.uniform(0.9, 1.05)), "terminal")
    fibres.append(trunk)
    swells += place_swellings(rng, xy, s, sw)
    arbor.add(xy, r)

    # side branches, at spread points along the trunk's bare length, the first at its start
    bare = len(s) - int(string_length(sw) / STEP) - 1
    n = len(branch_n)
    edges = np.linspace(4 / STEP, bare * 0.85, n)
    at = [0] + [int(rng.uniform(a + 15, b - 15)) for a, b in zip(edges[:-1], edges[1:])]
    sides = [rng.choice([-1, 1])]
    for _ in range(n - 1):
        sides.append(-sides[-1] if rng.random() < 0.7 else sides[-1])
    branches = []
    for k, (i, side, m) in enumerate(zip(at, sides, branch_n)):
        made = None
        for attempt in range(120):
            side_k = side if attempt < 60 else -side
            sw = swellings_for(rng, m)
            L = rng.uniform(8.0, 20.0) + string_length(sw)
            th_parent = heading(xy, max(i, 8))
            start = xy[i]
            bxy, bs = grow(rng, start, th_parent + side_k * rng.uniform(0.7, 1.3), along + side_k * rng.uniform(0.25, 0.8), L, settle=(5.0, 11.0))
            br, bv = branch_radius(rng, bs, *BRANCH_R, base=float(r[i]))
            if arbor.clear(bxy, br, start):
                made = (bxy, bs, br, bv, sw)
                break
        assert made, f"could not place side branch {k + 1}"
        bxy, bs, br, bv, sw = made
        f = fibre(bxy, bs, (br, bv), float(rng.uniform(0.85, 1.05)), "terminal")
        fibres.append(f)
        swells += place_swellings(rng, bxy, bs, sw)
        arbor.add(bxy, br)
        branches.append(f)

    # one second-order branch, from part-way along a side branch (the longer ones first)
    order = sorted(branches, key=lambda f: -f["s"][-1])
    for attempt in range(300):
        parent = order[min(attempt // 60, len(order) - 1)]
        sw = swellings_for(rng, second_n)
        L = rng.uniform(3.0, 7.0) + string_length(sw)
        i = int(rng.uniform(0.25, 0.6) * len(parent["s"]))
        side = rng.choice([-1, 1])
        start = parent["xy"][i]
        bxy, bs = grow(rng, start, heading(parent["xy"], i) + side * rng.uniform(0.5, 0.9), along + side * rng.uniform(0.1, 0.4), L)
        br, bv = branch_radius(rng, bs, BRANCH_R[0] * 0.9, BRANCH_R[1], base=float(parent["r"][i]))
        if arbor.clear(bxy, br, start, skip=3.0):
            break
    else:
        raise AssertionError("could not place the second-order branch")
    fibres.append(fibre(bxy, bs, (br, bv), float(rng.uniform(0.85, 1.0)), "terminal"))
    swells += place_swellings(rng, bxy, bs, sw)
    return fibres, swells


# ---------- context: the tissue round the neuron, seen by its autofluorescence ----------

def leg_shapes():
    """The leg's segments: each a tube of cuticle along its centreline, rounded at the ends, with
    its straight axis (start, direction, length) for fading and pennation."""
    out = {}
    for name, (pts, hw, fade_in, fade_out) in LEG.items():
        xy, s = resample(catmull(pts, n=20), step=0.5)
        r = np.interp(s, np.linspace(0, s[-1], len(hw)), hw)
        shape = unary_union([Point(*p).buffer(float(w), quad_segs=12) for p, w in zip(xy, r)]).simplify(0.05)
        d = np.subtract(pts[-1], pts[0])
        out[name] = {"name": name, "shape": shape, "centreline": xy, "start": tuple(pts[0]), "axis": math.atan2(d[1], d[0]),
                     "length": float(np.hypot(*d)), "fade_in": fade_in, "fade_out": fade_out}
    return out


def span(seg, a0, a1, reach=200.0):
    """The part of the plane between a0 and a1 µm along a segment's axis."""
    (x, y), th = seg["start"], seg["axis"]
    t, n = np.array([math.cos(th), math.sin(th)]), np.array([-math.sin(th), math.cos(th)])
    o = np.array([x, y])
    return Polygon([o + t * a0 - n * reach, o + t * a1 - n * reach, o + t * a1 + n * reach, o + t * a0 + n * reach])


def context_shapes(rng, axon_xy):
    """The VNC (its tissue, its edge and the cortex of cell bodies along it), the nerve the axon
    leaves in (a faint band of unlabelled axons, fading out once in the femur), the leg's segments
    (shells of cuticle) with a few bristles lying back towards the foot, each from a small socket,
    and the femur muscle, whose fibres slant in to a tendon along its midline."""
    edge = catmull(VNC_EDGE, n=16)
    vnc = Polygon(np.vstack([edge, [[edge[-1, 0], -80], [edge[0, 0], -80]]]))
    segs = leg_shapes()
    fem, troc, coxa = segs["femur"], segs["trochanter"], segs["coxa"]
    # the nerve: unlabelled axons alongside this one, from inside the VNC into the femur
    xy, s = resample(axon_xy)
    inside = np.array([vnc.contains(Point(*p)) for p in xy[::5]]).repeat(5)[:len(s)]
    s_exit = s[np.argmin(inside)]
    beyond = fem["shape"].difference(troc["shape"])
    past = np.array([beyond.contains(Point(*p)) for p in xy[::5]]).repeat(5)[:len(s)]
    s_joint = s[np.argmax(past)]
    fade = smoothstep((s - s_exit + 6) / 8) * (1 - smoothstep((s - s_joint) / 10))
    nrm = normals(xy)
    nerve = [fibre(xy, s, (np.full(s.shape, 4.2), fade), 0.5, "nerve")]
    for off in np.r_[rng.uniform(-3.8, -1.8, 3), rng.uniform(1.8, 3.8, 3)]:
        o = off + 0.6 * smooth(rng, wl=(15, 40))(s)
        nerve.append(fibre(xy + nrm * o[:, None], s, (np.full(s.shape, rng.uniform(0.35, 0.55)), fade), float(rng.uniform(0.6, 1.0)), "nerve"))
    # bristles: long, tapering, curving back towards the cuticle as they go, each from a ring socket
    bristles = []
    for name, frac, side, L in BRISTLES:
        seg = segs[name]
        th = seg["axis"]
        tng, n = np.array([math.cos(th), math.sin(th)]), np.array([-math.sin(th), math.cos(th)]) * side
        c = np.array(seg["start"]) + tng * frac * seg["length"]
        hit = LineString([c, c + n * 60]).intersection(seg["shape"].exterior)
        hits = [np.array(g.coords[0]) for g in getattr(hit, "geoms", [hit])]
        base = min(hits, key=lambda q: np.hypot(*(q - c))) + n * 0.6
        L *= rng.uniform(0.9, 1.1)
        s_b = np.arange(0, L, STEP)
        phi = rng.uniform(0.22, 0.36) * (1 - 0.6 * s_b / L)
        d = np.c_[np.cos(phi), np.sin(phi)] @ np.array([tng, n])
        bxy = base + np.vstack([[0, 0], (d[:-1] * STEP).cumsum(axis=0)])
        bristles.append(fibre(bxy, s_b, (0.55 - 0.42 * s_b / L, np.ones_like(s_b)), float(rng.uniform(0.75, 1.0)), "bristle"))
        ring_th = np.linspace(0, 2 * math.pi, 40)
        rxy, rs = resample(base + 1.1 * np.c_[np.cos(ring_th), np.sin(ring_th)])
        bristles.append(fibre(rxy, rs, (np.full(rs.shape, 0.3), np.ones_like(rs)), 0.9, "socket"))
    muscle = fem["shape"].buffer(-3.0).difference(troc["shape"].buffer(1.5)).difference(coxa["shape"].buffer(1.5))
    keep = ("name", "shape", "start", "axis", "length", "fade_in", "fade_out")
    # one outline for the whole leg; at each joint, the arc of the distal segment's end seated in
    # the proximal one
    joints = []
    for a, b in (("coxa", "trochanter"), ("trochanter", "femur")):
        arc = segs[b]["shape"].exterior.intersection(unary_union([segs[k]["shape"] for k in ("coxa", "trochanter") if k != b]))
        joints += [np.array(g.coords) for g in getattr(arc, "geoms", [arc]) if g.geom_type == "LineString" and g.length > 3]
    leg = {"shape": unary_union([seg["shape"] for seg in segs.values()]), "joints": joints,
           "segments": [{k: seg[k] for k in keep} for seg in segs.values()]}
    return {"vnc": vnc, "vnc_edge": edge, "nerve": nerve, "leg": leg, "bristles": bristles, "muscle": muscle,
            "pennation": {"start": fem["start"], "axis": fem["axis"], "slant": PENNATION, "length": fem["length"], "fade_out": fem["fade_out"]}}


# ---------- assembly ----------

def build(genotype: str, animal: int):
    cell = build_cell(rng_for(genotype, animal, 1))
    axon_f, cxy = build_axon(rng_for(genotype, animal, 2), cell)
    terms, swells = build_terminals(rng_for(genotype, animal, 3), genotype, axon_f)
    context = context_shapes(rng_for(genotype, animal, 4), cxy)

    soma, nucleus = cell["soma"], cell["nucleus"]
    axon = tube_polygon(axon_f).difference(soma)
    terminals = unary_union([tube_polygon(f) for f in terms + swells]).difference(axon.buffer(0.02)).difference(soma)
    cyto = soma.difference(nucleus)
    shapes = [nucleus, cyto, axon, terminals]
    for i, a in enumerate(shapes):
        for b in shapes[i + 1:]:
            assert a.intersection(b).area < 1e-4, "compartments overlap"
    assert context["vnc"].buffer(-2).contains(soma), "the cell body must lie inside the VNC"
    assert context["muscle"].contains(terminals), "the synaptic terminals must lie on the femur muscle"
    assert context["muscle"].buffer(1.0).contains(Point(*cxy[-1])), "the axon's first branch must lie in the femur"

    everything = unary_union([soma, axon, terminals])

    def view(geom, margin):
        x0, y0, x1, y1 = geom.bounds
        return [round(x0 - margin, 2), round(y0 - margin, 2), round(x1 + margin, 2), round(y1 + margin, 2)]

    # the whole view takes in the leg, up to where the femur starts to fade, so students see the
    # leg the axon runs into
    x0, y0, x1, y1 = view(everything, 4.0)
    segs = leg_shapes()
    fem = segs["femur"]
    shown = unary_union([segs["coxa"]["shape"], segs["trochanter"]["shape"],
                         fem["shape"].intersection(span(fem, -50.0, fem["length"] - fem["fade_out"]))])
    lx0, ly0, lx1, ly1 = shown.bounds
    bounds = [round(min(x0, lx0 - 2.0), 2), y0, round(max(x1, lx1 + 2.0), 2), round(max(y1, ly1 + 2.0), 2)]
    mid = len(cxy) // 2
    public = {
        "case": "nmj",
        "genotype": genotype,
        "animal": animal,
        "units": "µm",
        "note": "Representative leg motor neuron geometry, not exact anatomy: cell body enlarged, axon drawn far shorter than its "
                "path through the leg. Shared by the generator and the viewer.",
        "bounds": bounds,
        "cells": [{
            "id": 1,
            "nucleus": rounded(nucleus),
            "nucleus_centre": [round(nucleus.centroid.x, 3), round(nucleus.centroid.y, 3)],
            "cytoplasm": rounded(cyto),
        }],
        "axon": {"shape": rounded(axon), "centreline": np.round(cxy[::10], 3).tolist(), "area_um2": round(axon.area, 2)},
        "terminals": {"shape": rounded(terminals), "area_um2": round(terminals.area, 2)},
        "views": {
            "nucleus": view(nucleus, 3.0),
            "cellbody": view(soma, 4.0),
            "axon": view(LineString(cxy[mid // 2: mid + mid // 2]).buffer(6), 0),
            "terminals": view(terminals, 3.0),
        },
    }
    skeleton = {"cells": [cell], "fibres": [axon_f] + terms + swells, "context": context,
                # for the sketch
                "compartments": {"nucleus": nucleus, "cytoplasm": cyto, "axon": axon, "terminals": terminals},
                "swellings": len(swells), "axon_length": float(axon_f["s"][-1]), "first_branch": cxy[-1]}
    return public, skeleton


# ---------- the compartment sketch (for the instructor's annotation) ----------

def chance(n, area):
    """Expected share of uniformly placed spots within the overlap distance of n granules."""
    return 1 - math.exp(-n * math.pi * GRANULE_REACH ** 2 / area)


def sketch(path):
    built = {g: build(g, 1)[1] for g in GENOTYPES}
    K, pad, top, foot = 4.0, 20, 56, 150
    x0, y0, x1, y1 = 6.0, -2.0, 134.0, 176.0
    W, H = int((x1 - x0) * K), int((y1 - y0) * K)
    im = Image.new("RGB", (2 * W + 3 * pad, H + top + foot + 22), "white")
    dr = ImageDraw.Draw(im, "RGBA")
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 14)
        bold = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 15)
    except OSError:
        font = bold = ImageFont.load_default()
    frame = Polygon([(x0, y0), (x1, y0), (x1, y1), (x0, y1)])

    for col, g in enumerate(GENOTYPES):
        b = built[g]
        comp, ctx = b["compartments"], b["context"]
        ox = pad + col * (W + pad)
        P = lambda xy: [((x - x0) * K + ox, (y - y0) * K + top) for x, y in xy]
        poly = lambda geom, fill, line: [dr.polygon(P(p.exterior.coords), fill=fill, outline=line) for p in as_multi(geom).geoms]

        def pline(coords, **kw):   # a line, clipped to the panel
            clip = LineString(coords).intersection(frame)
            for part in getattr(clip, "geoms", [clip]):
                if not part.is_empty and part.geom_type == "LineString":
                    dr.line(P(part.coords), **kw)
        dr.rectangle([ox, top, ox + W, top + H], outline=(200, 200, 200))
        # context: VNC tissue, the leg's segments (up to where they fade), the nerve, the femur
        # muscle with its fibres, the cuticle's outline, the joints and the bristles
        poly(ctx["vnc"].intersection(frame), (150, 150, 150, 45), None)
        leg = ctx["leg"]
        shown = unary_union([s["shape"].intersection(span(s, s["fade_in"] * 0.6 if s["fade_in"] else -50.0,
                                                          s["length"] - s["fade_out"] * 0.4 if s["fade_out"] else s["length"] + 50.0))
                             for s in leg["segments"]])
        poly(shown.intersection(frame), (205, 175, 120, 30), None)
        pline(ctx["vnc_edge"], fill=(130, 130, 130, 200), width=2)
        nerve = ctx["nerve"][0]
        on = nerve["v"] > 0.3
        poly(LineString(nerve["xy"][on]).buffer(4.2).intersection(frame), (150, 150, 150, 35), (150, 150, 150, 90))
        muscle = ctx["muscle"].intersection(frame).intersection(shown)
        poly(muscle, (200, 150, 140, 40), None)
        pen = ctx["pennation"]
        tv = np.array([math.cos(pen["axis"]), math.sin(pen["axis"])])
        nv = np.array([-tv[1], tv[0]])
        a = np.linspace(-20, pen["length"] + 20, 160)
        for c in np.arange(0, 200, 9.5):     # fibres slanting in to the tendon along the femur's midline
            u = (c - a * math.sin(pen["slant"])) / math.cos(pen["slant"])
            ok = u >= 0
            for sgn in (-1, 1):
                if ok.sum() >= 2:
                    pts = np.array(pen["start"]) + a[ok, None] * tv + sgn * u[ok, None] * nv
                    clip = LineString(pts).intersection(muscle)
                    for part in getattr(clip, "geoms", [clip]):
                        if not part.is_empty and part.geom_type == "LineString":
                            dr.line(P(part.coords), fill=(180, 120, 110, 90), width=1)
        outline = shown.boundary.intersection(leg["shape"].exterior.buffer(0.05))
        for part in getattr(outline, "geoms", [outline]):
            if not part.is_empty and part.geom_type == "LineString":
                pline(part.coords, fill=(150, 110, 60, 230), width=3)
        for arc in leg["joints"]:
            pline(arc, fill=(150, 110, 60, 170), width=2)
        for f in ctx["bristles"]:
            pline(f["xy"], fill=(150, 110, 60, 200), width=1)
        # compartments
        poly(comp["cytoplasm"], (110, 145, 215, 90), (40, 60, 120, 255))
        poly(comp["nucleus"], (255, 255, 255, 220), (40, 40, 40, 255))
        poly(comp["axon"], (140, 120, 200, 120), (70, 50, 130, 255))
        poly(comp["terminals"], (60, 165, 95, 120), (20, 100, 50, 255))
        (fx, fy), = P([b["first_branch"]])
        dr.ellipse([fx - 4, fy - 4, fx + 4, fy + 4], outline=(200, 40, 40), width=2)
        name = "hTDP-43 WT" if g == "control" else "hTDP-43 mutant"
        dr.text((ox, 10), f"{name} · animal 1 · {b['swellings']} synaptic swellings", fill="black", font=bold)

    # labels on the WT panel, with leader lines
    b, ox = built["control"], pad
    comp = b["compartments"]
    P = lambda x, y: ((x - x0) * K + ox, (y - y0) * K + top)

    def label(at, xy, text, fill="black"):
        lines = text.split("\n")
        x, y = P(*xy)
        if at:   # a leader line to the side of the text, or up to its foot when the point lies below it
            ax, ay = P(*at)
            w = max(dr.textlength(t, font=font) for t in lines)
            end = (x - 4, y) if ax < x else (x + w + 6, y) if ax > x + w else (ax, y + 5 * K * (len(lines) - 1) + 10)
            dr.line([(ax, ay), end], fill=(60, 60, 60), width=1)
        for k, t in enumerate(lines):
            dr.text((x, y + 5 * K * k), t, fill=fill, font=font, anchor="lm")
    nc = comp["nucleus"].centroid
    label((nc.x, nc.y), (62, 4), "Nucleus")
    cyb = comp["cytoplasm"].bounds
    label((cyb[2] - 1.0, nc.y + 4), (62, 12), "Cell body (cytoplasm),\nno dendrites in the viewer")
    label(None, (16, -1), "VNC: tissue, not counted", fill=(90, 90, 90))
    label(None, (110, 22), "VNC edge", fill=(90, 90, 90))
    mid = comp["axon"].representative_point()
    label((mid.x, mid.y), (64, 28), "Axon: from the cell body to its\nfirst branch (red ring)")
    label(None, (64, 44), "Nerve: unlabelled axons,\nfading out in the femur", fill=(90, 90, 90))
    tip = min((c for g in as_multi(comp["terminals"]).geoms for c in g.exterior.coords), key=lambda c: c[1])
    label(tip, (66, 62), "Synaptic terminals:\nbranches and swellings\npast the red ring")
    label(None, (16, 96), "Coxa", fill=(130, 90, 40))
    label(None, (38, 166), "Trochanter", fill=(130, 90, 40))
    label(None, (100, 136), "Femur, its muscle:\nfibres, not counted", fill=(130, 90, 40))

    # footer: scale bar and the numbers the overlap measure depends on
    fy = top + H + 22
    dr.line([(pad, fy), (pad + 20 * K, fy)], fill="black", width=2)
    dr.text((pad + 20 * K + 10, fy), "20 µm · side view: VNC above; the leg below: coxa, trochanter, femur · draft for annotation, 2026-10-14",
            fill="black", font=font, anchor="lm")
    fy += 22
    dr.text((pad, fy), "The axon's real path out of the VNC and through the coxa and trochanter (0.5 mm or more) is drawn as about 140 µm, the leg at about a third of real size.",
            fill=(90, 90, 90), font=font, anchor="lm")
    lines = []
    for g in GENOTYPES:
        b = built[g]
        comp = b["compartments"]
        a_ax, a_t, a_c = comp["axon"].area, comp["terminals"].area, comp["cytoplasm"].area
        lines.append(f"{'WT' if g == 'control' else 'Mutant'}: cell body {a_c:.0f} µm² · axon {b['axon_length']:.0f} µm long, {a_ax:.0f} µm² "
                     f"· synaptic terminals {a_t:.0f} µm² · chance overlap with TDP-43 granules: axon {chance(GRANULES['axon'][g == 'mutant'], a_ax):.0%}, "
                     f"terminals {chance(GRANULES['terminals'][g == 'mutant'], a_t):.0%}")
    for k, t in enumerate(lines):
        dr.text((pad, fy + 26 + 22 * k), t, fill="black", font=font, anchor="lm")
    dr.text((pad, fy + 26 + 22 * len(lines)), "Granules per neuron, WT → mutant: axon 5 → 25, synaptic terminals 2 → 8 (radius 0.36–0.50 µm; overlap within 0.3 µm of the edge)",
            fill=(90, 90, 90), font=font, anchor="lm")
    im.save(path)
    print(f"wrote {path} ({im.size[0]}×{im.size[1]})")
    for t in lines:
        print(" ", t)


# ---------- the descent's drawing (site/data/nmj/anatomy.json) ----------

# The descent's world is the fly drawing's (generator/flies.py, the side view turned 20° towards
# us), in µm: the sprite's units × 10, the thorax at 0,0, x towards the head, y down. The leg is
# the near front leg (T1, right). The MaleCNS cell is a left one, drawn mirrored on the right.
FLY_UM = 10.0                   # µm per sprite unit
ROOT_AT = (300.0, 92.0)         # where its leg nerve leaves the VNC, above the coxa's base (world µm)
SOMA_R_WORLD = 6.0              # the real cell body, about 12 µm across
TERMINALS_K = 4.0               # the viewer's synaptic terminals drawn this much larger in the fly's femur
FIRST_BRANCH = 0.42             # how far along the fly's femur the axon first branches
PATH_SPLIT = {"vnc": 18, "nerve": 18, "coxa": 24, "trochanter": 8, "femur": 18}   # vertices per stretch of the axon


def fly_leg():
    """The near front leg's joints in the turned view (world µm): the coxa's base, the
    coxa–trochanter joint, the knee and the tibia's end; and the other legs' coxa bases."""
    from . import flies
    model = flies.Model(flies.fetch("fruitfly.xml"))
    q = flies.standing(SimpleNamespace(model=model))
    world = model.kinematics(q)
    to = lambda body: np.array(flies.VIEWS["turned"](world[body][1][None]))[:2, 0] * np.array([1, -1]) * flies.SCALE * FLY_UM
    return {"base": to("coxa_T1_right"), "hip": to("femur_T1_right"), "knee": to("tibia_T1_right"), "ankle": to("tarsus_T1_right"),
            "coxae": {s: to(f"coxa_{s}_right") for s in ("T1", "T2", "T3")}, "roll": flies.TURN}


def path_d(xy, closed=False, nd=1):
    xy = np.asarray(xy)
    return "M" + "L".join(f"{x:.{nd}f},{y:.{nd}f}" for x, y in xy) + ("Z" if closed else "")


def anatomy():
    """The descent's VNC, motor neuron and leg, and the viewer's outlines (see the module notes)."""
    from scipy.ndimage import gaussian_filter
    from skimage.measure import find_contours
    from . import connectome_nmj
    mn = connectome_nmj.load()
    leg = fly_leg()
    roll = leg["roll"]
    c = mn["cell"]
    ax = {k: np.array(mn["axes"][k]) for k in ("ap", "dv", "lr")}
    soma3 = np.array(c["soma"])

    def side(p3):   # MaleCNS µm → world offsets from the cell body: anterior right, ventral down, mirrored to the right side
        r = np.atleast_2d(p3) - soma3
        return np.c_[r @ ax["ap"], (r @ ax["dv"]) * math.cos(roll) + (r @ ax["lr"]) * math.sin(roll)]

    V = np.array(c["vertices"])
    exit_rel = side(V[c["exit_vertex"]])[0]
    soma_w = np.array(ROOT_AT) - exit_rel
    P = side(V) + soma_w

    # the VNC: an outline round the cloud of its cell bodies, seen from the side
    cloud = np.array(mn["vnc_somata_side"]) * [1, math.cos(roll)] + soma_w
    res, pad = 0.5, 30                                   # px per µm, margin
    lo = cloud.min(axis=0) - pad
    W, H = (np.ceil((cloud.max(axis=0) + pad - lo) * res)).astype(int)
    img = np.zeros((H, W))
    ij = ((cloud - lo) * res).astype(int)
    img[ij[:, 1], ij[:, 0]] = 1
    img = gaussian_filter(img, 9 * res)
    cont = max(find_contours(img, img.max() * 0.06), key=len)
    outline = Polygon(cont[:, ::-1] / res + lo).buffer(0).simplify(2.0)
    vnc_xy = np.asarray(outline.exterior.coords)
    neuromeres = {k: (np.array(v) * [1, math.cos(roll)] + soma_w).round(1).tolist() for k, v in mn["neuromeres_side"].items()}

    # the cell: dendrites as chains between branch points (the axon path apart), simplified
    deg = np.zeros(len(V), int)
    adj = [[] for _ in V]
    for a, b in c["edges"]:
        adj[a].append(b); adj[b].append(a); deg[a] += 1; deg[b] += 1
    on_axon = set(c["axon_path"])
    chains, seen = [], set()
    for a0 in range(len(V)):
        if deg[a0] == 2:
            continue
        for b0 in adj[a0]:
            if (a0, b0) in seen:
                continue
            ch = [a0, b0]
            seen.add((a0, b0)); seen.add((b0, a0))
            while deg[ch[-1]] == 2:
                nxt = adj[ch[-1]][0] if adj[ch[-1]][0] != ch[-2] else adj[ch[-1]][1]
                seen.add((ch[-1], nxt)); seen.add((nxt, ch[-1]))
                ch.append(nxt)
            if sum(i in on_axon for i in ch) > len(ch) // 2:
                continue
            line = LineString(P[ch]).simplify(0.8)
            if line.length >= 2.5:
                chains.append(np.asarray(line.coords))
    dendrites = " ".join(path_d(ch) for ch in chains)

    # the long path: through the VNC to the nerve root, down the nerve (as the cells with a nerve
    # stump show it) to the coxa's base, down the coxa, through the trochanter, up the femur
    vnc_part = P[c["axon_path"]]
    stub = side(np.array(c["nerve"]["stub"])) + soma_w
    base, hip, knee = leg["base"], leg["hip"], leg["knee"]
    fem = knee - hip
    fem_n = np.array([-fem[1], fem[0]]) / np.hypot(*fem)
    cox = hip - base
    cox_n = np.array([-cox[1], cox[0]]) / np.hypot(*cox)
    nerve = np.vstack([vnc_part[-1:], stub[1:], [stub[-1] + (base - stub[-1]) * 0.55 + cox_n * 6], [base + cox * 0.04]])
    coxa = np.array([base + cox * 0.04, base + cox * 0.35 + cox_n * 14, base + cox * 0.7 + cox_n * 10, hip - cox * 0.04 + cox_n * 4])
    troch = np.array([hip - cox * 0.04 + cox_n * 4, hip + fem * 0.05 - fem_n * 10, hip + fem * 0.12 - fem_n * 12])
    fb = hip + fem * FIRST_BRANCH
    femur = np.array([troch[-1], hip + fem * 0.25 - fem_n * 16, hip + fem * 0.35 - fem_n * 10, fb])

    def even(xy, n, spline=True):
        xy = catmull(xy, n=12) if spline and len(xy) > 2 else np.asarray(xy, float)
        sx, ss = resample(xy, step=0.25)
        return np.c_[np.interp(np.linspace(0, ss[-1], n), ss, sx[:, 0]), np.interp(np.linspace(0, ss[-1], n), ss, sx[:, 1])]
    long_parts = {"vnc": even(vnc_part, PATH_SPLIT["vnc"], False), "nerve": even(nerve, PATH_SPLIT["nerve"]),
                  "coxa": even(coxa, PATH_SPLIT["coxa"]), "trochanter": even(troch, PATH_SPLIT["trochanter"]),
                  "femur": even(femur, PATH_SPLIT["femur"])}

    # the short path: the viewer's axon (control, animal 1), from the cell body's centre, split the
    # same way by where it runs
    public, skel = build("control", 1)
    ctx = skel["context"]
    segs = {g["name"]: g for g in ctx["leg"]["segments"]}
    cl = np.array(public["axon"]["centreline"])
    nuc = np.array(public["cells"][0]["nucleus_centre"])
    xy, ss = resample(np.vstack([nuc, cl]), step=0.25)
    inside = lambda geom: np.array([geom.contains(Point(*p)) for p in xy])
    in_vnc, in_coxa, in_troch = inside(ctx["vnc"]), inside(segs["coxa"]["shape"]), inside(segs["trochanter"]["shape"].difference(segs["coxa"]["shape"]))
    i_vnc = int(np.argmin(in_vnc))                       # leaves the VNC
    i_coxa = int(np.argmax(in_coxa & (np.arange(len(xy)) > i_vnc)))
    i_troch = int(np.argmax(in_troch & (np.arange(len(xy)) > i_coxa)))
    beyond = inside(segs["femur"]["shape"].difference(segs["trochanter"]["shape"]))
    i_femur = int(np.argmax(beyond & (np.arange(len(xy)) > i_troch)))
    cuts = {"vnc": (0, i_vnc), "nerve": (i_vnc, i_coxa), "coxa": (i_coxa, i_troch), "trochanter": (i_troch, i_femur), "femur": (i_femur, len(xy) - 1)}
    short_parts = {k: even(xy[a:b + 1], PATH_SPLIT[k], False) for k, (a, b) in cuts.items()}
    geo_at = soma_w - nuc
    gap = short_parts["nerve"]
    mid = gap[len(gap) // 2]
    d = gap[-1] - gap[0]

    # the synaptic terminals: the viewer's branches and swellings about the first branch point,
    # and how they sit in the fly's femur (rotated to the femur's axis, enlarged)
    fb_v = np.array(skel["first_branch"])
    term = [np.asarray(LineString(f["xy"]).simplify(0.15).coords) - fb_v for f in skel["fibres"] if f["kind"] == "terminal"]
    swell = []
    for f in skel["fibres"]:
        if f["kind"] != "swelling":
            continue
        q = f["xy"] - fb_v
        h = q[-1] - q[0]
        swell.append([round(float(q[:, 0].mean()), 2), round(float(q[:, 1].mean()), 2),
                      round(float(np.hypot(*h) / 2 + f["r"].max()), 2), round(float(f["r"].max()), 2), round(math.degrees(math.atan2(h[1], h[0])), 1)])
    th_v = segs["femur"]["axis"]
    th_w = math.atan2(fem[1], fem[0])

    # the viewer's outlines: the VNC's edge and the leg as the images show it (each piece of the
    # cuticle's outline with the strength of the image's fade there), and the femur muscle
    frame = public["frame"] if "frame" in public else None
    shown = unary_union([g["shape"] for g in segs.values()])
    pieces = []
    for part in getattr(shown.exterior, "geoms", [shown.exterior]):
        pxy, ps = resample(np.asarray(part.coords), step=3.0)
        for k in range(len(pxy) - 1):
            mpt = (pxy[k] + pxy[k + 1]) / 2
            a = 0.0
            for g in segs.values():
                if g["shape"].buffer(2).contains(Point(*mpt)):
                    t = (mpt[0] - g["start"][0]) * math.cos(g["axis"]) + (mpt[1] - g["start"][1]) * math.sin(g["axis"])
                    f = 1.0
                    if g["fade_in"]:
                        u = min(1, max(0, t / g["fade_in"])); f *= u * u * (3 - 2 * u)
                    if g["fade_out"]:
                        u = min(1, max(0, (t - (g["length"] - g["fade_out"])) / g["fade_out"])); f *= 1 - u * u * (3 - 2 * u)
                    a = max(a, f)
            if a > 0.05:
                pieces.append([path_d(pxy[k:k + 2], nd=2), round(a, 2)])
    femur_shown = segs["femur"]["shape"].intersection(span(segs["femur"], -50, segs["femur"]["length"] - segs["femur"]["fade_out"] * 0.5))
    muscle = ctx["muscle"].intersection(femur_shown)
    # each segment whole, for the fly's leg to shrink into (the femur up to where it has faded)
    legs = {"coxa": segs["coxa"]["shape"].intersection(span(segs["coxa"], segs["coxa"]["fade_in"] * 0.5, 500)),
            "trochanter": segs["trochanter"]["shape"], "femur": femur_shown}
    edge = np.asarray(ctx["vnc_edge"])

    return {
        "note": "The leg motor neuron descent (step 2) and the step 7 locator. World: the turned side-view fly drawing's units x 10 = µm, "
                "thorax at 0,0, x towards the head, y down. The motor neuron is MaleCNS v0.9 body " + str(c["id"]) + " (" + str(c["type"]) +
                "), mirrored to the right side; its path down the leg is drawn along the flybody front leg. Viewer outlines are in the "
                "geometry's µm, placed in the world at viewer.at.",
        "source": {"connectome": mn["release"], "body": c["id"], "type": c["type"]},
        "fly": {"k": FLY_UM, "base": base.round(1).tolist(), "hip": hip.round(1).tolist(), "knee": knee.round(1).tolist(),
                "ankle": leg["ankle"].round(1).tolist(), "coxae": {k: v.round(1).tolist() for k, v in leg["coxae"].items()}},
        "vnc": {"outline": path_d(vnc_xy, closed=True), "neuromeres": neuromeres,
                "nerves": [path_d(even([neuromeres[k], (np.array(neuromeres[k]) + leg["coxae"][k]) / 2 + [0, -10], leg["coxae"][k]], 12)) for k in ("T2", "T3")]},
        "neuron": {"soma": soma_w.round(2).tolist(), "soma_r": SOMA_R_WORLD, "dendrites": dendrites,
                   "path": np.vstack(list(long_parts.values())).round(2).tolist(),
                   "parts": {k: v for k, v in zip(PATH_SPLIT, np.cumsum([0] + list(PATH_SPLIT.values()))[:-1].tolist())},
                   "muscle": {"at": (hip + fem * 0.56).round(1).tolist(), "rx": round(0.36 * float(np.hypot(*fem)), 1), "ry": 58.0, "angle": round(math.degrees(th_w), 2)}},
        "terminals": {"branches": " ".join(path_d(t, nd=2) for t in term), "swellings": swell,
                      "world": {"at": fb.round(2).tolist(), "k": TERMINALS_K, "rot": round(math.degrees(th_w - th_v), 2)},
                      "viewer": {"at": fb_v.round(2).tolist()}},
        "viewer": {"at": geo_at.round(3).tolist(), "frame": frame,
                   "path": np.vstack(list(short_parts.values())).round(3).tolist(),
                   "break": {"at": mid.round(2).tolist(), "angle": round(math.degrees(math.atan2(d[1], d[0])), 1)},
                   "vnc_edge": path_d(edge, nd=2),
                   "cuticle": pieces,
                   "joints": [path_d(j, nd=2) for j in ctx["leg"]["joints"]],
                   "legs": {k: path_d(np.asarray(max(as_multi(g).geoms, key=lambda q: q.area).exterior.coords), closed=True, nd=2) for k, g in legs.items()},
                   "muscle": " ".join(path_d(np.asarray(g.exterior.coords), closed=True, nd=2) for g in as_multi(muscle).geoms)},
    }


def main(argv) -> int:
    if argv[:1] == ["--sketch"]:
        sketch(argv[1])
        return 0
    built = {(g, a): build(g, a) for g in GENOTYPES for a in ANIMALS}
    # one frame for every image of the case, so all animals share a coordinate frame
    xs = [v[0]["bounds"] for v in built.values()]
    frame = [math.floor(min(b[0] for b in xs)) - 4, math.floor(min(b[1] for b in xs)) - 4,
             math.ceil(max(b[2] for b in xs)) + 4, math.ceil(max(b[3] for b in xs)) + 4]
    for (g, a), (public, skel) in built.items():
        public["frame"] = frame
        path = SITE_DATA / "nmj" / f"geometry-{g}-{a}.json"
        path.write_text(json.dumps(public, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
        print(f"wrote {path.name}: axon {skel['axon_length']:.0f} µm, {public['axon']['area_um2']} µm²; "
              f"synaptic terminals {public['terminals']['area_um2']} µm², {skel['swellings']} swellings")
    print(f"frame {frame}")
    a = anatomy()
    a["viewer"]["frame"] = frame
    path = SITE_DATA / "nmj" / "anatomy.json"
    path.write_text(json.dumps(a, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"wrote {path.name}: motor neuron {a['source']['body']} ({a['source']['type']}), {len(a['neuron']['path'])} path vertices, "
          f"{path.stat().st_size // 1024} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
