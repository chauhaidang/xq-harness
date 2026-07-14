#!/usr/bin/env bash

set -euo pipefail

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RESULT_DIR="$MODULE_DIR/__tests__/integration/tsr"
LOG_FILE="$RESULT_DIR/services.log"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:8080}"
READINESS_URL="${GATEWAY_URL%/}/xq-fitness-write-service/api/v1/muscle-groups"
READINESS_TIMEOUT_SECONDS="${INTEGRATION_READINESS_TIMEOUT_SECONDS:-120}"
INFRA_STARTED=false

mkdir -p "$RESULT_DIR"

if [[ -x "$MODULE_DIR/node_modules/.bin/xq-infra" ]]; then
  INFRA=("$MODULE_DIR/node_modules/.bin/xq-infra")
elif [[ -x "$MODULE_DIR/../xq-test-infra/bin/xq-infra.js" ]]; then
  INFRA=(node "$MODULE_DIR/../xq-test-infra/bin/xq-infra.js")
else
  echo "xq-infra is unavailable; install module dependencies first" >&2
  exit 1
fi

cleanup() {
  if [[ "$INFRA_STARTED" == true ]]; then
    (
      cd "$MODULE_DIR"
      "${INFRA[@]}" logs --tail 200
    ) >"$LOG_FILE" 2>&1 || true

    (
      cd "$MODULE_DIR"
      "${INFRA[@]}" down
    ) || true
  fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

cd "$MODULE_DIR"

INFRA_STARTED=true
"${INFRA[@]}" up

deadline=$((SECONDS + READINESS_TIMEOUT_SECONDS))
until curl --fail --silent "$READINESS_URL" >/dev/null; do
  if (( SECONDS >= deadline )); then
    echo "Integration gateway did not become ready within ${READINESS_TIMEOUT_SECONDS}s: $READINESS_URL" >&2
    exit 1
  fi
  sleep 2
done

GATEWAY_URL="$GATEWAY_URL" npx jest \
  --config=jest.integration.config.js \
  --runInBand \
  --reporters=default \
  --reporters=jest-junit
