#!/usr/bin/env bash
# Validate each mod and run its tests. This is the gate for a change.
#
# Run from the repository root:
#   scripts/check.sh
#
# It needs Claude Code 2.1.325 or newer on the PATH, or in $CLAUDE.
set -euo pipefail

CLAUDE="${CLAUDE:-claude}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
failed=0

"$CLAUDE" plugin validate "$ROOT" >/dev/null || { echo "marketplace: validation failed"; failed=1; }

for mod in "$ROOT"/plugins/*/; do
  name="$(basename "$mod")"

  if ! "$CLAUDE" plugin validate "$mod" >/dev/null; then
    echo "$name: validation failed"
    failed=1
    continue
  fi

  if compgen -G "$mod/hooks/*.test.ts*" >/dev/null; then
    if ! "$CLAUDE" plugin test "$mod"; then
      echo "$name: tests failed"
      failed=1
    fi
  else
    echo "$name: no tests (a theme draws, and a test does not paint)"
  fi
done

exit "$failed"
