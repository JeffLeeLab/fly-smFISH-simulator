"""Mushroom body geometry (Kenyon cells), one per genotype and animal, in µm:
site/data/mb/geometry-<genotype>-<animal>.json, and site/data/mb/anatomy.json (the simulated
Kenyon cells in 3D, for the descent's turn into this view).

Connectome-assisted (spec, *Geometry references*). The MaleCNS v0.9 Kenyon cells fetched by
generator.connectome_mb (one hemisphere, 150 per lobe system, 10 of them the simulated cells)
are split into regions by their position, projected at the viewer's oblique angle and merged
into outlines:
- lobes: in front of the heel (z < 178 µm). Vertical lobes (α, α′) above y = 132 µm, horizontal
  lobes (β, β′) below; γ cells have only a horizontal lobe. Each lobe system's lobes come from its
  own cells, so the three systems overlap where they lie behind one another (a projection).
- peduncle: a cylinder round its axis, from the heel to the calyx; calyx: an ellipsoid behind it;
  everything else behind the lobes is soma tracts.
- The view: tilt 35° (looking down from the front) and turn −30° (towards the side), so the cell
  bodies with the calyx, the peduncle, the vertical lobes and the horizontal lobes each have
  their own space (instructor, 2026-10-11). The lobes reach towards the midline on the right.

Representative, not exact anatomy (simplification): 30 cell bodies (10 per lobe system) are drawn
about 10 µm across (real Kenyon cell bodies are about 5 µm) and packed as a cap over the calyx,
starting from their own projected positions; each sends a soma tract into the calyx. The calyx is
drawn and simulated but never counted (instructor-only). Animals differ by a small rotation and
scale and by their packing; the mutant's anatomy is the control's (no remodelling).

The skeleton returned by build() drives the image renderer (generator/render.py): cells as in
geometry_pdf, the soma tracts as fibres, and the neuropil regions.

    uv run python -m generator.geometry_mb            # the six geometry files
    uv run python -m generator.geometry_mb --sketch docs/references/mb-compartment-sketch.png
"""

import json
import math
import sys
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi
from shapely import affinity
from shapely.geometry import MultiPolygon, Point, Polygon
from shapely.ops import unary_union
from skimage import measure

from .connectome_mb import load, project
from .geometry_pdf import as_multi, catmull, fibre, irregular, rounded, wobbly
from .paths import SITE_DATA

SEED = 20261013
GENOTYPES = ("control", "mutant")
ANIMALS = (1, 2, 3)
VIEW = (35.0, -30.0)              # tilt, turn (degrees)

# region rules, in the connectome's µm (z runs front → back, y top → bottom, x lateral → medial)
Z_LOBE = 178.0
Y_VERTICAL = 132.0
PEDUNCLE = (np.array([292.0, 152.0, 178.0]), np.array([298.0, 140.0, 248.0]), 14.0)   # axis from the heel to the calyx, radius
CALYX = (np.array([300.0, 122.0, 266.0]), np.array([30.0, 30.0, 26.0]))  # ellipsoid centre, radii
LOBE_PARTS = {"ab": ("alpha", "beta"), "apbp": ("alpha_prime", "beta_prime"), "g": ("gamma",)}

RES = 2.0                         # px per µm for tracing outlines
SOMA_R = 5.0                      # cell body radius (≈2× real)
NUC_R = (2.7, 3.1)
GAP = 0.7                         # between packed cell bodies
TRACT_R = 0.38                    # soma tract radius
WOBBLE = (2.0, 0.03)              # per animal: rotation (±°) and scale (±)


def rng_for(genotype, animal, stream):
    return np.random.default_rng([SEED, GENOTYPES.index(genotype), animal, stream])


# ---------- the connectome: regions and outlines ----------

