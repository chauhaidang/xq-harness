# iOS XQ Finance Build And Test Workflow

This module is a SwiftUI iOS app with an XCTest bundle.

## Module Basics

- Module: `ios-xq-finance-app`
- Project: `modules/ios-xq-finance-app/ios-xq-finance-app.xcodeproj`
- Scheme: `ios-xq-finance-app`
- App bundle ID: `com.xq.finance.ios-xq-finance-app`
- Test bundle ID: `com.xq.finance.ios-xq-finance-appTests`
- Minimum iOS deployment target: `17.0`

## Preferred Harness Commands

From the repository root:

```bash
./scripts/module build ios-xq-finance-app
./scripts/module test ios-xq-finance-app
```

The module build command targets the configured iOS Simulator destination from
`modules.yaml`. The test command runs the XCTest bundle on that simulator.

## Direct Simulator Commands

Use these when you need raw Xcode output or want to bypass the module wrapper.

```bash
xcodebuild \
  -project modules/ios-xq-finance-app/ios-xq-finance-app.xcodeproj \
  -scheme ios-xq-finance-app \
  -destination "platform=iOS Simulator,name=iPhone 16" \
  build
```

```bash
xcodebuild \
  -project modules/ios-xq-finance-app/ios-xq-finance-app.xcodeproj \
  -scheme ios-xq-finance-app \
  -destination "platform=iOS Simulator,name=iPhone 16" \
  test
```

## Physical Device Testing

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

Run tests on the verified physical iPhone:

```bash
xcodebuild \
  -project modules/ios-xq-finance-app/ios-xq-finance-app.xcodeproj \
  -scheme ios-xq-finance-app \
  -destination "platform=iOS,id=00008101-000E548E34F0001E" \
  test
```

Last verified physical device:

- Name: `iPhone`
- ID: `00008101-000E548E34F0001E`
- Result: 5 XCTest cases, 0 failures

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

## Known Non-Blocking Warning

Physical-device validation currently emits this warning:

```text
All interface orientations must be supported unless the app requires full screen.
```

The warning did not block the physical-device XCTest run.

## Screenshot Capture

For simulator screenshots, install and launch the simulator app, then capture:

```bash
xcrun simctl install 61112FCA-8781-4A4C-AB6C-42007DDF483B \
  modules/ios-xq-finance-app/build/Products/Debug-iphonesimulator/ios-xq-finance-app.app

xcrun simctl launch 61112FCA-8781-4A4C-AB6C-42007DDF483B \
  com.xq.finance.ios-xq-finance-app

xcrun simctl io 61112FCA-8781-4A4C-AB6C-42007DDF483B screenshot \
  /private/tmp/xq-finance-screenshot.png
```

Verified simulator:

- Name: `iPhone 16`
- OS: `18.3.1`
- ID: `61112FCA-8781-4A4C-AB6C-42007DDF483B`
