# iOS XQ Finance Build And Test Workflow

This module is a SwiftUI iOS app with an XCTest bundle.

## Module Basics

- Module: `ios-xq-finance-app`
- Project: `modules/ios-xq-finance-app/ios-xq-finance-app.xcodeproj`
- Scheme: `ios-xq-finance-app`
- App bundle ID: `com.xq.finance.ios-xq-finance-app`
- Test bundle ID: `com.xq.finance.ios-xq-finance-appTests`
- UI-test scheme: `ios-xq-finance-app-ui-tests`
- UI-test configuration: `modules/ios-xq-finance-app/xq-ui-tests.json`
- Minimum iOS deployment target: `17.0`

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
  -project modules/ios-xq-finance-app/ios-xq-finance-app.xcodeproj \
  -scheme ios-xq-finance-app \
  -showdestinations
```

Run tests on the plugged-in iPhone:

```bash
xcodebuild \
  -project modules/ios-xq-finance-app/ios-xq-finance-app.xcodeproj \
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

## Useful commands:
```bash
xcodebuild \
  -project modules/ios-xq-finance-app/ios-xq-finance-app.xcodeproj \
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
