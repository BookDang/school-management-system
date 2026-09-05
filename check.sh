#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

FAILED=0
RESULTS=()

run_step() {
  local label="$1"
  shift
  echo ""
  echo "==> ${label}"

  local start_ms end_ms duration status
  start_ms=$(date +%s%3N)
  if "$@"; then
    status="PASS"
  else
    status="FAIL"
    echo "[FAIL] ${label}"
    FAILED=1
  fi
  end_ms=$(date +%s%3N)
  duration=$(awk -v ms="$((end_ms - start_ms))" 'BEGIN { printf "%.1fs", ms / 1000 }')

  RESULTS+=("${label}|${status}|${duration}")
}

echo ""
echo "=================================================="
echo " api"
echo "=================================================="
run_step "api: lint"     npm --prefix api run lint
run_step "api: test:cov" npm --prefix api run test:cov
run_step "api: test:e2e" npm --prefix api run test:e2e
run_step "api: build"    npm --prefix api run build

echo ""
echo "=================================================="
echo " web"
echo "=================================================="
run_step "web: lint"     npm --prefix web run lint
run_step "web: test:cov" npm --prefix web run test:cov
run_step "web: build"    npm --prefix web run build
run_step "web: test:e2e" npm --prefix web run test:e2e

echo ""
echo "=================================================="
echo " Summary"
echo "=================================================="

PASS_COUNT=0
FAIL_COUNT=0
for result in "${RESULTS[@]}"; do
  IFS='|' read -r label status duration <<< "$result"
  printf "  %-15s %-7s %s\n" "$label" "$status" "$duration"
  if [ "$status" = "PASS" ]; then
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

echo "--------------------------------------------------"
echo "  ${PASS_COUNT} passed, ${FAIL_COUNT} failed"

exit "$FAILED"
