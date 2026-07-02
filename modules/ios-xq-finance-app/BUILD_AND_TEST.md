# iOS XQ Finance Build And Test Workflow

This module is a brownfield React Native iOS app: a thin Swift host mounts the
`XQFinance` React Native root. Swift domain models and persistence remain in
`App/App.swift` for now; the spike screen is rendered in JavaScript.

## Module Basics

- Module: `ios-xq-finance-app`
- Workspace: `modules/ios-xq-finance-app/ios-xq-finance-app.xcworkspace`
- Scheme: `ios-xq-finance-app`
- App bundle ID: `com.xq.finance.ios-xq-finance-app`
- Test bundle ID: `com.xq.finance.ios-xq-finance-appTests`
- UI-test scheme: `ios-xq-finance-app-ui-tests`
- UI-test configuration: `modules/ios-xq-finance-app/xq-ui-tests.json`
- Minimum iOS deployment target: `17.0`
- React Native: `0.86.0`

## Install And Build

From the repo root:

```bash
./scripts/module install ios-xq-finance-app
./scripts/module build ios-xq-finance-app
./scripts/module test ios-xq-finance-app
```

The install step runs `npm install`, `bundle exec pod install`, and
`npm run bundle:ios`. Build and test must use the `.xcworkspace`, not the raw
`.xcodeproj`.

After JavaScript changes, either:

```bash
cd modules/ios-xq-finance-app
npm run bundle:ios
```

or run Metro for live reload:

```bash
cd modules/ios-xq-finance-app
npm start
```

The native host prefers an embedded `main.jsbundle` when present, then falls
back to Metro in Debug builds.

## Preferred Device Workflow

This module is validated on a plugged-in physical iPhone. Use the device ID you
see from `xcrun xctrace list devices` or `xcodebuild -showdestinations`.

List connected devices:

```bash
xcrun xctrace list devices
```

Show destinations known to Xcode:

```bash
xcodebuild \
  -workspace modules/ios-xq-finance-app/ios-xq-finance-app.xcworkspace \
  -scheme ios-xq-finance-app \
  -showdestinations
```

Run tests on the plugged-in iPhone:

```bash
xcodebuild \
  -workspace modules/ios-xq-finance-app/ios-xq-finance-app.xcworkspace \
  -scheme ios-xq-finance-app \
  -destination "platform=iOS,id=<device-id>" \
  test
```

## Physical Device Reinstall Persistence

Run the reinstall persistence smoke test on the verified physical iPhone:

```bash
modules/ios-xq-finance-app/scripts/verify-device-reinstall-persistence.sh
```

To target a different plugged-in device:

```bash
IOS_DEVICE_ID=<device-id> \
  modules/ios-xq-finance-app/scripts/verify-device-reinstall-persistence.sh
```

The script builds the Debug app, installs it on the device, launches it with a
debug-only smoke command that backs up the current portfolio and seeds a
temporary marker, installs the same app again without uninstalling, then
launches a verify command that asserts the marker survived and restores the
original portfolio.

This proves update-style reinstalls with the same bundle ID and signing identity
do not wipe the app's local persisted portfolio. It intentionally does not
uninstall the app; uninstalling removes the app container, and recovery then
depends on the Keychain fallback path.

## Isolated UI Journey

Install `xcbeautify 3.2.1`, archive and export the app with the commands at the
end of this file, then run the consumer-owned lifecycle suite through the local
framework package:

```bash
XQ_FINANCE_IPA="$PWD/modules/ios-xq-finance-app/build/ipa/ios-xq-finance-app.ipa" \
swift run --package-path modules/xq-ios-ui-test-framework xq-ui-test run \
  --config modules/ios-xq-finance-app/xq-ui-tests.json \
  --device <device-id> \
  --suite ios-xq-finance-appUITests/PortfolioLifecycleTests
```

The suite uses `--xq-ui-testing` and `--xq-ui-testing-reset`. Its Application
Support directory and Keychain service are distinct from normal app storage,
and reset removes only that UI-test namespace. Results are written beneath
`modules/ios-xq-finance-app/build/ui-test-results/` as `result.xcresult`,
`junit.xml`, raw logs, metadata, and retained screenshots inside XCResult.

## Signing Requirements

Physical-device builds require both the app and test target to be signed.

Confirmed signing during the last physical-device test run:

- Signing identity: `Apple Development: chauhaidang1@gmail.com (Y57FXM29C3)`
- Provisioning profile: `iOS Team Provisioning Profile: com.xq.finance.ios-xq-finance-app`
- Team identifier: `T99X93V7Y2`

If physical-device testing fails before launching tests, check:

- The iPhone is unlocked and trusted by the Mac.
- Developer Mode is enabled on the iPhone.
- The app target has a valid development team and provisioning profile.
- The test target is also signed.
- The selected destination ID matches the connected device.

Use `-allowProvisioningUpdates` on archive and export commands. This lets
`xcodebuild` refresh automatic signing assets from the CLI instead of relying on
Xcode.app to reopen and repair stale local provisioning profile state.

## Known Non-Blocking Warning

Physical-device validation currently emits this warning:

```text
All interface orientations must be supported unless the app requires full screen.
```

The warning did not block the physical-device XCTest run.

## Archive, Export, And Install

Archive and export produce a signed IPA under `build/ipa/`. The `-exportPath`
argument is the **output directory**; the installable artifact is the `.ipa`
file inside it, not the directory itself.

```bash
xcodebuild \
  -workspace modules/ios-xq-finance-app/ios-xq-finance-app.xcworkspace \
  -scheme ios-xq-finance-app \
  -destination "generic/platform=iOS" \
  -configuration Release \
  -archivePath modules/ios-xq-finance-app/build/ios-xq-finance-app.xcarchive \
  -allowProvisioningUpdates \
  archive
```

```bash
xcodebuild \
  -exportArchive \
  -archivePath modules/ios-xq-finance-app/build/ios-xq-finance-app.xcarchive \
  -exportPath modules/ios-xq-finance-app/build/ipa \
  -exportOptionsPlist modules/ios-xq-finance-app/exportOptions.plist \
  -allowProvisioningUpdates
```

After export, `build/ipa/` also contains Xcode metadata (`ExportOptions.plist`,
`DistributionSummary.plist`, `Packaging.log`). Those files are not installable.

Install the IPA on a plugged-in iPhone with `devicectl` (preferred):

```bash
IPA="$PWD/modules/ios-xq-finance-app/build/ipa/ios-xq-finance-app.ipa"

xcrun devicectl device install app \
  --device <device-id> \
  "$IPA"
```

Or with `ios-deploy` — pass the **`.ipa` file**, not the export directory:

```bash
IPA="$PWD/modules/ios-xq-finance-app/build/ipa/ios-xq-finance-app.ipa"

ios-deploy -b "$IPA" -d <device-id>
```

Pointing `ios-deploy -b` at `build/ipa/` copies export metadata instead of the
app bundle and fails with:

```text
Error 0xe8000067: There was an internal API error. AMDeviceSecureInstallApplication(...)
```

If `ios-deploy` warns about a missing `DeveloperDiskImage` for your iOS version,
installation can still succeed; only debug attach and console logging are
affected. Update Xcode so device support is available for that OS version.
