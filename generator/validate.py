"""Validation gate: compare every pre-computed result with the case truth table.

Reads site/data/<case>/tables.json (what the site shows) and data/<case>/truth-table.json
(what must be true) and fails on any mismatch. Tolerances come from the truth table; where
counts are small, a band is widened by two standard errors of counting noise, so "same"
means "no difference beyond what the counts can resolve, and never more than the stated
tolerance where they can".

    uv run python -m generator.validate pdf            # warns while the truth table is a draft
    uv run python -m generator.validate pdf --signed   # also fails unless it is signed off
"""

import json
import math
import sys

from .paths import DATA, SITE_DATA

LEVELS = (("bright", 14.0), ("present", 3.0), ("dim", 0.8), ("none", -1.0))


def level_of(x):
    return next(name for name, lo in LEVELS if x >= lo)


class Gate:
    def __init__(self, truth, positions_optional=False):
        self.rules = truth["rules"]
        self.positions_optional = positions_optional  # the seed search screens counts before placing molecules
        self.failures = []
        self.checked = 0
        self.score = 0.0

    def _ok(self, ok, where, msg, dev=0.0):
        self.checked += 1
        self.score += dev * dev
        if not ok:
            self.failures.append(f"{where}: {msg}")

    # ---------- helpers over the tables ----------
    @staticmethod
    def totals(entry, gt, ch):
        raws = [a[ch]["raw"] for a in entry[gt]["animals"]]
        t = {
            "nucleus": sum(c["nucleus"] for r in raws for c in r["cells"]),
            "cellbody": sum(c["cellbody"] for r in raws for c in r["cells"]),
            "axon": sum(r["axon"] for r in raws),
            "terminals": sum(r["terminals"] for r in raws),
            "ts_all": sum(c["ts"] for r in raws for c in r["cells"]),
            "nuclei": sum(len(r["cells"]) for r in raws),
        }
        if "overlap" in raws[0]:
            t["ov"] = [sum(r["overlap"][i] for r in raws) for i in range(3)]
        return t

    @staticmethod
    def mean(entry, gt, ch, f):
        xs = [f(a[ch]["m"]) for a in entry[gt]["animals"]]
        xs = [x for x in xs if x is not None]
        return sum(xs) / len(xs) if xs else None

    def band(self, name):
        return self.rules[name]

    # ---------- checks ----------
    def ratio_rule(self, where, rule, r, se_r):
        if rule == "same":
            tol = max(self.rules["same"], 2 * se_r)
            self._ok(abs(r - 1) <= tol, where, f"mutant/control = {r:.3f}, expected 1 ± {tol:.3f}", (r - 1) / tol)
        elif rule in ("fall", "fall_per_area"):
            lo, hi = self.band(rule)
            a, b = 1 - hi - 2 * se_r, 1 - lo + 2 * se_r
            mid, half = (a + b) / 2, (b - a) / 2
            self._ok(a <= r <= b, where, f"mutant/control = {r:.3f}, expected {a:.3f}–{b:.3f}", (r - mid) / half)
        elif rule == "rise_nc":
            lo, hi = self.band(rule)
            a, b = lo - 2 * se_r, hi + 2 * se_r
            mid, half = (a + b) / 2, (b - a) / 2
            self._ok(a <= r <= b, where, f"mutant/control = {r:.3f}, expected {a:.3f}–{b:.3f}", (r - mid) / half)
        else:
            self._ok(False, where, f"unknown rule {rule}")

    def check(self, key, entry, e, ts_levels):
        ch = e["channel"]
        where = f"{key} {ch} {e['measure']}" + (f" {e['compartment']}" if "compartment" in e else "") + (f" {e['pool']}" if "pool" in e else "")
        meas = e["measure"]

        if meas == "region_ratio":
            pools = {"whole_cell": ("nucleus", "cellbody"), "distal": ("axon", "terminals")}[e["pool"]]
            v = {}
            for gt in ("control", "mutant"):
                A = sum(self.totals(entry, gt, "ch1")[p] for p in pools)
                B = sum(self.totals(entry, gt, "ch2")[p] for p in pools)
                v[gt] = (A, B)
            (Ac, Bc), (Am, Bm) = v["control"], v["mutant"]
            if min(Ac, Bc, Am, Bm) == 0:
                self._ok(False, where, f"empty pool (control {Ac}/{Bc}, mutant {Am}/{Bm})")
                return
            rc, rm = Bc / Ac, Bm / Am
            se = math.sqrt(1 / Bc + 1 / Ac + 1 / Bm + 1 / Am)
            self.ratio_rule(where, e["rule"], rm / rc, (rm / rc) * se)
            tol = max(self.rules["nominal"], 2 * math.sqrt(1 / Bc + 1 / Ac))
            nom = e["nominal_control"]
            self._ok(abs(rc / nom - 1) <= tol, where + " (control)", f"ratio {rc:.3f}, expected {nom:.3f} ± {tol:.0%}", (rc / nom - 1) / tol)
            return

        tc, tm = self.totals(entry, "control", ch), self.totals(entry, "mutant", ch)

        if meas == "count":
            comp = e["compartment"]
            nc, nm = tc[comp], tm[comp]
            if e["rule"] == "none":
                self._ok(nc == 0 and nm == 0, where, f"expected no spots, found control {nc}, mutant {nm}")
                return
            c = self.mean(entry, "control", ch, lambda m: m["count"][comp])
            mu = self.mean(entry, "mutant", ch, lambda m: m["count"][comp])
            if not nc or not nm:
                self._ok(False, where, f"no spots (control {nc}, mutant {nm})")
                return
            r = mu / c
            self.ratio_rule(where, e["rule"], r, r * math.sqrt(1 / nc + 1 / nm))
            if "nominal_control" in e:
                nom = e["nominal_control"]
                tol = max(self.rules["nominal"], 2 / math.sqrt(nc))
                self._ok(abs(c / nom - 1) <= tol, where + " (control)", f"mean {c:.2f}, expected {nom:g} ± {tol:.0%}", (c / nom - 1) / tol)
        elif meas == "per_area":
            c = self.mean(entry, "control", ch, lambda m: m["per_area"])
            mu = self.mean(entry, "mutant", ch, lambda m: m["per_area"])
            nc, nm = tc["terminals"], tm["terminals"]
            r = mu / c
            self.ratio_rule(where, e["rule"], r, r * math.sqrt(1 / nc + 1 / nm))
        elif meas == "nc_ratio":
            r = (tm["nucleus"] / tm["cellbody"]) / (tc["nucleus"] / tc["cellbody"])
            se = math.sqrt(sum(1 / x for x in (tm["nucleus"], tm["cellbody"], tc["nucleus"], tc["cellbody"])))
            self.ratio_rule(where, e["rule"], r, r * se)
        elif meas == "share_distal":
            def p(t):
                d = t["axon"] + t["terminals"]
                return d / (t["cellbody"] + d), t["cellbody"] + d
            (pc, nc), (pm, nm) = p(tc), p(tm)
            r = pm / pc
            se = math.sqrt((1 - pm) / (pm * nm) + (1 - pc) / (pc * nc))
            self.ratio_rule(where, e["rule"], r, r * se)
        elif meas == "overlap":
            if "ov" not in tc:
                if not self.positions_optional:
                    self._ok(False, where, "no overlap results (molecules were not placed)")
                return
            for gt, t in (("control", tc), ("mutant", tm)):
                k, n, expected = t["ov"]
                if n == 0:
                    continue
                obs, q = k / n, expected / n
                tol = max(self.rules["chance"], 2 * math.sqrt(max(q * (1 - q), 1e-9) / n))
                self._ok(abs(obs - q) <= tol, f"{where} {gt}", f"overlap {obs:.3f} vs randomised {q:.3f} (± {tol:.3f})", (obs - q) / tol)
        elif meas == "ts_number":
            a = sum(x[ch]["m"]["ts_number"] for x in entry["control"]["animals"])
            b = sum(x[ch]["m"]["ts_number"] for x in entry["mutant"]["animals"])
            tol = self.rules["ts_number"]
            self._ok(abs(a - b) <= tol, where, f"control {a}, mutant {b} sites (± {tol})", (a - b) / max(tol, 1))
        elif meas == "ts_intensity":
            def sites(gt):
                xs = [(x[ch]["m"]["ts_number"], x[ch]["m"]["ts_intensity"]) for x in entry[gt]["animals"]]
                n = sum(k for k, _ in xs)
                mol = sum(k * v for k, v in xs if v is not None)
                return n, mol
            (sc, mc), (sm, mm) = sites("control"), sites("mutant")
            if sc < 3 or sm < 3:
                return  # too few sites to compare brightness (dim or absent by design)
            r = (mm / sm) / (mc / sc)
            dim = ts_levels.get(ch) in ("dim", "none") or mc / sc < 5
            tol = max(self.rules["ts_intensity"] * (2 if dim else 1), 2 * math.sqrt(1 / mm + 1 / mc))
            self._ok(abs(r - 1) <= tol, where, f"mutant/control = {r:.3f}, expected 1 ± {tol:.3f}", (r - 1) / tol)
        elif meas == "ts_level":
            for gt, t in (("control", tc), ("mutant", tm)):
                x = t["ts_all"] / t["nuclei"]
                got = level_of(x)
                self._ok(got == e["level"], f"{where} {gt}", f"{x:.2f} nascent molecules per nucleus reads as '{got}', expected '{e['level']}'")
        elif meas == "other_gene":
            self._ok(False, where, "other-gene molecules are not modelled for this case yet")
        else:
            self._ok(False, where, f"unknown measure {meas}")


