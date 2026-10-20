// Full screen for the microscope (steps 3 and 7). The bench takes the whole screen on the dark
// tokens, whatever the theme: the viewer keeps its toolbar, fields and legend, its controls float
// over the fields' top-right corner (collapsible, remembered per browser), and in step 7 the plot
// drawer comes along under it. The browser goes full screen too where it can; the request is for
// the root element, so glossary tips and tours, which live on <body>, still show. Where it can't
// (a phone, or a refused request), the in-page view still hides the site around it.
// Leave by the same button, Esc, the browser's own exit, or by leaving the step.

import { read, write } from "../store.js";
import { CHEVRON_ICON } from "../icons.js";

const fsElement = () => document.fullscreenElement ?? document.webkitFullscreenElement ?? null;

// `controls`: the element renderControls drew into (its events are delegated from it, so it is
// moved whole). Returns a cleanup for the step's unmount.
export function fullView(bench, { controls }) {
  const btn = bench.querySelector(".viewer [data-act=full]");
  const fields = bench.querySelector(".viewer__fields");
  if (!btn || !fields || !controls) return () => {};
  btn.hidden = false;
  const rail = document.querySelector(".rail");

  const panel = document.createElement("section");
  panel.className = "fullview__panel";
  panel.setAttribute("aria-label", "Viewer controls");
  panel.innerHTML = `<button type="button" class="fullview__head" aria-expanded="true">Viewer controls${CHEVRON_ICON}</button><div class="fullview__body"></div>`;
  const head = panel.querySelector(".fullview__head"), body = panel.querySelector(".fullview__body");
  const setCollapsed = c => {
    panel.classList.toggle("is-collapsed", c);
    head.setAttribute("aria-expanded", String(!c));
  };
  setCollapsed(!!read("fullview")?.collapsed);
  head.addEventListener("click", () => {
    const c = !panel.classList.contains("is-collapsed");
    setCollapsed(c);
    write("fullview", { collapsed: c });
  });

  let on = false, ownFs = false, home = null;

  function label() {
    btn.setAttribute("aria-label", on ? "Exit full screen" : "Full screen");
    btn.title = on ? "Exit full screen (Esc)" : "Full screen";
  }

  async function enter() {
    if (on) return;
    on = true;
    home = { parent: controls.parentNode, next: controls.nextSibling };
    body.append(controls);
    fields.append(panel);
    bench.classList.add("is-full");
    bench.dataset.theme = "dark";
    document.documentElement.dataset.full = "";
    if (rail) rail.inert = true;
    label();
    const root = document.documentElement;
    const request = root.requestFullscreen ?? root.webkitRequestFullscreen;
    if (request && !fsElement()) {
      try {
        await request.call(root, { navigationUI: "hide" });
        ownFs = on;
        if (!on) leaveBrowserFs();   // left again while the request was pending
      } catch { ownFs = false; }
    }
  }

  function leaveBrowserFs() {
    if (!fsElement()) return;
    const leave = document.exitFullscreen ?? document.webkitExitFullscreen;
    Promise.resolve(leave?.call(document)).catch(() => {});
  }

  function exit() {
    if (!on) return;
    on = false;
    home.parent.insertBefore(controls, home.next?.parentNode === home.parent ? home.next : null);
    panel.remove();
    bench.classList.remove("is-full");
    delete bench.dataset.theme;
    delete document.documentElement.dataset.full;
    if (rail) rail.inert = false;
    label();
    if (ownFs) leaveBrowserFs();
    ownFs = false;
  }

  btn.addEventListener("click", () => (on ? exit() : enter()));
  // the browser's own exit (its Esc, or F11) leaves the full view too
  const onFs = () => { if (on && ownFs && !fsElement()) { ownFs = false; exit(); } };
  document.addEventListener("fullscreenchange", onFs);
  document.addEventListener("webkitfullscreenchange", onFs);
  // In the in-page view, Esc leaves, unless it is closing a tour, a glossary tip, a card or the
  // Save menu first (capture phase: seen before those close themselves).
  const onKey = e => {
    if (e.key !== "Escape" || !on) return;
    const tip = document.getElementById("gl-tip");
    if (document.querySelector(".tour") || (tip && !tip.hidden) || document.querySelector(".popcard:not([hidden]), .savemenu__menu.is-open")) return;
    exit();
  };
  window.addEventListener("keydown", onKey, true);

  return () => {
    exit();
    window.removeEventListener("keydown", onKey, true);
    document.removeEventListener("fullscreenchange", onFs);
    document.removeEventListener("webkitfullscreenchange", onFs);
  };
}
