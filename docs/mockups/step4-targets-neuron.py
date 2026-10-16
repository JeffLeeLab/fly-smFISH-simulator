"""Draws the step 4 end-frame neuron (a unipolar fly neuron with its RNA stations) as SVG and splices it
into docs/mockups/step4-targets-endframe.html. Design record only (docs/storyboards/targets-step.md).

    uv run python docs/mockups/step4-targets-neuron.py docs/mockups/step4-targets-endframe.html
"""
import math
import random
import re
import sys
from pathlib import Path

HTML = Path(sys.argv[1])
F = lambda v: f"{v:.1f}".rstrip("0").rstrip(".")


def bez(c, t):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = c
    u = 1 - t
    return (u**3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t**3 * x3,
            u**3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t**3 * y3)


def dbez(c, t):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = c
    u = 1 - t
    dx = 3 * u * u * (x1 - x0) + 6 * u * t * (x2 - x1) + 3 * t * t * (x3 - x2)
    dy = 3 * u * u * (y1 - y0) + 6 * u * t * (y2 - y1) + 3 * t * t * (y3 - y2)
    n = math.hypot(dx, dy) or 1
    return dx / n, dy / n


def line_c(a, b):
    """A straight segment as a cubic."""
    return (a, (a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3),
            (a[0] + 2 * (b[0] - a[0]) / 3, a[1] + 2 * (b[1] - a[1]) / 3), b)


def tube(c, r0, r1, n=60, ease=1.0, bumps=()):
    """Closed outline of a tapered branch along cubic c, with a round tip."""
    left, right, tip = [], [], None
    for i in range(n + 1):
        t = i / n
        x, y = bez(c, t)
        tx, ty = dbez(c, t)
        r = r1 + (r0 - r1) * (1 - t) ** ease
        for tc, amp, w in bumps:
            r += amp * math.exp(-((t - tc) / w) ** 2)
        nx, ny = -ty, tx
        left.append((x + nx * r, y + ny * r))
        right.append((x - nx * r, y - ny * r))
        tip = (x, y, tx, ty, nx, ny, r)
    x, y, tx, ty, nx, ny, r = tip
    cap = [(x + r * (nx * math.cos(a) + tx * math.sin(a)), y + r * (ny * math.cos(a) + ty * math.sin(a)))
           for a in (k * math.pi / 10 for k in range(1, 10))]
    pts = left + cap + right[::-1]
    return "M" + " L".join(f"{F(px)},{F(py)}" for px, py in pts) + " Z"


def circle_d(cx, cy, r):
    return f"M{F(cx - r)},{F(cy)} a{F(r)},{F(r)} 0 1 0 {F(2 * r)},0 a{F(r)},{F(r)} 0 1 0 {F(-2 * r)},0 Z"


def offset_curve(c, k, t0=0.0, t1=1.0, n=50):
    pts = []
    for i in range(n + 1):
        t = t0 + (t1 - t0) * i / n
        x, y = bez(c, t)
        tx, ty = dbez(c, t)
        pts.append((x - ty * k, y + tx * k))
    return pts


def poly(pts):
    return "M" + " L".join(f"{F(x)},{F(y)}" for x, y in pts)


# ---------------------------------------------------------------- geometry
SOMA = (176, 160, 108)                                   # cx, cy, r
NUC = (170, 160, 58)
HILLOCK = line_c((236, 160), (424, 157))
AXON = ((410, 157), (530, 147), (660, 165), (806, 150))
GRAN_T = 0.52                                            # granule position along the axon
shapes = [circle_d(*SOMA),
          tube(HILLOCK, 36, 10.5, ease=2.4),
          tube(AXON, 10.5, 8.5, bumps=[(GRAN_T, 9, 0.045)])]

# dendrites branch off the neurite (fly neurons are unipolar)
drng = random.Random(11)


def clen(c):
    pts = [bez(c, i / 20) for i in range(21)]
    return sum(math.dist(a, b) for a, b in zip(pts, pts[1:]))


def branch(c, r0, r1, depth, side=1):
    shapes.append(tube(c, r0, r1, n=36, ease=1.3))
    if depth == 0:
        return
    L = clen(c)
    for k, (t, ang, frac) in enumerate([(.36, 34, .52), (.68, -30, .4)]):
        x, y = bez(c, t)
        tx, ty = dbez(c, t)
        a = math.radians((ang + drng.uniform(-6, 6)) * side)
        dx, dy = tx * math.cos(a) - ty * math.sin(a), tx * math.sin(a) + ty * math.cos(a)
        ln = L * frac
        bend = drng.uniform(-.18, .18)
        end = (x + dx * ln, y + dy * ln)
        c1 = (x + dx * ln * .35, y + dy * ln * .35)
        c2 = (x + dx * ln * .7 - dy * ln * bend, y + dy * ln * .7 + dx * ln * bend)
        rt = r1 + (r0 - r1) * (1 - t) ** 1.3
        branch(((x, y), c1, c2, end), rt * .62, .35, depth - 1, -side if k else side)


