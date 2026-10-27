# Truth table: Leg motor neuron – *stai* (signed-off)

Generated from `data/nmj/truth-table.toml` and the probe menu by `uv run python -m generator.truth_table nmj`. Every entry compares the hTDP-43 mutant with hTDP-43 WT (control). Sign off by editing the `.toml`, not this file.

## Verdicts

| Mode | Verdict |
| --- | --- |
| transport | supported |
| granule | supported |
| isoform | unresolved |
| splicing | ruled-out |
| export | ruled-out |
| stability | ruled-out |
| translation | not-tested |
| celltype | not-tested |

## Kinds of molecule

Mean mature molecules per cell (1 per animal), control → mutant. A probe counts the molecules of every kind that carries its region (stai isoforms by the probe menu, weighted within their kind; an overlapping gene by `also_detects`).

| Compartment | long (RB, RD) | short (RC, RE) | CG31642 | Total |
| --- | --- | --- | --- | --- |
| Nucleus | 3 | 12 | 3 | 18 |
| Cell body | 30 | 120 | 20 | 170 |
| Axon | 48 → 73.1 | 12 → 11.9 | 0 | 60 → 85 |
| Synaptic terminals | 51 → 20 | 9 | 0 | 60 → 29 |

On TDP-43 granules: 10% → 55% of the long molecules in the axon; none elsewhere.

Annotated but not expressed in this neuron, so left out of the isoform lists below: RA.

## Single probes

Counts per animal (1 cell). Brackets give the control mean. ↓×r and ↑×r give the nominal mutant / control ratio. N:C = nucleus / cell body. Distal share = synaptic terminals / (cell body + axon + synaptic terminals), the plot's "Proportion in synaptic terminals". TDP-43 overlap = share of spots on TDP-43 granules against the randomised-position level; where molecules ride on granules, the expected share is the nominal cargo share plus chance for the rest. TS = transcription sites, control → mutant.

| Region | Type | Mature in | Nascent in | Nucleus | Cell body | Axon | Synaptic terminals | N:C | Distal share | TDP-43 overlap | TS intensity | TS look |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | first exon (TSS1) | RC, RE | RC, RE | same (12) | same (120) | same (12) | same (9) | same | same | cell body: chance; axon: chance; synaptic terminals: chance | same | bright |
| S2 | first exon (TSS2) | RB | RB, RC, RE | same (1.8) | same (18) | ↑×1.52 (28.8) | ↓×0.39 (30.6) | same | ↓×0.41 | cell body: chance; axon: 10% → 55% on granules + chance; synaptic terminals: chance | same | bright |
| S3 | intron (overlaps CG31642) | CG31642 mRNA | RB, RC, RE | same (3) | same (20) | none | none | same | same | cell body: chance; axon: chance; synaptic terminals: chance | same | bright |
| S4 | first exon (TSS3) | RD | RB, RC, RD, RE | same (1.2) | same (12) | ↑×1.52 (19.2) | ↓×0.39 (20.4) | same | ↓×0.41 | cell body: chance; axon: 10% → 55% on granules + chance; synaptic terminals: chance | same | bright |
| S5 | intron | – | RB, RC, RD, RE | none | none | none | none | – | – | – | same | present |
| S6 | cassette exon | RB, RC, RD, RE | RB, RC, RD, RE | same (15) | same (150) | ↑×1.42 (60) | ↓×0.48 (60) | same | ↓×0.49 | cell body: chance; axon: 8% → 47% on granules + chance; synaptic terminals: chance | same | present |
| S7 | last exon | RB, RC, RD, RE | RB, RC, RD, RE | same (15) | same (150) | ↑×1.42 (60) | ↓×0.48 (60) | same | ↓×0.49 | cell body: chance; axon: 8% → 47% on granules + chance; synaptic terminals: chance | same | present |
| S8 | long 3'UTR | RB, RD | RB, RD | same (3) | same (30) | ↑×1.52 (48) | ↓×0.39 (51) | same | ↓×0.41 | cell body: chance; axon: 10% → 55% on granules + chance; synaptic terminals: chance | too few nascent molecules to measure | dim |

## Pairs

Channel 1 and channel 2 behave as the single probes above; the 56 ordered pairs differ in which molecules carry *both* regions (white spots) and in the channel-2 : channel-1 ratio in the nucleus + cell body (where the RNA is made: the splicing null) and in the synaptic terminals. The ratio is given as the control value and its change in the mutant. One row per unordered pair; swapping channels inverts the ratio:

