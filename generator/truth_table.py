"""Expand a case's truth-table rules into every single probe and all 56 ordered pairs.

Reads data/<case>/truth-table.toml (the instructor's rules) and the probe menu with its
answer key (docs/transcript_models_R6.json: mature_in, nascent_in, also_detects), and writes:
  data/<case>/truth-table.json   machine-readable expectations, read by the validation gate
  data/<case>/truth-table.md     the same, as tables to read and sign off

The expansion uses only the rules and the transcript models, never the generator, so the
gate is an independent check.

    uv run python -m generator.truth_table pdf
"""

import itertools
import json
import math
import sys
import tomllib

from .cases import LAYOUTS
from .paths import CASE_GENES, DATA, TRANSCRIPT_MODELS
from .validate import LEVELS, level_of  # the gate's bands: the look of a site is read from nascent molecules per nucleus

COMPARTMENTS = ("nucleus", "cellbody", "axon", "terminals")
PER_CELL = {"nucleus", "cellbody"}  # per cell; axon and terminals are per animal (shared by the cells)


def load(case: str):
    rules = tomllib.loads((DATA / case / "truth-table.toml").read_text(encoding="utf-8"))
    models = json.loads(TRANSCRIPT_MODELS.read_text(encoding="utf-8"))
    gene = models["genes"][CASE_GENES[case]]
    regions = {r["id"]: r for r in gene["probe_regions"]}
    return rules, regions


def channel_sets(ids, regions):
    """Isoforms whose mature / nascent RNA carries every region in ids (letters, e.g. 'C')."""
    mature = set.intersection(*(set(regions[i]["mature_in"]) for i in ids))
    nascent = set.intersection(*(set(regions[i]["nascent_in"]) for i in ids))
    other = set.intersection(*(set(regions[i]["also_detects"]) for i in ids))
    return mature, nascent, other


def mature_fraction(mature, rules):
    return round(sum(rules["isoforms"]["R" + m] for m in mature), 6)


def channel_expectations(name, ids, regions, rules, single):
    mature, nascent, other = channel_sets(ids, regions)
    f = mature_fraction(mature, rules)
    per_cell = rules["mature_per_cell"]
    out = []
    add = lambda **e: out.append({"channel": name, **e})
    if f > 0:
        for comp in COMPARTMENTS:
            ctrl = per_cell[comp][0] * f * (1 if comp in PER_CELL else 4)
            add(measure="count", compartment=comp, rule=rules["mature"][comp], nominal_control=round(ctrl, 3))
        add(measure="per_area", compartment="terminals", rule=rules["mature"]["terminals_per_area"])
        add(measure="nc_ratio", rule=rules["mature"]["nc_ratio"])
        add(measure="share_distal", rule=rules["mature"]["share_distal"])
        for comp, rule in rules["mature"]["tdp43_overlap"].items():
            add(measure="overlap", compartment=comp, rule=rule)
    else:
        for comp in COMPARTMENTS:
            add(measure="count", compartment=comp, rule="none", note="no spots away from transcription sites")
    if other:
        add(measure="other_gene", rule="present", genes=sorted(other))
    if nascent:
        add(measure="ts_number", rule=rules["nascent"]["ts_number"])
        add(measure="ts_intensity", rule=rules["nascent"]["ts_intensity"])
        if single:
            add(measure="ts_level", rule="level", level=rules["ts"][ids[0]])
    else:
        add(measure="ts_level", rule="level", level="none")
    return out, {"regions": list(ids), "mature": sorted(mature), "nascent": sorted(nascent), "mature_fraction": f}


