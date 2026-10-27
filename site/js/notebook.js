// Lab notebook: a drawer on the right, collapsed to a tab, filled step by step.
// In step 7 it docks into the side pane as the Compare tab (renderCompare), so there is one
// notebook, not two. Everything is stored per browser; nothing is uploaded.

import { CASES, STEPS, MODES, MODE_GROUPS, VERDICTS, groupOf, question } from "./content.js";
import { caseState, storage, onChange } from "./store.js";
import { bind } from "./forms.js";
import { href } from "./router.js";
import { regionLabel } from "./data.js";

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

let tab, drawer, unbind = () => {}, offStore = () => {};
let current = { caseId: null, step: 1 };
let isOpen = false;

const area = (bindKey, label, placeholder, rows = 3) => `
  <label class="field"><span class="field__label">${label}</span>
    <textarea class="textarea" rows="${rows}" data-bind="${bindKey}" placeholder="${placeholder}"></textarea></label>`;

export const storageWarning = () => storage.available ? "" : `
  <p class="notice nb-warn" role="status">This browser is blocking storage, so these notes will be lost if the page is refreshed. Saving PNGs still works.</p>`;

// Mode verdict cards (step 7), grouped as on the step 5 cards. Used by the drawer and the compare pane.
export function renderModeCards(caseId) {
  const s = caseState(caseId);
  if (!s.shortlist.length) return `<p class="t-ui t-muted">No modes shortlisted yet. Shortlist them in <a href="${href(caseId, 5)}">step 5</a>.</p>`;
  return MODE_GROUPS.map(g => {
    const modes = g.modes.filter(m => s.shortlist.includes(m));
    if (!modes.length) return "";
    return modes.map(m => {
      const p = s.predictions[m];
      const pred = p && (p.text || p.cantTest)
        ? `<p class="nb-pred">Your prediction: ${p.cantTest ? "this pair can’t test it" : esc(p.text)}</p>` : "";
      return `
      <article class="mode-card nb-mode">
        <span class="t-label mode-card__group">${g.name}</span>
        <h4 class="mode-card__title" id="vt-${m}">${esc(MODES[m].title)}</h4>
        <div class="verdict" role="group" aria-labelledby="vt-${m}" data-verdict="${m}">
          ${VERDICTS.map(v => `<button type="button" data-value="${v.id}" aria-pressed="false">${v.label}</button>`).join("")}
        </div>
        ${pred}
        <label class="nb-evidence"><span class="vh">Evidence for ${esc(MODES[m].title)}</span>
          <input class="input" data-bind="evidence.${m}" placeholder="What evidence supports this verdict?"></label>
      </article>`;
    }).join("");
  }).join("");
}

export function renderCompare(caseId) {
  return `
    ${storageWarning()}
    <div class="nb-stack">
      ${area("results.observation", "Observation", "What do you see?")}
      ${area("results.interpretation", "Interpretation", "What could explain it?")}
    </div>
    <div class="nb-cards">${renderModeCards(caseId)}</div>`;
}

function section(n, title, body, open) {
  return `
    <section class="nb-sec" aria-labelledby="nb-h${n}">
      <h3 class="nb-sec__h" id="nb-h${n}"><span class="nb-sec__n">${n}</span>${title}</h3>
      ${open ? body : `<p class="t-ui t-muted">You will fill this in at step ${n}.</p>`}
    </section>`;
}

function drawerBody(caseId) {
  const s = caseState(caseId);
  const seen = n => s.visited.includes(n);
  const c = CASES[caseId];

  const shortlist = s.shortlist.length
    ? `<ul class="nb-list" role="list">${s.shortlist.map(m => `
        <li><span class="t-label">${groupOf(m)}</span><b class="t-ui-lg">${esc(MODES[m].title)}</b>
          <label><span class="vh">Because</span><input class="input" data-bind="because.${m}" placeholder="Because…"></label></li>`).join("")}</ul>`
    : `<p class="t-ui t-muted">Nothing shortlisted yet.</p>`;

  const chip = (k, cls) => s.pair[k]
    ? `<span class="chip ${cls}">smFISH ${k === "ch1" ? 1 : 2} · <span class="t-data">${esc(regionLabel(s.pair[k]))}</span></span>`
    : `<span class="chip">smFISH ${k === "ch1" ? 1 : 2} · empty</span>`;
  const probe = `<div class="nb-chips">${chip("ch1", "chip--ch1")}${chip("ch2", "chip--ch2")}</div>`;

  const unresolved = s.shortlist.filter(m => s.verdicts[m] === "unresolved");
  const revise = `
    ${area("claim", "Claim: our leading explanation", "What is your leading explanation?")}
    <label class="field"><span class="field__label">Uncertainty: the strongest remaining alternative</span>
      <select class="select" data-bind="uncertainty.mode">
        <option value="">Choose…</option>
        ${unresolved.map(m => `<option value="${m}">${esc(MODES[m].title)}</option>`).join("")}
        <option value="other">Other</option>
      </select></label>
    ${area("uncertainty.why", "Why it isn’t excluded yet", "What would you still need to see?", 2)}`;

  return `
    <header class="nb-head">
      <div><h2 class="t-h3" id="nb-title">Lab notebook</h2><p class="t-ui t-muted">${esc(c.system)} · saved in this browser only</p></div>
      <button class="btn" type="button" data-act="nb-close">Close</button>
    </header>
    ${storageWarning()}
    <div class="nb-body">
      ${seen(4) ? `<section class="nb-sec yourq" aria-labelledby="nb-q"><h3 class="t-label" id="nb-q">Your question</h3><p class="yourq__text">${question(c)}</p></section>` : ""}
      ${section(3, STEPS[3].title, area("clue.observation", "Observation", "What do you see?", 4), seen(3))}
      ${section(5, STEPS[5].title, shortlist, seen(5))}
      ${section(6, STEPS[6].title, probe, seen(6))}
      ${section(7, STEPS[7].title, renderCompare(caseId), seen(7))}
      ${section(8, STEPS[8].title, revise, seen(8))}
    </div>`;
}

