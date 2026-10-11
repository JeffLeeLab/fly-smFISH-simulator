"""Pre-computed results for every single probe and all 56 ordered probe pairs.

For each selection, genotype, animal and channel (ch1 = carries region A, ch2 = carries B,
both = carries both), the raw counts the measures are built from, and the measures themselves:
  count         per compartment, by the layout's count_unit: per cell (mean of the cells), per animal
                (the raw total) or per unit (total / units; the per-unit totals are in raw.units)
  per_area      terminal spots per 100 µm² of terminal area
  nc_ratio      nucleus / cell body (all cells)
  share_distal  (axon + terminals) / (cell body + axon + terminals)
  ts_number     nuclei with a transcription site (at least ts_detect_min nascent molecules)
  ts_intensity  mean nascent molecules per counted site
  overlap       per compartment (cell body, axon, terminals): share of spots within the overlap
                distance of a TDP-43 transport granule (aggregates aren't counted), with the
                randomised-position level (`chance`) for the same spots
Mean and SD across animals are added per genotype. The site, plot and table read only this.
"""

import itertools

import numpy as np

from .cases import LAYOUTS
from .model import mask_has


def selections(case):
    ids = [r.id for r in case.regions]
    out = [((i,), (ids[i],)) for i in range(len(ids))]
    out += [((a, b), (ids[a], ids[b])) for a, b in itertools.permutations(range(len(ids)), 2)]
    return out


def _layout(case):
    return LAYOUTS[case.id]


def _units_of(case, layout, m, comp):
    """Unit id of every cell, for a compartment split into units (MB lobes)."""
    g = case.geometry[(m.genotype, m.animal)]
    return g["units"][comp.units]


def _raw(case, m, bits):
    layout = _layout(case)
    code = {c.id: i for i, c in enumerate(layout.compartments)}  # molecule comp codes follow the layout
    det = mask_has(m.mask, bits)
    mature = det & ~m.nascent
    per_cell = [c for c in layout.compartments if c.kind == "per_cell"]
    cells = []
    for c in range(case.params["cells"]):
        here = m.cell == c
        cell = {comp.id: int((mature & here & (m.comp == code[comp.id])).sum()) for comp in per_cell}
        cell["ts"] = int((det & here & m.nascent).sum())
        cells.append(cell)
    raw = {"cells": cells}
    unit_totals = {}
    for comp in layout.compartments:
        if comp.kind != "shared":
            continue
        here = mature & (m.comp == code[comp.id])
        raw[comp.id] = int(here.sum())
        if comp.units:
            ids = layout.unit_sets[comp.units]["ids"]
            of_cell = _units_of(case, layout, m, comp)
            unit_of_mol = np.array([ids.index(of_cell[c]) for c in range(len(of_cell))])[m.cell]
            unit_totals[comp.id] = [int((here & (unit_of_mol == i)).sum()) for i in range(len(ids))]
    if unit_totals:
        raw["units"] = unit_totals
    if m.overlap is not None:
        raw["overlap"] = {}
        for comp in layout.compartments:
            if not comp.overlap:
                continue
            here = mature & (m.comp == code[comp.id])
            raw["overlap"][comp.id] = [int((m.overlap & here).sum()), int(here.sum()), round(float(m.chance[here].sum()), 4)]
    return raw