def mark_key(selections, key):
    """Flag the key readouts: held to the 'same' tolerance with no allowance for noise."""
    singles = {tuple(k.split(":")) for k in key.get("single", [])}
    pairs = {(frozenset(k.split(":")[0].split("+")), *k.split(":")[1:]) for k in key.get("pair", [])}
    for sel_id, sel in selections.items():
        for e in sel["expect"]:
            regions = sel["channels"][e["channel"]]["regions"] if e["channel"] in sel["channels"] else []
            tail = (e["measure"], *([e["compartment"]] if "compartment" in e else []))
            sig = (regions[0], *tail) if len(regions) == 1 else None
            if sig and sig in singles and e["rule"] in ("same", "ratio", "appears"):
                e["key"] = True
            if len(regions) == 2 and (frozenset(regions), e["channel"], *tail) in pairs and e["rule"] in ("same", "ratio", "appears"):
                e["key"] = True
            if e["measure"] == "region_ratio" and e["pool"] == "whole_cell" and sel_id in key.get("region_ratio_whole_cell", []):
                e["key"] = True


def expand(case: str) -> dict:
    rules, regions = load(case)
    if "groups" in rules:
        return expand_groups(case, rules, regions)
    ids = sorted(regions, key=lambda r: int(r[1:]))
    selections = {}

    for a in ids:
        exp, info = channel_expectations("ch1", (a,), regions, rules, single=True)
        selections[a] = {"channels": {"ch1": info}, "expect": exp}

    for a, b in itertools.permutations(ids, 2):
        e1, i1 = channel_expectations("ch1", (a,), regions, rules, single=True)
        e2, i2 = channel_expectations("ch2", (b,), regions, rules, single=True)
        eb, ib = channel_expectations("both", (a, b), regions, rules, single=False)
        exp = e1 + e2 + eb
        if i1["mature_fraction"] > 0 and i2["mature_fraction"] > 0:
            for pool in ("whole_cell", "distal"):
                exp.append({"channel": "ratio", "measure": "region_ratio", "pool": pool, "rule": rules["mature"]["region_ratio"],
                            "nominal_control": round(i2["mature_fraction"] / i1["mature_fraction"], 4)})
        selections[f"{a}+{b}"] = {"channels": {"ch1": i1, "ch2": i2, "both": ib}, "expect": exp}

    mark_key(selections, rules.get("key", {}))
    return {
        "case": case,
        "gene": rules["gene"],
        "status": rules["status"],
        "signed_off_by": rules["signed_off_by"],
        "signed_off_on": rules["signed_off_on"],
        "source": f"data/{case}/truth-table.toml",
        "verdicts": rules["verdicts"],
        "rules": rules["rules"],
        "selections": selections,
    }


# ---------- group model (cases whose isoforms fall into groups with their own production change) ----------


def group_fractions(ids, regions, rules):
    """Share of each kind's isoform weight that a channel (every region in ids) detects:
    [group 1 skipping the exon, group 1 including it, group 2]. Taken from the hand-written mature_in
    lists; an included-exon molecule of isoform P is detected by region R if P is in R's list or R is the exon."""
    ex = rules["exon"]
    sets = {i: set(regions[i]["mature_in"]) for i in ids}
    def share(g, including):
        w = rules["groups"][g]
        ok = lambda k: all(k[1:] in sets[i] or (including and i == ex["region"]) for i in ids)
        return sum(v for k, v in w.items() if ok(k)) / sum(w.values())
    return [share(ex["carried_by"], False), share(ex["carried_by"], True), share("g2" if ex["carried_by"] == "g1" else "g1", False)]


def kind_counts(comp, gt, rules):
    """Mature molecules per cell in a compartment before detection, [group 1 skipping, group 1 including, group 2]."""
    g1, g2 = rules["group_per_cell"][comp]
    ex = rules["exon"]
    psi = ex["psi"][gt]
    return [g1 * (1 - psi), g1 * psi * ex["survives"][comp], g2]


def expected_mean(comp, gt, f, rules):
    """Expected mature molecules per cell in a compartment: sum over the three kinds of count x detected share. gt 0 = control, 1 = mutant."""
    return sum(n * x for n, x in zip(kind_counts(comp, gt, rules), f))


