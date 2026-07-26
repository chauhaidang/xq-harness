# iOS XQ Finance Build And Test Workflow

Shared contract: [iOS native app test strategy](../../docs/product/ios-native-app-test-strategy.md).

This module is a SwiftUI iOS app with **unit** (`AppTests`) and **UI** (`AppUITests`) layers.

## Module Basics

- Module: `ios-xq-finance-app`
- Project: `ios-xq-finance-app.xcodeproj`
- Unit scheme: `ios-xq-finance-app` → `ios-xq-finance-appTests`
- UI scheme: `ios-xq-finance-app-ui-tests` → `ios-xq-finance-appUITests`
- App bundle ID: `com.xq.finance.ios-xq-finance-app`
- Minimum iOS deployment target: `17.0`

## Unit (CI + local)

```bash
./scripts/module ci ios-xq-finance-app
```

Or only the unit suite:

```bash
./scripts/module test ios-xq-finance-app
```

`modules.yaml` runs `xcodebuild … -scheme ios-xq-finance-app test` on the iPhone 16 Simulator. That scheme includes `AppTests` only — not UI journeys.

## UI (Simulator)

UI tests never run in CI. Supported path is the iPhone 16 Simulator (no signing):

```bash
modules/ios-xq-finance-app/scripts/run-ui-tests.sh
```

Optional: `IOS_SIMULATOR_NAME='iPhone 16 Pro'`.

The suite uses `--xq-ui-testing` and `--xq-ui-testing-reset`. Its Application Support directory and Keychain service are distinct from normal app storage; reset removes only that UI-test namespace. XCResults land under `build/ui-test-results/`.

## Tech debt: physical device

Physical-device UI, reinstall persistence, and IPA flows are deferred. Scripts still exist:

```bash
modules/ios-xq-finance-app/scripts/run-device-ui-tests.sh
modules/ios-xq-finance-app/scripts/verify-device-reinstall-persistence.sh
./scripts/archive-ipa.sh
```

Those require a trusted iPhone, `DEVELOPMENT_TEAM` (default `T99X93V7Y2`), and valid Apple Development signing. Do not treat them as the UI gate.
