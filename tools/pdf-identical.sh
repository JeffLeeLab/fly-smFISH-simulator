#!/usr/bin/env bash
# The Pdf case must not change while the pipeline is generalised for more cases (Phase 2).
# Rebuilds the Pdf case from scratch, then fails if any committed output differs, if a new
# file appears, or if the private molecule records differ from tools/pdf-baseline.sha256.
#
#   tools/pdf-identical.sh
set -euo pipefail
cd "$(dirname "$0")/.."
uv run python -m generator.public_models >/dev/null
uv run python -m generator.geometry_pdf >/dev/null
uv run python -m generator.truth_table pdf >/dev/null
uv run python -m generator.build pdf | tail -1
git diff --exit-code --stat -- site/data/pdf data/pdf site/data/nmj site/data/mb/transcripts.json
new=$(git status --porcelain --untracked-files=all -- site/data/pdf data/pdf | grep -v '^!!' || true)
if [ -n "$new" ]; then echo "new files:"; echo "$new"; exit 1; fi
shasum -a 256 --quiet -c tools/pdf-baseline.sha256
uv run python -m generator.validate pdf --signed | tail -1
echo "pdf identical"
