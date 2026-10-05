"""Fly drawings from the flybody body model, simplified into the site's ink-and-wash style.

flybody (Vaxenburg et al. 2025, Nature, doi:10.1038/s41586-025-09029-4; code and assets
Apache-2.0, https://github.com/TuragaLab/flybody) gives per-segment meshes and the joint tree
(fruitfly.xml). This script:
  1. downloads the meshes it needs, pinned to one flybody commit, into data/flybody/ (not
     committed; the largest is about 30 MB);
  2. poses the body by forward kinematics (hinge joints, angles in radians; the rest pose is
     the model's spring reference: folded wings, standing legs);
  3. projects each drawing part to a fixed view (dorsal, lateral or frontal), rasterises it,
     traces and simplifies its outline into a few smooth curves;
  4. writes SVG: one group per part, back to front, each with its joint pivot, so the site
     can pose and animate the legs, wings and head.

Kept: head, eyes (as a wash shape), antennae, thorax, abdomen (tergites as overlapping
shapes, which draws the bands), wings (membrane and veins), halteres, and each leg as coxa,
femur, tibia and tarsus. Dropped: bristles, ocelli, claws, mouthparts, eye facets.

    uv run python -m generator.flies           # writes site/data/flies/*.svg and a contact sheet
"""

import json
import math
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter
from shapely.geometry import Polygon
from skimage.measure import find_contours

from .paths import DATA, ROOT, SITE_DATA

FLYBODY_COMMIT = "d015e9bfe441bd90ae431bac24c55cb74bdbce26"
BASE_URL = f"https://raw.githubusercontent.com/TuragaLab/flybody/{FLYBODY_COMMIT}/flybody/fruitfly/assets/"
CACHE = DATA / "flybody"
OUT = SITE_DATA / "flies"

LEGS = [f"T{s}_{side}" for s in (1, 2, 3) for side in ("left", "right")]

# Drawing parts: name -> (meshes, style). Style: body wash, eye wash, wing, vein, or none.
def part_table():
    parts = {
        "abdomen_7": (["abdomen_7", "abdomen_8", "abdomen_7_lower"], "body"),
        **{f"abdomen_{k}": ([f"abdomen_{k}", f"abdomen_{k}_lower"], "body") for k in (6, 5, 4, 3, 2)},
        "abdomen_1": (["abdomen_1", "abdomen_1_lower"], "body"),
        "thorax": (["thorax"], "body"),
        "head": (["head"], "body"),
        "eye": (["head_red"], "eye"),
        "antenna_left": (["antenna_left"], "body"),
        "antenna_right": (["antenna_right"], "body"),
        "haltere_left": (["haltere_left"], "body"),
        "haltere_right": (["haltere_right"], "body"),
        "wing_left": (["wing_left_membrane"], "wing"),
        "wing_right": (["wing_right_membrane"], "wing"),
        "veins_left": (["wing_left_brown"], "vein"),
        "veins_right": (["wing_right_brown"], "vein"),
    }
    for leg in LEGS:
        s, side = leg.split("_")
        parts[f"coxa_{leg}"] = ([f"coxa_{s}_{side}"], "body")
        parts[f"femur_{leg}"] = ([f"femur_{s}_{side}"], "body")
        parts[f"tibia_{leg}"] = ([f"tibia_{s}_{side}"], "body")
        parts[f"tarsus_{leg}"] = ([f"tarsus_{s}_{k}_{side}" for k in (1, 2, 3, 4)], "body")
    return parts


# ---------- download and parse ----------

def fetch(name):
    path = CACHE / name
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        print(f"  downloading {name}")
        urllib.request.urlretrieve(BASE_URL + name, path)
    return path


def quat_to_mat(q):
    w, x, y, z = q / np.linalg.norm(q)
    return np.array([
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ])


def axis_angle(axis, a):
    axis = np.asarray(axis, float) / np.linalg.norm(axis)
    x, y, z = axis
    c, s, C = math.cos(a), math.sin(a), 1 - math.cos(a)
    return np.array([[c + x * x * C, x * y * C - z * s, x * z * C + y * s],
                     [y * x * C + z * s, c + y * y * C, y * z * C - x * s],
                     [z * x * C - y * s, z * y * C + x * s, c + z * z * C]])


