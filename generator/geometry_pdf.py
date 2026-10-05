"""PDF neuron (s-LNv) geometry, control and mutant, in µm: site/data/pdf/geometry-<genotype>.json.

Representative, not exact anatomy (docs/spec.md, *Geometry references*): four s-LNvs on one
side, traced from the reference pack (docs/references/reference-pdf-neurons.pdf, p. 1–6) and
the instructor's compartment sketch (p. 6). Cell bodies are enlarged (15 µm across, nucleus
7 µm); the four axons run as one bundle, bend at the kink and end in the dorsal terminals,
drawn at ZT2. The mutant terminal arbor is about 20% shorter in total length.

Compartments are closed and non-overlapping: nucleus and cell-body cytoplasm per cell, one
shared axon (with centrelines) and one shared terminal arbor. x runs lateral → medial, y runs
dorsal (top) → ventral (bottom), as on screen.

    uv run python -m generator.geometry_pdf
"""

import json
import math
import sys

import numpy as np
from shapely import affinity
from shapely.geometry import LineString, MultiPolygon, Point, Polygon, mapping
from shapely.ops import unary_union

from .paths import SITE_DATA

SEED = 20260928  # geometry wobble only; molecules use their own seed

SOMA_R = 7.5      # cell body radius (spec: about 15 µm across)
NUC_R = 3.5       # nucleus radius (spec: about 7 µm)
NEURITE_W = 2.2   # primary neurite width
BUNDLE_W = 3.6    # four axons, fasciculated (spec: axon at least 2 µm wide)
TRUNK_W = 1.8     # where the bundle enters the terminals
BRANCH_W = 1.0    # terminal branches
TWIG_W = 0.8      # terminal branchlets (spec minimum 0.5 µm)
VARICOSITY_R = 0.8

# Bundle origin, where the four primary neurites meet, and the four cell bodies in a fan
# below and lateral to it (as in the reference EM reconstruction and the sketch).
P0 = (50.0, 112.0)
FAN_R = 23.5
FAN_ANGLES = (95, 135, 175, 215)  # degrees, y pointing down

# Axon bundle: up from P0, the kink, then into the dorsal terminals at T0.
BUNDLE = [P0, (53.5, 92), (54.5, 72), (55.0, 52), (58.5, 35), (64.5, 24), (70.5, 17.5), (76.0, 14.0)]

TRUNK = [(76.0, 14.0), (80.0, 13.6)]  # where the bundle splays into the terminal fibres
FIBRE_W = 1.1
BRANCHES = {  # name: (polyline, width); fibres fan out medially (right), beaded, as in the p. 5 confocal
    "f1": ([(80.0, 13.6), (89.0, 9.0), (98.0, 6.2), (108.0, 4.6), (118.0, 4.2), (126.0, 5.6)], FIBRE_W),
    "f2": ([(80.0, 13.6), (91.0, 12.4), (102.0, 11.2), (113.0, 10.8), (124.0, 11.8), (131.0, 10.6)], FIBRE_W),
    "f3": ([(80.0, 13.6), (90.0, 16.2), (100.0, 17.4), (110.0, 18.0), (120.0, 20.2)], FIBRE_W),
    "f4": ([(80.0, 13.6), (88.0, 20.2), (96.0, 24.4), (105.0, 27.0), (113.0, 28.2)], FIBRE_W),
    "f5": ([(84.0, 11.6), (89.0, 4.6), (96.0, 1.0)], BRANCH_W),
    "t1": ([(98.0, 6.2), (101.0, 1.2)], TWIG_W),
    "t2": ([(108.0, 4.6), (112.0, 1.0)], TWIG_W),
    "t3": ([(102.0, 11.2), (106.0, 14.4)], TWIG_W),
    "t4": ([(113.0, 10.8), (117.0, 7.6)], TWIG_W),
    "t5": ([(110.0, 18.0), (113.0, 23.2)], TWIG_W),
    "t6": ([(96.0, 24.4), (95.0, 29.6)], TWIG_W),
    "t7": ([(120.0, 20.2), (126.0, 17.4)], TWIG_W),
}
# Mutant: slightly less branched at ZT2 (spec: about 20% less total terminal length).
MUTANT_DROP = {"t3", "t5", "t7", "f5"}
MUTANT_TRIM = {"f4": 0.75, "f3": 0.85}  # keep this fraction of the fibre length


