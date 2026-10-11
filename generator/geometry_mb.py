"""PLACEHOLDER mushroom body geometry, one per genotype and animal, in µm:
site/data/mb/geometry-<genotype>-<animal>.json.

This is a crude stand-in with simple shapes, written so the pipeline (build, validate, render,
viewer) can be tested before the real anatomy is drawn. It is not the real anatomy.
- 30 Kenyon cell bodies: circles of radius 5 µm with concentric nuclei of radius 3 µm, packed in
  a 6 × 5 hexagonal-ish grid (centre spacing 10.5 µm) above the calyx, with a small seeded
  jitter (±0.3 µm) per animal. Ten cells per lobe system (ab, apbp, g), in id order.
- A calyx (ellipse about 40 × 25 µm) just below the cell cluster.
- A peduncle (10 µm band) running about 80 µm diagonally down-right from the calyx.
- Lobes: vertical α (ab) and α′ (apbp) bands going up from the peduncle's end, and horizontal
  β (ab), β′ (apbp) and γ (g) bands going right; each 10 µm wide.

Control and mutant share the same shapes; only the per-animal jitter differs between animals.
Regions are carved so that they overlap neither each other nor any soma.

x runs lateral → medial, y dorsal (top) → ventral (bottom), as on screen.

The skeleton (cell dicts and neuropil regions) is returned by build() for the image renderer
(generator/render.py), with the same keys as geometry_pdf's skeleton where render.py reads them.

    uv run python -m generator.geometry_mb
"""

import json
import math
import sys

import numpy as np
from shapely import affinity
from shapely.geometry import LineString, Point
from shapely.ops import unary_union

from .geometry_pdf import as_multi, rounded
from .paths import SITE_DATA

SEED = 20261012
GENOTYPES = ("control", "mutant")
ANIMALS = (1, 2, 3)

SOMA_R = 5.0
NUC_R = 3.0
SPACING = 10.5                  # centre spacing of the cell grid, µm
ROW_SPACING = SPACING * math.sqrt(3) / 2   # hexagonal rows
JITTER = 0.3                    # per-axis jitter, µm
MIN_CENTRE_DISTANCE = 10.0      # somata must not overlap after jitter
BAND = 10.0                     # width of the peduncle and lobe bands, µm

CALYX_CENTRE = (0.0, 37.7)
CALYX_SEMI = (20.0, 12.5)       # about 40 × 25 µm
PEDUNCLE_LENGTH = 80.0          # along the 45° diagonal, down-right
LOBE_LENGTH = 60.0              # vertical lobes: alpha, alpha_prime
LOBE_RUN = 50.0                 # horizontal lobes: beta, beta_prime, gamma

LOBE_SYSTEMS = ("ab", "apbp", "g")
CELLS_PER_SYSTEM = 10


# ---------- helpers ----------

def ellipse(cx, cy, rx, ry):
    return affinity.translate(affinity.scale(Point(0, 0).buffer(1.0, quad_segs=32), rx, ry), cx, cy)


def band(points, width=BAND):
    """A straight band of the given width along a polyline, with flat ends."""
    return LineString(points).buffer(width / 2, cap_style="flat", quad_segs=8)


def view(geom, margin):
    x0, y0, x1, y1 = geom.bounds
    return [round(x0 - margin, 2), round(y0 - margin, 2), round(x1 + margin, 2), round(y1 + margin, 2)]


def cell_centres(rng):
    """30 centres in a 6 × 5 hexagonal-ish grid, row 0 dorsal; rows alternate a 5.25 µm offset.
    The jitter is redrawn until no two somata touch (seeded, so the same every run)."""
    base = []
    for r in range(5):
        shift = -SPACING / 4 if r % 2 == 0 else SPACING / 4
        for c in range(6):
            base.append(((c - 2.5) * SPACING + shift, (r - 2) * ROW_SPACING))
    base = np.array(base)
    for _ in range(1000):
        pts = base + rng.uniform(-JITTER, JITTER, base.shape)
        d = np.hypot(*(pts[:, None, :] - pts[None, :, :]).transpose(2, 0, 1))
        np.fill_diagonal(d, np.inf)
        if d.min() >= MIN_CENTRE_DISTANCE:
            return [tuple(p) for p in pts]
    raise AssertionError("could not jitter the cell grid without touching somata")