def vec(s, n=3, default=0.0):
    return np.array([float(v) for v in s.split()]) if s else np.full(n, default)


class Model:
    """The joint tree and mesh geoms from fruitfly.xml."""

    def __init__(self, xml_path):
        root = ET.parse(xml_path).getroot()
        self.mesh_files = {m.get("name"): m.get("file") for m in root.iter("mesh") if m.get("name")}
        scale = root.find("default/mesh").get("scale")
        self.mesh_scale = vec(scale)
        # joint defaults by class (axis, springref), inherited down the default tree
        self.jdefaults = {}

        def walk_defaults(d, inherited):
            j = d.find("joint")
            cur = dict(inherited)
            if j is not None:
                for k in ("axis", "springref", "range"):
                    if j.get(k):
                        cur[k] = j.get(k)
            if d.get("class"):
                self.jdefaults[d.get("class")] = cur
            for c in d.findall("default"):
                walk_defaults(c, cur)
        walk_defaults(root.find("default"), {})

        self.bodies = {}  # name -> dict(parent, pos, R, joints, geoms)

        def walk(b, parent, inherited_class):
            cls = b.get("childclass") or inherited_class
            joints = []
            for j in b.findall("joint"):
                jc = j.get("class") or cls
                d = self.jdefaults.get(jc, {})
                axis = vec(j.get("axis") or d.get("axis") or "0 0 1")
                spring = float(j.get("springref") or d.get("springref") or 0.0)
                rng = vec(j.get("range") or d.get("range") or "-3.14 3.14", 2)
                joints.append({"name": j.get("name"), "axis": axis, "springref": spring, "range": tuple(rng)})
            geoms = []
            for g in b.findall("geom"):
                if g.get("mesh") and (g.get("class") or "") not in ("collision", "adhesion-collision", "collision-membrane"):
                    geoms.append({"mesh": g.get("mesh"), "pos": vec(g.get("pos")),
                                  "R": quat_to_mat(vec(g.get("quat"), 4)) if g.get("quat") else np.eye(3)})
            self.bodies[b.get("name")] = {
                "parent": parent, "pos": vec(b.get("pos")),
                "R": quat_to_mat(vec(b.get("quat"), 4)) if b.get("quat") else np.eye(3),
                "joints": joints, "geoms": geoms,
            }
            for c in b.findall("body"):
                walk(c, b.get("name"), cls)
        for b in root.find("worldbody").findall("body"):
            walk(b, None, None)

    def rest_pose(self):
        return {j["name"]: j["springref"] for b in self.bodies.values() for j in b["joints"]}

    def joint(self, name):
        return next(j for b in self.bodies.values() for j in b["joints"] if j["name"] == name)

    def chain(self, body):
        """Body names from the root down to `body`."""
        out = [body]
        while self.bodies[out[-1]]["parent"] is not None:
            out.append(self.bodies[out[-1]]["parent"])
        return out[::-1]

    def place(self, chain, qpos):
        """World position of the last body of a chain (cheaper than full kinematics)."""
        R, p = np.eye(3), np.zeros(3)
        for name in chain:
            b = self.bodies[name]
            p = p + R @ b["pos"]
            R = R @ b["R"]
            for j in b["joints"]:
                R = R @ axis_angle(j["axis"], qpos.get(j["name"], 0.0))
        return p

    def kinematics(self, qpos):
        """World rotation and position of every body for joint angles qpos (radians)."""
        world = {}
        for name, b in self.bodies.items():  # parents precede children in document order
            R = b["R"]
            for j in b["joints"]:
                R = R @ axis_angle(j["axis"], qpos.get(j["name"], 0.0))
            if b["parent"] is None:
                world[name] = (R, b["pos"])
            else:
                PR, Pp = world[b["parent"]]
                world[name] = (PR @ R, Pp + PR @ b["pos"])
        return world


