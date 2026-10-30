"""Simulation parameters and compartment layouts per case (docs/spec.md, *Simulation parameters
(draft)*).

The parameters (PDF, MB) are the generator's own statement of the biology. The truth table
(data/<case>/truth-table.toml) states the expected results separately; the validation gate
checks that the two agree.

The layouts (PDF_LAYOUT, MB_LAYOUT) are structure only: which compartments a case has, how
they are counted and pooled, and where their shapes are in the geometry file. They carry no
numbers, so truth_table.py and validate.py may import them and still check the generator
independently.

Contracts every module keeps (Phase 2):
- Compartment order in a layout is the RNG draw order in simulate.draw, the key order in
  tables.json and the plot order. PDF_LAYOUT reproduces Phase 1 exactly; the Pdf build must
  stay byte-identical (tools/pdf-identical.sh).
- Every cell draws its molecules for every compartment, shared ones included (a shared
  compartment's molecules each came from one cell). A shared compartment split into units
  (MB lobes: one per lobe system) places each cell's molecules in that cell's unit.
- Counts (tables `m.count`): count_unit "cell" = mean over the cells; "animal" = the raw
  total, kept an int (never divided by 1); "unit" = total / number of units, with the
  per-unit totals in `raw.units[<compartment>]` (the plot's per-unit dots).
- `student=False` compartments are simulated, drawn, written to tables (`raw`) and checked by
  the gate, but no student-facing measure, plot or fly-to uses them (MB calyx).
- Pools: whole_cell (region ratios across the cell), distal (numerator of share_distal) and
  cytoplasm (its denominator). Student-facing pools never include a student=False
  compartment.
- Geometry paths: "cells[].nucleus", "cells[].cytoplasm" (per cell); "axon.shape",
  "terminals.shape", "regions.calyx.shape", "regions.peduncle.shape" (shared, one unit);
  "regions.lobes.{unit}.shape" (shared, one shape per unit id). A per-cell unit is read from
  "cells[].lobe_system".

MB geometry file (site/data/mb/geometry-<genotype>-<animal>.json, written by geometry_mb):
  case, genotype, animal, units "µm", note, bounds, frame
  cells[30]: {id, lobe_system ("ab" | "apbp" | "g"), nucleus, nucleus_centre, cytoplasm}
  regions: {calyx: {shape, area_um2}, peduncle: {shape, area_um2},
            lobes: {ab | apbp | g: {shape, area_um2, parts: {name: shape}}}}
  views: {nucleus, cellbody, calyx, peduncle, lobes, lobes_ab, lobes_apbp, lobes_g}  [x0, y0, x1, y1]
Shapes are GeoJSON-style MultiPolygons in µm, as in the Pdf files. geometry_mb.build(g, a)
returns (public, skeleton) like geometry_pdf.build; the skeleton drives render.py.

Leg motor neuron geometry file (site/data/nmj/geometry-<genotype>-<animal>.json, written by
geometry_nmj): the Pdf schema with one cell; axon {shape, centreline, area_um2}, terminals
{shape, area_um2} (the synaptic terminals); views {nucleus, cellbody, axon, terminals}.
"""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Comp:
    id: str                   # key in raw / m.count / records
    kind: str                 # "per_cell" | "shared"
    geometry: str             # path in the geometry file (see the module docstring)
    count_unit: str           # "cell" | "animal" | "unit"
    units: str | None = None  # unit set (Layout.unit_sets) for a shared compartment split by cell
    student: bool = True      # False: simulated and gated, never plotted or offered to students
    granules: str | None = None  # TDP-43 granules: "per_cell" (per cell body) | "density" (per µm²) | None
    aggregates: bool = False  # TDP-43 aggregates sit here (mutant), and mRNA stays out of them
    overlap: bool = True      # spots here are scored for overlap with TDP-43 granules
    area: bool = False        # record the shape's area (µm²) in tables.json


