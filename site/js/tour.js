// Short guided pointers: the 3-point viewer tour (first time the viewer opens, replayable) and
// the one-line pointer to the decoder legend. Each step is a small popover anchored to its
// target, which gets a clay outline while the step is shown. Esc or "Skip" ends it.
// Shown once per browser unless replayed.

import { read, write } from "./store.js";

let active = null;

export function endTour() {
  active?.close();
}

export function runTour(steps, { key } = {}) {
  endTour();
  const live = steps.filter(s => document.querySelector(s.target)?.getClientRects().length);  // visible targets only
  if (!live.length) return;
  let i = 0;
  const pop = document.createElement("div");
  pop.className = "tour";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-live", "polite");
  document.body.append(pop);
  let lit = null;

  function place() {
    const t = document.querySelector(live[i].target);
    if (!t) return;
    const r = t.getBoundingClientRect();
    const w = pop.offsetWidth, h = pop.offsetHeight;
    const below = r.bottom + h + 14 < window.innerHeight;
    const left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + Math.min(r.width / 2, 120) - 24));
    pop.style.left = `${left}px`;
    pop.style.top = `${below ? r.bottom + 10 : r.top - h - 10}px`;
    pop.dataset.side = below ? "below" : "above";
    pop.style.setProperty("--arrow", `${Math.max(14, Math.min(w - 20, r.left + Math.min(r.width / 2, 120) - left))}px`);
  }

  function render() {
    const s = live[i];
    lit?.classList.remove("tour-lit");
    lit = document.querySelector(s.target);
    lit.classList.add("tour-lit");
    const last = i === live.length - 1;
    pop.setAttribute("aria-label", s.title);
    pop.innerHTML = `
      <p class="tour__title">${s.title}</p>
      <p class="tour__text">${s.text}</p>
      <div class="tour__foot">
        ${live.length > 1 ? `<span class="tour__count">${i + 1} of ${live.length}</span>` : ""}
        ${!last ? `<button type="button" class="btn btn--quiet" data-act="skip">Skip</button>` : ""}
        <button type="button" class="btn btn--primary" data-act="next">${last ? (live.length > 1 ? "Done" : "Got it") : "Next"}</button>
      </div>`;
    place();
    pop.querySelector("[data-act=next]").focus({ preventScroll: true });
  }

  function close() {
    lit?.classList.remove("tour-lit");
    pop.remove();
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", place);
    if (key) write(`tour:${key}`, true);
    active = null;
  }
  const onKey = e => { if (e.key === "Escape") { e.stopPropagation(); close(); } };

  pop.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.act === "skip") close();
    if (b.dataset.act === "next") { if (i < live.length - 1) { i++; render(); } else close(); }
  });
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", place);
  active = { close };
  render();
}

// Runs a tour only the first time (per browser).
export function tourOnce(key, steps) {
  if (!read(`tour:${key}`)) runTour(steps, { key });
}

export const VIEWER_TOUR = [
  {
    target: ".viewer__group",
    title: "Zoom and move",
    text: "Scroll or pinch to zoom; drag to move. These buttons fly to each part of the neuron.",
  },
  {
    target: "[data-tour=channels]",
    title: "Channels",
    text: "Turn each channel on or off, or show one alone with Solo. TDP-43 can be shown in another colour.",
  },
  {
    target: ".vseg",
    title: "Compare genotypes",
    text: "Control is on the left and the mutant on the right, zoomed together. Flicker shows one field and swaps genotype in place: press F.",
  },
];

export const LEGEND_POINTER = [
  {
    target: ".viewer__legend",
    title: "Decoder legend",
    text: "Read the colours here: this line says what white, green and magenta mean for your probe pair.",
  },
];
