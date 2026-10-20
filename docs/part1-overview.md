# smFISH Simulator: what Part 1 teaches

A brief for designing Part 2 and later parts of the course. It summarises `PRODUCT.md` and `docs/spec.md` as of 2026-10-20; where they disagree with this file, they win.

> **This file contains the instructor answer key (section 7).** Keep section 7 out of anything students see.

## 1. In one paragraph

The smFISH Simulator is a static web app for one 2-hour, student-led feedback session on the final-year (L4) *Core Skills in MCB* course. Each group takes one *Drosophila* neuron system from humanised TDP-43 flies (human wild-type TDP-43 vs an ALS-linked point mutant). The group designs a two-colour smFISH experiment on a real FlyBase transcript map, reads simulated confocal images of control and mutant neurons, and reasons from the evidence to which post-transcriptional regulation (PTR) modes fail. The app is **Part 1**. It is built to **narrow the hypotheses, not solve the case**: each case rules out at least one mode, supports one or two, and leaves one unresolved on purpose. That unresolved mode is where **Part 2** starts.

## 2. Course aim and context

- **Aim (instructor, 2026-10-20):** methods literacy in RNA-binding proteins (RBPs) and PTR. Students learn the new and frequently used methods, and what each can and cannot tell them. TDP-43 and ALS are the worked example, not the subject: students are not meant to become ALS experts. smFISH and spatial imaging lead, because they are the instructor's own technique.
- **Session:** 2 hours, three groups at once, each on its own system at its own pace on students' own laptops. There is no instructor view and no shared screen; the plenary is a discussion, and groups present from their own slides.
- **Students:** final-year undergraduates, many new to FISH.
- **Around it:** a companion lecture on RNA/RBP "Core Skills". FlyBase is the external reference. The app and the reading go to students **before** the session (agreed 2026-10-20).

## 3. The teaching model

- **Genotype:** fly *TBPH* replaced at its own locus by human *TDP-43* (*TARDBP*), either wild type (the control throughout) or an ALS-linked point mutant (mutation unspecified). Based on real knock-in lines (Chang & Morton 2017). The correct control is the humanised WT fly, not a wild-type fly: that is a design point for students.
- **Images:** 2D maximum-intensity projections of one labelled neuron type (GAL4 > UAS-mCD8::BFP). Four channels: membrane + DAPI (blue), smFISH 1 (green), smFISH 2 (magenta), TDP-43 immunofluorescence (red-orange). A molecule carrying both probed regions shows white. n = 3 animals per genotype.
- **Three cases**, one per group:

| Case (code id) | Neurons shown | Phenotype and assay (step 1) | Target gene (human orthologue) | Compartments counted |
| --- | --- | --- | --- | --- |
| Pdf clock neurons (`pdf`) | 4 s-LNvs per animal | Sleep and circadian rhythm: activity monitor; the mutant keeps waking at night | *futsch* (MAP1B) | Nucleus, cell body, axon, dorsal terminals |
| Leg motor neuron & NMJ (`nmj`) | 1 leg motor neuron (cell body in the VNC, terminals in the femur) | Locomotion: climbing assay; mutants climb poorly, legs shaking | *stai* (STMN2) | Nucleus, cell body, axon, synaptic terminals |
| Mushroom body (`mb`) | 30 Kenyon cells | Memory: T-maze; mutants at chance | *unc-13* (UNC13A) | Nucleus, cell body, axon bundle, lobes |

- **What is real and what is not.** Every claim is classed as *Established* (TDP-43 and RNA regulation), *Simplified* (how the teaching model behaves) or *Invented for this case* (the target–cell type–behaviour links, the stronger phenotypes, the mechanisms in section 7). Students see only a dashed "Simulated" pill; every image and animation is labelled simulated.

## 4. The student journey: eight steps in five stages