def load_obj(path):
    """Vertices and triangle faces of an OBJ, cached as .npz."""
    cache = path.with_suffix(".npz")
    if cache.exists():
        d = np.load(cache)
        return d["v"], d["f"]
    vs, fs = [], []
    with open(path, "r", encoding="utf-8", errors="ignore") as fh:
        for line in fh:
            if line.startswith("v "):
                vs.append(line[2:].split()[:3])
            elif line.startswith("f "):
                idx = [int(t.split("/")[0]) for t in line[2:].split()]
                for k in range(1, len(idx) - 1):  # fan-triangulate polygons
                    fs.append((idx[0], idx[k], idx[k + 1]))
    v = np.array(vs, float)
    f = np.array(fs, np.int64)
    f = np.where(f > 0, f - 1, f + len(v))
    np.savez_compressed(cache, v=v, f=f)
    return v, f


# ---------- views ----------

# Each view maps world (x forward, y left, z up) to image (u right, v up) and a depth
# (larger = nearer the viewer, drawn later).
VIEWS = {
    "dorsal": lambda p: (-p[:, 1], p[:, 0], p[:, 2]),     # from above, head up
    "lateral": lambda p: (p[:, 0], p[:, 2], -p[:, 1]),    # from the fly's right side, head right
    "frontal": lambda p: (p[:, 1], p[:, 2], p[:, 0]),     # facing the fly
}


class Fly:
    def __init__(self):
        xml = fetch("fruitfly.xml")
        self.model = Model(xml)
        self.parts = part_table()
        self.meshes = {}
        for part, (names, _) in self.parts.items():
            for n in names:
                v, f = load_obj(fetch(self.model.mesh_files[n]))
                self.meshes[n] = (v * self.model.mesh_scale, f)
        self.geom_body = {g["mesh"]: (bname, g) for bname, b in self.model.bodies.items() for g in b["geoms"]}

    def world_vertices(self, qpos):
        world = self.model.kinematics(qpos)
        out = {}
        for part, (names, style) in self.parts.items():
            pieces = []
            for n in names:
                bname, g = self.geom_body[n]
                R, p = world[bname]
                v, f = self.meshes[n]
                pieces.append((p + (v @ g["R"].T + g["pos"]) @ R.T, f))
            out[part] = pieces
        return out, world


# ---------- tracing ----------

def rasterise(pieces, view, frame, res):
    """Filled silhouette of a part, as a float mask at res px per world unit."""
    u0, v0, u1, v1 = frame
    W, H = int((u1 - u0) * res) + 1, int((v1 - v0) * res) + 1
    img = Image.new("L", (W, H), 0)
    draw = ImageDraw.Draw(img)
    for verts, faces in pieces:
        u, v, _ = VIEWS[view](verts)
        X = (u - u0) * res
        Y = (v1 - v) * res
        tri = np.stack([X[faces], Y[faces]], axis=-1)  # (n, 3, 2)
        area = (tri[:, 1, 0] - tri[:, 0, 0]) * (tri[:, 2, 1] - tri[:, 0, 1]) - (tri[:, 2, 0] - tri[:, 0, 0]) * (tri[:, 1, 1] - tri[:, 0, 1])
        for t in tri[np.abs(area) > 0.02]:   # skip degenerate and edge-on faces; both windings fill
            draw.polygon([tuple(t[0]), tuple(t[1]), tuple(t[2])], fill=255)
    return np.asarray(img, np.float32) / 255.0


def trace(mask, res, frame, smooth_px, simplify, min_area_px=30.0):
    """Outer outlines (and holes) of a mask as smoothed polygons in image units."""
    u0, v0, u1, v1 = frame
    m = gaussian_filter(mask, smooth_px)
    contours = find_contours(np.pad(m, 2), 0.5)
    polys = []
    for c in contours:
        if len(c) < 8:
            continue
        xy = np.c_[(c[:, 1] - 2) / res + u0, v1 - (c[:, 0] - 2) / res]
        poly = Polygon(xy)
        if not poly.is_valid:
            poly = poly.buffer(0)
            if poly.geom_type != "Polygon":
                continue
        if abs(poly.area) * res * res < min_area_px:
            continue
        polys.append(poly.simplify(simplify))
    return polys


