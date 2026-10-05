// Two-way binding between form fields and the case record in the store, so the same
// entry can appear on a step page and in the notebook drawer ("one notebook, not two").
//   <textarea data-bind="clue.observation">       text fields
//   <input type="checkbox" data-bind="predictions.stability.cantTest">
//   <div class="verdict" data-verdict="stability"><button data-value="supported">…

import { caseState, updateCase, onChange } from "./store.js";

const getPath = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

function setPath(obj, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((o, k) => (o[k] && typeof o[k] === "object" ? o[k] : (o[k] = {})), obj);
  target[last] = value;
}

function fill(root, caseId) {
  const s = caseState(caseId);
  root.querySelectorAll("[data-bind]").forEach(el => {
    if (el === document.activeElement) return;
    const v = getPath(s, el.dataset.bind);
    if (el.type === "checkbox") el.checked = !!v;
    else el.value = v ?? "";
  });
  root.querySelectorAll("[data-verdict]").forEach(bar => {
    const v = s.verdicts[bar.dataset.verdict];
    bar.querySelectorAll("button[data-value]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.value === v)));
  });
}

// Wires every bound field inside root. Returns a cleanup function.
export function bind(root, caseId, { onCommit } = {}) {
  fill(root, caseId);

  const onInput = e => {
    const el = e.target.closest("[data-bind]");
    if (!el || !root.contains(el)) return;
    const value = el.type === "checkbox" ? el.checked : el.value;
    updateCase(caseId, s => setPath(s, el.dataset.bind, value));
    onCommit?.(el.dataset.bind);
  };
  const onClick = e => {
    const b = e.target.closest("[data-verdict] button[data-value]");
    if (!b || !root.contains(b)) return;
    const mode = b.closest("[data-verdict]").dataset.verdict;
    updateCase(caseId, s => { s.verdicts[mode] = b.dataset.value; });
    onCommit?.("verdicts." + mode);
  };

  root.addEventListener("input", onInput);
  root.addEventListener("change", onInput);
  root.addEventListener("click", onClick);
  const off = onChange(key => { if (key === "case:" + caseId) fill(root, caseId); });

  return () => {
    root.removeEventListener("input", onInput);
    root.removeEventListener("change", onInput);
    root.removeEventListener("click", onClick);
    off();
  };
}
