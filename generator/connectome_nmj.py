"""One adult leg motor neuron from the public MaleCNS v0.9 release, for the leg motor neuron
("nmj") case's step 2 descent animation.

Source: Janelia FlyEM male CNS v0.9 (public Google Cloud Storage bucket `flyem-male-cns`, no
token), the same bucket as generator.connectome_mb, whose download, sharded-annotation and
skeleton readers are reused here. This script:
  1. downloads the body table (cell type and tags) and counts the leg motor neurons: bodies
     tagged superclass:vnc_motor with a somaNeuromere of T1, T2 or T3 and an exitNerve of ProLN,
     MesoLN or MetaLN (the front, middle and hind leg nerves);
  2. takes the T1 leg motor neurons that leave by the ProLN (front leg nerve), on the side
     (somaSide tag L or R; the nerve tags carry no side) that has more of them, and keeps those
     with a soma point;
  3. downloads the skeletons of a seeded sample of 24 (sequentially, politely), and for each
     finds the soma vertex, the axon path out to the nerve, and the dendritic tuft;
  4. works out the VNC's axes (anterior-posterior, dorsal-ventral, left-right) from soma
     positions, because the MaleCNS volume axes are not aligned with the fly;
  5. scores the candidates, picks the cleanest and writes mn.json and a contact sheet, sheet.png
     (both in data/nmj/connectome/, not committed);
  6. offers load(), side_view() and top_view() to the geometry module.

Orientation, all from soma points. The long axis of the thoracic VNC somata (those with a
somaNeuromere of T1-T3) is the anterior-posterior axis, signed so that the T1 leg motor
neuron somata lie in front of the T3 ones (and the brain is in front of the VNC). Left-right is
the difference between the somaSide:R and somaSide:L somata, with the along-axis part removed.
Dorsal-ventral is the third axis of an anatomical frame (dorsal = right x anterior), so it
rests on the left/right tags; two checks that do not use them are printed: the VNC lies ventral
to the brain, and the dorsal-nerve motor neurons (exitNerve DProN, T1 soma: neck muscles) have
their skeletons dorsal to the leg ones. If a check disagrees the script says so.

The axon exit is a skeleton leaf at the VNC's surface, where the leg nerve leaves. The skeleton
carries no radius, and the skeletons end in a ragged set of twigs at the surface (dendritic
twigs and the cut axon alike), so the exit is chosen by rule, and the rule is only good to a
few tens of um unless the skeleton continues out of the neuropil as a long unbranched stub (the
nerve stump), which a few cells have. Near the edge means no more than 15 um inside the 90th
percentile of the soma cortex's distance from the local centre of the somata (the somata within
100 um along the axis). Three rules are computed for every candidate and printed:
  far:  the leaf farthest from the VNC's long axis, measured in the cross-section plane from the
        local centre of the somata (the nerve reaches out beyond the neuropil and the soma
        cortex);
  long: the leaf with the longest path from the soma among the leaves near the edge;
  stub: the leaf near the edge with the longest unbranched run back to the first branch point.
The "stub" rule is the one used. Of the leaves at the surface, "far" and "long" separate by a
few um or are decided by a dendritic twig, while a nerve stump is a straight unbranched run of
tens of um, which a twig is not. Two Fe reductor motor neurons show one, starting at the same
point of the lateral surface and running ventrally; the "stub" rule finds it and the other two
rules mostly do not. Cells without a stump get the longest twig at the surface, which is
flagged by a short stub in the table.

"Clean" score, a plain sum of five terms (higher is better), minus 1 if the skeleton has more
than one component:
  straightness of the soma-to-exit path (euclidean distance / path length, 0..1);
  compactness of the dendritic tuft: 1 / (1 + r90 / 40 um), r90 = the 90th percentile distance
    of the dendritic vertices (those not on the axon path) from their centroid;
  separation: min(1, soma-to-exit distance / 150 um);
  richness: min(1, dendrite cable / 800 um), so that a bare stub does not win;
  nerve stub: min(1, unbranched run at the exit leaf / 60 um), so that a cell whose axon is seen
    leaving the neuropil, and not only ending at its surface, is preferred, because only for
    such a cell is the exit not a guess.
Candidates are T1/ProLN leg motor neurons whose soma lies within 50 um of the median soma of
their group (a few have the soma elsewhere, which would not read as a T1 neuron in the picture).

Which cell is used: the viewer draws the synaptic terminals on a femur muscle, so the cell is a
motor neuron of a femur muscle (FEMUR_TYPES: tibia flexor first, as on p. 6 of the reference
pack; never the femur reductor, whose muscle lies in the trochanter, although the two femur
reductor cells have the cleanest skeletons). Their skeletons stop at the VNC's surface without a
stump, so the exit is taken from the cells that have one: the stump's base is the nerve root,
and the chosen cell's axon path runs from its soma to its vertex nearest that root (it must pass
within 25 um). mn.json also carries the stump as the nerve's first stretch, for the drawing.

Downloaded data is untrusted: it is only ever parsed as JSON or with struct, never executed.

    uv run python -m generator.connectome_nmj      # download (cached), write mn.json, sheet.png
"""

import functools
import heapq
import json
import random
import sys
import time
import urllib.error
from collections import Counter, deque

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from .connectome_mb import (RELEASE, SKEL_URL, SOMA_BASE, TYPES_URL, VOXEL_UM, Shard,
                            decode_annotations, fetch, parse_skeleton)
from .paths import DATA

CACHE = DATA / "nmj" / "connectome"
OUT = CACHE / "mn.json"
SHEET = CACHE / "sheet.png"

