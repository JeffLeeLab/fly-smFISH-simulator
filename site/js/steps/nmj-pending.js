// Stand-in for the leg motor neuron's openings (steps 1 and 2) while they are built (the
// climbing vial and the descent: docs/storyboards/nmj-openings.md). Replaced by nmj-step1.js and
// nmj-step2.js.

import { STEPS } from "../content.js";

export function mount(root, ctx) {
  const next = ctx.step + 1;
  root.innerHTML = `
    <div class="locked">
      <p class="t-label">${ctx.stage} · Step ${ctx.step}</p>
      <h1 class="t-h1">${STEPS[ctx.step].title}</h1>
      <p class="t-story">This opening for the leg motor neuron is still being built.</p>
      <p class="next-row"><a class="btn btn--primary btn--lg" href="#/${ctx.caseId}/step-${next}">Next: ${STEPS[next].title.toLowerCase()}</a></p>
    </div>`;
}
