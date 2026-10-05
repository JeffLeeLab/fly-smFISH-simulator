// Hover/tap glossary (docs/spec.md, *Student-facing text*: Glossary). A term is a button styled
// as text with a dotted underline: hover or focus shows its definition, a tap toggles it, Esc
// or a tap elsewhere hides it.

const ENTRIES = {
  exon: ["Exon / intron", "Exons are kept in the mature mRNA; introns are removed by splicing."],
  nascent: ["Pre-mRNA / nascent RNA", "RNA that is still being made or not yet processed; it still contains its introns."],
  isoform: ["Isoform", "One of several different mRNAs made from the same gene."],
  cds: ["CDS (coding sequence)", "The part of an mRNA that is translated into protein."],
  utr: ["UTR (untranslated region)", "The parts of an mRNA before (5′UTR) and after (3′UTR) the coding sequence. 3′UTRs often carry signals for localisation, stability and translation."],
  tss: ["Transcription start site (TSS)", "Where RNA polymerase starts copying the gene. A gene with several TSSs can make mRNAs with different first exons."],
  pas: ["3′ end / polyadenylation site", "Where the RNA is cut and given its poly(A) tail. Alternative sites give shorter or longer 3′UTRs."],
  ts: ["Transcription site", "The place in the nucleus where the gene is being copied. Many nascent RNAs together make one bright nuclear spot."],
  smfish: ["smFISH", "Single-molecule fluorescence in situ hybridisation. Labelled probes bind one region of an RNA, so each RNA molecule appears as one spot."],
  if: ["Immunofluorescence (IF)", "Antibody staining that shows where a protein is."],
  lut: ["LUT (lookup table)", "The colour a channel is displayed in."],
  mip: ["Maximum-intensity projection", "A 2D image that keeps the brightest pixel through a stack of focal planes."],
  humanised: ["Humanised fly (knock-in)", "The fly gene is replaced by the human gene at the same place in the genome."],
  orthologue: ["Orthologue", "The corresponding gene in another species, inherited from a common ancestor."],
  labels: ["mCD8::BFP / DAPI", "A blue membrane label expressed only in the labelled neurons / a blue DNA stain that marks nuclei."],
};
ENTRIES.intron = ENTRIES.exon;

// Markup for a term inside running text.
export const term = (key, text) => `<button type="button" class="gl" data-term="${key}" aria-describedby="gl-tip">${text}</button>`;

let tip, current = null, pinned = false;

function show(el) {
  const e = ENTRIES[el.dataset.term];
  if (!e) return;
  current = el;
  tip.innerHTML = `<b>${e[0]}</b> ${e[1]}`;
  tip.hidden = false;
  const r = el.getBoundingClientRect();
  const w = tip.offsetWidth, h = tip.offsetHeight;
  const left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2));
  const above = r.top - h - 8 > 8;
  tip.style.left = `${left}px`;
  tip.style.top = `${above ? r.top - h - 8 : r.bottom + 8}px`;
}

function hide() {
  tip.hidden = true;
  current = null;
  pinned = false;
}

export function initGlossary() {
  tip = document.createElement("div");
  tip.id = "gl-tip";
  tip.className = "gl-tip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.append(tip);

  document.addEventListener("pointerover", e => {
    const el = e.target.closest?.(".gl");
    if (el && e.pointerType === "mouse" && !pinned) show(el);
  });
  document.addEventListener("pointerout", e => {
    const el = e.target.closest?.(".gl");
    if (el && e.pointerType === "mouse" && !pinned && !el.contains(e.relatedTarget)) hide();
  });
  document.addEventListener("focusin", e => { if (e.target.classList?.contains("gl")) show(e.target); });
  document.addEventListener("focusout", e => { if (e.target.classList?.contains("gl") && !pinned) hide(); });
  document.addEventListener("click", e => {
    const el = e.target.closest?.(".gl");
    if (el) {
      e.preventDefault();
      if (current === el && pinned) hide(); else { show(el); pinned = true; }
    } else if (!tip.hidden) hide();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !tip.hidden) hide(); });
  window.addEventListener("scroll", () => { if (!tip.hidden) hide(); }, { passive: true, capture: true });
}
