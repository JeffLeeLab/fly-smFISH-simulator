"""Case inputs for the generator: transcript models, probe regions, geometry and parameters.

Which regions a molecule carries is worked out here from exon coordinates, not read from the
hand-written `mature_in` / `nascent_in` lists, so the validation gate (which uses those lists
through the truth table) is an independent check on both.
"""

import json
from dataclasses import dataclass, field

import numpy as np
from shapely.geometry import shape

from .cases import LAYOUTS, Layout
from .paths import CASE_GENES, SITE_DATA, TRANSCRIPT_MODELS

# Pdf's compartments, kept for modules that still assume them; the codes in a Case are
# Case.comp_index (for Pdf, these same numbers)
COMPARTMENTS = ("nucleus", "cellbody", "axon", "terminals")
COMP = {c: i for i, c in enumerate(COMPARTMENTS)}


@dataclass
class Isoform:
    name: str          # e.g. "RC"
    exons: list        # [[lo, hi], ...] genomic, 1-based inclusive
    strand: str
    share: float       # fraction of mature molecules (equal decay, so also of production); control production
    group: str | None = None  # isoform group ("g1" | "g2"), for cases whose groups change production
    weight: float = 1.0       # within-group weight

    @property
    def tss(self):
        return self.exons[0][0] if self.strand == "+" else self.exons[0][1]

    @property
    def end(self):
        return self.exons[-1][1] if self.strand == "+" else self.exons[-1][0]

    @property
    def length(self):
        return abs(self.end - self.tss) + 1

    def distance(self, pos):
        """Distance along the pre-mRNA from the TSS (negative if upstream of the TSS)."""
        return (pos - self.tss) if self.strand == "+" else (self.tss - pos)


@dataclass
class Region:
    id: str
    lo: int
    hi: int

    @property
    def mid(self):
        return (self.lo + self.hi) / 2


@dataclass
class Case:
    id: str
    gene: str
    strand: str
    isoforms: list
    regions: list
    geometry: dict          # (genotype, animal) -> parsed geometry (shapely shapes + raw json)
    params: dict
    layout: Layout = None
    mature_masks: dict = field(default_factory=dict)  # isoform name -> 8-bit mask
    comp_index: dict = field(default_factory=dict)    # compartment id -> molecule comp code

    def _group_total(self, group: str) -> float:
        return sum(i.weight for i in self.isoforms if i.group == group.rstrip("x"))

    def production(self, genotype: str) -> list:
        """Relative production of each isoform (same order as isoforms)."""
        if "isoform_groups" not in self.params:
            return [i.share for i in self.isoforms]
        prod = self.params["production"][genotype]
        return [prod.get(i.group, 0.0) * i.weight / self._group_total(i.group) for i in self.isoforms]  # invented isoforms: 0

    def mature_mix(self, genotype: str, comp_id: str) -> np.ndarray:
        """Isoform probabilities of the mature molecules in one compartment."""
        if "isoform_groups" not in self.params:
            return np.array([i.share for i in self.isoforms])
        if "exon" in self.params:
            n = self.group_counts(genotype, comp_id)
            kinds = {"g1": n[0], self.params["exon"]["into"] + "x": n[1], "g2": n[2]}
            tot = sum(kinds.values())
            return np.array([kinds[i.group] / tot * i.weight / self._group_total(i.group) for i in self.isoforms])
        g1 = self.params["group_share"][genotype][comp_id]
        return np.array([(g1 if i.group == "g1" else 1 - g1) * i.weight / self._group_total(i.group) for i in self.isoforms])

    def group_counts(self, genotype: str, comp_id: str) -> tuple:
        """Mature molecules per cell in a compartment, by kind: (group 1 skipping the exon,
        group 1 including it after NMD, group 2)."""
        g1, g2 = self.params["group_per_cell"][comp_id]
        ex = self.params["exon"]
        psi = ex["psi"][genotype]
        return g1 * (1 - psi), g1 * psi * ex["survives"][comp_id], g2

    def mature_per_cell(self, genotype: str) -> dict:
        """Mean mature molecules per cell, by compartment."""
        if "exon" in self.params:
            return {c.id: sum(self.group_counts(genotype, c.id)) for c in self.layout.compartments}
        return self.params["mature_per_cell"][genotype]

    def nascent_mask(self, iso: Isoform, pol_dist: float) -> int:
        """Regions carried by an unspliced pre-mRNA running from the TSS to pol_dist.

        A region counts as carried once the polymerase has passed its midpoint (probes tile
        the region, so a half-made region gives about half a signal)."""
        m = 0
        for bit, r in enumerate(self.regions):
            d = iso.distance(r.mid)
            if 0 <= d <= pol_dist and d <= iso.length:
                m |= 1 << bit
        return m


def _mature_mask(iso: Isoform, regions) -> int:
    m = 0
    for bit, r in enumerate(regions):
        covered = sum(max(0, min(hi, r.hi) - max(lo, r.lo) + 1) for lo, hi in iso.exons)
        if covered >= 0.9 * (r.hi - r.lo + 1):
            m |= 1 << bit
    return m


