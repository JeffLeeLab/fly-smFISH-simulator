// Step 6: reveal + compare. Viewer about two-thirds of the width; the side pane switches
// between viewer controls and the notebook's Compare tab; Plot | Table under the viewer.

import { caseState, onChange } from "../store.js";
import { bind } from "../forms.js";
import { href } from "../router.js";
import { renderCompare } from "../notebook.js";
import { hasWebGL2, renderNoWebGL } from "../viewer/gl.js";
import { renderControls, viewerPrefs } from "../viewer/controls.js";
import { loadJSON, transcripts } from "../data.js";
import { MEASURES, fixedScales, plotSVG, plotTitle, tableHTML } from "../results.js";
import { LIGHT, copyCanvas, svgToCanvas } from "../export.js";
import { newPair } from "./step5.js";
import { tourOnce, runTour, VIEWER_TOUR, LEGEND_POINTER } from "../tour.js";

export async function mount(root, ctx) {
  const id = ctx.caseId;
  const { pair } = caseState(id);

  root.innerHTML = `
    <div class="bench">
      <header class="bench__head">
        <div class="bench__title"><p class="t-label">Observe · Step 6</p><h1 class="t-h2">Microscopy reveal</h1></div>
        <div class="next-row">
          <span class="chip chip--ch1">smFISH 1 · <span class="t-data">${pair.ch1}</span></span>
          <span class="chip chip--ch2">smFISH 2 · <span class="t-data">${pair.ch2}</span></span>
          <button class="btn" type="button" data-act="new-pair">Choose a new pair</button>
        </div>
      </header>
      <section class="bench__main" aria-label="Microscope view">
        <div id="viewer"></div>
      </section>
      <section class="bench__foot results" aria-label="Counts">
        <div class="results__bar">
          <div class="seg" role="tablist" aria-label="Counts view">
            <button type="button" role="tab" aria-selected="true" data-view="plot">Plot</button><button type="button" role="tab" aria-selected="false" data-view="table">Table</button>
          </div>
          <div class="seg results__plotonly" role="group" aria-label="Channel">
            <button type="button" data-channel="ch1" aria-pressed="true"><span class="cdot cdot--ch1" aria-hidden="true"></span>smFISH 1 · ${pair.ch1}</button><button type="button" data-channel="ch2" aria-pressed="false"><span class="cdot cdot--ch2" aria-hidden="true"></span>smFISH 2 · ${pair.ch2}</button><button type="button" data-channel="both" aria-pressed="false"><span class="cdot cdot--both" aria-hidden="true"></span>Both</button>
          </div>
          <label class="results__measure results__plotonly"><span class="vh">Measure</span>
            <select class="select" data-act="measure">${Object.entries(MEASURES).map(([k, m]) => `<option value="${k}">${m.label}</option>`).join("")}</select></label>
          <span class="results__spacer"></span>
          <button type="button" class="btn results__plotonly" data-act="plot-png">Copy plot as PNG</button>
        </div>
        <div class="results__plot" data-panel="plot">
          <p class="results__title"></p>
          <div class="results__svgbox"><svg class="splot" role="img"></svg><div class="tmap__tip" hidden></div></div>
          <p class="results__note"></p>
        </div>
        <div class="results__table" data-panel="table" hidden></div>
      </section>
      <aside class="bench__side" aria-label="Viewer controls and compare">
        <div class="seg side-tabs" role="tablist" aria-label="Side pane">
          <button type="button" role="tab" aria-selected="true" aria-controls="pane-viewer" id="tab-viewer">Viewer controls</button>
          <button type="button" role="tab" aria-selected="false" aria-controls="pane-compare" id="tab-compare">Compare</button>
        </div>
        <div id="pane-viewer" role="tabpanel" aria-labelledby="tab-viewer"></div>
        <div id="pane-compare" role="tabpanel" aria-labelledby="tab-compare" class="compare" hidden>${renderCompare(id)}</div>
        <p class="next-row" id="to-revise"></p>
      </aside>
    </div>`;

  const unbind = bind(root, id);

  const tabs = root.querySelector(".side-tabs");
  tabs.addEventListener("click", e => {
    const b = e.target.closest("[role=tab]");
    if (!b) return;
    tabs.querySelectorAll("[role=tab]").forEach(t => {
      const on = t === b;
      t.setAttribute("aria-selected", String(on));
      root.querySelector("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
  });
  root.querySelector("[data-act=new-pair]").addEventListener("click", () => newPair(id));

  const next = root.querySelector("#to-revise");
  const gate = () => {
    const s = caseState(id);
    const missing = s.shortlist.filter(m => !s.verdicts[m]).length;
    next.innerHTML = missing
      ? `<span class="btn btn--lg" aria-disabled="true">Next: interpret &amp; revise</span><span class="t-ui t-muted">${missing} mode${missing > 1 ? "s" : ""} still need${missing > 1 ? "" : "s"} a verdict. Unresolved counts.</span>`
      : `<a class="btn btn--primary btn--lg" href="${href(id, 7)}">Next: interpret &amp; revise</a>`;
  };
  gate();
  const off = onChange(k => { if (k === "case:" + id) gate(); });

  // ---------- plot and table ----------
  const tables = await loadJSON(`data/${id}/tables.json`);
  const entry = tables.selections[`${pair.ch1}+${pair.ch2}`];
  const yMax = fixedScales(tables);
  const plot = { channel: "ch1", measure: "count" };
  const svg = root.querySelector(".splot");
  const box = root.querySelector(".results__svgbox");
  const tipEl = box.querySelector(".tmap__tip");
  const ink = { ch1: "var(--ch1-ink)", ch2: "var(--ch2-ink)", both: "var(--text-2)" };
  const screenPal = () => ({ bg: "var(--bg)", text: "var(--text)", text2: "var(--text-2)", grid: "var(--border)", ink: ink[plot.channel],
    sans: "var(--font-sans)", mono: "var(--font-mono)" });

  function drawPlot() {
    const w = Math.max(320, box.clientWidth), h = Math.max(120, box.clientHeight);
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    svg.innerHTML = plotSVG({ entry, channel: plot.channel, measure: plot.measure, yMax: yMax[plot.measure], width: w, height: h, pal: screenPal() });
    svg.setAttribute("aria-label", plotTitle(pair, plot.channel, plot.measure));
    root.querySelector(".results__title").textContent = plotTitle(pair, plot.channel, plot.measure);
    root.querySelector(".results__note").textContent = MEASURES[plot.measure].note;
    root.querySelectorAll("[data-channel]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.channel === plot.channel)));
  }
  root.querySelector(".results__table").innerHTML = tableHTML(entry, pair);
  const foot = root.querySelector(".results");
  foot.addEventListener("click", async e => {
    const b = e.target.closest("button, .splot__cat, .splot__pt");
    if (!b) return;
    if (b.dataset.view) {
      foot.querySelectorAll("[data-view]").forEach(t => t.setAttribute("aria-selected", String(t === b)));
      foot.querySelectorAll("[data-panel]").forEach(p => { p.hidden = p.dataset.panel !== b.dataset.view; });
      foot.querySelectorAll(".results__plotonly").forEach(x => { x.hidden = b.dataset.view !== "plot"; });
      if (b.dataset.view === "plot") drawPlot();
    } else if (b.dataset.channel) { plot.channel = b.dataset.channel; drawPlot(); }
    else if (b.dataset.act === "plot-png") {
      const W = 1920, H = 1080;
      const pal = { ...LIGHT, ink: LIGHT[plot.channel] };
      const inner = `<text x="64" y="84" font-family="${LIGHT.sans}" font-size="34" font-weight="600" fill="${LIGHT.text}">${plotTitle(pair, plot.channel, plot.measure)}</text>
        <g transform="translate(40,120)">${plotSVG({ entry, channel: plot.channel, measure: plot.measure, yMax: yMax[plot.measure], width: W - 80, height: H - 220, pal, font: 2.2 })}</g>
        <text x="64" y="${H - 40}" font-family="${LIGHT.sans}" font-size="24" fill="${LIGHT.text2}">${MEASURES[plot.measure].note} · Simulated teaching data</text>`;
      await copyCanvas(await svgToCanvas(inner, W, H, LIGHT.bg), `smFISH-${id}-plot-${plot.measure}.png`, b);
    } else if (b.classList.contains("splot__cat") && viewer) viewer.flyTo(b.dataset.fly);
    else if (b.classList.contains("splot__pt") && viewer) viewer.setAnimal(+b.dataset.animal);
  });
  foot.addEventListener("keydown", e => {
    const c = e.target.closest(".splot__cat");
    if (c && (e.key === "Enter" || e.key === " ") && viewer) { e.preventDefault(); viewer.flyTo(c.dataset.fly); }
  });
  foot.querySelector("[data-act=measure]").addEventListener("change", e => { plot.measure = e.target.value; drawPlot(); });
  svg.addEventListener("mousemove", e => {
    const pt = e.target.closest(".splot__pt");
    if (!pt) { tipEl.hidden = true; return; }
    const r = box.getBoundingClientRect();
    tipEl.textContent = pt.dataset.tip;
    tipEl.hidden = false;
    tipEl.style.left = `${e.clientX - r.left + 12}px`;
    tipEl.style.top = `${e.clientY - r.top + 12}px`;
  });
  svg.addEventListener("mouseleave", () => { tipEl.hidden = true; });
  const plotRO = new ResizeObserver(() => { if (!root.querySelector("[data-panel=plot]").hidden) drawPlot(); });
  plotRO.observe(box);
  drawPlot();

  const host = root.querySelector("#viewer");
  let viewer = null, offControls = () => {};
  if (!hasWebGL2()) {
    renderNoWebGL(host);
    // the plot, table and notebook still work: open on Compare
    root.querySelector("#pane-viewer").innerHTML = `<p class="t-ui t-muted">Viewer controls need WebGL 2. The plot, table and Compare notes still work.</p>`;
    root.querySelector("#tab-compare").click();
  } else {
    const { createViewer } = await import("../viewer/viewer.js");
    const regionIds = (await transcripts(id)).probe_regions.map(r => r.id);
    viewer = await createViewer(host, { caseId: id, mode: "results", pair, regionIds, ...viewerPrefs() });
    offControls = renderControls(root.querySelector("#pane-viewer"), viewer, { mode: "results", pair });
    host.addEventListener("viewer-tour", () => {
      root.querySelector("#tab-viewer").click();  // the tour points at the viewer controls
      runTour(VIEWER_TOUR, { key: "viewer" });
    });
    tourOnce("legend", LEGEND_POINTER);  // a one-line pointer the first time the legend appears
  }

  return () => {
    unbind();
    off();
    plotRO.disconnect();
    offControls();
    viewer?.destroy();
  };
}
