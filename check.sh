#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

FAILED=0

run_step() {
  local label="$1"
  shift
  echo ""
  echo "==> ${label}"
  if ! "$@"; then
    echo "[FAIL] ${label}"
    FAILED=1
  fi
}

for app in api web; do
  echo ""
  echo "=================================================="
  echo " ${app}"
  echo "=================================================="
  run_step "${app}: lint"  npm --prefix "${app}" run lint
  run_step "${app}: test"  npm --prefix "${app}" run test
  run_step "${app}: build" npm --prefix "${app}" run build
done

echo ""
echo "=================================================="
if [ "$FAILED" -eq 0 ]; then
  echo "All checks passed."
else
  echo "Some checks failed. See [FAIL] lines above."
fi

exit "$FAILED"
