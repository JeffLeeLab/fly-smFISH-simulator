"""Repository paths and the case → gene mapping shared by every generator script."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
DATA = ROOT / "data"            # inputs and private outputs; never served
SITE_DATA = ROOT / "site" / "data"  # public outputs; served by GitHub Pages

TRANSCRIPT_MODELS = DOCS / "transcript_models_R6.json"

CASE_GENES = {"nmj": "stai", "pdf": "futsch", "mb": "unc-13"}
