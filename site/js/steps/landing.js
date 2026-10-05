// Step 1, shared part: hero and the three-assay landing.
// Scaffold version: the knock-in sequence and live assay stations come with the openings
// (Phase 1, work step 4). The structure, text and case choice are final.

import { CASES, CASE_ORDER } from "../content.js";
import { href } from "../router.js";

export function mount(root) {
  const stations = CASE_ORDER.map(id => {
    const c = CASES[id];
    const body = `
      <span class="station__art" aria-hidden="true">${c.assay}</span>
      <span class="station__name">${c.assay}</span>
      <span class="station__lanes"><span>hTDP-43 WT</span><span>hTDP-43 ALS mutant</span></span>
      <span class="t-ui t-muted">${c.system} · ${c.phenotype.toLowerCase()}</span>
      <span class="station__go">${c.available ? "Choose this system →" : "Not available in this build"}</span>`;
    return c.available
      ? `<li><a class="station" href="${href(id, 1)}">${body}</a></li>`
      : `<li><div class="station is-off" aria-disabled="true">${body}</div></li>`;
  }).join("");

  root.innerHTML = `
    <div class="story">
      <p class="t-label story__eyebrow">Meet · Step 1</p>
      <section class="landing-hero" aria-labelledby="hero-title">
        <div>
          <h1 class="t-display" id="hero-title">They look the same. Their behaviour isn’t.</h1>
          <p class="t-story t-muted">Two humanised flies: the fly gene <i>TBPH</i> has been replaced by human <i>TDP-43</i>. One carries the wild-type human gene, the other an ALS-linked point mutation.</p>
        </div>
        <div class="stage todo-art" aria-hidden="true"><span>Knock-in sequence with two flies (openings stage)</span></div>
      </section>
      <h2 class="t-h2">Choose your neuron system</h2>
      <p class="t-story">Each group works with one system. Each assay compares hTDP-43 WT (left) with the ALS mutant (right).</p>
      <ul class="stations" role="list">${stations}</ul>
    </div>`;
}
