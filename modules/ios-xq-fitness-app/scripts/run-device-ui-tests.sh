#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEVICE_ID="${IOS_DEVICE_ID:?Set IOS_DEVICE_ID to the connected iPhone UDID}"
TEAM_ID="${DEVELOPMENT_TEAM:?Set DEVELOPMENT_TEAM to the Apple development team ID}"
RESULT_DIRECTORY="${ROOT}/build/ui-test-results"
RESULT_BUNDLE="${RESULT_DIRECTORY}/fitness-ui-tests-$(date +%Y%m%d-%H%M%S).xcresult"

mkdir -p "${RESULT_DIRECTORY}"

xcodebuild \
  -quiet \
  -project "${ROOT}/ios-xq-fitness-app.xcodeproj" \
  -scheme ios-xq-fitness-app-ui-tests \
  -destination "platform=iOS,id=${DEVICE_ID}" \
  "DEVELOPMENT_TEAM=${TEAM_ID}" \
  -allowProvisioningUpdates \
  -resultBundlePath "${RESULT_BUNDLE}" \
  test

echo "UI-test result: ${RESULT_BUNDLE}"
