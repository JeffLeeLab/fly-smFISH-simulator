# Instructor key

The answer key for Part 1 of the smFISH Simulator, for the instructor and demonstrators running the session. **Not for students.** It covers all three cases: what each probe region shows, the pairs that settle each question, the designed verdicts, the traps, and prompts for groups that get stuck.

Correct as of 2026-10-27. The signed truth tables are the source of truth (`data/<case>/truth-table.toml`, readable in full as `data/<case>/truth-table.md`); where this file disagrees with them or with `docs/spec.md`, they win. This repository is public on GitHub, which is accepted; only `site/` is served to students.

## Reading this key

- **Region numbers.** Students see "Region N", never the internal ID: S7 is "Region 7" on their screen, F5 is "Region 5", U4 is "Region 4". Numbers run 5′→3′ along the map and restart for each gene. This key uses the internal IDs (S = *stai*, F = *futsch*, U = *unc-13*).
- **Colours.** smFISH 1 is green, smFISH 2 magenta, and a molecule carrying both regions shows white. The plot's channel toggle offers each region and "Both" (the white spots). When every molecule of one region also carries the other, "Both" is identical to the smaller channel; that is expected, and it tells a careful group that one region's molecules are a subset of the other's.
- **Numbers** are design values, control → mutant. The plot shows the mean of three animals, so its values differ from these by counting noise (a few spots). Counting units differ by case and are given in each section.
- **Verdicts.** Students choose *Ruled out*, *Supported* or *Unresolved* for each shortlisted mode. *Ambiguous* (mushroom body) and *not tested* are instructor categories: accept any verdict whose reasoning is right, and expect "This pair can't test it" for translation and cell-type-specific regulation in every case.
- **Labels.** *Established* is real biology; *Simplified* is how the teaching model behaves; *Invented for this case* is made up for teaching. Keep the distinction when you explain a case.

## Coverage

The design point: with only the constitutive probe, all three cases show the same thing, fewer mutant target spots at the synapses. The second probe leads to a different explanation in each case.

| Mode | Leg motor neuron – *stai* | Pdf – *futsch* | Mushroom body – *unc-13* |
| --- | --- | --- | --- |
| Transport / localisation | ✓ supported | ✗ ruled out | ~ ambiguous (the new isoform decays before it travels) |
| Granule incorporation | ✓ supported | ✗ ruled out (same share on granules) | ✗ ruled out (chance overlap) |
| Isoform-specific regulation | ? unresolved (only the long isoforms travel) | ✗ ruled out | ~ ambiguous (only group 1 is hit) |
| Splicing / intron retention | ✗ ruled out | ✗ ruled out | ✓ supported (exon inclusion) |
| Nuclear export / retention | ✗ ruled out | ? unresolved (failed export + nuclear decay) | ✗ ruled out |
| Stability | ✗ ruled out | ✓ supported | ? unresolved (NMD of the new isoform) |
| Translation | not tested | not tested | not tested |
| Cell-type-specific | not tested | not tested | not tested |

The three stories: RNA **redistributed** (leg motor neuron), **lost** (Pdf) and **mis-spliced** (mushroom body).

---

## Leg motor neuron & NMJ – *stai*: RNA stuck on the way

**Phenotype (step 1).** Climbing assay: climbing index 0.8 in hTDP-43 WT, 0.2 in the mutant, whose legs shake.

**TDP-43 (step 3).** A mild nuclear loss (1.0 → 0.7). More transport granules in the mutant (per neuron: cell body 5 → 10, axon 5 → 25, synaptic terminals 2 → 8); they are larger than in the other cases, and in the mutant axon they are stretched (viscous). No aggregates.

