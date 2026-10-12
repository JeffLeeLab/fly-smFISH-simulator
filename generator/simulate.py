"""Molecules and the TDP-43 layer for one case, genotype and animal, from a seed.

Two stages, so the seed search is fast: draw() makes every molecule's identity (compartment,
cell, isoform, nascent or mature, the regions it carries); place() then builds the TDP-43 layer
(granules and aggregates) and gives each molecule a position inside its geometry compartment,
from the same random stream: granule cargo on a granule, and nothing inside an aggregate.
"""

from dataclasses import dataclass

import numpy as np
import shapely
from shapely.geometry import Point, Polygon
from shapely.ops import unary_union

from .model import Case, nascent_scale


@dataclass
class Molecules:
    genotype: str
    animal: int
    factor: float
    comp: np.ndarray       # compartment code (Case.comp_index)
    cell: np.ndarray       # source cell 0..n-1 (shared compartments too: each molecule came from one cell)
    iso: np.ndarray        # isoform index
    nascent: np.ndarray    # bool: part of a transcription site
    mask: np.ndarray       # uint8: bit i set if the molecule carries region i
    intensity: np.ndarray  # relative spot brightness
    ts_active: np.ndarray  # per cell: bool
    # filled by place()
    x: np.ndarray = None
    y: np.ndarray = None
    ts_xy: np.ndarray = None
    tdp43: dict = None
    on_granule: np.ndarray = None  # bool: placed on a TDP-43 transport granule (granule cargo)
    overlap: np.ndarray = None   # bool: within the overlap distance of a TDP-43 granule
    chance: np.ndarray = None    # per molecule: probability that a random point in its compartment overlaps


def draw(case: Case, genotype: str, animal: int, rng: np.random.Generator) -> Molecules:
    p = case.params
    f = max(0.6, rng.normal(1.0, p["animal_sd"]))
    per = case.mature_per_cell(genotype)
    layout, ci = case.layout, case.comp_index
    mix = {c.id: case.mature_mix(genotype, c.id) for c in layout.compartments}
    prod = case.production(genotype)
    k = nascent_scale(case)
    nbits = len(case.regions)
    bits = 1 << np.arange(nbits)
    mature_mask = np.array([case.mature_masks[i.name] for i in case.isoforms], dtype=np.uint8)

    comp, cell, iso, nas, mask = [], [], [], [], []
    ts_active = np.zeros(p["cells"], dtype=bool)
    for c in range(p["cells"]):
        for cp in layout.compartments:
            n = rng.poisson(per[cp.id] * f)
            ii = rng.choice(len(case.isoforms), size=n, p=mix[cp.id])
            comp.append(np.full(n, ci[cp.id]))
            cell.append(np.full(n, c))
            iso.append(ii)
            nas.append(np.zeros(n, dtype=bool))
            mask.append(mature_mask[ii])
        ts_active[c] = rng.random() < p["ts_active"]
        if ts_active[c]:
            for ii, isoform in enumerate(case.isoforms):
                n = rng.poisson(k * prod[ii] * isoform.length * f)
                pol = rng.uniform(0, isoform.length, n)
                d = np.array([isoform.distance(r.mid) for r in case.regions])
                valid = (d >= 0) & (d <= isoform.length)
                carried = (pol[:, None] >= d[None, :]) & valid[None, :]
                comp.append(np.full(n, ci["nucleus"]))
                cell.append(np.full(n, c))
                iso.append(np.full(n, ii))
                nas.append(np.ones(n, dtype=bool))
                mask.append((carried * bits).sum(axis=1).astype(np.uint8))

    cat = lambda xs, dt: np.concatenate(xs).astype(dt) if xs else np.zeros(0, dt)
    m = Molecules(
        genotype, animal, f,
        cat(comp, np.int8), cat(cell, np.int8), cat(iso, np.int8), cat(nas, bool), cat(mask, np.uint8),
        None, ts_active,
    )
    m.intensity = np.clip(rng.normal(1.0, p["spot_intensity_sd"], m.comp.size), 0.7, 1.3)
    return m


def _checked(case, geom, n, comp_id, where):
    """geom, unless molecules are to go into an empty shape (a geometry fault, not a draw)."""
    if n > 0 and (geom.is_empty or geom.area <= 0):
        raise ValueError(f"{case.id}: {n} molecules to place in an empty {comp_id} shape ({where})")
    return geom


