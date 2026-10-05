"""Pre-computed results for every single probe and all 56 ordered probe pairs.

For each selection, genotype, animal and channel (ch1 = carries region A, ch2 = carries B,
both = carries both), the raw counts the measures are built from, and the measures themselves:
  count         nucleus and cell body per cell (mean of the cells); axon and terminals per animal
  per_area      terminal spots per 100 µm² of terminal area
  nc_ratio      nucleus / cell body (all cells)
  share_distal  (axon + terminals) / (cell body + axon + terminals)
  ts_number     nuclei with a transcription site (at least ts_detect_min nascent molecules)
  ts_intensity  mean nascent molecules per counted site
  overlap       share of cell-body spots within the overlap distance of a TDP-43 punctum,
                with the randomised-position level (`chance`) for the same spots
Mean and SD across animals are added per genotype. The site, plot and table read only this.
"""

import itertools

import numpy as np

from .model import COMP, mask_has


def selections(case):
    ids = [r.id for r in case.regions]
    out = [((i,), (ids[i],)) for i in range(len(ids))]
    out += [((a, b), (ids[a], ids[b])) for a, b in itertools.permutations(range(len(ids)), 2)]
    return out


def _raw(case, m, bits):
    det = mask_has(m.mask, bits)
    mature = det & ~m.nascent
    cells = []
    for c in range(case.params["cells"]):
        here = m.cell == c
        cells.append({
            "nucleus": int((mature & here & (m.comp == COMP["nucleus"])).sum()),
            "cellbody": int((mature & here & (m.comp == COMP["cellbody"])).sum()),
            "ts": int((det & here & m.nascent).sum()),
        })
    raw = {
        "cells": cells,
        "axon": int((mature & (m.comp == COMP["axon"])).sum()),
        "terminals": int((mature & (m.comp == COMP["terminals"])).sum()),
    }
    if m.overlap is not None:
        cb = mature & (m.comp == COMP["cellbody"])
        raw["overlap"] = [int((m.overlap & cb).sum()), int(cb.sum()), round(float(m.chance[cb].sum()), 4)]
    return raw


def _measures(case, raw, area):
    cells = raw["cells"]
    n = len(cells)
    nuc = sum(c["nucleus"] for c in cells)
    cb = sum(c["cellbody"] for c in cells)
    distal = raw["axon"] + raw["terminals"]
    detect = case.params["ts_detect_min"]
    sites = [c["ts"] for c in cells if c["ts"] >= detect]
    out = {
        "count": {"nucleus": nuc / n, "cellbody": cb / n, "axon": raw["axon"], "terminals": raw["terminals"]},
        "per_area": raw["terminals"] / area * 100,
        "nc_ratio": nuc / cb if cb else None,
        "share_distal": distal / (cb + distal) if cb + distal else None,
        "ts_number": len(sites),
        "ts_intensity": float(np.mean(sites)) if sites else None,
        "ts_level": sum(c["ts"] for c in cells) / n,
    }
    if "overlap" in raw:
        k, total, expected = raw["overlap"]
        out["overlap"] = {"observed": k / total if total else None, "chance": expected / total if total else None}
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


def compute(case, datasets) -> dict:
    areas = {gt: case.geometry[gt]["terminal_area"] for gt in ("control", "mutant")}
    result = {}
    for bits, ids in selections(case):
        chans = {"ch1": (bits[0],)} if len(bits) == 1 else {"ch1": (bits[0],), "ch2": (bits[1],), "both": bits}
        entry = {"channels": list(chans)}
        for gt in ("control", "mutant"):
            animals = []
            for m in (d for d in datasets if d.genotype == gt):
                a = {}
                for ch, b in chans.items():
                    raw = _raw(case, m, b)
                    a[ch] = {"raw": raw, "m": _measures(case, raw, areas[gt])}
                animals.append(a)
            entry[gt] = {
                "animals": animals,
                "summary": {ch: _summary([a[ch]["m"] for a in animals]) for ch in chans},
            }
        result["+".join(ids)] = _round(entry)
    return {"terminal_area_um2": areas, "selections": result}
