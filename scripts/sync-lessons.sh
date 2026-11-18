#!/usr/bin/env bash
# Copy the interactive lessons (the `visual/` folder of the go-go-go repo)
# into this site and regenerate the lesson list used by the
# "Go Visual Learning" page.
#
# usage: scripts/sync-lessons.sh /path/to/go-go-go/visual
set -euo pipefail

SRC="${1:?usage: scripts/sync-lessons.sh /path/to/go-go-go/visual}"
cd "$(dirname "$0")/.."

[ -f "$SRC/index.html" ] || { echo "error: $SRC/index.html not found" >&2; exit 1; }
rsync -a --delete "$SRC"/ go-go-go/
python3 scripts/gen_lessons_data.py
