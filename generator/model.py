"""Case inputs for the generator: transcript models, probe regions, geometry and parameters.

Which regions a molecule carries is worked out here from exon coordinates, not read from the
hand-written `mature_in` / `nascent_in` lists, so the validation gate (which uses those lists
through the truth table) is an independent check on both.
"""

import json
from dataclasses import dataclass, field

import numpy as np
from shapely.geometry import shape

from .paths import CASE_GENES, SITE_DATA, TRANSCRIPT_MODELS

COMPARTMENTS = ("nucleus", "cellbody", "axon", "terminals")
COMP = {c: i for i, c in enumerate(COMPARTMENTS)}


@dataclass
class Isoform:
    name: str          # e.g. "RC"
    exons: list        # [[lo, hi], ...] genomic, 1-based inclusive
    strand: str
    share: float       # fraction of mature molecules (equal decay, so also of production)

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
    mature_masks: dict = field(default_factory=dict)  # isoform name -> 8-bit mask

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


def _geometry(case_id: str, genotype: str, animal: int) -> dict:
    raw = json.loads((SITE_DATA / case_id / f"geometry-{genotype}-{animal}.json").read_text(encoding="utf-8"))
    return {
        "raw": raw,
        "nuclei": [shape(c["nucleus"]) for c in raw["cells"]],
        "cytoplasm": [shape(c["cytoplasm"]) for c in raw["cells"]],
        "axon": shape(raw["axon"]["shape"]),
        "terminals": shape(raw["terminals"]["shape"]),
        "terminal_area": raw["terminals"]["area_um2"],
    }


def load_case(case_id: str, params: dict) -> Case:
    models = json.loads(TRANSCRIPT_MODELS.read_text(encoding="utf-8"))
    g = models["genes"][CASE_GENES[case_id]]
    strand = g["strand"]
    isoforms = []
    for t in g["transcripts"]:
        name = t["name"].split("-")[-1]
        if name in params["isoforms"]:
            isoforms.append(Isoform(name, t["exons"], strand, params["isoforms"][name]))
    assert abs(sum(i.share for i in isoforms) - 1) < 1e-9, "isoform shares must sum to 1"
    regions = [Region(r["id"], r["lo"], r["hi"]) for r in sorted(g["probe_regions"], key=lambda r: int(r["id"][1:]))]
    case = Case(case_id, CASE_GENES[case_id], strand, isoforms, regions,
                {(gt, a): _geometry(case_id, gt, a) for gt in ("control", "mutant") for a in range(1, params["animals"] + 1)}, params)
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
