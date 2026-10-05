// Step 2: the descent from the fly to the labelled neurons, ending in the viewer.
// Scaffold version: the scroll-driven descent comes with the openings stage.

import { href } from "../router.js";
import { term } from "../glossary.js";

export function mount(root, ctx) {
  root.innerHTML = `
    <div class="story">
      <p class="t-label story__eyebrow">Meet · Step 2</p>
      <h1 class="t-h1">Anatomy</h1>
      <p class="t-story">The PDF neurons sit on each side of the brain. This simulation follows the four small ventral lateral neurons (s-LNvs) on one side. Their cell bodies lie near the accessory medulla; their axons run up towards the top of the brain and end in the dorsal terminals, which remodel every day.</p>
      <div class="stage todo-art" aria-hidden="true"><span>Descent: head → s-LNvs → dorsal terminals, ending in the viewer (openings stage)</span></div>
      <p class="t-story">A membrane label (${term("labels", "mCD8::BFP")}, made only in these neurons) shows their shape in blue, and ${term("labels", "DAPI")} marks their nuclei in the same blue. In the images you will find four compartments: nucleus, cell body, axon and dorsal terminals.</p>
      <ul class="badges" role="list">
        <li><span class="layer layer--established">Established</span><span class="t-ui t-muted">s-LNv anatomy and daily remodelling</span></li>
        <li><span class="layer layer--simplified">Simplified</span><span class="t-ui t-muted">Cell bodies and axons enlarged</span></li>
      </ul>
      <p class="next-row"><a class="btn btn--primary btn--lg" href="${href(ctx.caseId, 3)}">Next: the first clue</a></p>
    </div>`;
}
