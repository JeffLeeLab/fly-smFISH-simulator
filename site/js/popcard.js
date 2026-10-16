// A help card on a trigger (step 6's "How two-colour smFISH works", step 7's probe map): hovering
// or keyboard focus opens it, a click (or Enter) keeps it open, and Esc, its close button or a
// click elsewhere hides it. Fixed to the viewport, under its trigger or, when there is more room,
// above it; kept inside the workbench (clear of the notebook tab) and no further left than the
// main column, with its arrow on the trigger.
//
// Markup: wrap > .popcard__trigger + .popcard (with a .popcard__close inside).
// onOpen runs before every opening, so a card can draw its contents lazily.

export function popCard(wrap, { onOpen = () => {} } = {}) {
  const btn = wrap.querySelector(".popcard__trigger"), card = wrap.querySelector(".popcard");
  let pinned = false, timer = null, quiet = false;
  const refocus = () => { quiet = true; btn.focus(); quiet = false; };   // back on the trigger, without reopening
  const place = () => {
    const b = btn.getBoundingClientRect();
    const bench = wrap.closest(".bench");
    const pad = bench ? getComputedStyle(bench) : null;
    const box = bench?.getBoundingClientRect();
    const right = bench ? box.right - parseFloat(pad.paddingRight) : window.innerWidth - 16;
    const minLeft = wrap.closest(".bench__main")?.getBoundingClientRect().left
      ?? (bench ? box.left + parseFloat(pad.paddingLeft) : 16);
    card.style.maxHeight = "";
    const w = card.offsetWidth, h = card.offsetHeight;
    const below = window.innerHeight - b.bottom - 26, above = b.top - 26;
    const up = h > below && above > below;
    const left = Math.max(minLeft, Math.min(right - w, b.left));
    card.dataset.side = up ? "above" : "below";
    card.style.left = `${left}px`;
    card.style.top = `${up ? Math.max(16, b.top - 10 - Math.min(h, above)) : b.bottom + 10}px`;
    card.style.maxHeight = `${up ? above : below}px`;
    card.style.setProperty("--arrow", `${Math.max(b.left, left) + Math.min(b.width / 2, 18) - left}px`);
  };
  const open = () => {
    clearTimeout(timer);
    if (!card.hidden) return;
    card.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    onOpen(card);
    place();
  };
  const close = () => {
    clearTimeout(timer);
    card.hidden = true;
    pinned = false;
    btn.setAttribute("aria-expanded", "false");
  };
  const later = (fn, ms) => { clearTimeout(timer); timer = setTimeout(fn, ms); };

  // hover (mouse only): a short delay each way, so passing over the trigger doesn't flash it and
  // the pointer can cross the gap into the card
  wrap.addEventListener("pointerenter", e => { if (e.pointerType === "mouse" && !pinned) later(open, 120); });
  wrap.addEventListener("pointerleave", e => { if (e.pointerType === "mouse" && !pinned) later(close, 220); });
  // keyboard focus (not a click's): the same, and leaving the trigger and card closes it
  btn.addEventListener("focus", () => { if (!quiet && !pinned && btn.matches(":focus-visible")) later(open, 120); });
  wrap.addEventListener("focusout", e => { if (!pinned && !wrap.contains(e.relatedTarget)) later(close, 220); });
  btn.addEventListener("click", () => {
    if (pinned) close();
    else { open(); pinned = true; }
  });
  wrap.querySelector(".popcard__close").addEventListener("click", () => { close(); refocus(); });
  const onDoc = e => { if (!card.hidden && !wrap.contains(e.target) && !e.target.closest?.(".gl-tip")) close(); };
  const onKey = e => {
    if (e.key === "Escape" && !card.hidden) { const back = card.contains(document.activeElement); close(); if (back) refocus(); }
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