# ---------- parts ----------

def build_cells(rng):
    centres = cell_centres(rng)
    cells = []
    for i, (cx, cy) in enumerate(centres):
        soma = Point(cx, cy).buffer(SOMA_R, quad_segs=32)
        nucleus = Point(cx, cy).buffer(NUC_R, quad_segs=32)
        system = LOBE_SYSTEMS[i // CELLS_PER_SYSTEM]
        cells.append({"id": i + 1, "lobe_system": system, "soma": soma, "nucleus": nucleus,
                      "centre": (cx, cy), "R": SOMA_R,
                      # nucleolus and chromocentres sit at the centre, as render.py expects
                      "nucleolus": ((cx, cy), 0.8),
                      "chromocentres": [((cx + 1.0, cy - 0.5), 0.4), ((cx - 0.9, cy + 0.9), 0.4)],
                      "brightness": float(rng.uniform(0.9, 1.1))})
    return cells


def build_regions():
    """Calyx, peduncle and lobe parts, before carving against each other and the somata."""
    calyx = ellipse(*CALYX_CENTRE, *CALYX_SEMI)
    end = (CALYX_CENTRE[0] + PEDUNCLE_LENGTH / math.sqrt(2), CALYX_CENTRE[1] + PEDUNCLE_LENGTH / math.sqrt(2))
    peduncle = band([CALYX_CENTRE, end])
    ex, ey = end
    # α and β meet at an L; α′ and β′ meet at a second L to the right of α; γ runs right beneath
    # the junction. The lobe bands are carved against the peduncle and calyx below.
    alpha = band([(ex - 10, 127.0), (ex - 10, ey - LOBE_LENGTH)])
    beta = band([(ex - 10, 127.0), (ex - 10 + LOBE_RUN, 127.0)])
    alpha_p = band([(ex + 10, 112.0), (ex + 10, ey - LOBE_LENGTH)])
    beta_p = band([(ex + 10, 112.0), (ex + 10 + LOBE_RUN, 112.0)])
    gamma = band([(ex + 17.5, ey), (ex + 17.5 + LOBE_RUN, ey)])
    parts = {"alpha": alpha, "beta": beta, "alpha_prime": alpha_p, "beta_prime": beta_p, "gamma": gamma}
    return calyx, peduncle, parts


GAP = 0.05                      # µm kept between neighbouring regions, so rounding in the JSON cannot overlap them


def carve(raw, taken):
    shape = raw
    for t in taken:
        shape = shape.difference(t.buffer(GAP))
    return as_multi(shape)


# ---------- assembly ----------

def build(genotype: str, animal: int):
    """(public, skeleton) for one genotype and animal. The genotype only names the file: the
    shapes are shared, and the jitter is seeded by the animal."""
    assert genotype in GENOTYPES and animal in ANIMALS
    rng = np.random.default_rng([SEED, animal])
    cells = build_cells(rng)
    somata = unary_union([c["soma"] for c in cells])

    calyx_raw, peduncle_raw, parts_raw = build_regions()
    calyx = carve(calyx_raw, [somata])
    peduncle = carve(peduncle_raw, [somata, calyx])
    taken = [somata, calyx, peduncle]
    parts = {}
    for name, raw in parts_raw.items():
        parts[name] = carve(raw, taken)
        taken.append(parts[name])
    for name, shape in parts.items():
        assert not shape.is_empty, f"lobe part {name} is empty"
    lobes = {
        "ab": {"parts": {"alpha": parts["alpha"], "beta": parts["beta"]}},
        "apbp": {"parts": {"alpha_prime": parts["alpha_prime"], "beta_prime": parts["beta_prime"]}},
        "g": {"parts": {"gamma": parts["gamma"]}},
    }
    for sysname, lobe in lobes.items():
        lobe["shape"] = unary_union(list(lobe["parts"].values())).buffer(0)

    # no overlaps between regions, or between regions and somata
    named = [("calyx", calyx), ("peduncle", peduncle)] + [(f"part {k}", v) for k, v in parts.items()]
    named += [(f"soma {c['id']}", c["soma"]) for c in cells]
    for i, (na, a) in enumerate(named):
        for nb, b in named[i + 1:]:
            if na.startswith("soma") and nb.startswith("soma"):
                continue
            assert a.intersection(b).area < 1e-4, f"{na} overlaps {nb}"

    everything = unary_union([somata, calyx, peduncle] + [v for v in parts.values()])
    lobes_all = unary_union(list(parts.values()))
    margin = 3.0

    public = {
        "case": "mb",
        "genotype": genotype,
        "animal": animal,
        "units": "µm",
        "note": "Placeholder mushroom body geometry for pipeline tests; not the real anatomy.",
        "bounds": view(everything, 4.0),
        "frame": None,  # set by main(), one frame for all six files
        "cells": [
            {
                "id": c["id"],
                "lobe_system": c["lobe_system"],
                "nucleus": rounded(c["nucleus"]),
                "nucleus_centre": [round(c["centre"][0], 3), round(c["centre"][1], 3)],
                "cytoplasm": rounded(c["soma"].difference(c["nucleus"])),
            }
            for c in cells
        ],
        "regions": {
            "calyx": {"shape": rounded(calyx), "area_um2": round(calyx.area, 2)},
            "peduncle": {"shape": rounded(peduncle), "area_um2": round(peduncle.area, 2)},
            "lobes": {
                name: {
                    "shape": rounded(lobe["shape"]),
                    "area_um2": round(lobe["shape"].area, 2),
                    "parts": {p: rounded(s) for p, s in lobe["parts"].items()},
                }
                for name, lobe in lobes.items()
            },
        },
        "views": {
            "nucleus": view(cells[0]["soma"], 2.0),
            "cellbody": view(somata, margin),
            "calyx": view(calyx, margin),
            "peduncle": view(peduncle, margin),
            "lobes": view(lobes_all, margin),
            "lobes_ab": view(lobes["ab"]["shape"], margin),
            "lobes_apbp": view(lobes["apbp"]["shape"], margin),
            "lobes_g": view(lobes["g"]["shape"], margin),
        },
    }

    # skeleton for render.py: cells keep the keys it reads; neuropil regions are plain shapes
    skeleton_regions = [{"name": "calyx", "shape": calyx, "kind": "neuropil"},
                        {"name": "peduncle", "shape": peduncle, "kind": "neuropil"}]
    skeleton_regions += [{"name": k, "shape": v, "kind": "neuropil"} for k, v in parts.items()]
    skeleton = {"cells": cells, "fibres": [], "regions": skeleton_regions}
    return public, skeleton


def main() -> int:
    built = {(g, a): build(g, a) for g in GENOTYPES for a in ANIMALS}
    # one frame for every image of the case, so all animals share a coordinate frame
    xs = [v[0]["bounds"] for v in built.values()]
    frame = [math.floor(min(b[0] for b in xs)) - 4, math.floor(min(b[1] for b in xs)) - 4,
             math.ceil(max(b[2] for b in xs)) + 4, math.ceil(max(b[3] for b in xs)) + 4]
    out_dir = SITE_DATA / "mb"
    out_dir.mkdir(parents=True, exist_ok=True)
    for (g, a), (public, _) in built.items():
        public["frame"] = frame
        path = out_dir / f"geometry-{g}-{a}.json"
        path.write_text(json.dumps(public, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
        areas = {k: v["area_um2"] for k, v in public["regions"]["lobes"].items()}
        print(f"wrote {path.name}: {len(public['cells'])} cells, calyx {public['regions']['calyx']['area_um2']} µm², "
              f"peduncle {public['regions']['peduncle']['area_um2']} µm², lobes {areas}")
    print(f"frame {frame}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
