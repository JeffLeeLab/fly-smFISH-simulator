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

Group 1 and group 2 are made at the same rates in both genotypes. The exon covered by U4 is group 2's first coding exon, and lies in an intron of group-1 pre-mRNA. In control 0.5% of group-1 transcripts include it; in the mutant 70% do. Those transcripts are broken down soon after export (nonsense-mediated decay), so the share that survives falls with distance from the nucleus: nucleus 100%, cell body 35%, calyx 10%, peduncle 5%, lobes 0%. A probe counts a molecule only if it carries its region: group-1 molecules that include the exon carry U4 as well as their usual regions. Mean molecules per Kenyon cell, control → mutant:

| Compartment | Group 2 | Group 1, skips the exon | Group 1, includes the exon (white U2+U4) | Total |
| --- | --- | --- | --- | --- |
| nucleus | 0.90 | 2.09 → 0.63 | 0.01 → 1.47 | 3.00 |
| cell body | 7.00 | 12.94 → 3.90 | 0.02 → 3.18 | 19.96 → 14.09 |
| calyx | 1.05 | 1.94 → 0.59 | 0.00 → 0.14 | 2.99 → 1.77 |
| peduncle | 0.60 | 2.39 → 0.72 | 0.00 → 0.08 | 2.99 → 1.40 |
| lobes | 0.60 | 5.37 → 1.62 | 0.00 | 5.97 → 2.22 |

## Single probes

Counts: per Kenyon cell for the nucleus and cell body; per animal for the peduncle and calyx (30 cells' worth); per lobe system for the lobes (10 cells' worth). Brackets give the control mean. ↓×r and ↑×r give the nominal mutant / control ratio; "appears" marks a count that is near zero in control and clear in the mutant. N:C = nucleus / cell body. Distal share = (peduncle + lobes) / all cytoplasmic RNA (cell body, peduncle, lobes). TDP-43 overlap = share of spots on TDP-43 puncta, against the randomised-position level. TS = transcription sites, control → mutant.

| Region | Type | Mature in | Nascent in | nucleus | cell body | calyx (instructor only) | peduncle | lobes | N:C | Distal share | TDP-43 overlap | TS intensity | TS look |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| U1 | first exon (far-upstream TSS) | RG | RG | same (0.15) | ↓×0.55 (0.926) | ↓×0.37 (4.16) | ↓×0.34 (5.118) | ↓×0.30 (3.838) | ↑×1.83 | ↓×0.68 | cell body, calyx, peduncle, lobes: chance | too few nascent molecules to measure | dim → dim |
| U2 | N-terminal exon (group 1) | RA, RC, RD, RF, RG | RA, RC, RD, RF, RG | same (2.1) | ↓×0.55 (12.958) | ↓×0.37 (58.237) | ↓×0.34 (71.658) | ↓×0.30 (53.73) | ↑×1.83 | ↓×0.68 | cell body, calyx, peduncle, lobes: chance | same | bright → bright |
| U3 | intron upstream of group-2 TSS | – | RA, RC, RD, RF, RG | none | none | none | none | none | – | – | – | same | bright → bright |
| U4 | N-terminal exon (group 2) | RB, RE | RA, RB, RC, RD, RE, RF, RG | ↑×2.60 (0.91) | ↑×1.45 (7.023) | ↑×1.13 (31.529) | ↑×1.14 (18.018) | same (6) | ↑×1.79 | ↓×0.77 | cell body, calyx, peduncle, lobes: chance | same | bright → bright |
| U5 | alternative exon | RA, RD | RA, RB, RC, RD, RE, RF, RG | same (1.2) | ↓×0.55 (7.404) | ↓×0.37 (33.278) | ↓×0.34 (40.947) | ↓×0.30 (30.703) | ↑×1.83 | ↓×0.68 | cell body, calyx, peduncle, lobes: chance | same | present → present |
| U6 | intron | – | RA, RB, RC, RD, RE, RF, RG | none | none | none | none | none | – | – | – | same | present → present |
| U7 | last exon | RA, RB, RC, RD, RE, RF, RG | RA, RB, RC, RD, RE, RF, RG | same (3) | ↓×0.71 (19.958) | ↓×0.59 (89.737) | ↓×0.47 (89.658) | ↓×0.37 (59.73) | ↑×1.42 | ↓×0.66 | cell body, calyx, peduncle, lobes: chance | too few nascent molecules to measure | none → none |
| U8 | long 3'UTR | RD | RD | same (0.3) | ↓×0.55 (1.851) | ↓×0.37 (8.32) | ↓×0.34 (10.237) | ↓×0.30 (7.676) | ↑×1.83 | ↓×0.68 | cell body, calyx, peduncle, lobes: chance | too few nascent molecules to measure | none → none |

Lobe counts per lobe system are checked for each of `ab`, `apbp`, `g` (`unit_count`, answer key only) with the same rule and control mean as the lobes above.

