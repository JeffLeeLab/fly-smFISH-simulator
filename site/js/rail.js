// Progress rail, the same in every step: the neuron-system box, then the stages and their steps.
// At the opening no system is chosen yet: the box is where the student is ("Choose a neuron
// system", which scrolls to the stations) and every step waits. Once a system is chosen, the
// box names it and leads back to the opening to choose again. Locked steps say why in words;
// clicking one opens a page that names what is missing.

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
  if (!route.caseId) return "blocked";
  if (n === route.step) return "now";
  if (lockReason(n, s)) return "locked";
  return s.visited.includes(n) ? "done" : "todo";
}

function themeButton() {
  const dark = currentTheme() === "dark";
  const label = dark ? "Switch to light theme" : "Switch to dark theme";
  return `<button class="btn btn--quiet rail__theme" type="button" data-act="theme" aria-label="${label}"><span class="rail__theme-dot" aria-hidden="true"></span>${dark ? "Light theme" : "Dark theme"}</button>`;
}

function caseBox(route) {
  const c = route.caseId && CASES[route.caseId];
  return c
    ? `<a class="rail__case" href="#/" aria-describedby="case-change"><span class="t-label">Neuron system</span><span class="rail__case-name">${esc(c.system)}</span><span class="rail__case-go" id="case-change">Change system</span></a>`
    : `<button class="rail__case" type="button" data-act="choose" aria-current="page"><span class="rail__case-name">Choose a neuron system</span><span class="rail__case-go">to continue ↓</span></button>`;
}

function stages(route, s) {
  return STAGES.map(stage => {
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
    return `<li class="rail__stage"><span class="t-label rail__stage-name">${esc(stage.name)}</span><ol role="list">${items}</ol></li>`;
  }).join("");
}

// The opening's "Choose your neuron system" heading, scrolled to from the box.
function toChooser() {
  const h = document.getElementById("choose");
  if (!h) return;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  h.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
  h.focus({ preventScroll: true });
}

export function renderRail(el, route, s) {
  const refocus = el.contains(document.activeElement) && document.activeElement.dataset.act === "theme";
  el.className = "rail";
  el.innerHTML = `
    <a class="rail__brand" href="#/">smFISH Simulator</a>
    ${caseBox(route)}
    <ol class="rail__stages" role="list">${stages(route, s)}</ol>
    <div class="rail__foot">${themeButton()}<p class="rail__contact">Questions? <a href="mailto:jeff.lee@glasgow.ac.uk">jeff.lee@glasgow.ac.uk</a></p><span class="tag-sim">Simulated teaching data</span></div>`;
  const theme = el.querySelector("[data-act=theme]");
  theme.addEventListener("click", toggleTheme);
  el.querySelector("[data-act=choose]")?.addEventListener("click", toChooser);
  if (refocus) theme.focus();
}