@dataclass(frozen=True)
class Layout:
    case: str
    gene: str
    geometry_module: str      # generator.<module>.build(genotype, animal) -> (public, skeleton)
    cells: int
    compartments: tuple       # of Comp, in draw / key / plot order
    unit_sets: dict = field(default_factory=dict)  # name -> {"ids": (...), "of_cell": geometry path}
    pools: dict = field(default_factory=dict)      # whole_cell, distal, cytoplasm -> compartment ids
    measures: tuple = ()      # keys of tables `m`, in order
    per_area: dict | None = None  # {"compartment": id, "per_um2": 100} for the per_area measure
    area_header: tuple = ()   # (tables.json header key, source) for compartment areas


PDF_LAYOUT = Layout(
    case="pdf", gene="futsch", geometry_module="geometry_pdf", cells=4,
    compartments=(
        Comp("nucleus", "per_cell", "cells[].nucleus", "cell", overlap=False),
        Comp("cellbody", "per_cell", "cells[].cytoplasm", "cell", granules="per_cell", aggregates=True),
        Comp("axon", "shared", "axon.shape", "animal", granules="density"),
        Comp("terminals", "shared", "terminals.shape", "animal", granules="density", area=True),
    ),
    pools={"whole_cell": ("nucleus", "cellbody"), "distal": ("axon", "terminals"),
           "cytoplasm": ("cellbody", "axon", "terminals")},
    measures=("count", "per_area", "nc_ratio", "share_distal", "ts_number", "ts_intensity", "ts_level", "overlap"),
    per_area={"compartment": "terminals", "per_um2": 100},
    area_header=("terminal_area_um2", "terminals"),
)

MB_LAYOUT = Layout(
    case="mb", gene="unc-13", geometry_module="geometry_mb", cells=30,
    compartments=(
        Comp("nucleus", "per_cell", "cells[].nucleus", "cell", overlap=False),
        Comp("cellbody", "per_cell", "cells[].cytoplasm", "cell", granules="per_cell", aggregates=True),
        Comp("calyx", "shared", "regions.calyx.shape", "animal", student=False, granules="density", area=True),
        Comp("peduncle", "shared", "regions.peduncle.shape", "animal", granules="density", area=True),
        Comp("lobes", "shared", "regions.lobes.{unit}.shape", "unit", units="lobe_system", granules="density", area=True),
    ),
    unit_sets={"lobe_system": {"ids": ("ab", "apbp", "g"), "of_cell": "cells[].lobe_system"}},
    # the calyx is drawn but never counted by students, so it stays out of every student-facing pool
    pools={"whole_cell": ("nucleus", "cellbody", "peduncle", "lobes"), "distal": ("peduncle", "lobes"),
           "cytoplasm": ("cellbody", "peduncle", "lobes")},
    measures=("count", "nc_ratio", "share_distal", "ts_number", "ts_intensity", "ts_level", "overlap"),
    area_header=("region_area_um2", None),
)

NMJ_LAYOUT = Layout(
    case="nmj", gene="stai", geometry_module="geometry_nmj", cells=1,
    compartments=(
        Comp("nucleus", "per_cell", "cells[].nucleus", "cell", overlap=False),
        Comp("cellbody", "per_cell", "cells[].cytoplasm", "cell", granules="per_cell"),
        Comp("axon", "shared", "axon.shape", "animal", granules="density", area=True),
        Comp("terminals", "shared", "terminals.shape", "animal", granules="density", area=True),
    ),
    # the cell body, where the RNA is made, carries the region ratios (the splicing null); the
    # distal share is the synaptic terminals alone, as the RNA stalls inside the axon
    pools={"whole_cell": ("nucleus", "cellbody"), "distal": ("terminals",),
           "cytoplasm": ("cellbody", "axon", "terminals")},
    measures=("count", "nc_ratio", "share_distal", "ts_number", "ts_intensity", "ts_level", "overlap"),
    area_header=("region_area_um2", None),
)

LAYOUTS = {"pdf": PDF_LAYOUT, "mb": MB_LAYOUT, "nmj": NMJ_LAYOUT}

