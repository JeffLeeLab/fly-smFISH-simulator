// Step 5: hypotheses. Shortlist modes from the step 3 notes and the step 4 primer: the same cards,
// in the same order, for every case, grouped by where TDP-43 acts; at least two, no maximum; an
// optional "because…". The side pane reads top to bottom: the question from step 4, a small copy
// of the step 4 drawing (hovering or focusing a card lights its stations in clay), the step 3
// recap, the count and Next.

import { MODES, MODE_GROUPS, MODE_ORDER, question } from "../content.js";
import { caseState, updateCase } from "../store.js";
import { bind } from "../forms.js";
import { href } from "../router.js";
import { term } from "../glossary.js";
import { ensureBoilFilter } from "../fly.js";
import { lifeSVG, STATION_OF } from "../mrnalife.js";

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
        <input class="input" data-bind="because.${m}" placeholder="Because in step 3 we saw…"></label>
    </li>`;

  ensureBoilFilter();   // the drawing's ink filter (still here: the workbench doesn't boil)
  root.innerHTML = `
    <div class="bench">
      <header class="bench__head">
        <div class="bench__title"><p class="t-label">Experimental design · Step 5</p><h1 class="t-h2">Hypotheses</h1></div>
      </header>
      <section class="bench__main hyp-main" aria-labelledby="hyp-intro">
        <p class="t-body" id="hyp-intro">Which steps could the <span class="nw">TDP-43</span> dysfunction you saw in step 3 disturb? Shortlist at least two; several can be true at once. Each card is a mode of <span class="nw">${term("ptr", "post-transcriptional regulation")},</span> grouped by where <span class="nw">TDP-43</span> acts.</p>
        <div class="hyp-groups">
          ${MODE_GROUPS.map(g => `
            <fieldset class="hyp-group">
              <legend class="t-label">${g.name}</legend>
              <ul class="hyp-list" role="list">${g.modes.map(card).join("")}</ul>
            </fieldset>`).join("")}
        </div>
      </section>
      <aside class="bench__side" aria-label="Your question, notes and shortlist">
        <div class="yourq"><h2 class="t-label">Your question</h2><p class="yourq__text">${question(ctx.case)}</p></div>
        <figure class="hyp-life">${lifeSVG({ prefix: "hyp", labels: false }).markup}
          <figcaption>Hover over or focus a card to see where it acts.</figcaption></figure>
        <div class="recap">
          <h2 class="t-label">Your notes (step 3)</h2>
          <p class="recap__item"><b>Observation</b><span data-recap="observation"></span></p>
          <a class="t-ui" href="${href(id, 3)}">Back to step 3</a>
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
    for (const k of ["observation"]) {
      const el = root.querySelector(`[data-recap=${k}]`);
      el.textContent = s.clue[k] || "Not written yet.";
      el.classList.toggle("t-muted", !s.clue[k]);
    }
    const n = s.shortlist.length;
    root.querySelector("#hyp-count").textContent = `${n} shortlisted${n < 2 ? ` · choose ${2 - n} more` : ""}`;
    root.querySelector("#hyp-next").innerHTML = n >= 2
      ? `<a class="btn btn--primary btn--lg" href="${href(id, 6)}">Next: probe design</a>`
      : `<span class="btn btn--lg" aria-disabled="true">Next: probe design</span><span class="t-ui t-muted">Shortlist at least two modes first.</span>`;
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

  // the card under the pointer, else the focused one, lights its stations
  const rings = [...root.querySelectorAll(".hyp-life [data-st]")];
  const light = mode => {
    const on = new Set(STATION_OF[mode] || []);
    rings.forEach(r => r.classList.toggle("is-lit", on.has(r.dataset.st)));
  };
  const focused = () => document.activeElement?.closest?.(".hyp")?.dataset.mode;
  const groups = root.querySelector(".hyp-groups");
  const onOver = e => light(e.target.closest(".hyp")?.dataset.mode || focused());
  const onLeave = () => light(focused());
  const onFocus = e => light(e.target.closest(".hyp")?.dataset.mode);
  groups.addEventListener("pointerover", onOver);
  groups.addEventListener("pointerleave", onLeave);
  groups.addEventListener("focusin", onFocus);
  groups.addEventListener("focusout", () => light(null));   // focusin lights the next card

  root.addEventListener("change", onPick);
  refresh();

  return () => {
    unbind();
    root.removeEventListener("change", onPick);
  };
}
