#!/usr/bin/env bash
set -euo pipefail

readonly EXPECTED_ARCHIVE_SHA256="3c5fa62a3c7437aad27e14c227e35b540f5f5b125b05457007e1452047ae76c5"
readonly EXPECTED_TEST_UTILS_SHA1="32888639ae58798891d47f0ac7adcee7699dc940"
readonly EXPECTED_TEST_INFRA_SHA1="7eac12c279fa737f35fce643bc8f3f84035fcc92"
readonly EXPECTED_COMMON_KIT_SHA1="3d3817768521562add1d00e7e7adf64cce38ac68"
readonly EXPECTED_TEST_UTILS_VERSION="0.1.1"
readonly EXPECTED_TEST_INFRA_VERSION="0.1.2"
readonly EXPECTED_COMMON_KIT_VERSION="0.1.0"

usage() {
  cat >&2 <<'USAGE'
usage: run.sh /absolute/path/to/xq-fitness-backend-source-2026-07-23.tar.gz

Required environment:
  TEST_UTILS_TARBALL  @chauhaidang/xq-harness-test-utils@0.1.1 package tarball
  TEST_INFRA_TARBALL  @chauhaidang/xq-harness-test-infra@0.1.2 package tarball
  COMMON_KIT_TARBALL  @chauhaidang/xq-harness-common-kit@0.1.0 package tarball

Optional environment:
  NODE22_BIN          Node 22 bin directory; default /usr/local/opt/node@22/bin
  NPM_BIN             npm executable; default /usr/local/bin/npm
  SCRATCH_PARENT      parent for disposable evidence; default /tmp
USAGE
}

