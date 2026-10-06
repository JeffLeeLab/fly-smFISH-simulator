// A simplified frontal schematic of the adult fly brain, in µm with the origin at the centre of
// the head (after the schematic in the reference pack, p. 3: central brain, optic lobes with the
// lobula complex, the oesophageal foramen and the calyces). Used by the descent (step 2).
//
// The s-LNvs sit at the medial edge of the medulla, on the viewer's left, and send their axons
// up and medially to the dorsal terminals. NEURON_AT places the viewer's geometry (its own µm
// coordinates) in this frame, so the descent ends on exactly the neurons the viewer shows.

export const NEURON_AT = { x: -228, y: -85 };   // geometry µm + this = brain µm

const ellipse = (cx, cy, rx, ry) =>
  `M${cx - rx},${cy} A${rx},${ry} 0 1,0 ${cx + rx},${cy} A${rx},${ry} 0 1,0 ${cx - rx},${cy} Z`;

const centralBrain = `
  M0,-122 C45,-150 125,-158 170,-128 C210,-100 214,-48 200,-8 C190,30 196,80 176,112
  C150,146 80,152 0,146 C-80,152 -150,146 -176,112 C-196,80 -190,30 -200,-8
  C-214,-48 -210,-100 -170,-128 C-125,-158 -45,-150 0,-122 Z`;

const calyx = s => `M${s * 70},-88 C${s * 80},-112 ${s * 118},-114 ${s * 124},-92 C${s * 128},-78 ${s * 112},-70 ${s * 98},-76`;

// [d, kind]: kind "line" for outlines, "dash" for inner structures
export const BRAIN = [
  [centralBrain, "line"],
  [ellipse(-258, 15, 85, 132), "line"],
  [ellipse(258, 15, 85, 132), "line"],
  [ellipse(-222, 40, 34, 72), "dash"],
  [ellipse(222, 40, 34, 72), "dash"],
  [ellipse(0, 45, 20, 38), "line"],
  [calyx(-1), "dash"],
  [calyx(1), "dash"],
];

export const BRAIN_BOX = [-343, -158, 343, 152];