| Stage | Step | What happens | What students record |
| --- | --- | --- | --- |
| Introduction | 1 Phenotype | Animated hero (the knock-in, two identical flies), then a landing with the three assays; the group picks its system and watches its assay. | – |
| | 2 Anatomy | Scroll-driven descent from the fly into the labelled neurons, ending in the microscope view. | – |
| RBP dysfunction | 3 TDP-43 dysfunction | Viewer with membrane + DAPI and TDP-43 only, WT and mutant side by side (or flicker). Observation by eye; no measurements. | Observation |
| | 4 TDP-43 and its targets | About a minute of animation: one target mRNA's life in a neuron (splicing, nuclear export, translation, decay, RNA transport granule, transport, local translation), TDP-43 at each station, normal function only. Then the target is named as a candidate, and the question is set: *"Which steps in the life of* gene *mRNA go wrong when TDP-43 carries the ALS mutation?"* | – |
| Experimental design | 5 Hypotheses | Shortlist at least two of eight PTR mode cards, grouped by where TDP-43 acts (below). The transcript map is not shown yet. | Shortlist, optional "because…" |
| | 6 Probe design | Gene card (function, FlyBase and NCBI links) above the real transcript map: isoforms, exons and introns, CDS/UTR, start sites, 3′ ends, overlapping genes. Students pick two of eight curated regions (decoys and traps included) for smFISH 1 and 2. Unlimited attempts, no penalties. | Optional prediction per mode, or "This pair can't test it" |
| Observe | 7 Microscopy reveal | Zoomable split viewer (whole neuron down to single spots), a region-level decoder legend and a SuperPlot of five measures (below). | Observation, Interpretation, verdict per mode: ruled out / supported / unresolved |
| Conclude | 8 Interpret & revise | Summary of the experiment and verdicts. | Claim ("our leading explanation"), Uncertainty ("the strongest remaining alternative", chosen from their unresolved modes, with a reason) |

- **The eight mode cards:** *Nucleus:* splicing / alternative exon / intron retention; nuclear export / retention. *Cytoplasm:* RNA stability; localisation / transport; translation; granule incorporation. *Both:* isoform-specific regulation; cell-type-specific regulation.
- **The five plotted measures:** spots in each compartment; nucleus vs cell body (N:C); the distal share (axon + terminals; synaptic terminals alone in the leg motor neuron, axon bundle + lobes in the mushroom body); transcription sites (nascent molecules per nucleus); spots on TDP-43 granules, against a randomised-position chance band. The SuperPlot shows the animal as the unit of replication (mean ± SD, n = 3). It has no p-values or significance stars.
- **What leaves the app:** PNGs only (viewer, plot and a 1920×1080 *Part 1 summary* slide with the question, probe pair, verdicts, Claim and Uncertainty), each copied or downloaded from its Save menu and pasted into the group's own PowerPoint. The notebook lives in each browser's localStorage; nothing is uploaded, so the instructor sees a group's Part 1 work only through its slides.

## 5. Skills Part 1 exercises

- **Reading a gene model:** isoforms, alternative start sites and 3′ ends, cassette exons, nested promoters, introns of very different sizes, strand and orientation, an overlapping gene on the same strand.
- **Designing two-colour smFISH:** a constitutive exon as the reference, plus a second region chosen to separate explanations (an intron for nascent RNA and transcription sites, an alternative exon or 3′UTR for isoforms). Working out from the map which molecules turn white, green only or magenta only.
- **Quantifying by compartment:** counts, ratios (N:C, distal share, isoform ratios) and co-localisation against chance.
- **Reasoning:** separating observation from interpretation; telling co-occurring modes (both true) from alternative explanations (one observation, several causes); giving "unresolved" as an honest verdict; seeing what a fixed snapshot cannot show.
- **The design point:** with only the constitutive probe, all three cases show the same thing: fewer mutant target spots at the synapses. The second probe leads to a different explanation in each case, so the plenary compares one observation with three explanations.

## 6. What Part 1 cannot test (deliberately left for Part 2)

- **No dynamics:** fixed tissue at one time point, so no decay rates, transport speeds or export kinetics.
- **No target protein readout**, so translation cannot be tested.
- **One cell type per group**, so cell-type-specific regulation cannot be tested.
- **No perturbations or follow-up experiments** on the site: no RNAi, rescue, NMD block, binding-site mutation, time course or extra probe pair.
- **Simplified detection:** every molecule is detected (efficiency 1.0), with no false positives and no probe thermodynamics. Transcription-site brightness only stands in for production.
- **TDP-43 is qualitative:** seen by eye in step 3, never measured.

