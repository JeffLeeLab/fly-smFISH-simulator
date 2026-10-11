// PLACEHOLDER: the mushroom body case's step 1 (the T-maze). The lead replaces this file.

import { href } from "../router.js";

export function mount(root, ctx) {
  root.innerHTML = `
    <div class="story story--assay">
      <p class="t-label story__eyebrow">Introduction · Step 1</p>
      <h1 class="t-h1">${ctx.case.assay}</h1>
      <p class="t-story">The T-maze assay is being built.</p>
      <p class="next-row"><a class="btn btn--primary btn--lg" href="${href(ctx.caseId, 2)}">Next: anatomy</a></p>
    </div>`;
}
