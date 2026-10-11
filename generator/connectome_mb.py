"""Kenyon-cell skeletons from the public MaleCNS v0.9 release, for the mushroom body geometry.

Source: Janelia FlyEM male CNS v0.9 (public Google Cloud Storage bucket `flyem-male-cns`, no
token). This script:
  1. downloads the body-id -> cell-type table and the soma-point annotations (a sharded
     neuroglancer precomputed annotation set, decoded here by hand) into
     data/mb/connectome/ (not committed);
  2. keeps the Kenyon cells of three classes (ab, a'b', g), splits the hemispheres by soma x
     and takes ONE hemisphere (the one with the smaller x): a seeded selection of 150 cells per
     class for outlines, 10 of each of which are the "simulated" cells;
  3. downloads those 450 neuroglancer precomputed skeletons (sequentially, politely) and writes
     data/mb/connectome/kc.json in micrometres;
  4. offers load(), rotation(), project() and sheet() to the geometry module.

Downloaded data is untrusted: it is only ever parsed as JSON or with struct, never executed.

    uv run python -m generator.connectome_mb            # download (cached) and write kc.json, sweep.png
"""

import gzip
import json
import random
import struct
import sys
import time
import urllib.error
import urllib.request

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from .paths import DATA

RELEASE = "MaleCNS v0.9"
BASE = "https://storage.googleapis.com/flyem-male-cns/v0.9/"
TYPES_URL = BASE + "segmentation/combined_properties/info"
SKEL_URL = BASE + "segmentation/skeletons-malecns/skeletons-precomputed/{}"
SOMA_BASE = BASE + "malecns-v0.9-soma-points/"

CACHE = DATA / "mb" / "connectome"
OUT = CACHE / "kc.json"
SWEEP = CACHE / "sweep.png"

CLASSES = {
    "ab": ["KCab-s", "KCab-m", "KCab-c", "KCab-p"],
    "apbp": ["KCa'b'-ap1", "KCa'b'-ap2", "KCa'b'-m"],
    "g": ["KCg-m", "KCg-d"],
}
TYPE_TO_CLASS = {t: c for c, ts in CLASSES.items() for t in ts}
N_OUTLINE, N_SIM, SEED = 150, 10, 20260512
COLOURS = {"ab": (46, 110, 200), "apbp": (225, 128, 30), "g": (46, 150, 80)}
VOXEL_UM = 0.008  # soma points are in 8 nm voxels


# ----- downloading -------------------------------------------------------------------------

def fetch(url, dest, retries=4, timeout=60):
    """Download url to dest unless it is already there; returns the bytes."""
    if dest.exists():
        return dest.read_bytes()
    dest.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(url, timeout=timeout) as r:
                data = r.read()
            dest.write_bytes(data)
            return data
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            if attempt == retries - 1:
                raise
            time.sleep(2 ** attempt)


# ----- neuroglancer sharded annotations (soma points) --------------------------------------

