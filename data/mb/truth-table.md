# Truth table: Mushroom body – *unc-13* (draft)

Generated from `data/mb/truth-table.toml` and the probe menu by `uv run python -m generator.truth_table mb`. Every entry compares the hTDP-43 mutant with hTDP-43 WT (control). Sign off by editing the `.toml`, not this file.

## Verdicts

| Mode | Verdict |
| --- | --- |
| splicing | supported |
| isoform | ambiguous |
| stability | unresolved |
| export | ruled-out |
| transport | ruled-out |
| granule | ruled-out |
| translation | not-tested |
| celltype | not-tested |

## Three kinds of molecule

Group 1 and group 2 are made at the same rates in both genotypes. The exon covered by U4 is group 2's first coding exon, and lies in an intron of group-1 pre-mRNA. In control 2% of group-1 transcripts include it; in the mutant 40% do. Those transcripts are broken down soon after export (nonsense-mediated decay), so the share that survives falls with distance from the nucleus: nucleus 100%, cell body 10%, calyx 0%, peduncle 0%, lobes 0%. A probe counts a molecule only if it carries its region: group-1 molecules that include the exon carry U4 as well as their usual regions. Mean molecules per Kenyon cell, control → mutant:

| Compartment | Group 2 | Group 1, skips the exon | Group 1, includes the exon (white U2+U4) | Total |
| --- | --- | --- | --- | --- |
| nucleus | 0.90 | 2.06 → 1.26 | 0.04 → 0.84 | 3.00 |
| cell body | 7.00 | 12.74 → 7.80 | 0.03 → 0.52 | 19.77 → 15.32 |
| calyx | 1.05 | 1.91 → 1.17 | 0.00 | 2.96 → 2.22 |
| peduncle | 0.60 | 2.35 → 1.44 | 0.00 | 2.95 → 2.04 |
| lobes | 0.60 | 5.29 → 3.24 | 0.00 | 5.89 → 3.84 |

## Single probes

Counts: per Kenyon cell for the nucleus and cell body; per animal for the peduncle and calyx (30 cells' worth); per lobe system for the lobes (10 cells' worth). Brackets give the control mean. ↓×r and ↑×r give the nominal mutant / control ratio; "appears" marks a count that is near zero in control and clear in the mutant. N:C = nucleus / cell body. Distal share = (peduncle + lobes) / all cytoplasmic RNA (cell body, peduncle, lobes). TDP-43 overlap = share of spots on TDP-43 puncta, against the randomised-position level. TS = transcription sites, control → mutant.

| Region | Type | Mature in | Nascent in | nucleus | cell body | calyx (instructor only) | peduncle | lobes | N:C | Distal share | TDP-43 overlap | TS intensity | TS look |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| U1 | first exon (far-upstream TSS) | RG | RG | same (0.15) | ↓×0.65 (0.912) | ↓×0.61 (4.095) | ↓×0.61 (5.04) | ↓×0.61 (3.78) | ↑×1.53 | same | cell body, calyx, peduncle, lobes: chance | too few nascent molecules to measure | dim → dim |
| U2 | N-terminal exon (group 1) | RA, RC, RD, RF, RG | RA, RC, RD, RF, RG | same (2.1) | ↓×0.65 (12.766) | ↓×0.61 (57.33) | ↓×0.61 (70.56) | ↓×0.61 (52.92) | ↑×1.53 | same | cell body, calyx, peduncle, lobes: chance | same | bright → bright |
| U3 | intron upstream of group-2 TSS | – | RA, RC, RD, RF, RG | none | none | none | none | none | – | – | – | same | bright → bright |
| U4 | N-terminal exon (group 2) | RB, RE | RA, RB, RC, RD, RE, RF, RG | ↑×1.85 (0.942) | ↑×1.07 (7.026) | same (31.5) | same (18) | same (6) | ↑×1.73 | ↓×0.94 | cell body, calyx, peduncle, lobes: chance | same | bright → bright |
| U5 | alternative exon | RA, RD | RA, RB, RC, RD, RE, RF, RG | same (1.2) | ↓×0.65 (7.295) | ↓×0.61 (32.76) | ↓×0.61 (40.32) | ↓×0.61 (30.24) | ↑×1.53 | same | cell body, calyx, peduncle, lobes: chance | same | present → present |
| U6 | intron | – | RA, RB, RC, RD, RE, RF, RG | none | none | none | none | none | – | – | – | same | present → present |
| U7 | last exon | RA, RB, RC, RD, RE, RF, RG | RA, RB, RC, RD, RE, RF, RG | same (3) | ↓×0.78 (19.766) | ↓×0.75 (88.83) | ↓×0.69 (88.56) | ↓×0.65 (58.92) | ↑×1.29 | ↓×0.90 | cell body, calyx, peduncle, lobes: chance | too few nascent molecules to measure | none → none |
| U8 | long 3'UTR | RD | RD | same (0.3) | ↓×0.65 (1.824) | ↓×0.61 (8.19) | ↓×0.61 (10.08) | ↓×0.61 (7.56) | ↑×1.53 | same | cell body, calyx, peduncle, lobes: chance | too few nascent molecules to measure | none → none |