| Pair | Both regions in (mature) | Both regions in (nascent) | Nucleus + cell body ratio | Synaptic terminals ratio |
| --- | --- | --- | --- | --- |
| S1 + S2 | – | RC, RE | 0.15, same | 3.4, ↓×0.39 |
| S1 + S3 | – | RC, RE | 0.1742, same | – |
| S1 + S4 | – | RC, RE | 0.1, same | 2.2667, ↓×0.39 |
| S1 + S5 | – | RC, RE | – | – |
| S1 + S6 | RC, RE | RC, RE | 1.25, same | 6.6667, ↓×0.48 |
| S1 + S7 | RC, RE | RC, RE | 1.25, same | 6.6667, ↓×0.48 |
| S1 + S8 | – | – | 0.25, same | 5.6667, ↓×0.39 |
| S2 + S3 | – | RB, RC, RE | 1.1616, same | – |
| S2 + S4 | – | RB, RC, RE | 0.6667, same | 0.6667, same |
| S2 + S5 | – | RB, RC, RE | – | – |
| S2 + S6 | RB | RB, RC, RE | 8.3333, same | 1.9608, ↑×1.23 |
| S2 + S7 | RB | RB, RC, RE | 8.3333, same | 1.9608, ↑×1.23 |
| S2 + S8 | RB | RB | 1.6667, same | 1.6667, same |
| S3 + S4 | – | RB, RC, RE | 0.5739, same | – |
| S3 + S5 | – | RB, RC, RE | – | – |
| S3 + S6 | – | RB, RC, RE | 7.1739, same | – |
| S3 + S7 | – | RB, RC, RE | 7.1739, same | – |
| S3 + S8 | – | RB | 1.4348, same | – |
| S4 + S5 | – | RB, RC, RD, RE | – | – |
| S4 + S6 | RD | RB, RC, RD, RE | 12.5, same | 2.9412, ↑×1.23 |
| S4 + S7 | RD | RB, RC, RD, RE | 12.5, same | 2.9412, ↑×1.23 |
| S4 + S8 | RD | RB, RD | 2.5, same | 2.5, same |
| S5 + S6 | – | RB, RC, RD, RE | – | – |
| S5 + S7 | – | RB, RC, RD, RE | – | – |
| S5 + S8 | – | RB, RD | – | – |
| S6 + S7 | RB, RC, RD, RE | RB, RC, RD, RE | 1, same | 1, same |
| S6 + S8 | RB, RD | RB, RD | 0.2, same | 0.85, ↓×0.81 |
| S7 + S8 | RB, RD | RB, RD | 0.2, same | 0.85, ↓×0.81 |

## Tolerances

- *same*: within ±5%. Key readouts (61: S1+S7 ch2 count axon, S1+S7 ch2 count cellbody, S1+S7 ch2 count terminals, S1+S8 ch2 count terminals, S2+S7 ch2 count axon, S2+S7 ch2 count cellbody, S2+S7 ch2 count terminals, S2+S8 ch2 count terminals, S3+S7 ch2 count axon, S3+S7 ch2 count cellbody, S3+S7 ch2 count terminals, S3+S8 ch2 count terminals, S4+S7 ch2 count axon, S4+S7 ch2 count cellbody, S4+S7 ch2 count terminals, S4+S8 ch2 count terminals, S5+S7 ch2 count axon, S5+S7 ch2 count cellbody, S5+S7 ch2 count terminals, S5+S8 ch2 count terminals, S6+S7 ch2 count axon, S6+S7 ch2 count cellbody, S6+S7 ch2 count terminals, S6+S8 ch2 count terminals, S7 ch1 count axon, S7 ch1 count cellbody, S7 ch1 count terminals, S7+S1 ch1 count axon, S7+S1 ch1 count cellbody, S7+S1 ch1 count terminals, S7+S2 ch1 count axon, S7+S2 ch1 count cellbody, S7+S2 ch1 count terminals, S7+S3 ch1 count axon, S7+S3 ch1 count cellbody, S7+S3 ch1 count terminals, S7+S4 ch1 count axon, S7+S4 ch1 count cellbody, S7+S4 ch1 count terminals, S7+S5 ch1 count axon, S7+S5 ch1 count cellbody, S7+S5 ch1 count terminals, S7+S6 ch1 count axon, S7+S6 ch1 count cellbody, S7+S6 ch1 count terminals, S7+S8 ch1 count axon, S7+S8 ch1 count cellbody, S7+S8 ch1 count terminals, S7+S8 ch2 count terminals, S7+S8 ratio region_ratio whole_cell, S8 ch1 count terminals, S8+S1 ch1 count terminals, S8+S2 ch1 count terminals, S8+S3 ch1 count terminals, S8+S4 ch1 count terminals, S8+S5 ch1 count terminals, S8+S6 ch1 count terminals, S8+S7 ch1 count terminals, S8+S7 ch2 count axon, S8+S7 ch2 count cellbody, S8+S7 ch2 count terminals) are held to their rule with no allowance for counting noise; other checks may also differ by 2 standard errors of counting noise where counts are small.
- *↓×r / ↑×r*: the mutant / control ratio is within ±10% of the nominal ratio (widened by 2 standard errors for small counts).
- Control means within ±20% of the nominal numbers (in brackets above).
- TDP-43 overlap: *chance* is within 4% (absolute) of the randomised-position control, in both genotypes; *on granules + chance* is within 8% (absolute, or 2 standard errors) of the nominal cargo share plus chance for the rest.
- Transcription sites: number and intensity follow a Poisson model of the designed molecules per active site (`[ts]`, with `ts_active` and `ts_detect_min` in `[nascent]`). Intensity is checked only for probes with at least 4 molecules per active site; with one nucleus per animal, the number of sites may differ by 1. Look (bright, present, dim, none) is read from the nascent molecules per nucleus (molecules per site × 1).