def label(v, cls):
    x, y, z = v[:, 0], v[:, 1], v[:, 2]
    lab = np.full(len(v), "", dtype=object)
    lobe = z < Z_LOBE
    parts = LOBE_PARTS[cls]
    lab[lobe] = parts[-1]
    if len(parts) == 2:
        lab[lobe & (y < Y_VERTICAL)] = parts[0]
    a, b, rad = PEDUNCLE
    u = np.clip((v - a) @ (b - a) / ((b - a) @ (b - a)), 0, 1)
    near = np.linalg.norm(v - (a + u[:, None] * (b - a)), axis=1) <= rad
    lab[~lobe] = "tract"
    lab[~lobe & near & (z <= b[2])] = "peduncle"
    c, r = CALYX
    cal = ~lobe & ((((v - c) / r) ** 2).sum(axis=1) <= 1)
    lab[cal] = "calyx"
    return lab


@lru_cache(maxsize=None)
def connectome():
    cells = load()["cells"]
    allv = np.vstack([np.asarray(c["vertices"]) for c in cells])
    return cells, allv.mean(axis=0)


def _trace(mask):
    """A region's outline from its raster: close the gaps between fibres, drop strays, fill,
    smooth, then trace the edge (µm, in the raster's frame)."""
    disk = lambda r: (lambda yy, xx: xx * xx + yy * yy <= r * r)(*np.mgrid[-r:r + 1, -r:r + 1])
    m = ndi.binary_closing(mask, disk(6))
    m = ndi.binary_opening(m, disk(4))
    m = ndi.binary_fill_holes(m)
    lab, n = ndi.label(m)
    if n > 1:
        sizes = ndi.sum(m, lab, range(1, n + 1))
        m = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 0.15 * sizes.max()])
    m = ndi.gaussian_filter(m.astype(float), 1.5) > 0.5
    polys = [Polygon(np.c_[cc[:, 1], cc[:, 0]] - 1) for cc in measure.find_contours(np.pad(m, 1).astype(float), 0.5)]
    return unary_union([p.buffer(0) for p in polys if len(p.exterior.coords) > 8 and p.area > 16])


@lru_cache(maxsize=None)
def outlines(tilt, turn):
    """Every region's outline (shapely, µm, centred on the mushroom body) at one view, and the
    simulated cells' projected soma positions with their lobe systems."""
    cells, centre = connectome()
    proj = [project(np.asarray(c["vertices"]), tilt, turn, centre) for c in cells]
    lo = np.min([p.min(axis=0) for p in proj], axis=0) - 12
    hi = np.max([p.max(axis=0) for p in proj], axis=0) + 12
    W, H = (np.ceil((hi - lo) * RES)).astype(int)
    canvases = {}
    for c, p in zip(cells, proj):
        lab = label(np.asarray(c["vertices"]), c["class"])
        q = (p - lo) * RES
        for i, j in c["edges"]:
            if lab[i] != lab[j] or lab[i] == "tract":
                continue
            img = canvases.setdefault(lab[i], Image.new("L", (int(W), int(H)), 0))
            ImageDraw.Draw(img).line([tuple(q[i]), tuple(q[j])], fill=255, width=3)
    shapes = {}
    for name, img in canvases.items():
        g = _trace(np.asarray(img) > 0)
        shapes[name] = affinity.affine_transform(g, [1 / RES, 0, 0, 1 / RES, lo[0], lo[1]]).simplify(0.25)
    sim = [c for c in cells if c["simulated"]]
    somata = project(np.array([c["soma"] for c in sim]), tilt, turn, centre)
    return shapes, [(c["class"], tuple(s)) for c, s in zip(sim, somata)]


@lru_cache(maxsize=None)
def neuropil_segments(tilt, turn):
    """Every Kenyon cell's processes in the neuropil (calyx, peduncle, lobes; not the soma
    tracts), projected: segments (n, 2, 2) in µm and the index of the cell each belongs to."""
    cells, centre = connectome()
    segs, owner = [], []
    for k, c in enumerate(cells):
        v, e = np.asarray(c["vertices"]), np.asarray(c["edges"])
        lab = label(v, c["class"])
        keep = (lab[e[:, 0]] == lab[e[:, 1]]) & (lab[e[:, 0]] != "tract")
        segs.append(project(v, tilt, turn, centre)[e[keep]])
        owner.append(np.full(int(keep.sum()), k))
    return np.concatenate(segs).astype(np.float32), np.concatenate(owner)


