// Step 5: the target card, two channel slots, then the transcript map with its probe track.
// Below the fold: the keyboard-accessible region list (mirrors the map) and optional predictions.
// The only checks are formal: two regions, and they must differ. No hints about traps or decoys.

import { MODES } from "../content.js";
import { caseState, updateCase } from "../store.js";
import { bind } from "../forms.js";
import { href, go } from "../router.js";
import { transcripts } from "../data.js";
import { createMap } from "../map.js";
import { term } from "../glossary.js";

// "How two-colour smFISH works": a made-up gene with regions A and B, never the case gene.
const HOWTO = `
  <details class="howto">
    <summary>How two-colour smFISH works</summary>
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
        <text x="204" y="180">nascent RNA: bright nuclear spot</text>
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
  </details>`;

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const nt = n => `${n.toLocaleString("en-GB")} nt`;

export async function mount(root, ctx) {
  const id = ctx.caseId;
  const t = ctx.case.target;
  const models = await transcripts(id);
  const regions = models.probe_regions;

  root.innerHTML = `
    <div class="bench bench--wide">
      <header class="target" aria-labelledby="target-name">
        <div class="target__name">
          <p class="t-label">Experimental design · Step 5</p>
          <h1 class="t-h2" id="target-name"><i>${esc(t.gene)}</i> <span class="target__arrow" aria-label="corresponds to">↔</span> human ${esc(t.orthologue)}</h1>
        </div>
        <div class="target__about">
          <p class="t-ui-lg">${esc(t.function)}</p>
          <p class="target__meta">
            <span class="layer layer--established">Established</span><span class="t-ui t-muted">Function, ${term("orthologue", "orthology")}</span>
            <span class="layer layer--invented">Invented for this case</span><span class="t-ui t-muted">Target–neuron–behaviour link</span>
            <a class="t-ui" href="${t.flybase}" target="_blank" rel="noopener">FlyBase</a>
            <a class="t-ui" href="${t.orthologueLink}" target="_blank" rel="noopener">${esc(t.orthologue)}</a>
          </p>
        </div>
      </header>
      <section class="bench__main probe-main" aria-label="Probe design">
        <p class="t-body">Choose two probe regions on the map: the first fills ${term("smfish", "smFISH")} 1, the second smFISH 2. Click a chosen region again to remove it.</p>
        ${HOWTO}
        <div class="slots" role="group" aria-label="Channels">
          <div class="slot" data-slot="ch1"><span class="chip chip--ch1">smFISH 1</span><b class="slot__val t-data"></b></div>
          <div class="slot" data-slot="ch2"><span class="chip chip--ch2">smFISH 2</span><b class="slot__val t-data"></b></div>
          <button class="btn" type="button" data-act="swap">Swap channels</button>
          <span class="t-ui t-muted" id="slot-msg" aria-live="polite"></span>
          <span class="slots__go"></span>
        </div>
        <div id="map"></div>
        <h2 class="t-label regions-h">Probe regions (keyboard list, same as the map)</h2>
        <ul class="regions" role="list">
          ${regions.map(r => `<li><button class="region" type="button" data-region="${r.id}" aria-pressed="false">
            <span class="region__id">${r.id}</span><span class="region__len">${nt(r.length_nt)}</span></button></li>`).join("")}
        </ul>
        <section class="predict" aria-labelledby="pred-h">
          <h2 class="t-h3" id="pred-h">Predictions (optional)</h2>
          <p class="t-ui t-muted">For each mode on your shortlist: if it is true, what would you expect to see with this pair?</p>
          <div class="predict__rows"></div>
          <label class="field"><span class="field__label">Features that could let this gene make different RNAs (optional)</span>
            <textarea class="textarea" rows="2" data-bind="features" placeholder="Which features on the map could do this?"></textarea></label>
        </section>
      </section>
    </div>`;

  const rows = root.querySelector(".predict__rows");
  rows.innerHTML = caseState(id).shortlist.map(m => `
    <div class="predict__row">
      <label class="field"><span class="field__label">${esc(MODES[m].title)}</span>
        <input class="input" data-bind="predictions.${m}.text" placeholder="If this is true, with this pair we’d see…"></label>
      <label class="predict__cant"><input type="checkbox" data-bind="predictions.${m}.cantTest"> This pair can’t test it</label>
    </div>`).join("");

  const unbind = bind(root, id);
  const msg = root.querySelector("#slot-msg");
  const map = createMap(root.querySelector("#map"), models, { onPick: pick });

  function refresh() {
    const { pair } = caseState(id);
    for (const k of ["ch1", "ch2"]) {
      const v = root.querySelector(`[data-slot=${k}] .slot__val`);
      v.textContent = pair[k] || "empty";
      v.classList.toggle("is-empty", !pair[k]);
    }
    root.querySelectorAll(".region").forEach(b => {
      const r = b.dataset.region;
      const ch = pair.ch1 === r ? "ch1" : pair.ch2 === r ? "ch2" : "";
      b.setAttribute("aria-pressed", String(!!ch));
      b.dataset.ch = ch;
    });
    root.querySelector("[data-act=swap]").disabled = !(pair.ch1 || pair.ch2);
    map.setPair(pair);
    root.querySelector(".slots__go").innerHTML = pair.ch1 && pair.ch2
      ? `<a class="btn btn--primary btn--lg" href="${href(id, 6)}">Show results</a>` : "";
  }

  function pick(r) {
    msg.textContent = "";
    updateCase(id, s => {
      if (s.pair.ch1 === r) s.pair.ch1 = null;
      else if (s.pair.ch2 === r) s.pair.ch2 = null;
      else if (!s.pair.ch1) s.pair.ch1 = r;
      else if (!s.pair.ch2) s.pair.ch2 = r;
      else msg.textContent = "Both channels are full. Click a chosen region to remove it first.";
    });
    refresh();
  }

  const onClick = e => {
    const b = e.target.closest(".region");
    if (b) { pick(b.dataset.region); return; }
    if (e.target.closest("[data-act=swap]")) {
      updateCase(id, s => { s.pair = { ch1: s.pair.ch2, ch2: s.pair.ch1 }; });
      refresh();
    }
  };
  root.addEventListener("click", onClick);
  refresh();

  return () => { unbind(); root.removeEventListener("click", onClick); };
}

// "Choose a new pair": a fresh map, predictions cleared (they belong to a pair).
// Observation, interpretation, verdicts and the claim are kept.
export function newPair(caseId) {
  updateCase(caseId, s => { s.pair = { ch1: null, ch2: null }; s.predictions = {}; });
  go(caseId, 5);
}