def smooth_path(coords, scale, tension=0.5):
    """Closed Catmull-Rom spline through the points, as SVG cubic Béziers."""
    p = np.asarray(coords[:-1] if np.allclose(coords[0], coords[-1]) else coords, float) * scale
    n = len(p)
    if n < 3:
        return ""
    d = [f"M{p[0][0]:.1f},{-p[0][1]:.1f}"]
    for i in range(n):
        p0, p1, p2, p3 = p[i - 1], p[i], p[(i + 1) % n], p[(i + 2) % n]
        c1 = p1 + (p2 - p0) * tension / 3
        c2 = p2 - (p3 - p1) * tension / 3
        d.append(f"C{c1[0]:.1f},{-c1[1]:.1f} {c2[0]:.1f},{-c2[1]:.1f} {p2[0]:.1f},{-p2[1]:.1f}")
    return "".join(d) + "Z"


# ---------- poses (inverse kinematics on the legs) ----------

from scipy.optimize import minimize

GROUND = -0.118                  # cm below the thorax origin: a standing fly's footing
STANCE = {                       # where each foot rests when standing (x forward, |y| out), cm
    "T1": (0.078, 0.078), "T2": (-0.012, 0.118), "T3": (-0.112, 0.098),
}
LEG_JOINTS = ("coxa_abduct", "coxa_twist", "coxa", "femur_twist", "femur", "tibia", "tarsus")


def leg_joint_names(leg):
    s, side = leg.split("_")
    return [f"{j}_{s}_{side}" for j in LEG_JOINTS]


LEG_LINKS = ("femur", "tibia", "tarsus", "tarsus2", "tarsus3", "tarsus4", "claw")


def solve_leg(fly, q, leg, foot, flat=True, avoid=None, start=None, prefer=None):
    """Joint angles that put the foot (claw) on `foot`, within the joint ranges, close to the
    rest pose; with flat=True the tarsus lies along the ground (a number between 0 and 1 blends
    that in). `start` (joint angles) warm-starts the search, so neighbouring frames of a movement
    stay on the same solution; `prefer` (joint angles) replaces the rest pose as the pose to stay
    near, more firmly, so an in-between frame stays between its two end poses. `avoid` is an ellipsoid
    (centre, semi-axes) that no part of the leg may enter: points along every segment are
    pushed out of it, so a raised leg goes round the head instead of through it."""
    m = fly.model
    names = leg_joint_names(leg)
    rest = m.rest_pose()
    x_rest = np.array([rest[n] for n in names])
    bounds = [m.joint(n)["range"] for n in names]
    claw = m.chain(f"claw_{leg}")
    tars = m.chain(f"tarsus_{leg}")
    links = [m.chain(f"{b}_{leg}") for b in LEG_LINKS]
    foot = np.asarray(foot, float)
    along = np.linspace(0, 1, 5)[:, None]

    def cost(x):
        qq = dict(q)
        qq.update(zip(names, x))
        c = 1e6 * np.sum((m.place(claw, qq) - foot) ** 2)          # the foot must land
        if flat:                                                      # tarsus low, along the ground
            c += 1e3 * float(flat) * (m.place(tars, qq)[2] - (foot[2] + 0.02)) ** 2
        if avoid is not None:
            centre, axes = avoid
            joints = np.array([m.place(ch, qq) for ch in links])
            pts = (joints[:-1, None] + along * (joints[1:, None] - joints[:-1, None])).reshape(-1, 3)
            inside = 1.0 - np.sum(((pts - centre) / axes) ** 2, axis=1)
            c += 1e6 * np.sum(np.clip(inside, 0, None) ** 2)
        if prefer is not None:
            return c + 5e-2 * np.sum((x - prefer) ** 2)
        return c + 2e-3 * np.sum((x - x_rest) ** 2)

    best = None
    starts = [np.array([q[n] for n in names]), x_rest]
    if start is not None:
        starts.insert(0, np.asarray(start, float))
    if prefer is not None:
        prefer = np.asarray(prefer, float)
        starts.insert(0, prefer)
    for start in starts:
        r = minimize(cost, np.clip(start, [b[0] for b in bounds], [b[1] for b in bounds]), method="L-BFGS-B", bounds=bounds)
        if best is None or r.fun < best.fun:
            best = r
    q.update(zip(names, best.x))
    return float(np.linalg.norm(m.place(claw, q) - foot))


def stance_foot(leg, dx=0.0, lift=0.0):
    s, side = leg.split("_")
    x, y = STANCE[s]
    return (x + dx, y if side == "left" else -y, GROUND + lift)


