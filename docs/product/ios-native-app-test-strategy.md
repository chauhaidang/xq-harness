# iOS native app test strategy

Applies to `ios-xq-finance-app` and `ios-xq-fitness-app`.

Latest Simulator gate evidence: [TSR 2026-07-26](./evidence/ios-native-app-tsr-2026-07-26/TSR.md).

## Layers

| Layer | What it proves | Where it runs | Module command |
| --- | --- | --- | --- |
| **Unit** | Domain and persistence behavior without UI automation | CI and local host/simulator destinations owned by each module | `./scripts/module test <module>` (also part of `./scripts/module ci <module>`) |
| **UI** | End-to-end journeys with isolated storage | Local iOS Simulator — never CI | Module `scripts/run-ui-tests.sh` / UI-test Xcode scheme |

Both modules keep `test_all: false`. Path-scoped GitHub Actions workflows run only the unit/build CI boundary.

## Unit

- Finance: XCTest target `ios-xq-finance-appTests` via scheme `ios-xq-finance-app` (`AppTests/`).
- Fitness: SwiftPM package tests in `FitnessCore` (`swift test --package-path FitnessCore`).
- Unit suites must not launch XCUITest journeys.
- Prefer in-memory or temporary storage seams; never touch the UI-test namespace.

## UI

- Separate scheme: `<module>-ui-tests`.
- Launch with `--xq-ui-testing` and `--xq-ui-testing-reset` so Application Support / Keychain (or equivalent) is isolated from normal app data.
- Reset clears only the UI-test namespace; production/local app data is off-limits.
- Screen objects live under `AppUITests/`; shared launch helpers under `UITestSupport.swift` / `TestApplication.swift`.
- Retain XCResult under `build/ui-test-results/`.
- Default destination is iPhone 16 Simulator. Override with `IOS_SIMULATOR_NAME`.
- No Apple Development Team or device UDID is required for the Simulator path.

## CI boundary

Each module workflow on `macos-15` with Xcode 16:

1. Unsigned or simulator-safe **build** as registered in `modules.yaml`.
2. **Unit** tests only.

Do not run UI schemes, install device secrets, or archive/export IPAs in CI.

## Local Simulator UI

```bash
modules/<module>/scripts/run-ui-tests.sh
```

Optional: `IOS_SIMULATOR_NAME='iPhone 16 Pro'`.

## Tech debt: physical-device UI

Physical-device UI, signing, and plugged-in UDID resolution are deferred:

- `scripts/run-device-ui-tests.sh` (per module)
- `scripts/ios-plugged-iphone-udid.sh`
- Device IPA / reinstall-persistence helpers documented in each module’s `BUILD_AND_TEST.md`

Do not treat those as the supported UI gate.

## XCUITest coverage matrix

### `ios-xq-finance-app`

| Journey | File |
| --- | --- |
| Full portfolio lifecycle + currency + deduct + relaunch | `PortfolioLifecycleTests` |
| Currency toggle edge hit targets | `CurrencyToggleHitTargetTests` |
| Add-asset validation / cancel / VND native asset | `AddAssetValidationTests` |
| Price & buy-lot validation / cancel | `SheetValidationTests` |
| Deduction dialog cancel | `DeductionDialogTests` |
| Exchange-rate update, cancel, persistence | `ExchangeRateTests` |
| Multi-asset deck swipe + isolated reset | `MultiAssetDeckTests` |

### `ios-xq-fitness-app`

| Journey | File |
| --- | --- |
| Routine create / notes / relaunch | `RoutineLifecycleTests` |
| Routine editor validation / cancel | `RoutineEditorValidationTests` |
| Multi-routine list + isolated reset | `RoutineListTests` |
| Seven-day drill-down, progress, delete, labels | `SevenDaySnapshotTests` |
| Exercise editor validation / cancel | `ExerciseEditorValidationTests` |
| Multi-day exercises + sets update | `MultiDayExerciseTests` |
| Maintained progress on unchanged snapshot | `SnapshotMaintainedProgressTests` |
