// Student-facing structure: cases, steps, stages and the mode cards.
// Text follows docs/spec.md (Student-facing text). Case text never names a PTR mode; mode names
// appear only in generic text: the step 4 primer's stations, the mode cards and the notebook
// built from them.

export const CASES = {
  pdf: {
    id: "pdf",
    system: "Pdf clock neurons",
    cells: "s-LNvs",
    phenotype: "Sleep & circadian rhythm",
    assay: "Activity monitor assay",
    available: true,
    // Named in step 4 (`about`: what the protein does and where, the TDP-43 evidence, the candidate
    // sentence; no mode names, nothing on where the mRNA goes). The gene card (`function`, links)
    // waits for probe design, step 6.
    target: {
      gene: "futsch",
      about: "Futsch (MAP1B in humans) organises microtubules in the axons and dorsal terminals of these neurons. TDP-43 regulates futsch mRNA in fly motor neurons. That makes it a candidate: if mutant TDP-43 fails to regulate it, these neurons could run short of Futsch, which could explain why the mutant keeps waking at night.",
      orthologue: "MAP1B",
      function: "A microtubule-associated protein that organises microtubules in synaptic terminals and is needed for normal bouton formation. In these Pdf neurons: cell bodies, axons and dorsal terminals, which remodel every day.",
      flybase: "https://flybase.org/reports/FBgn0259108",
      orthologueLink: "https://www.ncbi.nlm.nih.gov/gene/4131",
    },
    compartments: ["Nucleus", "Cell body", "Axon", "Dorsal terminals"],
    // What the viewer and the results plot read, so they hold no case-specific names.
    anatomy: {
      whole: "Whole neuron",
      flyTo: [["nucleus", "Nucleus"], ["cellbody", "Cell body"], ["axon", "Axon"], ["terminals", "Dorsal terminals"]],
      projection: "2D maximum-intensity projection (simulated data)",
    },
    // Lateral PSF σ in µm (FWHM ≈ 0.28 µm); spots below minSigmaPx are drawn larger and dimmer (same total light).
    display: { spotSigmaUm: 0.12, minSigmaPx: 0.85, spotGain: 0.95 },
    // Count categories: `sub` says where the small points come from ("cells": one per cell;
    // "lobes": one per lobe system, raw.units.lobes), `unit` names them in the hover text.
    plot: {
      labels: { nucleus: "Nucleus", cellbody: "Cell body", axon: "Axon", terminals: "Dorsal terminals" },
      count: {
        cats: [
          { id: "nucleus", sub: "cells", unit: "cells" },
          { id: "cellbody", sub: "cells", unit: "cells" },
          { id: "axon" },
          { id: "terminals" },
        ],
        note: "Nucleus and cell body: per cell. Axon and dorsal terminals: per animal (all four cells).",
      },
      distal: {
        label: "Proportion in axon + terminals",
        catLabel: "Axon + dorsal terminals",
        note: "(Axon + dorsal terminals) / (cell body + axon + dorsal terminals).",
        fly: "terminals",
      },
      overlap: ["cellbody", "axon", "terminals"],
    },
  },
  nmj: {
    id: "nmj",
    system: "Leg motor neuron & NMJ",
    cells: "Leg motor neuron",
    phenotype: "Locomotion",
    assay: "Climbing assay",
    available: true,
    // The function line follows FlyBase's gene summary, its wording kept (instructor, 2026-10-13).
    target: {
      gene: "stai",
      about: "Stathmin (stai, STMN2 in humans) regulates microtubules in the axon and synaptic terminals of this motor neuron. STMN2 is one of the best-known TDP-43 targets in human neurons. That makes stai a candidate: if mutant TDP-43 fails to regulate it, the neuron could run short of stathmin, which could explain why the mutants climb poorly.",
      orthologue: "STMN2",
      function: "Binds tubulin and regulates microtubules; needed for axonal transport and for the growth and stability of synaptic boutons. In this motor neuron: cell body, axon and synaptic terminals.",
      flybase: "https://flybase.org/reports/FBgn0266521",
      orthologueLink: "https://www.ncbi.nlm.nih.gov/gene/11075",
    },
    compartments: ["Nucleus", "Cell body", "Axon", "Synaptic terminals"],
    // Students meet the last compartment as "Synaptic terminals", never "boutons" (instructor, 2026-10-13).
    anatomy: {
      whole: "Whole neuron",
      flyTo: [["nucleus", "Nucleus"], ["cellbody", "Cell body"], ["axon", "Axon"], ["terminals", "Synaptic terminals"]],
      projection: "2D maximum-intensity projection (simulated data)",
    },
    display: { spotSigmaUm: 0.12, minSigmaPx: 0.85, spotGain: 0.95 },
    plot: {
      single: true,   // one cell per animal: animal points only, no small points (instructor, 2026-10-13)
      labels: { nucleus: "Nucleus", cellbody: "Cell body", axon: "Axon", terminals: "Synaptic terminals" },
      count: {
        cats: [{ id: "nucleus" }, { id: "cellbody" }, { id: "axon" }, { id: "terminals" }],
        note: "Spots in the one motor neuron of each animal.",
      },
      // the RNA stalls inside the axon, so the distal measure is the synaptic terminals alone
      distal: {
        label: "Proportion in synaptic terminals",
        catLabel: "Synaptic terminals",
        note: "Synaptic terminals / (cell body + axon + synaptic terminals).",
        fly: "terminals",
      },
      overlap: ["cellbody", "axon", "terminals"],
      overlapNote: "Share of spots on TDP-43 granules (the small puncta). Dashed band: the share expected by chance, if the same spots were placed at random in the same compartment.",
    },
  },
  mb: {
    id: "mb",
    system: "Mushroom body",
    cells: "Kenyon cells",
    phenotype: "Learning & memory",
    assay: "T-maze assay",
    available: true,
    target: {
      gene: "unc-13",
      about: "UNC-13 (UNC13A in humans) prepares synaptic vesicles for release at the Kenyon cells’ synapses in the lobes. UNC13A is one of the best-known TDP-43 targets in human neurons. That makes unc-13 a candidate: if mutant TDP-43 fails to regulate it, these neurons could run short of UNC-13, which could explain why the mutants fail the memory test.",
      orthologue: "UNC13A",
      function: "A presynaptic protein that primes synaptic vesicles for release; without it, neurotransmitter release fails. In these Kenyon cells: cell bodies, dendrites, axons and the synapses in the lobes.",
      flybase: "https://flybase.org/reports/FBgn0025726",
      orthologueLink: "https://www.ncbi.nlm.nih.gov/gene/23025",
    },
    compartments: ["Nucleus", "Cell body", "Dendrites", "Axon bundle", "Lobes"],
    // The calyx (dendrites) is simulated and drawn but never counted, plotted or offered as a fly-to.
    // Students meet the peduncle as the axon bundle; "peduncle" is named once, in step 2 (instructor,
    // 2026-10-12). The ids stay anatomical.
    anatomy: {
      whole: "Mushroom body",
      flyTo: [["nucleus", "Nucleus"], ["cellbody", "Cell body"], ["peduncle", "Axon bundle"], ["lobes", "Lobes"]],
      projection: "Oblique maximum-intensity projection (simulated data)",
    },
    // larger and brighter than true size, so spots read like the Pdf case's in a structure three times its size
    display: { spotSigmaUm: 0.2, minSigmaPx: 1.0, spotGain: 1.1 },
    plot: {
      labels: { nucleus: "Nucleus", cellbody: "Cell body", peduncle: "Axon bundle", lobes: "Lobes" },
      count: {
        cats: [
          { id: "nucleus", sub: "cells", unit: "cells" },
          { id: "cellbody", sub: "cells", unit: "cells" },
          { id: "peduncle", per: 30 },
          { id: "lobes", sub: "lobes", unit: "lobe systems", per: 10 },
        ],
        note: "Spots per Kenyon cell. The axon bundle and lobes are shared, so their spots are divided among the cells they come from: all thirty for the axon bundle, ten for each lobe system.",
      },
      distal: {
        label: "Share in axon bundle + lobes",   // shorter than "Proportion in …", so the plot bar fits 1280 px
        catLabel: "Axon bundle + lobes",
        note: "(Axon bundle + lobes) / (cell body + axon bundle + lobes).",
        fly: "lobes",
      },
      overlap: ["cellbody", "peduncle", "lobes"],
    },
  },
};