def standing(fly):
    q = fly.model.rest_pose()
    for leg in LEGS:
        solve_leg(fly, q, leg, stance_foot(leg))
    return q


def walking(fly, phase, stride=0.07):
    """A tripod gait: T1 and T3 of one side step with T2 of the other. Stance feet slide back
    on the ground; swinging feet lift and move forward."""
    q = standing(fly)
    for leg in LEGS:
        s, side = leg.split("_")
        group = (s in ("T1", "T3")) == (side == "left")
        ph = (phase + (0 if group else math.pi)) % (2 * math.pi)
        if ph < math.pi:   # stance: front to back
            dx, lift = stride * (0.5 - ph / math.pi), 0.0
        else:              # swing: back to front, foot raised
            t = (ph - math.pi) / math.pi
            dx, lift = stride * (t - 0.5), 0.035 * math.sin(math.pi * t)
        solve_leg(fly, q, leg, stance_foot(leg, dx, lift), flat=lift == 0.0)
    return q


def head_obstacle(fly, q, margin=0.011):
    """The posed head and eyes as an ellipsoid (centre, semi-axes) with a margin for the legs'
    own thickness."""
    parts, _ = fly.world_vertices(q)
    v = np.vstack([p for name in ("head", "eye") for p, _ in parts[name]])
    lo, hi = v.min(0), v.max(0)
    return (lo + hi) / 2, (hi - lo) / 2 + margin


GROOM_HEAD = 0.10   # head tipped down while grooming (rad), nodding ±0.04 with the strokes


def groom_foot(side, phase):
    sign, ph = (1, phase) if side == "left" else (-1, phase + math.pi)
    return (0.134 + 0.010 * math.cos(ph), -0.006 * sign, -0.052 + 0.006 * math.sin(ph))


def grooming(fly, phase=0.0):
    """Front-leg rubbing: both front legs raised, the tarsi crossing in front of and below the
    head and sliding past each other, half a cycle apart; the head tipped down a little, nodding
    with the strokes. The head is an obstacle for the legs, so no segment passes through the
    head or eyes in any view."""
    q = standing(fly)
    q["head"] = q.get("head", 0.0) + GROOM_HEAD + 0.04 * math.sin(phase)
    avoid = head_obstacle(fly, q)
    for side in ("left", "right"):
        solve_leg(fly, q, f"T1_{side}", groom_foot(side, phase), flat=False, avoid=avoid)
    for leg in ("T2_left", "T2_right"):   # the middle legs widen a little to brace
        solve_leg(fly, q, leg, stance_foot(leg, 0.01))
    return q


def ease(u):
    u = min(1.0, max(0.0, u))
    return (1 - math.cos(math.pi * u)) / 2


def groom_settle(fly, us):
    """The legs going from the rubbing pose (cycle frame 0, u = 0) back to standing (u = 1), one
    pose per u: each front foot reaches out to its stance spot and is set down last, the left
    leg leading the right a little, while the head comes up and the middle legs close in. Solved
    in order with warm starts, so the frames form one continuous movement. Played forwards it is
    the end of a bout; backwards, the start."""
    g, st = grooming(fly, 0.0), standing(fly)
    joints = {leg: (np.array([g[n] for n in leg_joint_names(leg)]), np.array([st[n] for n in leg_joint_names(leg)]))
              for leg in ("T1_left", "T1_right")}
    out, prev = [], {}
    for u in sorted(us):
        q = standing(fly)
        lag = {"left": u / 0.75, "right": (u - 0.15) / 0.75}
        q["head"] = q.get("head", 0.0) + GROOM_HEAD * (1 - ease(u))
        avoid = head_obstacle(fly, q)
        for side in ("left", "right"):
            leg = f"T1_{side}"
            a, b = np.array(groom_foot(side, 0.0)), np.array(stance_foot(leg))
            e = ease(lag[side])
            foot = a + (b - a) * e
            foot[2] = a[2] + (b[2] - a[2]) * e ** 1.6          # out first, down last
            ja, jb = joints[leg]
            solve_leg(fly, q, leg, foot, flat=e ** 3, avoid=avoid, start=prev.get(leg), prefer=ja + (jb - ja) * e)
            prev[leg] = [q[n] for n in leg_joint_names(leg)]
        for leg in ("T2_left", "T2_right"):
            solve_leg(fly, q, leg, stance_foot(leg, 0.01 * (1 - ease(u))))
        out.append((u, q))
    return [q for _, q in sorted(out, key=lambda t: us.index(t[0]))]