PDF = {
    "seed": 202609280,           # base seed for the candidate animals
    "animals": 3,
    "cells": 4,                  # s-LNvs per animal, all behaving alike
    "animal_sd": 0.10,           # multiplicative animal factor
    "spot_intensity_sd": 0.10,   # about ±10% per spot
    "isoforms": {"RC": 0.50, "RF": 0.25, "RE": 0.25},  # same in both genotypes; equal decay rates
    # mean mature molecules per cell, by compartment: stability (faster cytoplasmic decay)
    "mature_per_cell": {
        "control": {"nucleus": 10, "cellbody": 80, "axon": 25, "terminals": 25},
        "mutant": {"nucleus": 10, "cellbody": 40, "axon": 13, "terminals": 12},
    },
    # transcription: one site per nucleus, active in 90%; production unchanged in the mutant
    "ts_active": 0.90,
    "ts_reference": ("F5", 20),  # F5 sites hold about 20 nascent transcripts
    "ts_spread_um": 0.12,        # nascent molecules cluster at the site (they sum into one bright spot)
    "ts_detect_min": 2,          # a site is counted when at least 2 nascent molecules carry the probe
    "intron_retention": 0.0,     # no intron-positive spots away from transcription sites
    # TDP-43 IF. Levels are relative to the control nucleus. The diffuse cytoplasmic TDP-43 keeps
    # futsch mRNA stable (invented for this case); in the mutant, TDP-43 lost from the nucleus and
    # the cell-body cytoplasm is drawn into a few dense, irregular aggregates around the nucleus
    # (in a projection their brightness shows concentration, not amount, so small aggregates can
    # hold it). Transport granules are the same in both genotypes.
    "tdp43": {
        "control": {"nuclear": 1.0, "cytoplasmic": 0.16, "aggregates": (0, 0)},
        "mutant": {"nuclear": 0.4, "cytoplasmic": 0.08, "aggregates": (1, 3)},   # aggregates per cell: fewest, most
        "neurite_level": 0.75,          # diffuse signal in neurites, relative to the cell-body cytoplasm
        "granules_per_cell_body": 1.0,  # mean per cell
        "granule_density_um2": {"axon": 0.07, "terminals": 0.035},
        "granule_radius_um": (0.28, 0.38),  # soft and a little larger than a spot, so a spot can sit inside
        "granule_peak": 0.45,           # dimmer than spots and aggregates, above the diffuse signal
        "aggregate_shell_um": 3.0,      # aggregates sit within this distance of the nucleus
        "aggregate_area_um2": (1.5, 4.0),
        "aggregate_grey": 1.0,          # mean image grey of an aggregate, before the highlight roll-off
    },
    # share of futsch mRNA riding on transport granules, the same in both genotypes (the share is
    # set by binding, not by decay); none in aggregates
    "granule_cargo": {"axon": 0.25, "terminals": 0.15},
    "cargo_spread_um": 0.15,     # cargo sits within a granule, spread so several RNAs in one stay apart
    "overlap_um": 0.3,           # a spot overlaps TDP-43 within 0.3 µm of a granule's edge
    "randomised_draws": 50,
    "search": {"candidates": 120},  # candidate animals per slot; the build picks 3 per genotype
}

