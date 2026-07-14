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
