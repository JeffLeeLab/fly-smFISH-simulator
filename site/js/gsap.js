// GSAP 3.15 (pinned local copy, no CDN), loaded on first use: the core, then the plugins the
// openings use. Resolves with the gsap object once the plugins are registered.

const BASE = "vendor/gsap-3.15.0/";
const PLUGINS = ["ScrollTrigger", "Flip", "DrawSVGPlugin", "MorphSVGPlugin", "MotionPathPlugin", "CustomEase"];
let ready = null;

const script = src => new Promise((ok, fail) => {
  const s = document.createElement("script");
  s.src = src;
  s.onload = ok;
  s.onerror = () => fail(new Error(`could not load ${src}`));
  document.head.append(s);
});

export function loadGsap() {
  ready ||= (async () => {
    if (!window.gsap) await script(BASE + "gsap.min.js");
    await Promise.all(PLUGINS.filter(p => !window[p]).map(p => script(`${BASE}${p}.min.js`)));
    const { gsap } = window;
    gsap.registerPlugin(...PLUGINS.map(p => window[p]));
    return gsap;
  })();
  return ready;
}

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// A descent's timeline scrubbed by the scroll position while its section is pinned (top to bottom).
// Going forward, the scroll is let through at no more than `rate` times the descent's own pace, and
// the page may run at most `lead` seconds of story ahead of what has been let through: anything
// further is held back. So a hard flick (Chrome's wheel and trackpad scroll much further per gesture)
// neither skips the descent nor leaves it playing on its own, and the page can't scroll on to the text
// below until the descent has ended. Going back is never held. The timeline follows with a short ease.
// `timeline` returns the current timeline (a resize rebuilds it). `skip` (a button) is shown while the
// descent hasn't ended; it goes straight to the end frame, then brings `next` (the Next link) into
// view and gives it focus. Returns a function that stops it all.
export function scrollScrub(gsap, section, timeline, { rate = 2, lead = 1.2, skip = null, next = null } = {}) {
  const st = window.ScrollTrigger.create({ trigger: section, start: "top top", end: "bottom bottom" });
  // the scroll's progress through the section, read from the page (st.progress can lag a jump)
  const raw = () => Math.min(1, Math.max(0, (window.scrollY - st.start) / ((st.end - st.start) || 1)));
  let q = raw();   // how far the scroll has been let through, 0..1
  // the furthest the page may scroll now
  const limit = () => {
    const tl = timeline();
    if (!tl || tl.progress() > 0.999) return Infinity;
    return st.start + Math.min(1, q + lead / tl.duration()) * (st.end - st.start);
  };
  const to = y => window.scrollTo({ top: y, behavior: "instant" });
  // wheel and trackpad: a step that would pass the limit is stopped before the page moves (pinch zoom
  // comes as a wheel with ctrlKey); keys and the scrollbar are pulled back once they have scrolled
  const onWheel = e => {
    if (e.deltaY <= 0 || e.ctrlKey) return;
    const px = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
    const max = limit();
    if (window.scrollY + px > max) { e.preventDefault(); if (window.scrollY < max) to(max); }
  };
  const onScroll = () => { const max = limit(); if (window.scrollY > max + 1) to(max); };
  const step = (time, dt) => {   // dt in ms
    const tl = timeline();
    if (!tl) return;
    const want = raw();
    q = want < q ? want : Math.min(want, q + rate * dt / 1000 / tl.duration());
    const p = tl.progress(), gap = q - p;
    if (Math.abs(gap) >= 1e-5) tl.progress(p + gap * (1 - Math.exp(-dt / 150)));   // about the 0.45 s ease this replaced
    else if (gap) tl.progress(q);
    if (skip) { const done = tl.progress() > 0.999; if (skip.hidden !== done) skip.hidden = done; }
  };
  const onSkip = () => {
    const tl = timeline();
    if (!tl) return;
    q = 1;
    tl.progress(1);
    to(st.end);
    if (!next) return;
    const r = next.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + r.bottom - window.innerHeight + 24, behavior: "smooth" });
    next.focus({ preventScroll: true });
  };
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scroll", onScroll, { passive: true });
  skip?.addEventListener("click", onSkip);
  gsap.ticker.add(step);
  return () => {
    gsap.ticker.remove(step);
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("scroll", onScroll);
    skip?.removeEventListener("click", onSkip);
    st.kill();
  };
}