Students meet the translation and cell-type limits themselves, through the "This pair can't test it" box.

## 7. Case outcomes (instructor answer key; not for students)

Probe IDs are internal (S = *stai*, F = *futsch*, U = *unc-13*, numbered 5′→3′); students see them as "Region N", for example S7 as "Region 7".

**Leg motor neuron – *stai*: RNA stuck on the way**
- *TDP-43:* mild nuclear loss; more and larger transport granules in the axon and synaptic terminals, stretched (viscous) in the mutant; no aggregates.
- *One probe (S7, last exon):* synaptic terminals 60 → 29, axon 60 → 85, whole cell unchanged. The RNA is redistributed, not lost.
- *Informative pair:* S7 + S8 (long 3′UTR). The missing molecules are the long-3′UTR isoforms, sitting on TDP-43 granules in the axon.
- *Supported:* transport; granule incorporation. *Ruled out:* splicing (cell-body ratios are unchanged, and the cassette-exon drop in the terminals is a trap), nuclear export, stability.
- *Unresolved → Part 2:* isoform-specific regulation. The long isoforms are the only ones that travel, so a stall specific to them cannot be told apart from a general failure of microtubule transport (stathmin itself regulates microtubules).
- *Trap:* the intron probe S3 also detects the nested gene CG31642.

**Pdf clock neurons – *futsch*: RNA made but not kept**
- *TDP-43:* nuclear loss, less diffuse cytoplasmic signal, aggregates around the nucleus; transport granules the same in both genotypes.
- *One probe (F6, constitutive exon):* fewer spots in the cell body, axon and terminals, nucleus flat, so N:C doubles. This looks like nuclear retention.
- *Informative pair:* F6 + F5 (13-kb intron). Transcription sites unchanged, no intron-positive spots outside them, distal share normal.
- *Supported:* stability (faster decay). *Ruled out:* an export block that holds RNA in the nucleus, transport, isoform-specific regulation, splicing and intron retention, granule incorporation.
- *Unresolved → Part 2:* is the RNA lost in the cytoplasm, or never exported and degraded in the nucleus? Nuclear decay is fast, so a snapshot cannot tell.
- *Invented mechanism:* soluble cytoplasmic TDP-43 keeps *futsch* mRNA stable, and the mutant loses it to aggregates.

**Mushroom body – *unc-13*: a poison exon**
- *TDP-43:* nuclear loss in Kenyon cells; puncta the same in both genotypes; rare aggregates in mutant cell bodies.
- *One probe (U2, a group-1 exon):* about half the spots overall and a third in the axon bundle and lobes; nucleus and transcription sites flat.
- *Informative pair:* U2 + U4. White spots appear in mutant nuclei and cell bodies, marking an exon junction that no annotated isoform has.
- *Supported:* splicing (exon inclusion). *Ruled out:* granule incorporation, nuclear export. *Ambiguous:* isoform-specific regulation and transport (both follow from the splicing change).
- *Unresolved → Part 2:* is the fall all nonsense-mediated decay (NMD) of the new isoform, or is stability changed too?
- *Invented mechanism:* nuclear TDP-43 binds UG repeats and keeps a frameshifting exon out of group-1 pre-mRNA, as with the cryptic exons in human UNC13A and STMN2; the included exon sends the mRNA to NMD.

**Coverage** (✓ supported, ✗ ruled out, ? unresolved, ~ ambiguous)

| Mode | Leg motor neuron – *stai* | Pdf – *futsch* | Mushroom body – *unc-13* |
| --- | --- | --- | --- |
| Transport / localisation | ✓ | ✗ | ~ |
| Granule incorporation | ✓ | ✗ | ✗ |
| Isoform-specific | ? | ✗ | ~ |
| Splicing / intron retention | ✗ | ✗ | ✓ |
| Nuclear export / retention | ✗ | ? | ✗ |
| Stability | ✗ | ✓ | ? |
| Translation | not tested | not tested | not tested |

