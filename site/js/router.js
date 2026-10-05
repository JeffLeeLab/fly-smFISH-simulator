// Hash routes, so a group can recover after a refresh and the site works under /repo-name/.
//   #/            hero and the three-assay landing (shared by all groups)
//   #/pdf/step-3  case + step

import { CASES, STEPS } from "./content.js";

export function parse(hash = location.hash) {
  const m = /^#\/([a-z]+)\/step-(\d)\/?$/.exec(hash);
  if (m && CASES[m[1]] && STEPS[+m[2]]) return { caseId: m[1], step: +m[2] };
  return { caseId: null, step: 1 };
}

export const href = (caseId, step) => (caseId ? `#/${caseId}/step-${step}` : "#/");

export function go(caseId, step) {
  const h = href(caseId, step);
  if (location.hash === h) window.dispatchEvent(new HashChangeEvent("hashchange"));
  else location.hash = h;
}

export function onRoute(fn) {
  window.addEventListener("hashchange", () => fn(parse()));
}
