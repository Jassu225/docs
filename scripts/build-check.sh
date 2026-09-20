#!/usr/bin/env bash
#
# Verify the production export without disturbing a running dev server.
#
# `next build` always rewrites .next, whatever `distDir` is set to, and the dev
# server serves its chunks from there — so building in place while `pnpm dev`
# runs leaves the open page 404-ing on main-app.js until the server restarts.
# Building from a throwaway copy of the source keeps the two apart.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
work="${TMPDIR:-/tmp}/docs-build-check"

rm -rf "$work"
mkdir -p "$work"
rsync -a \
  --exclude .git \
  --exclude node_modules \
  --exclude .next \
  --exclude out \
  "$root/" "$work/"
ln -s "$root/node_modules" "$work/node_modules"

cd "$work"
DOCS_BASE_PATH=/docs npx next build

echo
echo "Export written to $work/out"