def regions_at(tilt, turn):
    """The compartments at one view: lobes per lobe system (with their parts), the peduncle
    clear of the lobes, the calyx clear of the peduncle."""
    shapes, somata = outlines(tilt, turn)
    lobes = {sys_: {p: shapes[p] for p in parts} for sys_, parts in LOBE_PARTS.items()}
    all_lobes = unary_union([s for parts in lobes.values() for s in parts.values()])
    peduncle = shapes["peduncle"].difference(all_lobes.buffer(0.3))
    calyx = shapes["calyx"].difference(peduncle.buffer(0.3))
    return {"calyx": calyx, "peduncle": peduncle, "lobes": lobes}, somata


# ---------- cell bodies ----------

def pack(seeds, avoid, calyx, rng, iters=400):
    """Cell bodies as a cap over the calyx: start from the cells' own projected positions (plus
    a little jitter), then push apart until none overlap, none sit on the peduncle or lobes, and
    each overlaps the calyx by at most a sliver."""
    c0 = np.array(calyx.centroid.coords[0])
    P = c0 + (np.array(seeds, float) - c0) * 0.7 + rng.normal(0, 0.8, (len(seeds), 2))   # a compact cap
    D = 2 * SOMA_R + GAP
    for _ in range(iters):
        moved = 0.0
        d = P[:, None, :] - P[None, :, :]
        dist = np.hypot(d[..., 0], d[..., 1]) + np.eye(len(P)) * 1e9
        push = np.clip(D - dist, 0, None)[..., None] * d / dist[..., None] * 0.5
        P += push.sum(axis=1)
        moved += np.abs(push).sum()
        for i, p in enumerate(P):
            pt = Point(*p)
            for geom, keep in ((calyx, SOMA_R * 0.75), (avoid, SOMA_R + GAP)):
                inside = geom.buffer(keep - SOMA_R).contains(pt) if geom is calyx else geom.distance(pt) < keep
                if inside:
                    away = p - (c0 if geom is calyx else np.array(geom.centroid.coords[0]))
                    P[i] += away / (np.hypot(*away) + 1e-9) * 0.6
                    moved += 0.6
        if moved < 1e-3:
            break
    return P


def make_cells(centres, systems, calyx, rng):
    cells = []
    c0 = np.array(calyx.centroid.coords[0])
    for i, (c, sys_) in enumerate(zip(centres, systems)):
        soma = wobbly(c[0], c[1], SOMA_R * rng.uniform(0.94, 1.04), rng, amps=(0.06, 0.04, 0.03, 0.02))
        rn = rng.uniform(*NUC_R)
        toward = (c0 - c) / (np.hypot(*(c0 - c)) + 1e-9)
        nc = c - toward * rng.uniform(0.2, 0.6) + rng.normal(0, 0.25, 2)
        nuc = affinity.rotate(affinity.scale(wobbly(nc[0], nc[1], rn, rng, amps=(0.03, 0.02, 0.01)), rng.uniform(1.0, 1.08), rng.uniform(0.92, 1.0)),
                              rng.uniform(0, 180), origin=(nc[0], nc[1]))
        nuc = nuc.intersection(soma.buffer(-0.9))
        cells.append({"id": i + 1, "lobe_system": sys_, "soma": soma, "nucleus": nuc, "centre": c, "R": SOMA_R,
                      "exit": toward,
                      "nucleolus": (nc + rng.uniform(-0.6, 0.6, 2), rng.uniform(0.55, 0.8)),
                      "chromocentres": [(nc + rng.uniform(-1.2, 1.2, 2), rng.uniform(0.3, 0.42)) for _ in range(rng.integers(1, 3))],
                      "brightness": float(rng.uniform(0.82, 1.12))})
    return cells


