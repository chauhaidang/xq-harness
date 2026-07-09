#!/usr/bin/env bash
set -euo pipefail

echo "=== xq-harness init ==="

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT}"

echo "=== node version ==="
node --version

echo "=== package manager ==="
npm --version

if ! command -v yq >/dev/null 2>&1; then
  echo "error: yq is required for ./scripts/module" >&2
  exit 1
fi

echo "=== registry sanity ==="
test -f modules.yaml
test -f feature_list.json
test -f progress.md
test -f session-handoff.md
test -f .repo-harness/context-index.json

echo "=== module registry ==="
./scripts/module list >/dev/null

echo "=== harness summary ==="
node scripts/harness-context.mjs summary >/dev/null

echo "=== verification complete ==="
echo ""
echo "Next steps:"
echo "1. Run node scripts/harness-context.mjs summary"
echo "2. Read feature_list.json and progress.md"
echo "3. Query one topic or module before loading deeper docs"
