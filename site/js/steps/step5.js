// Step 5, a workbench like steps 3, 4 and 6. Head: the gene card (fly gene ↔ human orthologue,
// with links, beside its function). Main: the transcript map with its probe track (each probe
// region is a keyboard button). Side pane, read top to bottom: the pair (smFISH 1 over smFISH 2,
// the next slot to fill outlined in its ink), Swap, Show results, then optional predictions.
// The only checks are formal: two regions, and they must differ. No hints about traps or decoys.

import { MODES } from "../content.js";
import { caseState, updateCase } from "../store.js";
import { bind } from "../forms.js";
import { href, go } from "../router.js";
import { transcripts } from "../data.js";
import { createMap } from "../map.js";
import { term } from "../glossary.js";

// line icons, drawn in currentColor at the UI stroke weight
const X_ICON = `<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const SWAP_ICON = `<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 4.5h10M12 4.5L9.5 2M12 4.5L9.5 7M12 9.5H2M2 9.5L4.5 7M2 9.5L4.5 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const Q_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.75" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6.25 6.3a1.8 1.8 0 1 1 2.7 1.55c-.6.35-.95.75-.95 1.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="11.45" r=".85" fill="currentColor"/></svg>`;
const OUT_ICON = `<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M3.5 1.5h5v5M8.5 1.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// "How two-colour smFISH works": a made-up gene with regions A and B, never the case gene.
// A help card under the map's legend: hovering opens it, a click (or Enter) keeps it open,
// and Esc, its close button or a click elsewhere hides it.
const HOWTO = `
  <span class="howto">
    <button type="button" class="howto__btn" aria-expanded="false" aria-controls="howto-card">${Q_ICON}How two-colour smFISH works</button>
    <div class="howto__card" id="howto-card" role="group" aria-labelledby="howto-h" hidden>
      <div class="howto__head"><h2 class="howto__title" id="howto-h">How two-colour smFISH works</h2>
        <button type="button" class="howto__close" aria-label="Close">${X_ICON}</button></div>
      <div class="howto__body">
        <svg viewBox="0 0 340 200" role="img" aria-label="A made-up gene with region A on exon 2 and region B on exon 3. A molecule with both regions shows a white spot, one with only A a green spot, one with only B a magenta spot; nascent RNA at the transcription site makes one bright nuclear spot.">
          <text x="0" y="12">made-up gene</text>
          <line x1="10" x2="330" y1="40" y2="40" stroke="var(--map-intron)" stroke-width="1.5"/>
          <rect x="10" y="32" width="50" height="16" fill="var(--map-cds)"/>
          <rect x="120" y="32" width="70" height="16" fill="var(--map-cds)"/>
          <rect x="250" y="32" width="70" height="16" fill="var(--map-cds)"/>
          <path d="M122,26 L122,21 L188,21 L188,26" fill="none" stroke="var(--ch1-ink)" stroke-width="2.5"/><text x="155" y="16" text-anchor="middle" style="fill:var(--ch1-ink);font-weight:600">A</text>
          <path d="M252,26 L252,21 L318,21 L318,26" fill="none" stroke="var(--ch2-ink)" stroke-width="2.5"/><text x="285" y="16" text-anchor="middle" style="fill:var(--ch2-ink);font-weight:600">B</text>
          ${[[78, "1 2 3", [[0, 40], [40, 90], [90, 140]], "#FFFFFF", "A and B: white"], [112, "1 2", [[0, 40], [40, 90]], "#46E66E", "A only: green"], [146, "1 3", [[0, 40], [40, 90]], "#EB46E1", "B only: magenta"]].map(([y, label, ex, color, txt], k) => `
            ${ex.map(([a, b], i) => `<rect x="${10 + a}" y="${y - 6}" width="${b - a - 2}" height="12" fill="var(--map-cds)"/>`).join("")}
            ${k === 0 ? `<rect x="51" y="${y - 9}" width="48" height="3" fill="var(--ch1-ink)"/><rect x="101" y="${y - 9}" width="48" height="3" fill="var(--ch2-ink)"/>` : ""}
            ${k === 1 ? `<rect x="51" y="${y - 9}" width="48" height="3" fill="var(--ch1-ink)"/>` : ""}
            ${k === 2 ? `<rect x="51" y="${y - 9}" width="48" height="3" fill="var(--ch2-ink)"/>` : ""}
            <rect x="172" y="${y - 12}" width="24" height="24" rx="2" fill="#000"/><circle cx="184" cy="${y}" r="4.5" fill="${color}"/>
            <text x="204" y="${y + 4}">${txt}</text>`).join("")}
          <rect x="172" y="164" width="24" height="24" rx="2" fill="#000"/><circle cx="184" cy="176" r="9" fill="none" stroke="#5A78EB" stroke-width="1.2"/><circle cx="184" cy="176" r="3.6" fill="#FFFFFF"/>
          <text x="204" y="173">nascent RNA:</text><text x="204" y="187">bright nuclear spot</text>
          <text x="10" y="180">molecules</text><text x="10" y="194">(mature mRNA)</text>
        </svg>
        <ol>
          <li><b>Probes:</b> each probe set is many short labelled DNA oligos that bind one region of the RNA. Region A’s set is green; region B’s is magenta.</li>
          <li><b>One molecule, one spot:</b> each RNA molecule appears as a single small spot.</li>
          <li><b>Colours:</b> a molecule carrying both regions looks white (green + magenta). A molecule carrying only one region shows only that region’s colour.</li>
          <li><b>Transcription sites:</b> many ${term("nascent", "nascent RNAs")} on one gene make one bright spot in the nucleus. Probes against an intron label only nascent RNA, because introns are removed from mature mRNA.</li>
          <li><b>Counting:</b> counting spots in each compartment tells you how many molecules are where.</li>
        </ol>
      </div>
    </div>
  </span>`;

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const nt = n => n.toLocaleString("en-GB");

export async function mount(root, ctx) {
  const id = ctx.caseId;
  const t = ctx.case.target;
  const models = await transcripts(id);

  root.innerHTML = `
    <div class="bench bench--probe">
      <header class="target" aria-labelledby="target-name">
        <p class="t-label">Experimental design · Step 5</p>
        <div class="gene">
          <div class="gene__pair">
            <h1 class="gene__names" id="target-name"><i>${esc(t.gene)}</i><span class="gene__arrow" aria-label="corresponds to">↔</span><span>${esc(t.orthologue)}</span></h1>
            <span class="gene__meta">Fly gene · <a href="${t.flybase}" target="_blank" rel="noopener">FlyBase${OUT_ICON}</a></span><span></span><span class="gene__meta">Human ${term("orthologue", "orthologue")} · <a href="${t.orthologueLink}" target="_blank" rel="noopener">NCBI Gene${OUT_ICON}</a></span>
          </div>
          <p class="gene__about t-ui-lg">${esc(t.function)}</p>
        </div>
      </header>
      <section class="bench__main probe-main" aria-label="Transcript map">
        <div id="map"></div>
        ${HOWTO}
      </section>
      <aside class="bench__side pane" aria-label="Probe pair and predictions">
        <section class="pair" aria-labelledby="pair-h">
          <h2 class="t-label" id="pair-h">Your pair</h2>
          <p class="pair__lede">Click two regions on the map. The first fills ${term("smfish", "smFISH")} 1, the second smFISH 2.</p>
          <ul class="pair__slots" role="list">
            ${["ch1", "ch2"].map(k => `
            <li class="pslot pslot--${k}" data-slot="${k}" tabindex="-1">
              <span class="pslot__ch">smFISH ${k === "ch1" ? 1 : 2}</span>
              <span class="pslot__val"><b class="pslot__id"></b><span class="pslot__len"></span></span>
              <button type="button" class="pslot__clear" data-clear="${k}" aria-label="Clear smFISH ${k === "ch1" ? 1 : 2}">${X_ICON}</button>
            </li>`).join("")}
          </ul>
          <div class="pair__tools">
            <button class="btn btn--quiet pair__swap" type="button" data-act="swap">${SWAP_ICON}Swap channels</button>
            <span class="pair__msg" id="slot-msg" aria-live="polite"></span>
          </div>
          <div class="pair__go"></div>
        </section>
        <section class="predict" aria-labelledby="pred-h">
          <h2 class="t-label" id="pred-h">Predictions (optional)</h2>
          <div class="predict__rows"></div>
        </section>
      </aside>
    </div>`;

  const shortlist = caseState(id).shortlist;
  root.querySelector(".predict__rows").innerHTML = shortlist.length
    ? `<p class="predict__lede">If a mode on your shortlist is true, what would you expect to see with this pair?</p>` +
      shortlist.map(m => `
      <div class="predict__row">
        <label class="field"><span class="field__label">${esc(MODES[m].title)}</span>
          <textarea class="textarea" rows="2" data-bind="predictions.${m}.text" placeholder="With this pair we’d see…"></textarea></label>
        <label class="predict__cant"><input type="checkbox" data-bind="predictions.${m}.cantTest"> This pair can’t test it</label>
      </div>`).join("")
    : `<p class="predict__lede">Shortlist modes in <a href="${href(id, 4)}">step 4</a> to write predictions for them here.</p>`;

  const unbind = bind(root, id);
  const msg = root.querySelector("#slot-msg");
  const byId = new Map(models.probe_regions.map(r => [r.id, r]));
  const map = createMap(root.querySelector("#map"), models, { onPick: pick, fitTo: root.querySelector(".probe-main") });

  function refresh() {
    const { pair } = caseState(id);
    const next = !pair.ch1 ? "ch1" : !pair.ch2 ? "ch2" : null;
    for (const k of ["ch1", "ch2"]) {
      const slot = root.querySelector(`[data-slot=${k}]`), r = byId.get(pair[k]);
      slot.classList.toggle("is-filled", !!r);
      slot.classList.toggle("is-next", k === next);
      slot.querySelector(".pslot__id").textContent = r ? r.id : "";
      slot.querySelector(".pslot__len").textContent = r ? `${nt(r.length_nt)} nt` : "Click a region on the map";
      slot.querySelector(".pslot__clear").hidden = !r;
    }
    root.querySelector("[data-act=swap]").disabled = !(pair.ch1 || pair.ch2);
    map.setPair(pair);
    root.querySelector(".pair__go").innerHTML = pair.ch1 && pair.ch2
      ? `<a class="btn btn--primary btn--lg pair__results" href="${href(id, 6)}">Show results</a>`
      : `<span class="btn btn--lg pair__results" aria-disabled="true">Show results</span><span class="pair__why">Choose two probe regions to see the results.</span>`;
  }

  function pick(r) {
    msg.textContent = "";
    updateCase(id, s => {
      if (s.pair.ch1 === r) s.pair.ch1 = null;
      else if (s.pair.ch2 === r) s.pair.ch2 = null;
      else if (!s.pair.ch1) s.pair.ch1 = r;
      else if (!s.pair.ch2) s.pair.ch2 = r;
      else msg.textContent = "Both channels are full. Clear one first.";
    });
    refresh();
  }

  const onClick = e => {
    const clear = e.target.closest("[data-clear]");
    if (clear) {
      const k = clear.dataset.clear;
      msg.textContent = "";
      updateCase(id, s => { s.pair[k] = null; });
      refresh();
      root.querySelector(`[data-slot=${k}]`).focus();   // the × is gone; keep focus on its slot
    } else if (e.target.closest("[data-act=swap]")) {
      updateCase(id, s => { s.pair = { ch1: s.pair.ch2, ch2: s.pair.ch1 }; });
      refresh();
    }
  };
  root.addEventListener("click", onClick);
  refresh();
  const offHowto = howto(root.querySelector(".howto"));

  return () => { unbind(); offHowto(); map.destroy(); root.removeEventListener("click", onClick); };
}

// The help card: fixed to the viewport (the map column scrolls), under its button or, when
// there is more room, above it; kept inside the workbench (clear of the notebook tab), with its
// arrow on the button.
function howto(wrap) {
  const btn = wrap.querySelector(".howto__btn"), card = wrap.querySelector(".howto__card");
  let pinned = false, timer = null;
  const place = () => {
    const b = btn.getBoundingClientRect();
    const bench = wrap.closest(".bench");
    const right = bench ? bench.getBoundingClientRect().right - parseFloat(getComputedStyle(bench).paddingRight) : window.innerWidth - 16;
    card.style.maxHeight = "";
    const w = card.offsetWidth, h = card.offsetHeight;
    const below = window.innerHeight - b.bottom - 26, above = b.top - 26;
    const up = h > below && above > below;
    const minLeft = wrap.closest(".bench__main")?.getBoundingClientRect().left ?? 16;   // aligned with the map column
    const left = Math.max(minLeft, Math.min(right - w, b.left));
    card.dataset.side = up ? "above" : "below";
    card.style.left = `${left}px`;
    card.style.top = `${up ? Math.max(16, b.top - 10 - Math.min(h, above)) : b.bottom + 10}px`;
    card.style.maxHeight = `${up ? above : below}px`;
    card.style.setProperty("--arrow", `${b.left + Math.min(b.width / 2, 18) - left}px`);
  };
  const open = () => {
    clearTimeout(timer);
    if (!card.hidden) return;
    card.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    place();
  };
  const close = () => {
    clearTimeout(timer);
    card.hidden = true;
    pinned = false;
    btn.setAttribute("aria-expanded", "false");
  };
  const later = (fn, ms) => { clearTimeout(timer); timer = setTimeout(fn, ms); };

  // hover (mouse only): a short delay each way, so passing over the button doesn't flash it and
  // the pointer can cross the gap into the card
  wrap.addEventListener("pointerenter", e => { if (e.pointerType === "mouse" && !pinned) later(open, 120); });
  wrap.addEventListener("pointerleave", e => { if (e.pointerType === "mouse" && !pinned) later(close, 220); });
  btn.addEventListener("click", () => {
    if (pinned) close();
    else { open(); pinned = true; }
  });
  wrap.querySelector(".howto__close").addEventListener("click", () => { close(); btn.focus(); });
  const onDoc = e => { if (!card.hidden && !wrap.contains(e.target) && !e.target.closest?.(".gl-tip")) close(); };
  const onKey = e => {
    if (e.key === "Escape" && !card.hidden) { const back = card.contains(document.activeElement); close(); if (back) btn.focus(); }
  };
  const onMove = () => { if (!card.hidden) place(); };
  document.addEventListener("click", onDoc);
  document.addEventListener("keydown", onKey);
  window.addEventListener("scroll", onMove, { passive: true, capture: true });
  window.addEventListener("resize", onMove);
  return () => {
    clearTimeout(timer);
    document.removeEventListener("click", onDoc);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("scroll", onMove, { capture: true });
    window.removeEventListener("resize", onMove);
  };
}

// "Choose a new pair": a fresh map, predictions cleared (they belong to a pair).
// Observation, interpretation, verdicts and the claim are kept.
export function newPair(caseId) {
  updateCase(caseId, s => { s.pair = { ch1: null, ch2: null }; s.predictions = {}; });
  go(caseId, 5);
}