def tract(cell, calyx, rng):
    """A soma tract: from the cell body into the calyx, bending a little on the way."""
    a = np.array(cell["centre"]) + cell["exit"] * SOMA_R * 0.9
    target = np.array(calyx.centroid.coords[0])
    d = target - a
    L = np.hypot(*d)
    end = a + d / L * min(L, Point(*a).distance(calyx) + rng.uniform(3, 7))
    mid = (a + end) / 2 + np.array([-d[1], d[0]]) / L * rng.uniform(-2.5, 2.5)
    xy = catmull(np.array([a, mid, end]), max(20, int(5 * L)))   # about 0.1 µm apart, as the renderer stamps
    s = np.r_[0, np.cumsum(np.hypot(*np.diff(xy, axis=0).T))]
    return fibre(xy, s, irregular(s, rng, TRACT_R, var=0.25, swell=(0.1, 0.3), r_min=0.2), float(rng.uniform(0.75, 1.0)), "fine")


# ---------- one animal ----------

def build(genotype: str, animal: int):
    rng = rng_for(genotype, animal, 0)
    (regions, seeds) = regions_at(*VIEW)
    every = unary_union([regions["calyx"], regions["peduncle"], *[s for p in regions["lobes"].values() for s in p.values()]])
    origin = tuple(every.centroid.coords[0])
    turn, scale = rng.uniform(-WOBBLE[0], WOBBLE[0]), 1 + rng.uniform(-WOBBLE[1], WOBBLE[1])
    move = lambda g: affinity.scale(affinity.rotate(g, turn, origin=origin), scale, scale, origin=origin)
    calyx, peduncle = move(regions["calyx"]), move(regions["peduncle"])
    lobes = {k: {p: move(s) for p, s in parts.items()} for k, parts in regions["lobes"].items()}
    lobe_union = {k: unary_union(list(parts.values())) for k, parts in lobes.items()}
    pts = np.array([np.array(move(Point(*xy)).coords[0]) for _, xy in seeds])
    centres = pack(pts, unary_union([peduncle, *lobe_union.values()]), calyx, rng)
    cells = make_cells(centres, [k for k, _ in seeds], calyx, rng)
    somata = unary_union([c["soma"] for c in cells])
    calyx = calyx.difference(somata.buffer(0.4))
    fibres = [tract(c, calyx, rng) for c in cells]
    # the neuropil's texture: every Kenyon cell's processes, moved with the animal, each cell at
    # its own brightness (the label is uneven from cell to cell)
    segs, owner = neuropil_segments(*VIEW)
    th = math.radians(turn)
    o = np.array(origin, np.float32)
    rot = np.array([[math.cos(th), -math.sin(th)], [math.sin(th), math.cos(th)]], np.float32)
    segs = o + ((segs - o) @ rot.T) * scale
    shine = rng.uniform(0.45, 1.0, owner.max() + 1)[owner].astype(np.float32)
    cyto = [c["soma"].difference(c["nucleus"]) for c in cells]

    def view(geom, margin):
        x0, y0, x1, y1 = geom.bounds
        return [round(x0 - margin, 2), round(y0 - margin, 2), round(x1 + margin, 2), round(y1 + margin, 2)]

    everything = unary_union([somata, calyx, peduncle, *lobe_union.values()])
    public = {
        "case": "mb",
        "genotype": genotype,
        "animal": animal,
        "units": "µm",
        "note": "Representative mushroom body geometry from MaleCNS Kenyon cells, oblique view: cell bodies enlarged; the calyx is drawn but not counted. Shared by the generator and the viewer.",
        "bounds": view(everything, 4.0),
        "cells": [
            {
                "id": c["id"],
                "lobe_system": c["lobe_system"],
                "nucleus": rounded(c["nucleus"]),
                "nucleus_centre": [round(c["nucleus"].centroid.x, 3), round(c["nucleus"].centroid.y, 3)],
                "cytoplasm": rounded(cyto[i]),
            }
            for i, c in enumerate(cells)
        ],
        "regions": {
            "calyx": {"shape": rounded(calyx), "area_um2": round(calyx.area, 2)},
            "peduncle": {"shape": rounded(peduncle), "area_um2": round(peduncle.area, 2)},
            "lobes": {k: {"shape": rounded(lobe_union[k]), "area_um2": round(lobe_union[k].area, 2),
                          "parts": {p: rounded(s) for p, s in parts.items()}} for k, parts in lobes.items()},
        },
        "views": {
            "nucleus": view(cells[0]["soma"], 2.0),
            "cellbody": view(somata, 3.0),
            "calyx": view(calyx, 3.0),
            "peduncle": view(peduncle, 3.0),
            "lobes": view(unary_union(list(lobe_union.values())), 3.0),
            **{f"lobes_{k}": view(u, 3.0) for k, u in lobe_union.items()},
        },
    }
    skeleton = {"cells": cells, "fibres": fibres, "move": {"turn": turn, "scale": scale, "origin": origin},
                "neuropil": {"shape": unary_union([calyx, peduncle, *lobe_union.values()]).buffer(0.35), "segments": segs, "shine": shine},
                "regions": [{"name": "calyx", "shape": calyx, "kind": "neuropil"},
                            {"name": "peduncle", "shape": peduncle, "kind": "neuropil"},
                            *[{"name": p, "shape": s, "kind": "neuropil"} for parts in lobes.values() for p, s in parts.items()]]}
    return public, skeleton