SEED = 20261014
N_SAMPLE = 24
N_TOP = 5
N_VNC_MAX = 20000        # VNC somata used for the orientation
N_SIDE_MAX = 4000        # VNC somata written to mn.json for the schematic outline
N_BRAIN = 3000
N_DORSAL_CHECK = 8
CLUSTER_RADIUS = 50.0    # um: how far a candidate's soma may lie from its neuromere's soma cluster
NEAR_EDGE = 15.0         # um: a leaf this close to the soma cortex's edge, or beyond, is "near the edge"
MIN_PATH = 50.0          # um: an exit leaf is at least this far from the soma along the skeleton
NEUROMERES = ["T1", "T2", "T3"]
LEG_NERVES = ["ProLN", "MesoLN", "MetaLN"]
CHOSEN_NEUROMERE, CHOSEN_NERVE = "T1", "ProLN"
BRAIN_TAGS = ("superclass:ol_intrinsic", "superclass:cb_intrinsic", "superclass:ol_sensory")
SOURCE = "https://storage.googleapis.com/flyem-male-cns/v0.9/ (Janelia FlyEM male CNS, public)"

# window (um along the long axis) and step for the soma cortex profile
WINDOW, STEP, EDGE_PERCENTILE = 100.0, 20.0, 90


# ----- body table --------------------------------------------------------------------------

def body_table():
    """The combined properties table: ids, cell types and each body's set of tag strings."""
    info = json.loads(fetch(TYPES_URL, CACHE / "types-info.json"))["inline"]
    props = {p["id"]: p for p in info["properties"]}
    names = props["tags"]["tags"]
    tags = [frozenset(names[i] for i in t) for t in props["tags"]["values"]]
    return {"ids": info["ids"], "types": props["type"]["values"], "tags": tags}


def tag_of(tab, i, prefix):
    """The (first) tag value of a body under a prefix such as 'exitNerve', or None."""
    for t in tab["tags"][i]:
        if t.startswith(prefix + ":"):
            return t.split(":", 1)[1]
    return None


def has(tab, i, tag):
    return tag in tab["tags"][i]


def leg_motor_neurons(tab):
    """Bodies tagged vnc_motor (all), and of those the ones with a T1-T3 soma and a leg nerve."""
    mot, leg = [], []
    for i in range(len(tab["ids"])):
        if not has(tab, i, "superclass:vnc_motor"):
            continue
        mot.append(i)
        if tag_of(tab, i, "somaNeuromere") in NEUROMERES and tag_of(tab, i, "exitNerve") in LEG_NERVES:
            leg.append(i)
    return mot, leg


def report_table(tab, mot, leg):
    print(f"bodies in the table: {len(tab['ids'])}; superclass:vnc_motor: {len(mot)}; "
          f"leg motor neurons (T1-T3 soma and a leg nerve): {len(leg)}")
    print("  per soma neuromere:", dict(sorted(Counter(tag_of(tab, i, "somaNeuromere") for i in leg).items())))
    print("  per exit nerve:    ", dict(sorted(Counter(tag_of(tab, i, "exitNerve") for i in leg).items())))
    print("  per soma side:     ", dict(sorted(Counter(tag_of(tab, i, "somaSide") for i in leg).items())))
    both = Counter((tag_of(tab, i, "somaNeuromere"), tag_of(tab, i, "exitNerve")) for i in leg)
    print("  neuromere x nerve: ", {f"{a}/{b}": n for (a, b), n in sorted(both.items())})
    types = Counter(tab["types"][i] or "(no type)" for i in leg)
    print(f"  distinct types: {len(types)}; top 30 by count:")
    print("   ", ", ".join(f"{t} {n}" for t, n in types.most_common(30)))


# ----- soma points -------------------------------------------------------------------------

def soma_points(ids):
    """body id -> soma position in micrometres (nucleus point if there is one), or None.

    As connectome_mb.soma_points, with this script's cache directory."""
    info = json.loads(fetch(SOMA_BASE + "info", CACHE / "soma-info.json"))
    rel = next(r for r in info["relationships"] if r["id"] == "body")
    shard = Shard(fetch(SOMA_BASE + rel["key"] + "/0.shard", CACHE / "soma-by_rel_body.shard"), rel["sharding"])
    out = {}
    for b in ids:
        buf = shard.get(int(b))
        if buf is None:
            out[b] = None
            continue
        anns = decode_annotations(buf, info["properties"])
        best = sorted(anns, key=lambda a: a["kind"])[0]  # kind 0 = nucleus
        out[b] = [round(c * VOXEL_UM, 2) for c in best["point"]]
    return out


# ----- orientation -------------------------------------------------------------------------

def unit(v):
    v = np.asarray(v, float)
    return v / np.linalg.norm(v)


