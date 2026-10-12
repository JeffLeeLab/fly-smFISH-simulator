"""Build a case: draw candidate animals, choose the three per genotype that satisfy the truth
table, place their molecules, render their images and write the site's data.

Molecule counts are Poisson draws, so a given set of three animals may not reproduce the truth
table: with 3 animals an "unchanged" measure can drift past ±5% by chance. The build therefore
draws a pool of candidate animals for each of the six slots (genotype × animal 1–3), each from
its own seed, and chooses the combination that passes every check and matches most closely,
like choosing representative animals from a larger set. Every animal shown is a genuine draw;
the choice is deterministic, so the same inputs always give the same animals and files.

Writes:
  site/data/<case>/tables.json                       every single probe and ordered pair
  site/data/<case>/molecules/<genotype>-<n>.json     positions, detection masks, brightness, TDP-43 granules
  site/data/<case>/images/<genotype>-<n>-<layer>.webp  membrane, DAPI and TDP-43 images (diffuse signal and aggregates)
  data/<case>/generated/records-<genotype>-<n>.json  full molecule records (private, not committed)

    uv run python -m generator.build pdf
"""

import importlib
import json
import sys
import time

import numpy as np

from . import render
from .cases import CASES
from .model import geometry_areas, load_case
from .paths import DATA, SITE_DATA
from .simulate import draw, place
from .tables import animal_entry, assemble
from .validate import run

GENOTYPES = ("control", "mutant")


def candidate_rng(case, genotype, animal, k):
    return np.random.default_rng([case.params["seed"], GENOTYPES.index(genotype), animal, k])


def draw_candidate(case, genotype, animal, k, positions=False):
    rng = candidate_rng(case, genotype, animal, k)
    m = draw(case, genotype, animal, rng)
    m.candidate = k
    if positions:
        place(case, m, rng)
    return m


def choose_animals(case, truth):
    p = case.params
    K = p["search"]["candidates"]
    slots = [(g, a) for g in GENOTYPES for a in range(1, p["animals"] + 1)]
    t0 = time.time()
    entries = {s: [animal_entry(case, draw_candidate(case, *s, k)) for k in range(K)] for s in slots}
    print(f"  {K} candidates for each of {len(slots)} slots ({time.time() - t0:.0f} s)")

    def evaluate(choice, positions=None):
        chosen = {g: [entries[(g, a)][choice[(g, a)]] if positions is None else positions[(g, a)]
                      for a in range(1, p["animals"] + 1)] for g in GENOTYPES}
        gate = run(assemble(case, chosen, summary=False), truth, positions_optional=positions is None)
        return (len(gate.failures), gate.score), gate

    excluded = {s: set() for s in slots}
    choice = {s: 0 for s in slots}
    best, _ = evaluate(choice)
    for sweep in range(8):
        improved = False
        for s in slots:
            for k in range(K):
                if k == choice[s] or k in excluded[s]:
                    continue
                trial = {**choice, s: k}
                v, _ = evaluate(trial)
                if v < best:
                    best, choice, improved = v, trial, True
        print(f"  sweep {sweep + 1}: {best[0]} failing checks, score {best[1]:.1f}")
        if not improved:
            break
        if best[0] == 0 and sweep >= 2:
            break
    if best[0]:
        raise SystemExit("no combination of candidate animals satisfies the truth table; raise search.candidates")

    # place the chosen animals' molecules and check the full gate, overlap included
    for attempt in range(20):
        datasets = {s: draw_candidate(case, *s, choice[s], positions=True) for s in slots}
        placed = {s: animal_entry(case, m) for s, m in datasets.items()}
        v, gate = evaluate(choice, positions=placed)
        if not gate.failures:
            return choice, datasets, gate
        # an overlap check failed: drop the worst-placed slot's animal and re-optimise that slot
        # (the failing genotype's animals take turns: the check pools all of them)
        geno = next(s[0] for s in slots if any(s[0] in f for f in gate.failures))
        mine = [s for s in slots if s[0] == geno]
        bad = mine[attempt % len(mine)]
        excluded[bad].add(choice[bad])
        options = [(evaluate({**choice, bad: k})[0], k) for k in range(K) if k not in excluded[bad]]
        choice[bad] = min(options)[1]
        print(f"  placement check failed ({gate.failures[0]}); trying candidate {choice[bad]} for {bad}")
    raise SystemExit("placement checks keep failing; check the TDP-43 overlap parameters")


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
            "cytoplasmic": m.tdp43["cytoplasmic"],
            "granules": [[round(x, 3), round(y, 3), round(r, 3), round(i, 3)] for x, y, r, i, _ in m.tdp43["granules"]],
        },
    }