**The design.**
- *Established:* *stai* is the fly stathmin (human STMN2), which regulates microtubules. STMN2 is one of the best-known TDP-43 targets in human neurons (Klim et al. 2019; Melamed et al. 2019, *Nat. Neurosci.*). TDP-43 forms mRNA transport granules in axons (Alami et al. 2014, *Neuron*), and ALS-linked mutations make them more viscous (Gopal et al. 2017, *PNAS*).
- *Invented for this case:* the long-3′UTR isoforms ride TDP-43 granules down the axon. In the mutant the viscous granules stall in the axon with their long-3′UTR cargo, so fewer long molecules reach the synaptic terminals and more sit in the axon on granules. Production, splicing and decay are unchanged.
- *Isoforms in this neuron:* long 3′UTR, RB and RD (60:40); short 3′UTR, RC and RE (15:50), both from the first start site. **stai-RA is annotated but not expressed here** (instructor, 2026-10-27). The map still draws it, because FlyBase annotates it; expression in one cell type is a separate question. So Region 1 detects every short isoform, Region 8 every long one, and the cassette exon is in every molecule.

**Molecules** (nucleus and cell body per cell; axon and synaptic terminals per animal; one motor neuron per animal):

| Compartment | Long (RB, RD) | Short (RC, RE) | CG31642 (S3 only) | All *stai* |
| --- | --- | --- | --- | --- |
| Nucleus | 3 | 12 | 3 | 15 |
| Cell body | 30 | 120 | 20 | 150 |
| Axon | 48 → 73 | 12 | 0 | 60 → 85 |
| Synaptic terminals | 51 → 20 | 9 | 0 | 60 → 29 |

On TDP-43 granules in the axon: 10% → 55% of the long molecules ride on them. Short molecules, and all *stai* RNA in the cell body and synaptic terminals, sit on granules only by chance (chance is about 2% in WT and 10–13% in the mutant, which has five times the granules).

**Probe menu**

| Region | ID | What it is | Mature molecules it detects here | What it shows, control → mutant | Role |
| --- | --- | --- | --- | --- | --- |
| 1 | S1 | first exon, start site 1 | RC, RE (every short isoform) | Flat everywhere: nucleus 12, cell body 120, axon 12, synaptic terminals 9. Chance on granules. Bright transcription sites. | The short-isoform readout |
| 2 | S2 | first exon, start site 2 (nested) | RB | Behaves as the long isoforms: cell body 18 flat, axon 29 → 44, synaptic terminals 31 → 12. Bright transcription sites (also made by the RC/RE pre-mRNA, which runs through it). | Start-site decoy; shows that RA is absent |
| 3 | S3 | intron | none of *stai*; CG31642 mRNA | Spots in the nucleus (3) and cell body (20), the same in both genotypes, none in the axon or synaptic terminals; bright *stai* transcription sites. | Trap: a nested gene on the same strand |
| 4 | S4 | first exon, start site 3 (nested) | RD | Behaves as the long isoforms: cell body 12 flat, axon 19 → 29, synaptic terminals 20 → 8. | Start-site decoy |
| 5 | S5 | intron | none (nascent only) | Transcription sites only, about 12 nascent molecules per site, flat. | Production readout |
| 6 | S6 | cassette exon | every molecule | Identical to Region 7. | Splicing decoy |
| 7 | S7 | last exon | every molecule | Nucleus 15 and cell body 150 flat; axon 60 → 85; synaptic terminals 60 → 29; proportion in synaptic terminals 0.22 → 0.11; on granules in the axon about 10% → 55%. | Constitutive reference |
| 8 | S8 | long 3′UTR | RB, RD (every long isoform) | Nucleus 3 and cell body 30 flat; axon 48 → 73; synaptic terminals 51 → 20; on granules in the axon about 10% → 60%. Dim transcription sites. | The long-isoform readout |

**Pairs that settle it**

