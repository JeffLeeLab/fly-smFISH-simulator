// Side-pane controls for the viewer: channel toggles with solo, the TDP-43 LUT and
// brightness (dimmed to 40% automatically while any smFISH channel is on), and the animal.
// LUT and brightness choices are kept per browser.

import { read, write } from "../store.js";
import { FISH_LUT, TDP_LUTS } from "./viewer.js";
import { term } from "../glossary.js";

export const viewerPrefs = () => ({ tdpLut: "yellow", tdpBrightness: 1, ...(read("viewer") || {}) });

export function renderControls(el, viewer, { mode, pair }) {
  const rows = [];
  if (mode === "results") {
    rows.push(["ch1", "smFISH 1", FISH_LUT.ch1.color, pair.ch1]);
    rows.push(["ch2", "smFISH 2", FISH_LUT.ch2.color, pair.ch2]);
  }
  rows.push(["tdp", "TDP-43 IF", null, null]);
  rows.push(["blue", "Membrane + DAPI", "#5F78C0", null]);

  el.innerHTML = `
    <div class="vctl">
      <div data-tour="channels">
        <h2 class="t-label vctl__h">Channels</h2>
        <ul class="vctl__rows" role="list">
          ${rows.map(([k, name, color, region]) => `
            <li>
              <div class="vctl__row">
                <label class="vctl__toggle"><input type="checkbox" data-ch="${k}">
                  <span class="vctl__dot" data-dot="${k}" style="--c:${color || TDP_LUTS[viewer.state.tdpLut].color}"></span>
                  ${name}${region ? ` · <span class="t-data">${region}</span>` : ""}</label>
                <button type="button" class="btn vctl__solo" data-solo="${k}" aria-pressed="false" aria-label="Show ${name} alone">Solo</button>
              </div>
              ${k === "tdp" ? `
              <div class="vctl__sub">
                <label>${term("lut", "LUT")} <select class="select" data-act="lut">${Object.entries(TDP_LUTS).map(([v, l]) => `<option value="${v}">${l.label}</option>`).join("")}</select></label>
                <label>Brightness <input type="range" min="0.2" max="1.6" step="0.1" data-act="bright"></label>
              </div>
              ${mode === "results" ? `<p class="vctl__note">Shown at 40% while an smFISH channel is on, so it doesn’t add up to a false white.</p>` : ""}` : ""}
            </li>`).join("")}
        </ul>
      </div>
      ${mode === "results" ? `
      <div>
        <h2 class="t-label vctl__h" id="animal-h">Animal</h2>
        <div class="seg" role="group" aria-labelledby="animal-h">
          ${[1, 2, 3].map(n => `<button type="button" data-animal="${n}" aria-pressed="false">${n}</button>`).join("")}
        </div>
      </div>` : ""}
    </div>`;

  const sync = s => {
    el.querySelectorAll("[data-ch]").forEach(i => { i.checked = !!s.visible[i.dataset.ch]; });
    el.querySelectorAll("[data-solo]").forEach(b => b.setAttribute("aria-pressed", String(s.solo === b.dataset.solo)));
    el.querySelectorAll("[data-animal]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.animal === s.animal)));
    const lut = el.querySelector("[data-act=lut]");
    if (lut) lut.value = s.tdpLut;
    const br = el.querySelector("[data-act=bright]");
    if (br && document.activeElement !== br) br.value = s.tdpBrightness;
    const dot = el.querySelector("[data-dot=tdp]");
    if (dot) dot.style.setProperty("--c", TDP_LUTS[s.tdpLut].color);
  };
  sync(viewer.state);
  const off = viewer.on(sync);

  el.addEventListener("change", e => {
    const t = e.target;
    if (t.dataset.ch) viewer.setVisible(t.dataset.ch, t.checked);
    if (t.dataset.act === "lut") { viewer.setTdpLut(t.value); write("viewer", { ...viewerPrefs(), tdpLut: t.value }); }
  });
  el.addEventListener("input", e => {
    if (e.target.dataset.act === "bright") {
      const v = +e.target.value;
      viewer.setTdpBrightness(v);
      write("viewer", { ...viewerPrefs(), tdpBrightness: v });
    }
  });
  el.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.solo) viewer.solo(b.dataset.solo);
    if (b.dataset.animal) viewer.setAnimal(+b.dataset.animal);
  });
  return off;
}