def orientation(tab, soma, vnc, leg, brain, log=print):
    """The VNC's axes from soma positions: ap (towards the head), dv (ventral) and lr (the fly's
    right), orthonormal 3-vectors in the volume's coordinates. soma maps a table row to a point
    in um; vnc, leg and brain are lists of rows. Prints the numbers behind the conclusion."""
    P = lambda rows: np.array([soma[i] for i in rows if i in soma])
    allv = P(vnc)
    thor = P([i for i in vnc if i in soma and tag_of(tab, i, "somaNeuromere") in NEUROMERES])
    t1 = P([i for i in leg if tag_of(tab, i, "somaNeuromere") == "T1"])
    t2 = P([i for i in leg if tag_of(tab, i, "somaNeuromere") == "T2"])
    t3 = P([i for i in leg if tag_of(tab, i, "somaNeuromere") == "T3"])
    left = P([i for i in vnc if tag_of(tab, i, "somaSide") == "L"])
    right = P([i for i in vnc if tag_of(tab, i, "somaSide") == "R"])
    bra = P(brain)

    # anterior-posterior: long axis of the thoracic somata, pointing from T3 towards T1
    c = thor.mean(axis=0)
    _, s, vt = np.linalg.svd(thor - c, full_matrices=False)
    ap = vt[0]
    if (t1.mean(axis=0) - t3.mean(axis=0)) @ ap < 0:
        ap = -ap
    ap = unit(ap)
    # left-right: right minus left, with the along-axis part removed
    lr = right.mean(axis=0) - left.mean(axis=0)
    lr = unit(lr - (lr @ ap) * ap)
    # dorsal-ventral: anatomical frame, dorsal = right x anterior, so ventral = anterior x right
    dv = unit(np.cross(ap, lr))

    fmt = lambda a: "(" + ", ".join(f"{x:+.3f}" for x in a) + ")"
    log("orientation (volume axes x, y, z in um):")
    log(f"  VNC somata used: {len(allv)} (thoracic {len(thor)}, left {len(left)}, right {len(right)}); "
        f"sd along x/y/z = " + " / ".join(f"{x:.0f}" for x in allv.std(axis=0)))
    for name, X in (("T1 leg motor neuron somata", t1), ("T2", t2), ("T3", t3), ("left VNC somata", left),
                    ("right VNC somata", right), ("brain somata", bra)):
        log(f"  {name:<28} n={len(X):>5}  mean x/y/z = " + " / ".join(f"{x:.0f}" for x in X.mean(axis=0))
            + "   sd = " + " / ".join(f"{x:.0f}" for x in X.std(axis=0)))
    sep = lambda A, B, a: (A.mean(axis=0) - B.mean(axis=0)) @ a / np.sqrt((A @ a).var() / 2 + (B @ a).var() / 2)
    log(f"  AP axis from thoracic somata PC1 {fmt(ap)}: T1 - T3 separation {(t1.mean(axis=0) - t3.mean(axis=0)) @ ap:.0f} um "
        f"= {sep(t1, t3, ap):.1f} pooled sd; right - left along it {(right.mean(axis=0) - left.mean(axis=0)) @ ap:+.0f} um "
        f"(PC sd {s[0] / np.sqrt(len(thor)):.0f}, {s[1] / np.sqrt(len(thor)):.0f}, {s[2] / np.sqrt(len(thor)):.0f})")
    log(f"  LR axis {fmt(lr)}: right - left separation {(right.mean(axis=0) - left.mean(axis=0)) @ lr:.0f} um "
        f"= {sep(right, left, lr):.1f} pooled sd; T1 - T3 along it {(t1.mean(axis=0) - t3.mean(axis=0)) @ lr:+.0f} um")
    log(f"  DV axis {fmt(dv)} (ventral, from the anatomical frame)")
    brain_ap = (bra.mean(axis=0) - allv.mean(axis=0)) @ ap
    brain_dv = (allv.mean(axis=0) - bra.mean(axis=0)) @ dv
    log(f"  check, brain vs VNC: the brain lies {brain_ap:+.0f} um along ap (anterior if positive) "
        f"and the VNC lies {brain_dv:+.0f} um along dv (ventral if positive)")
    ok_ap = brain_ap > 0
    ok_dv = brain_dv > 0
    log("  -> AP agrees with the brain" if ok_ap else "  -> WARNING: the brain is not in front of the VNC along ap")
    log("  -> the VNC is ventral to the brain" if ok_dv else "  -> WARNING: the VNC is not ventral to the brain along dv")
    return {"ap": ap, "dv": dv, "lr": lr, "evidence": {
        "t1_minus_t3_along_ap_um": round(float((t1.mean(axis=0) - t3.mean(axis=0)) @ ap), 1),
        "right_minus_left_along_lr_um": round(float((right.mean(axis=0) - left.mean(axis=0)) @ lr), 1),
        "brain_in_front_along_ap_um": round(float(brain_ap), 1),
        "vnc_ventral_to_brain_along_dv_um": round(float(brain_dv), 1)}}


def coords(points, axes):
    """3D points (n, 3) in um -> (n, 3) of (ap, dv, lr) coordinates."""
    p = np.asarray(points, float)
    return np.column_stack([p @ axes["ap"], p @ axes["dv"], p @ axes["lr"]])


def cortex_profile(somata_frame):
    """Centre and outer edge of the soma cortex in the cross-section plane (dv, lr), in windows
    along the ap axis. Returns (start, step, centres (k, 2), edges (k,))."""
    a = somata_frame[:, 0]
    starts = np.arange(a.min(), a.max() + STEP, STEP)
    centres, edges = [], []
    for s in starts:
        sel = somata_frame[np.abs(a - (s + STEP / 2)) < WINDOW]
        if len(sel) < 50:
            sel = somata_frame[np.argsort(np.abs(a - (s + STEP / 2)))[:50]]
        c = np.median(sel[:, 1:], axis=0)
        centres.append(c)
        edges.append(np.percentile(np.linalg.norm(sel[:, 1:] - c, axis=1), EDGE_PERCENTILE))
    return starts[0], STEP, np.array(centres), np.array(edges)


