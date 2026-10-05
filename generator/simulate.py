"""Molecules and the TDP-43 layer for one case, genotype and animal, from a seed.

Two stages, so the seed search is fast: draw() makes every molecule's identity (compartment,
cell, isoform, nascent or mature, the regions it carries); place() then gives each a position
inside its geometry compartment and builds the TDP-43 layer from the same random stream.
"""

from dataclasses import dataclass

import numpy as np
import shapely
from shapely.geometry import Point
from shapely.ops import unary_union

from .model import COMP, Case, nascent_scale


@dataclass
class Molecules:
    genotype: str
    animal: int
    factor: float
    comp: np.ndarray       # compartment code (model.COMPARTMENTS)
    cell: np.ndarray       # source cell 0..n-1 (axon and terminals are shared, but each molecule came from one cell)
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
    overlap: np.ndarray = None   # bool: within the overlap distance of a TDP-43 punctum
    chance: np.ndarray = None    # per molecule: probability that a random point in its compartment overlaps


def draw(case: Case, genotype: str, animal: int, rng: np.random.Generator) -> Molecules:
    p = case.params
    f = max(0.6, rng.normal(1.0, p["animal_sd"]))
    per = p["mature_per_cell"][genotype]
    shares = np.array([i.share for i in case.isoforms])
    k = nascent_scale(case)
    nbits = len(case.regions)
    bits = 1 << np.arange(nbits)
    mature_mask = np.array([case.mature_masks[i.name] for i in case.isoforms], dtype=np.uint8)

    comp, cell, iso, nas, mask = [], [], [], [], []
    ts_active = np.zeros(p["cells"], dtype=bool)
    for c in range(p["cells"]):
        for name in ("nucleus", "cellbody", "axon", "terminals"):
            n = rng.poisson(per[name] * f)
            ii = rng.choice(len(shares), size=n, p=shares)
            comp.append(np.full(n, COMP[name]))
            cell.append(np.full(n, c))
            iso.append(ii)
            nas.append(np.zeros(n, dtype=bool))
            mask.append(mature_mask[ii])
        ts_active[c] = rng.random() < p["ts_active"]
        if ts_active[c]:
            for ii, isoform in enumerate(case.isoforms):
                n = rng.poisson(k * isoform.share * isoform.length * f)
                pol = rng.uniform(0, isoform.length, n)
                d = np.array([isoform.distance(r.mid) for r in case.regions])
                valid = (d >= 0) & (d <= isoform.length)
                carried = (pol[:, None] >= d[None, :]) & valid[None, :]
                comp.append(np.full(n, COMP["nucleus"]))
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


def place(case: Case, m: Molecules, rng: np.random.Generator) -> Molecules:
    p = case.params
    g = case.geometry[m.genotype]
    n = m.comp.size
    xy = np.zeros((n, 2))

    # transcription-site centres: well inside each nucleus
    m.ts_xy = np.array([_uniform_in(nuc.buffer(-1.2), 1, rng)[0] for nuc in g["nuclei"]])

    for c in range(p["cells"]):
        sel = (m.cell == c) & (m.comp == COMP["nucleus"]) & ~m.nascent
        xy[sel] = _uniform_in(g["nuclei"][c], sel.sum(), rng)
        sel = (m.cell == c) & m.nascent
        xy[sel] = m.ts_xy[c] + rng.normal(0, p["ts_spread_um"], (sel.sum(), 2))
        sel = (m.cell == c) & (m.comp == COMP["cellbody"])
        xy[sel] = _uniform_in(g["cytoplasm"][c], sel.sum(), rng)
    for name in ("axon", "terminals"):
        sel = m.comp == COMP[name]
        xy[sel] = _uniform_in(g[name], sel.sum(), rng)
    m.x, m.y = xy[:, 0], xy[:, 1]

    # TDP-43: diffuse nuclear signal plus perinuclear puncta
    t = p["tdp43"]
    nuclear = [round(float(t[m.genotype]["nuclear"] * rng.normal(1, 0.05)), 3) for _ in g["nuclei"]]
    puncta = []
    for c, (nuc, cyto) in enumerate(zip(g["nuclei"], g["cytoplasm"])):
        k = rng.poisson(t[m.genotype]["perinuclear_puncta"])
        shell = cyto.intersection(nuc.buffer(t["perinuclear_shell_um"])).buffer(-0.3)
        for (px, py) in _uniform_in(shell, k, rng):
            puncta.append((float(px), float(py), float(rng.uniform(*t["punctum_radius_um"])), float(rng.normal(1, 0.15)), c))
    m.tdp43 = {"nuclear": nuclear, "puncta": puncta}

    # overlap with puncta, and the chance level for a random position in the same compartment
    reach = p["overlap_um"]
    m.overlap = np.zeros(n, dtype=bool)
    if puncta:
        P = np.array([pt[:3] for pt in puncta])
        dist = np.hypot(m.x[:, None] - P[None, :, 0], m.y[:, None] - P[None, :, 1]) - P[None, :, 2]
        m.overlap = (dist <= reach).any(axis=1)
    zones = unary_union([Point(px, py).buffer(r + reach, quad_segs=16) for px, py, r, _, _ in puncta]) if puncta else None
    chance_by = {}
    for c in range(p["cells"]):
        for name, geom in (("nucleus", g["nuclei"][c]), ("cellbody", g["cytoplasm"][c])):
            chance_by[(COMP[name], c)] = zones.intersection(geom).area / geom.area if zones is not None else 0.0
    for name in ("axon", "terminals"):
        chance_by[(COMP[name], -1)] = zones.intersection(g[name]).area / g[name].area if zones is not None else 0.0
    shared = np.isin(m.comp, [COMP["axon"], COMP["terminals"]])
    m.chance = np.array([chance_by[(int(cp), -1 if sh else int(cl))] for cp, cl, sh in zip(m.comp, m.cell, shared)])
    return m


def simulate(case: Case, seed: int, positions: bool = True) -> list:
    """All datasets for a case: [control animal 1..n, mutant animal 1..n]."""
    out = []
    for gi, genotype in enumerate(("control", "mutant")):
        for a in range(case.params["animals"]):
            rng = np.random.default_rng([seed, gi, a])
            m = draw(case, genotype, a + 1, rng)
            if positions:
                place(case, m, rng)
            out.append(m)
    return out
