// PLACEHOLDER: the mushroom body case's step 2 (the descent into the brain). The lead replaces this file.

import { href } from "../router.js";

export function mount(root, ctx) {
  root.innerHTML = `
    <div class="story">
      <p class="t-label story__eyebrow">Introduction · Step 2</p>
      <h1 class="t-h1">Inside the brain</h1>
      <p class="t-story">The descent into the mushroom body is being built.</p>
      <p class="next-row"><a class="btn btn--primary btn--lg" href="${href(ctx.caseId, 3)}">Next: the first clue</a></p>
    </div>`;
}