def private_records(case, m):
    return {
        "genotype": m.genotype,
        "animal": m.animal,
        "candidate": m.candidate,
        "animal_factor": round(m.factor, 4),
        "ts_active": m.ts_active.tolist(),
        "molecules": [
            {
                "compartment": case.layout.compartments[c].id, "cell": int(cl) + 1, "isoform": case.isoforms[i].name,
                "nascent": bool(n), "regions": [r.id for b, r in enumerate(case.regions) if mk >> b & 1],
                "x": round(float(x), 3), "y": round(float(y), 3), "on_granule": bool(gr), "overlaps_granule": bool(o),
            }
            for c, cl, i, n, mk, x, y, gr, o in zip(m.comp, m.cell, m.iso, m.nascent, m.mask, m.x, m.y, m.on_granule, m.overlap)
        ],
    }


def write(path, obj, compact=True):
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(obj, ensure_ascii=False, separators=(",", ":")) if compact else json.dumps(obj, ensure_ascii=False, indent=1)
    path.write_text(text + "\n", encoding="utf-8")


def area_header(case):
    """The tables.json header entry for a compartment's area (Pdf: terminal_area_um2). A case whose
    header is not one compartment's area (area source None) leaves it to tables.py."""
    key, source = case.layout.area_header
    if source is None:
        return {}
    return {key: {g: [case.geometry[(g, a)]["areas"][source] for a in range(1, case.params["animals"] + 1)] for g in GENOTYPES}}


def same_areas(a, b):
    """Two {compartment: area | {unit: area}} dicts agree to 0.05 µm²."""
    return a.keys() == b.keys() and all(
        all(abs(a[k][u] - b[k][u]) < 0.05 for u in a[k]) if isinstance(a[k], dict) else abs(a[k] - b[k]) < 0.05 for k in a)


def main(argv) -> int:
    for case_id in argv or ["pdf"]:
        t0 = time.time()
        case = load_case(case_id, CASES[case_id])
        truth = json.loads((DATA / case_id / "truth-table.json").read_text(encoding="utf-8"))
        print(f"{case_id}: choosing animals")
        choice, datasets, gate = choose_animals(case, truth)
        out = SITE_DATA / case_id
        order = {g: [datasets[(g, a)] for a in range(1, case.params["animals"] + 1)] for g in GENOTYPES}
        tables = assemble(case, {g: [animal_entry(case, m) for m in order[g]] for g in GENOTYPES})
        write(out / "tables.json", {
            "case": case_id,
            "seed": case.params["seed"],
            "animals_chosen": {g: [int(choice[(g, a)]) for a in range(1, case.params["animals"] + 1)] for g in GENOTYPES},
            "animals": case.params["animals"],
            "cells": case.params["cells"],
            "regions": [r.id for r in case.regions],
            "compartments": [c.id for c in case.layout.compartments],
            "units": {"count": "nucleus and cell body per cell; axon and terminals per animal", "per_area": "spots per 100 µm²"},
            **area_header(case),
            "simulated": True,
            **tables,
        })
        geometry = importlib.import_module(f"generator.{case.layout.geometry_module}")
        frame = case.geometry[("control", 1)]["raw"]["frame"]
        for (g, a), m in datasets.items():
            write(out / "molecules" / f"{g}-{a}.json", public_molecules(case, m))
            write(DATA / case_id / "generated" / f"records-{g}-{a}.json", private_records(case, m), compact=False)
            public, skel = geometry.build(g, a)
            assert same_areas(geometry_areas(case.layout, public), case.geometry[(g, a)]["areas"]), \
                f"geometry-{g}-{a}.json is out of date: run generator.{case.layout.geometry_module}"
            render.render_animal(out, frame, skel, g, a, m.tdp43, case.params["tdp43"]["neurite_level"], case.params["seed"])
        n = sum(int((m.mask > 0).sum()) for m in datasets.values())
        print(f"{case_id}: animals {dict((f'{g}-{a}', k) for (g, a), k in choice.items())}, {gate.checked} checks passed, "
              f"{n} visible molecules, {time.time() - t0:.0f} s")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
