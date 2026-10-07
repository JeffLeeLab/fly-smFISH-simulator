# Truth table: PDF – *futsch* (draft)

Generated from `data/pdf/truth-table.toml` and the probe menu by `uv run python -m generator.truth_table pdf`. Every entry compares the hTDP-43 mutant with hTDP-43 WT (control). Sign off by editing the `.toml`, not this file.

## Verdicts

| Mode | Verdict |
| --- | --- |
| transport | ruled-out |
| granule | ruled-out |
| isoform | ruled-out |
| splicing | ruled-out |
| export | unresolved |
| stability | supported |
| translation | not-tested |
| celltype | not-tested |

## Single probes

Counts: nucleus and cell body per cell, axon and terminals per animal (four cells). N:C = nucleus / cell body. Distal share = (axon + terminals) / all cytoplasmic RNA. TDP-43 overlap = share of spots on TDP-43 transport granules (aggregates not counted), against the randomised-position level. TS = transcription sites.

| Region | Type | Mature in | Nascent in | Nucleus | Cell body | Axon | Terminals | Per area | N:C | Distal share | TDP-43 overlap | TS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F1 | first exon (TSS1) | RF | RF | same (2.5) | ↓ 40–60% (20) | ↓ 40–60% (25) | ↓ 40–60% (25) | ↓ (per area) | ↑ ×2 | same | cell body: chance; axon, terminals: above chance, same share | present, same |
| F2 | intron | – | RF | none | none | none | none | – | – | – | – | present, same |
| F3 | first exon (TSS2) | RE | RE, RF | same (2.5) | ↓ 40–60% (20) | ↓ 40–60% (25) | ↓ 40–60% (25) | ↓ (per area) | ↑ ×2 | same | cell body: chance; axon, terminals: above chance, same share | present, same |
| F4 | 5'UTR exon | RE, RF | RE, RF | same (5) | ↓ 40–60% (40) | ↓ 40–60% (50) | ↓ 40–60% (50) | ↓ (per area) | ↑ ×2 | same | cell body: chance; axon, terminals: above chance, same share | present, same |
| F5 | intron (13 kb) | – | RC, RE, RF | none | none | none | none | – | – | – | – | bright, same |
| F6 | giant coding exon | RC, RE, RF | RC, RE, RF | same (10) | ↓ 40–60% (80) | ↓ 40–60% (100) | ↓ 40–60% (100) | ↓ (per area) | ↑ ×2 | same | cell body: chance; axon, terminals: above chance, same share | present, same |
| F7 | intron (63 nt) | – | RC, RE, RF | none | none | none | none | – | – | – | – | dim, same |
| F8 | long 3'UTR (proximal part) | RE | RE | same (2.5) | ↓ 40–60% (20) | ↓ 40–60% (25) | ↓ 40–60% (25) | ↓ (per area) | ↑ ×2 | same | cell body: chance; axon, terminals: above chance, same share | none, same |

## Pairs

Channel 1 and channel 2 behave as the single probes above; the 56 ordered pairs differ only in which isoforms carry *both* regions (white spots) and in the channel-2 : channel-1 ratio, which is the same in both genotypes wherever both regions are mature. Swapping channels swaps the columns. One row per unordered pair:

| Pair | Both regions in (mature) | Both regions in (nascent) | White spots | Ch2 : ch1 ratio (control) |
| --- | --- | --- | --- | --- |
| F1 + F2 | – | RF | transcription sites only | – |
| F1 + F3 | – | RF | transcription sites only | 1, same |
| F1 + F4 | RF | RF | cytoplasm ↓ 40–60%, nucleus same | 2, same |
| F1 + F5 | – | RF | transcription sites only | – |
| F1 + F6 | RF | RF | cytoplasm ↓ 40–60%, nucleus same | 4, same |
| F1 + F7 | – | RF | transcription sites only | – |
| F1 + F8 | – | – | none | 1, same |
| F2 + F3 | – | RF | transcription sites only | – |
| F2 + F4 | – | RF | transcription sites only | – |
| F2 + F5 | – | RF | transcription sites only | – |
| F2 + F6 | – | RF | transcription sites only | – |
| F2 + F7 | – | RF | transcription sites only | – |
| F2 + F8 | – | – | none | – |
| F3 + F4 | RE | RE, RF | cytoplasm ↓ 40–60%, nucleus same | 2, same |
| F3 + F5 | – | RE, RF | transcription sites only | – |
| F3 + F6 | RE | RE, RF | cytoplasm ↓ 40–60%, nucleus same | 4, same |
| F3 + F7 | – | RE, RF | transcription sites only | – |
| F3 + F8 | RE | RE | cytoplasm ↓ 40–60%, nucleus same | 1, same |
| F4 + F5 | – | RE, RF | transcription sites only | – |
| F4 + F6 | RE, RF | RE, RF | cytoplasm ↓ 40–60%, nucleus same | 2, same |
| F4 + F7 | – | RE, RF | transcription sites only | – |
| F4 + F8 | RE | RE | cytoplasm ↓ 40–60%, nucleus same | 0.5, same |
| F5 + F6 | – | RC, RE, RF | transcription sites only | – |
| F5 + F7 | – | RC, RE, RF | transcription sites only | – |
| F5 + F8 | – | RE | transcription sites only | – |
| F6 + F7 | – | RC, RE, RF | transcription sites only | – |
| F6 + F8 | RE | RE | cytoplasm ↓ 40–60%, nucleus same | 0.25, same |
| F7 + F8 | – | RE | transcription sites only | – |

## Tolerances

- *same*: within ±5%. Key readouts (68 checks: F6 nuclear count and distal share, F5 transcription sites, whole-cell region ratios against F6) are held to that exactly, and their site counts must match; other *same* checks may also differ by 2 standard errors of counting noise where counts are small.
- *↓ 40–60%*: mutant 40%–60% of control (band widened by 2 standard errors for small counts).
- Control means within ±20% of the spec's numbers (in brackets above).
- TDP-43 overlap, against transport granules only: *chance* is within 4% (absolute) of the randomised-position control, in both genotypes; *above chance, same share* is at least 10% (absolute, less 2 standard errors) above it in both genotypes, with the mutant's share within ±5% of control's (or 2 standard errors of counting noise).
- Transcription sites: number within 2 nuclei of control; intensity within ±15%.
