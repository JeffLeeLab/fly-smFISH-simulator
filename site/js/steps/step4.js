// Step 4: shortlist modes from the clue alone (the target gene is not known yet).
// Same cards, same order, for every case; at least two, no maximum; optional "because…".

import { MODES, MODE_GROUPS, MODE_ORDER } from "../content.js";
import { caseState, updateCase } from "../store.js";
import { bind } from "../forms.js";
import { href } from "../router.js";

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function mount(root, ctx) {
  const id = ctx.caseId;

  const card = m => `
    <li class="hyp" data-mode="${m}">
      <label class="hyp__pick">
        <input type="checkbox" class="hyp__box" value="${m}">
        <span class="hyp__text"><span class="mode-card__title">${esc(MODES[m].title)}</span>
          <span class="hyp__def">${esc(MODES[m].definition)}</span></span>
      </label>
      <label class="hyp__because"><span class="vh">Because, for ${esc(MODES[m].title)}</span>
        <input class="input" data-bind="because.${m}" placeholder="Because…"></label>
    </li>`;

  root.innerHTML = `
    <div class="bench">
      <header class="bench__head">
        <div class="bench__title"><p class="t-label">Clue · Step 4</p><h1 class="t-h2">Hypotheses</h1></div>
        <p class="t-ui t-muted"><span class="layer layer--established">Established</span> Mode definitions</p>
      </header>
      <section class="bench__main hyp-main" aria-labelledby="hyp-intro">
        <p class="t-body" id="hyp-intro">Which ways of regulating RNA could explain the TDP-43 clue? Shortlist at least two. They don’t have to compete: several can be true at once. The cards are grouped by where TDP-43 acts.</p>
        <div class="hyp-groups">
          ${MODE_GROUPS.map(g => `
            <fieldset class="hyp-group">
              <legend class="t-label">${g.name}</legend>
              <ul class="hyp-list" role="list">${g.modes.map(card).join("")}</ul>
            </fieldset>`).join("")}
        </div>
      </section>
      <aside class="bench__side" aria-label="Your clue and shortlist">
        <div class="recap">
          <h2 class="t-label">Your clue notes (step 3)</h2>
          <p class="recap__item"><b>Observation</b><span data-recap="observation"></span></p>
          <p class="recap__item"><b>Interpretation</b><span data-recap="interpretation"></span></p>
          <a class="t-ui" href="${href(id, 3)}">Back to the clue</a>
        </div>
        <p class="t-ui-lg" id="hyp-count" aria-live="polite"></p>
        <p class="next-row" id="hyp-next"></p>
      </aside>
    </div>`;

  const unbind = bind(root, id);

  function refresh() {
    const s = caseState(id);
    root.querySelectorAll(".hyp").forEach(li => {
      const on = s.shortlist.includes(li.dataset.mode);
      li.classList.toggle("is-on", on);
      li.querySelector(".hyp__box").checked = on;
    });
    for (const k of ["observation", "interpretation"]) {
      const el = root.querySelector(`[data-recap=${k}]`);
      el.textContent = s.clue[k] || "Not written yet.";
      el.classList.toggle("t-muted", !s.clue[k]);
    }
    const n = s.shortlist.length;
    root.querySelector("#hyp-count").textContent = `${n} shortlisted${n < 2 ? ` · choose ${2 - n} more` : ""}`;
    root.querySelector("#hyp-next").innerHTML = n >= 2
      ? `<a class="btn btn--primary btn--lg" href="${href(id, 5)}">Next: target + probe design</a>`
      : `<span class="btn btn--lg" aria-disabled="true">Next: target + probe design</span><span class="t-ui t-muted">Shortlist at least two modes first.</span>`;
  }

  const onPick = e => {
    const box = e.target.closest(".hyp__box");
    if (!box) return;
    updateCase(id, s => {
      const set = new Set(s.shortlist);
      box.checked ? set.add(box.value) : set.delete(box.value);
      s.shortlist = MODE_ORDER.filter(m => set.has(m));
    });
    refresh();
  };
  root.addEventListener("change", onPick);
  refresh();

  return () => {
    unbind();
    root.removeEventListener("change", onPick);
  };
}