# On twos: raising takes half a second, settling back nearly a second (the legs slow as they
# come down, and both feet are down a frame or two before the sequence ends).
GROOM_IN = [k / 7 for k in range(6, 0, -1)]     # standing → rubbing, then cycle frame 0
GROOM_OUT = [k / 11 for k in range(11)]         # cycle frame 0 → standing


# ---------- drawing ----------

STYLE = {  # style attributes, so they travel into <use> instances and resolve against the page
    "body": "fill:var(--fly-wash,#E7E0D1);stroke:var(--fly-ink,#2B2A27)",
    "eye": "fill:var(--fly-eye,#D7A089);stroke:var(--fly-ink,#2B2A27)",
    "wing": "fill:var(--fly-wing,rgba(255,255,255,.38));stroke:var(--fly-ink,#2B2A27)",
    "vein": "fill:var(--fly-ink,#2B2A27);fill-opacity:.28;stroke:none",
    "antenna-light": "fill:var(--fly-wash,#E7E0D1);stroke:var(--fly-ink,#2B2A27);stroke-opacity:.45",
}
ANTENNA_SCALE = {"frontal": 0.72}   # smaller antennae from the front, so the face doesn't read as one


def pose_vertices(fly, qpos, view):
    parts, world = fly.world_vertices(qpos)
    k = ANTENNA_SCALE.get(view)
    if k:
        for side in ("left", "right"):
            origin = world[f"antenna_{side}"][1]
            parts[f"antenna_{side}"] = [(origin + (v - origin) * k, f) for v, f in parts[f"antenna_{side}"]]
    return parts


def bounds(parts, view):
    allv = np.vstack([v for pieces in parts.values() for v, _ in pieces])
    u, v, _ = VIEWS[view](allv)
    return u.min(), v.min(), u.max(), v.max()


def trace_pose(fly, parts, view, frame, res=900.0):
    """Every part of one posed fly, traced: [(depth, name, style, polygons)], painter's order."""
    drawn = []
    for name, pieces in parts.items():
        style = fly.parts[name][1]
        if view == "frontal" and name.startswith("antenna"):
            style = "antenna-light"
        verts = np.vstack([p for p, _ in pieces])
        depth = float(np.mean(VIEWS[view](verts)[2]))
        mask = rasterise(pieces, view, frame, res)
        if mask.max() == 0:
            continue
        thin = style == "vein"
        polys = trace(mask, res, frame, smooth_px=0.6 if thin else 1.6, simplify=(0.6 if thin else 1.4) / res,
                      min_area_px=6 if thin else 30)
        if polys:
            drawn.append([depth + {"wing": 0.004, "vein": 0.0041}.get(style, 0.0), name, style, polys])
    head = next((t[0] for t in drawn if t[1] == "head"), None)
    if head is not None:
        for t in drawn:   # the eyes are part of the head's surface; antennae sit on the face
            if t[1] == "eye" or (t[1].startswith("antenna") and view != "lateral"):
                t[0] = max(t[0], head + (1e-4 if t[1] == "eye" else 2e-4))
    drawn.sort(key=lambda t: t[0])
    return drawn


def paths(drawn, scale):
    """One <path> element per drawn part, back to front."""
    out = []
    for _, name, style, polys in drawn:
        d = "".join(smooth_path(np.asarray(pl.exterior.coords), scale) + "".join(
            smooth_path(np.asarray(h.coords), scale) for h in pl.interiors) for pl in polys)
        out.append(f'<path data-part="{name}" fill-rule="evenodd" vector-effect="non-scaling-stroke" style="{STYLES[style]}" d="{d}"/>')
    return out


