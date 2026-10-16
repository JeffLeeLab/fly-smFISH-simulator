// The mushroom body in the brain (the descent and the step 8 locator): where the left one sits in
// brain.js's µm, how much larger it is drawn in the whole brain, and the projection of the 30
// simulated Kenyon cells (site/data/mb/anatomy.json) as in generator/connectome_mb.project.

export const MB_AT = { x: -100, y: -34 };   // the left mushroom body's own µm + this = brain µm
export const MB_BIG = 1.35;                 // drawn larger in the whole brain (about 40% of its width)

// u: 0 (front view) → 1 (the viewer's oblique view); the animal's small turn and scale come in with it
export function projector(A) {
  const [c0, c1, c2] = A.centre;
  const { turn: mt, scale: ms, origin: [ox, oy] } = A.move;
  return u => {
    const a = (A.view.tilt * u) * Math.PI / 180, b = (A.view.turn * u) * Math.PI / 180;
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    const th = (mt * u) * Math.PI / 180, ct = Math.cos(th), st = Math.sin(th), k = 1 + (ms - 1) * u;
    return ([x, y, z]) => {
      x -= c0; y -= c1; z -= c2;
      // Ry(turn) then Rx(tilt): R = Rx @ Ry
      const x1 = cb * x + sb * z, z1 = -sb * x + cb * z;
      const y2 = ca * y - sa * z1;
      const dx = x1 - ox, dy = y2 - oy;
      return [ox + (ct * dx - st * dy) * k, oy + (st * dx + ct * dy) * k];
    };
  };
}