| Pair | White spots | What it shows |
| --- | --- | --- |
| S7 + S8 (the informative pair) | the long isoforms ("Both" = Region 8) | The molecules missing from the synaptic terminals are long-3′UTR isoforms, and they pile up in the axon on TDP-43 granules. The long:short ratio in the cell body is the same in both genotypes (Region 8 : Region 7 = 0.2), so "less long isoform made" is ruled out. |
| S1 + S8 | none | Splits the RNA cleanly into short (green) and long (magenta). The short isoforms are flat everywhere and at chance on granules; the long ones fall in the synaptic terminals, rise in the axon and ride granules there. The clearest picture of the phenotype. |
| S2 + S8 | every mature Region 2 spot ("Both" = Region 2) | Every molecule made from start site 2 has the long 3′UTR, so RA (short, from start site 2) is not made. The transcription site stays single-coloured: Region 2 lies in the RC/RE pre-mRNA, and nascent Region 8 is dim. |
| S6 + S7 | every spot, in both genotypes and every compartment | The cassette exon is always included: no skipping in either genotype (the splicing null). It also shows that RA, the only isoform that skips it, is absent. |
| S5 + S7 | transcription sites only | Transcription sites are flat, so production is unchanged. Weak evidence here: one nucleus per animal gives only three sites per genotype (every nucleus has an active site in this case). |

**Verdicts**
- **Transport: supported.** With Region 7 the synaptic terminals fall (60 → 29) and the axon rises (60 → 85) while the whole cell is flat (285 → 279): the RNA is redistributed, not lost. The plot's distal measure here is "Proportion in synaptic terminals" (0.22 → 0.11), because axon + synaptic terminals stays flat (0.44 → 0.43): the RNA stalls inside the axon.
- **Granule incorporation: supported.** More long-3′UTR mRNA sits on TDP-43 granules in the mutant axon, far above chance; the short isoforms stay at chance.
- **Isoform-specific regulation: unresolved (designed).** Only the long isoforms are lost from the synaptic terminals, but they are also the only ones that travel: about 15% of short-isoform RNA in the cytoplasm is in the axon or synaptic terminals, against about 77% of long. So a snapshot can't tell a stall specific to the long isoforms (an RNA-specific stall in TDP-43 granules) from a general failure of microtubule transport that shows only in the RNA that travels; stathmin itself regulates microtubules, so the defect could feed itself. A group that marks it *supported* has read the observation correctly; *unresolved* is the stronger answer. A sharp group may argue that the short isoforms' flat count in the synaptic terminals (about 9 → 9) counts against general failure. That's a fair point to credit, but it rests on about 9 molecules per animal with n = 3, and the few short molecules there may not travel by the same route.
- **Splicing: ruled out.** Region 6 + Region 7 is white everywhere in both genotypes. In the nucleus and cell body, Regions 1, 2 and 4 keep the same ratio to Region 7 in both genotypes.
- **Nuclear export: ruled out.** N:C unchanged (nucleus 15, cell body 150 in both).
- **Stability: ruled out.** Whole-cell count unchanged.

**Traps**
- **The STMN2 lead.** Groups that search STMN2 find its cryptic exon and expect a splicing defect. Region 6 + Region 7 gives a clean null at once. That is fine: choosing a new pair is how a group recovers.
- **Start-site "switch" in the synaptic terminals.** Regions 2 and 4 detect only long isoforms, so they fall more than Region 7 there (−61% against −52%). Region 2 + Region 7 or Region 4 + Region 7 can look like a switch of start site, until the cell body shows the same ratio in both genotypes. The lesson: judge splicing and start-site choice where the RNA is made.
- **Region 3 and CG31642.** The intron probe also detects CG31642, a gene nested in that intron on the same strand, so Region 3 has cytoplasmic spots that look like intron retention. They are the same in both genotypes, and they are not white with Region 7 (retained-intron *stai* would be).
- **Two identical plots.** In Region 7 + Region 8, "Both" is identical to Region 8. Not a bug: every long molecule carries the last exon.

