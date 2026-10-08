// Phase 1 builds the Pdf neuron case only; the other two systems arrive in Phase 2.

export function mount(root, ctx) {
  root.innerHTML = `
    <div class="locked">
      <p class="t-label">${ctx.case.system}</p>
      <h1 class="t-h1">Not available in this build</h1>
      <p class="t-story">This build includes the Pdf neuron system only.</p>
      <p class="next-row"><a class="btn btn--lg" href="#/">Back to the three systems</a></p>
    </div>`;
}
