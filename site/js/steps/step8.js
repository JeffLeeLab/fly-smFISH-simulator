// Step 8: revise the explanation → Claim and Uncertainty, under the question from step 4; the
// starting point for Part 2: the experiment summary (with the pair on the read-only transcript
// map), a preview of the Part 1 summary slide and "Copy summary as PNG". No gate; nothing is
// required.

import { MODES, VERDICTS, question } from "../content.js";
import { caseState, onChange } from "../store.js";
import { bind } from "../forms.js";
import { href } from "../router.js";
import { loadJSON, transcripts, regionLabel } from "../data.js";
import { createMap } from "../map.js";
import { loadFlySprite } from "../fly.js";
import { summarySVG, slideFly, SLIDE, CASE_LOCATOR } from "../summary.js";
import { LIGHT, copyCanvas, svgToCanvas } from "../export.js";

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export async function mount(root, ctx) {
  const id = ctx.caseId;
  const c = ctx.case;
  const view = CASE_LOCATOR[id]?.view || "frontal";   // the fly as the case's descent shows it
  const [g, flyMeta, geo] = await Promise.all([transcripts(id), loadFlySprite(view), CASE_LOCATOR[id] ? loadJSON(`data/${id}/${CASE_LOCATOR[id].file || "geometry-control-1.json"}`) : null]);   // the locator's neurons need geometry
  const art = {
    fly: { viewBox: flyMeta.viewBox.split(" ").map(Number), markup: slideFly(document.getElementById(`fly-${view}-stand-0`), { antennae: view !== "frontal" }) },
    geo,
  };

  root.innerHTML = `
    <div class="story">
      <p class="t-label story__eyebrow">Conclude · Step 8</p>
      <h1 class="t-h1">Interpret &amp; revise</h1>
      <section class="summary" aria-labelledby="sum-h">
        <h2 class="t-h3" id="sum-h">Experiment summary</h2>
        <dl class="summary__facts"></dl>
        <div class="summary__map"></div>
        <div class="summary__verdicts"></div>
      </section>
      <section class="revise" aria-label="Claim and uncertainty">
        <div class="yourq"><h2 class="t-label">Your question</h2><p class="yourq__text">${question(c)}</p></div>
        <label class="field"><span class="field__label">Claim: our leading explanation</span>
          <span class="field__hint" id="claim-prompts"></span>
          <textarea class="textarea" rows="3" data-bind="claim" placeholder="What is your leading explanation?" aria-describedby="claim-prompts"></textarea></label>
        <label class="field"><span class="field__label">Uncertainty: the strongest remaining alternative</span>
          <select class="select" data-bind="uncertainty.mode" id="unc-mode"></select></label>
        <label class="field"><span class="field__label">Why it isn’t excluded yet</span>
          <input class="input" data-bind="uncertainty.why" placeholder="What would you still need to see?"></label>
      </section>
      <section class="slide" aria-labelledby="p2-h">
        <h2 class="t-h3" id="p2-h">Starting point for Part 2</h2>
        <p class="t-story">What would you test next, and how might you intervene?</p>
        <svg class="slide__svg" viewBox="0 0 ${SLIDE.W} ${SLIDE.H}" role="img" aria-label="Preview of your Part 1 summary slide"></svg>
        <p class="next-row"><button class="btn btn--primary btn--lg" type="button" data-act="summary-png">Copy summary as PNG</button><span class="t-ui t-muted">Your Part 1 summary · 1920 × 1080, for a white slide</span></p>
      </section>
      <p class="next-row">
        <a class="btn btn--lg" href="${href(id, 7)}">← Back to results</a>
        <a class="btn btn--lg" href="${href(id, 6)}">Try another pair</a>
      </p>
    </div>`;

  function refresh() {
    const s = caseState(id);
    root.querySelector(".summary__facts").innerHTML = `
      <div><dt>Neuron system</dt><dd>${esc(c.system)}</dd></div>
      <div><dt>Target</dt><dd><i>${esc(c.target.gene)}</i></dd></div>
      <div><dt>Probe pair</dt><dd><span class="chip chip--ch1">smFISH 1 · <span class="t-data">${esc(regionLabel(s.pair.ch1) || "–")}</span></span> <span class="chip chip--ch2">smFISH 2 · <span class="t-data">${esc(regionLabel(s.pair.ch2) || "–")}</span></span></dd></div>`;
    root.querySelector(".summary__verdicts").innerHTML = ["supported", "ruled-out", "unresolved"].map(v => {
      const modes = s.shortlist.filter(m => s.verdicts[m] === v);
      const label = VERDICTS.find(x => x.id === v).label;
      return `<div class="summary__group"><h3 class="t-label">${label}</h3>${modes.length
        ? `<ul role="list">${modes.map(m => `<li>${esc(MODES[m].title)}</li>`).join("")}</ul>`
        : `<p class="t-ui t-muted">None</p>`}</div>`;
    }).join("");
    const supported = s.shortlist.filter(m => s.verdicts[m] === "supported").map(m => MODES[m].title);
    root.querySelector("#claim-prompts").textContent = supported.length
      ? `Your supported modes: ${supported.join("; ")}.` : "You have not marked any mode as supported.";
    const sel = root.querySelector("#unc-mode");
    const unresolved = s.shortlist.filter(m => s.verdicts[m] === "unresolved");
    sel.innerHTML = `<option value="">Choose…</option>${unresolved.map(m => `<option value="${m}">${esc(MODES[m].title)}</option>`).join("")}<option value="other">Other</option>`;
    sel.value = s.uncertainty.mode || "";
  }

  const map = createMap(root.querySelector(".summary__map"), g, { readOnly: true });
  map.setPair(caseState(id).pair);

  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const slide = root.querySelector(".slide__svg");
  const drawSlide = () => { slide.innerHTML = `<rect width="100%" height="100%" fill="${LIGHT.bg}"/>${summarySVG({ c, s: caseState(id), date, g, art })}`; };
  let pending = 0;
  const drawSoon = () => { cancelAnimationFrame(pending); pending = requestAnimationFrame(drawSlide); };

  refresh();
  drawSlide();
  const unbind = bind(root, id);
  const off = onChange(k => {
    if (k !== "case:" + id) return;
    if (!root.contains(document.activeElement)) refresh();
    drawSoon();
  });
  root.querySelector("[data-act=summary-png]").addEventListener("click", async e => {
    const button = e.currentTarget; // currentTarget is cleared once the handler awaits
    const canvas = await svgToCanvas(summarySVG({ c, s: caseState(id), date, g, art }), SLIDE.W, SLIDE.H, LIGHT.bg);
    await copyCanvas(canvas, `smFISH-${id}-summary.png`, button);
  });
  return () => { unbind(); off(); map.destroy(); cancelAnimationFrame(pending); };
}
