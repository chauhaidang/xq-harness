# iOS XQ Fitness App

Native SwiftUI fitness application for iPhone. The current product is
offline-only: routines, seven-day training plans, exercises, and the newest two
progress snapshots are stored locally as versioned JSON. The imported Expo app
is a frozen behavior reference, not a runtime dependency.

## Architecture

- SwiftUI with MVVM-style editor state and a router-owned `NavigationStack`.
- `FitnessStore` owns domain mutations and observable snapshot state.
- `FitnessPersisting` is the storage seam; production uses atomic local JSON
  with recovery and host tests use an in-memory adapter.
- No API, authentication, analytics, container, or simulator workflow exists
  in this module.

## Build and unit test

From the repository root:

```bash
./scripts/module ci ios-xq-fitness-app
```

CI runs only an unsigned `generic/platform=iOS` build and the host-side
`FitnessCore` unit suite.

## Physical-device UI tests

UI tests are local-only and require the paired iPhone plus an Apple development
team supplied through environment variables:

```bash
IOS_DEVICE_ID=<device-udid> \
DEVELOPMENT_TEAM=<team-id> \
modules/ios-xq-fitness-app/scripts/run-device-ui-tests.sh
```

Every UI test resets and verifies an isolated `XQFitnessUITests` store before
its test body. Normal app data is never reset. No device identifier, team ID,
or signing credential is committed.

See [BUILD_AND_TEST.md](BUILD_AND_TEST.md) for the complete workflow and
[../../docs/product/ios-xq-fitness-app-test-coverage.md](../../docs/product/ios-xq-fitness-app-test-coverage.md)
for the component-by-capability coverage matrix.

## Build and deploy an IPA

With the iPhone connected, unlocked, and trusted, use the working Apple
development team `T99X93V7Y2` or override it with `DEVELOPMENT_TEAM`. The
script does not regenerate the Xcode project; it defaults to device
`00008150-0012058A14F8401C`, installs the IPA,
and launches the app:

```bash
IOS_PROVISIONING_DEVICE_ID=<David-hardware-udid> \
modules/ios-xq-fitness-app/scripts/build-device-ipa.sh
```

`DEVELOPMENT_TEAM` defaults to `T99X93V7Y2` and can be overridden. The script
uses the checked-in Xcode project directly. `IOS_DEVICE_ID` defaults to the requested hardware UDID and can be
overridden with a CoreDevice identifier; `IOS_PROVISIONING_DEVICE_ID` defaults
to `IOS_DEVICE_ID` and must be registered in the development profile. Use
`INSTALL_TO_DEVICE=0` to export only. Automatic signing requires the Apple
account to be available in Xcode and `-allowProvisioningUpdates` may prompt
for access.