branch(((438, 165), (433, 192), (412, 220), (392, 244)), 4.4, .4, 2, 1)
branch(((488, 161), (498, 186), (524, 208), (556, 232)), 4.0, .4, 2, -1)
branch(((462, 151), (461, 138), (456, 126), (450, 112)), 2.8, .35, 1, 1)

# terminal arbor: beaded branches ending in boutons
T1 = ((804, 147), (834, 128), (862, 96), (896, 76))
T2 = ((806, 150), (846, 151), (880, 146), (910, 142))
T3 = ((804, 153), (834, 172), (860, 204), (892, 226))
term = [(T1, 5.6, 3.4), (T2, 6.2, 5.2), (T3, 5.6, 3.4)]
tw = []
for base, t, end in [(T1, .56, (936, 104)), (T3, .62, (920, 250))]:
    p = bez(base, t)
    tw.append(((p, ((2 * p[0] + end[0]) / 3, (2 * p[1] + end[1]) / 3 - 2), ((p[0] + 2 * end[0]) / 3, (p[1] + 2 * end[1]) / 3), end), 2.8, 2.1))
for c, r0, r1 in term + tw:
    shapes.append(tube(c, r0, r1, n=40))
BIG = (928, 141, 21)
beads = [(bez(T1, .42), 6.6), (bez(T1, 1), 8.6), (bez(T3, .44), 6.6), (bez(T3, 1), 8.6),
         (bez(tw[0][0], 1), 6.2), (bez(tw[1][0], 1), 6.2), ((BIG[0], BIG[1]), BIG[2])]
for (x, y), r in beads:
    shapes.append(circle_d(x, y, r))

clip = "".join(f'<path d="{d}"/>' for d in shapes)
paths = "".join(f'<path d="{d}"/>' for d in shapes)

# microtubules: three fine lines down the neurite and axon, fanning into the cell body
mt = []
for k in (-4.6, 0, 4.6):
    pts = offset_curve(HILLOCK, k * 1.3, .3, 1, 20)[:-1] + offset_curve(AXON, k, .02, 1, 70)
    pts += [(pts[-1][0] + 14, pts[-1][1] + k * .25)]
    mt.append(pts)
fan = [((262, 166), (240, 206), (204, 230), (156, 232)),
       ((266, 170), (250, 214), (222, 240), (186, 248)),
       ((262, 154), (250, 140), (242, 130), (236, 122))]
mt_svg = "".join(f'<path d="{poly(p)}"/>' for p in mt) + "".join(
    f'<path d="{poly([bez(c, i / 30) for i in range(31)])}"/>' for c in fan)
LOWER_MT = mt[2]

# nucleus: double envelope with three pores
def env(r, gaps, w=5.5):
    cx, cy = NUC[:2]
    out = []
    edges = sorted(gaps)
    for i, g in enumerate(edges):
        a0 = math.radians(g + w)
        a1 = math.radians(edges[(i + 1) % len(edges)] - w + (360 if i + 1 == len(edges) else 0))
        large = 1 if (a1 - a0) % (2 * math.pi) > math.pi else 0
        x0, y0 = cx + r * math.cos(a0), cy + r * math.sin(a0)
        x1, y1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
        out.append(f"M{F(x0)},{F(y0)} A{r},{r} 0 {large} 1 {F(x1)},{F(y1)}")
    return " ".join(out)


GAPS = [0, 118, 232]
walls = []
for g in GAPS:
    for s in (-5.5, 5.5):
        a = math.radians(g + s)
        walls.append(f"M{F(NUC[0] + 58 * math.cos(a))},{F(NUC[1] + 58 * math.sin(a))} L{F(NUC[0] + 54.5 * math.cos(a))},{F(NUC[1] + 54.5 * math.sin(a))}")

