# iOS XQ Fitness Build And Test Workflow

Shared contract: [iOS native app test strategy](../../docs/product/ios-native-app-test-strategy.md).

This module is a native SwiftUI iPhone app with **unit** tests in host-testable `FitnessCore` and **UI** tests in `AppUITests`.

## Module Basics

- Module: `ios-xq-fitness-app`
- Unit: `FitnessCore` SwiftPM package (`swift test --package-path FitnessCore`)
- App scheme (build): `ios-xq-fitness-app`
- UI scheme: `ios-xq-fitness-app-ui-tests` → `ios-xq-fitness-appUITests`
- App bundle ID: `com.xq.fitness.ios-xq-fitness-app`
- UI-test bundle ID: `com.xq.fitness.ios-xq-fitness-appUITests`

## Unit (CI + local)

```bash
./scripts/module ci ios-xq-fitness-app
```

CI performs only:

1. An unsigned generic iOS build of the app.
2. Host-side unit tests for `FitnessCore`.

## UI (Simulator)

UI tests never run in CI. Supported path is the iPhone 16 Simulator (no signing):

```bash
modules/ios-xq-fitness-app/scripts/run-ui-tests.sh
```

Optional: `IOS_SIMULATOR_NAME='iPhone 16 Pro'`.

The suite uses `--xq-ui-testing` and `--xq-ui-testing-reset`, so it stores data under `XQFitnessUITests` and cannot reset normal application data. Each run retains a timestamped XCResult beneath `build/ui-test-results/`. Shared `FitnessUITestCase` setup performs that reset and requires the empty routine state before every test body. Persistence checks use an explicit relaunch helper that preserves data only within the current journey.

The module has no API, containers, or hosted services.

## Tech debt: physical device

Physical-device UI and signed IPA install are deferred. Scripts still exist:

```bash
modules/ios-xq-fitness-app/scripts/run-device-ui-tests.sh
IOS_PROVISIONING_DEVICE_ID=<hardware-udid> \
modules/ios-xq-fitness-app/scripts/build-device-ipa.sh
```

Those require a trusted iPhone, `DEVELOPMENT_TEAM` (default `T99X93V7Y2`), and valid Apple Development signing. Do not treat them as the UI gate.