## Pairs

Channel 1 and channel 2 behave as the single probes above; the 56 ordered pairs differ in which isoforms carry *both* regions (white spots) and in the channel-2 : channel-1 ratio over the whole cell (nucleus, cell body, peduncle, lobes) and over the distal compartments (peduncle, lobes). The ratio is given as the control value and its change in the mutant. One row per unordered pair; swapping channels inverts the ratio:

| Pair | Both regions in (annotated, mature) | Both regions in (group 1 with the exon) | Both regions in (nascent) | Whole-cell ratio | Distal ratio |
| --- | --- | --- | --- | --- | --- |
| U1 + U2 | RG | RG | RG | 13.9999, same | 13.9999, same |
| U1 + U3 | – | – | RG | – | – |
| U1 + U4 | – | RG | RG | 5.6037, ↑×2.98 | 2.1656, ↑×3.42 |
| U1 + U5 | – | – | RG | 8, same | 8, same |
| U1 + U6 | – | – | RG | – | – |
| U1 + U7 | RG | RG | RG | 19.5829, ↑×1.28 | 16.1644, ↑×1.29 |
| U1 + U8 | – | – | – | 2, same | 2, same |
| U2 + U3 | – | – | RA, RC, RD, RF, RG | – | – |
| U2 + U4 | – | RA, RC, RD, RF, RG | RA, RC, RD, RF, RG | 0.4003, ↑×2.98 | 0.1547, ↑×3.42 |
| U2 + U5 | RA, RD | RA, RD | RA, RC, RD, RF, RG | 0.5714, same | 0.5714, same |
| U2 + U6 | – | – | RA, RC, RD, RF, RG | – | – |
| U2 + U7 | RA, RC, RD, RF, RG | RA, RC, RD, RF, RG | RA, RC, RD, RF, RG | 1.3988, ↑×1.28 | 1.1546, ↑×1.29 |
| U2 + U8 | RD | RD | RD | 0.1429, same | 0.1429, same |
| U3 + U4 | – | – | RA, RC, RD, RF, RG | – | – |
| U3 + U5 | – | – | RA, RC, RD, RF, RG | – | – |
| U3 + U6 | – | – | RA, RC, RD, RF, RG | – | – |
| U3 + U7 | – | – | RA, RC, RD, RF, RG | – | – |
| U3 + U8 | – | – | RD | – | – |
| U4 + U5 | – | RA, RD | RA, RB, RC, RD, RE, RF, RG | 1.4276, ↓×0.34 | 3.6942, ↓×0.29 |
| U4 + U6 | – | – | RA, RB, RC, RD, RE, RF, RG | – | – |
| U4 + U7 | RB, RE | RA, RC, RD, RF, RG | RA, RB, RC, RD, RE, RF, RG | 3.4946, ↓×0.43 | 7.4643, ↓×0.38 |
| U4 + U8 | – | RD | RD | 0.3569, ↓×0.34 | 0.9235, ↓×0.29 |
| U5 + U6 | – | – | RA, RB, RC, RD, RE, RF, RG | – | – |
| U5 + U7 | RA, RD | RA, RD | RA, RB, RC, RD, RE, RF, RG | 2.4479, ↑×1.28 | 2.0206, ↑×1.29 |
| U5 + U8 | RD | RD | RD | 0.25, same | 0.25, same |
| U6 + U7 | – | – | RA, RB, RC, RD, RE, RF, RG | – | – |
| U6 + U8 | – | – | RD | – | – |
| U7 + U8 | RD | RD | RD | 0.1021, ↓×0.78 | 0.1237, ↓×0.77 |

## Tolerances

- *same*: within ±5%. Key readouts (49 checks: U6 transcription-site intensity, nuclear and neurite-share U2, the white U2+U4 counts in the nucleus and cell body) are held to their rule with no allowance for counting noise; other checks may also differ by 2 standard errors of counting noise where counts are small.
- *↓×r / ↑×r*: the mutant / control ratio is within ±10% of the nominal ratio (widened by 2 standard errors for small counts). Ratios follow from the group weights, the exon's inclusion share and its survival in each compartment (see the `.toml`).
- *appears*: the control mean is at most 0.05 per cell (scaled for shared compartments) and the mutant mean is within ±20% of the expected value (widened by 2 standard errors for small counts).
- Control means within ±20% of the nominal numbers (in brackets above).
- TDP-43 overlap: *chance* is within 4% (absolute) of the randomised-position control, in both genotypes.
- Transcription sites: number and intensity (mean nascent molecules per counted site) follow a Poisson model of the designed molecules per active site (`[ts]`, with `ts_active` and `ts_detect_min` in `[nascent]`), within the ratio rules above. They are checked only for probes with at least 4 molecules per active site in both genotypes; otherwise the table says "too few nascent molecules to measure". Look (bright, present, dim, none) is read from the nascent molecules per nucleus (molecules per site x 0.9).