// Landing order follows the spec's case order: NMJ, Pdf, mushroom body.
export const CASE_ORDER = ["nmj", "pdf", "mb"];

export const STEPS = {
  1: { title: "Phenotype", layout: "story" },
  2: { title: "Anatomy", layout: "story" },
  3: { title: "TDP-43 dysfunction", layout: "workbench" },
  4: { title: "TDP-43 and its targets", layout: "story" },
  5: { title: "Hypotheses", layout: "workbench" },
  6: { title: "Probe design", layout: "workbench" },
  7: { title: "Microscopy reveal", layout: "workbench" },
  8: { title: "Interpret & revise", layout: "story" },
};

export const STAGES = [
  { name: "Introduction", steps: [1, 2] },
  { name: "RBP dysfunction", steps: [3, 4] },
  { name: "Experimental design", steps: [5, 6] },
  { name: "Observe", steps: [7] },
  { name: "Conclude", steps: [8] },
];

export const stageOf = step => STAGES.find(s => s.steps.includes(step)).name;

// Mode cards: the same set, in the same order, for every case (Established layer).
export const MODE_GROUPS = [
  { name: "Nucleus", modes: ["splicing", "export"] },
  { name: "Cytoplasm", modes: ["stability", "transport", "translation", "granule"] },
  { name: "Both", modes: ["isoform", "celltype"] },
];

