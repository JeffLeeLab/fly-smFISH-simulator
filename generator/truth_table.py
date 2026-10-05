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
import sys
import tomllib

from .paths import CASE_GENES, DATA, TRANSCRIPT_MODELS

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
        add(measure="overlap", compartment="cellbody", rule=rules["mature"]["tdp43_overlap"])
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
    for sel_id, sel in selections.items():
        for e in sel["expect"]:
            regions = sel["channels"][e["channel"]]["regions"] if e["channel"] in sel["channels"] else []
            sig = (regions[0], e["measure"], *([e["compartment"]] if "compartment" in e else [])) if len(regions) == 1 else None
            if sig and sig in singles and e["rule"] == "same":
                e["key"] = True
            if e["measure"] == "region_ratio" and e["pool"] == "whole_cell" and sel_id in key.get("region_ratio_whole_cell", []):
                e["key"] = True


def expand(case: str) -> dict:
    rules, regions = load(case)
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


# ---------- readable version for sign-off ----------

WORD = {"same": "same", "fall": "↓ 40–60%", "fall_per_area": "↓ (per area)", "rise_nc": "↑ ×2", "chance": "chance", "none": "none"}


def render_md(t: dict, regions: dict) -> str:
    sel = t["selections"]
    lines = [
        f"# Truth table: {t['case'].upper()} – *{t['gene']}* ({t['status']})",
        "",
        f"Generated from `{t['source']}` and the probe menu by `uv run python -m generator.truth_table {t['case']}`. "
        "Every entry compares the ALS mutant with hTDP-43 WT (control). Sign off by editing the `.toml`, not this file.",
        "",
        "## Verdicts",
        "",
        "| Mode | Verdict |", "| --- | --- |",
        *[f"| {m} | {v} |" for m, v in t["verdicts"].items()],
        "",
        "## Single probes",
        "",
        "Counts: nucleus and cell body per cell, axon and terminals per animal (four cells). N:C = nucleus / cell body. Distal share = (axon + terminals) / all cytoplasmic RNA. TS = transcription sites.",
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
        mat = ", ".join("R" + m for m in info["mature"]) or "–"
        nas = ", ".join("R" + m for m in info["nascent"]) or "–"
        lines.append(f"| {rid} | {regions[rid]['label']} | {mat} | {nas} | {cell('count', 'nucleus')} | {cell('count', 'cellbody')} | "
                     f"{cell('count', 'axon')} | {cell('count', 'terminals')} | {cell('per_area', 'terminals')} | {cell('nc_ratio')} | "
                     f"{cell('share_distal')} | {cell('overlap', 'cellbody')} | {ts}, same |")
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
        f"- TDP-43 overlap: within {r['chance']:.0%} (absolute) of the randomised-position control, in both genotypes.",
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
        (DATA / case / "truth-table.md").write_text(render_md(t, regions), encoding="utf-8")
        n_single = sum(1 for k in t["selections"] if "+" not in k)
        n_pairs = len(t["selections"]) - n_single
        n_exp = sum(len(s["expect"]) for s in t["selections"].values())
        print(f"{case}: {n_single} single probes, {n_pairs} ordered pairs, {n_exp} expectations ({t['status']})")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
