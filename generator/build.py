"""Build a case: choose a seed that satisfies the truth table, then write the site's data.

Molecule counts are Poisson draws, so not every seed reproduces the truth table (with 3
animals, an "unchanged" measure can drift past ±10% by chance). The build tries seeds upwards
from the case's base seed, keeps those whose counts pass every check, ranks them by how
closely they match, places the molecules for the best few, and takes the first that passes
the full gate, overlap included. The same inputs always give the same seed and the same files.

Writes:
  site/data/<case>/tables.json                    every single probe and ordered pair
  site/data/<case>/molecules/<genotype>-<n>.json  positions, detection masks, brightness, TDP-43
  data/<case>/generated/records-<genotype>-<n>.json  full molecule records (private, not committed)

    uv run python -m generator.build pdf
"""

import json
import sys
import time

import numpy as np

from .cases import CASES
from .model import COMPARTMENTS, load_case
from .paths import DATA, SITE_DATA
from .simulate import simulate
from .tables import compute
from .validate import run


def choose_seed(case, truth):
    p = case.params
    base, trials, finalists = p["seed"], p["search"]["trials"], p["search"]["finalists"]
    passing = []
    for s in range(base, base + trials):
        gate = run(compute(case, simulate(case, s, positions=False)), truth, positions_optional=True)
        if not gate.failures:
            passing.append((gate.score, s))
    passing.sort()
    print(f"  {len(passing)} of {trials} seeds pass on counts")
    for score, s in passing[:finalists]:
        datasets = simulate(case, s, positions=True)
        tables = compute(case, datasets)
        gate = run(tables, truth)
        if not gate.failures:
            return s, datasets, tables, gate
        print(f"  seed {s}: {gate.failures[0]}")
    raise SystemExit("no seed satisfies the truth table; widen the search or check the parameters")


def public_molecules(case, m):
    seen = m.mask > 0  # molecules no probe in the menu can detect are never drawn
    return {
        "genotype": m.genotype,
        "animal": m.animal,
        "regions": [r.id for r in case.regions],  # bit i of m = carries regions[i]
        "x": np.round(m.x[seen], 3).tolist(),
        "y": np.round(m.y[seen], 3).tolist(),
        "m": m.mask[seen].astype(int).tolist(),
        "i": np.round(m.intensity[seen], 3).tolist(),
        "tdp43": {
            "nuclear": m.tdp43["nuclear"],
            "puncta": [[round(x, 3), round(y, 3), round(r, 3), round(i, 3)] for x, y, r, i, _ in m.tdp43["puncta"]],
        },
    }


def private_records(case, m):
    return {
        "genotype": m.genotype,
        "animal": m.animal,
        "animal_factor": round(m.factor, 4),
        "ts_active": m.ts_active.tolist(),
        "molecules": [
            {
                "compartment": COMPARTMENTS[c], "cell": int(cl) + 1, "isoform": case.isoforms[i].name,
                "nascent": bool(n), "regions": [r.id for b, r in enumerate(case.regions) if mk >> b & 1],
                "x": round(float(x), 3), "y": round(float(y), 3), "overlaps_tdp43": bool(o),
            }
            for c, cl, i, n, mk, x, y, o in zip(m.comp, m.cell, m.iso, m.nascent, m.mask, m.x, m.y, m.overlap)
        ],
    }


def write(path, obj, compact=True):
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(obj, ensure_ascii=False, separators=(",", ":")) if compact else json.dumps(obj, ensure_ascii=False, indent=1)
    path.write_text(text + "\n", encoding="utf-8")


def main(argv) -> int:
    for case_id in argv or ["pdf"]:
        t0 = time.time()
        case = load_case(case_id, CASES[case_id])
        truth = json.loads((DATA / case_id / "truth-table.json").read_text(encoding="utf-8"))
        print(f"{case_id}: searching seeds from {case.params['seed']}")
        seed, datasets, tables, gate = choose_seed(case, truth)
        out = SITE_DATA / case_id
        write(out / "tables.json", {
            "case": case_id,
            "seed": seed,
            "animals": case.params["animals"],
            "cells": case.params["cells"],
            "regions": [r.id for r in case.regions],
            "compartments": list(COMPARTMENTS),
            "units": {"count": "nucleus and cell body per cell; axon and terminals per animal", "per_area": "spots per 100 µm²"},
            "simulated": True,
            **tables,
        })
        for m in datasets:
            write(out / "molecules" / f"{m.genotype}-{m.animal}.json", public_molecules(case, m))
            write(DATA / case_id / "generated" / f"records-{m.genotype}-{m.animal}.json", private_records(case, m), compact=False)
        n = sum(int((m.mask > 0).sum()) for m in datasets)
        print(f"{case_id}: seed {seed}, {gate.checked} checks passed, {n} visible molecules, {time.time() - t0:.1f} s")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
