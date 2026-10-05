// Progress rail: full in story steps, a thin strip of numbered circles in steps 3–6.
// Locked steps say why in words; clicking one opens a page that names what is missing.

import { CASES, STAGES, STEPS, lockReason } from "./content.js";
import { href } from "./router.js";
import { currentTheme, toggleTheme } from "./theme.js";

const SHORT_REASON = {
  5: "Needs two shortlisted modes",
  6: "Needs two probe regions",
  7: "Needs a verdict for every mode",
};

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function stepStatus(n, route, s) {
  if (n === route.step) return "now";
  if (!route.caseId) return n === 1 ? "todo" : "blocked";
  if (lockReason(n, s)) return "locked";
  return s.visited.includes(n) ? "done" : "todo";
}

function themeButton(compact) {
  const dark = currentTheme() === "dark";
  const label = dark ? "Switch to light theme" : "Switch to dark theme";
  return compact
    ? `<button class="rail__theme rail__theme--dot" type="button" data-act="theme" aria-label="${label}" title="${label}"></button>`
    : `<button class="btn btn--quiet rail__theme" type="button" data-act="theme" aria-label="${label}"><span class="rail__theme-dot" aria-hidden="true"></span>${dark ? "Light theme" : "Dark theme"}</button>`;
}

function full(route, s) {
  const c = route.caseId && CASES[route.caseId];
  const stages = STAGES.map(stage => {
    const items = stage.steps.map(n => {
      const st = stepStatus(n, route, s);
      const title = esc(STEPS[n].title);
      const num = `<span class="rail__num" aria-hidden="true">${n}</span>`;
      if (st === "blocked") {
        return `<li><span class="rail__step is-blocked">${num}<span>${title}</span></span></li>`;
      }
      const cur = st === "now" ? ' aria-current="step"' : "";
      const why = st === "locked" ? `<span class="rail__why" id="why-${n}">${SHORT_REASON[n]}</span>` : "";
      const desc = st === "locked" ? ` aria-describedby="why-${n}"` : "";
      return `<li><a class="rail__step is-${st}" href="${href(route.caseId, n)}"${cur}${desc}>${num}<span>${title}</span></a>${why}</li>`;
    }).join("");
    return `<li class="rail__stage"><span class="t-label rail__stage-name">${stage.name}</span><ol role="list">${items}</ol></li>`;
  }).join("");
  return `
    <a class="rail__brand" href="#/">smFISH Simulator</a>
    <p class="rail__case">${c ? `<span class="t-label">Neuron system</span><span>${esc(c.system)}</span>` : `<span class="t-muted">Choose a neuron system to continue.</span>`}</p>
    <ol class="rail__stages" role="list">${stages}</ol>
    <div class="rail__foot">${themeButton(false)}<span class="tag-sim">Simulated teaching data</span></div>`;
}

function compact(route, s) {
  const groups = STAGES.map(stage => stage.steps.map(n => {
    const st = stepStatus(n, route, s);
    const r = lockReason(n, s);
    const label = `Step ${n}: ${STEPS[n].title}${st === "locked" ? `. Locked: ${r.text}` : ""}`;
    const cur = st === "now" ? ' aria-current="step"' : "";
    return `<li><a class="rail__dot is-${st}" href="${href(route.caseId, n)}" aria-label="${esc(label)}" title="${esc(label)}"${cur}>${n}</a></li>`;
  }).join("")).join('<li class="rail__gap" aria-hidden="true"></li>');
  return `
    <ol class="rail__dots" role="list">${groups}</ol>
    <div class="rail__foot">${themeButton(true)}</div>`;
}

export function renderRail(el, route, s, layout) {
  const refocus = el.contains(document.activeElement) && document.activeElement.dataset.act === "theme";
  el.className = `rail rail--${layout === "workbench" ? "compact" : "full"}`;
  el.innerHTML = layout === "workbench" ? compact(route, s) : full(route, s);
  const theme = el.querySelector("[data-act=theme]");
  theme.addEventListener("click", toggleTheme);
  if (refocus) theme.focus();
}
