// The page for a neuron system that isn't built into this site yet.

export function mount(root, ctx) {
  root.innerHTML = `
    <div class="locked">
      <p class="t-label">${ctx.case.system}</p>
      <h1 class="t-h1">Not available in this build</h1>
      <p class="t-story">This neuron system isn't in this build yet.</p>
      <p class="next-row"><a class="btn btn--lg" href="#/">Back to the three systems</a></p>
    </div>`;
}