**Prompts for a stuck group** (questions, not answers)
- Only Region 7 so far: "Your spots fell in the synaptic terminals. Did the neuron make less, or did the RNA end up somewhere else? Which compartment would tell you?"
- "Which molecules reach the synaptic terminals in WT? Is there a region on the map found in only some of them?"
- After Region 7 + Region 8: "Which molecules are the green-only spots? Do they behave like the white ones?"
- On splicing: "Where in the cell is splicing decided? Compare your ratio there."
- On Region 3: "Are the Region 3 spots in the cell body white with Region 7? What else lies in that intron on the map?"

**Instructor only (outside the students' scope).** The mutant has fewer synaptic terminals (20 → 15), visible in the images but never measured or plotted. Spots are set as a compartment total, so the fall holds per terminal too (3.0 → 1.9).

**Hand-off to Part 2.** Is the defect specific to the long isoforms, or would any RNA that travels stall? Live imaging of an MS2-tagged long-3′UTR reporter in leg axons shows the stall but not its cause; an unrelated axonal cargo as a comparison, or removing the TDP-43-binding sites from the long 3′UTR once mapped (iCLIP, deletion series), would separate the two. The real *stai* 3′UTR has no canonical (UG)n runs, so the binding sites in the model are invented.

---

## Pdf clock neurons – *futsch*: RNA made but not kept

**Phenotype (step 1).** Activity monitor: the mutant keeps waking at night.

**TDP-43 (step 3).** A clear nuclear loss (1.0 → 0.4), less diffuse cytoplasmic signal, and irregular aggregates around the nucleus in the mutant (1–3 per cell). Small round transport granules are the same in both genotypes.

**The design.**
- *Established:* *futsch* is the fly MAP1B, a microtubule-associated protein, and its mRNA sits in TDP-43 complexes (Coyne et al. 2014). TDP-43 regulates mRNA stability as well as splicing.
- *Invented for this case:* soluble cytoplasmic TDP-43 keeps *futsch* mRNA stable. The mutant loses soluble cytoplasmic TDP-43 (0.16 → 0.08 of the control nuclear level) into aggregates (*Simplified*: total cytoplasmic TDP-43 rises while the soluble pool falls), so *futsch* mRNA decays faster in the cytoplasm. Production, export, transport and splicing are unchanged.
- *Isoforms:* RC : RF : RE = 50 : 25 : 25 in both genotypes. They encode the same protein and differ in start site and 3′ end; only RE has the long 3′UTR.

**Molecules** (4 s-LNvs per animal; nucleus and cell body per cell, axon and dorsal terminals per animal):

| Compartment | Control | Mutant |
| --- | --- | --- |
| Nucleus | 10 | 10 |
| Cell body | 80 | 40 |
| Axon | 100 | 52 |
| Dorsal terminals | 100 | 48 |

*futsch* is a granule cargo in both genotypes: about 30% of axonal and 19% of terminal spots sit on transport granules (chance about 7% and 3–5%); the cell body is at chance. No *futsch* mRNA sits in aggregates.

**Probe menu**

| Region | ID | What it is | Mature molecules it detects | What it shows, control → mutant | Role |
| --- | --- | --- | --- | --- | --- |
| 1 | F1 | first exon, start site 1 | RF | Cytoplasm falls 40–60%, nucleus flat, N:C doubles. | Start-site decoy |
| 2 | F2 | intron | none (RF nascent only) | Transcription sites only, flat. | RF-only nascent RNA |
| 3 | F3 | first exon, start site 2 (nested) | RE | As Region 1. | Start-site decoy |
| 4 | F4 | 5′UTR exon | RE, RF | As Region 1. | Absent from RC |
| 5 | F5 | intron (13 kb) | none (nascent only) | Bright transcription sites (about 20 nascent molecules), flat; no intron-positive spots away from them. | Production readout |
| 6 | F6 | giant coding exon | every molecule | Nucleus 10 flat; cell body 80 → 40; axon 100 → 52; terminals 100 → 48; N:C 0.125 → 0.25. | Constitutive reference |
| 7 | F7 | intron (63 nt) | none (nascent only) | Dim transcription sites, flat. | 3′ intron |
| 8 | F8 | long 3′UTR (proximal part) | RE | As Region 1; no transcription sites. | Long-3′UTR decoy (stops short of Gr2a) |

**Pairs that settle it**

| Pair | White spots | What it shows |
| --- | --- | --- |
| F6 + F5 (the informative pair) | transcription sites only | Transcription sites are unchanged, so production looks normal. There are no intron-positive spots away from transcription sites (no retained intron, no pre-mRNA leaking out). The share of cytoplasmic RNA reaching the terminals is normal. So the RNA is made, exported and transported, but not kept. |
| F6 + F1, F3, F4 or F8 | the isoforms carrying both | Every isoform falls together: the ratios to F6 are the same in both genotypes, so isoform-specific regulation is ruled out. |

**Verdicts**
- **Stability: supported.** The cytoplasm loses RNA while production (transcription sites) is unchanged.
- **Nuclear export: unresolved (designed).** An export block that leaves RNA in the nucleus is ruled out: nuclear counts are flat. But RNA that fails export and is degraded fast in the nucleus would leave nothing behind in a snapshot, so failed export with nuclear decay can't be excluded.
- **Transport: ruled out.** The share reaching the axon and terminals ("Proportion in axon + terminals") is the same in both genotypes.
- **Isoform-specific regulation: ruled out.** The ratios of Regions 1, 3, 4 and 8 to Region 6 are unchanged.
- **Splicing and intron retention: ruled out.** No intron-positive spots outside transcription sites; isoform ratios flat.
- **Granule incorporation: ruled out.** *futsch* is on granules above chance, but at the same share in both genotypes, and never in aggregates.

**Traps**
- **Region 6 alone looks like nuclear retention.** N:C doubles, but the nucleus doesn't gain RNA (10 → 10): the cytoplasm loses it.
- **Above chance on granules.** Tempting to mark granule incorporation *supported*. Above chance is normal *futsch* biology here; it doesn't change with the mutation, so it isn't the defect.
- **Aggregates.** Mutant aggregates are prominent in step 3, but no *futsch* RNA sits in them.
- **Region 8 and Gr2a.** Only RE has the long 3′UTR, whose distal part overlaps Gr2a on the same strand. Region 8 is the proximal part only and falls like every other region.
- **Literature.** Groups may find that TDP-43 overexpression shifts *futsch* mRNA from the NMJ to cell bodies and out of polysomes (Coyne et al. 2014), or that TBPH loss lowers Futsch protein through a UG-rich 5′UTR element (Romano et al. 2016). That is background, and the reason *futsch* is used in Pdf neurons rather than at the NMJ. A group that predicts a transport or translation defect from these papers is reasoning well: the Pdf data rule transport out, and translation can't be tested.

**Prompts for a stuck group**
- "N:C doubled. Did the nucleus gain RNA, or did the cytoplasm lose it?"
- "Is the neuron still making *futsch*? Which region would show RNA being made?"
- "*futsch* sits on granules above chance. Is that different between WT and mutant?"
- "If the RNA were made normally and travelled normally, where could it be lost?"

**Caveat worth raising.** Transcription-site brightness is only a stand-in for production; with 12 nuclei per genotype (4 per animal) it is usable.

**Instructor only (outside the students' scope).** Mutant dorsal terminals are slightly less branched, but spots per terminal area are still lower after normalising; the site doesn't plot per-area counts. Sampled at ZT2, when s-LNv dorsal terminals are most branched (they remodel daily; Fernández et al. 2008).

**Hand-off to Part 2.** Is the RNA lost in the cytoplasm, or never exported and degraded in the nucleus? A transcription shut-off in explanted brains with an smFISH time course of nuclear and cytoplasmic counts, or cell-type-specific metabolic labelling (TU-tagging). Knocking down nuclear (Rrp6, exosome) or cytoplasmic (Pacman/Xrn1) decay in Pdf neurons could tell the two routes apart.

---

## Mushroom body – *unc-13*: a poison exon

**Phenotype (step 1).** T-maze: the mutants choose at chance.

**TDP-43 (step 3).** A nuclear loss in Kenyon cells (1.0 → 0.6). Sparse puncta across the neuropil, the same in both genotypes; rare aggregates in mutant cell bodies (0–1 per cell body).

**The design.**
- *Established:* TDP-43 keeps cryptic exons out of human UNC13A and STMN2 transcripts, and their inclusion is a hallmark of TDP-43 loss in ALS (Ma et al. 2022; Brown et al. 2022, *Nature*).
- *Invented for this case:* nuclear TDP-43 binds UG repeats next to the acceptor of an exon in group-1 pre-mRNA and keeps it out. The exon (the span of U4) is group 2's first coding exon and lies in an intron of group 1. With nuclear TDP-43 at 0.6, 70% of group-1 transcripts include it (control 2%). The 5,876-nt exon shifts the reading frame, so these transcripts go to nonsense-mediated decay (NMD) and decay before they travel far (surviving share: nucleus 1, cell body 0.35, calyx 0.1, axon bundle 0.05, lobes 0). Group-1 *unc-13* in the lobes falls to a third, so less UNC-13 reaches the synapses. *Simplified:* the premature stop is not sequence-checked, and NMD is drawn as a steady state.
- *Isoforms:* group 1 = RA, RC, RD, RF, RG (30:15:10:10:5); group 2 = RB, RE (20:10), from a start site nested in a group-1 intron. Production is 70 : 30 (group 1 : group 2) in both genotypes.

**Molecules** (30 Kenyon cells per animal; counts per Kenyon cell here):

| Compartment | Control total (white U2 + U4) | Mutant total (white U2 + U4) |
| --- | --- | --- |
| Nucleus | 3.0 (0.04) | 3.0 (1.47) |
| Cell body | 19.8 (0.09) | 14.1 (3.19) |
| Axon bundle (peduncle) | 2.95 (0) | 1.40 (0.08) |
| Lobes | 5.9 (0) | 2.2 (0) |

On the plot, the nucleus and cell body are per Kenyon cell, the axon bundle per animal (all 30 cells) and the lobes per lobe system (10 cells each). The calyx is simulated but never counted or shown to students. No *unc-13* mRNA rides on the puncta, so overlap is at chance in both genotypes.

**Probe menu**

| Region | ID | What it is | Mature molecules it detects | What it shows, control → mutant | Role |
| --- | --- | --- | --- | --- | --- |
| 1 | U1 | first exon, far-upstream start site | RG | Falls with group 1; few molecules. | Start-site decoy |
| 2 | U2 | N-terminal exon | group 1 | Nucleus flat; cell body ×0.55; axon bundle ×0.34; lobes ×0.31; whole cell ×0.51; N:C ×1.8; share in axon bundle + lobes 0.37 → 0.26. | Group-1 readout |
| 3 | U3 | intron | none (group-1 nascent only) | Transcription sites, flat. | Group-1 production |
| 4 | U4 | N-terminal exon of group 2 (in a group-1 intron) | group 2, plus group 1 that includes the exon | Nucleus ×2.5; cell body ×1.44; axon bundle ×1.14; lobes flat. | The poison exon |
| 5 | U5 | alternative exon | RA, RD | Falls with group 1. | Splicing decoy |
| 6 | U6 | intron | none (nascent, both groups) | Transcription sites (about 10 nascent molecules), flat. | Production readout |
| 7 | U7 | last exon | every molecule | Nucleus flat; cell body ×0.71; axon bundle ×0.48; lobes ×0.38; whole cell 31.7 → 20.7 per cell. | Constitutive reference |
| 8 | U8 | long 3′UTR | RD | Falls with group 1. | 3′-end decoy |

**Pairs that settle it**

| Pair | White spots | What it shows |
| --- | --- | --- |
| U2 + U4 (the informative pair) | appear in mutant nuclei (0.04 → 1.5 per cell) and cell bodies (0.09 → 3.2); barely any in the axon bundle, none in the lobes | No annotated isoform has U2 and U4 together, so a white spot marks a junction that is not on the map: group-1 RNA that includes the exon. The white spots stop at the cell body: the new isoform decays before it travels. |
| U3 or U6 + U7 | transcription sites only | Transcription sites are flat, so both groups are made as before; the fall happens after transcription. |
| U2 + U5, U2 + U8 | U5 or U8 molecules | Same ratio in both genotypes: Regions 5 and 8 simply follow group 1. |

**Verdicts**
- **Splicing: supported.** White U2 + U4 spots mark an exon included where it is normally kept out, with transcription sites flat.
- **Nuclear export: ruled out.** Nuclear counts don't rise for U2 or U7; N:C rises only because the cytoplasm loses molecules.
- **Granule incorporation: ruled out.** Overlap with TDP-43 puncta is at chance in both genotypes.
- **Isoform-specific regulation: ambiguous.** Only group 1 is hit, but only because only its pre-mRNA holds the exon in an intron; the cause is the splicing choice. Accept *supported* or *unresolved* if the reasoning links it to the splicing change.
- **Transport: ambiguous.** U2's share in the axon bundle + lobes falls, but because the new isoform decays before it gets there; the annotated isoforms travel as before. Accept a verdict that explains this; *supported* without the explanation is the misreading.
- **Stability: unresolved (designed).** Cytoplasmic counts fall with production unchanged: decay, by NMD of the new isoform. A snapshot can't exclude an added change in stability.

**Traps**
- **Region 4 alone.** Region 4 rises in the nucleus and cell body. It can look like nuclear retention, or like a switch to group 2's start site. Flat transcription sites (Regions 3 and 6) and the white U2 + U4 spots show it is group-1 RNA that includes the exon.
- **Region 5 + Region 7 and Region 7 + Region 8.** Regions 5 and 8 are group-1 only, so they fall more than Region 7. The ratio change looks like exon skipping or 3′UTR loss, until U2 + U5 or U2 + U8 shows the same ratio in both genotypes.
- **Literature.** Groups that search "UNC13A TDP-43" will find the cryptic-exon papers; the gene card gives no hint. That's legitimate background reading, but the evidence has to come from their own pair.

**Prompts for a stuck group**
- "Region 2 fell. Is the cell making less? Which region would tell you?"
- "Which isoforms on the map should be white with your pair? Are there white spots that no isoform explains?"
- "If a new isoform appeared, why might it be missing from the lobes?"
- "Region 4 went up while Region 2 went down. Is that one change or two?"

**Hand-off to Part 2.** Is the fall all NMD of the new isoform, or is stability changed too? Block NMD in Kenyon cells (Upf1 RNAi): the white spots should rise and reach the cytoplasm, and group-1 totals recover.

---

## Across the cases (for the plenary)

- **One observation, three explanations.** Every group's Region 7 or Region 6 shows fewer mutant spots at the synapses. The second probe turns it into redistribution (leg motor neuron), loss (Pdf) or mis-splicing (mushroom body).
- **Co-occurring modes and alternative explanations.** In the leg motor neuron, transport and granule incorporation are both true (one mechanism, two readouts). In the mushroom body, transport and isoform-specific regulation are consequences of the splicing change, not separate defects.
- **What a snapshot can't show.** Each case leaves one question unresolved because fixed tissue has no dynamics: a general vs RNA-specific stall (*stai*), nuclear vs cytoplasmic decay (*futsch*), NMD alone vs NMD plus a stability change (*unc-13*). These are where Part 2 starts.
- **A group's own Uncertainty may differ** from the designed one (it may not find the informative pair, or may reason differently). Work from what the group concluded.
