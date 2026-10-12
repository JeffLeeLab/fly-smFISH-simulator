# Truth table: Mushroom body – *unc-13* (signed-off)

Generated from `data/mb/truth-table.toml` and the probe menu by `uv run python -m generator.truth_table mb`. Every entry compares the hTDP-43 mutant with hTDP-43 WT (control). Sign off by editing the `.toml`, not this file.

## Verdicts

| Mode | Verdict |
| --- | --- |
| splicing | supported |
| isoform | ambiguous |
| stability | unresolved |
| export | ruled-out |
| transport | ambiguous |
| granule | ruled-out |
| translation | not-tested |
| celltype | not-tested |

## Three kinds of molecule

Group 1 and group 2 are made at the same rates in both genotypes. The exon covered by U4 is group 2's first coding exon, and lies in an intron of group-1 pre-mRNA. In control 2% of group-1 transcripts include it; in the mutant 70% do. Those transcripts are broken down soon after export (nonsense-mediated decay), so the share that survives falls with distance from the nucleus: nucleus 100%, cell body 35%, calyx 10%, peduncle 5%, lobes 0%. A probe counts a molecule only if it carries its region: group-1 molecules that include the exon carry U4 as well as their usual regions. Mean molecules per Kenyon cell, control → mutant:

| Compartment | Group 2 | Group 1, skips the exon | Group 1, includes the exon (white U2+U4) | Total |
| --- | --- | --- | --- | --- |
| nucleus | 0.90 | 2.06 → 0.63 | 0.04 → 1.47 | 3.00 |
| cell body | 7.00 | 12.74 → 3.90 | 0.09 → 3.18 | 19.83 → 14.09 |
| calyx | 1.05 | 1.91 → 0.59 | 0.00 → 0.14 | 2.96 → 1.77 |
| peduncle | 0.60 | 2.35 → 0.72 | 0.00 → 0.08 | 2.95 → 1.40 |
| lobes | 0.60 | 5.29 → 1.62 | 0.00 | 5.89 → 2.22 |

## Single probes

Counts: per Kenyon cell for the nucleus and cell body; per animal for the peduncle and calyx (30 cells' worth); per lobe system for the lobes (10 cells' worth). Brackets give the control mean. ↓×r and ↑×r give the nominal mutant / control ratio; "appears" marks a count that is near zero in control and clear in the mutant. N:C = nucleus / cell body. Distal share = (peduncle + lobes) / all cytoplasmic RNA (cell body, peduncle, lobes). TDP-43 overlap = share of spots on TDP-43 puncta, against the randomised-position level. TS = transcription sites, control → mutant.

| Region | Type | Mature in | Nascent in | nucleus | cell body | calyx (instructor only) | peduncle | lobes | N:C | Distal share | TDP-43 overlap | TS intensity | TS look |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| U1 | first exon (far-upstream TSS) | RG | RG | same (0.15) | ↓×0.55 (0.916) | ↓×0.38 (4.103) | ↓×0.34 (5.045) | ↓×0.31 (3.78) | ↑×1.81 | ↓×0.68 | cell body, calyx, peduncle, lobes: chance | too few nascent molecules to measure | dim → dim |
| U2 | N-terminal exon (group 1) | RA, RC, RD, RF, RG | RA, RC, RD, RF, RG | same (2.1) | ↓×0.55 (12.831) | ↓×0.38 (57.447) | ↓×0.34 (70.632) | ↓×0.31 (52.92) | ↑×1.81 | ↓×0.68 | cell body, calyx, peduncle, lobes: chance | same | bright → bright |
| U3 | intron upstream of group-2 TSS | – | RA, RC, RD, RF, RG | none | none | none | none | none | – | – | – | same | bright → bright |
| U4 | N-terminal exon (group 2) | RB, RE | RA, RB, RC, RD, RE, RF, RG | ↑×2.52 (0.942) | ↑×1.44 (7.091) | ↑×1.13 (31.617) | ↑×1.14 (18.072) | same (6) | ↑×1.75 | ↓×0.77 | cell body, calyx, peduncle, lobes: chance | same | bright → bright |
| U5 | alternative exon | RA, RD | RA, RB, RC, RD, RE, RF, RG | same (1.2) | ↓×0.55 (7.332) | ↓×0.38 (32.827) | ↓×0.34 (40.361) | ↓×0.31 (30.24) | ↑×1.81 | ↓×0.68 | cell body, calyx, peduncle, lobes: chance | same | present → present |
| U6 | intron | – | RA, RB, RC, RD, RE, RF, RG | none | none | none | none | none | – | – | – | same | present → present |
| U7 | last exon | RA, RB, RC, RD, RE, RF, RG | RA, RB, RC, RD, RE, RF, RG | same (3) | ↓×0.71 (19.831) | ↓×0.60 (88.947) | ↓×0.48 (88.632) | ↓×0.38 (58.92) | ↑×1.41 | ↓×0.66 | cell body, calyx, peduncle, lobes: chance | too few nascent molecules to measure | none → none |
| U8 | long 3'UTR | RD | RD | same (0.3) | ↓×0.55 (1.833) | ↓×0.38 (8.207) | ↓×0.34 (10.09) | ↓×0.31 (7.56) | ↑×1.81 | ↓×0.68 | cell body, calyx, peduncle, lobes: chance | too few nascent molecules to measure | none → none |