def wobbly_disc(cx, cy, r, rng, amp=0.07, n=96):
    """A cell-like outline: a circle with smooth, seeded low-frequency wobble."""
    phases = rng.uniform(0, 2 * math.pi, 3)
    amps = np.array([amp, amp * 0.6, amp * 0.35]) * rng.uniform(0.6, 1.0, 3)
    th = np.linspace(0, 2 * math.pi, n, endpoint=False)
    rr = r * (1 + sum(a * np.cos((k + 1) * th + p) for k, (a, p) in enumerate(zip(amps, phases))))
    return Polygon(np.c_[cx + rr * np.cos(th), cy + rr * np.sin(th)])


def tube(points, width, rng, wobble=0.12, step=0.4):
    """A neurite: discs along a densely sampled centreline, radius varying smoothly."""
    line = LineString(points)
    n = max(2, int(line.length / step))
    ds = np.linspace(0, line.length, n)
    # smooth noise: sum of a few sinusoids along the length
    ph = rng.uniform(0, 2 * math.pi, 3)
    wl = rng.uniform(5, 14, 3)
    noise = sum(np.sin(2 * math.pi * ds / w + p) for w, p in zip(wl, ph)) / 3
    radii = (width / 2) * (1 + wobble * noise)
    discs = [line.interpolate(d).buffer(r, quad_segs=6) for d, r in zip(ds, radii)]
    return unary_union(discs)


def varicosities(points, rng, spacing=2.8, r=VARICOSITY_R):
    line = LineString(points)
    ds = np.arange(spacing * rng.uniform(0.3, 1.0), line.length, spacing)
    return [line.interpolate(d).buffer(r * rng.uniform(0.85, 1.15), quad_segs=8) for d in ds]


def trimmed(points, keep):
    line = LineString(points)
    cut = line.length * keep
    out, acc = [points[0]], 0.0
    for a, b in zip(points, points[1:]):
        seg = math.dist(a, b)
        if acc + seg >= cut:
            t = (cut - acc) / seg
            out.append((a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])))
            return out
        out.append(b)
        acc += seg
    return out


def as_multi(geom):
    geom = geom.buffer(0)
    if isinstance(geom, Polygon):
        return MultiPolygon([geom])
    return MultiPolygon([g for g in geom.geoms if isinstance(g, Polygon)])


def rounded(geom, nd=3):
    m = mapping(as_multi(geom.simplify(0.03)))
    return {"type": "MultiPolygon", "coordinates": [[[[round(x, nd), round(y, nd)] for x, y in ring] for ring in poly] for poly in m["coordinates"]]}


