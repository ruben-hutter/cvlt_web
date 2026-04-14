#!/usr/bin/env bash
set -euo pipefail

# Timed deploy helper: measures each deploy phase duration.
# Usage: bash scripts/deploy-timed.sh

mkdir -p logs
timestamp="$(date +%Y_%m_%d_%H%M%S)"
log_file="logs/deploy-timing.${timestamp}.log"

step_names=()
step_secs=()

run_step() {
  local name="$1"
  shift

  echo ""
  echo "=== ${name} ==="
  local start
  local end
  local elapsed
  start="$(date +%s)"
  "$@"
  end="$(date +%s)"
  elapsed="$((end - start))"

  step_names+=("${name}")
  step_secs+=("${elapsed}")
  echo "--- ${name} finished in ${elapsed}s ---"
}

echo "=== CVLT timed deploy started at $(date) ===" | tee "${log_file}"

{
  run_step "git pull" git pull origin main
  run_step "npm ci" npm ci --no-audit --no-fund
  run_step "npm run build" npm run build

  echo ""
  echo "=== Timing summary ==="
  total=0
  for i in "${!step_names[@]}"; do
    echo "${step_names[$i]}: ${step_secs[$i]}s"
    total="$((total + step_secs[$i]))"
  done
  echo "Total: ${total}s"
  echo ""
  echo "Log file: ${log_file}"
} 2>&1 | tee -a "${log_file}"
