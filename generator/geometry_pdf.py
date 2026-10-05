"""PDF neuron (s-LNv) geometry, one per genotype and animal, in µm:
site/data/pdf/geometry-<genotype>-<animal>.json.

Representative, not exact anatomy (docs/spec.md, *Geometry references*), drawn after the
reference pack (docs/references/reference-pdf-neurons.pdf): four s-LNvs on one side.
- Cell bodies sit in a tight cluster, irregular and teardrop-shaped where the neurite leaves,
  enlarged to about 15 µm across, each with an off-centre nucleus of about 7 µm.
- The four axons run close enough to merge into one irregular band, splitting apart now and
  then (as in the EM reconstruction, p. 4), bend at the kink and enter the dorsal terminals.
- The dorsal terminals, drawn at ZT2, are thick, irregular processes that fan medially, cross
  and rejoin into a lacy mesh, with a few thin, faint processes at the edge (after the CD8::GFP
  panel, p. 5: diffuse membranes, not beads). The mutant arbor has about 20% less total length
  than the control mean.
Every animal is a little different (cluster arrangement, cell sizes, axon path, weaving,
branching); only the terminal-length difference is systematic.

The skeleton (fibre centrelines with radius and brightness) is also returned by build() for
the image renderer (generator/render.py), so the images and the compartments the generator
places molecules in come from one description.

x runs lateral → medial, y dorsal (top) → ventral (bottom), as on screen.

    uv run python -m generator.geometry_pdf
"""

import json
import math
import sys

import numpy as np
from shapely.geometry import LineString, MultiPolygon, Point, Polygon, mapping
from shapely.ops import unary_union

from .paths import SITE_DATA

SEED = 20260928
GENOTYPES = ("control", "mutant")
ANIMALS = (1, 2, 3)
STEP = 0.1                     # skeleton sampling, µm

SOMA_R = (6.6, 7.8)            # cell body radius range (spec: about 15 µm across)
NUC_R = (3.2, 3.8)             # nucleus radius range (spec: about 7 µm)
NEURITE_R = 0.6
AXON_R = 0.62                  # each of the four axons; together they make a 2–4 µm band
TERM_R = 0.52
FINE_R = 0.25                  # thin, faint processes at the edge of the arbor (spec minimum width 0.5 µm)
CONTROL_TERM_LENGTH = (220.0, 245.0)
MUTANT_FRACTION = 0.80         # spec: about 20% less total terminal length

BUNDLE_BASE = [(50.0, 112.0), (53.5, 92), (54.5, 72), (55.0, 52), (58.5, 35), (64.5, 24), (70.5, 17.5), (76.0, 14.0)]


# ---------- small helpers ----------

def rng_for(genotype, animal, stream):
    return np.random.default_rng([SEED, GENOTYPES.index(genotype), animal, stream])


def smooth(rng, wl=(8.0, 30.0), terms=3):
    """A smooth random function of arc length, roughly in [-1, 1]."""
    ph = rng.uniform(0, 2 * math.pi, terms)
    wls = rng.uniform(*wl, terms)
    amps = rng.uniform(0.5, 1.0, terms)
    return lambda s: sum(a * np.sin(2 * math.pi * np.asarray(s) / w + p) for a, w, p in zip(amps, wls, ph)) / amps.sum()


def resample(points, step=STEP):
    p = np.asarray(points, float)
    seg = np.hypot(*np.diff(p, axis=0).T)
    s = np.r_[0, np.cumsum(seg)]
    t = np.arange(0, s[-1], step)
    return np.c_[np.interp(t, s, p[:, 0]), np.interp(t, s, p[:, 1])], t


def catmull(points, n=24):
    """A smooth curve through the control points."""
    p = np.asarray(points, float)
    p = np.vstack([2 * p[0] - p[1], p, 2 * p[-1] - p[-2]])
    out = []
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        for t in np.linspace(0, 1, n, endpoint=False):
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(p[-2])
    return np.array(out)


def normals(xy):
    d = np.gradient(xy, axis=0)
    d /= np.hypot(*d.T)[:, None] + 1e-12
    return np.c_[-d[:, 1], d[:, 0]]


