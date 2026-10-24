#!/usr/bin/env bash
# Build the static panel and keep the preview server in the foreground.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$SCRIPT_DIR}"
cd "$PROJECT_DIR"

PORT="${PORT:-${APP_PORT:-3000}}"
export PORT
DIST="$PROJECT_DIR/dist"
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
mkdir -p "$WEB_DIR"

timed() {
  local label="$1"
  shift
  local start end rc
  start="$(date +%s%N)"
  set +e
  "$@"
  rc=$?
  set -e
  end="$(date +%s%N)"
  printf '[timing] %-30s %6d ms\n' "$label" "$(( (end - start) / 1000000 ))" >&2
  return "$rc"
}

echo "[start] project=$PROJECT_DIR port=$PORT"

if [[ -f package.json ]]; then
  declared_deps="$(node -e 'const p=require("./package.json"); process.stdout.write(String(Object.keys(p.dependencies||{}).length + Object.keys(p.devDependencies||{}).length))')"
  if [[ "$declared_deps" != "0" ]]; then
    if [[ ! -d node_modules ]]; then
      if [[ -f package-lock.json ]]; then
        timed "install dependencies" npm ci --no-audit --no-fund
      else
        timed "install dependencies" npm install --no-audit --no-fund
      fi
    else
      echo "[start] dependencies already installed"
    fi
  else
    echo "[start] no dependencies declared"
  fi
fi

timed "build static output" node scripts/build-static.mjs
if [[ ! -f "$DIST/index.html" ]]; then
  echo "[start] dist/index.html is missing after build" >&2
  exit 1
fi

timed "write deployment output" env \
  PROJECT_DIR="$PROJECT_DIR" \
  DIST_DIR="$DIST" \
  DEPLOY_FILE="$WEB_DIR/deployment-output.json" \
  node -e '
    const fs = require("node:fs");
    const path = require("node:path");
    const file = process.env.DEPLOY_FILE;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({
      project: process.env.PROJECT_DIR,
      directory: process.env.DIST_DIR
    }));
    console.log(`[start] deployment metadata -> ${file}`);
  '

echo "[start] serving $DIST on 0.0.0.0:$PORT"
exec node scripts/serve-static.mjs