def murmur3_x86_128(data, seed=0):
    """MurmurHash3 x86 128-bit, as neuroglancer's sharding uses; returns 16 bytes."""
    M = 0xFFFFFFFF
    c1, c2, c3, c4 = 0x239B961B, 0xAB0E9789, 0x38B34AE5, 0xA1E38B93
    rotl = lambda x, r: ((x << r) | (x >> (32 - r))) & M
    fmix = lambda h: ((lambda h: ((lambda h: h ^ (h >> 16))((((h ^ (h >> 13)) * 0xC2B2AE35) & M))))(
        (((h ^ (h >> 16)) * 0x85EBCA6B) & M)))
    h1 = h2 = h3 = h4 = seed
    n = len(data)
    nb = n // 16
    for i in range(nb):
        k1, k2, k3, k4 = struct.unpack_from("<4I", data, i * 16)
        k1 = rotl(k1 * c1 & M, 15) * c2 & M
        h1 ^= k1
        h1 = (rotl(h1, 19) + h2) & M
        h1 = (h1 * 5 + 0x561CCD1B) & M
        k2 = rotl(k2 * c2 & M, 16) * c3 & M
        h2 ^= k2
        h2 = (rotl(h2, 17) + h3) & M
        h2 = (h2 * 5 + 0x0BCAA747) & M
        k3 = rotl(k3 * c3 & M, 17) * c4 & M
        h3 ^= k3
        h3 = (rotl(h3, 15) + h4) & M
        h3 = (h3 * 5 + 0x96CD1C35) & M
        k4 = rotl(k4 * c4 & M, 18) * c1 & M
        h4 ^= k4
        h4 = (rotl(h4, 13) + h1) & M
        h4 = (h4 * 5 + 0x32AC3B17) & M
    tail = data[nb * 16:] + b"\0" * 16
    k1, k2, k3, k4 = struct.unpack_from("<4I", tail, 0)
    t = n & 15
    if t > 12:
        h4 ^= rotl(k4 * c4 & M, 18) * c1 & M
    if t > 8:
        h3 ^= rotl(k3 * c3 & M, 17) * c4 & M
    if t > 4:
        h2 ^= rotl(k2 * c2 & M, 16) * c3 & M
    if t > 0:
        h1 ^= rotl(k1 * c1 & M, 15) * c2 & M
    h1 ^= n; h2 ^= n; h3 ^= n; h4 ^= n
    h1 = (h1 + h2 + h3 + h4) & M
    h2 = (h2 + h1) & M; h3 = (h3 + h1) & M; h4 = (h4 + h1) & M
    h1, h2, h3, h4 = fmix(h1), fmix(h2), fmix(h3), fmix(h4)
    h1 = (h1 + h2 + h3 + h4) & M
    h2 = (h2 + h1) & M; h3 = (h3 + h1) & M; h4 = (h4 + h1) & M
    return struct.pack("<4I", h1, h2, h3, h4)


class Shard:
    """One neuroglancer_uint64_sharded_v1 shard held in memory (gzip data and index)."""

    def __init__(self, blob, spec):
        self.blob, self.spec = blob, spec
        self.mbits = spec["minishard_bits"]
        self.pre = spec["preshift_bits"]
        self.header = 16 * (1 << self.mbits)
        self.cache = {}

    def _minishard(self, m):
        if m in self.cache:
            return self.cache[m]
        start, end = struct.unpack_from("<2Q", self.blob, 16 * m)
        entries = {}
        if end > start:
            raw = gzip.decompress(self.blob[self.header + start:self.header + end])
            n = len(raw) // 24
            a = np.frombuffer(raw, dtype="<u8").reshape(3, n)
            ids = np.cumsum(a[0], dtype=np.uint64)
            offs = np.cumsum(a[1] + np.concatenate(([0], a[2][:-1])).astype(np.uint64), dtype=np.uint64)
            for i, o, s in zip(ids.tolist(), offs.tolist(), a[2].tolist()):
                entries[i] = (o, s)
        self.cache[m] = entries
        return entries

    def get(self, key):
        h = struct.unpack("<Q", murmur3_x86_128(struct.pack("<Q", key >> self.pre))[:8])[0]
        m = h & ((1 << self.mbits) - 1)
        hit = self._minishard(m).get(key)
        if hit is None:
            return None
        o, s = hit
        return gzip.decompress(self.blob[self.header + o:self.header + o + s])


def decode_annotations(buf, props):
    """Point annotations: uint64 count, records (3 x float32 + properties, padded to 4), ids."""
    (count,) = struct.unpack_from("<Q", buf, 0)
    sizes = {"uint8": 1, "int8": 1, "uint16": 2, "int16": 2, "uint32": 4, "int32": 4, "float32": 4}
    fmts = {"uint8": "B", "int8": "b", "uint16": "H", "int16": "h", "uint32": "I", "int32": "i", "float32": "f"}
    order = sorted(props, key=lambda p: -sizes[p["type"]])
    fmt = "<3f" + "".join(fmts[p["type"]] for p in order)
    size = struct.calcsize(fmt)
    size += (-size) % 4
    out = []
    for i in range(count):
        v = struct.unpack_from(fmt, buf, 8 + i * size)
        out.append({"point": v[:3], **{p["id"]: v[3 + j] for j, p in enumerate(order)}})
    return out