A group's own Uncertainty may differ from the designed one (a group may not find the informative pair, or may reason differently), so Part 2 should work from whatever the group concluded.

## 8. Part 2 as specified so far

- **Prompt:** *"What would you test next, and how might you intervene?"*
- **Format:** open-ended. Each group designs experiments with any method, not only microscopy, to dissect the mechanism further, starting from its unresolved hypothesis, and proposes interventions (not a full treatment programme). Groups present in their own PowerPoint, structured as they choose; the Part 1 summary slide is the starting point, and the site gives no template. They may draw on the assays from the openings.
- **Instructor's example strands (not given to students):** (a) experiments that separate the remaining explanations; (b) trans-acting factors and cis-acting elements (does TDP-43 regulate other regulators, such as the CCR4–NOT deadenylase? Where does it bind the target, by iCLIP, and would mutating that site restore the defect?); (c) interventions, such as improving RNA stability.
- **Worked example:** if stability looks affected, measure decay directly: metabolic labelling (4sU-seq, SLAM-seq), a transcription shut-off chase (actinomycin D) or smFISH TransQuant.
- **Per-case directions:** *stai*: live imaging of an MS2-tagged long-3′UTR reporter, with an unrelated axonal cargo as a comparison or with the UG-rich TDP-43 sites removed. *futsch*: transcription shut-off in explanted brains with an smFISH time course of nuclear and cytoplasmic counts, or cell-type-specific metabolic labelling (TU-tagging); knocking down nuclear (Rrp6) or cytoplasmic (Pacman/Xrn1) decay in Pdf neurons. *unc-13*: block NMD in Kenyon cells (Upf1 RNAi); the white spots should rise and reach the cytoplasm.
- **Steer from 2026-10-20:** a first Part 2 brainstorm leaned too far towards TDP-43 and ALS biology. Lead the reading with methods reviews (general RNA/RBP methods; smFISH for mechanistic analysis, including dual colour), and keep required ALS reading to about one short review per group. Frame questions as *which method answers this, and what can it not tell me?*

## 9. Constraints for Part 2 and later material

- **Never give the answer away.** Student-facing material must not reveal section 7: verdicts, which isoforms a region detects, traps or decoys. Method names and lists of techniques are not a giveaway.
- **Be honest about simulation.** Don't present the invented mechanisms or phenotypes as real biology; keep the Established / Simplified / Invented distinction in instructor material.
- **Tone:** sober and respectful (ALS is a fatal disease). Flies are drawings with a correct body plan, never mascots.
- **Language:** British English, short sentences. Use the app's terms: "Pdf clock neurons"; "Leg motor neuron & NMJ" and "synaptic terminals" (never "boutons"); "axon bundle" for the mushroom body's peduncle; "hTDP-43 WT" and "hTDP-43 mutant"; "Region N", not internal probe IDs, in anything students see.
- **No infrastructure to lean on:** no accounts, no server and no instructor dashboard. Part 2 cannot assume the app sends anything anywhere.
- **No evidence yet:** there are no pilot results or student feedback. Don't invent outcomes. How the room uses laptops (one per group or one each) is undecided.

## 10. Hooks for later parts

Ideas the spec parks for later versions of the app, each a possible downstream session:
- **Target protein output**, so translation becomes testable.
- **Cell-type comparisons** (small vs large Pdf neurons; neuron vs glia) and **glia** with their own target expression.
- **Follow-up experiments on the site**, such as an extra probe pair or a time course.
- **Detection efficiency below 1.0**, so some doubly labelled molecules show one colour only, once students know the basic readout.

## 11. Sources in this repository

- `PRODUCT.md`: users, purpose, constraints, accessibility.
- `docs/spec.md`: *Introduction* (biology, PTR mode table with alternative explanations and next evidence, case truth tables), *Part 1* (screens), *Part 2*, *Future implementation ideas*.
- `data/<case>/truth-table.md`: the signed-off truth tables in full.
- `docs/transcript_models_R6.json`: transcript models and probe menus.
- `docs/storyboards/targets-step.md`: the step 4 primer.
- The instructor's working Part 2 brainstorm: https://claude.ai/code/artifact/06725b2c-dafe-428a-a89d-6c74379c999f