def run(tables: dict, truth: dict, positions_optional=False) -> Gate:
    gate = Gate(truth, positions_optional)
    for key, sel in truth["selections"].items():
        entry = tables["selections"].get(key)
        if entry is None:
            gate._ok(False, key, "missing from the pre-computed tables")
            continue
        levels = {e["channel"]: e["level"] for e in sel["expect"] if e["measure"] == "ts_level"}
        for e in sel["expect"]:
            gate.check(key, entry, e, levels)
    return gate


def main(argv) -> int:
    signed = "--signed" in argv
    cases = [a for a in argv if not a.startswith("--")] or ["pdf"]
    status = 0
    for case in cases:
        truth = json.loads((DATA / case / "truth-table.json").read_text(encoding="utf-8"))
        tables = json.loads((SITE_DATA / case / "tables.json").read_text(encoding="utf-8"))
        gate = run(tables, truth)
        print(f"{case}: {gate.checked} checks, {len(gate.failures)} failed (seed {tables.get('seed')})")
        for f in gate.failures[:40]:
            print("  FAIL", f)
        if gate.failures:
            status = 1
        if truth["status"] != "signed-off":
            msg = f"{case}: the truth table is a {truth['status']}, not signed off by the instructor"
            if signed:
                print("  FAIL", msg)
                status = 1
            else:
                print("  note:", msg)
    return status


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