def irregular(s, rng, base_r, var=0.35, swell=(0.35, 0.85), every=(4.0, 10.0), swell_len=(1.5, 4.0), r_min=0.25):
    """A membrane-labelled process (after the CD8::GFP panel on p. 5 of the reference pack): its
    width wanders smoothly and irregularly, with elongated swellings that blend into the
    membrane rather than discrete beads; brightness is blotchy. Returns radius and brightness."""
    r = base_r * (1 + var * smooth(rng, wl=(6, 16))(s) + 0.5 * var * smooth(rng, wl=(1.8, 4.5))(s)
                  + 0.3 * var * smooth(rng, wl=(0.7, 1.6))(s))  # ragged edges
    pos = rng.uniform(0, every[1])
    while pos < s[-1]:
        r = r + base_r * rng.uniform(*swell) * np.exp(-((s - pos) / rng.uniform(*swell_len)) ** 2)
        pos += rng.uniform(*every)
    r = np.maximum(r, r_min)
    v = 0.8 + 0.22 * smooth(rng, wl=(2.5, 9))(s) + 0.12 * (r / base_r - 1)
    return r, np.clip(v, 0.4, 1.3)


def fibre(xy, s, radius_v, bright, kind):
    radius, v = radius_v
    return {"xy": xy, "s": s, "r": radius, "v": v, "b": bright, "kind": kind}


def tube_polygon(f, step=0.3):
    """Compartment outline of a fibre: discs along it at its local radius."""
    idx = np.unique(np.r_[np.arange(0, len(f["s"]), max(1, int(step / STEP))), len(f["s"]) - 1])
    return unary_union([Point(*f["xy"][i]).buffer(float(f["r"][i]), quad_segs=5) for i in idx])


def wobbly(cx, cy, r, rng, amps=(0.1, 0.07, 0.045, 0.025), n=140):
    th = np.linspace(0, 2 * math.pi, n, endpoint=False)
    rr = r * (1 + sum(a * rng.uniform(0.5, 1.0) * np.cos((k + 2) * th + rng.uniform(0, 2 * math.pi)) for k, a in enumerate(amps)))
    return Polygon(np.c_[cx + rr * np.cos(th), cy + rr * np.sin(th)])


def seg_dist(p, a, b):
    p, a, b = map(np.asarray, (p, a, b))
    t = np.clip(np.dot(p - a, b - a) / (np.dot(b - a, b - a) + 1e-12), 0, 1)
    return float(np.hypot(*(p - (a + t * (b - a)))))


# ---------- parts ----------

def place_cells(rng, p0):
    """Four cell bodies in a compact cluster below and lateral to the bundle origin, each with a
    clear path for its neurite."""
    p0 = np.array(p0)
    first = p0 + np.array([-15.0, 7.0]) + rng.normal(0, 1.0, 2)

    def clear_paths(pts, radii):
        for i in range(len(pts)):
            d = (p0 - pts[i]) / np.hypot(*(p0 - pts[i]))
            start = pts[i] + d * radii[i]
            for j in range(len(pts)):
                if j != i and seg_dist(pts[j], start, p0) < radii[j] + 1.6:
                    return False
        return True

    del first
    best, best_score = None, 1e9
    for _ in range(400):
        # neighbours touching along a jittered arc around the bundle origin (lower and lateral),
        # so every neurite has a clear path; radial distance alternates a little for a cluster look
        radii = rng.uniform(*SOMA_R, 4)
        dist = radii + rng.uniform(8.0, 12.0, 4)
        theta = math.radians(rng.uniform(62, 80))  # from below-medial round to lateral, clear of the bundle
        pts = [p0 + dist[0] * np.array([math.cos(theta), math.sin(theta)])]
        for i in range(1, 4):
            gap = radii[i] + radii[i - 1] + rng.uniform(0.8, 1.8)
            # angle step so the chord between neighbours equals the wanted gap
            r_avg = (dist[i] + dist[i - 1]) / 2
            theta += 2 * math.asin(min(0.99, gap / (2 * r_avg)))
            pts.append(p0 + dist[i] * np.array([math.cos(theta), math.sin(theta)]))
        pts = np.array(pts)
        if any(np.hypot(*(pts[i] - pts[j])) < radii[i] + radii[j] + 0.8 for i in range(4) for j in range(i + 1, 4)):
            continue
        if not clear_paths(list(pts), radii):
            continue
        score = sum(np.hypot(*(pts[i] - pts[j])) for i in range(4) for j in range(i + 1, 4)) + 0.5 * sum(np.hypot(*(pts - p0).T))
        if score < best_score:
            best, best_score = (pts, radii), score
    assert best is not None, "could not place the cell bodies"
    return best


