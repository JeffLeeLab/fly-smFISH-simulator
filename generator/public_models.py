"""Write the public transcript models the site reads: site/data/<case>/transcripts.json.

The answer key never reaches the browser. Each region keeps only its ID, type label and
coordinates; `mature_in`, `nascent_in` and `also_detects` are dropped (also_detects would
expose the S3 / CG31642 trap in the developer tools). The script fails if any of those keys,
or any other unexpected key, would be written.

    uv run python -m generator.public_models
"""

import json
import sys

from .paths import CASE_GENES, SITE_DATA, TRANSCRIPT_MODELS

REGION_KEYS = ("id", "label", "lo", "hi", "length_nt")
TRANSCRIPT_KEYS = ("name", "flybase", "refseq", "exons", "length_nt", "cds", "protein_aa", "protein")
GENE_KEYS = ("chrom", "accession", "strand", "flybase_gene")
FORBIDDEN = {"mature_in", "nascent_in", "also_detects", "note"}


def pick(obj: dict, keys) -> dict:
    return {k: obj[k] for k in keys if k in obj}


def public_gene(name: str, gene: dict, source: dict) -> dict:
    return {
        "gene": name,
        "source": source["source"],
        "conventions": "1-based inclusive genomic coordinates [lo, hi]; exons listed 5'->3' in transcript order.",
        **{k: gene[k] for k in GENE_KEYS},
        "transcripts": [pick(t, TRANSCRIPT_KEYS) for t in gene["transcripts"]],
        "overlapping_same_strand_genes": {
            g: [pick(t, TRANSCRIPT_KEYS) for t in ts]
            for g, ts in gene.get("overlapping_same_strand_genes", {}).items()
        },
        "probe_regions": [{k: r[k] for k in REGION_KEYS} for r in gene["probe_regions"]],
    }


def leaked_keys(obj) -> set:
    if isinstance(obj, dict):
        return (set(obj) & FORBIDDEN).union(*(leaked_keys(v) for v in obj.values()))
    if isinstance(obj, list):
        return set().union(*(leaked_keys(v) for v in obj))
    return set()


def main() -> int:
    source = json.loads(TRANSCRIPT_MODELS.read_text(encoding="utf-8"))
    for case, gene_name in CASE_GENES.items():
        out = public_gene(gene_name, source["genes"][gene_name], source)
        leaks = leaked_keys(out)
        if leaks:
            print(f"refusing to write {case}: answer-key fields {sorted(leaks)}", file=sys.stderr)
            return 1
        path = SITE_DATA / case / "transcripts.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"wrote {path.relative_to(SITE_DATA.parent.parent)} ({len(out['probe_regions'])} regions)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
