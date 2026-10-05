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
  renderRail(rail, route, s, layoutFor(route));
}

function pick(r) {
  if (!r.caseId) return { key: "landing" };
  if (!CASES[r.caseId].available) return { key: "unavailable" };
  const reason = lockReason(r.step, caseState(r.caseId));
  if (reason) return { key: "locked", reason };
  return { key: r.step };
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

  const mod = await VIEWS[choice.key]();
  if (my !== token) return; // a newer route arrived while loading
  unmount();
  unmount = () => {};
  view.replaceChildren();
  window.scrollTo(0, 0);
  const ctx = { ...r, case: c, stage: r.caseId ? stageOf(r.step) : "Meet", reason: choice.reason };
  const cleanup = (await mod.mount(view, ctx)) || (() => {});
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