def build_cells(rng, p0):
    pts, radii = place_cells(rng, p0)
    cells = []
    for i, (c, R) in enumerate(zip(pts, radii)):
        exit_dir = (np.array(p0) - c) / np.hypot(*(np.array(p0) - c))
        blob = wobbly(c[0], c[1], R, rng)
        tip = c + exit_dir * (R + rng.uniform(1.6, 2.6))
        neck = unary_union([Point(*(c + exit_dir * R * 0.35)).buffer(R * 0.62), Point(*tip).buffer(NEURITE_R + 0.15)]).convex_hull
        soma = unary_union([blob, neck])
        # nucleus: off centre, away from the neurite, where the cytoplasm is thinner
        rn = rng.uniform(*NUC_R)
        off = rng.uniform(0.7, 1.5)
        side = normals(np.array([c - exit_dir, c + exit_dir]))[0] * rng.uniform(-0.8, 0.8)
        nc = c - exit_dir * off + side
        from shapely import affinity
        nuc = affinity.rotate(affinity.scale(wobbly(nc[0], nc[1], rn, rng, amps=(0.03, 0.02, 0.01)), rng.uniform(1.0, 1.1), rng.uniform(0.9, 1.0)),
                              rng.uniform(0, 180), origin=(nc[0], nc[1]))
        cells.append({"soma": soma, "nucleus": nuc, "tip": tip, "centre": c, "exit": exit_dir, "R": R,
                      "nucleolus": (nc + rng.uniform(-0.9, 0.9, 2), rng.uniform(0.7, 1.0)),
                      "chromocentres": [(nc + rng.uniform(-1.6, 1.6, 2), rng.uniform(0.35, 0.5)) for _ in range(rng.integers(1, 3))],
                      "brightness": float(rng.uniform(0.82, 1.12))})
    # keep cell bodies apart (compartments must not overlap)
    for i, c in enumerate(cells):
        others = unary_union([o["soma"] for j, o in enumerate(cells) if j != i])
        c["soma"] = c["soma"].difference(others.buffer(0.35)).buffer(0)
        if c["soma"].geom_type != "Polygon":
            c["soma"] = max(c["soma"].geoms, key=lambda g: g.area)
        assert c["soma"].buffer(-0.5).contains(c["nucleus"]), "nucleus too close to the cell edge"
    return cells


def bundle_path(rng):
    pts = [np.array(BUNDLE_BASE[0]) + rng.normal(0, 1.2, 2)]
    for p in BUNDLE_BASE[1:-1]:
        pts.append(np.array(p) + rng.normal(0, 1.8, 2))
    pts.append(np.array(BUNDLE_BASE[-1]) + rng.normal(0, 1.5, 2))
    xy, s = resample(catmull(pts))
    return xy, s


def build_axons(rng, cells, p0_xy):
    """Four axons running close enough to merge into one irregular band, weaving and splitting
    apart now and then (as in the EM reconstruction, p. 4)."""
    cxy, cs = bundle_path(rng)
    n = normals(cxy)
    L = cs[-1]
    starts = np.sort(rng.uniform(-1.6, 1.6, 4))
    split_at = rng.uniform(0.3, 0.65) * L
    split_sign = rng.permutation([-1, 1, 0, 0])
    split_at2 = (split_at + rng.uniform(0.25, 0.4) * L) % (0.8 * L) + 0.1 * L
    split_sign2 = rng.permutation([-1, 1, 1, 0])
    def side(v, w):
        return v[0] * w[1] - v[1] * w[0]
    # which side of the bundle each cell's neurite arrives from, so neurites don't cross
    order = np.argsort([side(cxy[50] - cxy[0], c["tip"] - cxy[0]) for c in cells])
    axons, neurites = [], []
    for k, ci in enumerate(order):
        weave = smooth(rng, wl=(26, 52))
        fine = smooth(rng, wl=(5, 11))
        ramp_in = np.clip(cs / 9.0, 0, 1)
        ramp_out = np.clip((L - cs) / 7.0, 0, 1)
        o = starts[k] * (1 - ramp_in) + ramp_in * ramp_out * (1.1 * weave(cs) + 0.3 * fine(cs))
        o += split_sign[k] * 2.4 * np.exp(-((cs - split_at) / 7.5) ** 2) * ramp_out
        o += split_sign2[k] * 1.8 * np.exp(-((cs - split_at2) / 5.5) ** 2) * ramp_out
        o += (1 - ramp_out) * (starts[k] * 0.35)
        xy = cxy + o[:, None] * n
        r = irregular(cs, rng, AXON_R, var=0.3, swell=(0.25, 0.7), every=(5.0, 12.0))
        b = (0.75 + 0.25 * smooth(rng, wl=(10, 30))(cs)) * rng.uniform(0.85, 1.1)
        axons.append(fibre(xy, cs, r, b, "axon"))
        # primary neurite: from the cell's neck to where its axon starts
        c = cells[ci]
        a, z = c["tip"], xy[0]
        mid = (a + z) / 2 + normals(np.array([a, z]))[0] * rng.uniform(-2.0, 2.0)
        nxy, ns = resample(catmull([a, mid, z], n=30))
        nr = irregular(ns, rng, NEURITE_R, var=0.25, swell=(0.2, 0.5), every=(4.0, 9.0))
        nb = np.full(ns.shape, 0.9) * rng.uniform(0.85, 1.1)
        neurites.append(fibre(nxy, ns, nr, nb, "neurite"))
    return axons, neurites, cxy