def soma_points(ids):
    """body id -> soma position in micrometres (nucleus point if there is one), or None."""
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


# ----- skeletons ---------------------------------------------------------------------------

def parse_skeleton(blob):
    """neuroglancer precomputed skeleton -> (vertices in um as float64 (n, 3), edges (m, 2))."""
    nv, ne = struct.unpack_from("<2I", blob, 0)
    if len(blob) < 8 + 12 * nv + 8 * ne:
        raise ValueError("truncated skeleton")
    v = np.frombuffer(blob, dtype="<f4", count=3 * nv, offset=8).reshape(nv, 3).astype(float) / 1000.0
    e = np.frombuffer(blob, dtype="<u4", count=2 * ne, offset=8 + 12 * nv).reshape(ne, 2)
    return v, e


def build():
    CACHE.mkdir(parents=True, exist_ok=True)
    info = json.loads(fetch(TYPES_URL, CACHE / "types-info.json"))["inline"]
    types = next(p for p in info["properties"] if p["id"] == "type")["values"]
    kc = {b: TYPE_TO_CLASS[t] for b, t in zip(info["ids"], types) if t in TYPE_TO_CLASS}
    kc_type = {b: t for b, t in zip(info["ids"], types) if t in TYPE_TO_CLASS}
    print(f"Kenyon cells of the three classes: {len(kc)}")

    soma = soma_points(list(kc))
    have = {b: s for b, s in soma.items() if s}
    print(f"soma points found: {len(have)} of {len(kc)}")
    xs = np.sort([s[0] for s in have.values()])
    gap = int(np.argmax(np.diff(xs)))
    split = float((xs[gap] + xs[gap + 1]) / 2)
    print(f"hemisphere split by soma x at {split:.1f} um (gap {xs[gap + 1] - xs[gap]:.1f} um)")
    side = {b: (s[0] < split) for b, s in have.items()}
    hemi = "x < %.0f (smaller x)" % split
    pool = {c: sorted(b for b in have if kc[b] == c and side[b]) for c in CLASSES}

    rng = random.Random(SEED)
    cells = []
    for c in CLASSES:
        pick = rng.sample(pool[c], N_OUTLINE)
        for i, b in enumerate(pick):
            cells.append((b, c, i < N_SIM))
    print("pool per class:", {c: len(p) for c, p in pool.items()})

    total, out = 0, []
    for n, (b, c, sim) in enumerate(cells, 1):
        path = CACHE / "skeletons" / b
        fresh = not path.exists()
        blob = fetch(SKEL_URL.format(b), path)
        total += len(blob)
        v, e = parse_skeleton(blob)
        out.append({
            "id": b, "type": kc_type[b], "class": c, "simulated": sim, "soma": have[b],
            "vertices": np.round(v, 2).tolist(), "edges": e.tolist(),
        })
        if fresh:
            time.sleep(0.05)
        if n % 50 == 0:
            print(f"  {n}/{len(cells)} skeletons")
    OUT.write_text(json.dumps({
        "source": "https://storage.googleapis.com/flyem-male-cns/v0.9/ (Janelia FlyEM male CNS, public)",
        "release": RELEASE, "hemisphere": hemi, "units": "µm", "cells": out,
    }, ensure_ascii=False, separators=(",", ":")))
    return out, total


# ----- geometry helpers for the lead's module ----------------------------------------------

def load():
    """Read kc.json (written by build())."""
    return json.loads(OUT.read_text())


