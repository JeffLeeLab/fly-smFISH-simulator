// App shell: routes → layout, rail, notebook and the current step's view.

import { CASES, STEPS, stageOf, lockReason } from "./content.js";
import { parse, onRoute } from "./router.js";
import { caseState, updateCase, onChange } from "./store.js";
import { initTheme, onTheme } from "./theme.js";
import { renderRail } from "./rail.js";
import { initNotebook, updateNotebook } from "./notebook.js";
import { initGlossary } from "./glossary.js";
import { endTour } from "./tour.js";

const VIEWS = {
  landing: () => import("./steps/landing.js"),
  locked: () => import("./steps/locked.js"),
  unavailable: () => import("./steps/unavailable.js"),
  1: () => import("./steps/step1.js"),
  2: () => import("./steps/step2.js"),
  3: () => import("./steps/step3.js"),
  4: () => import("./steps/step4.js"),
  5: () => import("./steps/step5.js"),
  6: () => import("./steps/step6.js"),
  7: () => import("./steps/step7.js"),
};

// A case can replace a step's view; the rest are shared.
const CASE_VIEWS = {
  mb: { 1: () => import("./steps/mb-step1.js"), 2: () => import("./steps/mb-step2.js") },
};
const viewOf = (caseId, key) => (CASE_VIEWS[caseId]?.[key] ?? VIEWS[key]);

const app = document.getElementById("app");
const rail = document.getElementById("rail");
const view = document.getElementById("view");

let route = parse();
let unmount = () => {};
let token = 0;

function layoutFor(r) {
  return r.caseId ? STEPS[r.step].layout : "story";
}

function drawRail() {
  const s = route.caseId ? caseState(route.caseId) : caseState("none");
  renderRail(rail, route, s);
}

function pick(r) {
  if (!r.caseId) return { key: "landing" };
  if (!CASES[r.caseId].available) return { key: "unavailable" };
  const reason = lockReason(r.step, caseState(r.caseId));
  if (reason) return { key: "locked", reason };
  return { key: r.step };
}

// A step that fails to load says so, instead of leaving the previous step on screen. The usual
// cause is a browser holding an older copy of some files (a hard refresh fixes it).
function failed(err) {
  console.error(err);
  unmount();
  unmount = () => {};
  const mac = /Mac|iPhone|iPad/.test(navigator.platform);
  view.innerHTML = `
    <div class="locked" role="alert">
      <p class="t-label">Something went wrong</p>
      <h1 class="t-h1">This step didn’t load</h1>
      <p class="t-story">The browser may be holding an older copy of part of the site. Reload the page, bypassing the cache: press <kbd>${mac ? "Cmd+Shift+R" : "Ctrl+F5"}</kbd>. Your notes are kept.</p>
      <p class="next-row"><button class="btn btn--primary btn--lg" type="button" data-act="reload">Reload the page</button></p>
    </div>`;
  view.querySelector("[data-act=reload]").addEventListener("click", () => location.reload());
}

async function show(r) {
  const my = ++token;
  endTour();
  route = r;
  const choice = pick(r);
  if (r.caseId && CASES[r.caseId].available && choice.key === r.step) {
    updateCase(r.caseId, s => { if (!s.visited.includes(r.step)) s.visited.push(r.step); });
  }

  const layout = layoutFor(r);
  app.dataset.layout = layout;
  app.dataset.step = r.caseId ? String(r.step) : "landing";
  drawRail();
  updateNotebook(r.caseId && CASES[r.caseId].available ? r : { caseId: null, step: 1 });

  const c = r.caseId && CASES[r.caseId];
  document.title = c
    ? `${STEPS[r.step].title} · ${c.system} · smFISH Simulator`
    : "smFISH Simulator";

  let mod;
  try {
    mod = await viewOf(r.caseId, choice.key)();
  } catch (err) {
    if (my === token) failed(err);
    return;
  }
  if (my !== token) return; // a newer route arrived while loading
  unmount();
  unmount = () => {};
  view.replaceChildren();
  window.scrollTo(0, 0);
  const ctx = { ...r, case: c, stage: r.caseId ? stageOf(r.step) : "Introduction", reason: choice.reason };
  let cleanup;
  try {
    cleanup = (await mod.mount(view, ctx)) || (() => {});
  } catch (err) {
    if (my === token) failed(err);
    return;
  }
  if (my !== token) { cleanup(); return; } // left before the view finished mounting
  unmount = cleanup;
  view.focus({ preventScroll: true });
}

initTheme();
initGlossary();
initNotebook(document.getElementById("nb-tab"), document.getElementById("notebook"));
onTheme(drawRail);
onChange(key => { if (route.caseId && key === "case:" + route.caseId) drawRail(); });
onRoute(show);
show(route);
