#!/usr/bin/env bash
# Render CAPTURE_URL at desktop and mobile sizes and save two PNGs.
set -uo pipefail

: "${CAPTURE_URL:?CAPTURE_URL is required}"
: "${CAPTURE_DIR:?CAPTURE_DIR is required}"
export CAPTURE_URL CAPTURE_DIR

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

timed() {
  local label="$1"
  shift
  local start end rc
  start="$(date +%s%N)"
  "$@"
  rc=$?
  end="$(date +%s%N)"
  printf '[timing] %-30s %6d ms\n' "$label" "$(( (end - start) / 1000000 ))"
  return "$rc"
}

timed "prepare capture directory" mkdir -p "$CAPTURE_DIR" || exit 1

node "$SCRIPT_DIR/scripts/capture.mjs"
rc=$?
if [[ "$rc" -ne 0 && "$rc" -ne 75 ]]; then
  rc=1
fi

missing=0
for name in final-desktop.png final-mobile.png; do
  file="$CAPTURE_DIR/$name"
  if [[ -s "$file" ]]; then
    bytes="$(stat -c '%s' "$file" 2>/dev/null || echo 0)"
    printf '[capture] %-18s %8s bytes  %s\n' "$name" "$bytes" "$file"
  else
    printf '[capture] %-18s MISSING  %s\n' "$name" "$file" >&2
    missing=1
  fi
done

if [[ "$missing" -eq 1 && "$rc" -eq 0 ]]; then
  rc=1
fi

echo "[capture] finished rc=$rc"
exit "$rc"
