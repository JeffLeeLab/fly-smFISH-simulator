// Step 1, chosen case: the assay expands, the group does one real action and watches the readout.
// Scaffold version: the live activity monitor and actogram come with the openings stage.

import { href } from "../router.js";

export function mount(root, ctx) {
  root.innerHTML = `
    <div class="story">
      <p class="t-label story__eyebrow">Meet · Step 1</p>
      <h1 class="t-h1">Activity monitor</h1>
      <p class="t-story">Each fly lives in its own glass tube with food at one end. An infrared beam crosses the middle of the tube, and every time the fly walks through it, the monitor counts one crossing. Over several days of 12 hours light and 12 hours dark, the counts show when each fly is active and when it sleeps.</p>
      <div class="stage todo-art" aria-hidden="true"><span>Activity monitor, hTDP-43 WT (left) and ALS mutant (right), with the actogram building (openings stage)</span></div>
      <p class="t-story">Brains for the microscope were collected at ZT2, two hours after the lights came on.</p>
      <ul class="badges" role="list">
        <li><span class="layer layer--established">Established</span><span class="t-ui t-muted">How the activity monitor works</span></li>
        <li><span class="layer layer--invented">Invented for this case</span><span class="t-ui t-muted">The sleep phenotype</span></li>
      </ul>
      <p class="next-row"><a class="btn btn--primary btn--lg" href="${href(ctx.caseId, 2)}">Next: look inside the brain</a></p>
    </div>`;
}