def _measures(case, raw, area):
    layout = _layout(case)
    cells = raw["cells"]
    n = len(cells)
    total = {c.id: (sum(x[c.id] for x in cells) if c.kind == "per_cell" else raw[c.id]) for c in layout.compartments}
    detect = case.params["ts_detect_min"]
    sites = [c["ts"] for c in cells if c["ts"] >= detect]
    count = {}
    for c in layout.compartments:
        if c.count_unit == "cell":
            count[c.id] = total[c.id] / n
        elif c.count_unit == "animal":
            count[c.id] = raw[c.id]
        else:
            count[c.id] = total[c.id] / len(layout.unit_sets[c.units]["ids"])
    cb = total["cellbody"]
    distal = sum(total[p] for p in layout.pools["distal"])
    cytoplasm = sum(total[p] for p in layout.pools["cytoplasm"])
    available = {
        "count": count,
        "nc_ratio": total["nucleus"] / cb if cb else None,
        "share_distal": distal / cytoplasm if cytoplasm else None,
        "ts_number": len(sites),
        "ts_intensity": float(np.mean(sites)) if sites else None,
        "ts_level": sum(c["ts"] for c in cells) / n,
    }
    if layout.per_area:
        available["per_area"] = total[layout.per_area["compartment"]] / area * layout.per_area["per_um2"]
    out = {k: available[k] for k in layout.measures if k in available}
    if "overlap" in raw:
        out["overlap"] = {name: {"observed": k / total if total else None, "chance": expected / total if total else None}
                          for name, (k, total, expected) in raw["overlap"].items()}
    return out


def _round(v):
    if isinstance(v, float):
        return round(v, 4)
    if isinstance(v, dict):
        return {k: _round(x) for k, x in v.items()}
    if isinstance(v, list):
        return [_round(x) for x in v]
    return v


def _summary(values):
    """Mean and SD across animals for every numeric leaf of the measures."""
    first = values[0]
    if isinstance(first, dict):
        return {k: _summary([v[k] for v in values]) for k in first}
    xs = [v for v in values if v is not None]
    if not xs:
        return None
    return {"mean": float(np.mean(xs)), "sd": float(np.std(xs, ddof=1)) if len(xs) > 1 else 0.0, "n": len(xs)}


def channels_of(bits):
    return {"ch1": (bits[0],)} if len(bits) == 1 else {"ch1": (bits[0],), "ch2": (bits[1],), "both": bits}


def _area(case, m):
    """Area (µm²) the per_area measure divides by; None when the case has no per_area."""
    layout = _layout(case)
    if not layout.per_area:
        return None
    g = case.geometry[(m.genotype, m.animal)]
    return g["areas"][layout.per_area["compartment"]] if "areas" in g else g["terminal_area"]


def animal_entry(case, m) -> dict:
    """Every selection's raw counts and measures for one animal: {selection: {channel: …}}."""
    area = _area(case, m)
    out = {}
    for bits, ids in selections(case):
        out["+".join(ids)] = {ch: _round({"raw": (raw := _raw(case, m, b)), "m": _measures(case, raw, area)})
                              for ch, b in channels_of(bits).items()}
    return out


def assemble(case, entries, summary=True) -> dict:
    """Tables from per-animal entries: entries[genotype] is the list of chosen animals' entries."""
    result = {}
    for bits, ids in selections(case):
        key = "+".join(ids)
        chans = list(channels_of(bits))
        entry = {"channels": chans}
        for gt in ("control", "mutant"):
            animals = [e[key] for e in entries[gt]]
            entry[gt] = {"animals": animals}
            if summary:
                entry[gt]["summary"] = _round({ch: _summary([a[ch]["m"] for a in animals]) for ch in chans})
        result[key] = entry
    return {"selections": result}


def compute(case, datasets) -> dict:
    entries = {gt: [animal_entry(case, m) for m in datasets if m.genotype == gt] for gt in ("control", "mutant")}
    out = assemble(case, entries)
    layout = _layout(case)
    animals = {gt: [m for m in datasets if m.genotype == gt] for gt in ("control", "mutant")}
    key, source = layout.area_header
    if source:  # Pdf: one shared compartment's area, from the geometry's own key
        out[key] = {gt: [case.geometry[(gt, m.animal)]["terminal_area"] for m in ms] for gt, ms in animals.items()}
    else:       # every area compartment, per animal: {genotype: [areas per animal]}
        out[key] = {gt: [case.geometry[(gt, m.animal)]["areas"] for m in ms] for gt, ms in animals.items()}
    return out