rng = random.Random(43)
stip = []
keep_out = [(178, 116, 24), (214, 160, 16), (170, 203, 17), (146, 178, 13)]
while len(stip) < 70:
    a, r = rng.random() * 2 * math.pi, 50 * math.sqrt(rng.random())
    x, y = NUC[0] + r * math.cos(a), NUC[1] + r * math.sin(a)
    if any(math.hypot(x - kx, y - ky) < kr for kx, ky, kr in keep_out):
        continue
    stip.append(f'<circle cx="{F(x)}" cy="{F(y)}" r="{rng.uniform(.5, .85):.2f}"/>')

# ---------------------------------------------------------------- stations
gx, gy = bez(AXON, GRAN_T)
gy -= 5
mlx = min(LOWER_MT, key=lambda p: abs(p[0] - gx))[1]   # the lower microtubule under the granule
bx, by = BIG[:2]


def leader(x0, y0, x1, y1):
    return f'<path class="lead" d="M{F(x0)},{F(y0)} L{F(x1)},{F(y1)}"/><circle cx="{F(x1)}" cy="{F(y1)}" r="1.5" fill="var(--text-3)"/>'


svg = f'''<svg viewBox="0 6 984 270" role="img" aria-label="Schematic. A fly neuron drawn left to right: a round cell body with its nucleus, one neurite with dendrites branching from it, an axon and a branched, beaded terminal arbor. A close-up shows TDP-43 clasping an RNA with a UG-rich run, while another RNA without one stays bare. In the nucleus, TDP-43 sits on the intron of a pre-mRNA being spliced; the finished mRNA leaves through a nuclear pore. In the cell body, a ribosome translates an mRNA and another copy is broken down. In the axon, a granule of mRNAs and TDP-43 is carried along a microtubule; in a terminal, a ribosome makes protein.">
  <defs>
    <filter id="ink" x="-3%" y="-3%" width="106%" height="106%">
      <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="7" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="rim" x="0" y="0" width="100%" height="100%">
      <feMorphology in="SourceAlpha" operator="erode" radius="2.5" result="e"/><feGaussianBlur in="e" stdDeviation="3.2" result="eb"/>
      <feComposite in="SourceAlpha" in2="eb" operator="out" result="ring"/>
      <feFlood style="flood-color: var(--mem)" flood-opacity=".26"/><feComposite in2="ring" operator="in"/>
    </filter>
    <linearGradient id="wash" gradientUnits="userSpaceOnUse" x1="0" y1="52" x2="0" y2="268">
      <stop offset="0" style="stop-color: var(--nw-1)"/><stop offset="1" style="stop-color: var(--nw-2)"/>
    </linearGradient>
    <radialGradient id="nucwash" cx=".42" cy=".38" r=".7">
      <stop offset="0" style="stop-color: var(--nuc-1)"/><stop offset="1" style="stop-color: var(--nuc-2)"/>
    </radialGradient>
    <!-- TDP-43: N-terminal knob, two RRM lobes clasping the RNA just below y = 0, loose C-terminal tail -->
    <g id="tdp">
      <path d="M8.6,.4 c1.8,-2.6 3.6,2.6 5.4,0 s3.6,2.6 5.4,0" fill="none" stroke="var(--tdp)" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="-6.6" cy="-1.2" r="2.3" fill="var(--tdp)" stroke="var(--ink)" stroke-width=".55"/>
      <ellipse cx="-1.5" cy="0" rx="4" ry="3.6" fill="var(--tdp)" stroke="var(--ink)" stroke-width=".55"/>
      <ellipse cx="5" cy="0" rx="4" ry="3.6" fill="var(--tdp)" stroke="var(--ink)" stroke-width=".55"/>
    </g>
    <g id="tdp-mut"><use href="#tdp"/><path d="M12.6,-3.4 L14.8,3.4" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/></g>
    <g id="ribo">
      <path d="M-8.6,-3.2 C-8.8,-9.6 -3.4,-12 0,-11.6 C4.6,-12 8.8,-9 8.6,-3.2 C8.4,-.8 -8.4,-.8 -8.6,-3.2 Z" fill="var(--wash-a)" stroke="var(--ink)" stroke-width=".8"/>
      <path d="M-7,2.6 C-7,.6 7,.6 7,2.6 C7,5.6 -7,5.6 -7,2.6 Z" fill="var(--wash-a)" stroke="var(--ink)" stroke-width=".8"/>
    </g>
  </defs>

  <!-- the neuron: weighted ink outline (shadow side heavier), wash, pooled edge -->
  <g filter="url(#ink)">
    <g fill="none" stroke="var(--mem)" stroke-width="2.3" stroke-linejoin="round" transform="translate(.7,.9)">{paths}</g>
    <g fill="none" stroke="var(--mem)" stroke-width="1.8" stroke-linejoin="round">{paths}</g>
  </g>
  <g fill="url(#wash)">{paths}</g>
  <g filter="url(#rim)" fill="#000">{paths}</g>
  <g fill="none" stroke="var(--mem)" stroke-width=".7" opacity=".55" stroke-linecap="round">{mt_svg}</g>

  <!-- nucleus -->
  <circle cx="{NUC[0]}" cy="{NUC[1]}" r="57" fill="url(#nucwash)"/>
  <circle cx="146" cy="178" r="10" fill="var(--nuc-2)" opacity=".9"/>
  <g fill="var(--ink)" opacity=".22">{"".join(stip)}</g>
  <g fill="none" stroke="var(--text-3)" stroke-width=".9" filter="url(#ink)"><path d="{env(58, GAPS)}"/><path d="{env(54.5, GAPS)}"/><path d="{" ".join(walls)}"/></g>

  <!-- splicing: pre-mRNA with TDP-43 on the intron as it loops out -->
  <g filter="url(#ink)">
    <circle cx="140" cy="130" r="1.8" fill="var(--ink)"/>
    <path d="M140,130 L161,130" fill="none" stroke="var(--ink)" stroke-width="3.2"/>
    <path d="M161,130 C161,106 195,104 195,130" fill="none" stroke="var(--ink)" stroke-width="1.1"/>
    <path d="M195,130 L212,130" fill="none" stroke="var(--ink)" stroke-width="3.2"/>
  </g>
  <use href="#tdp" transform="translate(175,108.4) scale(.72)"/>

  <!-- most TDP-43 is nuclear -->
  <use href="#tdp" transform="translate(124,150) scale(.66) rotate(-18)"/>
  <use href="#tdp" transform="translate(156,148) scale(.6) rotate(12)"/>
  <use href="#tdp" transform="translate(202,184) scale(.66) rotate(-28)"/>
  <use href="#tdp" transform="translate(134,180) scale(.6) rotate(30)"/>

  <!-- export: the finished mRNA through the pore facing the neurite -->
  <g filter="url(#ink)"><path d="M190,160 L278,159" fill="none" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round"/><circle cx="190" cy="160" r="1.8" fill="var(--ink)"/></g>
  <use href="#tdp" transform="translate(206,157) scale(.62)"/>

  <!-- translation in the cell body -->
  <g filter="url(#ink)"><path d="M218,226 C232,220 250,216 270,214" fill="none" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round"/></g>
  <use href="#ribo" transform="translate(244,218.5) rotate(-12) scale(.9)"/>
  <g fill="var(--wash-b)" stroke="var(--ink)" stroke-width=".6">
    <circle cx="241" cy="205.5" r="1.9"/><circle cx="236.6" cy="201.6" r="1.9"/><circle cx="231.2" cy="199.4" r="1.9"/><circle cx="225.6" cy="199" r="1.9"/>
  </g>

  <!-- decay: an older copy shortening into fragments -->
  <g filter="url(#ink)"><circle cx="96" cy="200" r="1.8" fill="var(--ink)"/><path d="M96,200 C104,208 112,214 120,217" fill="none" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round"/></g>
  <g fill="var(--ink)"><circle cx="124.6" cy="219.2" r="1.2"/><circle cx="129.4" cy="221.4" r="1.1" opacity=".7"/><circle cx="134" cy="222.4" r="1" opacity=".45"/><circle cx="138.8" cy="224.2" r=".9" opacity=".25"/></g>

  <!-- RNA granule carried along the lower microtubule -->
  <circle cx="{F(gx)}" cy="{F(gy)}" r="10.5" fill="var(--wash-b)" fill-opacity=".85" stroke="var(--text-3)" stroke-width=".8" stroke-dasharray="1.6 1.6"/>
  <path d="M{F(gx - 7)},{F(gy - 3)} c2.4,-2.4 4.8,2.4 7.2,0 s4.8,2.4 6.4,0 M{F(gx - 7)},{F(gy + 4)} c2.4,-2.4 4.8,2.4 7.2,0 s4,2 5.4,0" fill="none" stroke="var(--ink)" stroke-width="1"/>
  <use href="#tdp" transform="translate({F(gx - 3)},{F(gy - 6.5)}) scale(.36)"/>
  <use href="#tdp" transform="translate({F(gx + 1)},{F(gy + 7.5)}) scale(.36)"/>
  <path d="M{F(gx)},{F(gy + 10.5)} L{F(gx)},{F(mlx - 2.6)} M{F(gx - 3)},{F(mlx - 2.6)} L{F(gx + 3)},{F(mlx - 2.6)} M{F(gx - 3)},{F(mlx - 2.6)} L{F(gx - 4.6)},{F(mlx)} M{F(gx + 3)},{F(mlx - 2.6)} L{F(gx + 4.6)},{F(mlx)}" fill="none" stroke="var(--ink)" stroke-width=".9" stroke-linecap="round"/>
  <g fill="none" stroke="var(--text-3)" stroke-width=".8" opacity=".7"><path d="M{F(gx - 16)},{F(gy - 5)} q-3,5 0,10"/><path d="M{F(gx - 22)},{F(gy - 3)} q-2,3.5 0,7"/></g>
  <path d="M{F(gx - 14)},{F(mlx + 22)} L{F(gx + 50)},{F(mlx + 22)} M{F(gx + 44)},{F(mlx + 18)} L{F(gx + 51)},{F(mlx + 22)} L{F(gx + 44)},{F(mlx + 26)}" fill="none" stroke="var(--ink)" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"/>

  <!-- local translation in the large bouton -->
  <g filter="url(#ink)"><path d="M{bx - 15},{by + 6} C{bx - 6},{by + 2} {bx + 6},{by + 2} {bx + 15},{by + 6}" fill="none" stroke="var(--ink)" stroke-width="1.3" stroke-linecap="round"/></g>
  <use href="#ribo" transform="translate({bx},{by + 3.4}) scale(.82)"/>
  <g fill="var(--wash-b)" stroke="var(--ink)" stroke-width=".55"><circle cx="{bx + 3}" cy="{by - 8}" r="1.7"/><circle cx="{bx + 6.8}" cy="{by - 11.2}" r="1.7"/><circle cx="{bx + 11}" cy="{by - 12.6}" r="1.7"/></g>
  <use href="#tdp" transform="translate({bx - 12},{by + 11}) scale(.4)"/>

  <!-- close-up of TDP-43 binding, with magnifier lines from the splicing site -->
  <circle cx="179" cy="112" r="15" fill="none" stroke="var(--text-2)" stroke-width=".8"/>
  <path class="lead" d="M189.6,101.4 L332,14 M193.8,114.6 L332,94"/>
  <rect x="332" y="14" width="268" height="80" rx="3" fill="var(--field)" stroke="var(--border-strong)" stroke-width="1"/>
  <g filter="url(#ink)"><path d="M420,40 L588,40 M420,72 L588,72" fill="none" stroke="var(--ink)" stroke-width="1.4"/><circle cx="420" cy="40" r="1.8" fill="var(--ink)"/><circle cx="420" cy="72" r="1.8" fill="var(--ink)"/></g>
  <use href="#tdp" transform="translate(484,36.6)"/>
  <use href="#tdp" transform="translate(518,36.6)"/>

  <!-- live text: never filtered -->
  <text class="seq" x="504" y="55" text-anchor="middle">…UGUGUGUG…</text>
  <text class="seq" x="504" y="87" text-anchor="middle">…ACGAUCCA…</text>
  <text class="st" x="344" y="44">target RNA</text>
  <text class="st" x="344" y="76">other RNA</text>

  <text class="st" x="160" y="100" text-anchor="end">splicing</text>
  {leader(290, 190, 264, 162)}<text class="st" x="294" y="198">nuclear export</text>
  {leader(266, 248, 252, 222)}<text class="st" x="270" y="260">translation</text>
  {leader(96, 244, 112, 214)}<text class="st" x="92" y="258" text-anchor="middle">decay</text>
  <text class="st" x="{F(gx)}" y="{F(gy - 22)}" text-anchor="middle">RNA granule</text>
  <text class="st" x="{F(gx + 18)}" y="{F(mlx + 40)}" text-anchor="middle">transport</text>
  {leader(942, 184, 930, 166)}<text class="st" x="968" y="198" text-anchor="end">local translation</text>

  <text class="cmp" x="{NUC[0]}" y="207" text-anchor="middle">Nucleus</text>
  <text class="cmp" x="36" y="62">Cell body</text>
  <text class="cmp" x="742" y="132" text-anchor="middle">Axon</text>
  <text class="cmp" x="836" y="268" text-anchor="middle">Terminals</text>
</svg>'''

html = HTML.read_text()
new, k = re.subn(r'<svg viewBox="0 [0-9]+ 984 [0-9]+" role="img".*?</svg>', lambda m: svg, html, count=1, flags=re.S)
assert k == 1
HTML.write_text(new)
print("granule", F(gx), F(gy), "lower mt", F(mlx))