def _resolve(raw: dict, path: str, units: tuple = ()) -> list:
    """Shapes (or numbers) at a layout geometry path, as [(unit id or None, value)]. A "{unit}"
    path gives one per unit id, in order. Per-cell paths ("cells[].x") are read separately."""
    def walk(p):
        node = raw
        for key in p.split("."):
            node = node[key]
        return node
    if "{unit}" in path:
        return [(u, walk(path.replace("{unit}", u))) for u in units]
    return [(None, walk(path))]


def geometry_areas(layout: Layout, raw: dict) -> dict:
    """Area (µm²) of every compartment that records one: a number, or {unit: number} when split."""
    out = {}
    for comp in layout.compartments:
        if not comp.area:
            continue
        unit_ids = layout.unit_sets[comp.units]["ids"] if comp.units else ()
        found = _resolve(raw, comp.geometry.rsplit(".", 1)[0] + ".area_um2", unit_ids)
        out[comp.id] = dict(found) if comp.units else found[0][1]
    return out


def _geometry(case_id: str, genotype: str, animal: int, layout: Layout) -> dict:
    raw = json.loads((SITE_DATA / case_id / f"geometry-{genotype}-{animal}.json").read_text(encoding="utf-8"))
    out = {
        "raw": raw,
        "nuclei": [shape(c["nucleus"]) for c in raw["cells"]],
        "cytoplasm": [shape(c["cytoplasm"]) for c in raw["cells"]],
    }
    per_cell = {"cells[].nucleus": out["nuclei"], "cells[].cytoplasm": out["cytoplasm"]}
    shared = {}
    for comp in layout.compartments:
        if comp.kind == "shared":
            unit_ids = layout.unit_sets[comp.units]["ids"] if comp.units else ()
            shared[comp.id] = [(u, shape(sh)) for u, sh in _resolve(raw, comp.geometry, unit_ids)]
    out["per_cell"] = {c.id: per_cell[c.geometry] for c in layout.compartments if c.kind == "per_cell"}
    out["shared"] = shared
    # the unit (e.g. lobe system) each cell feeds
    out["units"] = {name: [c[spec["of_cell"].split(".")[-1]] for c in raw["cells"]] for name, spec in layout.unit_sets.items()}
    out["areas"] = geometry_areas(layout, raw)
    if case_id == "pdf":  # Phase 1 keys
        out["axon"], out["terminals"] = shared["axon"][0][1], shared["terminals"][0][1]
        out["terminal_area"] = out["areas"]["terminals"]
    return out


def load_case(case_id: str, params: dict) -> Case:
    models = json.loads(TRANSCRIPT_MODELS.read_text(encoding="utf-8"))
    g = models["genes"][CASE_GENES[case_id]]
    strand = g["strand"]
    layout = LAYOUTS[case_id]
    isoforms = []
    for t in g["transcripts"]:
        name = t["name"].split("-")[-1]
        if "isoform_groups" in params:
            for group, weights in params["isoform_groups"].items():
                if name in weights:
                    share = params["production"]["control"][group] * weights[name] / sum(weights.values())
                    isoforms.append(Isoform(name, t["exons"], strand, share, group, weights[name]))
        elif name in params["isoforms"]:
            isoforms.append(Isoform(name, t["exons"], strand, params["isoforms"][name]))
    assert abs(sum(i.share for i in isoforms) - 1) < 1e-9, "isoform shares must sum to 1"
    if "exon" in params:
        # invented, private isoforms: each of the exon's host group with the exon spliced in; no production
        ex = params["exon"]
        for iso in [i for i in isoforms if i.group == ex["into"]]:
            exons = sorted(iso.exons + [[ex["lo"], ex["hi"]]], reverse=strand == "-")
            isoforms.append(Isoform(iso.name + "+x", exons, strand, 0.0, ex["into"] + "x", iso.weight))
    regions = [Region(r["id"], r["lo"], r["hi"]) for r in sorted(g["probe_regions"], key=lambda r: int(r["id"][1:]))]
    case = Case(case_id, CASE_GENES[case_id], strand, isoforms, regions,
                {(gt, a): _geometry(case_id, gt, a, layout) for gt in ("control", "mutant") for a in range(1, params["animals"] + 1)}, params,
                layout, comp_index={c.id: i for i, c in enumerate(layout.compartments)})
    case.mature_masks = {i.name: _mature_mask(i, regions) for i in isoforms}
    return case


def nascent_scale(case: Case) -> float:
    """Nascent molecules per unit (production share × gene length), set so that the reference
    region's transcription sites hold the stated number of molecules on average."""
    ref_id, target = case.params["ts_reference"]
    ref = next(r for r in case.regions if r.id == ref_id)
    carrying = sum(i.share * max(0.0, i.length - i.distance(ref.mid)) for i in case.isoforms if 0 <= i.distance(ref.mid) <= i.length)
    return target / carrying


def mask_has(mask: np.ndarray, region_bits) -> np.ndarray:
    want = 0
    for b in region_bits:
        want |= 1 << b
    return (mask & want) == want
