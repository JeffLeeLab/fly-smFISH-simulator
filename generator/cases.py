"""Simulation parameters per case (docs/spec.md, *Simulation parameters (draft)*).

These are the generator's own statement of the biology. The truth table (data/<case>/
truth-table.toml) states the expected results separately; the validation gate checks that
the two agree.
"""

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

CASES = {"pdf": PDF}
