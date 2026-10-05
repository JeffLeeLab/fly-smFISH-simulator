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
    # TDP-43 IF
    "tdp43": {
        "control": {"nuclear": 1.0, "perinuclear_puncta": 2},
        "mutant": {"nuclear": 0.6, "perinuclear_puncta": 12},
        "punctum_radius_um": (0.25, 0.45),
        "perinuclear_shell_um": 3.0,   # puncta sit within this distance of the nucleus
    },
    "granule_bias": 0.0,         # futsch mRNA is not recruited to TDP-43 puncta
    "overlap_um": 0.3,           # a spot overlaps TDP-43 within 0.3 µm of a punctum's edge
    "randomised_draws": 50,
    "search": {"candidates": 120},  # candidate animals per slot; the build picks 3 per genotype
}

CASES = {"pdf": PDF}
