// Step 6, probe design: a workbench like steps 3, 5 and 7. Head: the gene card (fly gene ↔ human
// orthologue, with links, beside its function). Main: one line on what smFISH shows, then the
// transcript map with its probe track (each probe region is a keyboard button). Side pane, read
// top to bottom: the pair (smFISH 1 over smFISH 2, the next slot to fill outlined in its ink),
// Swap, Show results, then optional predictions.
// The only checks are formal: two regions, and they must differ. No hints about traps or decoys.

import { MODES, caseProse } from "../content.js";
import { caseState, updateCase } from "../store.js";
import { bind } from "../forms.js";
import { href, go } from "../router.js";
import { transcripts, regionLabel } from "../data.js";
import { createMap } from "../map.js";
import { term } from "../glossary.js";
import { popCard } from "../popcard.js";
import { OUT_ICON, Q_ICON, SWAP_ICON, X_ICON } from "../icons.js";

// "How two-colour smFISH works": a made-up gene with regions A and B, never the case gene.
// A help card under the map's legend (popcard.js).
const HOWTO = `
  <span class="howto">
    <button type="button" class="howto__btn popcard__trigger" aria-expanded="false" aria-controls="howto-card">${Q_ICON}How two-colour smFISH works</button>
    <div class="popcard howto__card" id="howto-card" role="group" aria-labelledby="howto-h" hidden>
      <div class="popcard__head"><h2 class="popcard__title" id="howto-h">How two-colour smFISH works</h2>
        <button type="button" class="popcard__close" aria-label="Close">${X_ICON}</button></div>
      <div class="howto__body">
        <svg viewBox="0 0 340 200" role="img" aria-label="A made-up gene with region A on exon 2 and region B on exon 3. A molecule with both regions shows a white spot, one with only A a green spot, one with only B a magenta spot; nascent RNA at the transcription site makes one bright nuclear spot.">
          <text x="0" y="12">made-up gene</text>
          <line x1="10" x2="330" y1="40" y2="40" stroke="var(--map-intron)" stroke-width="1.5"/>
          <rect x="10" y="32" width="50" height="16" fill="var(--map-cds)"/>
          <rect x="120" y="32" width="70" height="16" fill="var(--map-cds)"/>
          <rect x="250" y="32" width="70" height="16" fill="var(--map-cds)"/>
          <path d="M122,26 L122,21 L188,21 L188,26" fill="none" stroke="var(--ch1-ink)" stroke-width="2.5"/><text x="155" y="16" text-anchor="middle" style="fill:var(--ch1-text);font-weight:600">A</text>
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
          <li><b>Transcription sites:</b> many ${term("nascent", "nascent RNAs")} on one gene make one bright spot in the nucleus. Probes against an intron mostly label nascent RNA, because introns are usually removed from mature mRNA. If an intron is kept in the mRNA, its probe also labels molecules away from the transcription site.</li>
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
    <div class="bench">
      <header class="target" aria-labelledby="target-name">
        <p class="t-label">Experimental design · Step 6</p>
        <div class="gene">
          <div class="gene__pair">
            <h1 class="gene__names" id="target-name"><i>${esc(t.gene)}</i><span class="gene__arrow" aria-label="corresponds to">↔</span><span>${esc(t.orthologue)}</span></h1>
            <span class="gene__meta">Fly gene · <a href="${t.flybase}" target="_blank" rel="noopener">FlyBase${OUT_ICON}</a></span><span></span><span class="gene__meta">Human ${term("orthologue", "orthologue")} · <a href="${t.orthologueLink}" target="_blank" rel="noopener">NCBI Gene${OUT_ICON}</a></span>
          </div>
          <p class="gene__about t-ui-lg">${esc(t.function)}</p>
        </div>
      </header>
      <section class="bench__main probe-main" aria-label="Transcript map">
        <p class="probe-lede">${term("smfish", "smFISH")} shows each ${caseProse(ctx.case, t.gene)} mRNA molecule where it is in the neuron. With two probes on different regions, you can tell which parts each molecule carries. At first, it’s most informative to design probes against a ${term("constitutive", "constitutive")} exon and a constitutive intron.</p>
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
    : `<p class="predict__lede">Shortlist modes in <a href="${href(id, 5)}">step 5</a> to write predictions for them here.</p>`;

  const unbind = bind(root, id);
  const msg = root.querySelector("#slot-msg");
  const byId = new Map(models.probe_regions.map(r => [r.id, r]));
  const map = createMap(root.querySelector("#map"), models, { onPick: pick, fitTo: root.querySelector(".probe-main"), note: t.mapNote });

  function refresh() {
    const { pair } = caseState(id);
    const next = !pair.ch1 ? "ch1" : !pair.ch2 ? "ch2" : null;
    for (const k of ["ch1", "ch2"]) {
      const slot = root.querySelector(`[data-slot=${k}]`), r = byId.get(pair[k]);
      slot.classList.toggle("is-filled", !!r);
      slot.classList.toggle("is-next", k === next);
      slot.querySelector(".pslot__id").textContent = r ? regionLabel(r.id) : "";
      slot.querySelector(".pslot__len").textContent = r ? `${nt(r.length_nt)} nt` : "Click a region on the map";
      slot.querySelector(".pslot__clear").hidden = !r;
    }
    root.querySelector("[data-act=swap]").disabled = !(pair.ch1 || pair.ch2);
    map.setPair(pair);
    root.querySelector(".pair__go").innerHTML = pair.ch1 && pair.ch2
      ? `<a class="btn btn--primary btn--lg pair__results" href="${href(id, 7)}">Show results</a>`
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
  const offHowto = popCard(root.querySelector(".howto"));

  return () => { unbind(); offHowto(); map.destroy(); root.removeEventListener("click", onClick); };
}

// "Try another pair" (steps 7 and 8): a fresh map, predictions cleared (they belong to a pair).
// Observation, interpretation, verdicts and the claim are kept.
export function newPair(caseId) {
  updateCase(caseId, s => { s.pair = { ch1: null, ch2: null }; s.predictions = {}; });
  go(caseId, 6);
}