def build(genotype: str) -> dict:
    rng = np.random.default_rng(SEED)  # same somata, nuclei and axon in both genotypes

    cells, somata = [], []
    for i, ang in enumerate(FAN_ANGLES, start=1):
        a = math.radians(ang)
        cx, cy = P0[0] + FAN_R * math.cos(a), P0[1] + FAN_R * math.sin(a)
        soma = wobbly_disc(cx, cy, SOMA_R, rng)
        # nucleus: slightly elliptical, a little off centre, away from the neurite
        off = rng.uniform(0.4, 1.0)
        nx, ny = cx - off * math.cos(a) * 0.8, cy - off * math.sin(a) * 0.8
        nuc = affinity.rotate(affinity.scale(wobbly_disc(nx, ny, NUC_R, rng, amp=0.03), 1.06, 0.95), rng.uniform(0, 180), origin=(nx, ny))
        somata.append(soma)
        cells.append({"id": i, "centre": (cx, cy), "nucleus": nuc, "soma": soma, "angle": a})

    soma_union = unary_union(somata)
    neurites, centrelines = [], []
    for c in cells:
        cx, cy = c["centre"]
        a = c["angle"]
        start = (cx - (SOMA_R - 1.5) * math.cos(a), cy - (SOMA_R - 1.5) * math.sin(a))
        mid = ((start[0] + P0[0]) / 2 + rng.uniform(-1, 1), (start[1] + P0[1]) / 2 + rng.uniform(-1, 1))
        pts = [start, mid, P0]
        neurites.append(tube(pts, NEURITE_W, rng))
        centrelines.append([list(p) for p in pts])
    bundle = tube(BUNDLE, BUNDLE_W, rng, wobble=0.1)
    centrelines.append([list(p) for p in BUNDLE])
    axon = unary_union(neurites + [bundle]).difference(soma_union)

    # terminals: the genotype-specific part; a separate stream so the axon stays identical
    trng = np.random.default_rng(SEED + 1)
    parts, term_lines = [], [TRUNK]
    parts.append(tube(TRUNK, TRUNK_W, trng, wobble=0.15))
    for name, (pts, w) in BRANCHES.items():
        if genotype == "mutant":
            if name in MUTANT_DROP:
                continue
            if name in MUTANT_TRIM:
                pts = trimmed(pts, MUTANT_TRIM[name])
        parts.append(tube(pts, w, trng, wobble=0.15))
        parts += varicosities(pts, trng)
        term_lines.append(pts)
    terminals = unary_union(parts).difference(axon).difference(soma_union)

    # checks: closed, non-overlapping, minimum width respected by construction
    shapes = [c["nucleus"] for c in cells] + [c["soma"].difference(c["nucleus"]) for c in cells] + [axon, terminals]
    for i, a in enumerate(shapes):
        for b in shapes[i + 1:]:
            assert a.intersection(b).area < 1e-6, "compartments overlap"
    for c in cells:
        assert c["soma"].contains(c["nucleus"]), "nucleus outside its cell body"

    term_len = sum(LineString(p).length for p in term_lines)
    everything = unary_union(somata + [axon, terminals])
    minx, miny, maxx, maxy = everything.bounds
    pad = 4.0

    def view(geom, margin=3.0):
        x0, y0, x1, y1 = geom.bounds
        return [round(x0 - margin, 2), round(y0 - margin, 2), round(x1 + margin, 2), round(y1 + margin, 2)]

    return {
        "case": "pdf",
        "genotype": genotype,
        "units": "µm",
        "note": "Representative s-LNv geometry, not exact anatomy: cell bodies and axons enlarged; four axons drawn as one bundle. Shared by the generator and the viewer.",
        "bounds": [round(minx - pad, 2), round(miny - pad, 2), round(maxx + pad, 2), round(maxy + pad, 2)],
        "cells": [
            {
                "id": c["id"],
                "nucleus": rounded(c["nucleus"]),
                "nucleus_centre": [round(c["nucleus"].centroid.x, 3), round(c["nucleus"].centroid.y, 3)],
                "nucleus_radius": NUC_R,
                "cytoplasm": rounded(c["soma"].difference(c["nucleus"])),
            }
            for c in cells
        ],
        "axon": {"shape": rounded(axon), "centrelines": [[[round(x, 3), round(y, 3)] for x, y in l] for l in centrelines]},
        "terminals": {
            "shape": rounded(terminals),
            "area_um2": round(terminals.area, 2),
            "length_um": round(term_len, 2),
            "centrelines": [[[round(x, 3), round(y, 3)] for x, y in l] for l in term_lines],
        },
        # fly-to targets, in compartment order (viewer buttons and plot axis use the same names)
        "views": {
            "nucleus": view(cells[1]["soma"], 2.0),
            "cellbody": view(soma_union, 3.0),
            "axon": view(LineString(BUNDLE[1:6]).buffer(4)),
            "terminals": view(terminals, 3.0),
        },
    }


def main() -> int:
    out = {}
    for g in ("control", "mutant"):
        out[g] = build(g)
        path = SITE_DATA / "pdf" / f"geometry-{g}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(out[g], ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
        t = out[g]["terminals"]
        print(f"wrote {path.name}: terminal length {t['length_um']} µm, area {t['area_um2']} µm²")
    ratio = out["mutant"]["terminals"]["length_um"] / out["control"]["terminals"]["length_um"]
    print(f"mutant / control terminal length: {ratio:.2f}")
    if not 0.75 <= ratio <= 0.85:
        print("terminal length ratio should be about 0.8", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