def _uniform_in(geom, n, rng, prepared=True):
    """n points uniformly inside a polygon (rejection sampling in its bounding box)."""
    if n == 0:
        return np.zeros((0, 2))
    if prepared:
        shapely.prepare(geom)
    x0, y0, x1, y1 = geom.bounds
    out = []
    need = n
    frac = max(geom.area / ((x1 - x0) * (y1 - y0)), 0.02)
    while need > 0:
        k = int(need / frac * 1.3) + 8
        xs, ys = rng.uniform(x0, x1, k), rng.uniform(y0, y1, k)
        ok = shapely.contains_xy(geom, xs, ys)
        pts = np.c_[xs[ok], ys[ok]][:need]
        out.append(pts)
        need -= len(pts)
    return np.vstack(out)


def _aggregate(cx, cy, area, inside, rng):
    """One TDP-43 aggregate's body: an irregular, lobed outline of about `area` µm², kept inside
    `inside`. render.py fills it with bright and dark patches; mRNA stays out of it."""
    R = np.sqrt(area / np.pi)
    th = np.linspace(0, 2 * np.pi, 120, endpoint=False)
    k = np.arange(2, 7)
    amp = rng.uniform(0.05, 0.18, k.size)
    ph = rng.uniform(0, 2 * np.pi, k.size)
    rr = R * (1 + (amp[:, None] * np.cos(k[:, None] * th + ph[:, None])).sum(axis=0))
    stretch, ang = rng.uniform(1.0, 1.6), rng.uniform(0, np.pi)
    u, v = rr * np.cos(th) * stretch, rr * np.sin(th) / stretch
    body = Polygon(np.c_[cx + u * np.cos(ang) - v * np.sin(ang), cy + u * np.sin(ang) + v * np.cos(ang)]).buffer(0)
    body = body.intersection(inside)
    if body.geom_type != "Polygon":
        body = max(getattr(body, "geoms", [body]), key=lambda b: b.area)
    return body


def _tdp43(case: Case, m: Molecules, g: dict, rng: np.random.Generator) -> dict:
    """The TDP-43 layer: diffuse nuclear and cytoplasmic levels per cell (drawn into the image by
    render.py), transport granules (the same density in both genotypes) and, in the mutant, a few
    dense aggregates around the nucleus (drawn into the image too)."""
    t = case.params["tdp43"]
    gt = t[m.genotype]
    cells = len(g["nuclei"])
    nuclear = [round(float(gt["nuclear"] * rng.normal(1, 0.05)), 3) for _ in range(cells)]
    cytoplasmic = [round(float(gt["cytoplasmic"] * rng.normal(1, 0.05)), 3) for _ in range(cells)]

    layout = case.layout
    aggregates, footprints = [], []
    for c, (nuc, cyto) in enumerate(zip(g["nuclei"], g["cytoplasm"])):
        lo, hi = gt["aggregates"]
        k = int(rng.integers(lo, hi + 1)) if any(cp.aggregates for cp in layout.compartments) else 0
        if k == 0:
            footprints.append(None)
            continue
        areas = sorted(rng.uniform(*t["aggregate_area_um2"], k), reverse=True)  # largest first, so they find room
        inside = cyto.buffer(-0.3)
        mine = []
        for area in areas:
            R = np.sqrt(area / np.pi)
            shell = cyto.intersection(nuc.buffer(t["aggregate_shell_um"])).buffer(-0.7 * R)
            if mine:
                shell = shell.difference(unary_union([a["shape"] for a in mine]).buffer(R + 0.3))
            if shell.is_empty or shell.area < 0.05:
                continue
            (px, py), = _uniform_in(shell, 1, rng)
            mine.append({"cell": c, "shape": _aggregate(px, py, area, inside, rng),
                         "grey": float(t["aggregate_grey"] * rng.normal(1, 0.1))})
        aggregates += mine
        footprints.append(unary_union([a["shape"] for a in mine]) if mine else None)

    granules = []  # (x, y, radius, peak brightness, compartment)
    inset = case.params.get("granule_inset_um", 0.4)
    for cp in layout.compartments:
        if cp.granules == "per_cell":
            for c, shp in enumerate(g["per_cell"][cp.id]):
                free = shp.buffer(-inset)
                if cp.aggregates and footprints[c] is not None:
                    free = free.difference(footprints[c].buffer(0.5))
                for (px, py) in _uniform_in(free, rng.poisson(t["granules_per_cell_body"]), rng):
                    granules.append((float(px), float(py), float(rng.uniform(*t["granule_radius_um"])), float(t["granule_peak"] * rng.normal(1, 0.15)), cp.id))
    density = gt.get("granule_density_um2", t.get("granule_density_um2"))
    for cp in layout.compartments:
        if cp.granules == "density":
            for unit, shp in g["shared"][cp.id]:
                inner = shp.buffer(-0.15)
                for (px, py) in _uniform_in(inner, rng.poisson(density[cp.id] * shp.area), rng):
                    granules.append((float(px), float(py), float(rng.uniform(*t["granule_radius_um"])), float(t["granule_peak"] * rng.normal(1, 0.15)), cp.id))
    return {"nuclear": nuclear, "cytoplasmic": cytoplasmic, "granules": granules, "aggregates": aggregates, "footprints": footprints}


