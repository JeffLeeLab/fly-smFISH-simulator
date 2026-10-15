// Step 6: reveal + compare. The viewer fills the main column; the plot is a drawer docked under it
// (its toolbar always showing; opening it brings the plot up and the viewer shrinks to make room).
// The head carries the pair as a small probe map; hovering or focusing it opens the labelled map.
// The plot's exact values: hover a genotype's column, or Tab to a compartment's name.
// The side pane switches between viewer controls and the notebook's Compare tab.
// Full screen (viewer/fullview.js) takes the viewer, its controls and the plot drawer to the whole screen.

import { caseState, onChange, read, write } from "../store.js";
import { bind } from "../forms.js";
import { href } from "../router.js";
import { renderCompare } from "../notebook.js";
import { hasWebGL2, renderNoWebGL } from "../viewer/gl.js";
import { renderControls, viewerPrefs } from "../viewer/controls.js";
import { fullView } from "../viewer/fullview.js";
import { loadJSON, transcripts, regionLabel } from "../data.js";
import { measuresFor, fixedScales, plotSVG, plotTable, plotTitle, plotTitleParts } from "../results.js";
import { CASES } from "../content.js";
import { LIGHT, copyCanvas, svgToCanvas } from "../export.js";
import { createMap, drawStrip } from "../map.js";
import { popCard } from "../popcard.js";
import { CHEVRON_ICON, X_ICON } from "../icons.js";
import { newPair } from "./step5.js";
import { tourOnce, runTour, VIEWER_TOUR, LEGEND_POINTER } from "../tour.js";

