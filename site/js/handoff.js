// A shared element handed from one view to the next (the landing station → the assay stage):
// the outgoing view records where the element was on screen, and the incoming view grows its
// own element from there (a Flip across the route change).

let pending = null;

export function handOff(key, el) {
  pending = { key, rect: el.getBoundingClientRect(), at: performance.now() };
}

export function takeHandOff(key) {
  const p = pending;
  pending = null;
  return p && p.key === key && performance.now() - p.at < 2500 ? p.rect : null;
}

// FLIP from a recorded rect to the element's place now: uniform scale by width, top-left pinned.
export function growFrom(gsap, el, rect, duration = 0.8) {
  const now = el.getBoundingClientRect();
  if (!now.width) return null;
  return gsap.fromTo(el,
    { x: rect.left - now.left, y: rect.top - now.top, scale: rect.width / now.width, transformOrigin: "0 0" },
    { x: 0, y: 0, scale: 1, duration, ease: "power2.inOut", clearProps: "transform" });
}