def share_paths(view, frames):
    """Frames as SVG groups, with every part drawing that recurs unchanged across frames (the body,
    wings and abdomen while only the legs move) written once and placed with <use>. Keeps the
    sprite small after gzip, whose 32 KB window can't see repeats a whole frame apart."""
    counts = {}
    for els in frames.values():
        for el in els:
            counts[el] = counts.get(el, 0) + 1
    ids, shared = {}, []
    for els in frames.values():
        for el in els:
            if counts[el] > 1 and el not in ids:
                ids[el] = f"fly-{view}-p{len(ids)}"
                shared.append(el.replace("<path ", f'<path id="{ids[el]}" ', 1))
    groups = [f'<g id="{fid}" stroke-linejoin="round">'
              + "".join(f'<use href="#{ids[el]}"/>' if el in ids else el for el in els) + "</g>"
              for fid, els in frames.items()]
    return shared + groups


STYLES = STYLE

# Frame sequences per view. Walking and grooming are played as drawn frames, on twos.
CYCLE = 8
GROOM_SEQS = {
    "groom": [lambda fly, k=k: grooming(fly, 2 * math.pi * k / CYCLE) for k in range(CYCLE)],
    "groom_in": lambda fly: groom_settle(fly, GROOM_IN),     # a whole sequence, solved in order
    "groom_out": lambda fly: groom_settle(fly, GROOM_OUT),
}
SEQUENCES = {
    "dorsal": {"stand": [standing], **GROOM_SEQS},
    "lateral": {"stand": [standing],
                "walk": [lambda fly, k=k: walking(fly, 2 * math.pi * k / CYCLE) for k in range(CYCLE)],
                **GROOM_SEQS},
    "frontal": {"stand": [standing]},
}
SCALE = 1000.0   # SVG units per world unit (cm): 1 unit = 10 µm


def write_sprite(fly, view, seqs):
    """One SVG sprite per view: each frame a <g id> in <defs> (recurring parts shared, see
    share_paths), all in one coordinate frame (the thorax origin at 0,0), so frames line up and <use href="#fly-lateral-walk-3"> inside an <svg>
    with the sprite's viewBox draws a frame in place. Stroke width is left to the page (it is
    inherited through <use>), so small flies can be drawn with finer lines."""
    posed = {name: [pose_vertices(fly, q, view) for q in (fns(fly) if callable(fns) else [f(fly) for f in fns])]
             for name, fns in seqs.items()}
    bs = [bounds(p, view) for frames in posed.values() for p in frames]
    pad = 0.012
    frame = (min(b[0] for b in bs) - pad, min(b[1] for b in bs) - pad, max(b[2] for b in bs) + pad, max(b[3] for b in bs) + pad)
    vb = f"{frame[0] * SCALE:.1f} {-frame[3] * SCALE:.1f} {(frame[2] - frame[0]) * SCALE:.1f} {(frame[3] - frame[1]) * SCALE:.1f}"
    drawn = {f"fly-{view}-{name}-{k}": paths(trace_pose(fly, parts, view, frame), SCALE)
             for name, frames in posed.items() for k, parts in enumerate(frames)}
    symbols = share_paths(view, drawn)
    meta = {
        "view": view, "viewBox": vb, "unitsPerCm": SCALE, "frames": {n: len(f) for n, f in posed.items()},
        "groundY": round(-GROUND * SCALE, 1) if view != "dorsal" else None,
        "strideUnits": round(0.07 * SCALE, 1), "fps": 12,
        "source": f"flybody {FLYBODY_COMMIT[:10]} (Vaxenburg et al. 2025, Nature; Apache-2.0), simplified",
    }
    path = OUT / f"fly-{view}.svg"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" data-meta=\'{json.dumps(meta)}\'>\n'
                    f'<!-- Drawn from the flybody model (Vaxenburg et al. 2025, Nature; Apache-2.0), simplified. -->\n'
                    + "<defs>\n" + "\n".join(symbols) + "\n</defs>\n</svg>\n", encoding="utf-8")
    return path, meta


def main(argv) -> int:
    print("flybody", FLYBODY_COMMIT[:10])
    fly = Fly()
    for old in OUT.glob("fly-*-*.svg"):
        old.unlink()   # single-pose files from the first pass
    for view, seqs in SEQUENCES.items():
        path, meta = write_sprite(fly, view, seqs)
        print(f"  wrote {path.relative_to(ROOT)}: {meta['frames']} ({path.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