function setOpen(open, { focus = true } = {}) {
  isOpen = open;
  if (!open) sync();
  drawer.classList.toggle("is-open", open);
  drawer.inert = !open;
  tab.setAttribute("aria-expanded", String(open));
  if (open && focus) drawer.querySelector("#nb-title")?.focus();
  if (!open && focus) tab.focus();
}

function render() {
  unbind();
  offStore();
  const { caseId, step } = current;
  const docked = step === 7;
  const hidden = !caseId || docked;
  document.body.dataset.notebook = hidden ? (docked ? "docked" : "none") : "drawer";
  if (hidden) {
    drawer.innerHTML = "";
    if (isOpen) setOpen(false, { focus: false });
    return;
  }
  drawer.innerHTML = drawerBody(caseId);
  drawer.querySelector("#nb-title").tabIndex = -1;
  drawer.querySelector("[data-act=nb-close]").addEventListener("click", () => setOpen(false));
  unbind = bind(drawer, caseId);
  // Re-render when the shortlist, pair or verdicts change elsewhere (new cards, new options).
  last = structureKey(caseId);
  offStore = onChange(key => { if (key === "case:" + caseId) sync(); });
}

const TEXT_CONTROL = "textarea, select, input:not([type=checkbox], [type=radio], [type=button])";
let last = "", pointerDown = false;

// Redraws if the structure changed, unless the student is typing (then the focusout flush does it).
function sync() {
  const { caseId } = current;
  if (!caseId || structureKey(caseId) === last) return;
  if (document.activeElement?.matches?.(TEXT_CONTROL) && drawer.contains(document.activeElement)) return;
  const a = document.activeElement, inside = drawer.contains(a) && a !== drawer;
  const sel = inside && controlSelector(a);
  const body = () => drawer.querySelector(".nb-body");
  const top = [drawer.scrollTop, body()?.scrollTop];
  render();
  drawer.scrollTop = top[0];
  if (body() && top[1] != null) body().scrollTop = top[1];
  if (sel) drawer.querySelector(sel)?.focus({ preventScroll: true });
}

// A selector that finds the same control after a redraw.
function controlSelector(el) {
  const q = (name, v) => `[${name}="${CSS.escape(v)}"]`;
  if (el.dataset.bind) return q("data-bind", el.dataset.bind);
  const bar = el.closest("[data-verdict]");
  if (bar && el.dataset.value) return `${q("data-verdict", bar.dataset.verdict)} ${q("data-value", el.dataset.value)}`;
  if (el.dataset.act) return q("data-act", el.dataset.act);
  if (el.id) return "#" + CSS.escape(el.id);
  if (el.getAttribute("href")) return `a${q("href", el.getAttribute("href"))}`;
  return null;
}

const structureKey = caseId => {
  const s = caseState(caseId);
  return JSON.stringify([s.visited, s.shortlist, s.pair, s.verdicts, s.predictions]);
};

export function initNotebook(tabEl, drawerEl) {
  tab = tabEl;
  drawer = drawerEl;
  drawer.inert = true;
  drawer.addEventListener("focusout", () => setTimeout(() => { if (!pointerDown) sync(); }));
  drawer.addEventListener("pointerdown", () => { pointerDown = true; });
  document.addEventListener("pointerup", () => { pointerDown = false; });
  drawer.addEventListener("click", () => setTimeout(sync));
  tab.addEventListener("click", () => setOpen(!isOpen));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && isOpen) setOpen(false); });
}

export function updateNotebook(route) {
  current = route;
  render();
}
