// Step 3: the first clue. TDP-43 IF in control vs mutant, qualitative only: membrane + DAPI
// and TDP-43 channels, no plot or table. Observation and interpretation in separate fields.

import { bind } from "../forms.js";
import { href } from "../router.js";
import { storageWarning } from "../notebook.js";
import { hasWebGL2, NO_WEBGL_TEXT } from "../viewer/gl.js";
import { renderControls, viewerPrefs } from "../viewer/controls.js";

export async function mount(root, ctx) {
  root.innerHTML = `
    <div class="bench">
      <header class="bench__head">
        <div class="bench__title"><p class="t-label">Clue · Step 3</p><h1 class="t-h2">TDP-43 clue</h1></div>
        <div class="next-row">
          <span class="chip chip--mem">Membrane + DAPI</span>
          <span class="chip chip--tdp">TDP-43 IF</span>
        </div>
      </header>
      <section class="bench__main" aria-label="Microscope view">
        <div id="viewer"></div>
      </section>
      <aside class="bench__side" aria-label="Notebook: step 3">
        <p class="t-body">Look at TDP-43 in both genotypes. Write down what you see first, then what it could mean, in separate fields.</p>
        <div id="controls"></div>
        ${storageWarning()}
        <label class="field"><span class="field__label">Observation</span>
          <textarea class="textarea" rows="4" data-bind="clue.observation" placeholder="What do you see?"></textarea>
          <span class="field__hint">Example: “The mutant’s nuclei look smaller.”</span></label>
        <label class="field"><span class="field__label">Interpretation</span>
          <textarea class="textarea" rows="4" data-bind="clue.interpretation" placeholder="What could explain it?"></textarea>
          <span class="field__hint">Example: “The cells may be shrinking.”</span></label>
        <p class="next-row"><a class="btn btn--primary btn--lg" href="${href(ctx.caseId, 4)}">Next: hypotheses</a></p>
      </aside>
    </div>`;

  const unbind = bind(root, ctx.caseId);
  const host = root.querySelector("#viewer");
  if (!hasWebGL2()) {
    host.className = "viewer";
    host.innerHTML = `<p class="viewer__note">${NO_WEBGL_TEXT}</p>`;
    return unbind;
  }
  const { createViewer } = await import("../viewer/viewer.js");
  const viewer = await createViewer(host, { caseId: ctx.caseId, mode: "clue", ...viewerPrefs() });
  const offControls = renderControls(root.querySelector("#controls"), viewer, { mode: "clue" });

  return () => {
    unbind();
    offControls();
    viewer.destroy();
  };
}
