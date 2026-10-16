// The story camera for timed SVG scenes (step 4), in the step 2 descent's language: the camera is
// the SVG viewBox, a pure function of story time, moving between stops with log-height
// interpolation so a zoom feels even; labels sit in screen space above the drawing, so their text
// keeps one size while the camera moves. (The descent keeps its own copy; it is scroll-driven.)

export const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

// GSAP's eases, written out so the scene is pure arithmetic of t
export const ease = {
  lin: t => t,
  io1: t => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) ** 2),        // power1.inOut
  io2: t => (t < 0.5 ? 4 * t ** 3 : 1 - 4 * (1 - t) ** 3),       // power2.inOut
  out2: t => 1 - (1 - t) ** 3,                                   // power2.out
  smoother: t => t * t * t * (t * (t * 6 - 15) + 10),            // smootherstep
};

// 0 → 1 over `dur` seconds from `at`
export const ramp = (t, at, dur, e = ease.lin) => e(clamp01((t - at) / dur));

// an opacity window: in over a–b, out over c–d
export const win = (t, a, b, c, d) => Math.min(clamp01((t - a) / (b - a)), c == null ? 1 : 1 - clamp01((t - c) / (d - c)));

// The camera at t. A stop is [cx, cy, height] in world units, or a function of t returning one (a
// stop that follows something). `moves` are [t0, t1, from, to, ease], in order; between moves the
// camera holds the stop it last reached.
export function camTrack(start, moves) {
  return t => {
    let from = start, to = start, k = 1, e = ease.lin;
    for (const [t0, t1, a, b, ez] of moves) {
      if (t < t0) break;
      from = a; to = b; e = ez || ease.lin; k = clamp01((t - t0) / (t1 - t0));
    }
    const A = typeof from === "function" ? from(t) : from, B = typeof to === "function" ? to(t) : to;
    const u = e(k);
    if (u >= 1) return { cx: B[0], cy: B[1], h: B[2] };
    if (u <= 0) return { cx: A[0], cy: A[1], h: A[2] };
    return { cx: A[0] + (B[0] - A[0]) * u, cy: A[1] + (B[1] - A[1]) * u, h: Math.exp(Math.log(A[2]) + Math.log(B[2] / A[2]) * u) };
  };
}

// Points the SVG at `cam`. Strokes that keep one width on screen read --zw (the camera's height
// over the rest height). At rest the viewBox is the literal `rest.viewBox` and --zw is removed,
// so the end frame is exactly the drawing as written.
export function applyCam(svg, cam, rest) {
  const [rx, ry, rh] = rest.stop;
  if (cam.cx === rx && cam.cy === ry && cam.h === rh) {
    if (svg.getAttribute("viewBox") !== rest.viewBox) svg.setAttribute("viewBox", rest.viewBox);
    svg.style.removeProperty("--zw");
    return true;
  }
  const w = cam.h * rest.aspect;
  svg.setAttribute("viewBox", `${(cam.cx - w / 2).toFixed(3)} ${(cam.cy - cam.h / 2).toFixed(3)} ${w.toFixed(3)} ${cam.h.toFixed(3)}`);
  svg.style.setProperty("--zw", (cam.h / rh).toFixed(4));
  return false;
}

// world → screen px inside a box `width` px wide showing `cam` (the box has the camera's aspect)
export function screenMap(cam, width, aspect) {
  const w = cam.h * aspect, s = width / w, x0 = cam.cx - w / 2, y0 = cam.cy - cam.h / 2;
  return ([x, y]) => [(x - x0) * s, (y - y0) * s];
}

// A callout in screen space: the text of size [w, h] at point [x, y] (`side`: "left" ends the text
// there, "right" starts it there, "above"/"below" centre it over or under the point), and a
// hairline drawn `k` of the way from the text to the anchor [ax, ay], where a dot of radius `r`
// lands as the line arrives (the end frame's callout style). Returns what to set; positions use
// transform, so moving a label never lays the page out again.
export function pointer([w, h], side, [x, y], anchor, k, r = 1.5) {
  const lx = side === "left" ? x - w : side === "right" ? x : x - w / 2;
  const ly = side === "above" ? y - h : side === "below" ? y : y - h / 2;
  const out = { transform: `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px)`, d: "", dot: 0, at: anchor };
  if (!anchor || k <= 0) return out;
  const sx = side === "left" ? x + 5 : side === "right" ? x - 5 : x;
  const sy = side === "above" ? y + 3 : side === "below" ? y - 3 : y;
  const ex = sx + (anchor[0] - sx) * k, ey = sy + (anchor[1] - sy) * k;
  out.d = `M${sx.toFixed(1)},${sy.toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)}`;
  out.dot = r * clamp01((k - 0.7) / 0.3);
  return out;
}
