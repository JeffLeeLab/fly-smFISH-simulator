// A locked step names what is missing and links to the step that fixes it.

import { STEPS } from "../content.js";
import { href } from "../router.js";

export function mount(root, ctx) {
  const { reason } = ctx;
  root.innerHTML = `
    <div class="locked">
      <p class="t-label">${ctx.stage} · Step ${ctx.step}</p>
      <h1 class="t-h1">${STEPS[ctx.step].title}</h1>
      <p class="t-story">${reason.text}</p>
      <p class="next-row"><a class="btn btn--lg" href="${href(ctx.caseId, reason.fix)}">Go to step ${reason.fix}: ${STEPS[reason.fix].title}</a></p>
    </div>`;
}