def wandering(start, theta0, heading0, L, rng, amp=0.35, wl=(8.0, 22.0), settle=0.35):
    s = np.arange(0, L, STEP)
    th = theta0 + amp * smooth(rng, wl=wl)(s) - settle * (theta0 - heading0) * (s / max(L, 1))
    return start + np.c_[np.cos(th), np.sin(th)].cumsum(axis=0) * STEP, s


def build_terminals(rng, t0, heading0, target_length):
    """The dorsal terminals as on p. 5 of the reference pack: thick, irregular processes that fan
    medially, cross and rejoin into a lacy mesh with dark holes, plus a few thin, faint processes
    at the edge. Generated until the total length reaches the target."""
    fibres, total = [], 0.0
    add = lambda f, L: (fibres.append(f), L)[1]
    # main processes: a narrow fan, so neighbours run close, cross and touch
    angles = rng.permutation(np.linspace(-0.42, 0.34, 8) + rng.normal(0, 0.05, 8))
    i = 0
    while total < 0.8 * target_length and i < 30:
        L = min(rng.uniform(30, 50), 0.8 * target_length - total + 4)
        xy, s = wandering(t0 + rng.normal(0, 0.8, 2), heading0 + angles[i % 8] + rng.normal(0, 0.05), heading0, L, rng, amp=0.4, wl=(8, 20), settle=0.3)
        total += add(fibre(xy, s, irregular(s, rng, TERM_R, var=0.45, swell=(0.45, 1.1), every=(3.0, 7.0), swell_len=(1.2, 3.0)),
                           rng.uniform(0.8, 1.1), "terminal"), L)
        i += 1
    mains = list(fibres)
    # bridges between neighbouring processes: the mesh
    for _ in range(400):
        if total >= 0.9 * target_length:
            break
        a, b = rng.choice(len(mains), 2, replace=False)
        ia = rng.integers(len(mains[a]["s"]) // 6, len(mains[a]["s"]))
        pa = mains[a]["xy"][ia]
        d = np.hypot(*(mains[b]["xy"] - pa).T)
        ib = int(np.argmin(d))
        if not 1.4 <= d[ib] <= 6.0:
            continue
        # join a little further along the other process, so the link runs on a slant, not as a rung
        ib = int(np.clip(ib + rng.choice([-1, 1]) * rng.integers(20, 45), 0, len(mains[b]["s"]) - 1))
        pb = mains[b]["xy"][ib]
        mid = (pa + pb) / 2 + normals(np.array([pa, pb]))[0] * rng.uniform(-1.4, 1.4)
        xy, s = resample(catmull([pa, mid, pb], n=12))
        L = float(s[-1]) if len(s) else 0.0
        if L < 1.0:
            continue
        total += add(fibre(xy, s, irregular(s, rng, TERM_R * rng.uniform(0.55, 1.0), var=0.35, swell=(0.2, 0.7), every=(2.5, 5.0)),
                           rng.uniform(0.7, 1.0), "terminal"), L)
    # a few thin, faint processes wandering out from the arbor
    while target_length - total >= 3:
        src = mains[rng.integers(len(mains))]
        k = rng.integers(len(src["s"]) // 3, len(src["s"]))
        L = min(rng.uniform(8, 18), target_length - total)
        xy, s = wandering(src["xy"][k], heading0 + rng.choice([-1, 1]) * rng.uniform(0.3, 0.8), heading0, L, rng, amp=0.7, wl=(3, 9), settle=0.3)
        total += add(fibre(xy, s, irregular(s, rng, FINE_R, var=0.2, swell=(0.1, 0.4), every=(4.0, 9.0), r_min=0.25),
                           rng.uniform(0.35, 0.55), "fine"), L)
    return fibres, total


def control_mean_length():
    """Mean control terminal length: the mutant's length is set against it."""
    return float(np.mean([rng_for("control", a, 9).uniform(*CONTROL_TERM_LENGTH) for a in ANIMALS]))


# ---------- assembly ----------

def as_multi(geom):
    geom = geom.buffer(0)
    if isinstance(geom, Polygon):
        return MultiPolygon([geom])
    return MultiPolygon([g for g in geom.geoms if isinstance(g, Polygon)])


def rounded(geom, nd=3):
    m = mapping(as_multi(geom.simplify(0.02)))
    return {"type": "MultiPolygon", "coordinates": [[[[round(x, nd), round(y, nd)] for x, y in ring] for ring in poly] for poly in m["coordinates"]]}


def build(genotype: str, animal: int):
    rng = rng_for(genotype, animal, 1)
    p0 = np.array(BUNDLE_BASE[0])
    cells = build_cells(rng, p0)
    axons, neurites, cxy = build_axons(rng_for(genotype, animal, 2), cells, p0)
    t0 = np.mean([a["xy"][-1] for a in axons], axis=0)
    d = cxy[-1] - cxy[-12]
    heading0 = math.atan2(d[1], d[0]) * 0.2  # turning medially after the kink
    target = rng_for("control", animal, 9).uniform(*CONTROL_TERM_LENGTH) if genotype == "control" else \
        control_mean_length() * MUTANT_FRACTION * rng_for("mutant", animal, 9).uniform(0.96, 1.04)
    terms, term_len = build_terminals(rng_for(genotype, animal, 3), t0, heading0, target)

    somata = unary_union([c["soma"] for c in cells])
    axon = unary_union([tube_polygon(f) for f in axons + neurites]).difference(somata)
    terminals = unary_union([tube_polygon(f) for f in terms]).difference(axon.buffer(0.02)).difference(somata)
    cyto = [c["soma"].difference(c["nucleus"]) for c in cells]

    shapes = [c["nucleus"] for c in cells] + cyto + [axon, terminals]
    for i, a in enumerate(shapes):
        for b in shapes[i + 1:]:
            assert a.intersection(b).area < 1e-4, "compartments overlap"

    everything = unary_union([somata, axon, terminals])

    def view(geom, margin):
        x0, y0, x1, y1 = geom.bounds
        return [round(x0 - margin, 2), round(y0 - margin, 2), round(x1 + margin, 2), round(y1 + margin, 2)]

    mid = len(cxy) // 2
    public = {
        "case": "pdf",
        "genotype": genotype,
        "animal": animal,
        "units": "µm",
        "note": "Representative s-LNv geometry, not exact anatomy: cell bodies and axons enlarged. Shared by the generator and the viewer.",
        "bounds": view(everything, 4.0),
        "cells": [
            {
                "id": i + 1,
                "nucleus": rounded(c["nucleus"]),
                "nucleus_centre": [round(c["nucleus"].centroid.x, 3), round(c["nucleus"].centroid.y, 3)],
                "cytoplasm": rounded(cyto[i]),
            }
            for i, c in enumerate(cells)
        ],
        "axon": {"shape": rounded(axon), "centreline": np.round(cxy[::10], 3).tolist()},
        "terminals": {"shape": rounded(terminals), "area_um2": round(terminals.area, 2), "length_um": round(term_len, 2)},
        "views": {
            "nucleus": view(cells[0]["soma"], 2.0),
            "cellbody": view(somata, 3.0),
            "axon": view(LineString(cxy[mid // 2: mid + mid // 2]).buffer(5), 0),
            "terminals": view(terminals, 3.0),
        },
    }
    skeleton = {"cells": cells, "fibres": neurites + axons + terms}
    return public, skeleton


def main() -> int:
    built = {(g, a): build(g, a) for g in GENOTYPES for a in ANIMALS}
    # one frame for every image of the case, so all animals share a coordinate frame
    xs = [v[0]["bounds"] for v in built.values()]
    frame = [math.floor(min(b[0] for b in xs)) - 4, math.floor(min(b[1] for b in xs)) - 4,
             math.ceil(max(b[2] for b in xs)) + 4, math.ceil(max(b[3] for b in xs)) + 4]
    for (g, a), (public, _) in built.items():
        public["frame"] = frame
        path = SITE_DATA / "pdf" / f"geometry-{g}-{a}.json"
        path.write_text(json.dumps(public, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
        t = public["terminals"]
        print(f"wrote {path.name}: terminals {t['length_um']} µm long, {t['area_um2']} µm²")
    for old in ("geometry-control.json", "geometry-mutant.json"):
        (SITE_DATA / "pdf" / old).unlink(missing_ok=True)
    lc = np.mean([built[("control", a)][0]["terminals"]["length_um"] for a in ANIMALS])
    lm = np.mean([built[("mutant", a)][0]["terminals"]["length_um"] for a in ANIMALS])
    print(f"frame {frame}; mutant / control terminal length {lm / lc:.2f}")
    if not 0.75 <= lm / lc <= 0.85:
        print("terminal length ratio should be about 0.8", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