# ---------- the descent's 3D Kenyon cells (site/data/mb/anatomy.json) ----------

def paths_of(c):
    """A Kenyon cell's paths from its soma to its lobe tips: the farthest vertical-lobe tip and
    the farthest horizontal-lobe tip (γ cells have only the horizontal one), resampled every 2 µm."""
    v, e = np.asarray(c["vertices"]), np.asarray(c["edges"])
    lab = label(v, c["class"])
    nbr = [[] for _ in v]
    for i, j in e:
        nbr[i].append(j)
        nbr[j].append(i)
    root = int(np.argmin(np.linalg.norm(v - np.asarray(c["soma"]), axis=1)))
    dist, parent, queue = {root: 0.0}, {root: -1}, [root]
    for i in queue:   # breadth-first; the skeleton is a tree, so this is the geodesic tree
        for j in nbr[i]:
            if j not in dist:
                dist[j] = dist[i] + float(np.linalg.norm(v[j] - v[i]))
                parent[j] = i
                queue.append(j)
    parts = LOBE_PARTS[c["class"]]
    out = []
    for part in parts:
        ends = [i for i in dist if lab[i] == part]
        if not ends:
            continue
        tip = max(ends, key=lambda i: dist[i])
        chain = [tip]
        while parent[chain[-1]] != -1:
            chain.append(parent[chain[-1]])
        pts = np.vstack([np.asarray(c["soma"]), v[chain[::-1]]])
        seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
        at = np.arange(0, seg[-1], 2.0)
        out.append(np.c_[[np.interp(at, seg, pts[:, k]) for k in range(3)]].T)
    return out


def anatomy(view_skeleton):
    """The simulated cells in 3D (µm, about the connectome's centre) with their final places in
    the viewer's opening geometry (control, animal 1), so the descent can turn them from the
    front view into exactly the frame the viewer opens on."""
    cells, centre = connectome()
    sim = [c for c in cells if c["simulated"]]
    mv = view_skeleton["move"]
    return {
        "note": "MaleCNS v0.9 Kenyon cells (the 30 simulated), for the descent: project with Rx(tilt) @ Ry(turn) about `centre`, then rotate by move.turn degrees and scale by move.scale about move.origin to land on geometry-control-1.json at the view.",
        "view": {"tilt": VIEW[0], "turn": VIEW[1]},
        "centre": np.round(centre, 3).tolist(),
        "move": {"turn": round(mv["turn"], 4), "scale": round(mv["scale"], 5), "origin": [round(x, 3) for x in mv["origin"]]},
        "cells": [{
            "class": c["class"],
            "soma": np.round(np.asarray(c["soma"]), 2).tolist(),
            "at": [round(float(x), 3) for x in vc["centre"]],
            "paths": [np.round(p, 2).tolist() for p in paths_of(c)],
        } for c, vc in zip(sim, view_skeleton["cells"])],
    }


# ---------- the compartment sketch (for the instructor's annotation) ----------