def rotation(tilt, turn):
    """Rx(tilt) @ Ry(turn), angles in degrees. Frontal = (0, 0), looking along z."""
    a, b = np.radians(tilt), np.radians(turn)
    rx = np.array([[1, 0, 0], [0, np.cos(a), -np.sin(a)], [0, np.sin(a), np.cos(a)]])
    ry = np.array([[np.cos(b), 0, np.sin(b)], [0, 1, 0], [-np.sin(b), 0, np.cos(b)]])
    return rx @ ry


def project(points, tilt, turn, centre):
    """3D points (n, 3) in um -> 2D um (n, 2): centre, rotate, then x to the right, y down."""
    p = (np.asarray(points, float) - np.asarray(centre, float)) @ rotation(tilt, turn).T
    return p[:, :2]


def centre_of(cells):
    return np.concatenate([np.asarray(c["vertices"]) for c in cells]).mean(axis=0)


def sheet(path=SWEEP, angles=None):
    """Contact sheet of the simulated cells over a grid of angles (rows tilt, columns turn)."""
    angles = angles or [(t, u) for t in (0, 25, 45, 65) for u in (-30, 0, 30)]
    cells = [c for c in load()["cells"] if c["simulated"]]
    centre = centre_of(cells)
    tilts = sorted({t for t, _ in angles})
    turns = sorted({u for _, u in angles})
    allp = np.concatenate([np.asarray(c["vertices"]) for c in cells])
    r = np.linalg.norm(allp - centre, axis=1).max()
    scale, pad, label_h = 1.6, 20, 26  # px per um
    cell_px = int(2 * r * scale) + 2 * pad
    W, H = cell_px * len(turns), (cell_px + label_h) * len(tilts)
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
    except OSError:
        font = ImageFont.load_default()
    for (t, u) in angles:
        ox = turns.index(u) * cell_px
        oy = tilts.index(t) * (cell_px + label_h)
        d.rectangle([ox, oy, ox + cell_px - 1, oy + cell_px + label_h - 1], outline=(200, 200, 200))
        d.text((ox + 8, oy + 4), f"tilt {t}°  turn {u}°", fill=(30, 30, 30), font=font)
        cx, cy = ox + cell_px / 2, oy + label_h + cell_px / 2
        # depth ordering is not attempted: the strokes are thin and semi-flat
        for c in cells:
            xy = project(c["vertices"], t, u, centre) * scale + (cx, cy)
            for i, j in c["edges"]:
                d.line([tuple(xy[i]), tuple(xy[j])], fill=COLOURS[c["class"]], width=1)
        bx, by = ox + 12, oy + cell_px + label_h - 14
        d.line([bx, by, bx + 20 * scale, by], fill=(0, 0, 0), width=3)
        d.text((bx + 20 * scale + 6, by - 9), "20 µm", fill=(0, 0, 0), font=font)
    img.save(path)
    return path


# ----- command line ------------------------------------------------------------------------

def extents(cells):
    for c in CLASSES:
        v = np.concatenate([np.asarray(x["vertices"]) for x in cells if x["class"] == c])
        print(f"  {c}: extent x/y/z = " + " / ".join(f"{a:.0f}" for a in np.ptp(v, axis=0)) + " um")


def main():
    cells, total = build()
    from collections import Counter
    n = Counter(c["class"] for c in cells)
    s = Counter(c["class"] for c in cells if c["simulated"])
    print("cells per class:", dict(n), "simulated:", dict(s))
    cx = [np.asarray(c["vertices"])[:, 0].mean() for c in cells]
    print(f"skeleton centroid x: {min(cx):.1f} to {max(cx):.1f} um")
    extents(cells)
    size = sum(f.stat().st_size for f in CACHE.rglob("*") if f.is_file())
    print(f"skeleton bytes {total / 1e6:.1f} MB; cache {size / 1e6:.1f} MB in {CACHE}")
    print(f"wrote {OUT} and {sheet()}")


if __name__ == "__main__":
    sys.exit(main())