if [[ $# -ne 1 ]]; then
  usage
  exit 2
fi

readonly archive="$1"
: "${TEST_UTILS_TARBALL:?TEST_UTILS_TARBALL is required}"
: "${TEST_INFRA_TARBALL:?TEST_INFRA_TARBALL is required}"
: "${COMMON_KIT_TARBALL:?COMMON_KIT_TARBALL is required}"

require_file() {
  local label="$1"
  local path="$2"
  if [[ ! -f "$path" ]]; then
    echo "$label not found: $path" >&2
    exit 2
  fi
}

require_sha1() {
  local label="$1"
  local path="$2"
  local expected="$3"
  local actual
  actual="$(shasum -a 1 "$path" | awk '{print $1}')"
  if [[ "$actual" != "$expected" ]]; then
    echo "$label SHA-1 mismatch: expected $expected, got $actual" >&2
    exit 2
  fi
}

require_file archive "$archive"
require_file TEST_UTILS_TARBALL "$TEST_UTILS_TARBALL"
require_file TEST_INFRA_TARBALL "$TEST_INFRA_TARBALL"
require_file COMMON_KIT_TARBALL "$COMMON_KIT_TARBALL"
require_sha1 TEST_UTILS_TARBALL "$TEST_UTILS_TARBALL" "$EXPECTED_TEST_UTILS_SHA1"
require_sha1 TEST_INFRA_TARBALL "$TEST_INFRA_TARBALL" "$EXPECTED_TEST_INFRA_SHA1"
require_sha1 COMMON_KIT_TARBALL "$COMMON_KIT_TARBALL" "$EXPECTED_COMMON_KIT_SHA1"

readonly archive_sha256="$(shasum -a 256 "$archive" | awk '{print $1}')"
if [[ "$archive_sha256" != "$EXPECTED_ARCHIVE_SHA256" ]]; then
  echo "archive checksum mismatch: expected $EXPECTED_ARCHIVE_SHA256, got $archive_sha256" >&2
  exit 2
fi

readonly node22_bin="${NODE22_BIN:-/usr/local/opt/node@22/bin}"
readonly npm_bin="${NPM_BIN:-/usr/local/bin/npm}"
readonly scratch_parent="${SCRATCH_PARENT:-/tmp}"
if [[ ! -x "$node22_bin/node" ]]; then
  echo "Node 22 not found at $node22_bin/node; set NODE22_BIN" >&2
  exit 2
fi
if [[ ! -x "$npm_bin" ]]; then
  echo "npm not found at $npm_bin; set NPM_BIN" >&2
  exit 2
fi

export PATH="$node22_bin:$PATH"
if [[ "$(node --version)" != v22.* ]]; then
  echo "Node 22 is required, got $(node --version)" >&2
  exit 2
fi
if [[ "$("$npm_bin" --version)" != "11.16.0" ]]; then
  echo "npm 11.16.0 is required, got $("$npm_bin" --version)" >&2
  exit 2
fi

readonly archive_id="${archive_sha256:0:12}"
readonly database_image="xq-fitness-db:acceptance-$archive_id"
readonly service_image="xq-fitness-write-service:acceptance-$archive_id"
mkdir -p "$scratch_parent"
readonly scratch="$(mktemp -d "$scratch_parent/xq-write-service-toolchain.XXXXXX")"
readonly service="$scratch/write-service"
readonly database="$scratch/database"
readonly matrix="$scratch/matrix"
readonly packages="$service/.prototype-packages"
readonly evidence="$scratch/evidence"
readonly cache="$scratch/npm-cache"
mkdir -p "$matrix/test-env" "$packages" "$evidence" "$cache"

export npm_config_cache="$cache"
export npm_config_registry="https://registry.npmjs.org"

infra_ready=false
cleanup() {
  local status=$?
  trap - EXIT INT TERM
  if [[ "$infra_ready" == true ]]; then
    (
      cd "$matrix"
      "$service/node_modules/.bin/xq-infra" logs --tail 200
    ) >"$evidence/services.log" 2>&1 || true
    (
      cd "$matrix"
      "$service/node_modules/.bin/xq-infra" down
    ) >>"$evidence/services.log" 2>&1 || true
  fi
  echo "Evidence directory: $evidence"
  exit "$status"
}
trap cleanup EXIT INT TERM

echo "PROTOTYPE scratch directory: $scratch"
node --version
"$npm_bin" --version

tar -xzf "$archive" -C "$scratch" write-service database
cp "$TEST_UTILS_TARBALL" "$packages/test-utils.tgz"
cp "$TEST_INFRA_TARBALL" "$packages/test-infra.tgz"
cp "$COMMON_KIT_TARBALL" "$packages/common-kit.tgz"

(
  cd "$service"
  "$npm_bin" run generate:client

  node <<'NODE'
const fs = require('node:fs');
const packagePath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.packageManager = 'npm@11.16.0';
packageJson.engines = { node: '>=22.0.0' };
delete packageJson.devDependencies['@chauhaidang/xq-test-utils'];
packageJson.devDependencies['@chauhaidang/xq-harness-test-utils'] =
  'file:.prototype-packages/test-utils.tgz';
packageJson.devDependencies['@chauhaidang/xq-harness-test-infra'] =
  'file:.prototype-packages/test-infra.tgz';
packageJson.devDependencies['@chauhaidang/xq-harness-common-kit'] =
  'file:.prototype-packages/common-kit.tgz';
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
NODE

  find test/component -type f -name '*.ts' -exec \
    perl -pi -e 's/\@chauhaidang\/xq-test-utils/\@chauhaidang\/xq-harness-test-utils/g' {} +
  rm -f .npmrc

  "$npm_bin" install --package-lock-only --ignore-scripts --no-audit --no-fund --save-dev \
    ./\.prototype-packages/test-utils.tgz \
    ./\.prototype-packages/test-infra.tgz \
    ./\.prototype-packages/common-kit.tgz
  "$npm_bin" ci --ignore-scripts --no-audit --no-fund

  "$npm_bin" ls "@chauhaidang/xq-harness-test-utils@$EXPECTED_TEST_UTILS_VERSION" --depth=0
  "$npm_bin" ls "@chauhaidang/xq-harness-test-infra@$EXPECTED_TEST_INFRA_VERSION" --depth=0
  "$npm_bin" ls "@chauhaidang/xq-harness-common-kit@$EXPECTED_COMMON_KIT_VERSION" --depth=0
  test "$(./node_modules/.bin/xq-infra --version)" = "$EXPECTED_TEST_INFRA_VERSION"

  "$npm_bin" run build
  "$npm_bin" run lint
  "$npm_bin" run build:client
  "$npm_bin" run test:unit -- --runInBand
)

readonly suite_count="$(find "$service/test/component/workflows" -type f -name '*.test.ts' | wc -l | tr -d ' ')"
readonly declaration_count="$(grep -R -E '^[[:space:]]*(it|test)(\.(each|only|skip))?\(' "$service/test/component/workflows" | wc -l | tr -d ' ')"
readonly operation_count="$(grep -c 'operationId:' "$service/api/write-service-api.yaml" | tr -d ' ')"
test "$suite_count" = "9"
test "$declaration_count" = "44"
test "$operation_count" = "20"

SERVICE_DIR="$service" node <<'NODE'
const fs = require('node:fs');
const dockerfile = `# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY .prototype-packages ./.prototype-packages
COPY generated-clients ./generated-clients
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY src ./src
COPY tsconfig.json ./
RUN npm run build
RUN npm prune --omit=dev --no-audit --no-fund

FROM node:22-alpine
RUN apk add --no-cache dumb-init
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=6 CMD node -e "require('http').get('http://localhost:3000/health', r => { if (r.statusCode !== 200) throw new Error(String(r.statusCode)) })"
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/src/index.js"]
`;
fs.writeFileSync(`${process.env.SERVICE_DIR}/Dockerfile.acceptance`, dockerfile);
NODE

SERVICE_DIR="$service" node <<'NODE'
const fs = require('node:fs');
const path = `${process.env.SERVICE_DIR}/.dockerignore`;
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/)
  .filter(line => line.trim() !== 'generated-clients');
fs.writeFileSync(path, `${lines.join('\n')}\n`);
NODE

image_id_or_absent() {
  docker image inspect "$1" --format '{{.Id}}' 2>/dev/null || echo absent
}

readonly database_image_before="$(image_id_or_absent "$database_image")"
readonly service_image_before="$(image_id_or_absent "$service_image")"

docker build --tag "$database_image" "$database"
docker build --file "$service/Dockerfile.acceptance" --tag "$service_image" "$service"

readonly database_image_after="$(image_id_or_absent "$database_image")"
readonly service_image_after="$(image_id_or_absent "$service_image")"
test "$database_image_after" != absent
test "$service_image_after" != absent
test "$(docker image inspect "$database_image" --format '{{.Id}}')" = "$database_image_after"
test "$(docker image inspect "$service_image" --format '{{.Id}}')" = "$service_image_after"

cp "$service/test-env/xq.config.yml" "$matrix/test-env/xq.config.yml"
cp "$service/test-env/xq-fitness-db.service.yml" "$matrix/test-env/xq-fitness-db.service.yml"
cp "$service/test-env/xq-fitness-write-service.service.yml" "$matrix/test-env/xq-fitness-write-service.service.yml"

MATRIX_DIR="$matrix" DATABASE_TAG="acceptance-$archive_id" SERVICE_TAG="acceptance-$archive_id" \
  node <<'NODE'
const fs = require('node:fs');
const dbPath = `${process.env.MATRIX_DIR}/test-env/xq-fitness-db.service.yml`;
const servicePath = `${process.env.MATRIX_DIR}/test-env/xq-fitness-write-service.service.yml`;
let db = fs.readFileSync(dbPath, 'utf8')
  .replace(/^image:.*$/m, 'image: xq-fitness-db')
  .replace(/^tag:.*$/m, `tag: ${process.env.DATABASE_TAG}`);
let service = fs.readFileSync(servicePath, 'utf8')
  .replace(/^image:.*$/m, 'image: xq-fitness-write-service')
  .replace(/^tag:.*$/m, `tag: ${process.env.SERVICE_TAG}`);
fs.writeFileSync(dbPath, db);
fs.writeFileSync(servicePath, service);
NODE

(
  cd "$matrix"
  "$service/node_modules/.bin/xq-infra" generate -f test-env --keep-file
)
grep -Fq "image: $database_image" "$matrix/xq-compose.yml"
grep -Fq "image: $service_image" "$matrix/xq-compose.yml"
if grep -Eq 'xq-fitness-(db|write-service):latest' "$matrix/xq-compose.yml"; then
  echo "mutable fitness image reference remains in generated compose" >&2
  exit 1
fi

infra_ready=true
(
  cd "$matrix"
  "$service/node_modules/.bin/xq-infra" up --no-pull
)

(
  cd "$service"
  API_BASE_URL="http://127.0.0.1:8080/xq-fitness-write-service/api/v1" \
  HEALTH_CHECK_URL="http://127.0.0.1:8080/xq-fitness-write-service/health" \
    "$npm_bin" run test:component:ci
)

cp "$service/test/component/tsr/junit.xml" "$evidence/component-junit.xml"
JUNIT_PATH="$evidence/component-junit.xml" node <<'NODE'
const xml = require('node:fs').readFileSync(process.env.JUNIT_PATH, 'utf8');
const suites = [...xml.matchAll(/<testsuite\b/g)].length;
const tests = [...xml.matchAll(/<testcase\b/g)].length;
if (suites !== 9 || tests !== 44) {
  throw new Error(`expected 9 suites/44 tests, got ${suites}/${tests}`);
}
NODE

cat >"$evidence/manifest.txt" <<EOF
archive_sha256=$archive_sha256
node=$(node --version)
npm=$("$npm_bin" --version)
test_utils_version=$EXPECTED_TEST_UTILS_VERSION
test_utils_sha1=$EXPECTED_TEST_UTILS_SHA1
test_infra_version=$EXPECTED_TEST_INFRA_VERSION
test_infra_sha1=$EXPECTED_TEST_INFRA_SHA1
common_kit_version=$EXPECTED_COMMON_KIT_VERSION
common_kit_sha1=$EXPECTED_COMMON_KIT_SHA1
suite_count=$suite_count
test_declaration_count=$declaration_count
operation_count=$operation_count
database_image=$database_image
database_image_before=$database_image_before
database_image_after=$database_image_after
service_image=$service_image
service_image_before=$service_image_before
service_image_after=$service_image_after
EOF

(
  cd "$matrix"
  "$service/node_modules/.bin/xq-infra" logs --tail 200
  "$service/node_modules/.bin/xq-infra" down
) >"$evidence/services.log" 2>&1
infra_ready=false

echo "PASS: 9 suites, 44 test declarations, and 20 OpenAPI operations"