def sketch(path):
    public, skel = build("control", 1)
    ink = {"ab": (46, 110, 200), "apbp": (225, 128, 30), "g": (46, 150, 80)}
    x0, y0, x1, y1 = public["bounds"]
    K = 4.0
    im = Image.new("RGB", (int((x1 - x0) * K) + 40, int((y1 - y0) * K) + 80), "white")
    dr = ImageDraw.Draw(im, "RGBA")
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 15)   # has Greek
    except OSError:
        font = ImageFont.load_default()
    _text = dr.text
    dr.text = lambda xy, t, **k: _text(xy, t, font=font, **k)
    P = lambda xy: [((x - x0) * K + 20, (y - y0) * K + 20) for x, y in xy]
    poly = lambda g, fill, line: [dr.polygon(P(p.exterior.coords), fill=fill, outline=line) for p in as_multi(g).geoms]
    poly(skel["regions"][0]["shape"], (170, 170, 170, 90), (90, 90, 90, 255))
    poly(skel["regions"][1]["shape"], (120, 120, 170, 90), (60, 60, 120, 255))
    for k, lobe in public["regions"]["lobes"].items():
        for p in lobe["parts"]:
            poly(next(r["shape"] for r in skel["regions"] if r["name"] == p), ink[k] + (60,), ink[k] + (255,))
    for f in skel["fibres"]:
        dr.line(P(f["xy"]), fill=(0, 0, 0, 120), width=1)
    for c in skel["cells"]:
        poly(c["soma"], ink[c["lobe_system"]] + (40,), (0, 0, 0, 200))
        poly(c["nucleus"], (255, 255, 255, 160), (0, 0, 0, 120))
    labels = [("calyx", "Calyx (drawn, not counted)"), ("peduncle", "Peduncle")]
    for name, text in labels:
        g = next(r["shape"] for r in skel["regions"] if r["name"] == name)
        c = g.representative_point()
        dr.text(P([(c.x, c.y)])[0], text, fill="black")
    for k, lobe in public["regions"]["lobes"].items():
        for p in lobe["parts"]:
            g = next(r["shape"] for r in skel["regions"] if r["name"] == p)
            c = g.representative_point()
            dr.text(P([(c.x, c.y)])[0], p.replace("_prime", "′").replace("alpha", "α").replace("beta", "β").replace("gamma", "γ"), fill="black")
    cb = unary_union([c["soma"] for c in skel["cells"]]).bounds
    dr.text(P([(cb[0], cb[1] - 6)])[0], "Cell bodies (30 drawn, 10 per lobe system)", fill="black")
    dr.line([(20, im.height - 30), (20 + 20 * K, im.height - 30)], fill="black", width=2)
    dr.text((30 + 20 * K, im.height - 36), f"20 µm · oblique view, tilt {VIEW[0]:g}°, turn {VIEW[1]:g}° · MaleCNS v0.9 Kenyon cells (450)", fill="black")
    im.save(path)
    print(f"wrote {path} ({im.size[0]}×{im.size[1]})")


def main(argv) -> int:
    if argv[:1] == ["--sketch"]:
        sketch(argv[1])
        return 0
    built = {(g, a): build(g, a) for g in GENOTYPES for a in ANIMALS}
    xs = [v[0]["bounds"] for v in built.values()]
    frame = [math.floor(min(b[0] for b in xs)) - 4, math.floor(min(b[1] for b in xs)) - 4,
             math.ceil(max(b[2] for b in xs)) + 4, math.ceil(max(b[3] for b in xs)) + 4]
    for (g, a), (public, _) in built.items():
        public["frame"] = frame
        path = SITE_DATA / "mb" / f"geometry-{g}-{a}.json"
        path.write_text(json.dumps(public, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
        r = public["regions"]
        print(f"wrote {path.name}: {len(public['cells'])} cells, calyx {r['calyx']['area_um2']} µm², "
              f"peduncle {r['peduncle']['area_um2']} µm², lobes {[l['area_um2'] for l in r['lobes'].values()]}")
    print(f"frame {frame} ({frame[2] - frame[0]} × {frame[3] - frame[1]} µm)")
    a = anatomy(built[("control", 1)][1])
    (SITE_DATA / "mb" / "anatomy.json").write_text(json.dumps(a, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"wrote anatomy.json: {len(a['cells'])} cells, {sum(len(c['paths']) for c in a['cells'])} paths")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