# Mushroom body, unc-13 ("a poison exon"). Two isoform groups with separate start sites, made at
# the same rates in both genotypes (control 70 : 30), each with its own fixed localisation (group 1
# reaches the lobes more). Group-1 pre-mRNA holds, in the intron after its N-terminal exon (U2), the
# exon that RB/RE use as their first coding exon (U4: exon 3 of RB/RE, with working splice sites).
# Invented: nuclear TDP-43 keeps that exon out of group-1 transcripts; with the mutant's nuclear
# loss a share psi of them include it. The 5,876-nt exon shifts the reading frame, so those
# transcripts meet a premature stop and nonsense-mediated decay soon after export, and decay before
# they travel far: all of them in the nucleus, about a third in the cell body, a few in the calyx
# and the proximal axon bundle, none in the lobes (Simplified: a steady state, no kinetics). So
# group-1 RNA falls most in the neurites, and the share of U2 RNA reaching them falls. Production
# and every decay rate are the same in both genotypes. TDP-43 puncta are the same in both
# genotypes, and sparse (instructor, 2026-10-12).
MB = {
    "seed": 202610110,
    "animals": 3,
    "cells": 30,                 # Kenyon cells per animal, 10 per lobe system, all behaving alike
    "animal_sd": 0.10,
    "spot_intensity_sd": 0.10,
    # within-group weights (the RA–RG mix of each group); the groups' shares are set below
    "isoform_groups": {"g1": {"RA": 30, "RC": 15, "RD": 10, "RF": 10, "RG": 5}, "g2": {"RB": 20, "RE": 10}},
    # relative production per group (nascent transcripts): 70 : 30 in both genotypes
    "production": {"control": {"g1": 0.70, "g2": 0.30}, "mutant": {"g1": 0.70, "g2": 0.30}},
    # mature molecules per Kenyon cell before the exon choice, (group 1, group 2) per compartment
    "group_per_cell": {"nucleus": (2.1, 0.9), "cellbody": (13.0, 7.0), "calyx": (1.95, 1.05),
                       "peduncle": (2.4, 0.6), "lobes": (5.4, 0.6)},
    # the included exon: its genomic span (all of U4), the group whose pre-mRNA holds it in an
    # intron, the share of that group's transcripts that include it per genotype, and the share of
    # those that survive NMD in each compartment. The rest of the group skips it, as annotated.
    "exon": {"lo": 886965, "hi": 892840, "into": "g1", "psi": {"control": 0.005, "mutant": 0.70},
             "survives": {"nucleus": 1.0, "cellbody": 0.35, "calyx": 0.10, "peduncle": 0.05, "lobes": 0.0}},
    "ts_active": 0.90,
    "ts_reference": ("U6", 10),  # U6 sites hold about 10 nascent transcripts (control production)
    "ts_spread_um": 0.12,
    "ts_detect_min": 2,
    "ts_inset_um": 1.2,          # transcription sites sit this far inside the nucleus edge
    "granule_inset_um": 0.4,     # cell-body granules sit this far inside the cytoplasm edge
    # TDP-43 IF: nuclear loss in the mutant (the clue); sparse small puncta across the neuropil, the
    # same in both genotypes (0.0072 per µm², 6% of the first density; instructor, 2026-10-12);
    # 0-1 aggregates per mutant cell body. unc-13 mRNA does not ride on the
    # puncta (no cargo), so overlap stays at chance: they only make spots *seem* to overlap.
    "tdp43": {
        "control": {"nuclear": 1.0, "cytoplasmic": 0.16, "aggregates": (0, 0),
                    "granule_density_um2": {"calyx": 0.0072, "peduncle": 0.0072, "lobes": 0.0072}},
        "mutant": {"nuclear": 0.6, "cytoplasmic": 0.14, "aggregates": (0, 1),
                   "granule_density_um2": {"calyx": 0.0072, "peduncle": 0.0072, "lobes": 0.0072}},
        "neurite_level": 0.75,
        "granules_per_cell_body": 0.3,
        "granule_radius_um": (0.22, 0.30),  # small puncta
        "granule_peak": 0.45,
        "aggregate_shell_um": 1.5,
        "aggregate_area_um2": (0.8, 1.6),
        "aggregate_grey": 1.0,
    },
    "granule_cargo": {"calyx": 0.0, "peduncle": 0.0, "lobes": 0.0},
    "cargo_spread_um": 0.15,
    "overlap_um": 0.3,
    "search": {"candidates": 120},
}

