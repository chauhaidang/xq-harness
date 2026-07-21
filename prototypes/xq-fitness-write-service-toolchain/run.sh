#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 /absolute/path/to/xq-fitness-backend-source-2026-07-20.tar.gz" >&2
  exit 2
fi

archive="$1"
if [[ ! -f "$archive" ]]; then
  echo "archive not found: $archive" >&2
  exit 2
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
node22_bin="${NODE22_BIN:-/usr/local/opt/node@22/bin}"
npm_bin="${NPM_BIN:-/usr/local/bin/npm}"

if [[ ! -x "$node22_bin/node" ]]; then
  echo "Node 22 not found at $node22_bin/node; set NODE22_BIN" >&2
  exit 2
fi
if [[ ! -x "$npm_bin" ]]; then
  echo "npm not found at $npm_bin; set NPM_BIN" >&2
  exit 2
fi
: "${NODE_AUTH_TOKEN:?NODE_AUTH_TOKEN with read:packages is required}"

scratch="$(mktemp -d /tmp/xq-write-service-toolchain.XXXXXX)"
cache="$scratch/npm-cache"
service="$scratch/write-service"
package_source="$scratch/package-source"
mkdir -p "$cache" "$package_source"

export PATH="$node22_bin:$PATH"
export GITHUB_TOKEN="$NODE_AUTH_TOKEN"
export npm_config_cache="$cache"

echo "PROTOTYPE scratch directory: $scratch"
node --version
"$npm_bin" --version

tar -xzf "$archive" -C "$scratch" write-service

# Build a package-shaped compatibility artifact. The production decision still
# requires this exact package to be published and consumed from GitHub Packages.
git -C "$repo_root" archive HEAD modules/xq-test-utils | tar -xf - -C "$package_source"
(
  cd "$package_source/modules/xq-test-utils"
  "$npm_bin" ci --include=dev
  "$npm_bin" run build
  "$npm_bin" pack --pack-destination "$scratch"
)

(
  cd "$service"

  # The generator is intentionally able to run before project dependencies.
  "$npm_bin" run generate:client

  PROTOTYPE_PACKAGE="$scratch/chauhaidang-xq-harness-test-utils-0.1.0.tgz" \
    node <<'NODE'
const fs = require('node:fs');
const packagePath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.packageManager = 'npm@11.16.0';
packageJson.engines = { node: '>=22.0.0' };
delete packageJson.devDependencies['@chauhaidang/xq-test-utils'];
packageJson.devDependencies['@chauhaidang/xq-harness-test-utils'] =
  `file:${process.env.PROTOTYPE_PACKAGE}`;
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
NODE

  find test/component -type f -name '*.ts' -exec \
    perl -pi -e 's/\@chauhaidang\/xq-test-utils/\@chauhaidang\/xq-harness-test-utils/g' {} +
  perl -pi -e 's/FROM node:20-alpine/FROM node:22-alpine/g' Dockerfile

  # Use harness/user registry configuration; do not retain standalone auth.
  rm -f .npmrc

  "$npm_bin" install --package-lock-only --ignore-scripts
  "$npm_bin" ci --ignore-scripts
  "$npm_bin" run build
  "$npm_bin" run lint
  "$npm_bin" run build:client
  "$npm_bin" run test:unit -- --runInBand
)

echo
echo "PASS: service-level Node 22/npm 11 prototype gates"
echo "BLOCKED: published test-utils, fixed published xq-infra, Docker image, component suite"
echo "Scratch directory preserved: $scratch"