export const MODES = {
  splicing: {
    title: "Splicing / alternative exon / intron retention",
    definition: "Which pieces of the pre-mRNA are joined into the mature mRNA. Changes can add or skip an exon, or leave an intron in.",
  },
  export: {
    title: "Nuclear export / retention",
    definition: "Moving finished mRNA out of the nucleus. A defect leaves mRNA held in the nucleus.",
  },
  stability: {
    title: "RNA stability",
    definition: "How long an mRNA lasts before it is degraded. Faster decay means fewer molecules, even if production is normal.",
  },
  transport: {
    title: "Localisation / transport",
    definition: "Getting mRNA to the right place in the cell, such as axons and synapses, often along microtubules.",
  },
  translation: {
    title: "Translation",
    definition: "How much protein is made from each mRNA.",
  },
  granule: {
    title: "Granule incorporation",
    definition: "Packing mRNA with RNA-binding proteins into RNA granules, which can carry, store or silence it.",
  },
  isoform: {
    title: "Isoform-specific regulation",
    definition: "Different isoforms of one gene (different start sites, exons or 3′ ends) are made, kept or placed differently.",
  },
  celltype: {
    title: "Cell-type-specific regulation",
    definition: "The same RNA is regulated differently in different types of cell.",
  },
};

export const MODE_ORDER = MODE_GROUPS.flatMap(g => g.modes);
export const groupOf = mode => MODE_GROUPS.find(g => g.modes.includes(mode)).name;

export const VERDICTS = [
  { id: "ruled-out", label: "Ruled out" },
  { id: "supported", label: "Supported" },
  { id: "unresolved", label: "Unresolved" },
];

// Gates between stages. Returns the reason a step is locked, or null if it is open.
// Reasons are checked in order, so the earliest missing piece is the one named.
export function lockReason(step, s) {
  if (step >= 6 && s.shortlist.length < 2) {
    return { text: "Shortlist at least two modes in step 5 to open the probe design.", fix: 5 };
  }
  if (step >= 7 && !(s.pair.ch1 && s.pair.ch2)) {
    return { text: "Choose two probe regions to see the results.", fix: 6 };
  }
  if (step >= 8 && s.shortlist.some(m => !s.verdicts[m])) {
    return { text: "Give every shortlisted mode a verdict to revise your explanation. Unresolved counts as a verdict.", fix: 7 };
  }
  return null;
}

// ---------- the target and the question (from step 4 on) ----------

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const WORD = /(?<![\w-])[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*(?![\w-])/g;

// Case text as HTML, escaped first: the fly gene in italic, matched case-sensitively so the
// proteins ("Futsch", "UNC-13") stay roman, and hyphenated names ("TDP-43", "unc-13") never break
// at the hyphen.
export function caseProse(c, text) {
  return esc(text).replace(WORD, w => w === c.target.gene ? `<i class="nw">${w}</i>`
    : w.includes("-") ? `<span class="nw">${w}</span>` : w);
}

// The question the hypotheses answer, carried from step 4 to the hypotheses, step 8, the notebook
// and the summary slide: plain parts (the gene is the middle one), or HTML.
export const questionParts = c => ["Which steps in the life of ", c.target.gene, " mRNA go wrong when TDP-43 carries the ALS mutation?"];
export const question = c => caseProse(c, questionParts(c).join(""));
