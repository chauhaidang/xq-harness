#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_PATH="${ROOT}/ios-xq-fitness-app.xcodeproj"
SCHEME="${IOS_SCHEME:-ios-xq-fitness-app}"
CONFIGURATION="${IOS_CONFIGURATION:-Release}"
BUNDLE_ID="com.xq.fitness.ios-xq-fitness-app"
# Hardware UDID requested for the device build. Set IOS_DEVICE_ID to a
# CoreDevice UUID when targeting a device that is only exposed that way.
DEVICE_ID="${IOS_DEVICE_ID:-00008150-0012058A14F8401C}"
PROVISIONING_DEVICE_ID="${IOS_PROVISIONING_DEVICE_ID:-${DEVICE_ID}}"
INSTALL_TO_DEVICE="${INSTALL_TO_DEVICE:-1}"
LAUNCH_ON_DEVICE="${LAUNCH_ON_DEVICE:-1}"

ARCHIVE_PATH="${IOS_ARCHIVE_PATH:-${ROOT}/build/${SCHEME}.xcarchive}"
EXPORT_PATH="${IOS_EXPORT_PATH:-${ROOT}/build/ipa}"
IPA_PATH="${EXPORT_PATH}/${SCHEME}.ipa"
EXPORT_OPTIONS_PLIST="${TMPDIR:-/tmp}/${SCHEME}-export-options.plist"
STAGING_PATH="${TMPDIR:-/tmp}/${SCHEME}-ipa-payload-$$"

log() {
  printf '==> %s\n' "$*" >&2
}

cleanup() {
  rm -f "${EXPORT_OPTIONS_PLIST}"
  rm -rf "${STAGING_PATH}"
}
trap cleanup EXIT

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Build, validate, and optionally install the signed XQ Fitness IPA.

Signing:
  Defaults to the working project team T99X93V7Y2. Override with
  DEVELOPMENT_TEAM=<Apple team ID> when needed.

Optional:
  IOS_DEVICE_ID=<device ID>   Default: 00008150-0012058A14F8401C
  IOS_PROVISIONING_DEVICE_ID=<hardware UDID>  Default: IOS_DEVICE_ID
  INSTALL_TO_DEVICE=0        Build/export only
  LAUNCH_ON_DEVICE=0         Install without launching
  IOS_ARCHIVE_PATH=<path>
  IOS_EXPORT_PATH=<directory>
USAGE
  exit 0
fi

# Keep signing explicit and stable. This is the team configured for the
# working Xcode project and provisioning profile.
TEAM_ID="${DEVELOPMENT_TEAM:-T99X93V7Y2}"

command -v xcodebuild >/dev/null || { echo "xcodebuild is required" >&2; exit 1; }
command -v xcrun >/dev/null || { echo "xcrun is required" >&2; exit 1; }
command -v security >/dev/null || { echo "security is required" >&2; exit 1; }
command -v unzip >/dev/null || { echo "unzip is required" >&2; exit 1; }

DEVICE_LIST="$(xcrun devicectl list devices --timeout 30 2>&1 || true)"
if ! grep -Fq "${DEVICE_ID}" <<<"${DEVICE_LIST}"; then
  if [[ "${DEVICE_ID}" == 000* ]]; then
    log "Hardware UDID ${DEVICE_ID} is not shown in the CoreDevice table; continuing so devicectl can resolve it"
  else
    echo "Device ${DEVICE_ID} is not visible to CoreDevice. Connect, unlock, trust, and enable Developer Mode, then retry." >&2
    printf '%s\n' "${DEVICE_LIST}" >&2
    exit 1
  fi
fi

mkdir -p "$(dirname "${ARCHIVE_PATH}")" "${EXPORT_PATH}"

TEAM_PLIST_ENTRY=""
if [[ -n "${TEAM_ID}" ]]; then
  TEAM_PLIST_ENTRY="  <key>teamID</key><string>${TEAM_ID}</string>"
fi

cat >"${EXPORT_OPTIONS_PLIST}" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>compileBitcode</key><false/>
  <key>destination</key><string>export</string>
  <key>method</key><string>development</string>
  <key>signingStyle</key><string>automatic</string>
  <key>stripSwiftSymbols</key><true/>
${TEAM_PLIST_ENTRY}
</dict>
</plist>
PLIST

log "Archiving ${SCHEME} for device ${DEVICE_ID} with team ${TEAM_ID}"
# Build the checked-in Xcode project directly. Do not run xcodegen here:
# project regeneration can erase local signing configuration.
xcodebuild \
  -project "${PROJECT_PATH}" \
  -scheme "${SCHEME}" \
  -configuration "${CONFIGURATION}" \
  -destination 'generic/platform=iOS' \
  -archivePath "${ARCHIVE_PATH}" \
  "DEVELOPMENT_TEAM=${TEAM_ID}" \
  -allowProvisioningUpdates \
  archive

log "Exporting IPA"
xcodebuild \
  -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportPath "${EXPORT_PATH}" \
  -exportOptionsPlist "${EXPORT_OPTIONS_PLIST}" \
  -allowProvisioningUpdates

if [[ ! -f "${IPA_PATH}" ]]; then
  IPA_PATH="$(find "${EXPORT_PATH}" -maxdepth 1 -type f -name '*.ipa' -print -quit)"
fi
if [[ -z "${IPA_PATH}" || ! -f "${IPA_PATH}" ]]; then
  echo "No IPA was exported under ${EXPORT_PATH}" >&2
  exit 1
fi

PROFILE_PATH="${STAGING_PATH}/embedded.mobileprovision"
mkdir -p "${STAGING_PATH}"
unzip -p "${IPA_PATH}" 'Payload/*.app/embedded.mobileprovision' >"${PROFILE_PATH}"
PROFILE_PLIST="${STAGING_PATH}/profile.plist"
security cms -D -i "${PROFILE_PATH}" >"${PROFILE_PLIST}"
if [[ -n "${PROVISIONING_DEVICE_ID}" ]]; then
  if ! /usr/libexec/PlistBuddy -c 'Print :ProvisionedDevices' "${PROFILE_PLIST}" >/dev/null 2>&1 \
    || ! /usr/libexec/PlistBuddy -c 'Print :ProvisionedDevices' "${PROFILE_PLIST}" | grep -Fq "${PROVISIONING_DEVICE_ID}"; then
    echo "The exported IPA is not provisioned for hardware device ${PROVISIONING_DEVICE_ID}" >&2
    exit 1
  fi
  log "Provisioning profile includes hardware device ${PROVISIONING_DEVICE_ID}"
else
  log "Skipping hardware-UDID provisioning check; set IOS_PROVISIONING_DEVICE_ID to enable it"
fi

log "IPA ready: ${IPA_PATH}"

if [[ "${INSTALL_TO_DEVICE}" == "1" ]]; then
  unzip -q "${IPA_PATH}" -d "${STAGING_PATH}"
  APP_PATH="$(find "${STAGING_PATH}/Payload" -maxdepth 1 -type d -name '*.app' -print -quit)"
  log "Installing on ${DEVICE_ID}"
  xcrun devicectl device install app --device "${DEVICE_ID}" "${APP_PATH}"

  if [[ "${LAUNCH_ON_DEVICE}" == "1" ]]; then
    log "Launching ${BUNDLE_ID}"
    xcrun devicectl device process launch \
      --device "${DEVICE_ID}" \
      --terminate-existing \
      "${BUNDLE_ID}"
  fi
fi

printf '%s\n' "${IPA_PATH}"