def place(case: Case, m: Molecules, rng: np.random.Generator) -> Molecules:
    p = case.params
    g = case.geometry[(m.genotype, m.animal)]  # every animal has its own neurons
    n = m.comp.size
    xy = np.zeros((n, 2))
    m.tdp43 = _tdp43(case, m, g, rng)
    m.on_granule = np.zeros(n, dtype=bool)

    # transcription-site centres: well inside each nucleus
    ts_inset = p.get("ts_inset_um", 1.2)
    m.ts_xy = np.array([_uniform_in(nuc.buffer(-ts_inset), 1, rng)[0] for nuc in g["nuclei"]])

    layout, ci = case.layout, case.comp_index
    per_cell = [cp for cp in layout.compartments if cp.kind == "per_cell"]
    cell_unit = {name: np.array(u) for name, u in g["units"].items()}
    for c in range(p["cells"]):
        for cp in per_cell:
            sel = (m.cell == c) & (m.comp == ci[cp.id]) & ~m.nascent
            shp = g["per_cell"][cp.id][c]
            fp = m.tdp43["footprints"][c] if cp.aggregates else None
            if fp is not None:
                shp = shp.difference(fp)  # none in aggregates
            xy[sel] = _uniform_in(_checked(case, shp, sel.sum(), cp.id, f"cell {c}"), sel.sum(), rng)
            if cp.id == "nucleus":  # nascent transcripts cluster at the transcription site
                sel = (m.cell == c) & m.nascent
                xy[sel] = m.ts_xy[c] + rng.normal(0, p["ts_spread_um"], (sel.sum(), 2))
    for cp in layout.compartments:
        if cp.kind != "shared":
            continue
        for unit, shp in g["shared"][cp.id]:
            here = m.comp == ci[cp.id]
            if unit is not None:  # each cell's molecules go to the unit that cell feeds
                here = here & (cell_unit[cp.units][m.cell] == unit)
            sel = np.flatnonzero(here)
            xy[sel] = _uniform_in(_checked(case, shp, sel.size, cp.id, unit), sel.size, rng)
            # granule cargo: the same share in both genotypes, each molecule on one granule of the compartment
            G = np.array([gr[:2] for gr in m.tdp43["granules"] if gr[4] == cp.id and (unit is None or shp.contains(Point(gr[0], gr[1])))])
            if len(G) and sel.size:
                cargo = sel[rng.random(sel.size) < p["granule_cargo"].get(cp.id, 0.0)]
                shapely.prepare(shp)
                for i in cargo:
                    cx, cy = G[rng.integers(len(G))]
                    for _ in range(20):
                        px, py = rng.normal((cx, cy), p["cargo_spread_um"])
                        if shapely.contains_xy(shp, px, py):
                            break
                    else:
                        px, py = cx, cy
                    xy[i] = (px, py)
                m.on_granule[cargo] = True
    m.x, m.y = xy[:, 0], xy[:, 1]

    # overlap with granules (aggregates aren't counted), and the chance level for a random
    # position in the same compartment
    granules = m.tdp43["granules"]
    reach = p["overlap_um"]
    m.overlap = np.zeros(n, dtype=bool)
    if granules:
        P = np.array([gr[:3] for gr in granules])
        dist = np.hypot(m.x[:, None] - P[None, :, 0], m.y[:, None] - P[None, :, 1]) - P[None, :, 2]
        m.overlap = (dist <= reach).any(axis=1)
    zones = unary_union([Point(px, py).buffer(r + reach, quad_segs=16) for px, py, r, _, _ in granules]) if granules else None
    chance_by = {}

    def chance_in(geom):
        return zones.intersection(geom).area / geom.area if zones is not None and geom.area > 0 else 0.0

    for cp in layout.compartments:
        if cp.kind == "per_cell":
            for c, geom in enumerate(g["per_cell"][cp.id]):
                chance_by[(ci[cp.id], c)] = chance_in(geom)
        else:
            for unit, geom in g["shared"][cp.id]:
                chance_by[(ci[cp.id], unit)] = chance_in(geom)
    shared_unit = {ci[cp.id]: cp.units for cp in layout.compartments if cp.kind == "shared"}

    def key(cp, cl):
        if cp not in shared_unit:
            return (cp, cl)
        return (cp, cell_unit[shared_unit[cp]][cl] if shared_unit[cp] else None)

    m.chance = np.array([chance_by[key(int(cp), int(cl))] for cp, cl in zip(m.comp, m.cell)])
    return m
