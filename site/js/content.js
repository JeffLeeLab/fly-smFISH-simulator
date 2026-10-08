// Student-facing structure: cases, steps, stages and the mode cards.
// Text follows docs/spec.md (Student-facing text). Case text never names a PTR mode;
// mode names appear only on the generic mode cards and the notebook built from them.

export const CASES = {
  pdf: {
    id: "pdf",
    system: "Pdf neurons",
    cells: "s-LNvs",
    phenotype: "Sleep and daily rhythm",
    assay: "Activity monitor",
    readout: "activity and sleep (actogram)",
    available: true,
    // Shown from step 5 on: the target gene is unknown during steps 1–4.
    target: {
      gene: "futsch",
      orthologue: "MAP1B",
      function: "A microtubule-associated protein that organises microtubules in synaptic terminals and is needed for normal bouton formation. In these Pdf neurons: cell bodies, axons and dorsal terminals, which remodel every day.",
      flybase: "https://flybase.org/reports/FBgn0259108",
      orthologueLink: "https://www.ncbi.nlm.nih.gov/gene/4131",
    },
    compartments: ["Nucleus", "Cell body", "Axon", "Dorsal terminals"],
  },
  nmj: {
    id: "nmj",
    system: "Leg motor neuron",
    cells: "NMJ",
    phenotype: "Climbing",
    assay: "Climbing vial",
    available: false,
  },
  mb: {
    id: "mb",
    system: "Mushroom body",
    cells: "Kenyon cells",
    phenotype: "Learning and memory",
    assay: "T-maze",
    available: false,
  },
};

// Landing order follows the spec's case order: NMJ, Pdf, mushroom body.
export const CASE_ORDER = ["nmj", "pdf", "mb"];

export const STEPS = {
  1: { title: "Phenotype", layout: "story" },
  2: { title: "Anatomy", layout: "story" },
  3: { title: "TDP-43 dysfunction", layout: "workbench" },
  4: { title: "Hypotheses", layout: "workbench" },
  5: { title: "Target & probe design", layout: "workbench" },
  6: { title: "Microscopy reveal", layout: "workbench" },
  7: { title: "Interpret & revise", layout: "story" },
};

export const STAGES = [
  { name: "Introduction", steps: [1, 2] },
  { name: "RBP clue", steps: [3, 4] },
  { name: "Experimental design", steps: [5] },
  { name: "Observe", steps: [6] },
  { name: "Conclude", steps: [7] },
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
  if (step >= 5 && s.shortlist.length < 2) {
    return { text: "Shortlist at least two modes in step 4 to open the probe design.", fix: 4 };
  }
  if (step >= 6 && !(s.pair.ch1 && s.pair.ch2)) {
    return { text: "Choose two probe regions to see the results.", fix: 5 };
  }
  if (step >= 7 && s.shortlist.some(m => !s.verdicts[m])) {
    return { text: "Give every shortlisted mode a verdict to revise your explanation. Unresolved counts.", fix: 6 };
  }
  return null;
}