# Leg motor neuron, stai ("RNA stuck on the way"). Two kinds of stai mRNA by their 3' end: the
# long-3'UTR isoforms (RB, RD) ride TDP-43 transport granules down the axon and make up most of
# the RNA in the axon and synaptic terminals; the short ones (RC, RE) mostly stay in the cell
# body. stai-RA, the only isoform that skips the cassette exon, is not expressed in this neuron, so
# every short isoform starts at TSS1 (S1) and the cassette exon is in every molecule (instructor,
# 2026-10-27). Invented: in the mutant, viscous TDP-43 granules stall in the axon with their long-3'UTR
# cargo, so fewer long molecules reach the synaptic terminals and more sit in the axon on
# granules. Production, splicing and decay are unchanged, so the whole-cell count and the cell
# body's isoform mix stay flat. CG31642, nested in a stai intron on the same strand, is drawn too
# (nucleus and cell body, the same in both genotypes), because the intron probe S3 also detects
# it. One motor neuron per animal; no aggregates (instructor, 2026-10-13).
NMJ = {
    "seed": 202610130,
    "animals": 3,
    "cells": 1,                  # one motor neuron per animal
    "animal_sd": 0.10,
    "spot_intensity_sd": 0.10,
    # within-group weights; the groups' shares of each compartment are set below
    "isoform_groups": {"long": {"RB": 60, "RD": 40}, "short": {"RC": 15, "RE": 50}},
    "other_genes": ("CG31642",),  # overlapping same-strand genes drawn as their own kind (no nascent RNA)
    # production in proportion to the whole-cell counts below (equal decay rates): long 132 : short 153
    "production": {"control": {"long": 132 / 285, "short": 153 / 285}, "mutant": {"long": 132 / 285, "short": 153 / 285}},
    # mean mature molecules per cell, by compartment and kind (spec: 15, 150, 60 → 85, 60 → 29 stai;
    # long share 20%, 20%, 80% → 86%, 85% → 69%)
    "kind_per_cell": {
        "control": {"nucleus": {"long": 3, "short": 12, "CG31642": 3}, "cellbody": {"long": 30, "short": 120, "CG31642": 20},
                    "axon": {"long": 48, "short": 12}, "terminals": {"long": 51, "short": 9}},
        "mutant": {"nucleus": {"long": 3, "short": 12, "CG31642": 3}, "cellbody": {"long": 30, "short": 120, "CG31642": 20},
                   "axon": {"long": 73.1, "short": 11.9}, "terminals": {"long": 20, "short": 9}},
    },
    "ts_active": 1.0,            # every nucleus active: with one nucleus per animal, a silent one would dominate the spread (instructor, 2026-10-27)
    "ts_reference": ("S5", 12),  # S5 sites hold about 12 nascent transcripts
    "ts_spread_um": 0.12,
    "ts_detect_min": 2,
    "ts_inset_um": 1.2,
    "granule_inset_um": 0.4,
    # TDP-43 IF: a mild nuclear loss, a little more soluble TDP-43 in the cytoplasm, no aggregates;
    # more transport granules in the mutant (per neuron: cell body 5 → 10, axon 5 → 25, synaptic
    # terminals 2 → 8, as densities over the geometry's mean areas), and the mutant's axonal granules
    # are viscous, drawn stretched along the axon. Larger than the Pdf granules (×1.3).
    "tdp43": {
        "control": {"nuclear": 1.0, "cytoplasmic": 0.16, "aggregates": (0, 0), "granules_per_cell_body": 5,
                    "granule_density_um2": {"axon": 5 / 414, "terminals": 2 / 224}},
        "mutant": {"nuclear": 0.7, "cytoplasmic": 0.20, "aggregates": (0, 0), "granules_per_cell_body": 10,
                   "granule_density_um2": {"axon": 25 / 410, "terminals": 8 / 178},
                   "granule_aspect": {"axon": (1.3, 1.6)}},
        "neurite_level": 0.75,
        "granule_radius_um": (0.36, 0.50),
        "granule_peak": 0.45,
    },
    # share of the long-3'UTR molecules in the axon riding on transport granules (none elsewhere)
    "granule_cargo": {"axon": {"control": 0.10, "mutant": 0.55}},
    "cargo_isoforms": ("RB", "RD"),
    "cargo_spread_um": 0.15,
    "overlap_um": 0.3,
    "search": {"candidates": 120},
}

CASES = {"pdf": PDF, "mb": MB, "nmj": NMJ}
