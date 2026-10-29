// The story narration (the step 1 assays, step 4): two lines that roll up, as in broadcast
// captions. The newest caption wipes in on the lower line; the one before it moves up, shrinks a
// little and turns quiet, so a slower reader can finish it while the next one arrives. Later
// captions are never shown early.
//
// The upper line is always the caption before the current one in `order`, so frozen (`?t=`),
// skipped and replayed states are a function of story time, like the rest of the page. Only a
// single step forward in `order` animates; any other change is set directly.
//
// Captions are trusted constant HTML, so they can hold glossary terms (glossary.js). The upper line
// is hidden from screen readers (they have heard it), so its terms leave the tab order.

export function rollCaption(gsap, box, captions, order, animate) {
  box.innerHTML = `<span class="assay__prev" aria-hidden="true"></span><span class="assay__cap"></span>`;
  const prevEl = box.querySelector(".assay__prev"), capEl = box.querySelector(".assay__cap");
  let key = "";
  return next => {
    if (next === key) return;
    const i = order.indexOf(next);
    const before = i > 0 ? order[i - 1] : "";
    const rolls = animate && !!next && !!key && before === key;
    const from = rolls ? capEl.getBoundingClientRect().top : 0;
    const ink = rolls ? getComputedStyle(capEl).color : null;
    const size = rolls ? parseFloat(getComputedStyle(capEl).fontSize) : 0;
    if (rolls && prevEl.textContent) {   // the oldest line leaves upwards
      const ghost = prevEl.cloneNode(true);
      ghost.classList.add("assay__ghost");
      ghost.style.top = `${prevEl.offsetTop}px`;
      box.append(ghost);
      gsap.to(ghost, { autoAlpha: 0, y: -12, duration: 0.25, ease: "power2.out", onComplete: () => ghost.remove() });
    }
    key = next;
    gsap.killTweensOf([prevEl, capEl]);
    gsap.set([prevEl, capEl], { clearProps: "transform,transformOrigin,color,clipPath" });
    prevEl.innerHTML = next ? captions[before] ?? "" : "";
    prevEl.querySelectorAll("button").forEach(b => { b.tabIndex = -1; });
    capEl.innerHTML = next ? captions[next] : "";
    if (!next || !animate) return;
    if (rolls) {
      const dy = from - prevEl.getBoundingClientRect().top;
      const k = size / parseFloat(getComputedStyle(prevEl).fontSize);   // starts at the caption's size
      gsap.fromTo(prevEl, { y: dy, scale: k, transformOrigin: "0% 0%", color: ink },
        { y: 0, scale: 1, color: getComputedStyle(prevEl).color, duration: 0.45, ease: "power2.inOut", clearProps: "transform,transformOrigin,color" });
    }
    gsap.fromTo(capEl, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "power2.out", delay: rolls ? 0.25 : 0, clearProps: "clipPath" });
  };
}