def change_rule(ctrl, mut, rules):
    """'same' within rules.same, else a ratio rule carrying the nominal mutant / control ratio."""
    if ctrl == 0:
        return {"rule": "same"}
    r = mut / ctrl
    if abs(r - 1) <= rules["rules"]["same"]:
        return {"rule": "same"}
    return {"rule": "ratio", "nominal_ratio": round(r, 4)}


def count_rule(ctrl, mut, scale, rules):
    """change_rule for a count; 'appears' when the control is at most appears_cap per cell and the mutant more than 3x it."""
    cap = rules["rules"]["appears_cap"]
    if ctrl == 0 and mut == 0:
        return {"rule": "none", "note": "no molecules of this channel reach here"}
    if ctrl <= cap and mut > 3 * ctrl:
        return {"rule": "appears", "nominal_mutant": round(mut * scale, 4), "cap": round(cap * scale, 4)}
    return change_rule(ctrl, mut, rules)


def pool_sum(comps, gt, f, rules):
    return sum(expected_mean(c, gt, f, rules) for c in comps)


def nascent_change(ids, rules):
    """Mutant / control nascent level of a probe pair's shared isoforms, from the [ts] columns (the lower region of the pair)."""
    lam = channel_lambda(ids, rules)
    return lam[1] / lam[0]


def site_fraction(lam, nascent):
    """Chance that an active site holds at least ts_detect_min nascent molecules, Poisson(lam)."""
    p = 0.0
    term = math.exp(-lam)
    for n in range(nascent["ts_detect_min"]):
        p += term
        term *= lam / (n + 1)
    return 1 - p


def site_mean(lam, nascent):
    """Mean nascent molecules per counted site: E[n | n >= ts_detect_min] for Poisson(lam)."""
    num = lam
    den = 1.0
    term = math.exp(-lam)
    for n in range(nascent["ts_detect_min"]):
        den -= term
        num -= n * term
        term *= lam / (n + 1)
    return num / den


def channel_lambda(ids, rules):
    """Designed nascent molecules per active site, [control, mutant], of the lowest region in ids."""
    return [min(rules["ts"][i][gt] for i in ids) for gt in (0, 1)]


def borderline(lam, nascent, margin=0.15):
    """The band edge that lam x ts_active lies within `margin` (relative) of, if any."""
    x = lam * nascent["ts_active"]
    return next((lo for _, lo in LEVELS if lo > 0 and abs(x - lo) <= margin * lo), None)


def nascent_expectations(ids, rules, nascent, single):
    """ts_number, ts_intensity (and ts_level for a single probe) from the designed molecules per site."""
    nas = rules["nascent"]
    out = []
    lam = channel_lambda(ids, rules)
    if not single:
        # white spots come only from the isoforms carrying every region: the lower control level,
        # moved in the mutant by the [ts] columns' change
        lam = [lam[0], lam[0] * nascent_change(ids, rules)]
    if single:
        for gt, name in zip(lam, ("control", "mutant")):
            edge = borderline(gt, nas)
            if edge:
                print(f"warning: {ids[0]} {name}: {gt} x {nas['ts_active']} = {gt * nas['ts_active']:.2f} nascent molecules per nucleus "
                      f"lies within 15% of the band edge {edge:g}", file=sys.stderr)
        out.append({"measure": "ts_level", "rule": "level",
                    "level": {gt: level_of(x * nas["ts_active"]) for gt, x in zip(("control", "mutant"), lam)}})
    if min(lam) < nas["measurable"]:
        return out
    n_c, n_m = (site_fraction(x, nas) * nas["ts_active"] for x in lam)
    out.append({"measure": "ts_number", **change_rule(n_c, n_m, rules)})
    out.append({"measure": "ts_intensity", **change_rule(site_mean(lam[0], nas), site_mean(lam[1], nas), rules)})
    return out


