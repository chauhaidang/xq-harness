#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="${ROOT_DIR}/ios"
BUILD_DIR="${IOS_DIR}/build"
WORKSPACE="${IOS_DIR}/XQFitness.xcworkspace"
SCHEME="XQFitness"
ARCHIVE_PATH="${BUILD_DIR}/XQFitness.xcarchive"
EXPORT_PATH="${BUILD_DIR}/Export"
EXPORT_OPTIONS="${BUILD_DIR}/ExportOptions.plist"
IPA_PATH="${EXPORT_PATH}/XQFitness.ipa"
APP_PATH="${EXPORT_PATH}/Payload/XQFitness.app"
BUNDLE_ID="com.xqfitness.app"

fail() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

require_env() {
  local name="$1"
  [ -n "${!name:-}" ] || fail "${name} is required"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

doctor() {
  require_env DEVELOPMENT_TEAM
  require_env DEVICE_UDID
  require_env DEVICE_GATEWAY_URL
  case "${DEVICE_GATEWAY_URL}" in
    http://*|https://*) ;;
    *) fail "DEVICE_GATEWAY_URL must use http:// or https://" ;;
  esac

  require_command node
  require_command pod
  require_command codesign
  require_command security
  require_command ditto
  require_command xcodebuild
  require_command xcrun
  [ -d "${WORKSPACE}" ] || fail "committed workspace not found: ${WORKSPACE}"
  [ -f "${IOS_DIR}/Podfile.lock" ] || fail "Podfile.lock is required"
  xcrun devicectl device info details --device "${DEVICE_UDID}" >/dev/null \
    || fail "device ${DEVICE_UDID} is not connected, paired, and trusted"
  printf 'Device prerequisites are ready.\n'
}

validate_exported_app() {
  local info_plist="${APP_PATH}/Info.plist"
  local profile="${APP_PATH}/embedded.mobileprovision"
  local profile_plist="${BUILD_DIR}/embedded-profile.plist"
  local expected_version
  expected_version="$(node -p "require('${ROOT_DIR}/package.json').version")"

  [ -f "${info_plist}" ] || fail "exported app is missing Info.plist"
  [ "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "${info_plist}")" = "${BUNDLE_ID}" ] \
    || fail "exported app bundle identifier does not match ${BUNDLE_ID}"
  [ "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "${info_plist}")" = "${expected_version}" ] \
    || fail "exported app version does not match ${expected_version}"
  codesign -dv --verbose=4 "${APP_PATH}" 2>&1 | grep -q "^TeamIdentifier=${DEVELOPMENT_TEAM}$" \
    || fail "exported app signing team does not match DEVELOPMENT_TEAM"
  [ -f "${profile}" ] || fail "exported app is missing embedded.mobileprovision"
  security cms -D -i "${profile}" >"${profile_plist}"
  /usr/libexec/PlistBuddy -c 'Print :ProvisionedDevices' "${profile_plist}" | grep -q "${DEVICE_UDID}" \
    || fail "provisioning profile does not include DEVICE_UDID"
}

write_export_options() {
  mkdir -p "${BUILD_DIR}"
  cat >"${EXPORT_OPTIONS}" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>development</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>teamID</key>
  <string>${DEVELOPMENT_TEAM}</string>
</dict>
</plist>
EOF
}

build() {
  doctor
  cd "${IOS_DIR}"
  pod install --deployment
  rm -rf "${BUILD_DIR}"
  write_export_options

  DEVICE_GATEWAY_URL="${DEVICE_GATEWAY_URL}" xcodebuild \
    -workspace "${WORKSPACE}" \
    -scheme "${SCHEME}" \
    -configuration Release \
    -destination 'generic/platform=iOS' \
    -archivePath "${ARCHIVE_PATH}" \
    -derivedDataPath "${BUILD_DIR}/DerivedData" \
    -allowProvisioningUpdates \
    DEVELOPMENT_TEAM="${DEVELOPMENT_TEAM}" \
    CODE_SIGN_STYLE=Automatic \
    archive

  xcodebuild -exportArchive \
    -archivePath "${ARCHIVE_PATH}" \
    -exportPath "${EXPORT_PATH}" \
    -exportOptionsPlist "${EXPORT_OPTIONS}" \
    -allowProvisioningUpdates

  [ -f "${IPA_PATH}" ] || fail "export did not create ${IPA_PATH}"
  rm -rf "${EXPORT_PATH}/Payload"
  ditto -x -k "${IPA_PATH}" "${EXPORT_PATH}"
  [ -d "${APP_PATH}" ] || fail "exported IPA did not contain ${APP_PATH}"
  [ -f "${APP_PATH}/main.jsbundle" ] || fail "Release archive is missing its embedded JavaScript bundle"
  validate_exported_app
  printf 'Device archive and export created under %s.\n' "${BUILD_DIR}"
}

install_app() {
  doctor
  [ -d "${APP_PATH}" ] || fail "build first; app not found at ${APP_PATH}"
  xcrun devicectl device install app --device "${DEVICE_UDID}" "${APP_PATH}"
}

launch() {
  doctor
  xcrun devicectl device process launch --device "${DEVICE_UDID}" --terminate-existing "${BUNDLE_ID}"
}

usage() {
  printf 'Usage: %s {doctor|build|install|launch|verify}\n' "${0##*/}" >&2
  exit 64
}

case "${1:-}" in
  doctor) doctor ;;
  build) build ;;
  install) install_app ;;
  launch) launch ;;
  verify) build; install_app; launch ;;
  *) usage ;;
esac
