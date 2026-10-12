# Truth table: Mushroom body – *unc-13* (signed-off)

Generated from `data/mb/truth-table.toml` and the probe menu by `uv run python -m generator.truth_table mb`. Every entry compares the hTDP-43 mutant with hTDP-43 WT (control). Sign off by editing the `.toml`, not this file.

## Verdicts

| Mode | Verdict |
| --- | --- |
| transport | ruled-out |
| granule | ruled-out |
| isoform | supported |
| splicing | unresolved |
| export | ruled-out |
| stability | unresolved |
| translation | not-tested |
| celltype | not-tested |

## Single probes

Counts: per Kenyon cell for the nucleus and cell body; per animal for the peduncle and calyx (30 cells' worth); per lobe system for the lobes (10 cells' worth). Brackets give the control mean. ↓×r and ↑×r give the nominal mutant / control ratio. N:C = nucleus / cell body. Distal share = (peduncle + lobes) / all cytoplasmic RNA (cell body, peduncle, lobes). TDP-43 overlap = share of spots on TDP-43 puncta, against the randomised-position level. TS = transcription sites, control → mutant.

| Region | Type | Mature in | Nascent in | nucleus | cell body | calyx (instructor only) | peduncle | lobes | N:C | Distal share | TDP-43 overlap | TS intensity | TS look |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| U1 | first exon (far-upstream TSS) | RG | RG | ↓×0.40 (0.15) | ↓×0.41 (0.929) | ↓×0.41 (4.179) | ↓×0.40 (5.143) | ↓×0.40 (3.857) | same | same | cell body, calyx, peduncle, lobes: chance | too few nascent molecules to measure | dim → none |
| U2 | N-terminal exon (group 1) | RA, RC, RD, RF, RG | RA, RC, RD, RF, RG | ↓×0.40 (2.1) | ↓×0.41 (13) | ↓×0.41 (58.5) | ↓×0.40 (72) | ↓×0.40 (54) | same | same | cell body, calyx, peduncle, lobes: chance | ↓×0.40 | bright → present |
| U3 | intron upstream of group-2 TSS | – | RA, RC, RD, RF, RG | none | none | none | none | none | – | – | – | ↓×0.40 | bright → present |
| U4 | N-terminal exon (group 2) | RB, RE | RA, RB, RC, RD, RE, RF, RG | ↑×2.40 (0.9) | ↑×2.39 (7) | ↑×2.39 (31.5) | ↑×2.40 (18) | ↑×2.40 (6) | same | same | cell body, calyx, peduncle, lobes: chance | same | bright → bright |
| U5 | alternative exon | RA, RD | RA, RB, RC, RD, RE, RF, RG | ↓×0.40 (1.2) | ↓×0.41 (7.429) | ↓×0.41 (33.429) | ↓×0.40 (41.143) | ↓×0.40 (30.857) | same | same | cell body, calyx, peduncle, lobes: chance | same | present → present |
| U6 | intron | – | RA, RB, RC, RD, RE, RF, RG | none | none | none | none | none | – | – | – | same | present → present |
| U7 | last exon | RA, RB, RC, RD, RE, RF, RG | RA, RB, RC, RD, RE, RF, RG | same (3) | ↑×1.10 (20) | ↑×1.10 (90) | ↓×0.80 (90) | ↓×0.60 (60) | ↓×0.91 | ↓×0.69 | cell body, calyx, peduncle, lobes: chance | too few nascent molecules to measure | none → none |
| U8 | long 3'UTR | RD | RD | ↓×0.40 (0.3) | ↓×0.41 (1.857) | ↓×0.41 (8.357) | ↓×0.40 (10.286) | ↓×0.40 (7.714) | same | same | cell body, calyx, peduncle, lobes: chance | too few nascent molecules to measure | none → none |

Lobe counts per lobe system are checked for each of `ab`, `apbp`, `g` (`unit_count`, answer key only) with the same rule and control mean as the lobes above.

## Pairs

Channel 1 and channel 2 behave as the single probes above; the 56 ordered pairs differ in which isoforms carry *both* regions (white spots) and in the channel-2 : channel-1 ratio over the whole cell (nucleus, cell body, peduncle, lobes) and over the distal compartments (peduncle, lobes). The ratio is given as the control value and its change in the mutant. One row per unordered pair; swapping channels inverts the ratio:

| Pair | Both regions in (mature) | Both regions in (nascent) | Whole-cell ratio | Distal ratio |
| --- | --- | --- | --- | --- |
| U1 + U2 | RG | RG | 13.9999, same | 13.9999, same |
| U1 + U3 | – | RG | – | – |
| U1 + U4 | – | RG | 5.5633, ↑×5.93 | 2.1538, ↑×6.00 |
| U1 + U5 | – | RG | 8, same | 8, same |
| U1 + U6 | – | RG | – | – |
| U1 + U7 | RG | RG | 19.5632, ↑×2.40 | 16.1537, ↑×1.67 |
| U1 + U8 | – | – | 2, same | 2, same |
| U2 + U3 | – | RA, RC, RD, RF, RG | – | – |
| U2 + U4 | – | RA, RC, RD, RF, RG | 0.3974, ↑×5.93 | 0.1538, ↑×6.00 |
| U2 + U5 | RA, RD | RA, RC, RD, RF, RG | 0.5714, same | 0.5714, same |
| U2 + U6 | – | RA, RC, RD, RF, RG | – | – |
| U2 + U7 | RA, RC, RD, RF, RG | RA, RC, RD, RF, RG | 1.3974, ↑×2.40 | 1.1538, ↑×1.67 |
| U2 + U8 | RD | RD | 0.1429, same | 0.1429, same |
| U3 + U4 | – | RA, RC, RD, RF, RG | – | – |
| U3 + U5 | – | RA, RC, RD, RF, RG | – | – |
| U3 + U6 | – | RA, RC, RD, RF, RG | – | – |
| U3 + U7 | – | RA, RC, RD, RF, RG | – | – |
| U3 + U8 | – | RD | – | – |
| U4 + U5 | – | RA, RB, RC, RD, RE, RF, RG | 1.438, ↓×0.17 | 3.7143, ↓×0.17 |
| U4 + U6 | – | RA, RB, RC, RD, RE, RF, RG | – | – |
| U4 + U7 | RB, RE | RA, RB, RC, RD, RE, RF, RG | 3.5165, ↓×0.41 | 7.5, ↓×0.28 |
| U4 + U8 | – | RD | 0.3595, ↓×0.17 | 0.9286, ↓×0.17 |
| U5 + U6 | – | RA, RB, RC, RD, RE, RF, RG | – | – |
| U5 + U7 | RA, RD | RA, RB, RC, RD, RE, RF, RG | 2.4454, ↑×2.40 | 2.0192, ↑×1.67 |
| U5 + U8 | RD | RD | 0.25, same | 0.25, same |
| U6 + U7 | – | RA, RB, RC, RD, RE, RF, RG | – | – |
| U6 + U8 | – | RD | – | – |
| U7 + U8 | RD | RD | 0.1022, ↓×0.42 | 0.1238, ↓×0.60 |

## Tolerances

- *same*: within ±5%. Key readouts (31 checks: U6 transcription-site intensity, U7 nuclear count, whole-cell U2 : U4 ratios) are held to their rule with no allowance for counting noise; other checks may also differ by 2 standard errors of counting noise where counts are small.
- *↓×r / ↑×r*: the mutant / control ratio is within ±10% of the nominal ratio (widened by 2 standard errors for small counts). Ratios follow from the group weights, each group's production change and each compartment's group-1 share (see the `.toml`).
- Control means within ±20% of the nominal numbers (in brackets above).
- TDP-43 overlap: *chance* is within 4% (absolute) of the randomised-position control, in both genotypes.
- Transcription sites: number and intensity (mean nascent molecules per counted site) follow a Poisson model of the designed molecules per active site (`[ts]`, with `ts_active` and `ts_detect_min` in `[nascent]`), within the ratio rules above. They are checked only for probes with at least 4 molecules per active site in both genotypes; otherwise the table says "too few nascent molecules to measure". Look (bright, present, dim, none) is read from the nascent molecules per nucleus (molecules per site x 0.9).