def group_channel_expectations(name, ids, regions, rules, single, layout):
    mature, nascent, other = channel_sets(ids, regions)
    f = group_fractions(ids, regions, rules)
    total = sum(sum(w.values()) for w in (rules["groups"]["g1"], rules["groups"]["g2"]))
    carried = sum(v for g in ("g1", "g2") for k, v in rules["groups"][g].items() if k[1:] in mature)
    out = []
    add = lambda **e: out.append({"channel": name, **e})
    if any(f):
        scale = {"cell": 1, "animal": layout.cells, "unit": layout.cells // len(layout.unit_sets["lobe_system"]["ids"])}
        E = {c.id: (expected_mean(c.id, 0, f, rules), expected_mean(c.id, 1, f, rules)) for c in layout.compartments}
        for c in layout.compartments:
            ec, em = E[c.id]
            add(measure="count", compartment=c.id, nominal_control=round(ec * scale[c.count_unit], 3),
                **count_rule(ec, em, scale[c.count_unit], rules))
            if c.units:
                for u in layout.unit_sets[c.units]["ids"]:
                    add(measure="unit_count", compartment=c.id, unit=u, nominal_control=round(ec * scale["unit"], 3),
                        **count_rule(ec, em, scale["unit"], rules))
        if E["cellbody"][0] > 0:
            add(measure="nc_ratio", **change_rule(E["nucleus"][0] / E["cellbody"][0], E["nucleus"][1] / E["cellbody"][1], rules))
        dc, cc = (pool_sum(layout.pools[p], 0, f, rules) for p in ("distal", "cytoplasm"))
        dm, cm = (pool_sum(layout.pools[p], 1, f, rules) for p in ("distal", "cytoplasm"))
        add(measure="share_distal", **change_rule(dc / cc, dm / cm, rules))
        for comp, rule in rules["mature"]["tdp43_overlap"].items():
            add(measure="overlap", compartment=comp, rule=rule)
    else:
        for c in layout.compartments:
            add(measure="count", compartment=c.id, rule="none", note="no spots away from transcription sites")
    if other:
        add(measure="other_gene", rule="present", genes=sorted(other))
    if nascent:
        for e in nascent_expectations(ids, rules, nascent, single):
            add(**e)
    else:
        add(measure="ts_level", rule="level", level={"control": "none", "mutant": "none"})
    return out, {"regions": list(ids), "mature": sorted(mature), "nascent": sorted(nascent),
                 "mature_fraction": round(carried / total, 6), "group_fractions": [round(x, 6) for x in f],
                 "included": sorted(k[1:] for k, _ in rules["groups"][rules["exon"]["carried_by"]].items()
                                    if all(k[1:] in set(regions[i]["mature_in"]) or i == rules["exon"]["region"] for i in ids))}


def expand_groups(case, rules, regions):
    layout = LAYOUTS[case]
    ids = sorted(regions, key=lambda r: int(r[1:]))
    selections = {}
    ch = lambda name, rs, single: group_channel_expectations(name, rs, regions, rules, single, layout)

    for a in ids:
        exp, info = ch("ch1", (a,), True)
        selections[a] = {"channels": {"ch1": info}, "expect": exp}

    for a, b in itertools.permutations(ids, 2):
        e1, i1 = ch("ch1", (a,), True)
        e2, i2 = ch("ch2", (b,), True)
        eb, ib = ch("both", (a, b), False)
        exp = e1 + e2 + eb
        if any(i1["group_fractions"]) and any(i2["group_fractions"]):
            f1, f2 = i1["group_fractions"], i2["group_fractions"]
            for pool in ("whole_cell", "distal"):
                comps = layout.pools[pool]
                rc = pool_sum(comps, 0, f2, rules) / pool_sum(comps, 0, f1, rules)
                rm = pool_sum(comps, 1, f2, rules) / pool_sum(comps, 1, f1, rules)
                exp.append({"channel": "ratio", "measure": "region_ratio", "pool": pool, "nominal_control": round(rc, 4),
                            **change_rule(rc, rm, rules)})
        selections[f"{a}+{b}"] = {"channels": {"ch1": i1, "ch2": i2, "both": ib}, "expect": exp}

    mark_key(selections, rules.get("key", {}))
    return {
        "case": case,
        "gene": rules["gene"],
        "status": rules["status"],
        "signed_off_by": rules["signed_off_by"],
        "signed_off_on": rules["signed_off_on"],
        "source": f"data/{case}/truth-table.toml",
        "verdicts": rules["verdicts"],
        "rules": rules["rules"],
        "nascent": rules["nascent"],
        "exon": rules["exon"],
        "selections": selections,
    }


def fmt_rule(e):
    """A rule as it reads in the tables: 'same', '↓×0.40', '↑×2.39', or the plain word."""
    if e["rule"] == "ratio":
        r = e["nominal_ratio"]
        return f"{'↓' if r < 1 else '↑'}×{r:.2f}"
    if e["rule"] == "appears":
        return f"appears (→ {e['nominal_mutant']:g})"
    return WORD.get(e["rule"], e["rule"])


def kinds_table(rules: dict, layout) -> list:
    """The per-cell counts of the three kinds of molecule, control -> mutant, for the .md."""
    ex = rules["exon"]
    rows = ["| Compartment | Group 2 | Group 1, skips the exon | Group 1, includes the exon (white U2+U4) | Total |", "| --- | --- | --- | --- | --- |"]
    for c in layout.compartments:
        k = [kind_counts(c.id, gt, rules) for gt in (0, 1)]
        pair = lambda i: f"{k[0][i]:.2f} → {k[1][i]:.2f}" if abs(k[0][i] - k[1][i]) > 5e-3 else f"{k[0][i]:.2f}"
        tot = f"{sum(k[0]):.2f} → {sum(k[1]):.2f}" if abs(sum(k[0]) - sum(k[1])) > 5e-3 else f"{sum(k[0]):.2f}"
        rows.append(f"| {SHORT_MB.get(c.id, c.id)} | {pair(2)} | {pair(0)} | {pair(1)} | {tot} |")
    return [
        "## Three kinds of molecule",
        "",
        f"Group 1 and group 2 are made at the same rates in both genotypes. The exon covered by {ex['region']} is group 2's first coding exon, "
        f"and lies in an intron of group-1 pre-mRNA. In control {ex['psi'][0]:.0%} of group-1 transcripts include it; in the mutant "
        f"{ex['psi'][1]:.0%} do. Those transcripts are broken down soon after export (nonsense-mediated decay), so the share that survives falls with distance from the nucleus: "
        + ", ".join(f"{SHORT_MB.get(c, c)} {v:.0%}" for c, v in ex["survives"].items())
        + ". A probe counts a molecule only if it carries its region: group-1 molecules that include the exon carry "
        f"{ex['region']} as well as their usual regions. Mean molecules per Kenyon cell, control → mutant:",
        "",
        *rows,
        "",
    ]


def render_md_groups(t: dict, regions: dict) -> str:
    layout = LAYOUTS[t["case"]]
    rules, _ = load(t["case"])
    sel = t["selections"]
    comps = layout.compartments
    title = {"mb": "Mushroom body"}.get(t["case"], t["case"].upper())
    head = lambda c: SHORT_MB.get(c.id, c.id) + ("" if c.student else " (instructor only)")
    lines = [
        f"# Truth table: {title} – *{t['gene']}* ({t['status']})",
        "",
        f"Generated from `{t['source']}` and the probe menu by `uv run python -m generator.truth_table {t['case']}`. "
        "Every entry compares the hTDP-43 mutant with hTDP-43 WT (control). Sign off by editing the `.toml`, not this file.",
        "",
        "## Verdicts",
        "",
        "| Mode | Verdict |", "| --- | --- |",
        *[f"| {m} | {v} |" for m, v in t["verdicts"].items()],
        "",
        *kinds_table(rules, layout),
        "## Single probes",
        "",
        f"Counts: per Kenyon cell for the nucleus and cell body; per animal for the peduncle and calyx ({layout.cells} cells' worth); "
        f"per lobe system for the lobes ({layout.cells // len(layout.unit_sets['lobe_system']['ids'])} cells' worth). Brackets give the control mean. ↓×r and ↑×r give the "
        "nominal mutant / control ratio; \"appears\" marks a count that is near zero in control and clear in the mutant. N:C = nucleus / cell body. Distal share = (peduncle + lobes) / all cytoplasmic RNA "
        "(cell body, peduncle, lobes). TDP-43 overlap = share of spots on TDP-43 puncta, against the randomised-position level. "
        "TS = transcription sites, control → mutant.",
        "",
        f"| Region | Type | Mature in | Nascent in | {' | '.join(head(c) for c in comps)} | N:C | Distal share | TDP-43 overlap | TS intensity | TS look |",
        "| --- | --- | --- | --- | " + " | ".join("---" for _ in comps) + " | --- | --- | --- | --- | --- |",
    ]
    for rid in sorted(regions, key=lambda r: int(r[1:])):
        s = sel[rid]
        info = s["channels"]["ch1"]
        by = {(e["measure"], e.get("compartment")): e for e in s["expect"]}

        def cell(measure, comp=None):
            e = by.get((measure, comp))
            if not e:
                return "–"
            w = fmt_rule(e)
            if "nominal_control" in e:
                w += f" ({e['nominal_control']:g})"
            return w

        lv = by.get(("ts_level", None), {}).get("level")
        look = f"{lv['control']} → {lv['mutant']}" if lv else "–"
        ts_int = cell("ts_intensity") if ("ts_intensity", None) in by or not info["nascent"] else "too few nascent molecules to measure"
        groups = {}
        for e in s["expect"]:
            if e["measure"] == "overlap":
                groups.setdefault(e["rule"], []).append(SHORT_MB.get(e["compartment"], e["compartment"]))
        overlap = "; ".join(f"{', '.join(c)}: {WORD.get(r, r)}" for r, c in groups.items()) or "–"
        mat = ", ".join("R" + m for m in info["mature"]) or "–"
        nas = ", ".join("R" + m for m in info["nascent"]) or "–"
        lines.append(f"| {rid} | {regions[rid]['label']} | {mat} | {nas} | {' | '.join(cell('count', c.id) for c in comps)} | "
                     f"{cell('nc_ratio')} | {cell('share_distal')} | {overlap} | {ts_int} | {look} |")
    lines += [
        "",
        "Lobe counts per lobe system are checked for each of "
        + ", ".join(f"`{u}`" for u in layout.unit_sets["lobe_system"]["ids"])
        + " (`unit_count`, answer key only) with the same rule and control mean as the lobes above.",
        "",
        "## Pairs",
        "",
        f"Channel 1 and channel 2 behave as the single probes above; the 56 ordered pairs differ in which isoforms carry *both* regions (white spots) and in the channel-2 : channel-1 ratio over the whole cell (nucleus, cell body, peduncle, lobes) and over the distal compartments (peduncle, lobes). The ratio is given as the control value and its change in the mutant. One row per unordered pair; swapping channels inverts the ratio:",
        "",
        "| Pair | Both regions in (annotated, mature) | Both regions in (group 1 with the exon) | Both regions in (nascent) | Whole-cell ratio | Distal ratio |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    ids = sorted(regions, key=lambda r: int(r[1:]))
    for a, b in itertools.combinations(ids, 2):
        s = sel[f"{a}+{b}"]
        ib = s["channels"]["both"]
        rr = {e["pool"]: e for e in s["expect"] if e["measure"] == "region_ratio"}
        txt = lambda p: f"{rr[p]['nominal_control']:g}, {fmt_rule(rr[p])}" if p in rr else "–"
        lines.append(f"| {a} + {b} | {', '.join('R' + m for m in ib['mature']) or '–'} | {', '.join('R' + m for m in ib['included']) or '–'} | "
                     f"{', '.join('R' + m for m in ib['nascent']) or '–'} | {txt('whole_cell')} | {txt('distal')} |")
    r = t["rules"]
    n_key = sum(1 for s in sel.values() for e in s["expect"] if e.get("key"))
    lines += [
        "",
        "## Tolerances",
        "",
        f"- *same*: within ±{r['same']:.0%}. Key readouts ({n_key} checks: U6 transcription-site intensity, nuclear and neurite-share U2, the white U2+U4 counts in the nucleus and cell body) are held to their rule with no allowance for counting noise; other checks may also differ by 2 standard errors of counting noise where counts are small.",
        f"- *↓×r / ↑×r*: the mutant / control ratio is within ±{r['ratio']:.0%} of the nominal ratio (widened by 2 standard errors for small counts). Ratios follow from the group weights, the exon's inclusion share and its survival in each compartment (see the `.toml`).",
        f"- *appears*: the control mean is at most {r['appears_cap']:g} per cell (scaled for shared compartments) and the mutant mean is within ±{r['nominal']:.0%} of the expected value (widened by 2 standard errors for small counts).",
        f"- Control means within ±{r['nominal']:.0%} of the nominal numbers (in brackets above).",
        f"- TDP-43 overlap: *chance* is within {r['chance']:.0%} (absolute) of the randomised-position control, in both genotypes.",
        f"- Transcription sites: number and intensity (mean nascent molecules per counted site) follow a Poisson model of the designed molecules per active site (`[ts]`, with `ts_active` and `ts_detect_min` in `[nascent]`), within the ratio rules above. They are checked only for probes with at least {t['nascent']['measurable']:g} molecules per active site in both genotypes; otherwise the table says \"too few nascent molecules to measure\". Look (bright, present, dim, none) is read from the nascent molecules per nucleus (molecules per site x {t['nascent']['ts_active']:g}).",
        "",
    ]
    return "\n".join(lines)


# ---------- readable version for sign-off ----------

WORD = {"same": "same", "fall": "↓ 40–60%", "fall_per_area": "↓ (per area)", "rise_nc": "↑ ×2", "chance": "chance", "none": "none",
        "above_same": "above chance, same share"}
SHORT = {"cellbody": "cell body", "axon": "axon", "terminals": "terminals"}
SHORT_MB = {"cellbody": "cell body"}


def render_md(t: dict, regions: dict) -> str:
    sel = t["selections"]
    lines = [
        f"# Truth table: {t['case'].upper()} – *{t['gene']}* ({t['status']})",
        "",
        f"Generated from `{t['source']}` and the probe menu by `uv run python -m generator.truth_table {t['case']}`. "
        "Every entry compares the hTDP-43 mutant with hTDP-43 WT (control). Sign off by editing the `.toml`, not this file.",
        "",
        "## Verdicts",
        "",
        "| Mode | Verdict |", "| --- | --- |",
        *[f"| {m} | {v} |" for m, v in t["verdicts"].items()],
        "",
        "## Single probes",
        "",
        "Counts: nucleus and cell body per cell, axon and terminals per animal (four cells). N:C = nucleus / cell body. Distal share = (axon + terminals) / all cytoplasmic RNA. TDP-43 overlap = share of spots on TDP-43 transport granules (aggregates not counted), against the randomised-position level. TS = transcription sites.",
        "",
        "| Region | Type | Mature in | Nascent in | Nucleus | Cell body | Axon | Terminals | Per area | N:C | Distal share | TDP-43 overlap | TS |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    for rid in sorted(regions, key=lambda r: int(r[1:])):
        s = sel[rid]
        info = s["channels"]["ch1"]
        by = {(e["measure"], e.get("compartment")): e for e in s["expect"]}

        def cell(measure, comp=None):
            e = by.get((measure, comp))
            if not e:
                return "–"
            w = WORD.get(e["rule"], e["rule"])
            if "nominal_control" in e:
                w += f" ({e['nominal_control']:g})"
            return w

        ts = by.get(("ts_level", None), {}).get("level", "–")
        groups = {}
        for e in s["expect"]:
            if e["measure"] == "overlap":
                groups.setdefault(e["rule"], []).append(SHORT[e["compartment"]])
        overlap = "; ".join(f"{', '.join(c)}: {WORD.get(r, r)}" for r, c in groups.items()) or "–"
        mat = ", ".join("R" + m for m in info["mature"]) or "–"
        nas = ", ".join("R" + m for m in info["nascent"]) or "–"
        lines.append(f"| {rid} | {regions[rid]['label']} | {mat} | {nas} | {cell('count', 'nucleus')} | {cell('count', 'cellbody')} | "
                     f"{cell('count', 'axon')} | {cell('count', 'terminals')} | {cell('per_area', 'terminals')} | {cell('nc_ratio')} | "
                     f"{cell('share_distal')} | {overlap} | {ts}, same |")
    lines += [
        "",
        "## Pairs",
        "",
        "Channel 1 and channel 2 behave as the single probes above; the 56 ordered pairs differ only in which isoforms carry *both* regions (white spots) and in the channel-2 : channel-1 ratio, which is the same in both genotypes wherever both regions are mature. Swapping channels swaps the columns. One row per unordered pair:",
        "",
        "| Pair | Both regions in (mature) | Both regions in (nascent) | White spots | Ch2 : ch1 ratio (control) |",
        "| --- | --- | --- | --- | --- |",
    ]
    ids = sorted(regions, key=lambda r: int(r[1:]))
    for a, b in itertools.combinations(ids, 2):
        s = sel[f"{a}+{b}"]
        ib = s["channels"]["both"]
        ratio = next((e["nominal_control"] for e in s["expect"] if e["measure"] == "region_ratio"), None)
        white = "cytoplasm ↓ 40–60%, nucleus same" if ib["mature"] else ("transcription sites only" if ib["nascent"] else "none")
        lines.append(f"| {a} + {b} | {', '.join('R' + m for m in ib['mature']) or '–'} | {', '.join('R' + m for m in ib['nascent']) or '–'} | "
                     f"{white} | {f'{ratio:g}, same' if ratio is not None else '–'} |")
    r = t["rules"]
    n_key = sum(1 for s in sel.values() for e in s["expect"] if e.get("key"))
    lines += [
        "",
        "## Tolerances",
        "",
        f"- *same*: within ±{r['same']:.0%}. Key readouts ({n_key} checks: F6 nuclear count and distal share, F5 transcription sites, whole-cell region ratios against F6) are held to that exactly, and their site counts must match; other *same* checks may also differ by 2 standard errors of counting noise where counts are small.",
        f"- *↓ 40–60%*: mutant {1 - r['fall'][1]:.0%}–{1 - r['fall'][0]:.0%} of control (band widened by 2 standard errors for small counts).",
        f"- Control means within ±{r['nominal']:.0%} of the spec's numbers (in brackets above).",
        f"- TDP-43 overlap, against transport granules only: *chance* is within {r['chance']:.0%} (absolute) of the randomised-position control, in both genotypes; *above chance, same share* is at least {r['above']:.0%} (absolute, less 2 standard errors) above it in both genotypes, with the mutant's share within ±{r['same']:.0%} of control's (or 2 standard errors of counting noise).",
        f"- Transcription sites: number within {r['ts_number']} nuclei of control; intensity within ±{r['ts_intensity']:.0%}.",
        "",
    ]
    return "\n".join(lines)


def main(argv) -> int:
    cases = argv or ["pdf"]
    for case in cases:
        t = expand(case)
        _, regions = load(case)
        (DATA / case / "truth-table.json").write_text(json.dumps(t, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        md = render_md_groups(t, regions) if "groups" in load(case)[0] else render_md(t, regions)
        (DATA / case / "truth-table.md").write_text(md, encoding="utf-8")
        n_single = sum(1 for k in t["selections"] if "+" not in k)
        n_pairs = len(t["selections"]) - n_single
        n_exp = sum(len(s["expect"]) for s in t["selections"].values())
        print(f"{case}: {n_single} single probes, {n_pairs} ordered pairs, {n_exp} expectations ({t['status']})")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