def radial(points_frame, profile):
    """Distance of points (ap, dv, lr) from the local centre of the cortex, and the local edge."""
    start, step, centres, edges = profile
    k = np.clip(((points_frame[:, 0] - start) // step).astype(int), 0, len(edges) - 1)
    return np.linalg.norm(points_frame[:, 1:] - centres[k], axis=1), edges[k]


# ----- skeletons ---------------------------------------------------------------------------

def get_skeleton(body):
    """(vertices um, edges) of a body, downloading it unless cached; None if the bucket has none."""
    path = CACHE / "skeletons" / body
    fresh = not path.exists()
    try:
        blob = fetch(SKEL_URL.format(body), path)
    except urllib.error.HTTPError as err:
        if err.code in (403, 404):
            return None
        raise
    if fresh:
        time.sleep(0.05)
    return parse_skeleton(blob)


def analyse(v, e, soma_pt, axes, profile):
    """Soma vertex, components, axon exit (two rules), axon path and tuft numbers of a skeleton.

    v (n, 3) um, e (m, 2). The soma's component is the one kept. Returns a dict; "keep" is the
    sorted array of kept vertex indices, and path and exit indices refer to the original v."""
    n = len(v)
    w = np.linalg.norm(v[e[:, 0]] - v[e[:, 1]], axis=1)
    adj = [[] for _ in range(n)]
    for (a, b), length in zip(e.tolist(), w.tolist()):
        adj[a].append((b, length))
        adj[b].append((a, length))
    sv = int(np.argmin(np.linalg.norm(v - np.asarray(soma_pt), axis=1)))
    soma_gap = float(np.linalg.norm(v[sv] - np.asarray(soma_pt)))

    # geodesic distance and predecessors from the soma vertex (Dijkstra; the skeleton is a tree)
    dist = {sv: 0.0}
    pred = {sv: -1}
    heap = [(0.0, sv)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for x, length in adj[u]:
            if x not in dist or d + length < dist[x]:
                dist[x] = d + length
                pred[x] = u
                heapq.heappush(heap, (d + length, x))
    keep = np.array(sorted(dist))
    # components in all
    seen = np.zeros(n, bool)
    sizes = []
    for s0 in range(n):
        if seen[s0]:
            continue
        seen[s0] = True
        q, size = deque([s0]), 0
        while q:
            u = q.popleft()
            size += 1
            for x, _ in adj[u]:
                if not seen[x]:
                    seen[x] = True
                    q.append(x)
        sizes.append(size)
    in_comp = np.zeros(n, bool)
    in_comp[keep] = True
    cable = float(w[in_comp[e[:, 0]] & in_comp[e[:, 1]]].sum())
    n_edges = int((in_comp[e[:, 0]] & in_comp[e[:, 1]]).sum())

    leaves = np.array([i for i in keep.tolist() if len(adj[i]) == 1 and i != sv])
    lf = coords(v[leaves], axes)
    r, edge = radial(lf, profile)
    far = int(leaves[np.argmax(r)])
    def run_of(leaf):
        """Unbranched run at a leaf: its length back to the first branch point, in um."""
        length, u = 0.0, leaf
        while pred[u] != -1:
            length += float(np.linalg.norm(v[u] - v[pred[u]]))
            u = pred[u]
            if len(adj[u]) >= 3:
                break
        return length

    # leaves near the edge and not close to the soma (a soma near the surface has leaves of its own)
    near = np.array([k for k in np.where(r > edge - NEAR_EDGE)[0] if dist[int(leaves[k])] >= MIN_PATH], int)
    if len(near):
        long_ = int(leaves[near[np.argmax([dist[int(leaves[k])] for k in near])]])
        runs = [run_of(int(leaves[k])) for k in near]
        exit_ = int(leaves[near[int(np.argmax(runs))]])
    else:
        long_ = exit_ = far
    kx = int(np.where(leaves == exit_)[0][0])
    exit_out = float(r[kx] - edge[kx])
    stub = run_of(exit_)
    path = []
    u = exit_
    while u != -1:
        path.append(u)
        u = pred[u]
    path = path[::-1]
    plen = dist[exit_]
    on_path = np.zeros(n, bool)
    on_path[path] = True
    den = np.where(in_comp & ~on_path)[0]
    if len(den):
        dc = v[den]
        r90 = float(np.percentile(np.linalg.norm(dc - dc.mean(axis=0), axis=1), 90))
    else:
        r90 = float("inf")
    euclid = float(np.linalg.norm(v[exit_] - v[sv]))
    straight = euclid / plen if plen > 0 else 0.0
    den_cable = cable - plen
    score = (straight + 1.0 / (1.0 + r90 / 40.0) + min(1.0, euclid / 150.0) + min(1.0, den_cable / 800.0)
             + min(1.0, stub / 60.0) - (1.0 if len(sizes) > 1 else 0.0))
    kept = v[keep]
    return {
        "soma_vertex": sv, "soma_gap_um": soma_gap, "components": len(sizes), "component_sizes": sorted(sizes, reverse=True),
        "kept_vertices": len(keep), "tree": n_edges == len(keep) - 1, "leaves": len(leaves),
        "exit_far": far, "exit_long": long_, "exit": exit_,
        "exit_beyond_cortex_um": exit_out, "exit_stub_um": stub,
        "path": path, "path_um": plen, "euclid_um": euclid, "straightness": straight,
        "dendrite_cable_um": den_cable, "tuft_r90_um": r90, "cable_um": cable, "score": score,
        "bbox": [kept.min(axis=0).tolist(), kept.max(axis=0).tolist()],
        "keep": keep,
    }


def dorsal_check(tab, side, axes, mean_dv_leg, log=print):
    """Compare the skeleton centroids of dorsal-nerve motor neurons (exitNerve DProN, T1 soma) with
    those of the leg motor neurons along dv; the dorsal ones must be more dorsal (smaller dv)."""
    rows = [i for i in range(len(tab["ids"])) if has(tab, i, "superclass:vnc_motor")
            and tag_of(tab, i, "exitNerve") == "DProN" and tag_of(tab, i, "somaNeuromere") == "T1"
            and tag_of(tab, i, "somaSide") == side]
    rng = random.Random(SEED)
    rows = rng.sample(rows, min(N_DORSAL_CHECK, len(rows)))
    cents = []
    for i in rows:
        sk = get_skeleton(tab["ids"][i])
        if sk is not None:
            cents.append(coords(sk[0], axes).mean(axis=0))
    if not cents:
        log("  dorsal-nerve check: no skeletons")
        return None
    cents = np.array(cents)
    log(f"  check, dorsal-nerve motor neurons (DProN, T1, side {side}; n={len(cents)}): mean skeleton dv "
        f"{cents[:, 1].mean():.0f} um vs leg motor neurons {mean_dv_leg:.0f} um "
        f"(difference {cents[:, 1].mean() - mean_dv_leg:+.0f} um; ap {cents[:, 0].mean():.0f})")
    ok = cents[:, 1].mean() < mean_dv_leg
    log("  -> the dorsal-nerve motor neurons are dorsal to the leg ones, as expected" if ok else
        "  -> WARNING: the dorsal-nerve motor neurons are not dorsal to the leg ones along dv")
    return float(cents[:, 1].mean() - mean_dv_leg)


# ----- projections for the geometry module -------------------------------------------------

@functools.lru_cache(maxsize=1)
def _frame():
    d = load()
    return {"ap": np.array(d["axes"]["ap"]), "dv": np.array(d["axes"]["dv"]), "lr": np.array(d["axes"]["lr"]),
            "soma": np.array(d["cell"]["soma"])}


def load():
    """Read mn.json (written by main())."""
    return json.loads(OUT.read_text())


def side_view(points3d):
    """3D points (n, 3) in um -> (n, 2) um for a side view relative to the chosen cell's soma:
    x towards the head (anterior positive), y towards the belly (ventral positive, down on screen)."""
    f = _frame()
    p = np.atleast_2d(np.asarray(points3d, float)) - f["soma"]
    return np.column_stack([p @ f["ap"], p @ f["dv"]])


def top_view(points3d):
    """As side_view, from above: x anterior, y the fly's right (down on screen, so the fly's
    left is up when the head is to the right)."""
    f = _frame()
    p = np.atleast_2d(np.asarray(points3d, float)) - f["soma"]
    return np.column_stack([p @ f["ap"], p @ f["lr"]])


# ----- contact sheet -----------------------------------------------------------------------

GREY = (200, 200, 200)
LEG_COL = {"T1": (214, 39, 40), "T2": (255, 127, 14), "T3": (120, 70, 180)}
BLUE, DARK_BLUE = (50, 120, 200), (10, 50, 140)


def _font(size):
    try:
        return ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size)
    except OSError:
        return ImageFont.load_default()


def _draw_cell(d, to_px, r, colour=BLUE, widths=(1, 3), soma=None, exit_pt=None, soma_r=4):
    """Skeleton r (vertices (n, 3), edges, path indices); to_px maps (n, 3) um to (n, 2) px."""
    xy = to_px(r["vertices"])
    on = set(r["path"])
    for i, j in r["edges"]:
        if i in on and j in on:
            continue
        d.line([tuple(xy[i]), tuple(xy[j])], fill=colour, width=widths[0])
    p = r["path"]
    d.line([tuple(xy[k]) for k in p], fill=DARK_BLUE, width=widths[1])
    if soma is not None:
        x, y = to_px(np.array([soma]))[0]
        d.ellipse([x - soma_r, y - soma_r, x + soma_r, y + soma_r], fill=(214, 39, 40), outline="black")
    if exit_pt is not None:
        x, y = to_px(np.array([exit_pt]))[0]
        d.rectangle([x - 3, y - 3, x + 3, y + 3], fill=(255, 190, 0), outline="black")


def _view(points, axes, origin, kind):
    """3D points -> (n, 2) um relative to origin: x anterior, y ventral (side) or the fly's right (top)."""
    c = coords(points, axes) - coords(np.asarray(origin, float)[None], axes)
    return c[:, [0, 1 if kind == "side" else 2]]


def _scalebar(d, x, y, scale, font, um=50):
    d.line([x, y, x + um * scale, y], fill="black", width=3)
    d.text((x + um * scale + 6, y - 9), f"{um} um", fill="black", font=font)


def sheet(path, ctx):
    """Contact sheet: side and top views of the VNC somata with the chosen skeleton, and a side
    view of each of the top candidates. ctx comes from main()."""
    axes, soma0, best, top = ctx["axes"], np.asarray(ctx["soma"]), ctx["best"], ctx["top"]
    font, big = _font(15), _font(20)
    views = lambda kind: (lambda P: _view(P, axes, soma0, kind))

    pad, scale = 30, 1.45
    panels = []
    for kind, title in (("side", "(a) side view: anterior right, ventral down"),
                        ("top", "(b) from above: anterior right, fly's left up")):
        proj = views(kind)
        pts = np.vstack([proj(ctx["cloud"]), proj(np.asarray(best["vertices"]))])
        lo, hi = pts.min(axis=0), pts.max(axis=0)
        w, h = int((hi[0] - lo[0]) * scale) + 2 * pad, int((hi[1] - lo[1]) * scale) + 2 * pad + 28
        panels.append((kind, title, proj, lo, w, h))
    row1_h = max(p[5] for p in panels)
    W = sum(p[4] for p in panels)
    cand_w = W // N_TOP
    cand_h = cand_w
    img = Image.new("RGB", (W, row1_h + cand_h + 30), "white")
    d = ImageDraw.Draw(img)
    ox = 0
    for kind, title, proj, lo, w, h in panels:
        d.rectangle([ox, 0, ox + w - 1, row1_h - 1], outline=(190, 190, 190))
        d.text((ox + 10, 6), title, fill="black", font=big)
        to_px = lambda P, proj=proj, lo=lo, ox=ox: (proj(np.asarray(P)) - lo) * scale + (ox + pad, pad + 28)
        for x, y in to_px(ctx["cloud"]):
            d.rectangle([x, y, x + 1, y + 1], fill=GREY)
        for nm, P in ctx["leg_somata"].items():
            for x, y in to_px(P):
                d.ellipse([x - 2.5, y - 2.5, x + 2.5, y + 2.5], fill=LEG_COL[nm])
        _draw_cell(d, to_px, best, soma=soma0, exit_pt=best["vertices"][best["exit"]], soma_r=5)
        _scalebar(d, ox + 14, row1_h - 14, scale, font)
        if kind == "side":
            for k, (nm, c) in enumerate(LEG_COL.items()):
                y = row1_h - 84 + 22 * k
                d.ellipse([ox + w - 250, y + 3, ox + w - 244, y + 9], fill=c)
                d.text((ox + w - 236, y), f"{nm} leg motor neuron somata", fill="black", font=font)
        ox += w
    # candidate panels: a common scale
    sproj = views("side")
    ext = max(max(np.ptp(sproj(np.asarray(r["vertices"])), axis=0)) for r in top)
    cs = (cand_w - 40) / ext
    for k, r in enumerate(top):
        x0, y0 = k * cand_w, row1_h
        d.rectangle([x0, y0, x0 + cand_w - 1, y0 + cand_h + 29], outline=(190, 190, 190))
        pts = sproj(np.asarray(r["vertices"]))
        lo = pts.min(axis=0) - (ext - np.ptp(pts, axis=0)) / 2
        to_px = lambda P, lo=lo, x0=x0, y0=y0: (sproj(np.asarray(P)) - lo) * cs + (x0 + 20, y0 + 40)
        _draw_cell(d, to_px, r, widths=(1, 2), soma=r["soma"], exit_pt=r["vertices"][r["exit"]], soma_r=4)
        d.text((x0 + 8, y0 + 6), f"#{k + 1} {r['id']}", fill="black", font=font)
        d.text((x0 + 8, y0 + 22), f"score {r['score']:.2f}  straight {r['straightness']:.2f}", fill=(80, 80, 80),
               font=_font(12))
        _scalebar(d, x0 + 12, y0 + cand_h + 14, cs, font)
    img.save(path)
    return path


# ----- main --------------------------------------------------------------------------------

def reindexed(r):
    """A result's soma component with vertex numbers 0..k-1: vertices, edges, soma_vertex, exit, path."""
    keep = r["keep"]
    new = {int(o): n for n, o in enumerate(keep)}
    edges = [[new[int(a)], new[int(b)]] for a, b in r["e"] if int(a) in new and int(b) in new]
    return {"vertices": r["v"][keep], "edges": edges, "soma_vertex": new[r["soma_vertex"]],
            "exit": new[r["exit"]], "path": [new[p] for p in r["path"]]}


# Motor neurons whose muscle lies in the femur, where the viewer draws the synaptic terminals: the
# tibia flexor (preferred: reference pack p. 6), its accessory flexor, the tibia extensor and the
# long tendon muscle's femoral part (ltm2). Not the femur reductor: its muscle is in the trochanter.
FEMUR_TYPES = ("Ti flexor MN", "Acc. ti flexor MN", "Ti extensor MN", "ltm2-femur MN")
NERVE_REACH = 25.0   # um: a femur cell's axon must pass this close to the nerve root


def tree_path(v, e, a, b):
    """Vertex indices along the tree from a to b."""
    adj = [[] for _ in range(len(v))]
    for x, y in e.tolist():
        adj[x].append(y)
        adj[y].append(x)
    pred = {a: -1}
    q = deque([a])
    while q:
        u = q.popleft()
        if u == b:
            break
        for x in adj[u]:
            if x not in pred:
                pred[x] = u
                q.append(x)
    path, u = [], b
    while u != -1:
        path.append(u)
        u = pred[u]
    return path[::-1]


def nerve_root(results):
    """Where the front leg nerve leaves the VNC, from the cells whose skeleton carries on into it
    (an unbranched stub of 50 um or more): the stub's base (its first branch point back from the
    end), the direction it runs, and the stub itself (3D points, base first). None if no cell has
    a stub."""
    stubs = []
    for r in results:
        if r["exit_stub_um"] < 50:
            continue
        path = r["path"]
        deg = Counter(np.asarray(r["e"]).ravel().tolist())
        k = len(path) - 1
        while k > 0 and deg[path[k - 1]] < 3:
            k -= 1
        base = max(0, k - 1)
        pts = r["v"][path[base:]]
        stubs.append((r, pts))
    if not stubs:
        return None
    root = np.mean([p[0] for _, p in stubs], axis=0)
    direction = unit(np.mean([unit(p[-1] - p[0]) for _, p in stubs], axis=0))
    longest = max(stubs, key=lambda s: len(s[1]))[1]
    return {"root": root, "direction": direction, "stub": longest - longest[0] + root, "from": [r["id"] for r, _ in stubs]}


def femur_choice(results, nerve, log=print):
    """The cleanest motor neuron of a femur muscle: its axon path runs from the soma to the vertex
    nearest the nerve root (within NERVE_REACH), so the exit is where the nerve is seen to leave
    rather than a guessed twig; ranked by the clean score with that exit, tibia flexors first.
    Returns (result with exit and path replaced, rows for the table), or (None, rows)."""
    rows = []
    for r in results:
        if r["type"] not in FEMUR_TYPES:
            continue
        keep = r["keep"]
        d = np.linalg.norm(r["v"][keep] - nerve["root"], axis=1)
        nv = int(keep[int(np.argmin(d))])
        path = tree_path(r["v"], np.asarray(r["e"]), r["soma_vertex"], nv)
        seg = np.linalg.norm(np.diff(r["v"][path], axis=0), axis=1).sum()
        euclid = float(np.linalg.norm(r["v"][nv] - r["v"][r["soma_vertex"]]))
        straight = euclid / seg if seg else 0.0
        den_cable = r["cable_um"] - seg
        score = (straight + 1.0 / (1.0 + r["tuft_r90_um"] / 40.0) + min(1.0, euclid / 150.0)
                 + min(1.0, den_cable / 800.0) - (1.0 if r["components"] > 1 else 0.0) - float(d.min()) / NERVE_REACH)
        rows.append({**r, "exit": nv, "path": path, "path_um": float(seg), "euclid_um": euclid, "straightness": straight,
                     "dendrite_cable_um": den_cable, "score": score, "root_gap_um": float(d.min())})
    rows.sort(key=lambda x: (x["type"] != "Ti flexor MN", -x["score"]))
    for x in rows:
        log(f"  femur muscle: {x['id']:>11} {x['type']:<18} root gap {x['root_gap_um']:5.1f} um, path {x['path_um']:4.0f} um, "
            f"straightness {x['straightness']:.2f}, score {x['score']:.2f}")
    ok = [x for x in rows if x["root_gap_um"] <= NERVE_REACH]
    return (ok[0] if ok else None), rows


def table_row(r, rank=None):
    return {
        "rank": rank, "id": r["id"], "type": r["type"], "score": round(r["score"], 3),
        "components": r["components"], "straightness": round(r["straightness"], 3),
        "path_um": round(r["path_um"], 1), "soma_to_exit_um": round(r["euclid_um"], 1),
        "dendrite_cable_um": round(r["dendrite_cable_um"], 1), "tuft_r90_um": round(r["tuft_r90_um"], 1),
        "cable_um": round(r["cable_um"], 1), "exit_by_far_rule": r["exit_far"], "exit_by_long_rule": r["exit_long"],
        "exit_beyond_cortex_um": round(r["exit_beyond_cortex_um"], 1), "exit_stub_um": round(r["exit_stub_um"], 1),
        "bbox_extent_um": [round(x, 1) for x in (np.array(r["bbox"][1]) - np.array(r["bbox"][0]))],
    }


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    tab = body_table()
    ids = tab["ids"]
    mot, leg = leg_motor_neurons(tab)
    report_table(tab, mot, leg)

    # soma points: all leg motor neurons, and the VNC (any superclass:vnc_* tag) and brain samples
    rng = random.Random(SEED)
    vnc = [i for i in range(len(ids)) if any(t.startswith("superclass:vnc_") for t in tab["tags"][i])]
    vnc_use = vnc if len(vnc) <= N_VNC_MAX else sorted(rng.sample(vnc, N_VNC_MAX))
    brain = [i for i in range(len(ids)) if any(t in tab["tags"][i] for t in BRAIN_TAGS)]
    brain_use = sorted(rng.sample(brain, min(N_BRAIN, len(brain))))
    want = sorted(set(leg) | set(vnc_use) | set(brain_use))
    raw = soma_points([ids[i] for i in want])
    soma = {i: raw[ids[i]] for i in want if raw[ids[i]]}
    print(f"bodies with a superclass:vnc_* tag: {len(vnc)} (using {len(vnc_use)}, "
          f"{sum(i in soma for i in vnc_use)} with a soma point); leg motor neurons with a soma point: "
          f"{sum(i in soma for i in leg)}/{len(leg)}")

    axes = orientation(tab, soma, [i for i in vnc_use if i in soma], [i for i in leg if i in soma],
                       [i for i in brain_use if i in soma])
    cloud = np.array([soma[i] for i in vnc_use if i in soma])
    profile = cortex_profile(coords(cloud, axes))

    # candidates: T1 leg motor neurons leaving by the ProLN, on one side
    pool = [i for i in leg if tag_of(tab, i, "somaNeuromere") == CHOSEN_NEUROMERE
            and tag_of(tab, i, "exitNerve") == CHOSEN_NERVE]
    sides = Counter(tag_of(tab, i, "somaSide") for i in pool)
    side = max(sorted(sides), key=lambda s: sides[s])
    mean_lr = {s: float(np.mean([coords(np.array([soma[i]]), axes)[0, 2]
                                 for i in pool if tag_of(tab, i, "somaSide") == s and i in soma])) for s in sides}
    print(f"{CHOSEN_NEUROMERE}/{CHOSEN_NERVE} leg motor neurons per somaSide tag: {dict(sides)}; the nerve tags carry "
          f"no side, so the side is the soma side: keeping {side} (mean lr per side "
          + ", ".join(f"{s} {m:+.0f}" for s, m in sorted(mean_lr.items())) + " um)")
    cands = sorted((i for i in pool if tag_of(tab, i, "somaSide") == side and i in soma), key=lambda i: int(ids[i]))
    print(f"candidates with a soma point: {len(cands)}")
    # the soma must lie in the T1 leg motor neuron soma cluster (a few cells have it elsewhere)
    cf = coords(np.array([soma[i] for i in cands]), axes)
    off = np.linalg.norm(cf - np.median(cf, axis=0), axis=1)
    print(f"soma offset from the cluster median: median {np.median(off):.0f} um, 90th percentile "
          f"{np.percentile(off, 90):.0f} um, max {off.max():.0f} um; dropped (more than {CLUSTER_RADIUS:.0f} um): "
          + (", ".join(f"{ids[i]} ({o:.0f} um)" for i, o in zip(cands, off) if o > CLUSTER_RADIUS) or "none"))
    cands = [i for i, o in zip(cands, off) if o <= CLUSTER_RADIUS]
    print(f"candidates in the cluster: {len(cands)}")
    order = rng.sample(cands, len(cands))

    results = []
    for i in order:
        if len(results) == N_SAMPLE:
            break
        sk = get_skeleton(ids[i])
        if sk is None:
            print(f"  {ids[i]}: no skeleton in the bucket, skipped")
            continue
        v, e = sk
        r = analyse(v, e, soma[i], axes, profile)
        r.update({"row": i, "id": ids[i], "type": tab["types"][i], "soma": soma[i], "v": v, "e": e})
        results.append(r)
    print(f"skeletons analysed: {len(results)}")

    print("per candidate (um): gap = soma point to soma vertex, path = soma to exit along the skeleton, euc = straight "
          "line, dend = dendrite cable, r90 = tuft radius, out = exit beyond the soma cortex's edge, stub = unbranched "
          "run at the exit, far / long / exit = the exit vertex by the far rule, the long rule and the rule used")
    print(f"{'id':>11} {'type':<22} {'verts':>6} {'comp':>4} {'gap':>5} {'path':>6} {'euc':>6} {'straight':>8} "
          f"{'dend':>6} {'r90':>5} {'out':>5} {'stub':>5} {'far':>6} {'long':>6} {'exit':>6} {'score':>6}")
    for r in sorted(results, key=lambda r: -r["score"]):
        print(f"{r['id']:>11} {(r['type'] or '')[:22]:<22} {len(r['v']):>6} {r['components']:>4} {r['soma_gap_um']:>5.1f} "
              f"{r['path_um']:>6.0f} {r['euclid_um']:>6.0f} {r['straightness']:>8.2f} {r['dendrite_cable_um']:>6.0f} "
              f"{r['tuft_r90_um']:>5.0f} {r['exit_beyond_cortex_um']:>5.0f} {r['exit_stub_um']:>5.0f} {r['exit_far']:>6} "
              f"{r['exit_long']:>6} {r['exit']:>6} {r['score']:>6.2f}")
    multi = [r["id"] for r in results if r["components"] > 1]
    if multi:
        print("skeletons with more than one component (the soma's is kept):",
              {r["id"]: r["component_sizes"] for r in results if r["components"] > 1})
    print(f"exit vertex equals the far rule's for {sum(r['exit'] == r['exit_far'] for r in results)} and the long rule's "
          f"for {sum(r['exit'] == r['exit_long'] for r in results)} of {len(results)}; "
          f"clear nerve stub (unbranched run of 50 um or more) in {sum(r['exit_stub_um'] >= 50 for r in results)}; "
          f"trees: {sum(r['tree'] for r in results)} of {len(results)}")

    ranked = sorted(results, key=lambda r: -r["score"])
    top = ranked[:N_TOP]
    nerve = nerve_root(results)
    best = None
    if nerve is not None:
        print(f"front leg nerve root from the stubs of {', '.join(nerve['from'])}")
        best, _ = femur_choice(results, nerve)
    if best is None:
        print("no femur-muscle motor neuron reaches the nerve root: taking the cleanest of all")
        best = ranked[0]
    mean_dv_leg = float(np.mean([coords(r["v"][r["keep"]], axes)[:, 1].mean() for r in results]))
    dorsal_diff = dorsal_check(tab, side, axes, mean_dv_leg)

    # the chosen cell, reindexed to its soma's component
    c = reindexed(best)
    cell = {
        "id": best["id"], "type": best["type"], "tags": sorted(tab["tags"][best["row"]]),
        "soma": [round(x, 2) for x in best["soma"]], "soma_vertex": c["soma_vertex"], "exit_vertex": c["exit"],
        "axon_path": c["path"], "vertices": np.round(c["vertices"], 2).tolist(), "edges": c["edges"],
    }
    if nerve is not None:   # the nerve the axon leaves in, as the stub cells show it (3D um, root first)
        cell["nerve"] = {"root": np.round(nerve["root"], 2).tolist(), "direction": np.round(nerve["direction"], 4).tolist(),
                         "stub": np.round(nerve["stub"], 2).tolist(), "from": nerve["from"]}
    sub = cloud if len(cloud) <= N_SIDE_MAX else cloud[sorted(random.Random(SEED).sample(range(len(cloud)), N_SIDE_MAX))]
    leg_somata = {nm: np.array([soma[i] for i in leg if i in soma and tag_of(tab, i, "somaNeuromere") == nm])
                  for nm in NEUROMERES}
    ev = dict(axes["evidence"])
    if dorsal_diff is not None:
        ev["dorsal_nerve_mn_minus_leg_mn_skeleton_dv_um"] = round(dorsal_diff, 1)
    out = {
        "source": SOURCE, "release": RELEASE, "units": "µm", "side": side,
        "side_note": f"somaSide tag {side} of the {CHOSEN_NEUROMERE}/{CHOSEN_NERVE} leg motor neurons "
                     f"({dict(sides)}); the nerve tags carry no side",
        "axes": {
            "ap": [round(x, 6) for x in axes["ap"]], "dv": [round(x, 6) for x in axes["dv"]],
            "lr": [round(x, 6) for x in axes["lr"]],
            "convention": "unit vectors in the volume's coordinates (x, y, z in um). ap points anterior "
                          "(towards the head), dv points ventral, lr points to the fly's right; orthonormal. "
                          "Coordinate along an axis = point . vector. side_view: x = ap, y = dv (down on screen).",
            "evidence": ev,
        },
        "cell": cell,
        "candidates": [table_row(r, k + 1) for k, r in enumerate(top)],
        "vnc_somata_side": np.round(_view(sub, axes, cell["soma"], "side"), 1).tolist(),
        "neuromeres_side": {nm: np.round(_view(p, axes, cell["soma"], "side").mean(axis=0), 1).tolist()
                            for nm, p in leg_somata.items() if len(p)},
        # the central brain's cell bodies, seen from the side as the VNC's are: its outline in the descent
        "brain_somata_side": np.round(_view(np.array([soma[i] for i in brain_use if i in soma
                                                      and "superclass:cb_intrinsic" in tab["tags"][i]]),
                                            axes, cell["soma"], "side"), 1).tolist(),
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))

    cards = [{"id": r["id"], "score": r["score"], "straightness": r["straightness"], "soma": r["soma"],
              **reindexed(r)} for r in [best] + [r for r in top if r["id"] != best["id"]][:N_TOP - 1]]
    sheet(SHEET, {"axes": axes, "soma": cell["soma"], "best": cards[0], "top": cards, "cloud": cloud,
                  "leg_somata": leg_somata})

    print("\ntop 5:")
    for k, r in enumerate(top, 1):
        print(f"  {k}. {r['id']} {r['type']}: score {r['score']:.2f}, straightness {r['straightness']:.2f}, "
              f"path {r['path_um']:.0f} um, soma-exit {r['euclid_um']:.0f} um, dendrite cable {r['dendrite_cable_um']:.0f} um, "
              f"tuft r90 {r['tuft_r90_um']:.0f} um, nerve stub {r['exit_stub_um']:.0f} um, {r['components']} component(s)")
    ex = np.array(cell["vertices"])[cell["exit_vertex"]]
    sx = np.array(cell["soma"])
    rel = coords((ex - sx)[None], axes)[0]
    print(f"chosen {cell['id']} ({cell['type']}), side {side}: exit minus soma = ap {rel[0]:+.0f}, dv {rel[1]:+.0f}, "
          f"lr {rel[2]:+.0f} um ({'ventral' if rel[1] > 0 else 'dorsal'}, {'right' if rel[2] > 0 else 'left'})")
    size = sum(f.stat().st_size for f in CACHE.rglob("*") if f.is_file())
    print(f"cache {size / 1e6:.1f} MB in {CACHE}; wrote {OUT} and {SHEET}")


if __name__ == "__main__":
    sys.exit(main())