export async function mount(root, ctx) {
  const id = ctx.caseId;
  const cs = CASES[id];
  const measures = measuresFor(cs);
  const { pair } = caseState(id);
  const lab = { ch1: regionLabel(pair.ch1), ch2: regionLabel(pair.ch2) };
  const g = await transcripts(id);

  root.innerHTML = `
    <div class="bench">
      <header class="bench__head">
        <div class="bench__title"><p class="t-label">Observe · Step 6</p><h1 class="t-h2">Microscopy reveal</h1></div>
        <div class="next-row">
          <span class="pstrip-wrap">
            <button type="button" class="pstrip popcard__trigger" aria-expanded="false" aria-controls="probe-card"
              aria-label="Your probe pair: smFISH 1 on ${lab.ch1}, smFISH 2 on ${lab.ch2}. Show them on the transcript map">
              <span class="pstrip__key" aria-hidden="true">
                <span><span class="cdot cdot--ch1"></span>smFISH 1 · <span class="t-data">${lab.ch1}</span></span>
                <span><span class="cdot cdot--ch2"></span>smFISH 2 · <span class="t-data">${lab.ch2}</span></span>
              </span>
              <span class="pstrip__fig"><svg class="pstrip__svg" aria-hidden="true"></svg></span>
            </button>
            <div class="popcard probecard" id="probe-card" role="group" aria-labelledby="probe-h" hidden>
              <div class="popcard__head"><h2 class="popcard__title" id="probe-h">Your probe pair</h2>
                <button type="button" class="popcard__close" aria-label="Close">${X_ICON}</button></div>
              <div class="probecard__body"><div class="probecard__map"></div></div>
            </div>
          </span>
          <button class="btn" type="button" data-act="new-pair">Choose a new pair</button>
        </div>
      </header>
      <section class="bench__main" aria-label="Microscope view">
        <div id="viewer"></div>
      </section>
      <section class="bench__foot results" aria-label="Plot">
        <div class="results__bar">
          <button type="button" class="btn results__toggle" aria-expanded="false" aria-controls="results-plot">${CHEVRON_ICON}<span>Show plot</span></button>
          <div class="seg" role="group" aria-label="Channel">
            <button type="button" data-channel="ch1" aria-pressed="true" aria-label="smFISH 1, ${lab.ch1}"><span class="cdot cdot--ch1" aria-hidden="true"></span>${lab.ch1}</button><button type="button" data-channel="ch2" aria-pressed="false" aria-label="smFISH 2, ${lab.ch2}"><span class="cdot cdot--ch2" aria-hidden="true"></span>${lab.ch2}</button><button type="button" data-channel="both" aria-pressed="false"><span class="cdot cdot--both" aria-hidden="true"></span>Both</button>
          </div>
          <label class="results__measure"><span class="vh">Measure</span>
            <select class="select" data-act="measure">${Object.entries(measures).map(([k, m]) => `<option value="${k}">${m.label}</option>`).join("")}</select></label>
          <button type="button" class="btn results__png" data-act="plot-png">Copy as PNG</button>
        </div>
        <div class="results__plot" id="results-plot" hidden>
          <p class="results__title"></p>
          <div class="results__svgbox"><svg class="splot" role="group"></svg><div class="tmap__tip" hidden></div></div>
          <p class="results__note"></p>
          <div class="results__sr"></div>
        </div>
      </section>
      <aside class="bench__side" aria-label="Viewer controls and compare">
        <div class="seg side-tabs" role="tablist" aria-label="Side pane">
          <button type="button" role="tab" aria-selected="true" aria-controls="pane-viewer" id="tab-viewer">Viewer controls</button>
          <button type="button" role="tab" aria-selected="false" aria-controls="pane-compare" id="tab-compare">Compare</button>
        </div>
        <div id="pane-viewer" role="tabpanel" aria-labelledby="tab-viewer"><div class="vctl-host"></div></div>
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

  // ---------- the probe strip and its card ----------
  const fig = root.querySelector(".pstrip__fig");
  const stripSvg = fig.querySelector("svg");
  let stripW = 0;
  const drawHead = () => {
    const w = Math.round(fig.clientWidth);
    if (w > 0 && w !== stripW) { stripW = w; drawStrip(stripSvg, g, pair, w); }
  };
  const stripRO = new ResizeObserver(drawHead);
  stripRO.observe(fig);
  drawHead();
  let cardMap = null;
  const offCard = popCard(root.querySelector(".pstrip-wrap"), {
    onOpen: card => {
      if (cardMap) return;
      cardMap = createMap(card.querySelector(".probecard__map"), g, { readOnly: true });
      cardMap.setPair(pair);
    },
  });

  // ---------- the plot drawer ----------
  const tables = await loadJSON(`data/${id}/tables.json`);
  const entry = tables.selections[`${pair.ch1}+${pair.ch2}`];
  const yMax = fixedScales(tables, cs);
  const plot = { channel: "ch1", measure: "count" };
  const foot = root.querySelector(".results");
  const bar = foot.querySelector(".results__bar");
  const panel = foot.querySelector(".results__plot");
  const toggle = foot.querySelector(".results__toggle");
  const svg = root.querySelector(".splot");
  const box = root.querySelector(".results__svgbox");
  const tipEl = box.querySelector(".tmap__tip");
  const ink = { ch1: "var(--ch1-ink)", ch2: "var(--ch2-ink)", both: "var(--text-2)" };
  const screenPal = () => ({ bg: "var(--bg)", text: "var(--text)", text2: "var(--text-2)", grid: "var(--border)", band: "var(--panel)", ink: ink[plot.channel],
    sans: "var(--font-sans)", mono: "var(--font-mono)" });

  function drawPlot() {
    root.querySelectorAll("[data-channel]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.channel === plot.channel)));
    if (panel.hidden) return;
    const w = Math.max(320, box.clientWidth), h = Math.max(120, box.clientHeight);
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    svg.innerHTML = plotSVG({ entry, channel: plot.channel, measure: plot.measure, yMax: yMax[plot.measure], width: w, height: h, pal: screenPal(), cs });
    svg.setAttribute("aria-label", plotTitle(pair, plot.channel, plot.measure, cs));
    root.querySelector(".results__title").textContent = plotTitle(pair, plot.channel, plot.measure, cs);
    root.querySelector(".results__note").textContent = measures[plot.measure].note;
    root.querySelector(".results__sr").innerHTML = plotTable(entry, pair, plot.channel, plot.measure, cs);
  }

  // the drawer slides between the toolbar's height and its open height; the plot is hidden
  // (not just clipped) once it has closed
  const barH = () => foot.style.setProperty("--bar-h", `${bar.offsetHeight}px`);
  const barRO = new ResizeObserver(barH);
  barRO.observe(bar);
  barH();
  let hideTimer = null;
  function setOpen(open, { remember = true } = {}) {
    clearTimeout(hideTimer);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector("span").textContent = open ? "Hide plot" : "Show plot";
    if (open) { panel.hidden = false; drawPlot(); }
    else hideTimer = setTimeout(() => { panel.hidden = true; }, 320);
    foot.classList.toggle("is-open", open);
    if (remember) write("plot", { open });
  }

  foot.addEventListener("click", async e => {
    const b = e.target.closest("button, .splot__cat, .splot__pt");
    if (!b) return;
    if (b === toggle) setOpen(!foot.classList.contains("is-open"));
    else if (b.dataset.channel) { plot.channel = b.dataset.channel; if (!foot.classList.contains("is-open")) setOpen(true); else drawPlot(); }
    else if (b.dataset.act === "plot-png") {
      const W = 1920, H = 1080;
      const pal = { ...LIGHT, ink: LIGHT[plot.channel] };
      // two-line header: gene and regions, then what is plotted (the slide names its gene)
      const [who, what] = plotTitleParts(pair, plot.channel, plot.measure, cs);
      const inner = `<text x="64" y="76" font-family="${LIGHT.sans}" font-size="34" font-weight="600" fill="${LIGHT.text}"><tspan font-family="${LIGHT.serif}" font-style="italic" font-weight="500">${cs.target.gene}</tspan> · ${who}</text>
        <text x="64" y="116" font-family="${LIGHT.sans}" font-size="24" fill="${LIGHT.text2}">${what}</text>
        <g transform="translate(40,150)">${plotSVG({ entry, channel: plot.channel, measure: plot.measure, yMax: yMax[plot.measure], width: W - 80, height: H - 250, pal, font: 2.2, cs })}</g>
        <text x="64" y="${H - 40}" font-family="${LIGHT.sans}" font-size="24" fill="${LIGHT.text2}">${measures[plot.measure].note} · Simulated teaching data</text>`;
      await copyCanvas(await svgToCanvas(inner, W, H, LIGHT.bg), `smFISH-${id}-plot-${plot.measure}.png`, b);
    } else if (b.classList.contains("splot__cat") && viewer) viewer.flyTo(b.dataset.fly);
    else if (b.classList.contains("splot__pt") && viewer) viewer.setAnimal(+b.dataset.animal);
  });
  foot.addEventListener("keydown", e => {
    const c = e.target.closest(".splot__cat");
    if (c && (e.key === "Enter" || e.key === " ") && viewer) { e.preventDefault(); viewer.flyTo(c.dataset.fly); }
  });
  foot.querySelector("[data-act=measure]").addEventListener("change", e => {
    plot.measure = e.target.value;
    if (!foot.classList.contains("is-open")) setOpen(true); else drawPlot();
  });
  svg.addEventListener("mousemove", e => {
    const pt = e.target.closest(".splot__pt, .splot__col");
    if (!pt) { tipEl.hidden = true; return; }
    tipEl.textContent = pt.dataset.tip;
    tipEl.hidden = false;
    // fixed to the viewport (the drawer clips), flipped to the pointer's other side near an edge
    const r = box.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    tipEl.style.left = `${e.clientX + 12 + w > r.right ? e.clientX - 12 - w : e.clientX + 12}px`;
    tipEl.style.top = `${e.clientY + 12 + h > window.innerHeight - 8 ? e.clientY - 12 - h : e.clientY + 12}px`;
  });
  svg.addEventListener("mouseleave", () => { tipEl.hidden = true; });
  svg.addEventListener("focusin", e => {
    const c = e.target.closest(".splot__cat");
    if (!c?.matches(":focus-visible")) return;
    const r = c.getBoundingClientRect();
    tipEl.textContent = c.dataset.tip;
    tipEl.hidden = false;
    tipEl.style.left = `${Math.min(r.left + 8, box.getBoundingClientRect().right - tipEl.offsetWidth)}px`;
    tipEl.style.top = `${r.bottom + 4}px`;
  });
  svg.addEventListener("focusout", () => { tipEl.hidden = true; });
  const plotRO = new ResizeObserver(() => drawPlot());
  plotRO.observe(box);

  const host = root.querySelector("#viewer");
  let viewer = null, offControls = () => {}, offFull = () => {};
  if (!hasWebGL2()) {
    renderNoWebGL(host);
    // the plot and notebook still work: open the plot and the Compare tab
    root.querySelector("#pane-viewer").innerHTML = `<p class="t-ui t-muted">Viewer controls need WebGL 2. The plot and Compare notes still work.</p>`;
    root.querySelector("#tab-compare").click();
    setOpen(true, { remember: false });
  } else {
    setOpen(!!read("plot")?.open, { remember: false });
    const { createViewer } = await import("../viewer/viewer.js");
    const regionIds = g.probe_regions.map(r => r.id);
    viewer = await createViewer(host, { caseId: id, mode: "results", pair, regionIds, ...viewerPrefs() });
    const controls = root.querySelector("#pane-viewer .vctl-host");
    offControls = renderControls(controls, viewer, { mode: "results", pair });
    offFull = fullView(root.querySelector(".bench"), { controls });
    host.addEventListener("viewer-tour", () => {
      root.querySelector("#tab-viewer").click();  // the tour points at the viewer controls
      runTour(VIEWER_TOUR, { key: "viewer" });
    });
    tourOnce("legend", LEGEND_POINTER);  // a one-line pointer the first time the legend appears
  }

  return () => {
    unbind();
    off();
    clearTimeout(hideTimer);
    stripRO.disconnect();
    barRO.disconnect();
    plotRO.disconnect();
    offCard();
    cardMap?.destroy();
    offFull();
    offControls();
    viewer?.destroy();
  };
}
