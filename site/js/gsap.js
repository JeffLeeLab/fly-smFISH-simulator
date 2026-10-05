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