Lobe counts per lobe system are checked for each of `ab`, `apbp`, `g` (`unit_count`, answer key only) with the same rule and control mean as the lobes above.

## Pairs

Channel 1 and channel 2 behave as the single probes above; the 56 ordered pairs differ in which isoforms carry *both* regions (white spots) and in the channel-2 : channel-1 ratio over the whole cell (nucleus, cell body, peduncle, lobes) and over the distal compartments (peduncle, lobes). The ratio is given as the control value and its change in the mutant. One row per unordered pair; swapping channels inverts the ratio:

| Pair | Both regions in (annotated, mature) | Both regions in (group 1 with the exon) | Both regions in (nascent) | Whole-cell ratio | Distal ratio |
| --- | --- | --- | --- | --- | --- |
| U1 + U2 | RG | RG | RG | 13.9999, same | 13.9999, same |
| U1 + U3 | – | – | RG | – | – |
| U1 + U4 | – | RG | RG | 5.702, ↑×1.70 | 2.1978, ↑×1.63 |
| U1 + U5 | – | – | RG | 8, same | 8, same |
| U1 + U6 | – | – | RG | – | – |
| U1 + U7 | RG | RG | RG | 19.6596, ↑×1.14 | 16.1977, ↑×1.09 |
| U1 + U8 | – | – | – | 2, same | 2, same |
| U2 + U3 | – | – | RA, RC, RD, RF, RG | – | – |
| U2 + U4 | – | RA, RC, RD, RF, RG | RA, RC, RD, RF, RG | 0.4073, ↑×1.70 | 0.157, ↑×1.63 |
| U2 + U5 | RA, RD | RA, RD | RA, RC, RD, RF, RG | 0.5714, same | 0.5714, same |
| U2 + U6 | – | – | RA, RC, RD, RF, RG | – | – |
| U2 + U7 | RA, RC, RD, RF, RG | RA, RC, RD, RF, RG | RA, RC, RD, RF, RG | 1.4043, ↑×1.14 | 1.157, ↑×1.09 |
| U2 + U8 | RD | RD | RD | 0.1429, same | 0.1429, same |
| U3 + U4 | – | – | RA, RC, RD, RF, RG | – | – |
| U3 + U5 | – | – | RA, RC, RD, RF, RG | – | – |
| U3 + U6 | – | – | RA, RC, RD, RF, RG | – | – |
| U3 + U7 | – | – | RA, RC, RD, RF, RG | – | – |
| U3 + U8 | – | – | RD | – | – |
| U4 + U5 | – | RA, RD | RA, RB, RC, RD, RE, RF, RG | 1.403, ↓×0.59 | 3.64, ↓×0.61 |
| U4 + U6 | – | – | RA, RB, RC, RD, RE, RF, RG | – | – |
| U4 + U7 | RB, RE | RA, RC, RD, RF, RG | RA, RB, RC, RD, RE, RF, RG | 3.4479, ↓×0.67 | 7.37, ↓×0.66 |
| U4 + U8 | – | RD | RD | 0.3508, ↓×0.59 | 0.91, ↓×0.61 |
| U5 + U6 | – | – | RA, RB, RC, RD, RE, RF, RG | – | – |
| U5 + U7 | RA, RD | RA, RD | RA, RB, RC, RD, RE, RF, RG | 2.4575, ↑×1.14 | 2.0247, ↑×1.09 |
| U5 + U8 | RD | RD | RD | 0.25, same | 0.25, same |
| U6 + U7 | – | – | RA, RB, RC, RD, RE, RF, RG | – | – |
| U6 + U8 | – | – | RD | – | – |
| U7 + U8 | RD | RD | RD | 0.1017, ↓×0.88 | 0.1235, ↓×0.92 |

## Tolerances

- *same*: within ±5%. Key readouts (49 checks: U6 transcription-site intensity, nuclear and neurite-share U2, the white U2+U4 counts in the nucleus and cell body) are held to their rule with no allowance for counting noise; other checks may also differ by 2 standard errors of counting noise where counts are small.
- *↓×r / ↑×r*: the mutant / control ratio is within ±10% of the nominal ratio (widened by 2 standard errors for small counts). Ratios follow from the group weights, the exon's inclusion share and its survival in each compartment (see the `.toml`).
- *appears*: the control mean is at most 0.15 per cell (scaled for shared compartments) and the mutant mean is within ±20% of the expected value (widened by 2 standard errors for small counts).
- Control means within ±20% of the nominal numbers (in brackets above).
- TDP-43 overlap: *chance* is within 4% (absolute) of the randomised-position control, in both genotypes.
- Transcription sites: number and intensity (mean nascent molecules per counted site) follow a Poisson model of the designed molecules per active site (`[ts]`, with `ts_active` and `ts_detect_min` in `[nascent]`), within the ratio rules above. They are checked only for probes with at least 4 molecules per active site in both genotypes; otherwise the table says "too few nascent molecules to measure". Look (bright, present, dim, none) is read from the nascent molecules per nucleus (molecules per site x 0.9).