Lobe counts per lobe system are checked for each of `ab`, `apbp`, `g` (`unit_count`, answer key only) with the same rule and control mean as the lobes above.

## Pairs

Channel 1 and channel 2 behave as the single probes above; the 56 ordered pairs differ in which isoforms carry *both* regions (white spots) and in the channel-2 : channel-1 ratio over the whole cell (nucleus, cell body, peduncle, lobes) and over the distal compartments (peduncle, lobes). The ratio is given as the control value and its change in the mutant. One row per unordered pair; swapping channels inverts the ratio:

| Pair | Both regions in (annotated, mature) | Both regions in (group 1 with the exon) | Both regions in (nascent) | Whole-cell ratio | Distal ratio |
| --- | --- | --- | --- | --- | --- |
| U1 + U2 | RG | RG | RG | 13.9999, same | 13.9999, same |
| U1 + U3 | – | – | RG | – | – |
| U1 + U4 | – | RG | RG | 5.7267, ↑×2.91 | 2.2015, ↑×3.37 |
| U1 + U5 | – | – | RG | 8, same | 8, same |
| U1 + U6 | – | – | RG | – | – |
| U1 + U7 | RG | RG | RG | 19.6427, ↑×1.27 | 16.197, ↑×1.29 |
| U1 + U8 | – | – | – | 2, same | 2, same |
| U2 + U3 | – | – | RA, RC, RD, RF, RG | – | – |
| U2 + U4 | – | RA, RC, RD, RF, RG | RA, RC, RD, RF, RG | 0.4091, ↑×2.91 | 0.1573, ↑×3.37 |
| U2 + U5 | RA, RD | RA, RD | RA, RC, RD, RF, RG | 0.5714, same | 0.5714, same |
| U2 + U6 | – | – | RA, RC, RD, RF, RG | – | – |
| U2 + U7 | RA, RC, RD, RF, RG | RA, RC, RD, RF, RG | RA, RC, RD, RF, RG | 1.4031, ↑×1.27 | 1.1569, ↑×1.29 |
| U2 + U8 | RD | RD | RD | 0.1429, same | 0.1429, same |
| U3 + U4 | – | – | RA, RC, RD, RF, RG | – | – |
| U3 + U5 | – | – | RA, RC, RD, RF, RG | – | – |
| U3 + U6 | – | – | RA, RC, RD, RF, RG | – | – |
| U3 + U7 | – | – | RA, RC, RD, RF, RG | – | – |
| U3 + U8 | – | – | RD | – | – |
| U4 + U5 | – | RA, RD | RA, RB, RC, RD, RE, RF, RG | 1.3969, ↓×0.34 | 3.6339, ↓×0.30 |
| U4 + U6 | – | – | RA, RB, RC, RD, RE, RF, RG | – | – |
| U4 + U7 | RB, RE | RA, RC, RD, RF, RG | RA, RB, RC, RD, RE, RF, RG | 3.43, ↓×0.44 | 7.3573, ↓×0.38 |
| U4 + U8 | – | RD | RD | 0.3492, ↓×0.34 | 0.9085, ↓×0.30 |
| U5 + U6 | – | – | RA, RB, RC, RD, RE, RF, RG | – | – |
| U5 + U7 | RA, RD | RA, RD | RA, RB, RC, RD, RE, RF, RG | 2.4553, ↑×1.27 | 2.0246, ↑×1.29 |
| U5 + U8 | RD | RD | RD | 0.25, same | 0.25, same |
| U6 + U7 | – | – | RA, RB, RC, RD, RE, RF, RG | – | – |
| U6 + U8 | – | – | RD | – | – |
| U7 + U8 | RD | RD | RD | 0.1018, ↓×0.79 | 0.1235, ↓×0.77 |

## Tolerances

- *same*: within ±5%. Key readouts (49 checks: U6 transcription-site intensity, nuclear and neurite-share U2, the white U2+U4 counts in the nucleus and cell body) are held to their rule with no allowance for counting noise; other checks may also differ by 2 standard errors of counting noise where counts are small.
- *↓×r / ↑×r*: the mutant / control ratio is within ±10% of the nominal ratio (widened by 2 standard errors for small counts). Ratios follow from the group weights, the exon's inclusion share and its survival in each compartment (see the `.toml`).
- *appears*: the control mean is at most 0.15 per cell (scaled for shared compartments) and the mutant mean is within ±20% of the expected value (widened by 2 standard errors for small counts).
- Control means within ±20% of the nominal numbers (in brackets above).
- TDP-43 overlap: *chance* is within 4% (absolute) of the randomised-position control, in both genotypes.
- Transcription sites: number and intensity (mean nascent molecules per counted site) follow a Poisson model of the designed molecules per active site (`[ts]`, with `ts_active` and `ts_detect_min` in `[nascent]`), within the ratio rules above. They are checked only for probes with at least 4 molecules per active site in both genotypes; otherwise the table says "too few nascent molecules to measure". Look (bright, present, dim, none) is read from the nascent molecules per nucleus (molecules per site x 0.9).
