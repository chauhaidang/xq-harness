# iOS XQ Fitness Build And Test Workflow

This module is a native SwiftUI iPhone app with a host-testable `FitnessCore`
package. Simulator workflows are intentionally out of scope.

## Module Basics

- App scheme: `ios-xq-fitness-app`
- Physical-device UI-test scheme: `ios-xq-fitness-app-ui-tests`
- App bundle ID: `com.xq.fitness.ios-xq-fitness-app`
- UI-test bundle ID: `com.xq.fitness.ios-xq-fitness-appUITests`

## CI Boundary

CI performs only:

1. An unsigned generic iOS build of the app.
2. Host-side unit tests for `FitnessCore`.

Run both through the module registry:

```bash
./scripts/module ci ios-xq-fitness-app
```

## Dedicated Device E2E

Physical-device UI tests remain local-only and never run in CI. Find the paired,
available iPhone and run every fitness journey with environment-supplied values:

```bash
xcrun devicectl list devices
IOS_DEVICE_ID=<device-udid> \
DEVELOPMENT_TEAM=<team-id> \
modules/ios-xq-fitness-app/scripts/run-device-ui-tests.sh
```

The suite uses `--xq-ui-testing` and `--xq-ui-testing-reset`, so it stores data
under `XQFitnessUITests` and cannot reset normal application data. Each run
retains a timestamped XCResult beneath `build/ui-test-results/`.
Shared `FitnessUITestCase` setup performs that reset and requires the empty
routine state before every test body. Persistence checks use an explicit
relaunch helper that preserves data only within the current journey.

The current suite contains seven physical-device journeys, including persistent
exercise-input labels, exercise swipe deletion, and the full
seven-day exercise drill-down and a three-capture immediate-previous comparison
that is rechecked after relaunch. Coverage ownership and open gaps are tracked
in `../../docs/product/ios-xq-fitness-app-test-coverage.md`.
The module has no API, containers, hosted services, or simulator gate.

## Signed IPA deployment

To archive, export, validate, install, and launch the app on the paired
physical device:

```bash
IOS_PROVISIONING_DEVICE_ID=<David-hardware-udid> \
modules/ios-xq-fitness-app/scripts/build-device-ipa.sh
```

The command defaults to hardware device `00008150-0012058A14F8401C`. Set
`INSTALL_TO_DEVICE=0` for an IPA-only export or set `IOS_DEVICE_ID` to another
hardware UDID/CoreDevice identifier. `IOS_PROVISIONING_DEVICE_ID` defaults to
the target ID and must be registered in the development profile. The script
defaults to working team `T99X93V7Y2`; provide `DEVELOPMENT_TEAM` to override
it. It uses the checked-in Xcode project directly and never runs `xcodegen`.
This is a local-only workflow; CI remains unsigned.
